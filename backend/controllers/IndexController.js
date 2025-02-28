const express = require("express");
const router = express.Router();

// import routers
const authController = require("./AuthController.js");
const calendarController = require("./CalendarController.js");
const routeController = require("./RouteController.js");
const stopController = require("./StopController.js");
const stopTimeController = require("./StopTimeController.js");
const tripController = require("./TripController.js")
const projectController = require("./ProjectController.js")
const importController = require("./ImportController.js");

// routes
router.use("/auth", authController);
router.use("/calendars", calendarController);
router.use("/routes",routeController);
router.use("/stops", stopController);
router.use("/stop-times", stopTimeController);
router.use("/trips", tripController)
router.use("/projects", projectController);
router.use("/import", importController);

module.exports = router;
