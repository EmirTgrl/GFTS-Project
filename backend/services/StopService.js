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
    },
    getStopById: async (req, res) => {
      try {
        const { stop_id } = req.params;
        const [rows] = await pool.execute(
          `SELECT * FROM stops
            WHERE stop.stop_id = ?`,
          [stop_id]
        );
        res.json(rows);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" })
      }
    },
    deleteStopById: async (req,res) =>{
      try {
        const { stop_id } = req.params;
        await pool.execute(`
          DELETE FROM stops
          WHERE stop_id = ?
          `, [stop_id])
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "server error" })
      }
    },
    updateStop: async (req,res) => {
      try {
        const {stop_id, stop_code, stop_name, stop_desc, stop_lat, stop_lon, zone_id, stop_url, location_type, parent_station, stop_timezone, wheelchair_boarding} = req.body;
        const query = `
          UPDATE stops
          SET
            stop_code = ?,
            stop_name = ?,
            stop_desc = ?,
            stop_lat = ?,
            stop_lon = ?,
            zone_id = ?,
            stop_url = ?,
            location_type = ?,
            parent_station = ?,
            stop_timezone = ?,
            wheelchair_boarding = ?
          WHERE stop_id = ? 
        `;
        const result = await pool.execute(query, [stop_code, stop_name, stop_desc, stop_lat, stop_lon, zone_id, stop_url, location_type, parent_station, stop_timezone, wheelchair_boarding, stop_id]);
        if(result.affectedRows == 0){
          return res.status(404).json({ error: "stop not found" });
        }
        res.status(200).json({ message: "stop successfuly updated"});
      } catch (error) {
        console.error(error);
        res.status(500).json({error: "server error"});
      }
    },
    saveStop: async (req,res) => {
      try {
        const {stop_code, stop_name, stop_desc, stop_lat, stop_lon, zone_id, stop_url, location_type, parent_station, stop_timezone, wheelchair_boarding} = req.body;
        const query = `
        INSERT INTO stops(stop_code, stop_name, stop_desc, stop_lat, stop_lon, zone_id, stop_url, location_type, parent_station, stop_timezone, wheelchair_boarding)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await pool.execute(query, [stop_code, stop_name, stop_desc, stop_lat, stop_lon, zone_id, stop_url, location_type, parent_station, stop_timezone, wheelchair_boarding]);
        res.status(201).json({message: "stop saved succesfully", stop_id: result.insertId});
      } catch (error) {
        console.error(error);
        res.status(500).json({error: "server errro"});
      }
    }
    
};
module.exports = stopService;