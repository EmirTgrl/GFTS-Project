const express = require("express");
const router = express.Router();

const fareService = require("../services/FareService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

// Fetch detailed fare for a route
const getFareDetailsForRoute = async (req, res) => {
  const { route_id } = req.params;
  const { project_id } = req.query;
  const user_id = req.user.id;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
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
        .json({ message: "Fare information not found.", data: null });
    }
    res.json(fareDetails);
  } catch (error) {
    console.error("getFareDetailsForRoute error:", error.message);
    res.status(500).json({
      message: "Server error: Could not retrieve fare details.",
      details: error.message,
    });
  }
};

// Fetch all fare products
const getFareProducts = async (req, res) => {
  const { project_id } = req.query;
  const user_id = req.user.id;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  try {
    const products = await fareService.getAllFareProducts(user_id, project_id);
    res.json(products);
  } catch (error) {
    console.error("getFareProducts error:", error.message);
    res.status(500).json({
      message: "Server error: Could not retrieve fare products.",
      details: error.message,
    });
  }
};

// Fetch all fare media
const getFareMedia = async (req, res) => {
  const { project_id } = req.query;
  const user_id = req.user.id;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  try {
    const media = await fareService.getAllFareMedia(user_id, project_id);
    res.json(media);
  } catch (error) {
    console.error("getFareMedia error:", error.message);
    res.status(500).json({
      message: "Server error: Could not retrieve payment methods.",
      details: error.message,
    });
  }
};

// Fetch all rider categories
const getRiderCategories = async (req, res) => {
  const { project_id } = req.query;
  const user_id = req.user.id;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  try {
    const riders = await fareService.getAllRiderCategories(user_id, project_id);
    res.json(riders);
  } catch (error) {
    console.error("getRiderCategories error:", error.message);
    res.status(500).json({
      message: "Server error: Could not retrieve passenger categories.",
      details: error.message,
    });
  }
};

// Fetch all networks
const getNetworks = async (req, res) => {
  const { project_id } = req.query;
  const user_id = req.user.id;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  try {
    const networks = await fareService.getAllNetworks(user_id, project_id);
    res.json(networks);
  } catch (error) {
    console.error("getNetworks error:", error.message);
    res.status(500).json({
      message: "Server error: Could not retrieve networks.",
      details: error.message,
    });
  }
};

// Add a new network
const addNetwork = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.query;
  const { network_id, network_name, route_ids } = req.body;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  if (!network_id || !network_name) {
    return res
      .status(400)
      .json({ message: "network_id and network_name are required." });
  }

  try {
    const result = await fareService.addNetwork(
      user_id,
      project_id,
      network_id,
      network_name,
      route_ids
    );
    res.status(201).json(result);
  } catch (error) {
    console.error("addNetwork error:", error.message);
    res.status(400).json({
      message: `Could not add network: ${error.message}`,
      details: error.message,
    });
  }
};

// Update a network
const updateNetwork = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.query;
  const { network_id } = req.params;
  const { network_name, route_ids } = req.body;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  if (!network_id || !network_name) {
    return res
      .status(400)
      .json({ message: "network_id and network_name are required." });
  }

  try {
    const result = await fareService.updateNetwork(
      user_id,
      project_id,
      network_id,
      network_name,
      route_ids
    );
    res.json(result);
  } catch (error) {
    console.error("updateNetwork error:", error.message);
    res.status(400).json({
      message: `Could not update network: ${error.message}`,
      details: error.message,
    });
  }
};

// Delete a network
const deleteNetwork = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.query;
  const { network_id } = req.params;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  if (!network_id) {
    return res.status(400).json({ message: "network_id is required." });
  }

  try {
    const result = await fareService.deleteNetwork(
      user_id,
      project_id,
      network_id
    );
    res.json(result);
  } catch (error) {
    console.error("deleteNetwork error:", error.message);
    res.status(400).json({
      message: `Could not delete network: ${error.message}`,
      details: error.message,
    });
  }
};

