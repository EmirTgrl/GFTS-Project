const { pool } = require("../db.js");

const stopTimeService = {
  getStopsAndStopTimesByQuery: async (req, res) => {
    const user_id = req.user.id;
    const validFields = [
      "trip_id",
      "stop_id",
      "project_id",
      "arrival_time",
      "departure_time",
      "stop_sequence",
      "stop_headsign",
      "pickup_type",
      "drop_off_type",
      "shape_dist_traveled",
      "timepoint",
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
  
    let query = `SELECT * FROM stop_times 
    WHERE ${fields.join(" AND ")}`;
  
    try {
      const [rows] = await pool.execute(query, values);
      res.json(rows.length > 0 ? rows : []);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  deleteStopTimeById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { trip_id, stop_id } = req.params;
      await pool.execute(
        `
        DELETE FROM stop_times
        WHERE user_id = ? AND trip_id = ? AND stop_id = ?
        `,
        [user_id, trip_id, stop_id]
      );
      res.status(200).json({ message: "Stop time deleted successfully" });
    } catch (error) {
      console.error(
        `Error in deleteStopTimeById for trip_id: ${req.params.trip_id}, stop_id: ${req.params.stop_id}:`,
        error
      );
      res.status(500).json({ error: "Server Error" });
    }
  },

  updateStopTime: async (req, res) => {
    try {
      const user_id = req.user.id;
      const validFields = [
        "trip_id",
        "stop_id",
        "project_id",
        "arrival_time",
        "departure_time",
        "stop_sequence",
        "stop_headsign",
        "pickup_type",
        "drop_off_type",
        "shape_dist_traveled",
        "timepoint"
      ];

      const {trip_id , stop_id, ...params} = req.body;

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
        UPDATE stop_times
        SET 
          ${fields.join(", ")}
        WHERE trip_id = ? AND stop_id = ? AND user_id = ?`;

      const [result] = await pool.execute(query, [
        ...values, trip_id, stop_id, user_id
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Stop time not found" });
      }

      res.status(200).json({ message: "Stop time updated successfully" });
    } catch (error) {
      console.error(`Error in updateStopTime:`, error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  saveStopTime: async (req, res) => {
    try {
      const user_id = req.user.id;
      const validFields = [
        "trip_id",
        "stop_id",
        "project_id",
        "arrival_time",
        "departure_time",
        "stop_sequence",
        "stop_headsign",
        "pickup_type",
        "drop_off_type",
        "shape_dist_traveled",
        "timepoint",
       ];

      const params = req.body;

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
        INSERT INTO stop_times (${fields.join(", ")}) 
        VALUES (${placeholders.join(", ")})
      `;

      const [result] = await pool.execute(query, values);

      res
        .status(201)
        .json({ message: "Stop time saved successfully", id: result.insertId });
    } catch (error) {
      console.error(`Error in saveStopTime:`, error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },
};

module.exports = stopTimeService;
