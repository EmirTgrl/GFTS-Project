const express = require("express");
const router = express.Router();
const authService = require("../services/AuthService.js");
const importService = require("../services/ImportService");

router.post(
  "/",
  authService.auth,
  importService.upload.single("file"),
  importService.importGTFSData.bind(importService)
);

module.exports = router;
