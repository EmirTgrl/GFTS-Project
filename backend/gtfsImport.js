const fs = require("fs");
const path = require("path");
const unzipper = require("unzipper");
const csv = require("csv-parser");
const pool = require("./db.js");

// Temizleme fonksiyonu
const cleanup = (filePath) => {
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
};

const insertImportedData = async (userId, fileName) => {
  const [result] = await pool.execute(
    "INSERT INTO imported_data (id, file_name, import_date) VALUES (?, ?, NOW())",
    [userId, fileName]
  );
  return result.insertId;
};

const gtfsImport = async (zipFilePath, userId) => {
  let tempDir = null;

  try {
    // Geçici dizin oluştur
    tempDir = path.join(__dirname, "temp", Date.now().toString());
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // ZIP dosyasını aç
    await fs
      .createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: tempDir }))
      .promise();

    // Import işlemlerini gerçekleştir
    const importId = await insertImportedData(
      userId,
      path.basename(zipFilePath)
    );

    // Dosyaları import et
    await importFiles(tempDir, importId);

    // Başarılı olursa temizlik yap
    cleanup(tempDir);
    cleanup(zipFilePath);

    return true;
  } catch (error) {
    // Hata durumunda da temizlik yap
    if (tempDir) cleanup(tempDir);
    cleanup(zipFilePath);

    console.error("Import error:", error);
    throw error;
  }
};

const importFiles = async (tempDir, importId) => {
  const files = {
    agency: path.join(tempDir, "agency.txt"),
    calendar: path.join(tempDir, "calendar.txt"),
    shapes: path.join(tempDir, "shapes.txt"),
    routes: path.join(tempDir, "routes.txt"),
    stops: path.join(tempDir, "stops.txt"),
    trips: path.join(tempDir, "trips.txt"),
    stopTimes: path.join(tempDir, "stop_times.txt"),
  };

  // Sırayla import et
  for (const [table, filePath] of Object.entries(files)) {
    if (fs.existsSync(filePath)) {
      await importCSV(table, filePath, importId);
      // Her dosyayı import ettikten sonra sil
      cleanup(filePath);
    }
  }
};

const importCSV = async (tableName, filePath, importId) => {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        // Boş shape_id'leri NULL olarak ayarla
        if (tableName === "trips" && (!data.shape_id || data.shape_id === "")) {
          data.shape_id = null;
        }
        data.import_id = importId;
        rows.push(data);
      })
      .on("end", async () => {
        try {
          // Önce bu import_id'ye ait eski verileri sil
          await pool.execute(`DELETE FROM ${tableName} WHERE import_id = ?`, [
            importId,
          ]);

          if (rows.length > 0) {
            // Her bir satırı tek tek ekle
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
                  // GTFS standartlarına göre doğru ID kolonları
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
};

module.exports = gtfsImport;
