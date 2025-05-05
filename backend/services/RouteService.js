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
      "network_id",
    ];

    const fields = [];
    const values = [];

    fields.push("user_id = ?");
    values.push(user_id);

    for (const param in req.query) {
      if (validFields.includes(param)) {
        if (param === "route_long_name") {
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
      FROM routes
      WHERE ${fields.join(" AND ")}
    `;

    const dataQuery = `
      SELECT r.*
      FROM routes r
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
      ]; // route_id’yi validFields’dan çıkardık, çünkü WHERE’da kullanılıyor
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

      if (fields.length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
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

      res.status(200).json({ message: "Successfully updated" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server Error", details: e.message });
    }
  },

  saveRoute: async (req, res) => {
    try {
      const user_id = req.user.id;
      const validFields = [
        "route_id", // route_id’yi ekledik, kullanıcıdan gelecek
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
      const { route_id, ...params } = req.body;

      // route_id’nin gelip gelmediğini kontrol et
      if (!route_id) {
        return res.status(400).json({ error: "route_id is required" });
      }

      const fields = [];
      const values = [];
      const placeholders = [];

      fields.push("route_id");
      values.push(route_id);
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
        INSERT INTO routes (${fields.join(", ")})
        VALUES (${placeholders.join(", ")})
      `;

      const [result] = await pool.execute(query, values);

      res.status(201).json({
        message: "Route saved successfully",
        route_id: route_id, // Kullanıcıdan gelen route_id’yi dön
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },
};

module.exports = routeService;
