const express     = require("express");
const router      = express.Router();
const verifyToken = require("../middleware/authMiddleware");

const {
  createOrder,
  walletPay,
  verifyPayment,
  handleWebhook,
  getPaymentDetails,
  refundPayment,
  resendConfirmation,
} = require("../controllers/eventPaymentController");

router.post("/webhook",        handleWebhook);

router.post("/create-order",   verifyToken, createOrder);
router.post("/wallet-pay",     verifyToken, walletPay);
router.post("/verify",         verifyToken, verifyPayment);
router.get ("/details/:paymentId", verifyToken, getPaymentDetails);
router.post("/refund",         verifyToken, refundPayment);
router.post("/resend-confirmation", verifyToken, resendConfirmation);

module.exports = router;
