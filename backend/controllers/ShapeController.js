const express = require("express");
const router = express.Router();

const shapeService = require("../services/ShapeService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.get("", shapeService.getShapeByQuery);

module.exports = router;
