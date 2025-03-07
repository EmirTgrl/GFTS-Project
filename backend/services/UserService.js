const { pool } = require("../db.js");

const userService = {
    getAllUsers: async (req, res) => {
        try {
            const [rows] = await pool.execute(
                `SELECT * FROM users`
            );
            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Server Error", details: error.message });
        }
    },
    deleteUserById: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await pool.execute(
                `UPDATE users
                SET is_active = false
                WHERE id = ?`
                , [id]
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "User Not Found" })
            }
            return res.status(200).json({ message: "User deleted successfully" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Server Error", details: error.message });
        }
    },
    createUser: async (req, res) => {
        try {
            const validFields = [
                "email",
                "password",
                "is_active"
            ];
            const { ...params } = req.body;

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


            const query = `
                INSERT INTO users (${fields.join(", ")})
                VALUES (${placeholders.join(", ")})
            `;

            const [result] = await pool.execute(query, values);

            res.status(201).json({
                message: "user created successfully",
                user_id: result.insertId,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Server Error", details: error.message });
        }
    },
    updateUser: async (req, res) => {
        try {
            const validFields = [
                "id",
                "email",
                "password",
                "is_active"
            ];
            const { id, ...params } = req.body;

            const fields = [];
            const values = [];

            for (const param in params) {
                if (validFields.includes(param)) {
                    fields.push(`${param} = ?`);
                    values.push(params[param]);
                } else {
                    console.warn(`unexpected field in ${param}`);
                }
            }


            const query = `
                UPDATE users
                SET ${fields.join(", ")}
                WHERE id = ?
            `;

            await pool.execute(query, [...values , id]);

            res.status(201).json({
                message: "user updated successfully",
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Server Error", details: error.message });
        }
    }

}

module.exports = userService;