const express = require("express");
const router = express.Router();

const stopTimeService = require("../services/StopTimeService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.get("/stops/:trip_id", stopTimeService.getStopsAndStopTimes);
router.get("/project/:project_id", stopTimeService.getStopTimesByProjectId);
router.get("/:trip_id/:stop_id", stopTimeService.getStopTimeById);
router.delete("/:trip_id/:stop_id", stopTimeService.deleteStopTimeById);
router.put("/", stopTimeService.updateStopTime);

module.exports = router;
