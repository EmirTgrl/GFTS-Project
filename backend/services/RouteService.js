const { pool } = require("../db.js");

const routeService = {
  getRoutesByQuery: async (req, res) => {
    const user_id = req.user.id;
    const validFields = [
      "route_id",
      "project_id",
      "agency_id",
      "route_short_name",
      "route_long_name",
      "route_desc",
      "route_type",
      "route_url",
      "route_color",
      "route_text_color",
      "route_sort_order",
    ];

    const fields = [];
    const values = [];

    // Her zaman user_id ile filtrele
    fields.push("user_id = ?");
    values.push(user_id);

    // Query parametrelerini kontrol et
    for (const param in req.query) {
      if (validFields.includes(param)) {
        fields.push(`${param} = ?`);
        values.push(req.query[param]);
      } else {
        console.warn(`Unexpected query parameter: ${param}`);
      }
    }

    // SQL sorgusunu oluştur
    const query = `
      SELECT * FROM routes 
      WHERE ${fields.join(" AND ")}
    `;

    try {
      const [rows] = await pool.execute(query, values);
      res.json(rows.length > 0 ? rows : []);
    } catch (error) {
      console.error("Error fetching routes:", error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  deleteRouteById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { route_id } = req.params;
      const [results] = await pool.execute(
        `
        DELETE FROM routes 
        WHERE route_id = ? AND user_id = ?`,
        [route_id, user_id]
      );
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Route not found" });
      }
      res.status(200).json({ message: "Route deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },
  updateRoute: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { route_id } = req.params;
      const validFields = [
        "route_id",
        "project_id",
        "agency_id",
        "route_short_name",
        "route_long_name",
        "route_desc",
        "route_type",
        "route_url",
        "route_color",
        "route_text_color",
        "route_sort_order",
      ];
      const { ...params } = req.body;

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
        UPDATE routes
        SET ${fields.join(", ")}
        WHERE route_id = ? AND user_id = ?
      `;
      const [result] = await pool.execute(query, [
        ...values,
        route_id,
        user_id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Route not found" });
      }

      res.status(200).json({ message: "successfully updated" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server Error", details: e.message });
    }
  },
  saveRoute: async (req, res) => {
    try {
      const user_id = req.user.id;
      const validFields = [
        "project_id",
        "agency_id",
        "route_short_name",
        "route_long_name",
        "route_desc",
        "route_type",
        "route_url",
        "route_color",
        "route_text_color",
        "route_sort_order",
      ];
      const { ...params } = req.body;

      const fields = [];
      const values = [];
      const placeholders = [];

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
        INSERT INTO routes(${fields.join(", ")})
        VALUES(${placeholders.join(", ")})
      `;

      const [result] = await pool.execute(query, values);

      res.status(201).json({
        message: "Route saved successfully",
        route_id: result.insertId,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },
};

module.exports = routeService;
