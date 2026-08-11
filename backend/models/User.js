const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type:     String,
      required: true,
      unique:   true,
      trim:     true,
    },
    email: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    password: {
      type:     String,
      required: function () { return this.authProvider === "local"; },
    },
    googleId: {
      type:    String,
      default: null,
    },
    authProvider: {
      type:    String,
      enum:    ["local", "google"],
      default: "local",
    },
    role: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Role",
      required: true,
    },

    phone: {
      type:    String,
      default: "",
      trim:    true,
    },
    city: {
      type:    String,
      default: "",
      trim:    true,
    },

    avatar: {
      type:    String,
      default: null,
    },

    avatarPublicId: { 
      type: String, 
      default: null 
    },

    emailOTP: {
      type:    String,
      default: null,
    },
    emailOTPExpires: {
      type:    Date,
      default: null,
    },
    isOTPVerified: {
      type:    Boolean,
      default: false,
    },
    isEmailVerified: {
      type:    Boolean,
      default: false,
    },
    emailVerifyToken: {
      type:    String,
      default: null,
    },

    refreshToken: {
      type:    String,
      default: null,
    },

    // ─── Admin login security (2FA + lockout) ──────────────────────────
    adminOTP: {
      type:    String,
      default: null,
    },
    adminOTPExpires: {
      type:    Date,
      default: null,
    },
    adminOTPAttempts: {
      type:    Number,
      default: 0,
    },
    failedLoginAttempts: {
      type:    Number,
      default: 0,
    },
    lockUntil: {
      type:    Date,
      default: null,
    },
    adminRefreshToken: {
      type:    String,
      default: null,
    },
    // Separate from adminOTP above so a password-reset request can't
    // collide with (or be used to bypass) an in-progress login 2FA step.
    adminResetOTP: {
      type:    String,
      default: null,
    },
    adminResetOTPExpires: {
      type:    Date,
      default: null,
    },
    adminResetOTPAttempts: {
      type:    Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema);