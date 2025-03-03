const express = require("express");
const router = express.Router();

const projectService = require("../services/ProjectService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.get("/:project_id",projectService.getProjectById);
router.delete("/:project_id", projectService.deleteProjectById);
router.get("/", projectService.getAllProjects);
router.post("/", projectService.saveProject)
router.put("/", projectService.updateProject);

module.exports = router;
