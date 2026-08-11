const express = require("express");
const router = express.Router();

const {
  adminLogin,
  verifyAdminOTP,
  resendAdminOTP,
  refreshAdminToken,
  adminLogout,
  changeAdminPassword,
  forgotAdminPassword,
  verifyAdminResetOTP,
  resetAdminPassword,
} = require("../controllers/adminAuthController");

const {
  loginLimiter,
  otpLimiter,
  resendLimiter,
  changePasswordLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} = require("../middleware/adminAuthLimiter");

const authMiddleware = require("../middleware/authMiddleware");

// Step 1: email + password → sends OTP, returns a short-lived tempToken
router.post("/login", loginLimiter, adminLogin);

// Step 2: tempToken + OTP → real access token + httpOnly refresh cookie
router.post("/verify-otp", otpLimiter, verifyAdminOTP);

// Re-send a fresh OTP against an existing tempToken
router.post("/resend-otp", resendLimiter, resendAdminOTP);

// Sliding session: called by the axios interceptor whenever an admin
// request comes back 401, same pattern as the user-facing auth flow.
router.post("/refresh-token", refreshAdminToken);

router.post("/logout", adminLogout);

// Self-service password change from inside the admin panel — must be
// logged in AND know the current password.
router.put("/change-password", authMiddleware, changePasswordLimiter, changeAdminPassword);

// Forgot-password flow, for when the admin can't log in at all.
router.post("/forgot-password", forgotPasswordLimiter, forgotAdminPassword);
router.post("/reset-password/verify-otp", resetPasswordLimiter, verifyAdminResetOTP);
router.post("/reset-password", resetPasswordLimiter, resetAdminPassword);

module.exports = router;