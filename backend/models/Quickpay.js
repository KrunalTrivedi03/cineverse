// models/QuickPay.js
const mongoose = require("mongoose");

/* ── Saved card sub-document ───────────────────────────── */
const cardSchema = new mongoose.Schema(
  {
    cardholderName: { type: String, trim: true, default: "" },
    last4:          { type: String, required: true, length: 4 },
    expiry:         { type: String, required: true },   // "MM/YY"
    network:        {
      type:    String,
      enum:    ["Visa", "Mastercard", "RuPay", "Amex", "Diners"],
      default: "Visa",
    },
    // Store gateway token only — never store full card numbers
    token:      { type: String, default: "" },
    isPrimary:  { type: Boolean, default: false },
  },
  { _id: true }
);

/* ── UPI sub-document ──────────────────────────────────── */
const upiSchema = new mongoose.Schema(
  {
    id: {
      type:      String,
      required:  true,
      lowercase: true,
      trim:      true,
    },
  },
  { _id: true }
);

/* ── QuickPay document ─────────────────────────────────── */
const quickPaySchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      unique:   true,
      index:    true,
    },
    walletBalance: { type: Number, default: 0, min: 0 },
    cards:         { type: [cardSchema], default: [] },
    upiIds:        { type: [upiSchema],  default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuickPay", quickPaySchema);