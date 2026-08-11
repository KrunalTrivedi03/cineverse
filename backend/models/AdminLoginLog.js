const mongoose = require("mongoose");

const AdminLoginLogSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      default: null,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    action: {
      type: String,
      enum: [
        "login_success",
        "login_failed",
        "otp_sent",
        "otp_verified",
        "otp_failed",
        "lockout",
        "token_refresh",
        "logout",
        "password_changed",
        "password_reset_requested",
        "password_reset",
      ],
      required: true,
    },
    reason: {
      type: String,
      default: "",
    },
    ip: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

// Auto-purge logs older than 90 days so this collection doesn't grow forever.
AdminLoginLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model("AdminLoginLog", AdminLoginLogSchema);