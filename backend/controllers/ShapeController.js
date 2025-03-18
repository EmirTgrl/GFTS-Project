const express = require("express");
const router = express.Router();

const shapeService = require("../services/ShapeService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.get("", shapeService.getShapeByQuery);
router.delete("/delete/:shape_id/:shape_pt_sequence", shapeService.deleteShapeById);
router.put("/update/:shape_id/:shape_pt_sequence", shapeService.updateShape);
router.post("/create", shapeService.saveShape);
router.post("/create-multiple/:trip_id", shapeService.saveMultipleShape)

module.exports = router;
