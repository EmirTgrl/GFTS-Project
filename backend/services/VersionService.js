const { pool } = require("../db.js");

const versionService = {
  getAllVersions: async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT * FROM versions");
      res.status(200).json({ data: rows });
    } catch (error) {
      console.error("Error fetching versions:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },
};

module.exports = versionService;
