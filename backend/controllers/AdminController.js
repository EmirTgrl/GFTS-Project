const express = require("express");
const router = express.Router();

const userService = require("../services/UserService.js");
const authService = require("../services/AuthService.js");

// Use auth middleware for all routes
router.use(authService.auth);

// User operations
router.post("/create", userService.createUser);
router.put("/update", userService.updateUser);
router.delete("/delete/:id", userService.deleteUserById);
router.get("/users", userService.getAllUsers);

// Project operations
router.get("/projects", userService.getAllProjects);
router.get("/projects/:id", userService.getUserProjects);

module.exports = router;
