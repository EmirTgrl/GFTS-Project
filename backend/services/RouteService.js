const { pool } = require("../db.js");

const routeService = {
  getRoutesByProjectId: async (req, res) => {
    try {
      const user_id = req.user.id;
      const {project_id} = req.params;
      const [rows] = await pool.execute(
        `SELECT * FROM routes 
         WHERE project_id = ? AND user_id = ?`,
        [project_id, user_id]
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },
  getRouteById: async (req, res) => {
    try {
      const user_id = req.user.id; 
      const { route_id } = req.params;
      const [rows] = await pool.execute(
        `SELECT * FROM routes 
        WHERE user_id = ?  AND route_id = ?`
        [user_id, route_id]
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },
  deleteRouteById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { route_id } = req.params;
      await pool.execute(`
        DELETE FROM routes 
        WHERE route_id = ? AND user_id = ?`, 
        [route_id,user_id]
    );
      res.status(200).json({ message: "Route deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },
  updateRoute: async (req, res) => {
    try {
      const user_id = req.user.id; 
      const {
        route_id,
        agency_id,
        route_short_name,
        route_long_name,
        route_desc,
        route_type,
        route_url,
        route_color,
        route_text_color,
        route_sort_order,
        continuous_pickup,
        continuous_drop_off
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
                  route_sort_order = ?
                  continuous_pickup = ?,
                  continuous_drop_off = ?
                WHERE route_id = ? AND user_id = ?
              `;
      const result = await pool.execute(query, [
        agency_id,
        route_short_name,
        route_long_name,
        route_desc,
        route_type,
        route_url,
        route_color,
        route_text_color,
        route_sort_order,
        continuous_pickup,
        continuous_drop_off,
        route_id,
        user_id,
      ]);
      if (result.affectedRows == 0) {
        return res.status(404).json({ error: "Route not found" });
      }

      return res.status(200).json({ message: "Route successfully updated" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server Error" });
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
        continuous_pickup,
        continuous_drop_off
      } = req.body;
      const query = `
              INSERT INTO routes(user_id, agency_id, project_id, route_short_name, route_long_name, route_desc, route_type, route_url, route_color, route_text_color, route_sort_order, continuous_pickup, continuous_drop_off)
              VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `;
      const [result] = await pool.execute(query, [
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
        continuous_pickup, 
        continuous_drop_off
      ]);
      res.status(201).json({
        message: "Route saved successfully",
        route_id: result.insertId,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },
};

module.exports = routeService;
