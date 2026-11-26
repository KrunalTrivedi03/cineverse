const mongoose = require("mongoose");

const checkoutAttempt = new mongoose.Schema({
  _id: String,
  expiresAt: { type: Date, required: true, expires: 0 },
  result: { type: mongoose.Schema.Types.Mixed, default: null },
}, { versionKey: false });

module.exports = mongoose.model("CheckoutAttempt", checkoutAttempt);
