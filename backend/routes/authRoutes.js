const router = require("express").Router();
const passport = require("passport");
const controllers = require("../controllers/authController");
console.log("AuthController exports:", controllers);

const { register, login, verifyEmailOTP, resendOTP } = controllers;
const { generateAccessToken, generateRefreshToken } = require("../utils/generateTokens");

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyEmailOTP);
router.post("/resend-otp", resendOTP);

router.get( "/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

router.get( "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${(process.env.CLIENT_URL || "").replace(/\/$/, "")}/login?error=google_auth_failed`,
  }),
  async (req, res) => {
    const user = req.user;
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    const clientUrl = (process.env.CLIENT_URL || "").replace(/\/$/, "");
    res.redirect(`${clientUrl}/oauth-success?accessToken=${accessToken}`);
  }
);

module.exports = router;