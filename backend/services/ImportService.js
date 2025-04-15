const multer = require("multer");
const csv = require("csv-parser");
const unzipper = require("unzipper");
const { pool } = require("../db.js");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream").promises;
const { exec } = require("child_process");

class ImportService {
  constructor() {
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, "../uploads");
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

    this.batchSize = 5000;
    this.tableOrder = [
      "agency",
      "calendar",
      "stops",
      "routes",
      "shapes",
      "trips",
      "stop_times",
    ];
    this.independentTables = [
      "agency",
      "calendar",
      "stops",
      "routes",
      "shapes",
    ];
    this.dependentTables = ["trips", "stop_times"];
    this.tempDir = path.join(__dirname, "../temp");
  }

  async insertImportedData(userId, fileName) {
    try {
      console.log("📝 Importing metadata for user:", userId, "file:", fileName);
      const [result] = await pool.execute(
        "INSERT INTO projects (user_id, file_name, import_date) VALUES (?, ?, NOW())",
        [userId, fileName]
      );
      console.log("✅ Metadata inserted - ID:", result.insertId);
      return result.insertId;
    } catch (error) {
      console.error("❌ Error inserting metadata:", error.message);
      throw error;
    }
  }

  async updateValidationData(projectId, validationData) {
    try {
      console.log(
        "📝 Attempting to update validation data for project:",
        projectId
      );
      console.log("Validation data to write:", JSON.stringify(validationData));
      await pool.execute(
        "UPDATE projects SET validation_data = ? WHERE project_id = ?",
        [JSON.stringify(validationData), projectId]
      );
      console.log(
        "✅ Validation data successfully updated for project:",
        projectId
      );
    } catch (error) {
      console.error("❌ Failed to update validation data:", error.message);
      throw error;
    }
  }

  async getTableColumns(tableName) {
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
  }

  async processBatch(tableName, batch) {
    if (batch.length === 0) return;

    const validColumns = await this.getTableColumns(tableName);
    const columns = Object.keys(batch[0]).filter((col) =>
      validColumns.has(col)
    );

    if (columns.length === 0) {
      console.log(`⚠️ No valid columns found for ${tableName}, skipping batch`);
      return;
    }

    const placeholders = columns.map(() => "?").join(",");
    const updatableColumns = columns.filter(
      (col) => col !== "user_id" && col !== "project_id"
    );
    let sql = `INSERT IGNORE INTO ${tableName} (${columns.join(",")}) VALUES ?`;
    if (updatableColumns.length > 0) {
      const updateClause = updatableColumns
        .map((col) => `${col} = VALUES(${col})`)
        .join(",");
      sql += ` ON DUPLICATE KEY UPDATE ${updateClause}`;
    }

    const values = batch.map((row) => columns.map((col) => row[col]));

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(sql, [values]);

      let retries = 3;
      while (retries > 0) {
        try {
          await connection.commit();
          break;
        } catch (error) {
          if (error.code === "ER_NO_REFERENCED_ROW_2") {
            const [fk] = await connection.query(
              `
              SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
              FROM information_schema.KEY_COLUMN_USAGE
              WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = ?
              AND REFERENCED_TABLE_NAME IS NOT NULL
              LIMIT 1
            `,
              [tableName]
            );
            if (fk) {
              const missingRefs = new Set();
              batch.forEach((row) => {
                if (
                  row[fk.COLUMN_NAME] &&
                  !missingRefs.has(row[fk.COLUMN_NAME])
                ) {
                  missingRefs.add(row[fk.COLUMN_NAME]);
                }
              });
              const refValues = Array.from(missingRefs).map((ref) => [
                ref,
                batch[0].user_id,
                batch[0].project_id,
              ]);
              await connection.query(
                `INSERT IGNORE INTO ${fk.REFERENCED_TABLE_NAME} (${fk.REFERENCED_COLUMN_NAME}, user_id, project_id) VALUES ?`,
                [refValues]
              );
              await connection.query(sql, [values]);
            }
          } else if (error.code === "ECONNRESET" && retries > 0) {
            console.warn(
              `⚠️ Connection reset, retrying (${retries} attempts left)`
            );
            retries--;
            await new Promise((res) => setTimeout(res, 1000));
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      await connection.rollback();
      console.error(`❌ Batch import error for ${tableName}:`, error.message);
      throw error;
    } finally {
      connection.release();
    }
  }

  async processTable(tableName, filePath, userId, projectId) {
    console.log(`📥 Importing ${tableName}.txt (${tableName})...`);
    let batch = [];

    try {
      await pipeline(
        fs.createReadStream(filePath),
        csv(),
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
              await this.processBatch(tableName, batch);
              batch = [];
            }
          }
          if (batch.length > 0) {
            await this.processBatch(tableName, batch);
          }
        }.bind(this)
      );
      console.log(`✅ Import completed for ${tableName}`);
    } catch (error) {
      console.error(`❌ Error processing ${tableName}:`, error.message);
      throw error;
    }
  }

  async validateGTFS(filePath) {
    return new Promise((resolve, reject) => {
      const validatorPath = path.join(
        __dirname,
        "..",
        "gtfs-validator-7.0.0-cli.jar"
      );
      console.log("Validator Path:", validatorPath);
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
          console.error("❌ GTFS Validation Error:", stderr);
        } else {
          console.log("✅ GTFS Validation completed");
        }

        const reportPath = path.join(outputDir, "report.json");
        if (!fs.existsSync(reportPath)) {
          console.error("❌ Validation report not found at:", reportPath);
          reject(new Error("Validation report not found"));
          return;
        }

        let validationResult;
        try {
          validationResult = JSON.parse(fs.readFileSync(reportPath, "utf8"));
        } catch (parseError) {
          console.error(
            "❌ Error parsing validation report:",
            parseError.message
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
        `📤 Import request received from user: ${userId}, mode: ${importMode}, forceImport: ${forceImport}`
      );

      if (!req.file) {
        console.log("⚠️ No file uploaded");
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log("📁 Processing file:", req.file.filename);
      const zipPath = path.join(__dirname, "../uploads", req.file.filename);

      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }
      await fs
        .createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: this.tempDir }))
        .promise();
      console.log("✅ ZIP extraction complete");

      console.log("🔍 Validating GTFS data...");
      let validationResult;
      try {
        validationResult = await this.validateGTFS(zipPath);
      } catch (error) {
        console.error("❌ Critical validation error:", error.message);
        return res.status(500).json({
          message: "Validation failed critically",
          success: false,
        });
      }

      const { success, errors, warnings } = validationResult;
      console.log("📜 Validation result processed:", {
        success,
        errors,
        warnings,
      });

      const validationData = {
        success,
        errors,
        warnings,
      };

      if (!success && !forceImport) {
        console.log("⚠️ Validation failed, waiting for user action");
        fs.rm(this.tempDir, { recursive: true, force: true }, (err) => {
          if (err) console.error("⚠️ Error cleaning temp directory:", err);
          else console.log("🧹 Temporary directory cleaned");
        });
        fs.unlink(zipPath, (err) => {
          if (err) console.error("⚠️ Error deleting ZIP file:", err);
          else console.log("🧹 ZIP file deleted");
        });
        return res.status(200).json({
          success: false,
          actionRequired: true,
          errors,
          warnings,
          message: "GTFS data contains validation errors. Continue anyway?",
        });
      }

      const projectId = await this.insertImportedData(
        userId,
        req.file.originalname
      );
      await this.updateValidationData(projectId, validationData);

      console.log(
        `🚀 Starting ${importMode} file imports with projectId:`,
        projectId
      );

      const importTable = async (tableName) => {
        const filePath = path.join(this.tempDir, `${tableName}.txt`);
        if (!fs.existsSync(filePath)) {
          console.log(`⚠️ ${tableName}.txt not found in ZIP, skipping`);
          return;
        }
        await this.processTable(tableName, filePath, userId, projectId);
      };

      if (importMode === "sequential") {
        for (const tableName of this.tableOrder) {
          await importTable(tableName);
        }
      } else {
        const allPromises = this.tableOrder.map((tableName) =>
          importTable(tableName)
        );
        await Promise.all(allPromises);
        console.log("✅ All tables imported in parallel");
      }

      fs.rm(this.tempDir, { recursive: true, force: true }, (err) => {
        if (err) console.error("⚠️ Error cleaning temp directory:", err);
        else console.log("🧹 Temporary directory cleaned");
      });
      fs.unlink(zipPath, (err) => {
        if (err) console.error("⚠️ Error deleting ZIP file:", err);
        else console.log("🧹 ZIP file deleted");
      });

      console.log(`🎉 ${importMode} import process completed`);
      return res.status(200).json({
        message: "GTFS data import completed",
        success: true,
        projectId,
        validationResult,
      });
    } catch (error) {
      console.error("❌ GTFS Import Error:", error.message);
      return res.status(500).json({
        message: error.message || "Error importing GTFS data",
        success: false,
      });
    }
  }
}

module.exports = new ImportService();
