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

// Tüm ücret ürünlerini getir
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

// Tüm ücret ortamlarını getir
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

// Tüm yolcu kategorilerini getir
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

// Tüm ağları getir
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

// Yeni ücret ürünü ekle
const addFareProduct = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.query;
  const {
    fare_product_name,
    amount,
    currency,
    rider_category_id,
    fare_media_id,
    network_id,
    route_id,
  } = req.body;

  if (!project_id) {
    return res.status(400).json({ message: "project_id zorunlu." });
  }

  if (!fare_product_name || amount == null || !currency) {
    return res.status(400).json({
      message: "fare_product_name, amount ve currency zorunlu.",
    });
  }

  try {
    const result = await fareService.addFareProduct(
      user_id,
      project_id,
      fare_product_name,
      amount,
      currency,
      rider_category_id,
      fare_media_id,
      network_id,
      route_id
    );
    res.status(201).json(result);
  } catch (error) {
    console.error("addFareProduct error:", error.message);
    res.status(400).json({
      message: `Ücret ürünü eklenemedi: ${error.message}`,
      details: error.message,
    });
  }
};

// Yeni ücret ortamı ekle
const addFareMedia = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.query;
  const { fare_media_name, fare_media_type } = req.body;

  if (!project_id) {
    return res.status(400).json({ message: "project_id zorunlu." });
  }

  if (!fare_media_name || fare_media_type == null) {
    return res
      .status(400)
      .json({ message: "fare_media_name ve fare_media_type zorunlu." });
  }

  try {
    const result = await fareService.addFareMedia(
      user_id,
      project_id,
      fare_media_name,
      fare_media_type
    );
    res.status(201).json(result);
  } catch (error) {
    console.error("addFareMedia error:", error.message);
    res.status(400).json({
      message: `Ücret ortamı eklenemedi: ${error.message}`,
      details: error.message,
    });
  }
};

// Yeni yolcu kategorisi ekle
const addRiderCategory = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.query;
  const { rider_category_name, is_default_fare_category, eligibility_url } =
    req.body;

  if (!project_id) {
    return res.status(400).json({ message: "project_id zorunlu." });
  }

  if (!rider_category_name) {
    return res.status(400).json({ message: "rider_category_name zorunlu." });
  }

  try {
    const result = await fareService.addRiderCategory(
      user_id,
      project_id,
      rider_category_name,
      is_default_fare_category || 0,
      eligibility_url
    );
    res.status(201).json(result);
  } catch (error) {
    console.error("addRiderCategory error:", error.message);
    res.status(400).json({
      message: `Yolcu kategorisi eklenemedi: ${error.message}`,
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
router.post("/products", addFareProduct);
router.post("/media", addFareMedia);
router.post("/categories", addRiderCategory);

module.exports = router;
