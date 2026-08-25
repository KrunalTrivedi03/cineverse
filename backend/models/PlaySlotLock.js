const mongoose = require("mongoose");

// Temporary hold on a slot while a user is checking out — exact same
// pattern as EventSeatLock.js: Mongo TTL auto-deletes expired locks,
// a unique index prevents two users holding the same slot at once.
const PlaySlotLockSchema = new mongoose.Schema(
  {
    slot: { type: mongoose.Schema.Types.ObjectId, ref: "PlaySlot", required: true },
    userId: { type: String, required: true }, // socket.id or user._id
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

PlaySlotLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
PlaySlotLockSchema.index({ slot: 1 }, { unique: true });

module.exports = mongoose.model("PlaySlotLock", PlaySlotLockSchema);
