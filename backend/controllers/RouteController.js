const express = require("express");
const router = express.Router();
const auth = require("../routes/auth");

// Services
const routeService = require("../services/RouteService.js");
const stopService = require("../services/StopService.js");
const stopTimeService = require("../services/StopTimeService.js");
const tripService = require("../services/TripService.js");
const calendarService = require("../services/CalendarService.js");

router.use(auth);

// Paths
router.get("/", routeService.getAllRoutes);
router.get("/:route_id/stops", stopService.getStopsByRouteId);
router.get("/:route_id/times", stopTimeService.getTimesByRouteId);
router.get("/:route_id/trips", tripService.getTripsByRouteId);
router.get("/:route_id/calendar", calendarService.getCalendarsByRouteId);
router.get("/:route_id/buses", tripService.getTripsAndStopsByRouteId);

module.exports = router;
