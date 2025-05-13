const { pool } = require("../db.js");

const stopService = {
  getStopsByQuery: async (req, res) => {
    const user_id = req.user.id;
    const validFields = [
      "stop_id",
      "stop_code",
      "stop_name",
      "stop_desc",
      "stop_lat",
      "stop_lon",
      "zone_id",
      "stop_url",
      "location_type",
      "parent_station",
      "stop_timezone",
      "wheelchair_boarding",
      "project_id",
    ];

    const fields = [];
    const values = [];
    fields.push("user_id = ?");
    values.push(user_id);

    if (!req.query.project_id) {
      return res.status(400).json({ error: "project_id is required" });
    }

    for (const param in req.query) {
      if (validFields.includes(param)) {
        if (param === "stop_name") {
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
      FROM stops
      WHERE ${fields.join(" AND ")}
    `;

    const dataQuery = `
      SELECT stop_id, stop_code, stop_name, stop_desc, stop_lat, stop_lon, zone_id, stop_url, location_type, parent_station, stop_timezone, wheelchair_boarding
      FROM stops
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

  deleteStopByStopId: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { stop_id } = req.params;
      const [result] = await pool.execute(
        `DELETE FROM stops WHERE stop_id = ? AND user_id = ?`,
        [stop_id, user_id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Stop not found" });
      }
      res.status(200).json({ message: "Stop deleted successfully" });
    } catch (error) {
      console.error(
        `Error in deleteStopByStopId for stop_id: ${req.params.stop_id}:`,
        error
      );
      res.status(500).json({ error: "Server Error" });
    }
  },

  updateStop: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { stop_id } = req.params;
      const validFields = [
        "stop_code",
        "stop_name",
        "stop_desc",
        "stop_lat",
        "stop_lon",
        "zone_id",
        "stop_url",
        "location_type",
        "parent_station",
        "stop_timezone",
        "wheelchair_boarding",
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

      if (fields.length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const query = `
        UPDATE stops 
        SET ${fields.join(", ")}
        WHERE stop_id = ? AND user_id = ?`;

      const [result] = await pool.execute(query, [...values, stop_id, user_id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Stop not found" });
      }

      res.status(200).json({ message: "Stop updated successfully" });
    } catch (error) {
      console.error(`Error in updateStop:`, error);
      res.status(500).json({ error: "Server Error" });
    }
  },

  saveStop: async (req, res) => {
    try {
      const user_id = req.user.id;
      const validFields = [
        "stop_id",
        "stop_code",
        "stop_name",
        "stop_desc",
        "stop_lat",
        "stop_lon",
        "zone_id",
        "stop_url",
        "location_type",
        "parent_station",
        "stop_timezone",
        "wheelchair_boarding",
        "project_id",
      ];

      const { stop_id, ...params } = req.body;

      if (!stop_id) {
        return res.status(400).json({ error: "stop_id is required" });
      }

      const fields = ["stop_id"];
      const values = [stop_id];
      const placeholders = ["?"];

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
        INSERT INTO stops (${fields.join(", ")})
        VALUES (${placeholders.join(", ")})
      `;
      await pool.execute(query, values);

      res.status(201).json({
        message: "Stop saved successfully",
        stop_id,
      });
    } catch (error) {
      console.error(`Error in saveStop:`, error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  getAllStopsByProjectId: async (req, res) => {
    const user_id = req.user.id;
    const { project_id } = req.query;

    if (!project_id) {
      return res.status(400).json({ error: "project_id is required" });
    }

    const query = `
      SELECT *
      FROM stops
      WHERE user_id = ? AND project_id = ?
    `;

    try {
      const [rows] = await pool.query(query, [user_id, project_id]);
      res.json({
        data: rows,
        total: rows.length,
      });
    } catch (error) {
      console.error("Query execution error:", error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  getRoutesByStopId: async (req, res) => {
    const user_id = req.user.id;
    const { stop_id, project_id } = req.params;

    if (!stop_id || !project_id) {
      return res
        .status(400)
        .json({ error: "stop_id and project_id are required" });
    }

    const query = `
    SELECT 
      s.stop_id, s.stop_code, s.stop_name, s.stop_desc, s.stop_lat, s.stop_lon, 
      s.zone_id, s.stop_url, s.location_type, s.parent_station, s.stop_timezone, 
      s.wheelchair_boarding, s.project_id,
      COALESCE(
        (SELECT JSON_ARRAYAGG(r2.route_long_name)
         FROM (SELECT DISTINCT r.route_long_name
               FROM routes r
               JOIN trips t ON r.route_id = t.route_id AND r.project_id = t.project_id
               JOIN stop_times st ON t.trip_id = st.trip_id AND t.project_id = st.project_id
               WHERE st.stop_id = s.stop_id AND st.project_id = s.project_id
                 AND r.route_long_name IS NOT NULL) r2),
        '[]'
      ) AS route_names
    FROM stops s
    WHERE s.user_id = ? AND s.project_id = ? AND s.stop_id = ?
    GROUP BY s.stop_id
  `;

    try {
      const [rows] = await pool.query(query, [user_id, project_id, stop_id]);

      if (rows.length === 0) {
        return res.status(404).json({ error: "Stop not found" });
      }

      const formattedRow = {
        ...rows[0],
        route_names:
          rows[0].route_names && rows[0].route_names !== "[]"
            ? JSON.parse(rows[0].route_names).filter((name) => name)
            : [],
      };

      res.json({
        data: formattedRow,
      });
    } catch (error) {
      console.error("Query execution error:", error.stack);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },
};

module.exports = stopService;
