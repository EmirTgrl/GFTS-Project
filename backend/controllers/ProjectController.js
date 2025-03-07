const express = require("express");
const router = express.Router();

const projectService = require("../services/ProjectService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.get("",projectService.getProjectsByQuery);
router.delete("/delete/:project_id", projectService.deleteProjectById);
router.post("/create", projectService.saveProject)
router.put("/update/:project_id", projectService.updateProject);

module.exports = router;
