const pool = require("../db.js");

const calendarService = {
  getCalendarsByRouteId: async (req, res) => {
    try {
      const userId = req.user.id;
      const { route_id } = req.params;
      const [rows] = await pool.execute(
        `SELECT DISTINCT calendar.* FROM calendar
                 JOIN trips ON calendar.service_id = trips.service_id
                 JOIN imported_data ON calendar.import_id = imported_data.import_id
                 WHERE trips.route_id = ? AND imported_data.id = ?`,
        [route_id, userId]
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },
  getCalendarById: async (req, res) => {
    try {
      const { calendar_id } = req.params;
      const [rows] = await pool.execute(
        `SELECT * FROM calendar
          WHERE calendar.service_id = ?`,
        [calendar_id]
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },
  // TODO: check if calendar id is not null and int
  deleteCalendarById: async (req, res) => {
    try {
      const { calendar_id } = req.params;
      await pool.execute(
        `DELETE FROM calendar
          WHERE calendar.service_id = ?`,
        [calendar_id]
      );
      res.status(200).json({ message: "Calendar deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },
  // TODO: validations needed
  updateCalendar: async (req, res) => {
    try {
      const {
        service_id,
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
        start_date,
        end_date,
      } = req.body;
      const query = `
          UPDATE calendar
          SET
            monday = ?,
            tuesday = ?,
            wednesday = ?,
            thursday = ?,
            friday = ?,
            saturday = ?,
            sunday = ?,
            start_date = ?,
            end_date = ?
          WHERE service_id = ?
        `;
      const result = await pool.execute(query, [
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
        start_date,
        end_date,
        service_id,
      ]);
      if (result.affectedRows == 0) {
        return res.status(404).json({ error: "Calendar not found" });
      }

      return res.status(200).json({ message: "Calendar successfully updated" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server Error" });
    }
  },
  saveCalendar: async (req, res) => {
    try {
      const {
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
        start_date,
        end_date,
      } = req.body;
      const query = `
        INSERT INTO calendar(monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
      const [result] = await pool.execute(query, [
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
        start_date,
        end_date,
      ]);
      res
        .status(201)
        .json({
          message: "Calendar saved successfully",
          calendar_id: result.insertId,
        });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  },
};
module.exports = calendarService;
