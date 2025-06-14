const express = require("express");
const router = express.Router();

// Services
const routeService = require("../services/RouteService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

// Paths
router.get("", routeService.getRoutesByQuery);
router.delete(
  "/delete/:route_id",
  authService.versionCheck,
  routeService.deleteRouteById
);
router.put(
  "/update/:route_id",
  authService.versionCheck,
  routeService.updateRoute
);
router.post("/create", authService.versionCheck, routeService.saveRoute);

module.exports = router;
