const {pool} = require("../db.js")

const stopTimeService = {
  getTimesByRouteId: async (req, res) => {
    try {
      const userId = req.user.id;
      const { route_id } = req.params;
      const [rows] = await pool.execute(
        `SELECT stop_times.*, stops.stop_name 
                 FROM stop_times
                 JOIN stops ON stop_times.stop_id = stops.stop_id
                 JOIN trips ON stop_times.trip_id = trips.trip_id
                 JOIN imported_data ON stop_times.import_id = imported_data.import_id
                 WHERE trips.route_id = ? AND imported_data.id = ?
                 ORDER BY stop_sequence`,
        [route_id, userId]
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },

  getStopTimeById: async (req, res) => {
    try {
      const userId = req.user.id;
      const { trip_id, stop_id } = req.params;
      const [rows] = await pool.execute(
        `SELECT stop_times.* FROM stop_times
                 JOIN trips ON stop_times.trip_id = trips.trip_id
                 JOIN routes ON trips.route_id = routes.route_id
                 WHERE stop_times.stop_id = ? 
                 AND stop_times.trip_id = ?
                 AND routes.id = ?`,
        [stop_id, trip_id, userId]
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },

  deleteStopTimeById: async (req, res) => {
    try {
      const userId = req.user.id;
      const { trip_id, stop_id } = req.params;
      await pool.execute(
        `DELETE stop_times FROM stop_times
                 JOIN trips ON stop_times.trip_id = trips.trip_id
                 JOIN routes ON trips.route_id = routes.route_id
                 WHERE stop_times.stop_id = ?
                 AND stop_times.trip_id = ?
                 AND routes.id = ?`,
        [stop_id, trip_id, userId]
      );
      res.status(200).json({ message: "Stop time deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },

  updateStopTime: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        trip_id,
        stop_id,
        arrival_time,
        departure_time,
        stop_sequence,
        stop_headsign,
        pickup_type,
        drop_off_time,
        shape_dist_travelled,
        timepoint,
      } = req.body;

      // Check user access
      const [checkAccess] = await pool.execute(
        `SELECT 1 FROM trips
                 JOIN routes ON trips.route_id = routes.route_id
                 WHERE trips.trip_id = ? AND routes.id = ?`,
        [trip_id, userId]
      );

      if (checkAccess.length === 0) {
        return res.status(403).json({ error: "Access denied" });
      }

      const query = `
                UPDATE stop_times
                SET arrival_time = ?,
                    departure_time = ?,
                    stop_sequence = ?,
                    stop_headsign = ?,
                    pickup_type = ?,
                    drop_off_time = ?,
                    shape_dist_travelled = ?,
                    timepoint = ?
                WHERE trip_id = ? AND stop_id = ?`;

      await pool.execute(query, [
        arrival_time,
        departure_time,
        stop_sequence,
        stop_headsign,
        pickup_type,
        drop_off_time,
        shape_dist_travelled,
        timepoint,
        trip_id,
        stop_id,
      ]);

      res.status(200).json({ message: "Stop time updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },

  saveStopTime: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        trip_id,
        stop_id,
        arrival_time,
        departure_time,
        stop_sequence,
        stop_headsign,
        pickup_type,
        drop_off_time,
        shape_dist_travelled,
        timepoint,
      } = req.body;

      // Check user access
      const [checkAccess] = await pool.execute(
        `SELECT 1 FROM trips
                 JOIN routes ON trips.route_id = routes.route_id
                 WHERE trips.trip_id = ? AND routes.id = ?`,
        [trip_id, userId]
      );

      if (checkAccess.length === 0) {
        return res.status(403).json({ error: "Access denied" });
      }

      const query = `
                INSERT INTO stop_times (
                    trip_id,
                    stop_id,
                    arrival_time,
                    departure_time,
                    stop_sequence,
                    stop_headsign,
                    pickup_type,
                    drop_off_time,
                    shape_dist_travelled,
                    timepoint
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      await pool.execute(query, [
        trip_id,
        stop_id,
        arrival_time,
        departure_time,
        stop_sequence,
        stop_headsign,
        pickup_type,
        drop_off_time,
        shape_dist_travelled,
        timepoint,
      ]);

      res.status(201).json({ message: "Stop time saved successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },
};

module.exports = stopTimeService;
