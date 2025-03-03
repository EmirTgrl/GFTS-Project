const express = require("express");
const router = express.Router();
const authService = require("../services/AuthService.js");
const importService = require("../services/ImportService.js");
const exportService = require("../services/ExportService.js");

router.use(authService.auth);

router.post(
  "/import",
  importService.upload.single("file"),
  importService.importGTFSData.bind(importService)
);

router.get("/export/:project_id", exportService.exportGTFS);

module.exports = router;
