const { pool } = require("../db.js");

const userService = {
  // Get all users and their projects for admin
  getAllUsers: async (req, res) => {
    const user_role = req.user.role;

    // Only admin role can access
    if (user_role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized access, only admins can access" });
    }

    const validFields = [
      "id",
      "email",
      "created_at",
      "is_active",
      "role",
      "version",
    ];
    const fields = [];
    const values = [];

    for (const param in req.query) {
      if (validFields.includes(param)) {
        fields.push(`u.${param} = ?`);
        values.push(req.query[param]);
      } else {
        console.warn(`Unexpected query parameter: ${param}`);
      }
    }

    // JOIN query for users and their projects
    let query = `
      SELECT 
        u.id, u.email, u.created_at, u.is_active, u.role, u.version,
        p.project_id, p.user_id, p.file_name, p.import_date
      FROM users u
      LEFT JOIN projects p ON u.id = p.user_id
      ${fields.length > 0 ? " WHERE " + fields.join(" AND ") : ""}
    `;

    try {
      const [rows] = await pool.execute(query, values);

      const usersMap = {};
      rows.forEach((row) => {
        if (!usersMap[row.id]) {
          usersMap[row.id] = {
            id: row.id,
            email: row.email,
            created_at: row.created_at,
            is_active: row.is_active,
            role: row.role,
            version: row.version,
            projects: [],
          };
        }
        if (row.project_id) {
          usersMap[row.id].projects.push({
            project_id: row.project_id,
            user_id: row.user_id,
            file_name: row.file_name,
            import_date: row.import_date,
          });
        }
      });

      const users = Object.values(usersMap);
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  // Delete user by ID (set is_active = false)
  deleteUserById: async (req, res) => {
    const user_role = req.user.role;

    // Only admin role can delete users
    if (user_role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized access, only admins can delete users" });
    }

    try {
      const { id } = req.params;
      const [result] = await pool.execute(
        `UPDATE users SET is_active = false WHERE id = ?`,
        [id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  // Create a new user
  createUser: async (req, res) => {
    const user_role = req.user.role;

    // Only admin role can create users
    if (user_role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized access, only admins can create users" });
    }

    try {
      const validFields = [
        "email",
        "created_at",
        "is_active",
        "role",
        "version",
      ];
      const { ...params } = req.body;

      const fields = [];
      const values = [];
      const placeholders = [];

      for (const param in params) {
        if (validFields.includes(param)) {
          fields.push(param);
          values.push(params[param]);
          placeholders.push("?");
        } else {
          console.warn(`Unexpected field: ${param}`);
        }
      }

      if (!fields.includes("email")) {
        return res.status(400).json({ error: "Email field is required" });
      }

      const query = `
        INSERT INTO users (${fields.join(", ")}, created_at, is_active)
        VALUES (${placeholders.join(", ")}, NOW(), true)
      `;

      const [result] = await pool.execute(query, values);

      res.status(201).json({
        message: "User created successfully",
        user_id: result.insertId,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  // Update a user
  updateUser: async (req, res) => {
    const user_role = req.user.role;

    // Only admin role can update users
    if (user_role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized access, only admins can update users" });
    }

    try {
      const validFields = ["email", "is_active", "role", "version"];
      const { id, ...params } = req.body;

      if (!id) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const fields = [];
      const values = [];

      for (const param in params) {
        if (validFields.includes(param)) {
          fields.push(`${param} = ?`);
          values.push(params[param]);
        } else {
          console.warn(`Unexpected field: ${param}`);
        }
      }

      if (fields.length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const query = `
        UPDATE users
        SET ${fields.join(", ")}
        WHERE id = ?
      `;

      const [result] = await pool.execute(query, [...values, id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
        message: "User updated successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  // Get projects for a specific user
  getUserProjects: async (req, res) => {
    const user_role = req.user.role;

    // Only admin role can view projects
    if (user_role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized access, only admins can view projects" });
    }

    try {
      const { id } = req.params;
      const query = `
        SELECT 
          p.project_id, p.user_id, p.file_name, p.import_date,
          u.email, u.role, u.version
        FROM projects p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
      `;
      const [rows] = await pool.execute(query, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ message: "No projects or user found" });
      }

      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  // Get all GTFS projects
  getAllProjects: async (req, res) => {
    const user_role = req.user.role;

    // Only admin role can view all projects
    if (user_role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized access, only admins can view projects" });
    }

    try {
      const query = `
        SELECT 
          p.project_id, p.user_id, p.file_name, p.import_date,
          u.email, u.role, u.version
        FROM projects p
        JOIN users u ON p.user_id = u.id
      `;
      const [rows] = await pool.execute(query);

      res.json(rows.length > 0 ? rows : []);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },
};

module.exports = userService;
