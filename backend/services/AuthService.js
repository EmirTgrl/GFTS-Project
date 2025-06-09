const { pool } = require("../db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authService = {
  register: async (req, res) => {
    try {
      const { email, password, role_id = 1, version_id = 1 } = req.body; // Default to role_id=1 and version_id=1
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Verify role_id and version_id exist
      const [roleExists] = await pool.execute(
        "SELECT id FROM roles WHERE id = ?",
        [role_id]
      );
      if (roleExists.length === 0) {
        return res.status(400).json({ message: "Invalid role_id" });
      }

      const [versionExists] = await pool.execute(
        "SELECT id FROM versions WHERE id = ?",
        [version_id]
      );
      if (versionExists.length === 0) {
        return res.status(400).json({ message: "Invalid version_id" });
      }

      const [result] = await pool.execute(
        "INSERT INTO users (email, password, role_id, version_id, created_at, is_active) VALUES (?, ?, ?, ?, NOW(), true)",
        [email, hashedPassword, role_id, version_id]
      );
      res.status(201).json({
        message: "User created successfully",
        userId: result.insertId,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const [users] = await pool.execute(
        `SELECT u.id, u.email, u.password, r.name as role, v.name as version 
         FROM users u
         JOIN roles r ON u.role_id = r.id
         JOIN versions v ON u.version_id = v.id
         WHERE u.email = ? AND u.is_active = true`,
        [email]
      );

      if (users.length === 0) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const user = users[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          version: user.version,
        },
        process.env.JWT_SECRET,
        { expiresIn: "10h" }
      );
      res.json({ token, id: user.id, role: user.role, version: user.version });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },

  auth: async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided!" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "Malformed token: No token after Bearer" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        version: decoded.version,
      };
      next();
    } catch (err) {
      console.error("JWT Error:", err);
      return res
        .status(400)
        .json({ message: "Invalid token!", details: err.message });
    }
  },
};

module.exports = authService;