// Fetch all transfer rules
const getFareTransferRules = async (req, res) => {
  const { project_id } = req.query;
  const user_id = req.user.id;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  try {
    const transferRules = await fareService.getAllFareTransferRules(
      user_id,
      project_id
    );
    res.json(transferRules);
  } catch (error) {
    console.error("getFareTransferRules error:", error.message);
    res.status(500).json({
      message: "Server error: Could not retrieve transfer rules.",
      details: error.message,
    });
  }
};

// Add a new fare product
const addFareProduct = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.query;
  const {
    fare_product_name,
    amount,
    currency,
    rider_category_id,
    fare_media_id,
    from_area_id,
    to_area_id,
    route_id,
  } = req.body;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  if (
    !fare_product_name ||
    amount == null ||
    !currency ||
    !from_area_id ||
    !to_area_id
  ) {
    return res.status(400).json({
      message:
        "fare_product_name, amount, currency, from_area_id, and to_area_id are required.",
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
      from_area_id,
      to_area_id,
      route_id
    );
    res.status(201).json(result);
  } catch (error) {
    console.error("addFareProduct error:", error.message);
    res.status(400).json({
      message: `Could not add fare product: ${error.message}`,
      details: error.message,
    });
  }
};

// Add a new fare media
const addFareMedia = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.query;
  const { fare_media_id, fare_media_name, fare_media_type } = req.body;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  if (!fare_media_id || !fare_media_name || fare_media_type == null) {
    return res
      .status(400)
      .json({
        message:
          "fare_media_id, fare_media_name, and fare_media_type are required.",
      });
  }

  try {
    const result = await fareService.addFareMedia(
      user_id,
      project_id,
      fare_media_id,
      fare_media_name,
      fare_media_type
    );
    res.status(201).json(result);
  } catch (error) {
    console.error("addFareMedia error:", error.message);
    res.status(400).json({
      message: `Could not add payment method: ${error.message}`,
      details: error.message,
    });
  }
};

// Add a new rider category
const addRiderCategory = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.query;
  const {
    rider_category_id,
    rider_category_name,
    is_default_fare_category,
    eligibility_url,
  } = req.body;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  if (!rider_category_id || !rider_category_name) {
    return res
      .status(400)
      .json({
        message: "rider_category_id and rider_category_name are required.",
      });
  }

  try {
    const result = await fareService.addRiderCategory(
      user_id,
      project_id,
      rider_category_id,
      rider_category_name,
      is_default_fare_category || 0,
      eligibility_url
    );
    res.status(201).json(result);
  } catch (error) {
    console.error("addRiderCategory error:", error.message);
    res.status(400).json({
      message: `Could not add passenger category: ${error.message}`,
      details: error.message,
    });
  }
};

// Add a new transfer rule
const addFareTransferRule = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.query;
  const {
    from_leg_group_id,
    to_leg_group_id,
    transfer_count,
    duration_limit,
    duration_limit_type,
    fare_transfer_type,
    fare_product_id,
  } = req.body;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  if (!from_leg_group_id || !to_leg_group_id || fare_transfer_type == null) {
    return res.status(400).json({
      message:
        "from_leg_group_id, to_leg_group_id, and fare_transfer_type are required.",
    });
  }

  try {
    const result = await fareService.addFareTransferRule(
      user_id,
      project_id,
      from_leg_group_id,
      to_leg_group_id,
      transfer_count || 1,
      duration_limit,
      duration_limit_type,
      fare_transfer_type,
      fare_product_id
    );
    res.status(201).json(result);
  } catch (error) {
    console.error("addFareTransferRule error:", error.message);
    res.status(400).json({
      message: `Could not add transfer rule: ${error.message}`,
      details: error.message,
    });
  }
};

// Update a fare product
const updateFareProduct = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.query;
  const { fare_product_id } = req.params;
  const {
    fare_product_name,
    amount,
    currency,
    rider_category_id,
    fare_media_id,
  } = req.body;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  if (!fare_product_name || amount == null || !currency) {
    return res.status(400).json({
      message: "fare_product_name, amount, and currency are required.",
    });
  }

  try {
    const result = await fareService.updateFareProduct(
      user_id,
      project_id,
      fare_product_id,
      fare_product_name,
      amount,
      currency,
      rider_category_id,
      fare_media_id
    );
    res.json(result);
  } catch (error) {
    console.error("updateFareProduct error:", error.message);
    res.status(400).json({
      message: `Could not update fare product: ${error.message}`,
      details: error.message,
    });
  }
};

