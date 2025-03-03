const express = require("express");
const router = express.Router();

const calendarService = require("../services/CalendarService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.get("/project/:project_id", calendarService.getCalendarsByProjectId);
router.get("/:service_id", calendarService.getCalendarById);
router.delete("/:service_id", calendarService.deleteCalendarById);
router.put("/", calendarService.updateCalendar);
router.post("/", calendarService.saveCalendar);

module.exports = router;
