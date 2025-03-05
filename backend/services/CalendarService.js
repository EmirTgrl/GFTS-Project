const { pool } = require("../db.js");

const calendarService = {
  getCalendarsByProjectId: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { project_id } = req.params;
      const [rows] = await pool.execute(
        `
        SELECT * FROM calendar  
        WHERE user_id = ? AND project_id = ?
        `,
        [user_id, project_id]
      );
      res.json(rows);
    } catch (error) {
      console.error(
        `Error in getCalendarsByProjectId for project_id: ${req.params.project_id}:`,
        error
      );
      res.status(500).json({ error: "Server error" });
    }
  },

  getCalendarById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { service_id } = req.params;
      const [rows] = await pool.execute(
        `
        SELECT * FROM calendar
        WHERE service_id = ? AND user_id = ?
        `,
        [service_id, user_id]
      );
      res.json(rows.length > 0 ? rows[0] : null);
    } catch (error) {
      console.error(
        `Error in getCalendarById for service_id: ${req.params.service_id}:`,
        error
      );
      res.status(500).json({ error: "Server Error" });
    }
  },

  deleteCalendarById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { service_id } = req.params;
      await pool.execute(
        `
        DELETE FROM calendar
        WHERE service_id = ? AND user_id = ?
        `,
        [service_id, user_id]
      );
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
      const { service_id, ...updates } = req.body;
      const allowedFields = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
        "start_date",
        "end_date",
        "project_id"
      ];
      const updateFields = [];
      const updateValues = [];

      for (const key in updates) {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(updates[key]);
        } else {
          console.warn(`unexpected fiedl in updateCalendar ${key}`);
        }
      }

      const query = `
        UPDATE calendar
        SET ${updateFields.join(", ")}
        WHERE service_id = ? AND user_id = ?
      `;

      const [result] = await pool.execute(query, [...updateValues, service_id, user_id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Calendar not found" });
      }

      return res.status(200).json({ message: "Calendar successfully updated" });
    } catch (error) {
      console.error(`Error in updateCalendar:`, error);
      res.status(500).json({ error: "Server Error" });
    }
  },

  saveCalendar: async (req, res) => {
    try {
      const user_id = req.user.id;
      const allowedFields = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
        "start_date",
        "end_date",
        "project_id"];
      const { ...params } = req.body;

      const saveValues = [];
      const saveFields = [];
      const placeholders = [];

      for(const param in params){
        if(allowedFields.includes(param)){
          saveFields.push(param);
          saveValues.push(params[param]);
          placeholders.push("?");
        }else{
          console.warn(`unexpected field in saveCalendar ${param}`);
        }
      }

      saveFields.push("user_id");
      placeholders.push("?");
      saveValues.push(user_id);

      const query = `
        INSERT INTO calendar(${saveFields.join(", ")})
        VALUES(${placeholders.join(", ")})
      `;
      const [result] = await pool.execute(query, saveValues);
      res.status(201).json({
        message: "Calendar saved successfully",
        calendar_id: result.insertId,
      });
    } catch (error) {
      console.error(`Error in saveCalendar:`, error);
      res.status(500).json({ error: "Server Error" });
    }
  },
};

module.exports = calendarService;
