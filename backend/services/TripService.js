const {pool} = require("../db.js");

const tripService = {
  getTripsByProjectId: async (req,res) => {
    try {
      const user_id = req.user.id;
      const {project_id} = req.params;
      const [rows] = pool.execute(`
        SELECT * FROM trips
        WHERE user_id = ? AND project_id = ?
        `, [user_id, project_id]);
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({error:"server error"});
    }
  }
  ,
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
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "server error" });
    }
  },
  deleteTripById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { trip_id } = req.params;
      await pool.execute(
        `
            DELETE FROM trips
            WHERE trip_id = ? AND user_id = ?
          `,
        [trip_id, user_id]
      );
      res.status(200).json({ message: "trip deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "server error" });
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
        agency_email
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
            agency_email = ?
          WHERE trip_id = ? AND user_id = ? AND project_id = ?
        `;
      const result = await pool.execute(query, [
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
        project_id
      ]);
      if ((result.affectedRows = 0)) {
        return res.status(404).json({ error: "trip not found" });
      }
      res.status(200).json({ message: "trip successfully updated" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "server error" });
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
        agency_email
      } = req.body;
      const query = `
        INSERT INTO trips(service_id, shape_id, route_id, user_id, project_id, trip_headsign, trip_short_name, direction_id, block_id, wheelchair_accessible, bikes_allowed, agency_email)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
      `;
      const [result] = await pool.execute(query, [
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
        agency_email
      ]);
      res.status(201).json({
        message: "trip successfully created",
        trip_id: result.insertId,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "server error" });
    }
  },
};

module.exports = tripService;
