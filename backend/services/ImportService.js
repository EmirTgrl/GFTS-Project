const multer = require("multer");
const csv = require("csv-parser");
const unzipper = require("unzipper");
const { pool } = require("../db.js");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream").promises;

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

  async importGTFSData(req, res) {
    try {
      const userId = req.user.id;
      const importMode = req.body.importMode || "parallel";
      console.log(
        `📤 Import request received from user: ${userId}, mode: ${importMode}`
      );

      if (!req.file) {
        console.log("⚠️ No file uploaded");
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log("📁 Processing file:", req.file.filename);
      console.log("📦 Starting ZIP extraction to disk...");

      const [userExists] = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE id = ?",
        [userId]
      );
      if (userExists[0].count === 0) {
        throw new Error(
          `User with id ${userId} does not exist in the users table`
        );
      }

      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }

      const zipPath = path.join(__dirname, "../uploads", req.file.filename);
      await fs
        .createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: this.tempDir }))
        .promise();
      console.log("✅ ZIP extraction complete");

      const projectId = await this.insertImportedData(
        userId,
        req.file.originalname
      );
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
