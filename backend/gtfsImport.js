const fs = require("fs");
const path = require("path");
const unzipper = require("unzipper");
const csv = require("csv-parser");
const pool = require("./db.js");

const insertImportedData = async (userId, fileName) => {
  if (!userId) {
    console.error("User ID is missing, cannot insert data");
    return null;
  }

  const importDate = new Date();

  // Aynı dosya adı ve kullanıcıya ait veriyi kontrol et
  const checkQuery = `SELECT id FROM imported_data WHERE id = ? AND file_name = ?`;
  const [checkResult] = await pool.query(checkQuery, [userId, fileName]);

  if (checkResult.length > 0) {
    console.log("File already imported, returning existing id");
    return checkResult[0].id; // Var olan import_id'yi döndür
  } else {
    // Yeni import işlemi başlat
    const insertQuery = `
      INSERT INTO imported_data (id, file_name, import_date)
      VALUES (?, ?, ?)`;
    const [result] = await pool.query(insertQuery, [
      userId,
      fileName,
      importDate,
    ]);

    console.log(`Data inserted into imported_data for user ${userId}`);
    return result.insertId; // Yeni import_id'yi döndür
  }
};

const gtfsImport = async (zipFilePath, userId) => {
  try {
    if (!userId) {
      console.error("User ID is missing, cannot proceed with import");
      return;
    }

    const extractPath = path.join(__dirname, "gtfs_data");

    // Çıktı klasörünü oluştur
    if (!fs.existsSync(extractPath)) {
      fs.mkdirSync(extractPath);
    }

    // ZIP dosyasını çıkar
    await fs
      .createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .promise();

    const fileName = path.basename(zipFilePath);

    // Import ID'yi al (dosya zaten var mı kontrol et)
    const importId = await insertImportedData(userId, fileName);

    if (!importId) {
      console.error(
        "Import ID is missing, cannot continue importing GTFS data"
      );
      return;
    }

    const files = fs.readdirSync(extractPath);

    for (const file of files) {
      const filePath = path.join(extractPath, file);

      // Eğer dosya değilse, devam et
      if (fs.lstatSync(filePath).isDirectory()) {
        console.log(`Skipping directory: ${file}`);
        continue;
      }

      const tableName = path.basename(file, path.extname(file));
      await importCSV(filePath, tableName, importId);
    }
  } catch (error) {
    console.error("GTFS import error:", error);
  }
};

const importCSV = async (filePath, tableName, importId) => {
  return new Promise((resolve, reject) => {
    if (!importId) {
      console.error(`Skipping import for ${tableName} due to missing importId`);
      return reject(new Error("Missing importId"));
    }

    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        // Her satıra import_id ekliyoruz
        data.import_id = importId;
        rows.push(data);
      })
      .on("end", async () => {
        try {
          await insertRowsBulk(tableName, rows);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

const insertRowsBulk = async (tableName, rows) => {
  if (rows.length === 0) {
    console.warn(`Skipping ${tableName} because it has no data`);
    return;
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const [columnsResult] = await connection.query(
      `SHOW COLUMNS FROM ${tableName}`
    );
    const validColumns = columnsResult.map((col) => col.Field); // Geçerli sütun adları

    const csvColumns = Object.keys(rows[0]);
    const matchedColumns = csvColumns.filter((col) =>
      validColumns.includes(col)
    );

    console.log(`Table: ${tableName}`);
    console.log(`CSV Columns:`, csvColumns);
    console.log(`Matched Columns:`, matchedColumns);

    if (matchedColumns.length === 0) {
      console.warn(`No matching columns for ${tableName}, skipping import`);
      return;
    }

    const values = rows.map((row) =>
      matchedColumns.map((col) => (row[col] === "" ? null : row[col]))
    );

    const query = `INSERT INTO ${tableName} (${matchedColumns.join(
      ", "
    )}) VALUES ?`;
    await connection.query(query, [values]);

    await connection.commit();
    console.log(`Data successfully inserted into ${tableName}`);
  } catch (error) {
    await connection.rollback();
    console.error("Error inserting data:", error);
  } finally {
    connection.release();
  }
};

module.exports = gtfsImport;
