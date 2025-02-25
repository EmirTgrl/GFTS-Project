const multer = require("multer");
const csv = require("csv-parser");
const unzipper = require("unzipper");
const { pool } = require("../db.js");
const { Readable } = require("stream");

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

    this.chunkSize = 10000;
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

  async tableExists(tableName) {
    try {
      await pool.query(`DESCRIBE ${tableName}`);
      return true;
    } catch (error) {
      if (error.code === "ER_NO_SUCH_TABLE") {
        return false;
      }
      throw error;
    }
  }

  async getExistingTables() {
    const [tables] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `);
    return new Set(tables.map((row) => row.TABLE_NAME.toLowerCase()));
  }

  async getTableDependencies(tablesToProcess) {
    const [foreignKeys] = await pool.query(
      `
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
      AND REFERENCED_TABLE_NAME IS NOT NULL
      AND TABLE_NAME IN (?)
    `,
      [[...tablesToProcess]]
    );

    const dependencies = {};
    foreignKeys.forEach((row) => {
      if (!dependencies[row.TABLE_NAME]) {
        dependencies[row.TABLE_NAME] = new Set();
      }
      dependencies[row.TABLE_NAME].add(row.REFERENCED_TABLE_NAME);
    });

    const orderedTables = [];
    const visited = new Set();

    const visit = (table) => {
      if (visited.has(table) || !tablesToProcess.has(table)) return;
      visited.add(table);

      const deps = dependencies[table] || new Set();
      deps.forEach((depTable) => visit(depTable));
      orderedTables.push(table);
    };

    tablesToProcess.forEach((table) => visit(table));
    return orderedTables;
  }

  async ensureDependencies(tableName, rows, userId, projectId) {
    const [foreignKeys] = await pool.query(
      `
      SELECT 
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `,
      [tableName]
    );

    for (const fk of foreignKeys) {
      const { COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME } = fk;
      const refValues = new Set(
        rows.map((row) => row[COLUMN_NAME]).filter((v) => v)
      );

      if (refValues.size === 0) continue;

      console.log(
        `🔍 Checking ${COLUMN_NAME} references for ${tableName} in ${REFERENCED_TABLE_NAME}...`
      );
      const [existing] = await pool.query(
        `SELECT ${REFERENCED_COLUMN_NAME} FROM ${REFERENCED_TABLE_NAME} WHERE ${REFERENCED_COLUMN_NAME} IN (?)`,
        [[...refValues]]
      );
      const existingKeys = new Set(
        existing.map((row) => row[REFERENCED_COLUMN_NAME])
      );
      const missingKeys = [...refValues].filter((k) => !existingKeys.has(k));

      if (
        missingKeys.length > 0 &&
        (await this.tableExists(REFERENCED_TABLE_NAME))
      ) {
        console.log(
          `🛠️ Adding ${missingKeys.length} missing ${REFERENCED_COLUMN_NAME}s to ${REFERENCED_TABLE_NAME}...`
        );
        const sql = `INSERT IGNORE INTO ${REFERENCED_TABLE_NAME} (${REFERENCED_COLUMN_NAME}, user_id, project_id) VALUES ?`;
        const values = missingKeys.map((k) => [k, userId, projectId]);
        await pool.query(sql, [values]);
        console.log(
          `✅ Added missing ${REFERENCED_COLUMN_NAME}s to ${REFERENCED_TABLE_NAME}`
        );
      }
    }

    // user_id için ek kontrol
    if (tableName !== "users") {
      const [userExists] = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE id = ?",
        [userId]
      );
      if (userExists[0].count === 0) {
        console.log(`🛠️ Adding missing user_id ${userId} to users...`);
        await pool.execute("INSERT IGNORE INTO users (id) VALUES (?)", [
          userId,
        ]);
      }
    }
  }

  async bulkImportCSV(tableName, fileBuffer, userId, projectId) {
    return new Promise((resolve, reject) => {
      const rows = [];
      console.log(`📊 Importing ${tableName}...`);

      Readable.from(fileBuffer)
        .pipe(csv())
        .on("data", (data) => {
          Object.keys(data).forEach((key) => {
            if (data[key] === "" || data[key] === undefined) {
              data[key] = null;
            }
          });
          data.user_id = userId; // Her satıra user_id ekle
          data.project_id = projectId;
          rows.push(data);
        })
        .on("end", async () => {
          try {
            if (rows.length === 0) {
              console.log(`⚠️ No data found in ${tableName}, skipping...`);
              resolve();
              return;
            }

            await this.ensureDependencies(tableName, rows, userId, projectId);

            const columns = Object.keys(rows[0]);
            const placeholders = columns.map(() => "?").join(",");
            const [primaryKeys] = await pool.query(
              `
              SELECT COLUMN_NAME
              FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = ?
              AND COLUMN_KEY = 'PRI'
            `,
              [tableName]
            );
            const primaryKey =
              primaryKeys.length > 0 ? primaryKeys[0].COLUMN_NAME : null;

            const sqlUpsert = primaryKey
              ? `
                INSERT INTO ${tableName} (${columns.join(",")})
                VALUES ?
                ON DUPLICATE KEY UPDATE ${columns
                  .filter(
                    (col) =>
                      col !== primaryKey &&
                      col !== "user_id" &&
                      col !== "project_id"
                  )
                  .map((col) => `${col} = VALUES(${col})`)
                  .join(",")}
              `
              : `INSERT IGNORE INTO ${tableName} (${columns.join(
                  ","
                )}) VALUES ?`;

            for (let i = 0; i < rows.length; i += this.chunkSize) {
              const chunk = rows.slice(i, i + this.chunkSize);
              const values = chunk.map((row) => columns.map((col) => row[col]));
              console.log(
                `📈 Bulk importing ${
                  values.length
                } rows into ${tableName} (chunk ${i / this.chunkSize + 1})...`
              );
              let retries = 3;
              while (retries > 0) {
                try {
                  await pool.query(sqlUpsert, [values]);
                  break;
                } catch (error) {
                  if (error.code === "ECONNRESET" && retries > 0) {
                    console.warn(
                      `⚠️ Connection reset, retrying (${retries} attempts left)...`
                    );
                    retries--;
                    await new Promise((res) => setTimeout(res, 1000));
                  } else {
                    throw error;
                  }
                }
              }
            }
            console.log(`✅ Bulk import completed for ${tableName}`);
            resolve();
          } catch (error) {
            console.error(`❌ Error importing ${tableName}:`, error);
            reject(error);
          }
        })
        .on("error", (error) => {
          console.error(`❌ CSV parsing error for ${tableName}:`, error);
          reject(error);
        });
    });
  }

  async importFiles(files, userId, projectId) {
    const existingTables = await this.getExistingTables();
    const availableFiles = Object.keys(files).map((filename) =>
      filename.toLowerCase()
    );

    const tablesToProcessSet = new Set(
      availableFiles
        .map((filename) => filename.replace(".txt", "").toLowerCase())
        .filter((table) => existingTables.has(table))
    );

    if (tablesToProcessSet.size === 0) {
      console.log(
        "⚠️ No matching tables found in ZIP and database, skipping import..."
      );
      return;
    }

    const orderedTables = await this.getTableDependencies(tablesToProcessSet);
    console.log("🔧 Tables to process (in dependency order):", orderedTables);

    for (const table of orderedTables) {
      const filename = `${table}.txt`;
      console.log(`📥 Importing ${filename} (${table})...`);
      try {
        await this.bulkImportCSV(table, files[filename], userId, projectId);
      } catch (error) {
        console.error(`❌ Failed to import ${filename}:`, error);
        continue;
      }
    }

    console.log("✅ All files processed");
  }

  async importGTFSData(req, res) {
    try {
      const userId = req.user.id;
      console.log("📤 Import request received from user:", userId);

      if (!req.file) {
        console.log("⚠️ No file uploaded");
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log("📁 Processing file:", req.file.originalname);
      console.log("📦 Starting ZIP extraction...");

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
              .on("error", (error) => {
                console.error("❌ Error processing entry:", fileName, error);
                reject(error);
              });
          })
          .on("error", (error) => {
            console.error("❌ ZIP parsing error:", error);
            reject(error);
          })
          .on("finish", () => {
            console.log("✅ ZIP stream finished");
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

      console.log(
        "✅ ZIP extraction complete, extracted files:",
        Object.keys(files)
      );

      console.log("🚧 Proceeding to insert import record...");
      const projectId = await this.insertImportedData(
        userId,
        req.file.originalname
      );

      console.log("🚀 Starting file imports with projectId:", projectId);
      await this.importFiles(files, userId, projectId);

      console.log("🎉 Import process completed");
      return res.status(200).json({
        message: "GTFS data import completed",
        success: true,
        projectId,
      });
    } catch (error) {
      console.error("❌ GTFS Import Error:", error);
      return res.status(500).json({
        message: error.message || "Error importing GTFS data",
        success: false,
      });
    }
  }
}

module.exports = new ImportService();
