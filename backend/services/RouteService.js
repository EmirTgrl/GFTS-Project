const { pool } = require("../db.js");

const routeService = {
  getRoutesByProjectId: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { project_id } = req.params;
      const [rows] = await pool.execute(
        `SELECT * FROM routes 
         WHERE project_id = ? AND user_id = ?`,
        [project_id, user_id]
      );
      res.json(rows.length > 0 ? rows : []);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },
  getRouteById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { route_id, project_id } = req.params;
      const [rows] = await pool.execute(
        `SELECT * FROM routes 
         WHERE user_id = ? AND route_id = ? AND project_id = ?`,
        [user_id, route_id, project_id] 
      );
      res.json(rows.length > 0 ? rows[0] : null);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },
  deleteRouteById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { route_id, project_id } = req.params;
      const [results] = await pool.execute(
        `
        DELETE FROM routes 
        WHERE route_id = ? AND user_id = ? AND project_id = ?`,
        [route_id, user_id, project_id]
      );
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Route not found" });
      }
      res.status(200).json({ message: "Route deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },
  updateRoute: async (req, res) => {
    try {
      const user_id = req.user.id;
      const {
        route_id,
        project_id,
        agency_id,
        route_short_name,
        route_long_name,
        route_desc,
        route_type,
        route_url,
        route_color,
        route_text_color,
        route_sort_order,
      } = req.body;
      const query = `
        UPDATE routes
        SET
          agency_id = ?, 
          route_short_name = ?, 
          route_long_name = ?, 
          route_desc = ?, 
          route_type = ?, 
          route_url = ?, 
          route_color = ?, 
          route_text_color = ?, 
          route_sort_order = ?,
        WHERE route_id = ? AND user_id = ? AND project_id = ?
      `;
      const [result] = await pool.execute(query, [
        agency_id,
        route_short_name,
        route_long_name,
        route_desc,
        route_type,
        route_url,
        route_color,
        route_text_color,
        route_sort_order,
        route_id,
        user_id,
        project_id,
      ]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Route not found" });
      }
      return res.status(200).json({ message: "Route successfully updated" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server Error", details: e.message });
    }
  },
  saveRoute: async (req, res) => {
    try {
      const user_id = req.user.id;
      const {
        agency_id,
        project_id,
        route_short_name,
        route_long_name,
        route_desc,
        route_type,
        route_url,
        route_color,
        route_text_color,
        route_sort_order,
      } = req.body;

      const [rows] = await pool.execute(
        "SELECT MAX(CAST(route_id AS UNSIGNED)) as max_id FROM routes WHERE project_id = ? AND user_id = ?",
        [project_id, user_id]
      );
      const lastId = rows[0].max_id || 0;
      const route_id = String(parseInt(lastId, 10) + 1).padStart(5, "0");

      const query = `
        INSERT INTO routes(route_id, user_id, agency_id, project_id, route_short_name, route_long_name, route_desc, route_type, route_url, route_color, route_text_color, route_sort_order)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await pool.execute(query, [
        route_id,
        user_id,
        agency_id,
        project_id,
        route_short_name,
        route_long_name,
        route_desc,
        route_type,
        route_url,
        route_color,
        route_text_color,
        route_sort_order,
      ]);
      res.status(201).json({
        message: "Route saved successfully",
        route_id: route_id,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },
};

module.exports = routeService;
