const multer = require("multer");
const csv = require("fast-csv");
const AdmZip = require("adm-zip");
const { pool } = require("../db.js");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream").promises;
const { exec } = require("child_process");
const { initializeTables } = require("../initTables.js");

class ImportService {
  constructor() {
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, "../Uploads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    });

    this.upload = multer({
      storage: this.storage,
      fileFilter: (req, file, cb) => {
        if (!file.originalname.toLowerCase().endsWith(".zip")) {
          return cb(new Error("Only .zip files are allowed"));
        }
        cb(null, true);
      },
    });

    this.batchSize = 3000;
    this.tableOrder = [
      "agency",
      "calendar",
      "stops",
      "routes",
      "shapes",
      "fare_attributes",
      "fare_media",
      "rider_categories",
      "fare_products",
      "timeframes",
      "networks",
      "areas",
      "trips",
      "stop_times",
      "fare_rules",
      "route_networks",
      "stop_areas",
      "fare_leg_rules",
      "fare_transfer_rules",
      "fare_leg_join_rules",
    ];
    this.mandatoryTables = [
      "agency",
      "calendar",
      "stops",
      "routes",
      "trips",
      "stop_times",
    ];
    this.independentTables = [
      "agency",
      "calendar",
      "stops",
      "routes",
      "shapes",
      "fare_attributes",
      "fare_media",
      "rider_categories",
      "fare_products",
      "timeframes",
      "networks",
      "areas",
    ];
    this.dependentTables = [
      "trips",
      "stop_times",
      "fare_rules",
      "route_networks",
      "stop_areas",
      "fare_leg_rules",
      "fare_transfer_rules",
      "fare_leg_join_rules",
    ];
    this.tempDir = path.join(__dirname, "../temp");
    this.importReport = {
      successful: [],
      failed: [],
      totalRows: 0,
      columnIssues: [],
      skippedRows: [],
    };
  }

  async insertImportedData(userId, fileName) {
    try {
      console.log(
        `📝 Importing metadata for user: ${userId}, file: ${fileName}`
      );
      const [result] = await pool.execute(
        "INSERT INTO projects (user_id, file_name, import_date) VALUES (?, ?, NOW())",
        [userId, fileName]
      );
      console.log(`✅ Metadata inserted - ID: ${result.insertId}`);
      return result.insertId;
    } catch (error) {
      console.error(`❌ Error inserting metadata: ${error.message}`);
      throw error;
    }
  }

  async updateValidationData(projectId, validationData) {
    try {
      console.log(`📝 Updating validation data for project: ${projectId}`);
      await pool.execute(
        "UPDATE projects SET validation_data = ? WHERE project_id = ?",
        [JSON.stringify(validationData), projectId]
      );
      console.log(`✅ Validation data updated for project: ${projectId}`);
    } catch (error) {
      console.error(`❌ Failed to update validation data: ${error.message}`);
      throw error;
    }
  }

  async getTableColumns(tableName) {
    try {
      const [columns] = await pool.query(
        `
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      `,
        [tableName]
      );
      return new Set(columns.map((col) => col.COLUMN_NAME));
    } catch (error) {
      console.error(
        `❌ Error fetching columns for ${tableName}: ${error.message}`
      );
      return new Set();
    }
  }

  async checkForeignKey(
    tableName,
    columnName,
    value,
    referencedTable,
    referencedColumn,
    userId,
    projectId
  ) {
    if (!value) return true; // NULL değerler geçerli
    try {
      const [rows] = await pool.query(
        `SELECT 1 FROM ${referencedTable} WHERE ${referencedColumn} = ? AND project_id = ?`,
        [value, projectId]
      );
      return rows.length > 0;
    } catch (error) {
      console.error(
        `❌ Error checking foreign key for ${tableName}.${columnName}: ${error.message}`
      );
      return false;
    }
  }

