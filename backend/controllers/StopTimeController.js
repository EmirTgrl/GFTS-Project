const express = require("express");
const router = express.Router();

const stopTimeService = require("../services/StopTimeService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.get("/route/:route_id", stopTimeService.getStopsAndStopTimesByRouteId)
router.get("", stopTimeService.getStopsAndStopTimesByQuery);
router.delete("/delete/:trip_id/:stop_id", stopTimeService.deleteStopTimeById);
router.put("/update/:trip_id/:stop_id", stopTimeService.updateStopTime);
router.post("/create", stopTimeService.saveStopTime);
router.post("/create-multiple", stopTimeService.saveMultipleStopsAndTimes)

module.exports = router;
