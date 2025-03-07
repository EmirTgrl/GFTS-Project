const express = require("express");
const router = express.Router();

const userService = require("../services/UserService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth)

router.post("/users/create", userService.createUser)
router.put("/users/update", userService.updateUser)
router.delete("/users/delete/:id", userService.deleteUserById)
router.get("/users",userService.getAllUsers);

module.exports = router;