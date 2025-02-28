const {pool} = require("../db.js");

const projectService = {
    getAllProjects: async (req, res) => {
        try {
            const user_id = req.user.id;
            const query = "SELECT * FROM projects WHERE user_id = ?";
            const [rows] = await pool.query(query, [user_id]);
            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "server error" });
        }
    },

    getProjectById: async (req, res) => {
        try {
            const { project_id } = req.params;
            const user_id = req.user.id;
            const query = "SELECT * FROM projects WHERE project_id = ? AND user_id = ?";
            const [rows] = await pool.query(query, [project_id, user_id]);

            if (rows.length === 0) {
                return res.status(404).json({ message: "Project not found" });
            }

            res.json(rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    },

    updateProject: async (req, res) => {
        try {
            const user_id = req.user.id;
            const { project_id, file_name } = req.body;
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
            INSERT INTO projets(user_id, file_name)
            VALUES(?, ?)`
        ,[user_id, file_name]);
        res.status(201).json({message: "project successfully saved", project_id: result.insertId});
    }
};

module.exports = projectService;