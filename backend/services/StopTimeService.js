const { pool } = require("../db.js");

const stopTimeService = {
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
      await pool.execute(
        `
        DELETE FROM stop_times
        WHERE user_id = ? AND trip_id = ? AND stop_id = ?
        `,
        [user_id, trip_id, stop_id]
      );
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
      const {trip_id, stop_id} = req.params;
      const validFields = [
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
        "timepoint"
      ];

      const {...params} = req.body;

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
        UPDATE stop_times
        SET 
          ${fields.join(", ")}
        WHERE trip_id = ? AND stop_id = ? AND user_id = ?`;

      const [result] = await pool.execute(query, [
        ...values, trip_id, stop_id, user_id
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
        "stop_sequence"
       ];

      const params = req.body;

      const fields = [];
      const values = [];
      const placeholders = [];

      for (const param in params) {
        if (validFields.includes(param)) {
          fields.push(param);
          values.push(params[param]);
          placeholders.push("?")
        } else {
          console.warn(`unexpected field in ${param}`);
        }
      }

      fields.push("user_id");
      placeholders.push("?");
      values.push(user_id);
      
      const query = `
        INSERT INTO stop_times (${fields.join(", ")}) 
        VALUES (${placeholders.join(", ")})
      `;
      const [result] = await pool.execute(query, values);

      res
        .status(201)
        .json({ message: "Stop time saved successfully", id: result.insertId });
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
        return res.status(200).json({ message: "No stops and stop times to update." });
    }

    const connection = await pool.getConnection(); // Get a connection from the pool
    try {
        await connection.beginTransaction(); // Start a transaction

        const tripId = stopsAndTimesData[0].trip_id; // Assuming all stop_times have same trip_id

        // 1. Delete existing stop times for the trip_id
        await connection.execute(
            `DELETE FROM stop_times WHERE trip_id = ? AND user_id = ?`,
            [tripId, user_id]
        );

        // 2. Iterate through the data and update/create stops, and create stop_times
        for (const data of stopsAndTimesData) {
            const {
                stop_id,  // Use existing stop_id if it exists
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
                project_id
            } = data;

            // 2.1 Check if the stop exists
            const existingStop = [];
            if(stop_id === null){
              [existingStop] = await connection.execute(
                `SELECT stop_id FROM stops WHERE stop_id = ? AND user_id = ?`,
                [stop_id, user_id]
            );
            }

            if (existingStop.length > 0) {
                // 2.2 Update the stop
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
                    "wheelchair_boarding"
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
                    await connection.execute(updateStopQuery, [...stopValues, stop_id, user_id]);
                }
            } else {
                // 2.3 Create the stop
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
                    "project_id"
                ];

                const stopFields = stopValidFields.filter(field => data[field] !== undefined);
                stopFields.push("user_id");

                const stopValuePlaceholders = stopFields.map(() => '?').join(', ');

                const stopValues = [];
                for (const field of stopFields) {
                    stopValues.push(field === 'user_id' ? user_id : data[field]);
                }
                const insertStopQuery = `INSERT INTO stops (${stopFields.join(', ')}) VALUES (${stopValuePlaceholders})`;

                const [result] = await connection.execute(insertStopQuery, stopValues);
                data.stop_id = result.insertId; // Update stop_id with the new ID
            }

            // 3. Create stop time
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
                "project_id"
            ];

            const stopTimeFields = stopTimeValidFields.filter(field => data[field] !== undefined);
            stopTimeFields.push("user_id");

            const stopTimeValuePlaceholders = stopTimeFields.map(() => '?').join(', ');

            const stopTimeValues = [];
            for (const field of stopTimeFields) {
                stopTimeValues.push(field === 'user_id' ? user_id : data[field]);
            }

            const insertStopTimeQuery = `INSERT INTO stop_times (${stopTimeFields.join(', ')}) VALUES (${stopTimeValuePlaceholders})`;
            await connection.execute(insertStopTimeQuery, stopTimeValues);
        }

        await connection.commit(); // Commit the transaction
        res.status(200).json({ message: "Stops and stop times updated successfully." });

    } catch (error) {
        await connection.rollback(); // Rollback the transaction if any error occurred
        console.error("Error in saveMultipleStopsAndTimes:", error);
        res.status(500).json({ error: "Server Error", details: error.message });
    } finally {
        connection.release(); // Release the connection back to the pool
    }
},
};

module.exports = stopTimeService;
