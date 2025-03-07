const express = require("express");
const router = express.Router();

// import routers
const authController = require("./AuthController.js");
const calendarController = require("./CalendarController.js");
const routeController = require("./RouteController.js");
const stopController = require("./StopController.js");
const stopTimeController = require("./StopTimeController.js");
const tripController = require("./TripController.js");
const projectController = require("./ProjectController.js");
const impExpController = require("./ImpExpController.js")
const agencyController = require("./AgencyController.js");
const adminController = require("./AdminController.js")

// routes
router.use("/auth", authController);
router.use("/calendars", calendarController);
router.use("/routes", routeController);
router.use("/stops", stopController);
router.use("/stop-times", stopTimeController);
router.use("/trips", tripController);
router.use("/projects", projectController);
router.use("/io", impExpController);
router.use("/agencies", agencyController);
router.use("/admin", adminController)

module.exports = router;
