const router = require("express").Router();
const passport = require("passport");
const controllers = require("../controllers/authController");
console.log("AuthController exports:", controllers);

const { register, login, verifyEmailOTP, resendOTP, refreshToken, logout, REFRESH_COOKIE_NAME, refreshCookieOptions } = controllers;
const { generateAccessToken, generateRefreshToken } = require("../utils/generateTokens");

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyEmailOTP);
router.post("/resend-otp", resendOTP);

// Session management: sliding refresh (called by the axios interceptor on
// any 401) and explicit logout (manual logout button + 3h-inactivity
// auto-logout on the frontend).
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
const mobileSessions = require("../services/mobileSessions");
const mobileGoogle = require("../controllers/mobileGoogleController");
router.post("/mobile/login", (req, res, next) => { req.issueMobileSession = true; next(); }, login);
router.post("/mobile/google", mobileGoogle.signIn);
router.post("/mobile/google/link", require("../middleware/authMiddleware"), mobileGoogle.link);
router.post("/mobile/refresh", mobileSessions.refresh);
router.post("/mobile/logout", mobileSessions.logout);

router.get( "/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

router.get( "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${(process.env.CLIENT_URL || "").replace(/\/$/, "")}/login?error=google_auth_failed`,
  }),
  async (req, res) => {
    const user = req.user;
    const accessToken = generateAccessToken(user);
    const refreshTokenValue = generateRefreshToken(user);

    user.refreshToken = refreshTokenValue;
    await user.save();

    res.cookie(REFRESH_COOKIE_NAME, refreshTokenValue, refreshCookieOptions());

    const clientUrl = (process.env.CLIENT_URL || "").replace(/\/$/, "");
    res.redirect(`${clientUrl}/oauth-success?accessToken=${accessToken}`);
  }
);

module.exports = router;
