const express = require("express");
const router = express.Router();

const webShowController = require("../controllers/WebShowController");
const { webShowUpload: webShowStorage, handleUploadError } = require("../middleware/uploadMiddleware");

const webShowUpload = webShowStorage.fields([
  { name: "poster", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

/* Admin CRUD */
router.get("/admin/all", webShowController.getAllWebShowsAdmin);
router.post("/admin/create", webShowUpload, handleUploadError, webShowController.createWebShow);
router.put("/admin/update/:id", webShowUpload, handleUploadError, webShowController.updateWebShow);
router.delete("/admin/delete/:id", webShowController.deleteWebShow);

/* Public reads — specific routes before the wildcard :id */
router.get("/", webShowController.getWebShows);
router.get("/:id", webShowController.getWebShowById);

module.exports = router;