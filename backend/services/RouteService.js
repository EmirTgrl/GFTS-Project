const {pool} = require("../db.js");

const routeService = {
    getAllRoutes: async (req, res) =>{
        try {
            const [rows] = await pool.execute("SELECT * FROM routes");
            res.json(rows);
          } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Server Error" });
          }
    },
    // TODO: validation for route_id
    getRouteByRouteId: async (req,res) => {
      try {
        const {route_id} = req.params;
        const [rows] = await pool.execute(`
          SELECT * FROM routes
          WHERE route_id = ?`, [route_id]);
          res.json(rows);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" })
      }
    },
    // TODO: validation for route_id
    deleteRouteByRouteId: async (req,res) => {
      try {
        const {route_id} = req.params;
        await pool.execute(`
          DELETE FROM routes
          WHERE route_id = ?
          `, [route_id]);
          res.status(200).json({ message: "Route deleted successfully" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" })
      }
    },
    // TODO: validation for object
    updateRoute: async (req, res) => {
      try {
        const { route_id, agency_id, route_short_name, route_long_name, route_desc, route_type, route_url, route_color, route_text_color, route_sort_order} = req.body;
        const query = `
            UPDATE routes
            SET
              agency_id = ?, 
              route_short_name = ?, 
              route_long_name = ?, 
              route_desc = ?, 
              route_type = ?, 
              route_url = ?, 
              route_color = ?, 
              route_text_color = ?, 
              route_sort_order = ?
            WHERE route_id = ?
          `;
        const result = await pool.execute(query, [agency_id, route_short_name, route_long_name, route_desc, route_type, route_url, route_color, route_text_color, route_sort_order, route_id]);
        if (result.affectedRows == 0) {
          return res.status(404).json({ error: "Route not found" })
        }
  
        return res.status(200).json({ message: "Route successfully updated" });
      } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server Error" });
      }
    },
    // TODO: validation for object
    saveRoute: async (req, res) => {
      try {
        const { agency_id, route_short_name, route_long_name, route_desc, route_type, route_url, route_color, route_text_color, route_sort_order} = req.body;
        const query = `
          INSERT INTO calendar(agency_id, route_short_name, route_long_name, route_desc, route_type, route_url, route_color, route_text_color, route_sort_order)
          VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
        const [result] = await pool.execute(query,[agency_id, route_short_name, route_long_name, route_desc, route_type, route_url, route_color, route_text_color, route_sort_order])
        res.status(201).json({ message: "Route saved successfully", route_id: result.insertId });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error:"Server Error"});
      }
    }
    
};
module.exports = routeService;