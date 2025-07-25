const express = require("express");
const router = express.Router();

const versionService = require("../services/VersionService.js");
const authService = require("../services/AuthService.js");

router.use(authService.auth);

router.get("", versionService.getAllVersions);

module.exports = router;
