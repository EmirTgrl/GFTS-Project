const { pool } = require("../db.js");

const agencyService = {
  getAgencyByQuery: async (req, res) => {
    const user_id = req.user.id;
    const validFields = [
      "agency_id",
      "agency_name",
      "agency_url",
      "agency_timezone",
      "agency_lang",
      "agency_phone",
      "project_id",
    ];

    const fields = [];
    const values = [];
    fields.push("user_id = ?");
    values.push(user_id);

    for (const param in req.query) {
      if (validFields.includes(param)) {
        if (param === "agency_name") {
          fields.push(`${param} LIKE ?`);
          values.push(`%${req.query[param]}%`);
        } else {
          fields.push(`${param} = ?`);
          values.push(req.query[param]);
        }
      } else if (param !== "page" && param !== "limit") {
        console.warn(`Unexpected query parameter: ${param}`);
      }
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 8;
    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM agency
      WHERE ${fields.join(" AND ")}
    `;

    const dataQuery = `
      SELECT a.*
      FROM agency a
      WHERE ${fields.join(" AND ")}
      LIMIT ${limit} OFFSET ${offset}
    `;

    try {
      const [countRows] = await pool.query(countQuery, values);
      const total = countRows[0].total;

      const [dataRows] = await pool.query(dataQuery, values);

      res.json({
        data: dataRows.length > 0 ? dataRows : [],
        total: total,
      });
    } catch (error) {
      console.error("Query execution error:", error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  saveAgency: async (req, res) => {
    try {
      const user_id = req.user.id;
      const validFields = [
        "agency_id", // agency_id’yi zorunlu alan olarak ekledik
        "agency_name",
        "agency_url",
        "agency_timezone",
        "agency_lang",
        "agency_phone",
        "project_id",
      ];
      const { agency_id, ...params } = req.body;

      // agency_id gelip gelmediğini kontrol et
      if (!agency_id) {
        return res.status(400).json({ error: "agency_id is required" });
      }

      const fields = [];
      const values = [];
      const placeholders = [];

      fields.push("agency_id");
      values.push(agency_id);
      placeholders.push("?");

      for (const param in params) {
        if (validFields.includes(param)) {
          fields.push(param);
          values.push(params[param]);
          placeholders.push("?");
        } else {
          console.warn(`unexpected field in ${param}`);
        }
      }

      fields.push("user_id");
      placeholders.push("?");
      values.push(user_id);

      const query = `
        INSERT INTO agency (${fields.join(", ")})
        VALUES (${placeholders.join(", ")})
      `;

      const [result] = await pool.execute(query, values);

      res.status(201).json({
        message: "Agency saved successfully",
        agency_id: agency_id, // Kullanıcıdan gelen agency_id’yi dön
      });
    } catch (error) {
      console.error("Error in saveAgency:", error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  updateAgency: async (req, res) => {
    try {
      const user_id = req.user.id;
      const validFields = [
        "agency_id",
        "agency_name",
        "agency_url",
        "agency_timezone",
        "agency_lang",
        "agency_phone",
        "project_id",
      ];
      const { ...params } = req.body;
      const { agency_id } = req.params;
      const fields = [];
      const values = [];

      for (const param in params) {
        if (validFields.includes(param)) {
          fields.push(`${param} = ?`);
          values.push(params[param]);
        } else {
          console.warn(`unexpected field ${param}`);
        }
      }

      const query = `
        UPDATE agency
        SET 
          ${fields.join(", ")}
        WHERE agency_id = ? AND user_id = ?
      `;

      const [result] = await pool.execute(query, [
        ...values,
        agency_id,
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
      const { agency_id } = req.params;

      const deleteAgencyQuery = `
        DELETE FROM agency
        WHERE agency_id = ? AND user_id = ?
      `;
      const [result] = await pool.execute(deleteAgencyQuery, [
        agency_id,
        user_id,
      ]);

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
