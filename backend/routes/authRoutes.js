const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const pool = require("../db.js");

const router = express.Router();

router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
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
      res.status(500).json({ message: "Server Error", error });
    }
  }
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
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
  }
);

module.exports = router;
