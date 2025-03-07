const express = require("express");
const router = express.Router();

// Services
const routeService = require("../services/RouteService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

// Paths
router.get("", routeService.getRoutesByQuery)
router.delete("/delete/:route_id", routeService.deleteRouteById);
router.put("/update/:route_id", routeService.updateRoute);
router.post("/create", routeService.saveRoute);

module.exports = router;
