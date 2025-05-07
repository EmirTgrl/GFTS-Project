const { pool } = require("../db.js");
const { tableExists } = require("../initTables.js");

const projectService = {
  getProjectsByQuery: async (req, res) => {
    const user_id = req.user.id;
    const validFields = [
      "project_id",
      "file_name",
      "import_date",
      "validation_data",
    ];

    const fields = [];
    const values = [];
    fields.push("user_id = ?");
    values.push(user_id);

    for (const param in req.query) {
      if (validFields.includes(param)) {
        if (param === "validation_data") {
          fields.push("JSON_CONTAINS(validation_data, ?)");
          values.push(req.query[param]);
        } else {
          fields.push(`${param} = ?`);
          values.push(req.query[param]);
        }
      } else {
        console.warn(`Unexpected query parameter: ${param}`);
      }
    }

    let query = `SELECT project_id, file_name, import_date, validation_data 
                 FROM projects 
                 WHERE ${fields.join(" AND ")}`;

    try {
      const [rows] = await pool.execute(query, values);
      res.json(rows.length > 0 ? rows : []);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  updateProject: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { project_id } = req.params;
      const { file_name } = req.body;
      const [result] = await pool.query(
        `
        UPDATE projects
        SET file_name = ?
        WHERE project_id = ? AND user_id = ?
        `,
        [file_name, project_id, user_id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json({ message: "Project updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },

  deleteProjectById: async (req, res) => {
    const user_id = req.user.id;
    const { project_id } = req.params;

    // GTFS tabloları, bağımlılık sırasına göre
    const gtfsTables = [
      // En bağımlı tablolar
      "stop_times",
      "fare_transfer_rules",
      "fare_leg_join_rules",
      "route_networks",
      "stop_areas",
      // Orta seviye bağımlı tablolar
      "trips",
      "fare_leg_rules",
      "fare_rules",
      "fare_products",
      // Daha az bağımlı tablolar
      "stops",
      "routes",
      "shapes",
      "calendar",
      "fare_attributes",
      "fare_media",
      "rider_categories",
      "timeframes",
      "networks",
      "areas",
      // Bağımsız tablolar
      "agency",
    ];

    // Transaction başlat
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Foreign key kısıtlamalarını devre dışı bırak
      await connection.execute("SET FOREIGN_KEY_CHECKS = 0;");

      // GTFS tablolarındaki verileri sil, sadece mevcut tablolar için
      for (const table of gtfsTables) {
        const exists = await tableExists(table);
        if (exists) {
          await connection.execute(
            `DELETE FROM ${table} WHERE project_id = ? AND user_id = ?`,
            [project_id, user_id]
          );
        } else {
          console.warn(`Table ${table} does not exist, skipping deletion`);
        }
      }

      // Projects tablosundan projeyi sil
      const [result] = await connection.execute(
        `DELETE FROM projects WHERE project_id = ? AND user_id = ?`,
        [project_id, user_id]
      );

      if (result.affectedRows === 0) {
        await connection.execute("SET FOREIGN_KEY_CHECKS = 1;"); // Kısıtlamaları geri aç
        await connection.rollback();
        return res.status(404).json({ message: "Project not found" });
      }

      // Foreign key kısıtlamalarını tekrar etkinleştir
      await connection.execute("SET FOREIGN_KEY_CHECKS = 1;");

      // Transaction'ı commit et
      await connection.commit();
      res.json({
        message: "Project and associated GTFS data deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting project and GTFS data:", error);
      if (connection) {
        await connection.execute("SET FOREIGN_KEY_CHECKS = 1;"); // Hata durumunda da kısıtlamaları geri aç
        await connection.rollback();
      }
      res.status(500).json({ message: "Server error", details: error.message });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  saveProject: async (req, res) => {
    const user_id = req.user.id;
    const { file_name } = req.body;
    try {
      const [result] = await pool.execute(
        `
        INSERT INTO projects (user_id, file_name, import_date)
        VALUES (?, ?, NOW())
        `,
        [user_id, file_name]
      );
      res.status(201).json({
        message: "Project successfully saved",
        project_id: result.insertId,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
};

module.exports = projectService;
