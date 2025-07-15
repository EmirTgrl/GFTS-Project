const { pool } = require("../db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const AccountService = {
  async updateEmail(userId, newEmail, currentUser) {
    try {
      if (!newEmail) {
        throw new Error("Email is required");
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        throw new Error("Invalid email format");
      }

      const [existingEmail] = await pool.query(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [newEmail, userId]
      );

      if (existingEmail.length > 0) {
        throw new Error("Email already in use");
      }

      const [result] = await pool.query(
        "UPDATE users SET email = ? WHERE id = ?",
        [newEmail, userId]
      );

      if (result.affectedRows === 0) {
        throw new Error("User not found or email unchanged");
      }

      const payload = {
        id: userId,
        email: newEmail,
        role: currentUser.role,
        version: currentUser.version,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "3h",
      });

      return { success: true, message: "Email updated successfully", token };
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async updatePassword(userId, currentPassword, newPassword) {
    try {
      if (!currentPassword || !newPassword) {
        throw new Error("Current and new passwords are required");
      }

      const [user] = await pool.query(
        "SELECT password FROM users WHERE id = ?",
        [userId]
      );

      if (user.length === 0) {
        throw new Error("User not found");
      }

      const isMatch = await bcrypt.compare(currentPassword, user[0].password);
      if (!isMatch) {
        throw new Error("Current password is incorrect");
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      const [result] = await pool.query(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedPassword, userId]
      );

      if (result.affectedRows === 0) {
        throw new Error("Failed to update password");
      }

      return { success: true, message: "Password updated successfully" };
    } catch (error) {
      throw new Error(error.message);
    }
  },
};

module.exports = AccountService;
