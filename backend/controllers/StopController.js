const express = require("express");
const router = express.Router();

const stopService = require("../services/StopService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.get("/project/:project_id", stopService.getStopsByProjectId);
router.get("/:stop_id",stopService.getStopById);
router.delete("/:stop_id", stopService.deleteStopByStopId);
router.put("/", stopService.updateStop);
router.post("/", stopService.saveStop);

module.exports = router;
