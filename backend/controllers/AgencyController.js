const express = require("express");
const router = express.Router();

const agencyService = require("../services/AgencyService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.get("/project/:project_id", agencyService.getAgenciesByProjectId);
router.post("/", agencyService.saveAgency);
router.put("/:agency_id", agencyService.updateAgency);
router.delete("/:agency_id", agencyService.deleteAgencyById);

module.exports = router;
