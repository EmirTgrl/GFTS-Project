const fs = require("fs");
const path = require("path");
const unzipper = require("unzipper");
const csv = require("csv-parser");
const pool = require("./db.js");

const importGTFS = async (zipFilePath) => {
  try {
    console.log("GTFS verileri içe aktarılıyor...");

    const extractPath = path.join(__dirname, "gtfs_data");
    if (!fs.existsSync(extractPath)) {
      fs.mkdirSync(extractPath);
    }

    await fs
      .createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .promise();
    console.log("Dosya çıkarıldı: ", extractPath);

    const files = [
      "agency.txt",
      "stops.txt",
      "routes.txt",
      "trips.txt",
      "stop_times.txt",
      "calendar.txt",
      "shapes.txt",
    ];

    for (const file of files) {
      const filePath = path.join(extractPath, file);
      if (fs.existsSync(filePath)) {
        console.log(`${file} içe aktarılıyor...`);
        await importCSV(filePath, file.replace(".txt", ""));
      } else {
        console.warn(`${file} bulunamadı, atlanıyor.`);
      }
    }

    console.log("GTFS verileri başarıyla içe aktarıldı!");
  } catch (error) {
    console.error("GTFS içe aktarma hatası:", error);
  }
};

const importCSV = async (filePath, tableName) => {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        rows.push(row);
      })
      .on("end", async () => {
        console.log(
          `${rows.length} satır okundu ${tableName} tablosuna eklenecek.`
        );
        await insertRowsBulk(tableName, rows);
        resolve();
      })
      .on("error", (error) => {
        console.error(`CSV okuma hatası (${filePath}):`, error);
        reject(error);
      });
  });
};

const insertRowsBulk = async (tableName, rows) => {
  try {
    if (rows.length === 0) {
      console.warn(`${tableName} tablosuna eklenecek satır yok.`);
      return;
    }

    // Tablonun sütunlarını almak için veritabanı sorgusu
    const [columnsResult] = await pool.execute(
      `SHOW COLUMNS FROM \`${tableName}\``
    );
    const tableColumns = columnsResult.map((col) => col.Field);

    const columns = tableColumns.map((col) => `\`${col}\``).join(", ");

    const values = rows
      .map((row) => {
        const rowValues = tableColumns.map((col) => {
          const value = row[col];
          return value !== undefined && value !== ""
            ? `'${value.replace(/'/g, "''")}'`
            : "NULL";
        });
        return `(${rowValues.join(", ")})`;
      })
      .join(", ");

    const updateValues = tableColumns
      .map((col) => `\`${col}\` = VALUES(\`${col}\`)`)
      .join(", ");

    const query = `INSERT INTO \`${tableName}\` (${columns}) VALUES ${values} ON DUPLICATE KEY UPDATE ${updateValues}`;
    console.log(`SQL Sorgusu: ${query}`);
    await pool.execute(query);
    console.log(`Veriler ${tableName} tablosuna başarıyla eklendi.`);
  } catch (error) {
    console.error(`Veri eklenirken hata oluştu (${tableName}):`, error);
  }
};

module.exports = importGTFS;
