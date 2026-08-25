const express = require("express");
const router = express.Router();
const pac = require("../controllers/playActivityController");
const { activityUpload, handleUploadError } = require("../middleware/uploadMiddleware");

const imageUpload = activityUpload.single("image");

/* Admin CRUD */
router.post("/admin/create", imageUpload, handleUploadError, pac.addActivity);
router.get("/admin", pac.getAllActivities);
router.put("/admin/update/:id", imageUpload, handleUploadError, pac.updateActivity);
router.delete("/admin/delete/:id", pac.deleteActivity);

/* Public read */
router.get("/", pac.getActiveActivities);

module.exports = router;