// Delete a fare product
const deleteFareProduct = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.body; // Taking project_id from body for DELETE
  const { fare_product_id } = req.params;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  try {
    const result = await fareService.deleteFareProduct(
      user_id,
      project_id,
      fare_product_id
    );
    res.json(result);
  } catch (error) {
    console.error("deleteFareProduct error:", error.message);
    res.status(400).json({
      message: `Could not delete fare product: ${error.message}`,
      details: error.message,
    });
  }
};

// Update a fare media
const updateFareMedia = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.query;
  const { fare_media_id } = req.params;
  const { fare_media_name, fare_media_type } = req.body;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  if (!fare_media_name || fare_media_type == null) {
    return res
      .status(400)
      .json({ message: "fare_media_name and fare_media_type are required." });
  }

  try {
    const result = await fareService.updateFareMedia(
      user_id,
      project_id,
      fare_media_id,
      fare_media_name,
      fare_media_type
    );
    res.json(result);
  } catch (error) {
    console.error("updateFareMedia error:", error.message);
    res.status(400).json({
      message: `Could not update payment method: ${error.message}`,
      details: error.message,
    });
  }
};

// Delete a fare media
const deleteFareMedia = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.body; // Taking project_id from body for DELETE
  const { fare_media_id } = req.params;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  try {
    const result = await fareService.deleteFareMedia(
      user_id,
      project_id,
      fare_media_id
    );
    res.json(result);
  } catch (error) {
    console.error("deleteFareMedia error:", error.message);
    res.status(400).json({
      message: `Could not delete payment method: ${error.message}`,
      details: error.message,
    });
  }
};

// Update a rider category
const updateRiderCategory = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.query;
  const { rider_category_id } = req.params;
  const { rider_category_name, is_default_fare_category, eligibility_url } =
    req.body;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  if (!rider_category_name) {
    return res
      .status(400)
      .json({ message: "rider_category_name is required." });
  }

  try {
    const result = await fareService.updateRiderCategory(
      user_id,
      project_id,
      rider_category_id,
      rider_category_name,
      is_default_fare_category || 0,
      eligibility_url
    );
    res.json(result);
  } catch (error) {
    console.error("updateRiderCategory error:", error.message);
    res.status(400).json({
      message: `Could not update passenger category: ${error.message}`,
      details: error.message,
    });
  }
};

// Delete a rider category
const deleteRiderCategory = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.body; // Taking project_id from body for DELETE
  const { rider_category_id } = req.params;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  try {
    const result = await fareService.deleteRiderCategory(
      user_id,
      project_id,
      rider_category_id
    );
    res.json(result);
  } catch (error) {
    console.error("deleteRiderCategory error:", error.message);
    res.status(400).json({
      message: `Could not delete passenger category: ${error.message}`,
      details: error.message,
    });
  }
};

// Update a transfer rule
const updateFareTransferRule = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.query;
  const { from_leg_group_id, to_leg_group_id } = req.params;
  const {
    transfer_count,
    duration_limit,
    duration_limit_type,
    fare_transfer_type,
    fare_product_id,
  } = req.body;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  if (fare_transfer_type == null) {
    return res.status(400).json({ message: "fare_transfer_type is required." });
  }

  try {
    const result = await fareService.updateFareTransferRule(
      user_id,
      project_id,
      from_leg_group_id,
      to_leg_group_id,
      transfer_count || 1,
      duration_limit,
      duration_limit_type,
      fare_transfer_type,
      fare_product_id
    );
    res.json(result);
  } catch (error) {
    console.error("updateFareTransferRule error:", error.message);
    res.status(400).json({
      message: `Could not update transfer rule: ${error.message}`,
      details: error.message,
    });
  }
};

// Delete a transfer rule
const deleteFareTransferRule = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.body; // Taking project_id from body for DELETE
  const { from_leg_group_id, to_leg_group_id } = req.params;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  try {
    const result = await fareService.deleteFareTransferRule(
      user_id,
      project_id,
      from_leg_group_id,
      to_leg_group_id
    );
    res.json(result);
  } catch (error) {
    console.error("deleteFareTransferRule error:", error.message);
    res.status(400).json({
      message: `Could not delete transfer rule: ${error.message}`,
      details: error.message,
    });
  }
};

