const { pool } = require("../db.js");

const tripService = {
  copyTrip: async (req, res) => {
    const user_id = req.user.id;
    const { offsetMinutes, trip } = req.body; 

    if (!offsetMinutes || !trip) {
      return res.status(400).json({ error: "offsetMinutes and trip_id are required" });
    }
    const offset = parseInt(offsetMinutes);
    if (isNaN(offset))
    {
        return res.status(400).json({ error: "offsetMinutes should be integer" });
    }

    const connection = await pool.getConnection(); 

    try {
      await connection.beginTransaction();

      const [newTripResult] = await connection.execute(
        `INSERT INTO trips (route_id, service_id, trip_headsign, trip_short_name, direction_id, block_id, shape_id, wheelchair_accessible, bikes_allowed, user_id, project_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          trip.route_id,
          trip.service_id,
          trip.trip_headsign,
          trip.trip_short_name,
          trip.direction_id,
          trip.block_id,
          trip.shape_id,
          trip.wheelchair_accessible,
          trip.bikes_allowed,
          user_id, 
          trip.project_id,
        ]
      );

      const newTripId = newTripResult.insertId;

      const [originalStopTimes] = await connection.execute(
        `SELECT * FROM stop_times WHERE trip_id = ? ORDER BY stop_sequence`,
        [trip.trip_id]
      );

      for (const stopTime of originalStopTimes) {
        await connection.execute(
          `INSERT INTO stop_times (trip_id, arrival_time, departure_time, stop_id, stop_sequence, stop_headsign, pickup_type, drop_off_type, shape_dist_traveled, timepoint, user_id, project_id)
           VALUES (?, ADDTIME(?, SEC_TO_TIME(? * 60)), ADDTIME(?, SEC_TO_TIME(? * 60)), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newTripId,
            stopTime.arrival_time,
            offset, // offset in seconds
            stopTime.departure_time,
            offset,  // offset in seconds
            stopTime.stop_id,
            stopTime.stop_sequence,
            stopTime.stop_headsign,
            stopTime.pickup_type,
            stopTime.drop_off_type,
            stopTime.shape_dist_traveled,
            stopTime.timepoint,
            user_id, // Use the requesting user's ID
            stopTime.project_id
          ]
        );
      }

      await connection.commit();
      res.status(201).json({ message: "Trip copied successfully", trip_id: newTripId });

    } catch (error) {
      await connection.rollback();
      console.error("Error copying trip:", error);
      res.status(500).json({ error: "Server error", details: error.message });
    } finally {
      connection.release(); // Always release the connection
    }
  }
  ,
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
