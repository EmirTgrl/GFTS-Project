const express = require("express");
const router = express.Router();

const tripService = require("../services/TripService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.get("", tripService.getTripsByQuery);
router.put(
  "/update/:trip_id",
  authService.versionCheck,
  tripService.updateTrip
);
router.delete(
  "/delete/:trip_id",
  authService.versionCheck,
  tripService.deleteTripById
);
router.post("/create", authService.versionCheck, tripService.saveTrip);
router.post("/copy", authService.versionCheck, tripService.copyTrip);

module.exports = router;
