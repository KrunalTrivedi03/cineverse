const User = require("../models/User");
const AdminLoginLog = require("../models/AdminLoginLog");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const buildEmailTemplate = require("../utils/emailTemplateBuilder");
const { sendEmail } = require("../services/emailService");
const {
  generateAdminTempToken,
  generateAdminAccessToken,
  generateAdminRefreshToken,
  generateAdminPasswordResetToken,
} = require("../utils/generateTokens");

const OTP_TTL_MS = 2 * 60 * 1000; // 2 minutes — matches the signup-OTP convention elsewhere
const MAX_PASSWORD_ATTEMPTS = 5;
const MAX_OTP_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const ADMIN_REFRESH_COOKIE_NAME = "adminRefreshToken";
const adminRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/admin/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
exports.ADMIN_REFRESH_COOKIE_NAME = ADMIN_REFRESH_COOKIE_NAME;

// ─── Helpers ─────────────────────────────────────────────────────────────

const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  return { otp, hashedOTP };
};

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

const maskEmail = (email = "") => {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const visible = name.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(name.length - 1, 1))}@${domain}`;
};

const logAttempt = (fields) => {
  // Fire-and-forget: a logging failure should never block the login flow.
  AdminLoginLog.create(fields).catch((err) =>
    console.error("AdminLoginLog write failed:", err.message),
  );
};

const requestMeta = (req) => ({
  ip: req.ip || req.headers["x-forwarded-for"] || "",
  userAgent: req.headers["user-agent"] || "",
});

const sendOTPEmail = async (user, otp) => {
  const html = buildEmailTemplate({
    template: "adminLoginOtp.html",
    title: "Admin Login Verification",
    subtitle: "SECURITY CHECK",
    heading: "Verify It's You",
    replacements: {
      USERNAME: user.username,
      OTP: buildStyledOTP(otp),
    },
  });

  await sendEmail({
    to: user.email,
    subject: "Your CineVerse admin login code",
    html,
  });
};

const sendResetOTPEmail = async (user, otp) => {
  const html = buildEmailTemplate({
    template: "adminResetPasswordOtp.html",
    title: "Admin Password Reset",
    subtitle: "PASSWORD RESET",
    heading: "Reset Your Password",
    replacements: {
      USERNAME: user.username,
      OTP: buildStyledOTP(otp),
    },
  });

  await sendEmail({
    to: user.email,
    subject: "Your CineVerse admin password reset code",
    html,
  });
};

// ─── STEP 1: email + password ──────────────────────────────────────────────
exports.adminLogin = async (req, res) => {
  const { ip, userAgent } = requestMeta(req);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await User.findOne({ email: email.toLowerCase().trim() }).populate({
      path: "role",
      populate: { path: "permissions" },
    });

    // Same generic message whether the account doesn't exist, isn't an
    // admin, or the password is wrong — this prevents an attacker from
    // using the login form to enumerate which emails have admin access.
    const genericFail = () =>
      res.status(400).json({ message: "Invalid email or password" });

    if (!admin || admin.role?.name !== "admin") {
      logAttempt({ email, action: "login_failed", reason: "no_such_admin", ip, userAgent });
      return genericFail();
    }

    if (admin.lockUntil && admin.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((admin.lockUntil - Date.now()) / 60000);
      logAttempt({ email, admin: admin._id, action: "lockout", reason: "locked_at_login", ip, userAgent });
      return res.status(429).json({
        message: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`,
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      admin.failedLoginAttempts += 1;
      if (admin.failedLoginAttempts >= MAX_PASSWORD_ATTEMPTS) {
        admin.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        admin.failedLoginAttempts = 0;
        await admin.save();
        logAttempt({ email, admin: admin._id, action: "lockout", reason: "max_password_attempts", ip, userAgent });
        return res.status(429).json({
          message: "Too many failed attempts. Account locked for 15 minutes.",
        });
      }
      await admin.save();
      logAttempt({ email, admin: admin._id, action: "login_failed", reason: "bad_password", ip, userAgent });
      return genericFail();
    }

    // Password correct — reset the counter and move to the OTP step.
    admin.failedLoginAttempts = 0;
    admin.lockUntil = null;

    const { otp, hashedOTP } = generateOTP();
    admin.adminOTP = hashedOTP;
    admin.adminOTPExpires = new Date(Date.now() + OTP_TTL_MS);
    admin.adminOTPAttempts = 0;
    await admin.save();

    const tempToken = generateAdminTempToken(admin);

    logAttempt({ email, admin: admin._id, action: "otp_sent", ip, userAgent });

    res.json({
      requires2FA: true,
      tempToken,
      maskedEmail: maskEmail(admin.email),
      message: "Verification code sent to your email.",
    });

    try {
      await sendOTPEmail(admin, otp);
    } catch (emailErr) {
      console.error("Admin OTP email failed:", emailErr.message);
    }
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

