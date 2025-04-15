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

router.post(
  "/validate/:project_id",
  importService.upload.single("file"),
  async (req, res) => {
    try {
      const { project_id } = req.params;
      const zipPath = req.file.path;

      const validationResult = await importService.validateGTFS(zipPath);

      res.json(validationResult);
    } catch (error) {
      console.error("Validation error:", error);
      res
        .status(500)
        .json({ message: "Validation failed", error: error.message });
    }
  }
);

module.exports = router;
