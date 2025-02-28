const { pool } = require("../db.js");

const stopTimeService = {
  getStopsAndStopTimes: async (req, res) => {
    try { 
      const user_id = req.user.id;
      const { trip_id } = req.params;  
      const [rows] = await pool.execute(`SELECT * FROM stop_times st
        LEFT OUTER JOIN stops s
        ON st.stop_id = s.stop_id
        WHERE st.user_id = ? AND st.trip_id = ? `, [user_id, trip_id]);
      res.json(rows);
    } catch (error) {
      console.error(
        `Error in getStopsAndStopTimes for trip_id: ${req.params.trip_id}, project_id: ${req.params.project_id}:`,
        error
      );
      res.status(500).json({ error: "Server error", details: error.message });
    }
  },

  getStopTimesByProjectId: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { project_id } = req.params;
      const [rows] = await pool.execute(
        `
        SELECT * FROM stop_times
        WHERE project_id = ? AND user_id = ?
        `,
        [project_id, user_id]
      );
      res.json(rows);
    } catch (error) {
      console.error(
        `Error in getStopTimesByProjectId for project_id: ${req.params.project_id}:`,
        error
      );
      res.status(500).json({ error: "Server error" });
    }
  },

  getStopTimeById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { trip_id, stop_id } = req.params;
      const [rows] = await pool.execute(
        `
        SELECT * FROM stop_times
        WHERE user_id = ? AND trip_id = ? AND stop_id = ?
        `,
        [user_id, trip_id, stop_id]
      );
      res.json(rows.length > 0 ? rows[0] : null);
    } catch (error) {
      console.error(
        `Error in getStopTimeById for trip_id: ${req.params.trip_id}, stop_id: ${req.params.stop_id}:`,
        error
      );
      res.status(500).json({ error: "Server Error" });
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
      const {
        trip_id,
        stop_id,
        project_id,
        arrival_time,
        departure_time,
        stop_sequence,
        stop_headsign,
        pickup_type,
        drop_off_type,
        shape_dist_traveled,
      } = req.body;

      const query = `
        UPDATE stop_times
        SET arrival_time = ?,
            departure_time = ?,
            stop_sequence = ?,
            stop_headsign = ?,
            pickup_type = ?,
            drop_off_type = ?,
            shape_dist_traveled = ?
        WHERE trip_id = ? AND stop_id = ? AND user_id = ? AND project_id = ?`;

      await pool.execute(query, [
        arrival_time,
        departure_time,
        stop_sequence,
        stop_headsign,
        pickup_type,
        drop_off_type,
        shape_dist_traveled,
        trip_id,
        stop_id,
        user_id,
        project_id,
      ]);

      res.status(200).json({ message: "Stop time updated successfully" });
    } catch (error) {
      console.error(`Error in updateStopTime:`, error);
      res.status(500).json({ error: "Server Error" });
    }
  },

  saveStopTime: async (req, res) => {
    try {
      const user_id = req.user.id;
      const {
        trip_id,
        stop_id,
        project_id,
        arrival_time,
        departure_time,
        stop_sequence,
        stop_headsign,
        pickup_type,
        drop_off_type,
        shape_dist_traveled,
      } = req.body;

      const query = `
        INSERT INTO stop_times (
          trip_id,
          stop_id,
          user_id,
          project_id,
          arrival_time,
          departure_time,
          stop_sequence,
          stop_headsign,
          pickup_type,
          drop_off_type,
          shape_dist_traveled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      await pool.execute(query, [
        trip_id,
        stop_id,
        user_id,
        project_id,
        arrival_time,
        departure_time,
        stop_sequence,
        stop_headsign,
        pickup_type,
        drop_off_type,
        shape_dist_traveled,
      ]);

      res.status(201).json({ message: "Stop time saved successfully" });
    } catch (error) {
      console.error(`Error in saveStopTime:`, error);
      res.status(500).json({ error: "Server Error" });
    }
  },
};

module.exports = stopTimeService;
