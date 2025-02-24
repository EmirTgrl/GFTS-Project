const express = require("express");
const router = express.Router();

const stopTimeService = require("../services/StopTimeService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.get("/:project_id", stopTimeService.getStopTimesByProjectId);
router.get("/:trip_id/:stop_id",stopTimeService.getStopTimeById);
router.put("/", stopTimeService.updateStopTime);
router.delete("/:trip_id/:stop_id", stopTimeService.deleteStopTimeById);

module.exports = router;
