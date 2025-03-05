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
      const validFields = [
        "route_id",
        "project_id",
        "agency_id",
        "route_short_name",
        "route_long_name",
        "route_desc",
        "route_type",
        "route_url",
        "route_color",
        "route_text_color",
        "route_sort_order"
      ];
      const { route_id, ...params } = req.body;
      
      const fields = [];
      const values = [];

      for (const param in params) {
        if (validFields.includes(param)) {
          fields.push(`${param} = ?`);
          values.push(params[param]);
        } else {
          console.warn(`unexpected field ${param}`);
        }
      }
      
      const query = `
        UPDATE routes
        SET
          ${fields.join(", ")}
        WHERE route_id = ? AND user_id = ?
      `;
      const [result] = await pool.execute(query, [...values, route_id, user_id]);
      
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
      const validFields = [
        "project_id",
        "agency_id",
        "route_short_name",
        "route_long_name",
        "route_desc",
        "route_type",
        "route_url",
        "route_color",
        "route_text_color",
        "route_sort_order"
      ];
      const { ...params} = req.body;

      const fields = [];
      const values = [];
      const placeholders = [];

      for (const param in params) {
        if (validFields.includes(param)) {
          fields.push(param);
          values.push(params[param]);
          placeholders.push("?")
        } else {
          console.warn(`unexpected field in ${param}`);
        }
      }

      fields.push("user_id");
      placeholders.push("?");
      values.push(user_id);

      const query = `
        INSERT INTO routes(${fields.join(", ")})
        VALUES(${placeholders.join(", ")})
      `;

      const [result] = await pool.execute(query, values);

      res.status(201).json({
        message: "Route saved successfully",
        route_id: result.insertId,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },
};

module.exports = routeService;
