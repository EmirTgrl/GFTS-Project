// FareController.js
const express = require("express");
const router = express.Router();

const fareService = require("../services/FareService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

// Belirli bir rota için ücret detaylarını getir
const getFareDetailsForRoute = async (req, res) => {
  const { route_id } = req.params;
  const { project_id } = req.query;
  const user_id = req.user.id;

  if (!project_id) {
    return res.status(400).json({ message: "project_id zorunlu." });
  }

  try {
    const fareDetails = await fareService.getDetailedFareForRoute(
      route_id,
      user_id,
      project_id
    );
    if (!fareDetails) {
      return res
        .status(200)
        .json({ message: "Ücret bilgisi bulunamadı.", data: null });
    }
    res.json(fareDetails);
  } catch (error) {
    console.error("getFareDetailsForRoute error:", error.message);
    res.status(500).json({
      message: `Sunucu hatası: Ücret detayları alınamadı.`,
      details: error.message,
    });
  }
};

const getFareProducts = async (req, res) => {
  const { project_id } = req.query;
  const user_id = req.user.id;

  if (!project_id) {
    return res.status(400).json({ message: "project_id zorunlu." });
  }

  try {
    const products = await fareService.getAllFareProducts(user_id, project_id);
    res.json(products);
  } catch (error) {
    console.error("getFareProducts error:", error.message);
    res.status(500).json({
      message: "Sunucu hatası: Ücret ürünleri alınamadı.",
      details: error.message,
    });
  }
};

const getFareMedia = async (req, res) => {
  const { project_id } = req.query;
  const user_id = req.user.id;

  if (!project_id) {
    return res.status(400).json({ message: "project_id zorunlu." });
  }

  try {
    const media = await fareService.getAllFareMedia(user_id, project_id);
    res.json(media);
  } catch (error) {
    console.error("getFareMedia error:", error.message);
    res.status(500).json({
      message: "Sunucu hatası: Ödeme yöntemleri alınamadı.",
      details: error.message,
    });
  }
};

const getRiderCategories = async (req, res) => {
  const { project_id } = req.query;
  const user_id = req.user.id;

  if (!project_id) {
    return res.status(400).json({ message: "project_id zorunlu." });
  }

  try {
    const riders = await fareService.getAllRiderCategories(user_id, project_id);
    res.json(riders);
  } catch (error) {
    console.error("getRiderCategories error:", error.message);
    res.status(500).json({
      message: "Sunucu hatası: Yolcu kategorileri alınamadı.",
      details: error.message,
    });
  }
};

const getNetworks = async (req, res) => {
  const { project_id } = req.query;
  const user_id = req.user.id;

  if (!project_id) {
    return res.status(400).json({ message: "project_id zorunlu." });
  }

  try {
    const networks = await fareService.getAllNetworks(user_id, project_id);
    res.json(networks);
  } catch (error) {
    console.error("getNetworks error:", error.message);
    res.status(500).json({
      message: "Sunucu hatası: Ağlar alınamadı.",
      details: error.message,
    });
  }
};

const createFare = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.query;
  const { trip_id } = req.params;
  const {
    fareProductData,
    rider_category_id,
    media_id,
    timeframe_id,
    network_name,
  } = req.body;

  if (!project_id) {
    return res.status(400).json({ message: "project_id zorunlu." });
  }

  try {
    const result = await fareService.createFareForTrip(
      user_id,
      project_id,
      trip_id,
      fareProductData,
      rider_category_id,
      media_id,
      timeframe_id,
      network_name
    );
    res.status(201).json(result);
  } catch (error) {
    console.error("createFare error:", error.message);
    res.status(400).json({
      message: `Ücret oluşturulamadı: ${error.message}`,
      details: error.message,
    });
  }
};

// RESTful rotalar
router.get("/route/:route_id", getFareDetailsForRoute); 
router.get("/products", getFareProducts);
router.get("/media", getFareMedia);
router.get("/categories", getRiderCategories);
router.get("/networks", getNetworks);
router.post("/trip/:trip_id", createFare);

module.exports = router;
