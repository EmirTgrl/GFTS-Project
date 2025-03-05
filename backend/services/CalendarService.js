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
        WHERE service_id = ? AND user_id = ?
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
        service_id,
        user_id,
      ]);
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
      const { project_id } = req.body; // project_id'yi body'den alıyoruz
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

      if (!project_id) {
        return res.status(400).json({ error: "project_id is required" });
      }

      // O projeye ait en yüksek sayısal service_id değerini bul
      const [rows] = await pool.execute(
        `SELECT MAX(CAST(service_id AS UNSIGNED)) as max_id 
         FROM calendar 
         WHERE project_id = ? AND service_id REGEXP '^[0-9]+$'`,
        [project_id]
      );
      const maxId = rows[0].max_id || 0; // Eğer projede kayıt yoksa 0'dan başla
      const newServiceId = (maxId + 1).toString(); // Bir sonraki değeri string'e çevir

      const query = `
        INSERT INTO calendar(service_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday, start_date, end_date, user_id, project_id)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await pool.execute(query, [
        newServiceId,
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
        start_date,
        end_date,
        user_id,
        project_id,
      ]);

      res.status(201).json({
        message: "Calendar saved successfully",
        calendar_id: result.insertId, // Otomatik artan ID (eğer varsa)
        service_id: newServiceId, // Oluşturulan service_id
      });
    } catch (error) {
      console.error(`Error in saveCalendar:`, error);
      res.status(500).json({ error: "Server Error" });
    }
  },

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
};

module.exports = calendarService;
