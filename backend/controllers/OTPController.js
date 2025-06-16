const express = require("express");
const router = express.Router();

const otpService = require("../services/OTPService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.get("/plan", async (req, res) => {
  try {
    const { fromLat, fromLon, toLat, toLon, date, time, mode } = req.query;

    if (!fromLat || !fromLon || !toLat || !toLon || !date || !time) {
      return res.status(400).json({
        status: "error",
        message:
          "Missing required parameters: fromLat, fromLon, toLat, toLon, date, and time are required",
      });
    }

    const tripData = await otpService.planTrip({
      fromLat: parseFloat(fromLat),
      fromLon: parseFloat(fromLon),
      toLat: parseFloat(toLat),
      toLon: parseFloat(toLon),
      date,
      time,
      mode,
    });

    console.log("OTP tripData:", tripData);

    res.status(200).json({
      status: "success",
      data: tripData,
    });
  } catch (error) {
    console.error("OTP Controller Error:", error.message);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to plan trip",
    });
  }
});

module.exports = router;
