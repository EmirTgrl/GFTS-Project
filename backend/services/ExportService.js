const fs = require("fs");
const fsPromises = require("fs").promises;
const { pool } = require("../db");
const archiver = require("archiver");
const csv = require("csv-stringify");
const path = require("path");
const { exec } = require("child_process");

// GTFS standartlarına göre tarih formatı (YYYYMMDD)
const formatDateForGTFS = (dateString) => {
  if (!dateString) return "";
  if (/^\d{8}$/.test(dateString)) return dateString;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString.replace(/-/g, "");
  }
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

// GTFS standartlarına göre zaman formatı (HH:MM:SS)
const formatTimeForGTFS = (timeString) => {
  if (!timeString) return "";
  const [hours, minutes, seconds] = timeString.split(":");
  return `${hours}:${minutes}:${seconds}`;
};

const exportService = {
  exportGTFS: async (req, res) => {
    const user_id = req.user.id;
    const { projectId } = req.params;

    if (!user_id || !projectId) {
      return res
        .status(400)
        .json({ message: "User ID and Project ID are required." });
    }

    try {
      // Projenin varlığını ve kullanıcıya ait olduğunu doğrula
      const [projectExists] = await pool.execute(
        `SELECT file_name FROM projects WHERE project_id = ? AND user_id = ?`,
        [projectId, user_id]
      );

      if (projectExists.length === 0) {
        return res.status(404).json({
          message: "Project not found or does not belong to the user.",
        });
      }

      const projectName = projectExists[0].file_name.replace(".zip", "");

      // GTFS zip dosyasını bellekten oluşturacak akışları ayarla
      const archive = archiver("zip", { zlib: { level: 6 } });
      const zipPath = path.join(
        path.resolve(__dirname, "../otp-data"),
        `gtfs_project_${projectId}.zip`
      );
      const zipStream = fs.createWriteStream(zipPath);
      archive.pipe(zipStream);

      const gtfsTables = [
        "agency",
        "stops",
        "routes",
        "calendar",
        "shapes",
        "fare_attributes",
        "fare_media",
        "fare_products",
        "rider_categories",
        "timeframes",
        "networks",
        "areas",
        "trips",
        "stop_times",
        "fare_rules",
        "fare_leg_join_rules",
        "fare_leg_rules",
        "fare_transfer_rules",
        "route_networks",
        "stop_areas",
      ];

      // Veritabanındaki GTFS tablolarını kontrol et
      const [allTables] = await pool.query(`
        SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()
      `);
      const existingTables = allTables
        .map((t) => t.table_name || t.TABLE_NAME)
        .filter((t) => gtfsTables.includes(t));

      if (!existingTables.length) {
        archive.finalize();
        return res
          .status(400)
          .json({ message: "No GTFS tables available for export." });
      }

      let requiredTablesMissing = [];
      let exportedTablesCount = 0;

      for (const tableName of existingTables) {
        const [columns] = await pool.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME NOT IN ('user_id', 'project_id')`,
          [tableName]
        );
        const columnNames = columns.map((col) => col.COLUMN_NAME);

        if (columnNames.length === 0) continue;

        const [rows] = await pool.execute(
          `SELECT ${columnNames.join(
            ","
          )} FROM ${tableName} WHERE user_id = ? AND project_id = ?`,
          [user_id, projectId]
        );

        if (rows.length === 0) {
          if (
            [
              "agency",
              "stops",
              "routes",
              "trips",
              "stop_times",
              "calendar",
            ].includes(tableName)
          ) {
            requiredTablesMissing.push(tableName);
          }
          continue;
        }

        if (["calendar", "calendar_dates"].includes(tableName)) {
          rows.forEach((row) => {
            if (row.start_date)
              row.start_date = formatDateForGTFS(row.start_date);
            if (row.end_date) row.end_date = formatDateForGTFS(row.end_date);
            if (row.date) row.date = formatDateForGTFS(row.date);
          });
        }
        if (["stop_times", "timeframes"].includes(tableName)) {
          rows.forEach((row) => {
            if (row.arrival_time)
              row.arrival_time = formatTimeForGTFS(row.arrival_time);
            if (row.departure_time)
              row.departure_time = formatTimeForGTFS(row.departure_time);
            if (row.start_time)
              row.start_time = formatTimeForGTFS(row.start_time);
            if (row.end_time) row.end_time = formatTimeForGTFS(row.end_time);
          });
        }

        const csvStream = csv.stringify(rows, {
          header: true,
          columns: columnNames,
        });

        archive.append(csvStream, { name: `${tableName}.txt` });
        exportedTablesCount++;
      }

      if (requiredTablesMissing.length > 0) {
        archive.finalize();
        return res.status(400).json({
          message: `Missing required GTFS tables: ${requiredTablesMissing.join(
            ", "
          )}. Please ensure these tables have data.`,
        });
      }

      if (exportedTablesCount === 0) {
        archive.finalize();
        return res
          .status(400)
          .json({ message: "No data available for export." });
      }

      // Arşivleme işlemini sonlandır ve zip dosyasını diske kaydet
      await new Promise((resolve, reject) => {
        archive.on("end", resolve);
        archive.on("error", reject);
        archive.finalize();
      });

      // OTP için build-config.json dosyasını güncelle
      const buildConfigPath = path.join(
        path.resolve(__dirname, "../otp-data"),
        "build-config.json"
      );
      const buildConfig = {
        transitServiceStart: "2025-01-01",
        transitServiceEnd: "2026-01-01",
        maxDataImportIssuesPerFile: 1000,
        transitFeeds: [
          {
            type: "gtfs",
            source: `file://${zipPath.replace(/\\/g, "/")}`,
          },
        ],
        writeGraph: true,
      };
      await fsPromises.writeFile(
        buildConfigPath,
        JSON.stringify(buildConfig, null, 2)
      );

      // OTP sunucusunu yeniden başlatma komutu
      const javaPath = `"C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.7.6-hotspot\\bin\\java.exe"`;
      const otpJarPath = path.resolve(__dirname, "../otp-shaded-2.7.0.jar");
      const serveCmd = `${javaPath} -Xms4G -Xmx12G -jar "${otpJarPath}" --load "${path.resolve(
        __dirname,
        "../otp-data"
      )}" --serve`;

      exec(serveCmd, (err, stdout, stderr) => {
        if (err) {
          console.error("❌ OTP serve error:", err);
          console.error("❌ STDERR:", stderr);
        } else {
          console.log("✅ OTP serve output:", stdout);
        }
      });

      // Oluşturulan zip dosyasını kullanıcıya gönder
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${projectName}.zip"`
      );
      res.setHeader("Content-Type", "application/zip");
      const readStream = fs.createReadStream(zipPath);
      readStream.pipe(res);
    } catch (error) {
      console.error("❌ GTFS Export Error:", error);
      if (!res.headersSent) {
        return res.status(500).json({
          message:
            error.message || "An error occurred while exporting GTFS data",
        });
      }
    }
  },
};

module.exports = exportService;
