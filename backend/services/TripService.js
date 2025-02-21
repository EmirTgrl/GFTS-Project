const {pool} = require("../db.js");

const tripService = {
  //TODO: move this to another service or fix naming also improve
  getTripsByRouteId: async (req, res) => {
    try {
      const userId = req.user.id;
      const { route_id } = req.params;

      const [trips] = await pool.execute(
        `SELECT trips.* FROM trips
                 JOIN imported_data ON trips.import_id = imported_data.import_id
                 WHERE trips.route_id = ? AND imported_data.id = ?`,
        [route_id, userId]
      );

      const [stopTimes] = await pool.execute(
        `SELECT stop_times.*, stops.stop_name 
                 FROM stop_times
                 JOIN stops ON stop_times.stop_id = stops.stop_id
                 JOIN imported_data ON stop_times.import_id = imported_data.import_id
                 WHERE stop_times.trip_id IN (
                     SELECT trip_id FROM trips 
                     WHERE route_id = ? AND import_id IN (
                         SELECT import_id FROM imported_data WHERE id = ?
                     )
                 )
                 ORDER BY stop_sequence`,
        [route_id, userId]
      );

      const tripsWithTimes = trips.map((trip) => ({
        ...trip,
        stop_times: stopTimes.filter((st) => st.trip_id === trip.trip_id),
      }));

      res.json(tripsWithTimes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },
  //TODO: move this to another service or fix naming
  getTripsAndStopsByRouteId: async (req, res) => {
    try {
      const { route_id } = req.params;

      const [buses] = await pool.execute(
        `SELECT trips.trip_id, stop_times.stop_id, stops.stop_name, 
                      stop_times.arrival_time, stop_times.departure_time
               FROM stop_times
               JOIN stops ON stop_times.stop_id = stops.stop_id
               JOIN trips ON stop_times.trip_id = trips.trip_id
               WHERE trips.route_id = ?
               ORDER BY stop_times.stop_id, stop_times.arrival_time`,
        [route_id]
      );

      res.json(buses);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },
  getTripById: async (req, res) => {
    try {
      const { trip_id } = req.params;
      const [rows] = await pool.execute(
        `
          SELECT * FROM trips
          WHERE trip.trip_id
          `,
        [trip_id]
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "server error" });
    }
  },
  deleteTripById: async (req, res) => {
    try {
      const { trip_id } = req.params;
      await pool.execute(
        `
            DELETE FROM trips
            WHERE trip.trip_id = ?
          `,
        [trip_id]
      );
      res.status(200).json({ message: "trip deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "server error" });
    }
  },
  updateTrip: async (req, res) => {
    try {
      const {
        trip_id,
        service_id,
        route_id,
        trip_headsign,
        trip_short_name,
        direction_id,
        block_id,
        shape_id,
        wheelchair_accessible,
        bike_accessible,
      } = req.body;
      const query = `
          UPDATE trips
          SET
            service_id = ?,
            route_id = ?,
            trip_headsign = ?,
            trip_short_name = ?,
            direction_id = ?,
            block_id = ?,
            shape_id = ?,
            wheelchair_accessible = ?, 
            bike_accessible = ?
          WHERE trip_id = ?
        `;
      const result = await pool.execute(query, [
        service_id,
        route_id,
        trip_headsign,
        trip_short_name,
        direction_id,
        block_id,
        shape_id,
        wheelchair_accessible,
        bike_accessible,
        trip_id,
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
      const {
        service_id,
        route_id,
        trip_headsign,
        trip_short_name,
        direction_id,
        block_id,
        shape_id,
        wheelchair_accessible,
        bike_accessible,
      } = req.body;
      const query = `
        INSERT INTO trips(service_id, route_id, trip_headsign, trip_short_name, direction_id, block_id, shape_id, wheelchair_accessible, bike_accessible)
        VALUES(?,?,?,?,?,?,?,?,?)
      `;
      const [result] = await pool.execute(query, [
        service_id,
        route_id,
        trip_headsign,
        trip_short_name,
        direction_id,
        block_id,
        shape_id,
        wheelchair_accessible,
        bike_accessible,
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
