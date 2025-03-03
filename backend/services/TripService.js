const { pool } = require("../db.js");

const tripService = {
  getTripsByRouteId: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { route_id } = req.params;
      const [rows] = await pool.execute(
        `
        SELECT * FROM trips
        WHERE user_id = ? AND route_id = ?
        `,
        [user_id, route_id]
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  },

  getTripsByProjectId: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { project_id } = req.params;
      const [rows] = await pool.execute(
        `
        SELECT * FROM trips
        WHERE user_id = ? AND project_id = ?
        `,
        [user_id, project_id]
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  },

  getTripById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { trip_id } = req.params;
      const [rows] = await pool.execute(
        `
        SELECT * FROM trips
        WHERE trip_id = ? AND user_id = ?
        `,
        [trip_id, user_id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: "Trip not found" });
      }
      res.json(rows[0]); 
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  },

  deleteTripById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { trip_id } = req.params;
      const [result] = await pool.execute(
        `
        DELETE FROM trips
        WHERE trip_id = ? AND user_id = ?
        `,
        [trip_id, user_id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Trip not found" });
      }
      res.status(200).json({ message: "Trip deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  },

  updateTrip: async (req, res) => {
    try {
      const user_id = req.user.id;
      const {
        trip_id,
        service_id,
        shape_id,
        route_id,
        project_id,
        trip_headsign,
        trip_short_name,
        direction_id,
        block_id,
        wheelchair_accessible,
        bikes_allowed,
      } = req.body;

      const query = `
        UPDATE trips
        SET
          service_id = ?,
          shape_id = ?,
          route_id = ?,
          trip_headsign = ?,
          trip_short_name = ?,
          direction_id = ?,
          block_id = ?,
          wheelchair_accessible = ?, 
          bikes_allowed = ?,
        WHERE trip_id = ? AND user_id = ? AND project_id = ?
      `;
      const [result] = await pool.execute(query, [
        service_id,
        shape_id,
        route_id,
        trip_headsign,
        trip_short_name,
        direction_id,
        block_id,
        wheelchair_accessible,
        bikes_allowed,
        agency_email,
        trip_id,
        user_id,
        project_id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Trip not found" });
      }
      res.status(200).json({ message: "Trip successfully updated" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  },

  saveTrip: async (req, res) => {
    try {
      const user_id = req.user.id;
      const {
        service_id,
        shape_id,
        route_id,
        project_id,
        trip_headsign,
        trip_short_name,
        direction_id,
        block_id,
        wheelchair_accessible,
        bikes_allowed,
      } = req.body;

      const [rows] = await pool.execute(
        "SELECT MAX(CAST(trip_id AS UNSIGNED)) as max_id FROM trips WHERE project_id = ? AND user_id = ?",
        [project_id, user_id]
      );
      const lastId = rows[0].max_id || 0;
      const trip_id = String(parseInt(lastId, 10) + 1).padStart(7, "0");

      const query = `
        INSERT INTO trips (trip_id, service_id, shape_id, route_id, user_id, project_id, trip_headsign, trip_short_name, direction_id, block_id, wheelchair_accessible, bikes_allowed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await pool.execute(query, [
        trip_id,
        service_id,
        shape_id,
        route_id,
        user_id,
        project_id,
        trip_headsign,
        trip_short_name,
        direction_id,
        block_id,
        wheelchair_accessible,
        bikes_allowed,
        agency_email,
      ]);

      res.status(201).json({
        message: "Trip successfully created",
        trip_id: trip_id,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  },
};

module.exports = tripService;