// ─── STEP 2: verify OTP ─────────────────────────────────────────────────────
exports.verifyAdminOTP = async (req, res) => {
  const { ip, userAgent } = requestMeta(req);
  try {
    const { tempToken, otp } = req.body;
    if (!tempToken || !otp) {
      return res.status(400).json({ message: "Verification code is required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    if (decoded.purpose !== "admin_2fa_pending") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    const admin = await User.findById(decoded.id).populate({
      path: "role",
      populate: { path: "permissions" },
    });

    if (!admin || admin.role?.name !== "admin") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    if (admin.lockUntil && admin.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((admin.lockUntil - Date.now()) / 60000);
      return res.status(429).json({
        message: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`,
      });
    }

    if (!admin.adminOTP || !admin.adminOTPExpires || admin.adminOTPExpires < Date.now()) {
      return res.status(400).json({ message: "Code expired. Please request a new one." });
    }

    const hashedInput = crypto.createHash("sha256").update(otp).digest("hex");
    if (hashedInput !== admin.adminOTP) {
      admin.adminOTPAttempts += 1;
      if (admin.adminOTPAttempts >= MAX_OTP_ATTEMPTS) {
        admin.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        admin.adminOTP = null;
        admin.adminOTPExpires = null;
        admin.adminOTPAttempts = 0;
        await admin.save();
        logAttempt({ email: admin.email, admin: admin._id, action: "lockout", reason: "max_otp_attempts", ip, userAgent });
        return res.status(429).json({
          message: "Too many incorrect codes. Account locked for 15 minutes.",
        });
      }
      await admin.save();
      logAttempt({ email: admin.email, admin: admin._id, action: "otp_failed", ip, userAgent });
      return res.status(400).json({ message: "Incorrect code" });
    }

    // OTP correct — issue real session tokens.
    admin.adminOTP = null;
    admin.adminOTPExpires = null;
    admin.adminOTPAttempts = 0;
    admin.failedLoginAttempts = 0;
    admin.lockUntil = null;

    const permissions = admin.role.permissions.map((p) => p.name);
    const accessToken = generateAdminAccessToken(admin, permissions);
    const refreshToken = generateAdminRefreshToken(admin);
    admin.adminRefreshToken = refreshToken;
    await admin.save();

    res.cookie(ADMIN_REFRESH_COOKIE_NAME, refreshToken, adminRefreshCookieOptions());

    logAttempt({ email: admin.email, admin: admin._id, action: "otp_verified", ip, userAgent });
    logAttempt({ email: admin.email, admin: admin._id, action: "login_success", ip, userAgent });

    res.json({
      message: "Admin login success",
      accessToken,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role.name,
        permissions,
      },
    });
  } catch (error) {
    console.error("Admin OTP Verify Error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};

// ─── Resend OTP ─────────────────────────────────────────────────────────────
exports.resendAdminOTP = async (req, res) => {
  const { ip, userAgent } = requestMeta(req);
  try {
    const { tempToken } = req.body;
    if (!tempToken) return res.status(400).json({ message: "Missing session" });

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    if (decoded.purpose !== "admin_2fa_pending") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    const fullAdmin = await User.findById(decoded.id).populate("role");
    if (!fullAdmin || fullAdmin.role?.name !== "admin") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    if (fullAdmin.lockUntil && fullAdmin.lockUntil > Date.now()) {
      return res.status(429).json({ message: "Account temporarily locked." });
    }

    if (fullAdmin.adminOTPExpires && fullAdmin.adminOTPExpires > Date.now()) {
      const remainingSeconds = Math.ceil((fullAdmin.adminOTPExpires - Date.now()) / 1000);
      return res.status(429).json({
        message: `Please wait ${remainingSeconds}s before requesting a new code.`,
        remainingSeconds,
      });
    }

    const { otp, hashedOTP } = generateOTP();
    fullAdmin.adminOTP = hashedOTP;
    fullAdmin.adminOTPExpires = new Date(Date.now() + OTP_TTL_MS);
    fullAdmin.adminOTPAttempts = 0;
    await fullAdmin.save();

    logAttempt({ email: fullAdmin.email, admin: fullAdmin._id, action: "otp_sent", reason: "resend", ip, userAgent });

    res.json({ message: "A new code has been sent." });

    try {
      await sendOTPEmail(fullAdmin, otp);
    } catch (emailErr) {
      console.error("Admin OTP resend email failed:", emailErr.message);
    }
  } catch (error) {
    console.error("Admin OTP Resend Error:", error);
    res.status(500).json({ message: "Could not resend code" });
  }
};

// ─── Refresh access token ───────────────────────────────────────────────────
exports.refreshAdminToken = async (req, res) => {
  const { ip, userAgent } = requestMeta(req);
  try {
    const token = req.cookies?.[ADMIN_REFRESH_COOKIE_NAME];
    if (!token) return res.status(401).json({ message: "No refresh token" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.REFRESH_SECRET);
    } catch {
      res.clearCookie(ADMIN_REFRESH_COOKIE_NAME, adminRefreshCookieOptions());
      return res.status(401).json({ message: "Refresh token invalid or expired" });
    }
    if (decoded.purpose !== "admin_refresh") {
      return res.status(401).json({ message: "Invalid token" });
    }

    const admin = await User.findById(decoded.id).populate({
      path: "role",
      populate: { path: "permissions" },
    });

    if (!admin || admin.role?.name !== "admin" || admin.adminRefreshToken !== token) {
      res.clearCookie(ADMIN_REFRESH_COOKIE_NAME, adminRefreshCookieOptions());
      return res.status(401).json({ message: "Refresh token invalid or expired" });
    }

    const permissions = admin.role.permissions.map((p) => p.name);
    const accessToken = generateAdminAccessToken(admin, permissions);

    logAttempt({ email: admin.email, admin: admin._id, action: "token_refresh", ip, userAgent });

    res.json({ accessToken });
  } catch (error) {
    console.error("Admin Refresh Error:", error);
    res.status(500).json({ message: "Could not refresh session" });
  }
};

// ─── Logout ──────────────────────────────────────────────────────────────
exports.adminLogout = async (req, res) => {
  const { ip, userAgent } = requestMeta(req);
  try {
    const token = req.cookies?.[ADMIN_REFRESH_COOKIE_NAME];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
        const admin = await User.findById(decoded.id);
        if (admin) {
          admin.adminRefreshToken = null;
          await admin.save();
          logAttempt({ email: admin.email, admin: admin._id, action: "logout", ip, userAgent });
        }
      } catch {
        // Token already invalid/expired — nothing to clean up server-side.
      }
    }
    res.clearCookie(ADMIN_REFRESH_COOKIE_NAME, adminRefreshCookieOptions());
    res.json({ message: "Logged out" });
  } catch (error) {
    console.error("Admin Logout Error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
};

// ─── Change password (self-service, from inside the admin panel) ───────────
// Requires the caller to already be authenticated (authMiddleware) AND to
// re-supply their current password — knowing a still-valid access token
// isn't enough to change the password on its own, in case that token was
// the thing that leaked.
exports.changeAdminPassword = async (req, res) => {
  const { ip, userAgent } = requestMeta(req);
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (newPassword.length < 10) {
      return res.status(400).json({ message: "New password must be at least 10 characters" });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ message: "New password must be different from the current one" });
    }

    const admin = await User.findById(req.user.id).populate("role");
    if (!admin || admin.role?.name !== "admin") {
      return res.status(403).json({ message: "Not an admin account" });
    }

    const match = await bcrypt.compare(currentPassword, admin.password);
    if (!match) {
      logAttempt({ email: admin.email, admin: admin._id, action: "login_failed", reason: "change_password_wrong_current", ip, userAgent });
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    admin.password = await bcrypt.hash(newPassword, 10);

    // Invalidate every existing session tied to the old password — this
    // access token included. The frontend logs the admin out right after
    // a successful change, so this just guarantees it server-side too.
    admin.adminRefreshToken = null;
    admin.adminOTP = null;
    admin.adminOTPExpires = null;
    admin.adminOTPAttempts = 0;
    admin.failedLoginAttempts = 0;
    admin.lockUntil = null;
    await admin.save();

    res.clearCookie(ADMIN_REFRESH_COOKIE_NAME, adminRefreshCookieOptions());
    logAttempt({ email: admin.email, admin: admin._id, action: "password_changed", ip, userAgent });

    res.json({ message: "Password changed successfully. Please log in again." });
  } catch (error) {
    console.error("Admin Change Password Error:", error);
    res.status(500).json({ message: "Could not change password" });
  }
};

// ─── Forgot password: step 1 — request a code ──────────────────────────────
// Always returns the same generic message whether or not the email belongs
// to an admin, so this endpoint can't be used to enumerate admin accounts.
exports.forgotAdminPassword = async (req, res) => {
  const { ip, userAgent } = requestMeta(req);
  const genericResponse = () =>
    res.json({ message: "If that email belongs to an admin account, a reset code has been sent." });

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const admin = await User.findOne({ email: email.toLowerCase().trim() }).populate("role");

    if (!admin || admin.role?.name !== "admin") {
      logAttempt({ email, action: "password_reset_requested", reason: "no_such_admin", ip, userAgent });
      return genericResponse();
    }

    if (admin.lockUntil && admin.lockUntil > Date.now()) {
      logAttempt({ email, admin: admin._id, action: "lockout", reason: "locked_at_reset_request", ip, userAgent });
      return genericResponse(); // don't reveal lock state to an outside caller
    }

    // Don't spam a fresh code while a previous one is still valid — the
    // frontend's own countdown already prevents this in normal use.
    if (admin.adminResetOTPExpires && admin.adminResetOTPExpires > Date.now()) {
      return genericResponse();
    }

    const { otp, hashedOTP } = generateOTP();
    admin.adminResetOTP = hashedOTP;
    admin.adminResetOTPExpires = new Date(Date.now() + OTP_TTL_MS);
    admin.adminResetOTPAttempts = 0;
    await admin.save();

    logAttempt({ email: admin.email, admin: admin._id, action: "password_reset_requested", ip, userAgent });
    genericResponse();

    try {
      await sendResetOTPEmail(admin, otp);
    } catch (emailErr) {
      console.error("Admin reset OTP email failed:", emailErr.message);
    }
  } catch (error) {
    console.error("Admin Forgot Password Error:", error);
    res.status(500).json({ message: "Could not process request" });
  }
};

// ─── Forgot password: step 2 — verify the code ─────────────────────────────
exports.verifyAdminResetOTP = async (req, res) => {
  const { ip, userAgent } = requestMeta(req);
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const admin = await User.findOne({ email: email.toLowerCase().trim() }).populate("role");
    const invalidCode = () => res.status(400).json({ message: "Invalid or expired code" });

    if (!admin || admin.role?.name !== "admin") return invalidCode();

    if (admin.lockUntil && admin.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((admin.lockUntil - Date.now()) / 60000);
      return res.status(429).json({
        message: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`,
      });
    }

    if (!admin.adminResetOTP || !admin.adminResetOTPExpires || admin.adminResetOTPExpires < Date.now()) {
      return res.status(400).json({ message: "Code expired. Please request a new one." });
    }

    const hashedInput = crypto.createHash("sha256").update(otp).digest("hex");
    if (hashedInput !== admin.adminResetOTP) {
      admin.adminResetOTPAttempts += 1;
      if (admin.adminResetOTPAttempts >= MAX_OTP_ATTEMPTS) {
        admin.adminResetOTP = null;
        admin.adminResetOTPExpires = null;
        admin.adminResetOTPAttempts = 0;
        admin.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        await admin.save();
        logAttempt({ email: admin.email, admin: admin._id, action: "lockout", reason: "max_reset_otp_attempts", ip, userAgent });
        return res.status(429).json({
          message: "Too many incorrect codes. Account locked for 15 minutes.",
        });
      }
      await admin.save();
      logAttempt({ email: admin.email, admin: admin._id, action: "otp_failed", reason: "reset_flow", ip, userAgent });
      return invalidCode();
    }

    // Code correct — consume it and issue a short-lived token that lets
    // the frontend call reset-password exactly once.
    admin.adminResetOTP = null;
    admin.adminResetOTPExpires = null;
    admin.adminResetOTPAttempts = 0;
    await admin.save();

    const resetToken = generateAdminPasswordResetToken(admin);

    logAttempt({ email: admin.email, admin: admin._id, action: "otp_verified", reason: "reset_flow", ip, userAgent });

    res.json({ resetToken, message: "Code verified. You can now set a new password." });
  } catch (error) {
    console.error("Admin Verify Reset OTP Error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};

// ─── Forgot password: step 3 — set the new password ────────────────────────
exports.resetAdminPassword = async (req, res) => {
  const { ip, userAgent } = requestMeta(req);
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: "Missing reset token or new password" });
    }
    if (newPassword.length < 10) {
      return res.status(400).json({ message: "New password must be at least 10 characters" });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Reset link expired. Please start again." });
    }
    if (decoded.purpose !== "admin_password_reset") {
      return res.status(401).json({ message: "Reset link expired. Please start again." });
    }

    const admin = await User.findById(decoded.id).populate("role");
    if (!admin || admin.role?.name !== "admin") {
      return res.status(401).json({ message: "Reset link expired. Please start again." });
    }

    admin.password = await bcrypt.hash(newPassword, 10);

    // Kill every existing session, the same as a self-service password
    // change — a reset implies the old password may have been compromised.
    admin.adminRefreshToken = null;
    admin.adminOTP = null;
    admin.adminOTPExpires = null;
    admin.adminOTPAttempts = 0;
    admin.adminResetOTP = null;
    admin.adminResetOTPExpires = null;
    admin.adminResetOTPAttempts = 0;
    admin.failedLoginAttempts = 0;
    admin.lockUntil = null;
    await admin.save();

    res.clearCookie(ADMIN_REFRESH_COOKIE_NAME, adminRefreshCookieOptions());
    logAttempt({ email: admin.email, admin: admin._id, action: "password_reset", ip, userAgent });

    res.json({ message: "Password reset successfully. Please log in." });
  } catch (error) {
    console.error("Admin Reset Password Error:", error);
    res.status(500).json({ message: "Could not reset password" });
  }
};