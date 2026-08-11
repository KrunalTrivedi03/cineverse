const jwt = require("jsonwebtoken");

exports.generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

exports.generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

// ─── Admin tokens ───────────────────────────────────────────────────────────
// Kept separate from the regular-user tokens above (different `purpose`
// claims, and admin refresh tokens are stored in their own DB field/cookie)
// so an admin session and a normal user session on the same account never
// collide or get invalidated by each other.

// Short-lived token issued right after password verification, before the
// OTP step is complete. It only proves "this email/password combo was
// correct a moment ago" — it is NOT an access token and grants no API access.
exports.generateAdminTempToken = (user) => {
  return jwt.sign(
    { id: user._id, purpose: "admin_2fa_pending" },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );
};

exports.generateAdminAccessToken = (user, permissions = []) => {
  return jwt.sign(
    { id: user._id, role: "admin", permissions, purpose: "admin_access" },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

exports.generateAdminRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, purpose: "admin_refresh" },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

// Short-lived token issued after a password-reset OTP is verified. Proves
// "this admin just proved control of their inbox a moment ago" — it grants
// no API access on its own, only the ability to call reset-password once.
exports.generateAdminPasswordResetToken = (user) => {
  return jwt.sign(
    { id: user._id, purpose: "admin_password_reset" },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );
};