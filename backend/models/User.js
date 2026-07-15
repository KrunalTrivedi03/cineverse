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
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema);