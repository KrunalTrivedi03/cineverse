const express = require("express");
const router = express.Router();

const cityController = require("../controllers/cityController");
const auth = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const { cityLogoUpload, handleUploadError } = require("../middleware/uploadMiddleware");

router.post("/admin/create", cityController.createCity);

router.put(
  "/admin/:id/logo",
  auth,
  allowRoles("admin"),
  cityController.requireCity,
  cityLogoUpload.single("logo"),
  handleUploadError,
  cityController.updateLogo
);

router.get("/", cityController.getCities);

module.exports = router;
