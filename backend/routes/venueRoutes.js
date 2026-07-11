const express = require("express");
const router  = express.Router();
const vc      = require("../controllers/venueController");
const { venueUpload, handleUploadError } = require("../middleware/uploadMiddleware");

const imagesUpload = venueUpload.fields([{ name: "images", maxCount: 10 }]);

/* Venue CRUD */
router.post  ("/admin/create",       imagesUpload, handleUploadError, vc.addVenue);
router.put   ("/admin/update/:id",   imagesUpload, handleUploadError, vc.updateVenue);
router.delete("/admin/delete/:id",   vc.deleteVenue);

/* Seat Layout */
router.get   ("/admin/:id/layout",                vc.getLayout);
router.put   ("/admin/:id/layout",                vc.saveLayout);
router.post  ("/admin/:id/layout/rows",           vc.addRow);
router.put   ("/admin/:id/layout/rows/:rowId",    vc.updateRow);
router.delete("/admin/:id/layout/rows/:rowId",    vc.deleteRow);

/* Public reads — specific before wildcard */
router.get("/",                    vc.getAllVenues);
router.get("/district/:districtId",vc.getVenuesByDistrict);
router.get("/:id",                 vc.getVenueById);

module.exports = router;