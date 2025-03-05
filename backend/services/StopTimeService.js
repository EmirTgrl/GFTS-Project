const { pool } = require("../db.js");

const stopTimeService = {
  getStopsAndStopTimes: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { trip_id, project_id } = req.params;
      const [rows] = await pool.execute(
        `SELECT * FROM stop_times st
         LEFT OUTER JOIN stops s
         ON st.stop_id = s.stop_id
         WHERE st.user_id = ? AND st.trip_id = ? AND st.project_id = ?`,
        [user_id, trip_id, project_id]
      );
      res.json(rows);
    } catch (error) {
      console.error(
        `Error in getStopsAndStopTimes for trip_id: ${req.params.trip_id}, project_id: ${req.params.project_id}:`,
        error
      );
      res.status(500).json({ error: "Server error", details: error.message });
    }
  },

  getStopTimesByProjectId: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { project_id } = req.params;
      const [rows] = await pool.execute(
        `
        SELECT * FROM stop_times
        WHERE project_id = ? AND user_id = ?
        `,
        [project_id, user_id]
      );
      res.json(rows);
    } catch (error) {
      console.error(
        `Error in getStopTimesByProjectId for project_id: ${req.params.project_id}:`,
        error
      );
      res.status(500).json({ error: "Server error" });
    }
  },

  getStopTimeById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { trip_id, stop_id } = req.params;
      const [rows] = await pool.execute(
        `
        SELECT * FROM stop_times
        WHERE user_id = ? AND trip_id = ? AND stop_id = ?
        `,
        [user_id, trip_id, stop_id]
      );
      res.json(rows.length > 0 ? rows[0] : null);
    } catch (error) {
      console.error(
        `Error in getStopTimeById for trip_id: ${req.params.trip_id}, stop_id: ${req.params.stop_id}:`,
        error
      );
      res.status(500).json({ error: "Server Error" });
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
      const {
        trip_id,
        stop_id,
        project_id,
        arrival_time,
        departure_time,
        stop_sequence,
        stop_headsign,
        pickup_type,
        drop_off_type,
        shape_dist_traveled,
        timepoint,
      } = req.body;

      const [existingRows] = await pool.execute(
        `
        SELECT * FROM stop_times
        WHERE user_id = ? AND trip_id = ? AND stop_id = ? AND project_id = ?
        `,
        [user_id, trip_id, stop_id, project_id]
      );
      if (existingRows.length === 0) {
        return res.status(404).json({ error: "Stop time not found" });
      }
      const existing = existingRows[0];

      const updatedData = {
        arrival_time:
          arrival_time !== undefined ? arrival_time : existing.arrival_time,
        departure_time:
          departure_time !== undefined
            ? departure_time
            : existing.departure_time,
        stop_sequence:
          stop_sequence !== undefined ? stop_sequence : existing.stop_sequence,
        stop_headsign:
          stop_headsign !== undefined ? stop_headsign : existing.stop_headsign,
        pickup_type:
          pickup_type !== undefined ? pickup_type : existing.pickup_type,
        drop_off_type:
          drop_off_type !== undefined ? drop_off_type : existing.drop_off_type,
        shape_dist_traveled:
          shape_dist_traveled !== undefined && shape_dist_traveled !== ""
            ? shape_dist_traveled
            : null,
        timepoint: timepoint !== undefined ? timepoint : existing.timepoint,
      };

      const query = `
        UPDATE stop_times
        SET arrival_time = ?,
            departure_time = ?,
            stop_sequence = ?,
            stop_headsign = ?,
            pickup_type = ?,
            drop_off_type = ?,
            shape_dist_traveled = ?,
            timepoint = ?
        WHERE trip_id = ? AND stop_id = ? AND user_id = ? AND project_id = ?`;

      const [result] = await pool.execute(query, [
        updatedData.arrival_time,
        updatedData.departure_time,
        updatedData.stop_sequence,
        updatedData.stop_headsign,
        updatedData.pickup_type,
        updatedData.drop_off_type,
        updatedData.shape_dist_traveled,
        updatedData.timepoint,
        trip_id,
        stop_id,
        user_id,
        project_id,
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
      const {
        trip_id,
        stop_id,
        project_id,
        arrival_time,
        departure_time,
        stop_sequence,
        stop_headsign,
        pickup_type,
        drop_off_type,
        shape_dist_traveled,
        timepoint,
      } = req.body;

      // Zorunlu alanları kontrol et
      if (!trip_id || !stop_id || !project_id) {
        return res
          .status(400)
          .json({ error: "trip_id, stop_id, and project_id are required" });
      }

      // stop_id'nin stops tablosunda mevcut olup olmadığını kontrol et
      const [stopRows] = await pool.execute(
        `SELECT stop_id FROM stops WHERE stop_id = ? AND user_id = ? AND project_id = ?`,
        [stop_id, user_id, project_id]
      );
      if (stopRows.length === 0) {
        return res.status(400).json({
          error:
            "Invalid stop_id: Stop does not exist for this user and project",
        });
      }

      // stop_sequence varsa, mevcut kayıtları güncelle
      if (stop_sequence !== undefined && stop_sequence !== null) {
        await pool.execute(
          `
          UPDATE stop_times
          SET stop_sequence = stop_sequence + 1
          WHERE trip_id = ? AND user_id = ? AND project_id = ? AND stop_sequence >= ?
          `,
          [trip_id, user_id, project_id, stop_sequence]
        );
      }

      const query = `
        INSERT INTO stop_times (
          trip_id,
          stop_id,
          user_id,
          project_id,
          arrival_time,
          departure_time,
          stop_sequence,
          stop_headsign,
          pickup_type,
          drop_off_type,
          shape_dist_traveled,
          timepoint
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await pool.execute(query, [
        trip_id,
        stop_id,
        user_id,
        project_id,
        arrival_time || null,
        departure_time || null,
        stop_sequence || null,
        stop_headsign || null,
        pickup_type || null,
        drop_off_type || null,
        shape_dist_traveled || null,
        timepoint || null,
      ]);

      res
        .status(201)
        .json({ message: "Stop time saved successfully", id: result.insertId });
    } catch (error) {
      console.error(`Error in saveStopTime:`, error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },
};

module.exports = stopTimeService;
