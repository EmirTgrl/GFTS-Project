const express = require("express");
const router = express.Router();

// Services
const routeService = require("../services/RouteService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

// Paths
router.get("/project/:project_id", routeService.getRoutesByProjectId);
router.get("/:project_id/:route_id", routeService.getRouteById);
router.delete("/:project_id/:route_id", routeService.deleteRouteById);
router.put("/", routeService.updateRoute);
router.post("/", routeService.saveRoute);

module.exports = router;
