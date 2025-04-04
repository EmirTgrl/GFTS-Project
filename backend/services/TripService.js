const { pool } = require("../db.js");

const tripService = {
  copyTrip: async (req, res) => {
    const user_id = req.user.id;
    const { offsetMinutes, trip, new_trip_id } = req.body;

    if (!trip || !trip.trip_id) {
      return res.status(400).json({ error: "trip (with trip_id) is required" });
    }

    const offset = offsetMinutes ? parseInt(offsetMinutes) : 0;
    if (offsetMinutes && isNaN(offset)) {
      return res.status(400).json({ error: "offsetMinutes should be integer" });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [originalTripRows] = await connection.execute(
        `SELECT * FROM trips WHERE trip_id = ? AND user_id = ?`,
        [trip.trip_id, user_id]
      );

      if (originalTripRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Original trip not found" });
      }

      const originalTrip = originalTripRows[0];
      if (!originalTrip.route_id) {
        await connection.rollback();
        return res.status(400).json({ error: "Original trip has no route_id" });
      }

      const newTripId =
        new_trip_id || `${originalTrip.trip_id}_copy_${Date.now()}`;

      const tripValues = [
        originalTrip.route_id,
        originalTrip.service_id ?? null,
        newTripId,
        originalTrip.trip_headsign ?? null,
        originalTrip.trip_short_name ?? null,
        originalTrip.direction_id ?? null,
        originalTrip.block_id ?? null,
        originalTrip.shape_id ?? null,
        originalTrip.wheelchair_accessible ?? null,
        originalTrip.bikes_allowed ?? null,
        user_id,
        originalTrip.project_id ?? null,
      ];

      await connection.execute(
        `INSERT INTO trips (route_id, service_id, trip_id, trip_headsign, trip_short_name, direction_id, block_id, shape_id, wheelchair_accessible, bikes_allowed, user_id, project_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        tripValues
      );

      const [originalStopTimes] = await connection.execute(
        `SELECT * FROM stop_times WHERE trip_id = ? ORDER BY stop_sequence`,
        [originalTrip.trip_id]
      );

      if (originalStopTimes.length === 0) {
        await connection.rollback();
        return res
          .status(400)
          .json({ error: "No stop times found for the original trip" });
      }

      const newStopTimes = [];
      for (const stopTime of originalStopTimes) {
        const arrivalTime = offset ? `ADDTIME(?, SEC_TO_TIME(? * 60))` : `?`;
        const departureTime = offset ? `ADDTIME(?, SEC_TO_TIME(? * 60))` : `?`;

        const stopTimeValues = [
          newTripId,
          stopTime.arrival_time ?? null,
          ...(offset ? [offset] : []),
          stopTime.departure_time ?? null,
          ...(offset ? [offset] : []),
          stopTime.stop_id ?? null,
          stopTime.stop_sequence ?? null,
          stopTime.stop_headsign ?? null,
          stopTime.pickup_type ?? null,
          stopTime.drop_off_type ?? null,
          stopTime.shape_dist_traveled ?? null,
          stopTime.timepoint ?? null,
          user_id,
          stopTime.project_id ?? null,
        ];

        await connection.execute(
          `INSERT INTO stop_times (trip_id, arrival_time, departure_time, stop_id, stop_sequence, stop_headsign, pickup_type, drop_off_type, shape_dist_traveled, timepoint, user_id, project_id)
           VALUES (?, ${arrivalTime}, ${departureTime}, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          stopTimeValues
        );

        // Yeni eklenen stop_time verisini çek
        const [newStopTimeRows] = await connection.execute(
          `SELECT * FROM stop_times WHERE trip_id = ? AND stop_id = ? AND stop_sequence = ?`,
          [newTripId, stopTime.stop_id, stopTime.stop_sequence]
        );
        if (newStopTimeRows.length > 0) {
          newStopTimes.push(newStopTimeRows[0]);
        }
      }

      await connection.commit();

      const [newTripRows] = await connection.execute(
        `SELECT * FROM trips WHERE trip_id = ? AND user_id = ?`,
        [newTripId, user_id]
      );

      res.status(201).json({
        message: "Trip copied successfully",
        trip: newTripRows[0],
        stop_times: newStopTimes,
      });
    } catch (error) {
      await connection.rollback();
      console.error("Error copying trip:", error.message, error.stack);
      res
        .status(500)
        .json({
          error: "Server error",
          details: error.message,
          stack: error.stack,
        });
    } finally {
      connection.release();
    }
  },

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
      console.error("Query execution error:", error.message);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  deleteTripById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { trip_id } = req.params;
      const [result] = await pool.execute(
        `DELETE FROM trips WHERE trip_id = ? AND user_id = ?`,
        [trip_id, user_id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Trip not found" });
      }
      res.status(200).json({ message: "Trip deleted successfully" });
    } catch (error) {
      console.error("Error deleting trip:", error.message);
      res.status(500).json({ error: "Server error", details: error.message });
    }
  },

  updateTrip: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { trip_id } = req.params;
      const validFields = [
        "route_id",
        "service_id",
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
          console.warn(`Unexpected field: ${param}`);
        }
      }

      if (fields.length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const query = `
        UPDATE trips
        SET ${fields.join(", ")}
        WHERE trip_id = ? AND user_id = ?
      `;
      const [result] = await pool.execute(query, [...values, trip_id, user_id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Trip not found" });
      }
      return res.status(200).json({ message: "Trip successfully updated" });
    } catch (error) {
      console.error("Error updating trip:", error.message);
      res.status(500).json({ error: "Server Error", details: error.message });
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
      const { trip_id, ...params } = req.body;

      if (!trip_id) {
        return res.status(400).json({ error: "trip_id is required" });
      }

      const fields = [];
      const values = [];
      const placeholders = [];

      fields.push("trip_id");
      values.push(trip_id);
      placeholders.push("?");

      for (const param in params) {
        if (validFields.includes(param)) {
          fields.push(param);
          values.push(params[param]);
          placeholders.push("?");
        } else {
          console.warn(`Unexpected field: ${param}`);
        }
      }

      fields.push("user_id");
      placeholders.push("?");
      values.push(user_id);

      const query = `
        INSERT INTO trips (${fields.join(", ")})
        VALUES (${placeholders.join(", ")})
      `;

      const [result] = await pool.execute(query, values);

      res.status(201).json({
        message: "Trip saved successfully",
        trip_id: trip_id,
      });
    } catch (error) {
      console.error("Error saving trip:", error.message);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },
};

module.exports = tripService;
