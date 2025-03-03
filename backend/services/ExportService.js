// backend/services/ExportService.js
const { pool } = require("../db");
const archiver = require("archiver");
const { Readable } = require("stream");
const csv = require("csv-stringify");

const exportService = {
    exportGTFS: async (req, res) => {
        const user_id = req.user.id;
        const { project_id } = req.params;

        if (!user_id || !project_id) {
            return res
                .status(400)
                .json({ message: "User ID and Project ID are required." });
        }

        try {
            // Check if the project exists and belongs to the user
            const [projectExists] = await pool.execute(
                `SELECT file_name FROM projects WHERE project_id = ? AND user_id = ?`,
                [project_id, user_id]
            );

            if (projectExists.length === 0) {
                return res.status(404).json({
                    message: "Project not found or does not belong to the user.",
                });
            }

            const projectName = projectExists[0].file_name.replace(".zip", ""); // Use the original filename, remove .zip

            // Get all tables with their names
            const [tables] = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
        AND table_name NOT IN ('users', 'projects')
      `);

            

            const archive = archiver("zip", {
                zlib: { level: 9 }, // Sets the compression level.
            });

            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
            // Set the response headers for a zip file download
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=' + projectName +'.zip'
            );
            res.setHeader("Content-Type", "application/zip");

            archive.pipe(res);


            // loop through all gtfs tables
            for (const table of tables) {
                const tableName = table.TABLE_NAME;

                console.log(`🗄️  Exporting table: ${tableName}`);

                // Get columns for the current table, exclude user_id and project_id
                const [columns] = await pool.query(
                    `
          SELECT COLUMN_NAME
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME NOT IN ('user_id', 'project_id')
        `,
                    [tableName]
                );
                const columnNames = columns.map((col) => col.COLUMN_NAME);
                // Get all data from current table for the user and project
                const [rows] = await pool.execute(
                    `SELECT ${columnNames.join(",")} FROM ${tableName} WHERE user_id = ? AND project_id = ?`,
                    [user_id, project_id]
                );


                // Convert data to CSV string.
                const csvStream = csv.stringify(rows, {
                    header: true,
                    columns: columnNames,
                });

                // Append each table's data as a .txt file to the zip archive.
                archive.append(csvStream, { name: `${tableName}.txt` });
                console.log(`✅ Added ${tableName}.txt to archive`);

            }


            archive.finalize(); // Finalize zip file.
            archive.on('end', function() {
				console.log('Archive wrote %d bytes', archive.pointer());
			});
            console.log("🎉 Export process completed successfully.");

        } catch (error) {
            console.error("❌ GTFS Export Error:", error);
            return res.status(500).json({
                message: error.message || "Error exporting GTFS data",
            });
        }
    },
};

module.exports = exportService;