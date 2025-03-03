const express = require("express");
const router = express.Router();
const authService = require("../services/AuthService.js");
const exportService = require("../services/ExportService.js");

router.use(authService.auth);

router.get("/:project_id", exportService.exportGTFS);

module.exports = router;