  async processBatch(tableName, batch) {
    if (batch.length === 0) return 0;

    const validColumns = await this.getTableColumns(tableName);
    const inputColumns = Object.keys(batch[0]).filter(
      (col) => col !== "user_id" && col !== "project_id"
    );
    let columns = inputColumns.filter((col) => validColumns.has(col));
    if (validColumns.has("user_id")) columns.push("user_id");
    if (validColumns.has("project_id")) columns.push("project_id");
    columns = [...new Set(columns)];

    const invalidColumns = inputColumns.filter((col) => !validColumns.has(col));
    if (invalidColumns.length > 0) {
      console.log(
        `⚠️ Ignoring invalid columns for ${tableName}: ${invalidColumns.join(
          ", "
        )}`
      );
      this.importReport.columnIssues.push({
        table: tableName,
        invalidColumns,
        validColumns: columns,
      });
    }

    if (columns.length === 0) {
      console.warn(
        `❌ No valid columns for ${tableName}. Input columns: ${inputColumns.join(
          ", "
        )}, Expected: ${[...validColumns].join(", ")}`
      );
      this.importReport.failed.push({
        table: tableName,
        reason: `No valid columns found. Input: ${inputColumns.join(", ")}`,
      });
      return 0;
    }

    // Yabancı anahtar bağımlılıkları
    const foreignKeys = {
      routes: [
        { column: "agency_id", table: "agency", refColumn: "agency_id" },
        {
          column: "network_id",
          table: "route_networks",
          refColumn: "network_id",
        },
      ],
      trips: [
        { column: "route_id", table: "routes", refColumn: "route_id" },
        { column: "service_id", table: "calendar", refColumn: "service_id" },
      ],
      stop_times: [
        { column: "trip_id", table: "trips", refColumn: "trip_id" },
        { column: "stop_id", table: "stops", refColumn: "stop_id" },
      ],
      fare_rules: [
        { column: "fare_id", table: "fare_attributes", refColumn: "fare_id" },
        { column: "route_id", table: "routes", refColumn: "route_id" },
        { column: "origin_id", table: "stops", refColumn: "stop_id" },
        { column: "destination_id", table: "stops", refColumn: "stop_id" },
        { column: "contains_id", table: "stops", refColumn: "stop_id" },
      ],
      fare_leg_rules: [
        { column: "network_id", table: "networks", refColumn: "network_id" },
        { column: "from_area_id", table: "areas", refColumn: "area_id" },
        { column: "to_area_id", table: "areas", refColumn: "area_id" },
        {
          column: "from_timeframe_group_id",
          table: "timeframes",
          refColumn: "timeframe_group_id",
        },
        {
          column: "to_timeframe_group_id",
          table: "timeframes",
          refColumn: "timeframe_group_id",
        },
        {
          column: "fare_product_id",
          table: "fare_products",
          refColumn: "fare_product_id",
        },
      ],
      fare_transfer_rules: [
        {
          column: "from_leg_group_id",
          table: "fare_leg_rules",
          refColumn: "leg_group_id",
        },
        {
          column: "to_leg_group_id",
          table: "fare_leg_rules",
          refColumn: "leg_group_id",
        },
        {
          column: "fare_product_id",
          table: "fare_products",
          refColumn: "fare_product_id",
        },
      ],
      fare_leg_join_rules: [
        {
          column: "from_network_id",
          table: "networks",
          refColumn: "network_id",
        },
        { column: "to_network_id", table: "networks", refColumn: "network_id" },
        { column: "from_stop_id", table: "stops", refColumn: "stop_id" },
        { column: "to_stop_id", table: "stops", refColumn: "stop_id" },
      ],
      route_networks: [
        { column: "route_id", table: "routes", refColumn: "route_id" },
        { column: "network_id", table: "networks", refColumn: "network_id" },
      ],
      stop_areas: [
        { column: "stop_id", table: "stops", refColumn: "stop_id" },
        { column: "area_id", table: "areas", refColumn: "area_id" },
      ],
      fare_products: [
        {
          column: "fare_media_id",
          table: "fare_media",
          refColumn: "fare_media_id",
        },
        {
          column: "rider_category_id",
          table: "rider_categories",
          refColumn: "rider_category_id",
        },
      ],
      timeframes: [
        { column: "service_id", table: "calendar", refColumn: "service_id" },
      ],
    };

    // Satırları işle
    const validRows = [];
    const invalidRows = [];
    for (const row of batch) {
      let isValid = true;
      const errors = [];

      // Yabancı anahtar kontrolü
      const fkChecks = foreignKeys[tableName] || [];
      for (const fk of fkChecks) {
        if (
          row[fk.column] &&
          !(await this.checkForeignKey(
            tableName,
            fk.column,
            row[fk.column],
            fk.table,
            fk.refColumn,
            row.user_id,
            row.project_id
          ))
        ) {
          console.warn(
            `⚠️ Invalid ${fk.column} = ${
              row[fk.column]
            } in ${tableName}, setting to NULL`
          );
          row[fk.column] = null;
        }
      }

      // Veri türü düzeltmeleri
      if (tableName === "routes" && row.route_type) {
        const routeType = parseInt(row.route_type, 10);
        if (isNaN(routeType) || routeType < 0 || routeType > 12) {
          console.warn(
            `⚠️ Invalid route_type = ${row.route_type} in ${tableName}, setting to 3 (bus)`
          );
          row.route_type = 3;
        }
      }
      if (tableName === "trips" && row.direction_id) {
        const directionId = parseInt(row.direction_id, 10);
        if (isNaN(directionId) || ![0, 1].includes(directionId)) {
          console.warn(
            `⚠️ Invalid direction_id = ${row.direction_id} in ${tableName}, setting to NULL`
          );
          row.direction_id = null;
        }
      }

      // Tamamen boş satır kontrolü
      const nonEmptyValues = Object.values(row).filter(
        (val) => val !== null && val !== ""
      );
      if (nonEmptyValues.length === 0) {
        isValid = false;
        errors.push("Completely empty row");
      }

      if (isValid) {
        validRows.push(row);
      } else {
        invalidRows.push({ row, errors });
      }
    }

    if (invalidRows.length > 0) {
      console.warn(
        `⚠️ ${invalidRows.length} rows skipped for ${tableName}:`,
        invalidRows.map((r) => r.errors.join("; "))
      );
      this.importReport.skippedRows.push({
        table: tableName,
        count: invalidRows.length,
        reasons: invalidRows.map((r) => r.errors),
      });
    }

    if (validRows.length === 0) {
      console.warn(`⚠️ No valid rows for ${tableName} after processing`);
      this.importReport.failed.push({
        table: tableName,
        reason: "No valid rows after processing",
      });
      return 0;
    }

    const placeholders = columns.map(() => "?").join(",");
    const updatableColumns = columns.filter(
      (col) => col !== "user_id" && col !== "project_id"
    );
    let sql = `INSERT INTO ${tableName} (${columns.join(",")}) VALUES ?`;
    if (updatableColumns.length > 0) {
      const updateClause = updatableColumns
        .map((col) => `${col} = VALUES(${col})`)
        .join(",");
      sql += ` ON DUPLICATE KEY UPDATE ${updateClause}`;
    }

    const values = validRows.map((row) =>
      columns.map((col) => row[col] || null)
    );

    const connection = await pool.getConnection();
    let affectedRows = 0;
    try {
      await connection.beginTransaction();
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      const [result] = await connection.query(sql, [values]);
      affectedRows = result.affectedRows;
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error(`❌ Batch import error for ${tableName}: ${error.message}`);
      this.importReport.failed.push({
        table: tableName,
        reason: error.message,
      });
    } finally {
      connection.release();
    }

    return affectedRows;
  }

