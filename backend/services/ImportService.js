const multer = require("multer");
const csv = require("csv-parser");
const unzipper = require("unzipper");
const { pool } = require("../db.js");
const { Readable } = require("stream");
const { initializeTables, tableExists } = require("../initTables.js");

class ImportService {
  constructor() {
    this.storage = multer.memoryStorage();
    this.upload = multer({
      storage: this.storage,
      fileFilter: (req, file, cb) => {
        if (!file.originalname.toLowerCase().endsWith(".zip")) {
          return cb(new Error("Only .zip files are allowed"));
        }
        cb(null, true);
      },
    });
    this.batchSize = 2000;
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
      console.error("❌ Error inserting metadata:", error);
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

    let retries = 3;
    while (retries > 0) {
      try {
        await pool.query(sql, [values]);
        break;
      } catch (error) {
        if (error.code === "ER_NO_REFERENCED_ROW_2") {
          const [fk] = await pool.query(
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
            await pool.query(
              `INSERT IGNORE INTO ${fk.REFERENCED_TABLE_NAME} (${fk.REFERENCED_COLUMN_NAME}, user_id, project_id) VALUES ?`,
              [refValues]
            );
            await pool.query(sql, [values]);
          }
        } else if (error.code === "ECONNRESET" && retries > 0) {
          console.warn(
            `⚠️ Connection reset, retrying (${retries} attempts left)`
          );
          retries--;
          await new Promise((res) => setTimeout(res, 1000));
        } else {
          console.error(
            `❌ Batch import error for ${tableName}:`,
            error.message
          );
          throw error;
        }
      }
    }
  }

  async processTable(tableName, buffer, userId, projectId) {
    console.log(`📥 Importing ${tableName}.txt (${tableName})...`);
    let batch = [];

    await new Promise((resolve, reject) => {
      const stream = Readable.from(buffer).pipe(csv());
      stream
        .on("data", async (row) => {
          Object.keys(row).forEach((key) => {
            if (row[key] === "" || row[key] === undefined) {
              row[key] = null;
            }
          });
          row.user_id = userId;
          row.project_id = projectId;

          batch.push(row);

          if (batch.length >= this.batchSize) {
            stream.pause();
            await this.processBatch(tableName, batch);
            batch = [];
            stream.resume();
          }
        })
        .on("end", async () => {
          if (batch.length > 0) {
            await this.processBatch(tableName, batch);
          }
          console.log(`✅ Import completed for ${tableName}`);
          resolve();
        })
        .on("error", (error) => {
          console.error(
            `❌ CSV parsing error for ${tableName}:`,
            error.message
          );
          reject(error);
        });
    });
  }

  async importGTFSData(req, res) {
    try {
      const userId = req.user.id;
      const importMode = req.body.importMode || "parallel"; // "sequential" veya "parallel" olabilir
      console.log(
        `📤 Import request received from user: ${userId}, mode: ${importMode}`
      );

      if (!req.file) {
        console.log("⚠️ No file uploaded");
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log("📁 Processing file:", req.file.originalname);
      console.log("📦 Starting ZIP extraction...");

      const [userExists] = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE id = ?",
        [userId]
      );
      if (userExists[0].count === 0) {
        throw new Error(
          `User with id ${userId} does not exist in the users table`
        );
      }

      const files = {};
      await new Promise((resolve, reject) => {
        const zipStream = Readable.from(req.file.buffer).pipe(unzipper.Parse());
        let totalFiles = 0;
        let processedFiles = 0;

        zipStream
          .on("entry", (entry) => {
            const fileName = entry.path;
            const chunks = [];
            totalFiles++;

            entry
              .on("data", (chunk) => chunks.push(chunk))
              .on("end", () => {
                files[fileName] = Buffer.concat(chunks);
                console.log("📄 Extracted:", fileName);
                processedFiles++;
              })
              .on("error", (error) => reject(error));
          })
          .on("error", (error) => reject(error))
          .on("finish", () => {
            const waitForFiles = () => {
              if (processedFiles === totalFiles && totalFiles > 0) {
                console.log("✅ All files extracted, total:", processedFiles);
                resolve();
              } else if (totalFiles === 0) {
                reject(new Error("No files found in ZIP"));
              } else {
                setTimeout(waitForFiles, 100);
              }
            };
            waitForFiles();
          });
      });

      console.log("✅ ZIP extraction complete");

      const projectId = await this.insertImportedData(
        userId,
        req.file.originalname
      );
      console.log(
        `🚀 Starting ${importMode} file imports with projectId:`,
        projectId
      );

      const importTable = async (tableName, buffer) => {
        if (!buffer) {
          console.log(`⚠️ ${tableName}.txt not found in ZIP, skipping`);
          return;
        }
        await this.processTable(tableName, buffer, userId, projectId);
      };

      if (importMode === "sequential") {
        // Sıralı içe aktarma
        for (const tableName of this.tableOrder) {
          const filename = `${tableName}.txt`;
          await importTable(tableName, files[filename]);
        }
      } else {
        // Paralel içe aktarma (mevcut mantık)
        const independentPromises = this.independentTables.map((tableName) => {
          const filename = `${tableName}.txt`;
          return importTable(tableName, files[filename]);
        });

        await Promise.all(independentPromises);
        console.log("✅ All independent tables imported");

        const dependentPromises = this.dependentTables.map((tableName) => {
          const filename = `${tableName}.txt`;
          return importTable(tableName, files[filename]);
        });

        await Promise.all(dependentPromises);
        console.log("✅ All dependent tables imported");
      }

      for (const [filename] of Object.entries(files)) {
        const tableName = filename.replace(".txt", "").toLowerCase();
        if (!this.tableOrder.includes(tableName)) {
          console.log(
            `⚠️ Skipping ${filename} as it is not a valid GTFS table`
          );
        }
      }

      console.log(`🎉 ${importMode} import process completed`);
      return res.status(200).json({
        message: "GTFS data import completed",
        success: true,
        projectId,
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
