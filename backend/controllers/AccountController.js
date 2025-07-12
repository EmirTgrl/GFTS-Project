const express = require("express");
const router = express.Router();

const accountService = require("../services/AccountService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.put("/update-email", async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user.id;
    if (!newEmail) {
      return res.status(400).json({ error: "Email is required" });
    }
    const result = await accountService.updateEmail(userId, newEmail, req.user);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/update-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current and new passwords are required" });
    }
    const result = await accountService.updatePassword(
      userId,
      currentPassword,
      newPassword
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
