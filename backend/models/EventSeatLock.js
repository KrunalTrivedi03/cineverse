const mongoose = require("mongoose");

const EventSeatLockSchema = new mongoose.Schema({
  eventScheduleId: { type: mongoose.Schema.Types.ObjectId, ref: "EventSchedule", required: true },
  slotId:          { type: String, required: true },
  seatId:          { type: String, required: true },   // e.g. "C5"
  userId:          { type: String, required: true },   // socket.id or user._id
  expiresAt:       { type: Date,   required: true },
}, { timestamps: true });

/* TTL: MongoDB auto-deletes when expiresAt is reached */
EventSeatLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/* Unique: one lock per seat per schedule-slot */
EventSeatLockSchema.index({ eventScheduleId: 1, slotId: 1, seatId: 1 }, { unique: true });

module.exports = mongoose.model("EventSeatLock", EventSeatLockSchema);