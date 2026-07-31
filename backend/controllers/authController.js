const User = require("../models/User");
const Role = require("../models/Role");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const buildEmailTemplate = require("../utils/emailTemplateBuilder");

const jwt = require("jsonwebtoken");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateTokens");
const { sendEmail } = require("../services/emailService");

// ─── Helper: refresh-token cookie options ────────────────────────────────────
// Shared everywhere we set/clear the refresh-token cookie so behaviour never
// drifts between login / google-oauth / refresh / logout.
const REFRESH_COOKIE_NAME = "refreshToken";
const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — mirrors REFRESH_SECRET token expiry
});
exports.REFRESH_COOKIE_NAME = REFRESH_COOKIE_NAME;
exports.refreshCookieOptions = refreshCookieOptions;

// ─── Helper: build styled OTP HTML ───────────────────────────────────────────
const buildStyledOTP = (otp) =>
  otp
    .split("")
    .map(
      (digit) => `
  <td style="
    width: 40px;
    height: 50px;
    background: #f5f2ec;
    border: 1px solid #dedad2;
    border-bottom: 3px solid #181816;
    border-radius: 5px;
    text-align: center;
    vertical-align: middle;
    font-family: 'Courier New', Courier, monospace;
    font-size: 22px;
    font-weight: 700;
    color: #181816;
    padding: 0;
  ">${digit}</td>
  <td style="width:6px; font-size:0; line-height:0;">&nbsp;</td>`,
    )
    .join("");

// ─── Helper: generate & save OTP to user ─────────────────────────────────────
const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  return { otp, hashedOTP };
};

// ─── REGISTER ────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = await Role.findOne({ name: "user" });

    if (!role) {
      return res.status(500).json({ message: "Default role not found" });
    }

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role._id,
      isEmailVerified: false,
      isOTPVerified: false,
    });

    const { otp, hashedOTP } = generateOTP();
    user.emailOTP = hashedOTP;
    user.emailOTPExpires = Date.now() + 2 * 60 * 1000;
    await user.save();

    // Respond immediately, send email after
    res.status(201).json({
      message: "OTP sent successfully",
      email: user.email,
    });

    try {
      const html = buildEmailTemplate({
        template: "verifyotp.html",
        title: "Verify Your Email",
        subtitle: "THANKS FOR SIGNING UP!",
        heading: "Verify Your E-Mail Address",
        replacements: {
          USERNAME: user.username,
          OTP: buildStyledOTP(otp),
        },
      });

      await sendEmail({
        to: email,
        subject: "Verify your CineVerse Account",
        html,
      });
    } catch (emailError) {
      console.error("Email failed but user created:", emailError.message);
    }
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
};

// ─── RESEND OTP ───────────────────────────────────────────────────────────────
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.isEmailVerified)
      return res.status(400).json({ message: "Already verified" });

    if (user.emailOTPExpires && user.emailOTPExpires > Date.now()) {
      const remainingMs = user.emailOTPExpires - Date.now();
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      return res.status(429).json({
        message: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
        remainingSeconds,
      });
    }

    const { otp, hashedOTP } = generateOTP();
    user.emailOTP = hashedOTP;
    user.emailOTPExpires = Date.now() + 2 * 60 * 1000;
    await user.save();

    const html = buildEmailTemplate({
      template: "verifyotp.html",
      title: "Verify Your Email",
      subtitle: "RESEND OTP",
      heading: "Your New OTP",
      replacements: {
        USERNAME: user.username,
        OTP: buildStyledOTP(otp),
      },
    });

    await sendEmail({
      to: email,
      subject: "Resend OTP - CineVerse",
      html,
    });

    res.json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ message: "Resend OTP failed" });
  }
};

// ─── VERIFY EMAIL OTP ─────────────────────────────────────────────────────────
exports.verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.isEmailVerified)
      return res.status(400).json({ message: "Email already verified" });

    if (!user.emailOTP || !user.emailOTPExpires)
      return res.status(400).json({ message: "No OTP found" });

    if (user.emailOTPExpires < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    if (hashedOTP !== user.emailOTP)
      return res.status(400).json({ message: "Invalid OTP" });

    user.isOTPVerified = true;
    user.isEmailVerified = true;
    user.emailOTP = null;
    user.emailOTPExpires = null;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("role");

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email using OTP before logging in",
        requiresOTP: true,
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());

    res.json({
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role?.name,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

// ─── POST /api/auth/refresh-token ────────────────────────────────────────────
// Reads the httpOnly refresh-token cookie, verifies it against REFRESH_SECRET
// and the value stored on the user document, and issues a fresh access token.
// This is what keeps a user's session alive while they're active — the
// frontend calls this whenever an API request comes back 401. Sliding
// (inactivity-based) logout is enforced separately on the frontend: if no
// request happens for 3 hours, the client clears its tokens and never calls
// this endpoint again, so the session simply lapses.
exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.REFRESH_SECRET);
    } catch (err) {
      res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(decoded.id).populate("role");
    if (!user || user.refreshToken !== token) {
      res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
      return res.status(401).json({ message: "Refresh token revoked" });
    }

    const accessToken = generateAccessToken(user);

    // Rotate the refresh token so a leaked cookie has a limited lifetime.
    const newRefreshToken = generateRefreshToken(user);
    user.refreshToken = newRefreshToken;
    await user.save();
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, refreshCookieOptions());

    res.json({ accessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ message: "Could not refresh session" });
  }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────
// Invalidates the refresh token server-side (so a stolen cookie can't be
// replayed) and clears the cookie. Called on manual logout AND on the
// frontend's 3-hour-inactivity auto-logout.
exports.logout = async (req, res) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
        await User.findByIdAndUpdate(decoded.id, { refreshToken: null }).catch(() => {});
      } catch {
        // token already invalid/expired — nothing to revoke
      }
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
    res.json({ message: "Logged out" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
};