const express = require("express");
const router = express.Router();
const authService = require("../services/AuthService.js");
const importService = require("../services/ImportService");

// Post isteğini async/await ile işleyelim
router.post(
  "/",
  authService.auth,
  importService.upload.single("file"),
  async (req, res) => {
    try {
      await importService.importGTFSData(req, res);
    } catch (error) {
      console.error("Controller Error:", error);
      res.status(500).json({ message: "Import failed in controller" });
    }
  }
);

module.exports = router;
