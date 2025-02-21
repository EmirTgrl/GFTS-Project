const multer = require("multer");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const unzipper = require("unzipper");
const {pool} = require("../db.js");

class ImportService {
  constructor() {
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "..", "uploads");
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
      },
    });

    this.upload = multer({
      storage: this.storage,
      fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname) !== ".zip") {
          return cb(new Error("Only .zip files are allowed"));
        }
        cb(null, true);
      },
    });
  }

  cleanup(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        if (fs.lstatSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  }

  async insertImportedData(userId, fileName) {
    const [result] = await pool.execute(
      "INSERT INTO imported_data (id, file_name, import_date) VALUES (?, ?, NOW())",
      [userId, fileName]
    );
    return result.insertId;
  }

  async importCSV(tableName, filePath, importId) {
    return new Promise((resolve, reject) => {
      const rows = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => {
          if (
            tableName === "trips" &&
            (!data.shape_id || data.shape_id === "")
          ) {
            data.shape_id = null;
          }
          data.import_id = importId;
          rows.push(data);
        })
        .on("end", async () => {
          try {
            await pool.execute(`DELETE FROM ${tableName} WHERE import_id = ?`, [
              importId,
            ]);

            if (rows.length > 0) {
              for (const row of rows) {
                const columns = Object.keys(row);
                const values = columns.map((col) => row[col]);
                const placeholders = columns.map(() => "?").join(",");

                try {
                  const sql = `INSERT INTO ${tableName} (${columns.join(
                    ","
                  )}) VALUES (${placeholders})`;
                  await pool.query(sql, values);
                } catch (err) {
                  if (err.code === "ER_DUP_ENTRY") {
                    const idColumnMap = {
                      agency: "agency_id",
                      routes: "route_id",
                      stops: "stop_id",
                      trips: "trip_id",
                      shapes: "shape_id",
                      calendar: "service_id",
                    };

                    const idColumn = idColumnMap[tableName];
                    if (!idColumn) {
                      throw new Error(`Unknown table: ${tableName}`);
                    }

                    const updateColumns = columns
                      .filter((col) => col !== idColumn && col !== "import_id")
                      .map((col) => `${col} = ?`);

                    if (updateColumns.length > 0) {
                      const updateSql = `
                        UPDATE ${tableName} 
                        SET import_id = ?, ${updateColumns.join(", ")}
                        WHERE ${idColumn} = ?
                      `;

                      const updateValues = [
                        importId,
                        ...columns
                          .filter(
                            (col) => col !== idColumn && col !== "import_id"
                          )
                          .map((col) => row[col]),
                        row[idColumn],
                      ];

                      await pool.query(updateSql, updateValues);
                    }
                  } else {
                    throw err;
                  }
                }
              }
            }
            resolve();
          } catch (error) {
            reject(error);
          }
        });
    });
  }

  async importFiles(tempDir, importId) {
    const files = {
      agency: path.join(tempDir, "agency.txt"),
      calendar: path.join(tempDir, "calendar.txt"),
      shapes: path.join(tempDir, "shapes.txt"),
      routes: path.join(tempDir, "routes.txt"),
      stops: path.join(tempDir, "stops.txt"),
      trips: path.join(tempDir, "trips.txt"),
      stopTimes: path.join(tempDir, "stop_times.txt"),
    };

    for (const [table, filePath] of Object.entries(files)) {
      if (fs.existsSync(filePath)) {
        await this.importCSV(table, filePath, importId);
        this.cleanup(filePath);
      }
    }
  }

  async importGTFSData(req, res) {
    let tempDir = null;

    try {
      const userId = req.user.id;
      console.log("📤 Import request received");
      console.log("User ID from token:", userId);

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log("✅ File received:", req.file.originalname);
      console.log("📂 File path:", req.file.path);

      tempDir = path.join(__dirname, "..", "temp", Date.now().toString());
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      await fs
        .createReadStream(req.file.path)
        .pipe(unzipper.Extract({ path: tempDir }))
        .promise();

      const importId = await this.insertImportedData(
        userId,
        path.basename(req.file.path)
      );

      await this.importFiles(tempDir, importId);

      this.cleanup(tempDir);
      this.cleanup(req.file.path);

      return res.status(200).json({
        message: "GTFS data imported successfully",
        success: true,
      });
    } catch (error) {
      console.error("❌ GTFS Import Error:", error.message);

      if (tempDir) this.cleanup(tempDir);
      if (req.file && req.file.path) {
        this.cleanup(req.file.path);
      }

      return res.status(500).json({
        message: error.message || "Error importing GTFS data",
        success: false,
      });
    }
  }
}

module.exports = new ImportService();
