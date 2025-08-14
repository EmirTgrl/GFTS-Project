const express = require("express");
const router = express.Router();
const paymentService = require("../services/PaymentService.js");
const authService = require("../services/AuthService.js");

// Ödeme başlatma
router.post("/initialize", authService.auth, async (req, res) => {
  const { versionId } = req.body;
  const userId = req.user.id;

  if (!versionId) {
    return res.status(400).json({ message: "Version ID required" });
  }

  try {
    const result = await paymentService.initializePayment(userId, versionId);
    res.status(200).json({ paymentLink: result.paymentLink });
  } catch (error) {
    console.error("Payment initialization error:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Ödeme callback'i (iyzico webhook, yetkilendirme gerektirmez)
router.post("/callback", async (req, res) => {
  const token = req.body.token;
  const callbackData = req.body; // Tüm callback verilerini ilet
  console.log("Callback received:", callbackData);

  if (!token) {
    console.error("No token provided in callback");
    return res.redirect(`http://localhost:5173/payment-failure`);
  }

  try {
    const result = await paymentService.verifyPayment(token, callbackData);
    console.log("Payment verified successfully:", result);
    res.redirect(`http://localhost:5173/payment-success?token=${result.token}`);
  } catch (error) {
    console.error("Payment verification error:", error.message);
    res.redirect(`http://localhost:5173/payment-failure`);
  }
});

module.exports = router;
