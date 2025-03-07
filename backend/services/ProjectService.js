const {pool} = require("../db.js");

const projectService = {
    getProjectsByQuery: async (req, res) => {
        const user_id = req.user.id;
        const validFields = [
          "project_id",
          "file_name",
          "import_date"
        ];
      
        const fields = [];
        const values = [];
        fields.push("user_id = ?")
        values.push(user_id);
      
        for (const param in req.query) {
          if (validFields.includes(param)) {
            fields.push(`${param} = ?`); 
            values.push(req.query[param]); 
          } else {
            console.warn(`Unexpected query parameter: ${param}`); // Log unexpected parameter
          }
        }
      
        let query = `SELECT * FROM projects 
        WHERE ${fields.join(" AND ")}`;
      
        try {
          const [rows] = await pool.execute(query, values);
          res.json(rows.length > 0 ? rows : []);
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: "Server Error", details: error.message });
        }
      },

    updateProject: async (req, res) => {
        try {
            const user_id = req.user.id;
            const {project_id} = req.params;
            const { file_name } = req.body;
            const [result] = await pool.query(`
                UPDATE projects
                SET
                    file_name = ?
                WHERE project_id =? AND user_id = ?
                `, [file_name, project_id, user_id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Project not found" }); 
            }
            res.json({ message: "Project updated successfully" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    },

    deleteProjectById: async (req, res) => {
        try {
            const user_id = req.user.id;
            const {project_id} = req.params;
            await pool.execute(`
                DELETE FROM projects
                WHERE project_id = ? AND user_id = ?
                `, [project_id, user_id]);
            res.json({ message: "Project deleted successfully" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "server error" });
        }
    },
    saveProject: async (req, res) => {
        const user_id = req.user.id;
        const {file_name} = req.body;
        const [result] = await pool.execute(`
            INSERT INTO projects(user_id, file_name)
            VALUES(?, ?)`
        ,[user_id, file_name]);
        res.status(201).json({message: "project successfully saved", project_id: result.insertId});
    }
};

module.exports = projectService;