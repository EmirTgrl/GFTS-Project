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
    getStopTimeById: async (req,res) => {
      try {
        const {trip_id, stop_id} = req.params;
        const [rows] = await pool.execute(`
          SELECT * FROM stop_times
          WHERE stop_id = ?
          AND trip_id = ?
          `, [stop_id, trip_id]);
          res.json(rows);
      } catch (error) {
        console.error(error)
        res.status(500).json({error:"server error"});
      }      
    },
    deleteStopTimeById: async (req,res) => {
      try {
        const {trip_id, stop_id} = req.params;
        await pool.execute(`
          DELETE FROM stop_times
          WHERE stop_id = ?
          AND trip_id = ?
          `, [stop_id, trip_id]);
          res.status(200).json({message:"stop time successfully deleted"});
      } catch (error) {
        console.error(error)
        res.status(500).json({error:"server error"});
      }      
    },
    updateStopTime: async (req,res) => {
      try {
        const {trip_id, stop_id, arrival_time, departure_time, stop_sequence, stop_headsign, pickup_type, drop_off_time, shape_dist_travelled, timepoint} = req.body;
        const query = `
          UPDATE calendar
          SET
            arrival_time = ?,
            departure_time = ?,
            stop_sequence = ?,
            stop_headsign = ?,
            pickup_type = ?,
            drop_off_time = ?,
            shape_dist_travelled = ?,
            timepoint = ?   
          WHERE stop_id = ? AND trip_id = ?       
          `;
        const result = await pool.execute(query,[arrival_time, departure_time, stop_sequence, stop_headsign, pickup_type, drop_off_time, shape_dist_travelled, timepoint, stop_id, trip_id]);   
        if (result.affectedRows == 0) {
          return res.status(404).json({error: "stop time not found"})
        }
        res.status(200).json({message: "stop time updated successfully"});
        
      } catch (error) {
        console.error(error)
        res.status(500).json({error:"server error"});
      }      
    },
    saveStopTime: async (req,res) => {
      try {
        const {stop_id, trip_id, arrival_time, departure_time, stop_sequence, stop_headsign, pickup_type, drop_off_time, shape_dist_travelled, timepoint} = req.body;
        const query = `
          INSERT INTO calendar(stop_id, trip_id, arrival_time, departure_time, stop_sequence, stop_headsign, pickup_type, drop_off_time, shape_dist_travelled, timepoint)
          VALUES(?,?,?,?,?,?,?,?,?,?)   
          `;
        const result = await pool.execute(query,[stop_id, trip_id, arrival_time, departure_time, stop_sequence, stop_headsign, pickup_type, drop_off_time, shape_dist_travelled, timepoint]);   
        res.status(200).json({message: "stop time updated successfully"});
      } catch (error) {
        console.error(error)
        res.status(500).json({error:"server error"});
      }      
    }
};
module.exports = stopTimeService;