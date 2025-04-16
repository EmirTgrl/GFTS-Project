const { pool } = require("../db.js");

const statsService = {
  getGlobalStats: async (req, res) => {
    try {
      const [
        gtfsResult,
        agencyResult,
        stopsResult,
        routesResult,
        stopTimesResult,
        tripsResult,
        shapesResult,
      ] = await Promise.all([
        pool.query("SELECT COUNT(*) AS total FROM projects"),
        pool.query("SELECT COUNT(*) AS total FROM agency"),
        pool.query("SELECT COUNT(*) AS total FROM stops"),
        pool.query("SELECT COUNT(*) AS total FROM routes"),
        pool.query("SELECT COUNT(*) AS total FROM stop_times"),
        pool.query("SELECT COUNT(*) AS total FROM trips"),
        pool.query("SELECT COUNT(*) AS total FROM shapes"),
      ]);

      const gtfsRegistered = gtfsResult[0][0].total;
      const agencyRegistered = agencyResult[0][0].total;
      const stopsRegistered = stopsResult[0][0].total;
      const routesRegistered = routesResult[0][0].total;
      const stopTimesRegistered = stopTimesResult[0][0].total;
      const tripsRegistered = tripsResult[0][0].total;
      const shapesRegistered = shapesResult[0][0].total;

      res.status(200).json({
        gtfsRegistered,
        agencyRegistered,
        stopsRegistered,
        routesRegistered,
        stopTimesRegistered,
        tripsRegistered,
        shapesRegistered,
      });
    } catch (error) {
      console.error("Error fetching global stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};

module.exports = statsService;
