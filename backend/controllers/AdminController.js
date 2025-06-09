const express = require("express");
const router = express.Router();
const authService = require("../services/AuthService.js");
const adminService = require("../services/AdminService.js");

router.use(authService.auth);

router.get("/users", adminService.getAllUsers);
router.delete("/users/delete/:id", adminService.deleteUserById);
router.post("/users/create", adminService.createUser);
router.put("/users/update", adminService.updateUser);
router.get("/projects", adminService.getAllProjects);
router.get("/users/:id/projects", adminService.getUserProjects);
router.get("/roles", adminService.getAllRoles);
router.post("/roles/create", adminService.createRole);
router.put("/roles/update", adminService.updateRole);
router.delete("/roles/delete/:id", adminService.deleteRole);
router.get("/versions", adminService.getAllVersions);
router.post("/versions/create", adminService.createVersion);
router.put("/versions/update", adminService.updateVersion);
router.delete("/versions/delete/:id", adminService.deleteVersion);

module.exports = router;
