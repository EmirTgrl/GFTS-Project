const { pool } = require("../db.js");

const stopTimeService = {
  getStopsAndStopTimesByRouteId: async (req, res) => {
    const user_id = req.user.id;
    const { route_id } = req.params;

    let query = `
    SELECT s.*
      FROM routes AS r
      JOIN trips AS t ON r.route_id = t.route_id
      JOIN stop_times AS st ON t.trip_id = st.trip_id
      JOIN stops AS s ON st.stop_id = s.stop_id
      WHERE r.route_id = ? AND r.user_id = ?
      GROUP BY s.stop_id;`;

    try {
      const [rows] = await pool.execute(query, [route_id, user_id]);
      res.json(rows.length > 0 ? rows : []);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  getStopsAndStopTimesByQuery: async (req, res) => {
    const user_id = req.user.id;
    const validFieldsStopTime = [
      "trip_id",
      "stop_id",
      "project_id",
      "arrival_time",
      "departure_time",
      "stop_sequence",
      "stop_headsign",
      "pickup_type",
      "drop_off_type",
      "shape_dist_traveled",
      "timepoint",
    ];

    const validFieldsStop = [
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
    ];

    const fields = [];
    const values = [];
    fields.push("stop_times.user_id = ?");
    values.push(user_id);

    for (const param in req.query) {
      if (validFieldsStopTime.includes(param)) {
        fields.push(`stop_times.${param} = ?`);
        values.push(req.query[param]);
      } else if (validFieldsStop.includes(param)) {
        fields.push(`stops.${param} = ?`);
        values.push(req.query[param]);
      } else {
        console.warn(`Unexpected query parameter: ${param}`);
      }
    }

    let query = `
      SELECT *
      FROM stop_times
      JOIN stops ON stop_times.stop_id = stops.stop_id
      WHERE ${fields.join(" AND ")}
    `;

    try {
      const [rows] = await pool.execute(query, values);
      res.json(rows.length > 0 ? rows : []);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  deleteStopTimeById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { trip_id, stop_id } = req.params;
      const [result] = await pool.execute(
        `
        DELETE FROM stop_times
        WHERE user_id = ? AND trip_id = ? AND stop_id = ?
        `,
        [user_id, trip_id, stop_id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Stop time not found" });
      }
      res.status(200).json({ message: "Stop time deleted successfully" });
    } catch (error) {
      console.error(
        `Error in deleteStopTimeById for trip_id: ${req.params.trip_id}, stop_id: ${req.params.stop_id}:`,
        error
      );
      res.status(500).json({ error: "Server Error" });
    }
  },

  updateStopTime: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { trip_id, stop_id } = req.params;
      const validFields = [
        "arrival_time",
        "departure_time",
        "stop_sequence",
        "stop_headsign",
        "pickup_type",
        "drop_off_type",
        "shape_dist_traveled",
        "timepoint",
        "project_id",
      ]; // trip_id ve stop_id WHERE’da kullanıldığı için validFields’dan çıkarıldı

      const { ...params } = req.body;

      const fields = [];
      const values = [];

      for (const param in params) {
        if (validFields.includes(param)) {
          fields.push(`${param} = ?`);
          values.push(params[param]);
        } else {
          console.warn(`Unexpected field ${param}`);
        }
      }

      if (fields.length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const query = `
        UPDATE stop_times
        SET ${fields.join(", ")}
        WHERE trip_id = ? AND stop_id = ? AND user_id = ?`;

      const [result] = await pool.execute(query, [
        ...values,
        trip_id,
        stop_id,
        user_id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Stop time not found" });
      }

      res.status(200).json({ message: "Stop time updated successfully" });
    } catch (error) {
      console.error(`Error in updateStopTime:`, error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  saveStopTime: async (req, res) => {
    try {
      const user_id = req.user.id;
      const validFields = [
        "trip_id",
        "stop_id",
        "project_id",
        "arrival_time",
        "departure_time",
        "stop_headsign",
        "pickup_type",
        "drop_off_type",
        "shape_dist_traveled",
        "timepoint",
        "stop_sequence",
      ];

      const { trip_id, stop_id, ...params } = req.body;

      if (!trip_id || !stop_id) {
        return res
          .status(400)
          .json({ error: "trip_id and stop_id are required" });
      }

      const fields = ["trip_id", "stop_id"];
      const values = [trip_id, stop_id];
      const placeholders = ["?", "?"];

      for (const param in params) {
        if (validFields.includes(param)) {
          fields.push(param);
          values.push(params[param]);
          placeholders.push("?");
        } else {
          console.warn(`Unexpected field in ${param}`);
        }
      }

      fields.push("user_id");
      placeholders.push("?");
      values.push(user_id);

      const query = `
        INSERT INTO stop_times (${fields.join(", ")}) 
        VALUES (${placeholders.join(", ")})
      `;
      await pool.execute(query, values);

      res.status(201).json({
        message: "Stop time saved successfully",
        trip_id,
        stop_id,
      });
    } catch (error) {
      console.error(`Error in saveStopTime:`, error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  saveMultipleStopsAndTimes: async (req, res) => {
    const user_id = req.user.id;
    const stopsAndTimesData = req.body;

    if (!Array.isArray(stopsAndTimesData)) {
      return res
        .status(400)
        .json({ error: "Expected an array of stop and stop time data." });
    }

    if (stopsAndTimesData.length === 0) {
      return res
        .status(200)
        .json({ message: "No stops and stop times to update." });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const tripId = stopsAndTimesData[0].trip_id;

      await connection.execute(
        `DELETE FROM stop_times WHERE trip_id = ? AND user_id = ?`,
        [tripId, user_id]
      );

      for (const data of stopsAndTimesData) {
        const {
          stop_id,
          stop_code,
          stop_name,
          stop_desc,
          stop_lat,
          stop_lon,
          zone_id,
          stop_url,
          location_type,
          parent_station,
          stop_timezone,
          wheelchair_boarding,
          arrival_time,
          departure_time,
          stop_sequence,
          stop_headsign,
          pickup_type,
          drop_off_type,
          shape_dist_traveled,
          timepoint,
          project_id,
          trip_id,
        } = data;

        if (!stop_id) {
          return res
            .status(400)
            .json({ error: "stop_id is required for each stop" });
        }

        const [existingStop] = await connection.execute(
          `SELECT stop_id FROM stops WHERE stop_id = ? AND user_id = ?`,
          [stop_id, user_id]
        );

        if (existingStop.length > 0) {
          const stopValidFields = [
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
          ];

          const stopFields = [];
          const stopValues = [];

          for (const field of stopValidFields) {
            if (data[field] !== undefined) {
              stopFields.push(`${field} = ?`);
              stopValues.push(data[field]);
            }
          }

          if (stopFields.length > 0) {
            const updateStopQuery = `
              UPDATE stops
              SET ${stopFields.join(", ")}
              WHERE stop_id = ? AND user_id = ?
            `;
            await connection.execute(updateStopQuery, [
              ...stopValues,
              stop_id,
              user_id,
            ]);
          }
        } else {
          const stopValidFields = [
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

          const stopFields = stopValidFields.filter(
            (field) => data[field] !== undefined
          );
          stopFields.push("user_id");

          const stopValuePlaceholders = stopFields.map(() => "?").join(", ");
          const stopValues = stopFields.map((field) =>
            field === "user_id" ? user_id : data[field]
          );

          const insertStopQuery = `INSERT INTO stops (${stopFields.join(
            ", "
          )}) VALUES (${stopValuePlaceholders})`;
          await connection.execute(insertStopQuery, stopValues);
        }

        const stopTimeValidFields = [
          "trip_id",
          "stop_id",
          "arrival_time",
          "departure_time",
          "stop_sequence",
          "stop_headsign",
          "pickup_type",
          "drop_off_type",
          "shape_dist_traveled",
          "timepoint",
          "project_id",
        ];

        const stopTimeFields = stopTimeValidFields.filter(
          (field) => data[field] !== undefined
        );
        stopTimeFields.push("user_id");

        const stopTimeValuePlaceholders = stopTimeFields
          .map(() => "?")
          .join(", ");
        const stopTimeValues = stopTimeFields.map((field) =>
          field === "user_id" ? user_id : data[field]
        );

        const insertStopTimeQuery = `INSERT INTO stop_times (${stopTimeFields.join(
          ", "
        )}) VALUES (${stopTimeValuePlaceholders})`;
        await connection.execute(insertStopTimeQuery, stopTimeValues);
      }

      await connection.commit();
      res
        .status(200)
        .json({ message: "Stops and stop times updated successfully." });
    } catch (error) {
      await connection.rollback();
      console.error("Error in saveMultipleStopsAndTimes:", error);
      res.status(500).json({ error: "Server Error", details: error.message });
    } finally {
      connection.release();
    }
  },
};

module.exports = stopTimeService;