// Fetch all leg groups
const getLegGroups = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.query;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  try {
    const legGroups = await fareService.getAllLegGroups(user_id, project_id);
    res.json(legGroups);
  } catch (error) {
    console.error("getLegGroups error:", error.message);
    res.status(500).json({
      message: "Server error: Could not retrieve leg groups.",
      details: error.message,
    });
  }
};

// Fetch all areas
const getAreas = async (req, res) => {
  const { project_id } = req.query;
  const user_id = req.user.id;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  try {
    const areas = await fareService.getAllAreas(user_id, project_id);
    res.json(areas);
  } catch (error) {
    console.error("getAreas error:", error.message);
    res.status(500).json({
      message: "Server error: Could not retrieve areas.",
      details: error.message,
    });
  }
};

// Add a new area
const addArea = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.query;
  const { area_id, area_name, stop_ids } = req.body;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  if (!area_id || !area_name) {
    return res
      .status(400)
      .json({ message: "area_id and area_name are required." });
  }

  try {
    const result = await fareService.addArea(
      user_id,
      project_id,
      area_id,
      area_name,
      stop_ids || []
    );
    res.status(201).json(result);
  } catch (error) {
    console.error("addArea error:", error.message);
    res.status(400).json({
      message: `Could not add area: ${error.message}`,
      details: error.message,
    });
  }
};

// Update an area
const updateArea = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.query;
  const { area_id } = req.params;
  const { area_name, stop_ids } = req.body;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  if (!area_id || !area_name) {
    return res
      .status(400)
      .json({ message: "area_id and area_name are required." });
  }

  try {
    const result = await fareService.updateArea(
      user_id,
      project_id,
      area_id,
      area_name,
      stop_ids || []
    );
    res.json(result);
  } catch (error) {
    console.error("updateArea error:", error.message);
    res.status(400).json({
      message: `Could not update area: ${error.message}`,
      details: error.message,
    });
  }
};

// Delete an area
const deleteArea = async (req, res) => {
  const user_id = req.user.id;
  const { project_id } = req.query;
  const { area_id } = req.params;

  if (!project_id) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  if (!area_id) {
    return res.status(400).json({ message: "area_id is required." });
  }

  try {
    const result = await fareService.deleteArea(user_id, project_id, area_id);
    res.json(result);
  } catch (error) {
    console.error("deleteArea error:", error.message);
    res.status(400).json({
      message: `Could not delete area: ${error.message}`,
      details: error.message,
    });
  }
};

// RESTful routes
router.get("/route/:route_id", getFareDetailsForRoute);
router.get("/products", getFareProducts);
router.get("/media", getFareMedia);
router.get("/categories", getRiderCategories);
router.get("/networks", getNetworks);
router.post("/networks", addNetwork);
router.put("/networks/:network_id", updateNetwork);
router.delete("/networks/:network_id", deleteNetwork);
router.get("/transfer-rules", getFareTransferRules);
router.post("/products", addFareProduct);
router.post("/media", addFareMedia);
router.post("/categories", addRiderCategory);
router.post("/transfer-rules", addFareTransferRule);
router.put("/products/:fare_product_id", updateFareProduct);
router.delete("/products/:fare_product_id", deleteFareProduct);
router.put("/media/:fare_media_id", updateFareMedia);
router.delete("/media/:fare_media_id", deleteFareMedia);
router.put("/categories/:rider_category_id", updateRiderCategory);
router.delete("/categories/:rider_category_id", deleteRiderCategory);
router.put(
  "/transfer-rules/:from_leg_group_id/:to_leg_group_id",
  updateFareTransferRule
);
router.delete(
  "/transfer-rules/:from_leg_group_id/:to_leg_group_id",
  deleteFareTransferRule
);
router.get("/leg-groups", getLegGroups);
router.get("/areas", getAreas);
router.post("/areas", addArea);
router.put("/areas/:area_id", updateArea);
router.delete("/areas/:area_id", deleteArea);

module.exports = router;
