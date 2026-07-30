const express = require("express");
const router = express.Router();

const offerController = require("../controllers/offerController");
const { offerUpload, handleUploadError } = require("../middleware/uploadMiddleware");

/* Admin CRUD */
router.post(
  "/admin/create",
  offerUpload.single("image"),
  handleUploadError,
  offerController.createOffer
);
router.put(
  "/admin/update/:id",
  offerUpload.single("image"),
  handleUploadError,
  offerController.updateOffer
);
router.delete("/admin/delete/:id", offerController.deleteOffer);
router.get("/admin/all", offerController.getAllOffersAdmin);
router.get("/admin/:id", offerController.getOfferByIdAdmin);

/* Public reads — specific routes before the wildcard :id */
router.get("/banners", offerController.getBannerOffers);
router.get("/applicable", offerController.getApplicableOffers);
router.post("/validate", offerController.validateOffer);
router.get("/", offerController.getActiveOffers);
router.get("/:id", offerController.getOfferById);

module.exports = router;