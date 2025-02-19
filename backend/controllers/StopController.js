const express = require("express");
const router = express.Router();

const stopService = require("../services/StopService.js");

router.get("/", stopService.getAllStops);

module.exports = router;
