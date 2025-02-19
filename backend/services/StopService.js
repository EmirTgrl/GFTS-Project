const pool = require("../db.js");

const stopService = {
    getAllStops: async (req,res) => {
        try {
            const [rows] = await pool.execute("SELECT * FROM stops");
            res.json(rows);
        }catch(e){
            console.error(e);
            res.status(500).json({error: "Server Error"});
        }
    },
    getStopsByRouteId: async (req,res) => {
        try {
            const { route_id } = req.params;
            const [rows] = await pool.execute(
              `SELECT stops.* FROM stops 
               JOIN stop_times ON stops.stop_id = stop_times.stop_id 
               JOIN trips ON stop_times.trip_id = trips.trip_id
               WHERE trips.route_id = ?`,
              [route_id]
            );
            res.json(rows);
          } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Server Error" });
          }
    }
    
};
module.exports = stopService;