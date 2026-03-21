const mongoose = require("mongoose");

const SeatLockSchema = new mongoose.Schema({
  showId:    { type: mongoose.Schema.Types.ObjectId, ref: "Show", required: true },
  slotId:    { type: String, required: true },
  seatId:    { type: String, required: true },   // e.g. "C5"
  userId:    { type: String, required: true },   // socket.id or user._id
  expiresAt: { type: Date,   required: true },
}, { timestamps: true });

/* TTL: MongoDB auto-deletes when expiresAt is reached */
SeatLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/* Unique: one lock per seat per show-slot */
SeatLockSchema.index({ showId: 1, slotId: 1, seatId: 1 }, { unique: true });

module.exports = mongoose.model("SeatLock", SeatLockSchema);