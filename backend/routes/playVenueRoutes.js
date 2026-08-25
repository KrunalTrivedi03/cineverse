const express = require("express");
const router = express.Router();
const pvc = require("../controllers/playVenueController");
const cc = require("../controllers/courtController");
const { venueUpload, handleUploadError } = require("../middleware/uploadMiddleware");

const imagesUpload = venueUpload.fields([{ name: "images", maxCount: 10 }]);

/* Venue CRUD (admin) */
router.post("/admin/create", imagesUpload, handleUploadError, pvc.addVenue);
router.get("/admin", pvc.getAllVenuesAdmin);
router.get("/admin/:id", pvc.getVenueByIdAdmin);
router.put("/admin/update/:id", imagesUpload, handleUploadError, pvc.updateVenue);
router.delete("/admin/delete/:id", pvc.deleteVenue);

/* Court CRUD, nested under a venue (admin) */
router.post("/admin/:venueId/courts", cc.addCourt);
router.get("/admin/:venueId/courts", cc.getCourtsByVenue);
router.put("/admin/:venueId/courts/:courtId", cc.updateCourt);
router.delete("/admin/:venueId/courts/:courtId", cc.deleteCourt);

/* Public reads — specific before wildcard */
router.get("/", pvc.getPublicVenues);
router.get("/:id", pvc.getPublicVenueById);

module.exports = router;
