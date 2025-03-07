const express = require("express");
const router = express.Router();

const tripService = require("../services/TripService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.get("", tripService.getTripsByQuery);
router.put("/update/:trip_id", tripService.updateTrip);
router.delete("/delete/:trip_id", tripService.deleteTripById);
router.post("/create", tripService.saveTrip)

module.exports = router;