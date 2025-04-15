const express = require("express");
const router = express.Router();

const statsService = require("../services/StatsService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.get("/global", statsService.getGlobalStats);

module.exports = router;
