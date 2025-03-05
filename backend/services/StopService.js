const { pool } = require("../db.js");

const stopService = {
  getStopsByProjectId: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { project_id } = req.params;
      const [rows] = await pool.execute(
        `SELECT stop_id, stop_name, stop_lat, stop_lon 
         FROM stops
         WHERE user_id = ? AND project_id = ?`,
        [user_id, project_id]
      );
      res.json(rows);
    } catch (error) {
      console.error(
        `Error in getStopsByProjectId for project_id: ${req.params.project_id}:`,
        error
      );
      res.status(500).json({ error: "Server Error" });
    }
  },

  getStopById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { stop_id } = req.params;
      const [rows] = await pool.execute(
        `SELECT * FROM stops
        WHERE stop_id = ? AND user_id = ?`,
        [stop_id, user_id]
      );
      res.json(rows.length > 0 ? rows[0] : null);
    } catch (error) {
      console.error(
        `Error in getStopById for stop_id: ${req.params.stop_id}:`,
        error
      );
      res.status(500).json({ error: "Server Error" });
    }
  },

  deleteStopByStopId: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { stop_id } = req.params;
      await pool.execute(
        `DELETE FROM stops
        WHERE stop_id = ? AND user_id = ?`,
        [stop_id, user_id]
      );
      res.status(200).json({ message: "Stop deleted successfully" });
    } catch (error) {
      console.error(
        `Error in deleteStopByStopId for stop_id: ${req.params.stop_id}:`,
        error
      );
      res.status(500).json({ error: "Server Error" });
    }
  },

  updateStop: async (req, res) => {
    try {
      const user_id = req.user.id;
      const validFields = [
        "stop_id",
        "stop_code",
        "stop_name",
        "stop_desc",
        "stop_lat",
        "stop_lon",
        "zone_id",
        "stop_url",
        "location_type",
        "parent_station",
        "stop_timezone",
        "wheelchair_boarding",
        "project_id"        
      ]
      
      const {stop_id, ...params} = req.body;

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
        UPDATE stops 
        SET
         ${fields.join(", ")}
        WHERE stop_id = ? AND user_id = ?`;

      const [result] = await pool.execute(query, [...values, stop_id, user_id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Stop not found" });
      }

      res.status(200).json({ message: "Stop updated successfully" });
    } catch (error) {
      console.error(`Error in updateStop:`, error);
      res.status(500).json({ error: "Server Error" });
    }
  },

  saveStop: async (req, res) => {
    try {
      const user_id = req.user.id;
      const validFields = [
        "stop_id",
        "stop_code",
        "stop_name",
        "stop_desc",
        "stop_lat",
        "stop_lon",
        "zone_id",
        "stop_url",
        "location_type",
        "parent_station",
        "stop_timezone",
        "wheelchair_boarding",
        "project_id"        
      ]

      const {...params} = req.body;

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
        INSERT INTO stops (${fields.join(", ")})
        VALUES (${placeholders.join(", ")})
      `;
      const [result] = await pool.execute(query, values);

      res.status(201).json({
        message: "Stop saved successfully",
        stop_id: stop_id,
      });
    } catch (error) {
      console.error(`Error in saveStop:`, error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },
};

module.exports = stopService;
