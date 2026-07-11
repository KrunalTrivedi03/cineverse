const express = require("express");
const router = express.Router();

const eventController = require("../controllers/eventController");
const auth = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/permissionMiddleware");
const { eventUpload } = require("../middleware/uploadMiddleware");

const eventFilesUpload = eventUpload.fields([
  { name: "poster",  maxCount: 1  },
  { name: "gallery", maxCount: 20 },
]);

router.post(
  "/",
  auth,
  requirePermission("CREATE_EVENT"),
  eventFilesUpload,
  eventController.createEvent
);

router.put(
  "/:id",
  auth,
  requirePermission("UPDATE_EVENT"),
  eventFilesUpload,
  eventController.updateEvent
);

router.delete(
  "/:id",
  auth,
  requirePermission("DELETE_EVENT"),
  eventController.deleteEvent
);

router.get(
  "/",
  auth,
  requirePermission("VIEW_EVENTS"),
  eventController.getEvents
);

router.get(
  "/:id",
  auth,
  requirePermission("VIEW_EVENTS"),
  eventController.getEvent
);

module.exports = router;