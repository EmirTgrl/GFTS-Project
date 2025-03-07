const express = require("express");
const router = express.Router();

const calendarService = require("../services/CalendarService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.get("", calendarService.getCalendarByQuery);
router.delete("/delete/:service_id", calendarService.deleteCalendarById);
router.put("/update/:service_id", calendarService.updateCalendar);
router.post("/create", calendarService.saveCalendar);

module.exports = router;
