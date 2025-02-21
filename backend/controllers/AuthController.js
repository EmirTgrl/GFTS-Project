const express = require("express");
const router = express.Router();

const authService = require("../services/AuthService.js");

router.post("/login", authService.login);

router.post("/register", authService.register);

module.exports = router;
