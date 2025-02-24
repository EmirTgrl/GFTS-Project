const express = require("express");
const router = express.Router();

const projectService = require("../services/ProjectService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.get("/", projectService.getAllProjects);
router.get("/:project_id",projectService.getProjectById);
router.put("/", projectService.updateProject);
router.delete("/:project_id", projectService.deleteProjectById);
router.post("/", projectService.saveProject)

module.exports = router;
