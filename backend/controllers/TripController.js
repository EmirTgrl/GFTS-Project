const express = require("express");
const router = express.Router();

const tripService = require("../services/TripService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.get("/:project_id", tripService.getTripsByProjectId);
router.get("/:trip_id",tripService.getTripById);
router.put("/", tripService.updateTrip);
router.delete("/:trip_id", tripService.deleteTripById);
router.post("/", tripService.saveTrip)
router.get("/:route_id",tripService.getTripsByRouteId);

module.exports = router;
