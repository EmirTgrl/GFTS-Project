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

  saveAgency: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { project_id, agency_name } = req.body;

      const [rows] = await pool.execute(
        "SELECT MAX(CAST(agency_id AS UNSIGNED)) as max_id FROM agency WHERE project_id = ? AND user_id = ?",
        [project_id, user_id]
      );
      const lastId = rows[0].max_id || 0;
      const agency_id = String(parseInt(lastId, 10) + 1).padStart(2, "0");

      const query = `
        INSERT INTO agency (agency_id, agency_name, agency_url, agency_timezone, agency_lang, agency_phone, project_id, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await pool.execute(query, [
        agency_id,
        agency_name,
        project_id,
        user_id,
      ]);
      res.status(201).json({
        message: "Agency saved successfully",
        agency_id: agency_id,
      });
    } catch (error) {
      console.error("Error in saveAgency:", error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  updateAgency: async (req, res) => {
    try {
      const user_id = req.user.id;
      const {
        agency_id,
        agency_name,
        agency_url,
        agency_timezone,
        agency_lang, 
        agency_phone, 
        project_id,
      } = req.body;

      if (!agency_name || !agency_url || !agency_timezone || !project_id) {
        return res.status(400).json({
          error:
            "Missing required fields: agency_name, agency_url, agency_timezone are mandatory",
        });
      }

      const query = `
        UPDATE agency
        SET 
          agency_name = ?,
          agency_url = ?,
          agency_timezone = ?,
          agency_lang = ?,
          agency_phone = ?
        WHERE agency_id = ? AND project_id = ? AND user_id = ?
      `;
      const [result] = await pool.execute(query, [
        agency_name,
        agency_url,
        agency_timezone,
        agency_lang || null,
        agency_phone || null, 
        agency_id,
        project_id,
        user_id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Agency not found" });
      }
      res.status(200).json({ message: "Agency updated successfully" });
    } catch (error) {
      console.error("Error in updateAgency:", error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  deleteAgencyById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { agency_id, project_id } = req.params;

      const [result] = await pool.execute(
        `
        DELETE FROM agency
        WHERE agency_id = ? AND project_id = ? AND user_id = ?
        `,
        [agency_id, project_id, user_id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Agency not found" });
      }
      res.status(200).json({ message: "Agency deleted successfully" });
    } catch (error) {
      console.error("Error in deleteAgencyById:", error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },
};

module.exports = agencyService;
