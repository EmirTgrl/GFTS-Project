const express = require("express");
const router = express.Router();
const paymentService = require("../services/paymentService.js");
const authService = require("../services/AuthService.js");

// Yetkilendirme gereken endpoint'ler
router.post("/sync-versions", authService.auth, async (req, res) => {
  try {
    const result = await paymentService.syncVersionsToIyzico();
    res.status(200).json(result);
  } catch (error) {
    console.error("Version synchronization error:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Ödeme başlatma
router.post("/initialize", authService.auth, async (req, res) => {
  const { versionId } = req.body;
  const userId = req.user.id;

  if (!versionId) {
    return res.status(400).json({ message: "Version ID required" });
  }

  try {
    const result = await paymentService.initializePayment(userId, versionId);
    res.status(200).json({ checkoutFormContent: result.checkoutFormContent });
  } catch (error) {
    console.error("Payment initialization error:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Ödeme callback'i (iyzico webhook ve frontend fallback, yetkilendirme gerektirmez)
router.post("/callback", async (req, res) => {
  const token = req.body.token || req.query.token;
  const paymentConversationId =
    req.body.paymentConversationId || req.query.paymentConversationId;
  console.log("Callback received:", req.body);

  if (!token && !paymentConversationId) {
    console.error("No token or paymentConversationId provided in callback");
    return res.redirect(`http://localhost:5173/payment-failure`);
  }

  try {
    const result = await paymentService.verifyPayment(token);
    if (!result) {
      throw new Error("Payment verification failed");
    }
    console.log("Payment verified successfully:", result);
    res.redirect(`http://localhost:5173/payment-success?token=${result.token}`);
  } catch (error) {
    console.error("Payment verification error:", error.message);
    res.redirect(`http://localhost:5173/payment-failure`);
  }
});

module.exports = router;
