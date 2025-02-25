const { pool } = require("../db.js");

const stopTimeService = {
  getStopsAndStopTimes: async (req,res) => {
    try {
      const user_id = req.user.id;
      const {trip_id} = req.params;
      const [rows] = await pool.execute(`
        SELECT * FROM stop_times
        LEFT OUTER JOIN stops 
        ON stop_times.stop_id = stops.stop_id
        WHERE user_id = ? AND trip_id = ? 
        `,[user_id, trip_id]);
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({error:"server error"});
    }
  },
  getStopTimesByProjectId: async (req,res) => {
    try {
      const user_id = req.user.id;
      const {project_id} = req.params;
      const [rows] = await pool.execute(`
        SELECT * FROM stop_times
        WHERE project_id = ? AND user_id = ?;
        `, [project_id,user_id]);
        res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({error:"server error"});
    }
  },
  getStopTimeById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { trip_id, stop_id } = req.params;
      const [rows] = await pool.execute(
        `SELECT * FROM stop_times
        WHERE user_id = ? AND trip_id = ? AND stop_id = ?`,
        [user_id, trip_id, stop_id]
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },
  deleteStopTimeById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { trip_id, stop_id } = req.params;
      await pool.execute(
        `DELETE FROM stop_times
        WHERE user_id = ? AND trip_id = ? AND stop_id = ?`,
        [user_id, trip_id, stop_id]
      );
      res.status(200).json({ message: "Stop time deleted successfully" });
    } catch (error) {
      console.error(error);
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
        drop_off_time,
        shape_dist_travelled,
      } = req.body;

      const query = `
                UPDATE stop_times
                SET arrival_time = ?,
                    departure_time = ?,
                    stop_sequence = ?,
                    stop_headsign = ?,
                    pickup_type = ?,
                    drop_off_time = ?,
                    shape_dist_travelled = ?,
                WHERE trip_id = ? AND stop_id = ? AND user_id = ? AND project_id = ?`;

      await pool.execute(query, [
        arrival_time,
        departure_time,
        stop_sequence,
        stop_headsign,
        pickup_type,
        drop_off_time,
        shape_dist_travelled,
        trip_id,
        stop_id,
        user_id,
        project_id
      ]);

      res.status(200).json({ message: "Stop time updated successfully" });
    } catch (error) {
      console.error(error);
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
        drop_off_time,
        shape_dist_travelled
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
                    drop_off_time,
                    shape_dist_travelled,
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
        drop_off_time,
        shape_dist_travelled,
      ]);

      res.status(201).json({ message: "Stop time saved successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },
};

module.exports = stopTimeService;
