const pool = require("../db.js");

const calendarService = {
  getCalendarsByRouteId: async (req, res) => {
    try {
      const userId = req.user.id;
      const { route_id } = req.params;
      const [rows] = await pool.execute(
        `SELECT DISTINCT calendar.* FROM calendar
                 JOIN trips ON calendar.service_id = trips.service_id
                 JOIN imported_data ON calendar.import_id = imported_data.import_id
                 WHERE trips.route_id = ? AND imported_data.id = ?`,
        [route_id, userId]
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },
};

module.exports = calendarService;
