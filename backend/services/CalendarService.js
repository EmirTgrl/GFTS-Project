const pool = require("../db.js");

const calendarService = {
    getCalendarsByRouteId: async (req, res) =>{
        try {
            const { route_id } = req.params;
            const [rows] = await pool.execute(
              `SELECT calendar.* FROM calendar
               JOIN trips ON calendar.service_id = trips.service_id
               WHERE trips.route_id = ?
               GROUP BY calendar.service_id`,
              [route_id]
            );
            res.json(rows);
          } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Server Error" });
          }
    }
};
module.exports = calendarService;