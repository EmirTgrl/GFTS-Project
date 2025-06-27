const fs = require("fs");
const fsPromises = require("fs").promises;
const { pool } = require("../db");
const archiver = require("archiver");
const csv = require("csv-stringify");
const path = require("path");
const { exec } = require("child_process");

// Format dates to GTFS standard (YYYYMMDD) from string input
const formatDateForGTFS = (dateString) => {
  if (!dateString) return "";

  // If the date is already in YYYYMMDD format, return it as is
  if (/^\d{8}$/.test(dateString)) return dateString;

  // If the date is in YYYY-MM-DD format, convert to YYYYMMDD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString.replace(/-/g, "");
  }

  // If the date is a Unix timestamp, convert it
  if (!isNaN(dateString) && String(dateString).length >= 10) {
    const timestamp =
      String(dateString).length > 10
        ? parseInt(dateString)
        : parseInt(dateString) * 1000;
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }

  // Otherwise, try parsing as a Date and convert
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return ""; // Invalid date, return empty string
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

// Format times to GTFS standard (HH:MM:SS)
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
      // Verify project exists and belongs to the user
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
      const outputDir = path.join("gtfs_output", projectId);
      await fsPromises.mkdir(outputDir, { recursive: true });

      const archive = archiver("zip", { zlib: { level: 6 } });
      const zipPath = path.resolve(outputDir, `${projectName}.zip`);
      const zipStream = fs.createWriteStream(zipPath);
      archive.pipe(zipStream);

      // List of GTFS tables based on initializeTables.js
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

      // Check existing tables in the database
      const [allTables] = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
      `);

      const existingTables = allTables
        .map((t) => t.table_name || t.TABLE_NAME)
        .filter((t) => gtfsTables.includes(t));

      if (!existingTables.length) {
        return res
          .status(400)
          .json({ message: "No GTFS tables available for export." });
      }

      let exportedTables = 0;
      let requiredTablesMissing = [];

      for (const tableName of existingTables) {
        // Fetch column names, excluding user_id and project_id
        const [columns] = await pool.query(
          `
          SELECT COLUMN_NAME
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME NOT IN ('user_id', 'project_id')
        `,
          [tableName]
        );

        const columnNames = columns.map((col) => col.COLUMN_NAME);

        if (columnNames.length === 0) {
          continue;
        }

        // Fetch rows for the user and project
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

        // Format dates and times for GTFS compliance as strings
        if (["calendar", "calendar_dates"].includes(tableName)) {
          rows.forEach((row) => {
            if (row.start_date)
              row.start_date = formatDateForGTFS(row.start_date.toString());
            if (row.end_date)
              row.end_date = formatDateForGTFS(row.end_date.toString());
            if (row.date) row.date = formatDateForGTFS(row.date.toString());
          });
        }

        if (["stop_times", "timeframes"].includes(tableName)) {
          rows.forEach((row) => {
            if (row.arrival_time)
              row.arrival_time = formatTimeForGTFS(row.arrival_time.toString());
            if (row.departure_time)
              row.departure_time = formatTimeForGTFS(
                row.departure_time.toString()
              );
            if (row.start_time)
              row.start_time = formatTimeForGTFS(row.start_time.toString());
            if (row.end_time)
              row.end_time = formatTimeForGTFS(row.end_time.toString());
          });
        }

        const csvStream = csv.stringify(rows, {
          header: true,
          columns: columnNames,
          cast: {
            date: (value) => formatDateForGTFS(value.toString()),
            string: (value) => value,
            number: (value) => value.toString(),
            boolean: (value) => (value ? "1" : "0"),
          },
        });

        archive.append(csvStream, { name: `${tableName}.txt` });
        exportedTables++;
      }

      // Check for missing required tables
      if (requiredTablesMissing.length > 0) {
        archive.finalize();
        return res.status(400).json({
          message: `Missing required GTFS tables: ${requiredTablesMissing.join(
            ", "
          )}. Please ensure these tables have data.`,
        });
      }

      if (archive.pointer() === 0) {
        return res
          .status(400)
          .json({ message: "No data available for export." });
      }

      // Finalize the archive
      await new Promise((resolve, reject) => {
        archive.on("end", resolve);
        archive.on("error", reject);
        archive.finalize();
      });

      // --- OTP DATA & CONFIG DOSYALARINI OLUŞTUR ---
      // Her proje için ayrı klasör
      const otpDataDir = path.resolve(__dirname, `../otp-data/project_${projectId}`);
      await fsPromises.mkdir(otpDataDir, { recursive: true });

      // GTFS zip dosyasını otp-data klasörüne kopyala
      const otpGtfsPath = path.join(otpDataDir, "gtfs.zip");
      await fsPromises.copyFile(zipPath, otpGtfsPath);

      // build-config.json oluştur
      const buildConfigPath = path.join(otpDataDir, "build-config.json");
      const buildConfig = {
        transitServiceStart: "2025-01-01",
        transitServiceEnd: "2026-01-01",
        maxDataImportIssuesPerFile: 1000,
        transitFeeds: [
          {
            type: "gtfs",
            source: `file://${otpGtfsPath.replace(/\\/g, "/")}`,
          },
        ],
        writeGraph: true,
      };
      await fsPromises.writeFile(buildConfigPath, JSON.stringify(buildConfig, null, 2));

      // router-config.json oluştur/güncelle
      const routerConfigPath = path.join(otpDataDir, "router-config.json");
      let routerConfig = {
        updaters: [],
        routingDefaults: {
          walkSpeed: 1.33,
          maxWalkDistance: 800,
          numItineraries: 3,
        },
      };
      try {
        const existingConfig = await fsPromises.readFile(routerConfigPath, "utf8");
        const parsedConfig = JSON.parse(existingConfig);
        routerConfig = { ...routerConfig, ...parsedConfig };
      } catch (error) {
        // yoksa default ile devam
      }
      await fsPromises.writeFile(routerConfigPath, JSON.stringify(routerConfig, null, 2));

      // otp-config.json oluştur/güncelle (isteğe bağlı)
      const otpConfigPath = path.join(otpDataDir, "otp-config.json");
      const otpConfig = {
        server: {
          cors: {
            enabled: true,
            allowOrigins: ["http://localhost:5173"],
            allowMethods: ["GET", "POST", "OPTIONS"],
            allowHeaders: ["Authorization", "Content-Type"],
          },
        },
      };
      await fsPromises.writeFile(otpConfigPath, JSON.stringify(otpConfig, null, 2));

      // --- OTP GRAPH BUILD KOMUTU OTOMATİK ---
      const javaPath = `"C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.7.6-hotspot\\bin\\java.exe"`;
      const otpJarPath = path.resolve(__dirname, "../otp-shaded-2.7.0.jar");
      const buildServeCmd = `${javaPath} -Xms4G -Xmx12G -jar "${otpJarPath}" --build "${otpDataDir}" --serve`;

      exec(buildServeCmd, (err, stdout, stderr) => {
        if (err) {
          console.error("OTP build/serve error:", err);
        } else {
          console.log("OTP build/serve output:", stdout);
        }
      });

      // --- DOSYA İNDİRME ---
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
      return res.status(500).json({
        message: error.message || "An error occurred while exporting GTFS data",
      });
    }
  },
};

module.exports = exportService;
