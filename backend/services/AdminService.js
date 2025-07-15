const { pool } = require("../db.js");
const bcrypt = require("bcrypt");

const adminService = {
  // Get all users and their projects for admin (with pagination)
  getAllUsers: async (req, res) => {
    const user_role = req.user.role;

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
      "role_id",
      "version_id",
    ];
    const fields = [];
    const values = [];

    for (const param in req.query) {
      if (validFields.includes(param)) {
        fields.push(`u.${param} = ?`);
        values.push(req.query[param]);
      } else if (param !== "page" && param !== "limit") {
        console.warn(`Unexpected query parameter: ${param}`);
      }
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Count query for total users
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) AS total
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN versions v ON u.version_id = v.id
      LEFT JOIN projects p ON u.id = p.user_id
      ${fields.length > 0 ? " WHERE " + fields.join(" AND ") : ""}
    `;

    let query = `
      SELECT 
        u.id, u.email, u.created_at, u.is_active, 
        r.name as role, v.name as version,
        p.project_id, p.user_id, p.file_name, p.import_date
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN versions v ON u.version_id = v.id
      LEFT JOIN projects p ON u.id = p.user_id
      ${fields.length > 0 ? " WHERE " + fields.join(" AND ") : ""}
      ORDER BY u.id ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    try {
      // Get total count
      const [countRows] = await pool.execute(countQuery, values);
      const total = countRows[0]?.total || 0;

      // Get paginated data
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
      res.json({
        data: users,
        total,
        page,
        limit,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  // Delete user by ID (set is_active = false)
  deleteUserById: async (req, res) => {
    const user_role = req.user.role;

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

    if (user_role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized access, only admins can create users" });
    }

    try {
      const validFields = ["email", "password", "role_id", "version_id"];
      const { ...params } = req.body;

      if (!params.email || !params.password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(params.password, salt);

      // Verify role_id and version_id
      const [roleExists] = await pool.execute(
        "SELECT id FROM roles WHERE id = ?",
        [params.role_id || 1]
      );
      if (roleExists.length === 0) {
        return res.status(400).json({ error: "Invalid role_id" });
      }

      const [versionExists] = await pool.execute(
        "SELECT id FROM versions WHERE id = ?",
        [params.version_id || 1]
      );
      if (versionExists.length === 0) {
        return res.status(400).json({ error: "Invalid version_id" });
      }

      const fields = ["email", "password", "role_id", "version_id"];
      const values = [
        params.email,
        hashedPassword,
        params.role_id || 1,
        params.version_id || 1,
      ];

      const query = `
        INSERT INTO users (${fields.join(", ")}, created_at, is_active)
        VALUES (?, ?, ?, ?, NOW(), true)
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

    if (user_role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized access, only admins can update users" });
    }

    try {
      const validFields = ["email", "is_active", "role_id", "version_id"];
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

      // Verify role_id and version_id if provided
      if (params.role_id) {
        const [roleExists] = await pool.execute(
          "SELECT id FROM roles WHERE id = ?",
          [params.role_id]
        );
        if (roleExists.length === 0) {
          return res.status(400).json({ error: "Invalid role_id" });
        }
      }

      if (params.version_id) {
        const [versionExists] = await pool.execute(
          "SELECT id FROM versions WHERE id = ?",
          [params.version_id]
        );
        if (versionExists.length === 0) {
          return res.status(400).json({ error: "Invalid version_id" });
        }
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
          u.email, r.name as role, v.name as version
        FROM projects p
        JOIN users u ON p.user_id = u.id
        JOIN roles r ON u.role_id = r.id
        JOIN versions v ON u.version_id = v.id
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

  // Get all GTFS projects (with pagination)
  getAllProjects: async (req, res) => {
    const user_role = req.user.role;

    if (user_role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized access, only admins can view projects" });
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    try {
      // Count query for total projects
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM projects p
        JOIN users u ON p.user_id = u.id
        JOIN roles r ON u.role_id = r.id
        JOIN versions v ON u.version_id = v.id
      `;
      const [countRows] = await pool.execute(countQuery);
      const total = countRows[0]?.total || 0;

      // Data query with pagination
      const query = `
        SELECT 
          p.project_id, p.user_id, p.file_name, p.import_date,
          u.email, r.name as role, v.name as version
        FROM projects p
        JOIN users u ON p.user_id = u.id
        JOIN roles r ON u.role_id = r.id
        JOIN versions v ON u.version_id = v.id
        ORDER BY p.project_id DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      const [rows] = await pool.execute(query);

      res.json({
        data: rows.length > 0 ? rows : [],
        total,
        page,
        limit,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  // Get all roles
  getAllRoles: async (req, res) => {
    const user_role = req.user.role;

    if (user_role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized access, only admins can access roles" });
    }

    try {
      const [rows] = await pool.execute("SELECT id, name FROM roles");
      res.json(rows);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  // Create a new role
  createRole: async (req, res) => {
    const user_role = req.user.role;

    if (user_role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized access, only admins can create roles" });
    }

    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Role name is required" });
      }

      const [result] = await pool.execute(
        "INSERT INTO roles (name) VALUES (?)",
        [name]
      );
      res.status(201).json({
        message: "Role created successfully",
        role_id: result.insertId,
        name,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  // Update a role
  updateRole: async (req, res) => {
    const user_role = req.user.role;

    if (user_role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized access, only admins can update roles" });
    }

    try {
      const { id, name } = req.body;
      if (!id || !name) {
        return res.status(400).json({ error: "Role ID and name are required" });
      }

      const [result] = await pool.execute(
        "UPDATE roles SET name = ? WHERE id = ?",
        [name, id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json({ message: "Role updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  // Delete a role
  deleteRole: async (req, res) => {
    const user_role = req.user.role;

    if (user_role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized access, only admins can delete roles" });
    }

    try {
      const { id } = req.params;
      const [users] = await pool.execute(
        "SELECT id FROM users WHERE role_id = ?",
        [id]
      );
      if (users.length > 0) {
        return res
          .status(400)
          .json({ error: "Cannot delete role with associated users" });
      }

      const [result] = await pool.execute("DELETE FROM roles WHERE id = ?", [
        id,
      ]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json({ message: "Role deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  // Get all versions
  getAllVersions: async (req, res) => {
    const user_role = req.user.role;

    if (user_role !== "admin") {
      return res
        .status(403)
        .json({
          error: "Unauthorized access, only admins can access versions",
        });
    }

    try {
      const [rows] = await pool.execute("SELECT id, name FROM versions");
      res.json(rows);
    } catch (error) {
      console.error("Error fetching versions:", error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  // Create a new version
  createVersion: async (req, res) => {
    const user_role = req.user.role;

    if (user_role !== "admin") {
      return res
        .status(403)
        .json({
          error: "Unauthorized access, only admins can create versions",
        });
    }

    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Version name is required" });
      }

      const [result] = await pool.execute(
        "INSERT INTO versions (name) VALUES (?)",
        [name]
      );
      res.status(201).json({
        message: "Version created successfully",
        version_id: result.insertId,
        name,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  // Update a version
  updateVersion: async (req, res) => {
    const user_role = req.user.role;

    if (user_role !== "admin") {
      return res
        .status(403)
        .json({
          error: "Unauthorized access, only admins can update versions",
        });
    }

    try {
      const { id, name } = req.body;
      if (!id || !name) {
        return res
          .status(400)
          .json({ error: "Version ID and name are required" });
      }

      const [result] = await pool.execute(
        "UPDATE versions SET name = ? WHERE id = ?",
        [name, id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Version not found" });
      }
      res.json({ message: "Version updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  // Delete a version
  deleteVersion: async (req, res) => {
    const user_role = req.user.role;

    if (user_role !== "admin") {
      return res
        .status(403)
        .json({
          error: "Unauthorized access, only admins can delete versions",
        });
    }

    try {
      const { id } = req.params;
      const [users] = await pool.execute(
        "SELECT id FROM users WHERE version_id = ?",
        [id]
      );
      if (users.length > 0) {
        return res
          .status(400)
          .json({ error: "Cannot delete version with associated users" });
      }

      const [result] = await pool.execute("DELETE FROM versions WHERE id = ?", [
        id,
      ]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Version not found" });
      }
      res.json({ message: "Version deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },
};

module.exports = adminService;