  async processTable(tableName, filePath, userId, projectId) {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ ${tableName}.txt not found, skipping`);
      this.importReport.failed.push({
        table: tableName,
        reason: "File not found",
      });
      if (this.mandatoryTables.includes(tableName)) {
        throw new Error(`Mandatory table ${tableName} is missing`);
      }
      return;
    }

    console.log(`📥 Importing ${tableName}.txt...`);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const rowCount = fileContent.split("\n").length - 1; // Başlık satırı hariç
    console.log(`📄 ${tableName}.txt row count: ${rowCount}`);

    let batch = [];
    let totalRows = 0;

    try {
      await pipeline(
        fs.createReadStream(filePath),
        csv.parse({ headers: true, trim: true, ignoreEmpty: true }),
        async function* (source) {
          for await (const row of source) {
            Object.keys(row).forEach((key) => {
              if (row[key] === "" || row[key] === undefined) {
                row[key] = null;
              }
            });
            row.user_id = userId;
            row.project_id = projectId;

            batch.push(row);

            if (batch.length >= this.batchSize) {
              totalRows += await this.processBatch(tableName, batch);
              batch = [];
            }
          }
          if (batch.length > 0) {
            totalRows += await this.processBatch(tableName, batch);
          }
        }.bind(this)
      );
      console.log(`✅ ${tableName} imported: ${totalRows} rows`);
      if (totalRows === 0 && rowCount > 0) {
        console.warn(
          `⚠️ No rows inserted for ${tableName}, but file contains ${rowCount} rows. Check data format or column mapping.`
        );
        this.importReport.failed.push({
          table: tableName,
          reason: `No rows inserted, possible data format or column mapping issue`,
        });
      } else {
        this.importReport.successful.push({
          table: tableName,
          rows: totalRows,
          usedColumns: columns || [],
        });
        this.importReport.totalRows += totalRows;
      }
    } catch (error) {
      console.error(`❌ Error processing ${tableName}: ${error.message}`);
      this.importReport.failed.push({
        table: tableName,
        reason: error.message,
      });
    }
  }

  async validateGTFS(filePath) {
    return new Promise((resolve, reject) => {
      const validatorPath = path.join(
        __dirname,
        "..",
        "gtfs-validator-7.0.0-cli.jar"
      );
      console.log(`Validator Path: ${validatorPath}`);
      if (!fs.existsSync(validatorPath)) {
        reject(new Error(`JAR file not found at: ${validatorPath}`));
        return;
      }

      const outputDir = path.join(this.tempDir, "validation-output");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const command = `java -jar "${validatorPath}" -i "${filePath}" -o "${outputDir}"`;

      exec(command, { shell: true }, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ GTFS Validation Error: ${stderr}`);
        } else {
          console.log(`✅ GTFS Validation completed`);
        }

        const reportPath = path.join(outputDir, "report.json");
        if (!fs.existsSync(reportPath)) {
          console.error(`❌ Validation report not found at: ${reportPath}`);
          reject(new Error("Validation report not found"));
          return;
        }

        let validationResult;
        try {
          validationResult = JSON.parse(fs.readFileSync(reportPath, "utf8"));
        } catch (parseError) {
          console.error(
            `❌ Error parsing validation report: ${parseError.message}`
          );
          reject(new Error("Failed to parse validation report"));
          return;
        }

        const notices = validationResult?.notices || [];
        const errors = notices.filter((notice) => notice.severity === "ERROR");
        const warnings = notices.filter(
          (notice) => notice.severity === "WARNING"
        );

        console.log(
          `🔍 Found ${errors.length} errors and ${warnings.length} warnings`
        );

        resolve({
          success: errors.length === 0,
          errors: errors.map((notice) => ({
            code: notice.code,
            message: notice.message || "No description",
            total: notice.totalNotices,
            samples: notice.sampleNotices || [],
          })),
          warnings: warnings.map((notice) => ({
            code: notice.code,
            message: notice.message || "No description",
            total: notice.totalNotices,
            samples: notice.sampleNotices || [],
          })),
        });
      });
    });
  }

  async importGTFSData(req, res) {
    try {
      const userId = req.user.id;
      const importMode = req.body.importMode || "parallel";
      const forceImport = req.body.forceImport === "true";
      console.log(
        `📤 Import request: user: ${userId}, mode: ${importMode}, force: ${forceImport}`
      );

      if (!req.file) {
        console.log(`⚠️ No file uploaded`);
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log(`🛠️ Initializing database tables...`);
      await initializeTables();
      console.log(`✅ Database tables initialized`);

      console.log(`📁 Processing file: ${req.file.filename}`);
      const zipPath = path.join(__dirname, "../Uploads", req.file.filename);

      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(this.tempDir, true);
      console.log(`✅ ZIP extraction complete`);

      console.log(`🔍 Validating GTFS data...`);
      let validationResult;
      try {
        validationResult = await this.validateGTFS(zipPath);
      } catch (error) {
        console.error(`❌ Critical validation error: ${error.message}`);
        return res.status(500).json({
          message: "Validation failed critically",
          success: false,
        });
      }

      const { success, errors, warnings } = validationResult;
      const validationData = { success, errors, warnings };

      if (!success && !forceImport) {
        console.log(`⚠️ Validation failed, awaiting user action`);
        fs.rm(this.tempDir, { recursive: true, force: true }, (err) => {
          if (err) console.error(`⚠️ Error cleaning temp directory: ${err}`);
          else console.log(`🧹 Temporary directory cleaned`);
        });
        fs.unlink(zipPath, (err) => {
          if (err) console.error(`⚠️ Error deleting ZIP file: ${err}`);
          else console.log(`🧹 ZIP file deleted`);
        });
        return res.status(200).json({
          success: false,
          actionRequired: true,
          errors,
          warnings,
          message: "GTFS data contains errors. Continue anyway?",
        });
      }

      const projectId = await this.insertImportedData(
        userId,
        req.file.originalname
      );
      await this.updateValidationData(projectId, validationData);

      console.log(`🚀 Starting ${importMode} import, projectId: ${projectId}`);
      this.importReport = {
        successful: [],
        failed: [],
        totalRows: 0,
        columnIssues: [],
        skippedRows: [],
      };

      const importTable = async (tableName) => {
        const filePath = path.join(this.tempDir, `${tableName}.txt`);
        await this.processTable(tableName, filePath, userId, projectId);
      };

      if (importMode === "sequential") {
        for (const tableName of this.tableOrder) {
          await importTable(tableName);
        }
      } else {
        const independentPromises = this.independentTables.map(importTable);
        await Promise.all(independentPromises);
        console.log(`✅ Independent tables imported in parallel`);

        for (const tableName of this.dependentTables) {
          await importTable(tableName);
        }
        console.log(`✅ Dependent tables imported sequentially`);
      }

      fs.rm(this.tempDir, { recursive: true, force: true }, (err) => {
        if (err) console.error(`⚠️ Error cleaning temp directory: ${err}`);
        else console.log(`🧹 Temporary directory cleaned`);
      });
      fs.unlink(zipPath, (err) => {
        if (err) console.error(`⚠️ Error deleting ZIP file: ${err}`);
        else console.log(`🧹 ZIP file deleted`);
      });

      console.log(`🎉 Import completed`);
      console.log(`📊 Import Report:`);
      console.log(
        `  Successful: ${
          this.importReport.successful
            .map(
              (t) =>
                `${t.table} (${t.rows} rows, columns: ${t.usedColumns.join(
                  ", "
                )})`
            )
            .join(", ") || "None"
        }`
      );
      console.log(
        `  Failed: ${
          this.importReport.failed
            .map((t) => `${t.table} (${t.reason})`)
            .join(", ") || "None"
        }`
      );
      console.log(
        `  Column Issues: ${
          this.importReport.columnIssues
            .map((t) => `${t.table} (invalid: ${t.invalidColumns.join(", ")})`)
            .join(", ") || "None"
        }`
      );
      console.log(
        `  Skipped Rows: ${
          this.importReport.skippedRows
            .map(
              (t) =>
                `${t.table} (${t.count} rows, reasons: ${t.reasons.join("; ")})`
            )
            .join(", ") || "None"
        }`
      );
      console.log(`  Total Rows: ${this.importReport.totalRows}`);

      return res.status(200).json({
        message: "GTFS data import completed",
        success: this.importReport.failed.length === 0,
        projectId,
        validationResult,
        importReport: this.importReport,
      });
    } catch (error) {
      console.error(`❌ GTFS Import Error: ${error.message}`);
      return res.status(500).json({
        message: error.message || "Error importing GTFS data",
        success: false,
      });
    }
  }
}

module.exports = new ImportService();
