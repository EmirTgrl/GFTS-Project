const express = require("express");
const router = express.Router();

const stopService = require("../services/StopService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.get("", stopService.getStopsByQuery);
router.get("/all", stopService.getAllStopsByProjectId);
router.get("/:project_id/:stop_id/routes", stopService.getRoutesByStopId);
router.delete(
  "/delete/:stop_id",
  authService.versionCheck,
  stopService.deleteStopByStopId
);
router.put(
  "/update/:stop_id",
  authService.versionCheck,
  stopService.updateStop
);
router.post("/create", authService.versionCheck, stopService.saveStop);

module.exports = router;
