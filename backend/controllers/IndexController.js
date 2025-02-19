const express = require("express");
const router = express.Router();

// import routers
const routeController = require("./RouteController.js");
const stopController = require("./StopController.js");

// routes
router.use("/routes",routeController);
router.use("/stops", stopController)

module.exports = router;