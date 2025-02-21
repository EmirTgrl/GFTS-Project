const express = require("express");
const router = express.Router();

// import routers
const routeController = require("./RouteController.js");
const stopController = require("./StopController.js");
const authController = require("./AuthController.js");

// routes
router.use("/routes", routeController);
router.use("/stops", stopController);
router.use("/auth", authController);

module.exports = router;
