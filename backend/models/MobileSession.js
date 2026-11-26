const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  digest: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

module.exports = mongoose.model("MobileSession", sessionSchema);
