const { pool } = require("../db.js");

const agencyService = {
  getAgenciesByProjectId: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { project_id } = req.params;
      const [rows] = await pool.execute(
        `SELECT agency_id, agency_name 
         FROM agency 
         WHERE user_id = ? AND project_id = ?`,
        [user_id, project_id]
      );
      res.json(rows.length > 0 ? rows : []);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },
};

module.exports = agencyService;
