const express = require("express");
const router  = express.Router();

const tourController = require("../controllers/tourController");
const auth = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/permissionMiddleware");
const { tourUpload, handleUploadError } = require("../middleware/uploadMiddleware");

const tourFilesUpload = tourUpload.fields([
  { name: "poster",  maxCount: 1  },
  { name: "gallery", maxCount: 20 },
]);

/* ── Admin (protected) ── */
router.post(
  "/admin/create",
  auth,
  requirePermission("CREATE_TOUR"),
  tourFilesUpload,
  handleUploadError,
  tourController.createTour
);

router.put(
  "/admin/update/:id",
  auth,
  requirePermission("UPDATE_TOUR"),
  tourFilesUpload,
  handleUploadError,
  tourController.updateTour
);

router.delete(
  "/admin/delete/:id",
  auth,
  requirePermission("DELETE_TOUR"),
  tourController.deleteTour
);

router.post(
  "/admin/:id/legs",
  auth,
  requirePermission("UPDATE_TOUR"),
  tourController.addLeg
);

router.delete(
  "/admin/:id/legs/:eventId",
  auth,
  requirePermission("UPDATE_TOUR"),
  tourController.removeLeg
);

/* ── Public (read-only) ── */
router.get("/",               tourController.getTours);
router.get("/search",         tourController.searchTours);
router.get("/artist/:artistId", tourController.getToursByArtist);
router.get("/:id",            tourController.getTourById);

module.exports = router;
