const express = require("express");
const router = express.Router();

const contactController = require("../controllers/contactController");

router.post("/", contactController.submitContactMessage);

/* Admin */
router.get("/admin/all", contactController.getAllContactMessages);
router.put("/admin/:id/status", contactController.updateContactMessageStatus);

module.exports = router;