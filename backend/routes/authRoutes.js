const router = require("express").Router();
const controllers = require("../controllers/authController");
console.log("AuthController exports:", controllers);

const { register, login, verifyEmailOTP, resendOTP } = controllers;

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyEmailOTP);
router.post("/resend-otp", resendOTP);

module.exports = router;