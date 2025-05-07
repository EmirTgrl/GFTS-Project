const express = require("express");
const router = express.Router();

const stopService = require("../services/StopService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.get("", stopService.getStopsByQuery);
router.get("/all", stopService.getAllStopsByProjectId);
router.delete("/delete/:stop_id", stopService.deleteStopByStopId);
router.put("/update/:stop_id", stopService.updateStop);
router.post("/create", stopService.saveStop);

module.exports = router;
