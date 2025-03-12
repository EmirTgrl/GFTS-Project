const { pool } = require("../db.js");

const calendarService = {
  getCalendarByQuery: async (req, res) => {
    const user_id = req.user.id;
    const validFields = [
      "service_id",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
      "start_date",
      "end_date",
      "project_id",
    ];

    const fields = [];
    const values = [];
    fields.push("user_id = ?");
    values.push(user_id);

    for (const param in req.query) {
      if (validFields.includes(param)) {
        fields.push(`${param} = ?`);
        values.push(req.query[param]);
      } else {
        console.warn(`Unexpected query parameter: ${param}`);
      }
    }

    let query = `SELECT * FROM calendar WHERE ${fields.join(" AND ")}`;

    try {
      const [rows] = await pool.execute(query, values);
      if (rows.length > 0) {
        res.json(rows)
      } else {
        res.status(404).json({ error: "Calendar not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  deleteCalendarById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { service_id } = req.params;
      const [result] = await pool.execute(
        `
        DELETE FROM calendar
        WHERE service_id = ? AND user_id = ?
        `,
        [service_id, user_id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Calendar not found" });
      }
      res.status(200).json({ message: "Calendar deleted successfully" });
    } catch (error) {
      console.error(
        `Error in deleteCalendarById for service_id: ${req.params.service_id}:`,
        error
      );
      res.status(500).json({ error: "Server Error" });
    }
  },

  updateCalendar: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { service_id } = req.params;
      const { ...params } = req.body;
      const validFields = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
        "start_date",
        "end_date",
        "project_id",
      ];
      const fields = [];
      const values = [];

      for (const param in params) {
        if (validFields.includes(param)) {
          fields.push(`${param} = ?`);
          values.push(params[param]);
        } else {
          console.warn(`Unexpected field in ${param}`);
        }
      }

      const query = `
        UPDATE calendar
        SET ${fields.join(", ")}
        WHERE service_id = ? AND user_id = ?
      `;

      const [result] = await pool.execute(query, [
        ...values,
        service_id,
        user_id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Calendar not found" });
      }

      res.status(200).json({message:"updated successfully"});
    } catch (error) {
      console.error(`Error in updateCalendar:`, error);
      res.status(500).json({ error: "Server Error" });
    }
  },

  saveCalendar: async (req, res) => {
    try {
      const user_id = req.user.id;
      const validFields = [
        "service_id",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
        "start_date",
        "end_date",
        "project_id",
      ];
      const { ...params } = req.body;

      const values = [];
      const fields = [];
      const placeholders = [];

      for (const param in params) {
        if (validFields.includes(param)) {
          fields.push(param);
          values.push(params[param]);
          placeholders.push("?");
        } else {
          console.warn(`Unexpected field ${param}`);
        }
      }

      fields.push("user_id");
      placeholders.push("?");
      values.push(user_id);

      const query = `
        INSERT INTO calendar(${fields.join(", ")})
        VALUES(${placeholders.join(", ")})
      `;
      const [result] = await pool.execute(query, values);

      res.status(201).json({service_id:result.insertId});
    } catch (error) {
      console.error(`Error in saveCalendar:`, error);
      res.status(500).json({ error: "Server Error" });
    }
  },
};

module.exports = calendarService;
