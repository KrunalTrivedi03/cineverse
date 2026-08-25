const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");

const { createOrder, verifyPayment, handleWebhook, cancelBooking } = require("../controllers/playPaymentController");

router.post("/webhook", handleWebhook);

router.post("/create-order", verifyToken, createOrder);
router.post("/verify", verifyToken, verifyPayment);
router.post("/cancel", verifyToken, cancelBooking);

module.exports = router;