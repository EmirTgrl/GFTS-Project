const pool = require("../db.js")

const stopTimeService = {
    getTimesByRouteId: async (req, res) =>{
        try {
            const { route_id } = req.params;
            const [rows] = await pool.execute(
              `SELECT stops.stop_id, stops.stop_name, stop_times.arrival_time, stop_times.departure_time
               FROM stop_times
               JOIN stops ON stop_times.stop_id = stops.stop_id
               JOIN trips ON stop_times.trip_id = trips.trip_id
               WHERE trips.route_id = ?
               ORDER BY stop_times.arrival_time`,
              [route_id]
            );
            res.json(rows);
          } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Server Error" });
          }
    },
};
module.exports = stopTimeService;