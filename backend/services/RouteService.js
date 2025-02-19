const pool = require("../db.js");

const routeService = {
    getAllRoutes: async (req, res) =>{
        try {
            const [rows] = await pool.execute("SELECT * FROM routes");
            res.json(rows);
          } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Server Error" });
          }
    }
};
module.exports = routeService;