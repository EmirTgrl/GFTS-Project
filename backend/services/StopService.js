const { pool } = require("../db.js");

const stopService = {
  getStopsByQuery: async (req, res) => {
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
    ];
  
    const fields = [];
    const values = [];
    fields.push("user_id = ?")
    values.push(user_id);
  
    for (const param in req.query) {
      if (validFields.includes(param)) {
        fields.push(`${param} = ?`); 
        values.push(req.query[param]); 
      } else {
        console.warn(`Unexpected query parameter: ${param}`); // Log unexpected parameter
      }
    }
  
    let query = `SELECT * FROM projects 
    WHERE ${fields.join(" AND ")}`;
  
    try {
      const [rows] = await pool.execute(query, values);
      res.json(rows.length > 0 ? rows : []);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
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
        stop_id: result.insertId
      });
    } catch (error) {
      console.error(`Error in saveStop:`, error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },
};

module.exports = stopService;
