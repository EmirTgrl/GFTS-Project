const { pool } = require("../db.js");

const tripService = {
  getTripsByQuery: async (req, res) => {
    const user_id = req.user.id;
    const validFields = [
      "route_id",
      "service_id",
      "trip_id",
      "trip_headsign",
      "trip_short_name",
      "direction_id",
      "block_id",
      "shape_id",
      "wheelchair_accessible",
      "bikes_allowed",
      "project_id",
    ];

    const fields = [];
    const values = [];
    fields.push("user_id = ?");
    values.push(user_id);

    for (const param in req.query) {
      if (validFields.includes(param)) {
        if (param === "trip_short_name") {
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
      FROM trips
      WHERE ${fields.join(" AND ")}
    `;

    const dataQuery = `
      SELECT t.*
      FROM trips t
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

  deleteTripById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { trip_id } = req.params;
      const [result] = await pool.execute(
        `
        DELETE FROM trips
        WHERE trip_id = ? AND user_id = ?
        `,
        [trip_id, user_id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Trip not found" });
      }
      res.status(200).json({ message: "Trip deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  },

  updateTrip: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { trip_id } = req.params;
      const validFields = [
        "route_id",
        "service_id",
        "trip_id",
        "trip_headsign",
        "trip_short_name",
        "direction_id",
        "block_id",
        "shape_id",
        "wheelchair_accessible",
        "bikes_allowed",
        "project_id",
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
        UPDATE trips
        SET
          ${fields.join(", ")}
        WHERE trip_id = ? AND user_id = ?
      `;
      const [result] = await pool.execute(query, [...values, trip_id, user_id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Trip not found" });
      }
      return res.status(200).json({ message: "Trip successfully updated" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server Error", details: e.message });
    }
  },

  saveTrip: async (req, res) => {
    try {
      const user_id = req.user.id;
      const validFields = [
        "route_id",
        "service_id",
        "trip_id",
        "trip_headsign",
        "trip_short_name",
        "direction_id",
        "block_id",
        "shape_id",
        "wheelchair_accessible",
        "bikes_allowed",
        "project_id",
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
        INSERT INTO trips(${fields.join(", ")})
        VALUES(${placeholders.join(", ")})
      `;

      const [result] = await pool.execute(query, values);

      res.status(201).json({
        message: "Trip saved successfully",
        trip_id: result.insertId,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },
};

module.exports = tripService;
