const { pool } = require("../db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authService = {
  register: async (req, res) => {
    try {
      const { email, password } = req.body;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const [result] = await pool.execute(
        "INSERT INTO users (email, password) VALUES (?, ?)",
        [email, hashedPassword]
      );
      res.status(201).json({
        message: "User created successfully",
        userId: result.insertId,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error", error });
    }
  },
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const [users] = await pool.execute(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      if (users.length === 0)
        return res.status(400).json({ message: "Invalid credentials" });

      const user = users[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Invalid credentials" });

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      res.json({ token, id: user.id });
    } catch (error) {
      res.status(500).json({ message: "Server Error", error });
    }
  },
  auth: async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided!" });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id };
      next();
    } catch (err) {
      console.error("JWT Error:", err);
      return res.status(400).json({ message: "Invalid token!" });
    }
  },
};

module.exports = authService;
