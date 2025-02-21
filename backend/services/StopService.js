const {pool} = require("../db.js");

const stopService = {
  getAllStops: async (req, res) => {
    try {
      const userId = req.user.id;
      const [rows] = await pool.execute(
        `SELECT DISTINCT stops.* FROM stops 
                 JOIN imported_data ON stops.import_id = imported_data.import_id
                 WHERE imported_data.id = ?`,
        [userId]
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },

  getStopsByRouteId: async (req, res) => {
    try {
      const userId = req.user.id;
      const { route_id } = req.params;
      const [rows] = await pool.execute(
        `SELECT DISTINCT stops.* FROM stops 
                 JOIN stop_times ON stops.stop_id = stop_times.stop_id 
                 JOIN trips ON stop_times.trip_id = trips.trip_id
                 JOIN imported_data ON stops.import_id = imported_data.import_id
                 WHERE trips.route_id = ? AND imported_data.id = ?`,
        [route_id, userId]
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },

  getStopById: async (req, res) => {
    try {
      const userId = req.user.id;
      const { stop_id } = req.params;
      const [rows] = await pool.execute(
        `SELECT DISTINCT stops.* FROM stops
                 JOIN stop_times ON stops.stop_id = stop_times.stop_id
                 JOIN trips ON stop_times.trip_id = trips.trip_id
                 JOIN routes ON trips.route_id = routes.route_id
                 WHERE stops.stop_id = ? AND routes.id = ?`,
        [stop_id, userId]
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },

  deleteStopById: async (req, res) => {
    try {
      const userId = req.user.id;
      const { stop_id } = req.params;
      await pool.execute(
        `DELETE stops FROM stops
                 JOIN stop_times ON stops.stop_id = stop_times.stop_id
                 JOIN trips ON stop_times.trip_id = trips.trip_id
                 JOIN routes ON trips.route_id = routes.route_id
                 WHERE stops.stop_id = ? AND routes.id = ?`,
        [stop_id, userId]
      );
      res.status(200).json({ message: "Stop deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },

  updateStop: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        stop_id,
        stop_code,
        stop_name,
        stop_desc,
        stop_lat,
        stop_lon,
        zone_id,
        stop_url,
        location_type,
        parent_station,
        stop_timezone,
        wheelchair_boarding,
      } = req.body;

      const [checkAccess] = await pool.execute(
        `SELECT 1 FROM stops
                 JOIN stop_times ON stops.stop_id = stop_times.stop_id
                 JOIN trips ON stop_times.trip_id = trips.trip_id
                 JOIN routes ON trips.route_id = routes.route_id
                 WHERE stops.stop_id = ? AND routes.id = ?
                 LIMIT 1`,
        [stop_id, userId]
      );

      if (checkAccess.length === 0) {
        return res.status(403).json({ error: "Access denied" });
      }

      const query = `
                UPDATE stops 
                SET stop_code = ?,
                    stop_name = ?,
                    stop_desc = ?,
                    stop_lat = ?,
                    stop_lon = ?,
                    zone_id = ?,
                    stop_url = ?,
                    location_type = ?,
                    parent_station = ?,
                    stop_timezone = ?,
                    wheelchair_boarding = ?
                WHERE stop_id = ?`;

      await pool.execute(query, [
        stop_code,
        stop_name,
        stop_desc,
        stop_lat,
        stop_lon,
        zone_id,
        stop_url,
        location_type,
        parent_station,
        stop_timezone,
        wheelchair_boarding,
        stop_id,
      ]);

      res.status(200).json({ message: "Stop updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },

  saveStop: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        stop_code,
        stop_name,
        stop_desc,
        stop_lat,
        stop_lon,
        zone_id,
        stop_url,
        location_type,
        parent_station,
        stop_timezone,
        wheelchair_boarding,
        route_id,
      } = req.body;

      // Check if user has access to the route
      const [checkRoute] = await pool.execute(
        "SELECT 1 FROM routes WHERE route_id = ? AND id = ?",
        [route_id, userId]
      );

      if (checkRoute.length === 0) {
        return res.status(403).json({ error: "Access denied" });
      }

      const query = `
                INSERT INTO stops (
                    stop_code,
                    stop_name,
                    stop_desc,
                    stop_lat,
                    stop_lon,
                    zone_id,
                    stop_url,
                    location_type,
                    parent_station,
                    stop_timezone,
                    wheelchair_boarding
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const [result] = await pool.execute(query, [
        stop_code,
        stop_name,
        stop_desc,
        stop_lat,
        stop_lon,
        zone_id,
        stop_url,
        location_type,
        parent_station,
        stop_timezone,
        wheelchair_boarding,
      ]);

      res.status(201).json({
        message: "Stop saved successfully",
        stop_id: result.insertId,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },
};

module.exports = stopService;
