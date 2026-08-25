const mongoose = require("mongoose");

// One generated, bookable time slot for one court on one date. Generated
// ahead of time on a rolling window by services/playAutomation.js — never
// created one-by-one by an admin, same principle as Show.showTimes.
//
// Unlike a showtime (embedded in Show), each slot is its own document
// because it needs to be independently lockable (PlaySlotLock) and
// referenced by a booking, much closer to a seat than to a showtime.
const PlaySlotSchema = new mongoose.Schema(
  {
    court: { type: mongoose.Schema.Types.ObjectId, ref: "Court", required: true },
    venue: { type: mongoose.Schema.Types.ObjectId, ref: "PlayVenue", required: true }, // denormalized for query speed
    activity: { type: mongoose.Schema.Types.ObjectId, ref: "PlayActivity", required: true }, // denormalized

    date: { type: Date, required: true }, // start of day, local calendar date
    startMin: { type: Number, required: true }, // minutes since midnight
    endMin: { type: Number, required: true },
    startTime: { type: String, required: true }, // "HH:MM" display convenience
    endTime: { type: String, required: true },

    price: { type: Number, required: true }, // resolved from Court.pricingRules at generation time

    status: { type: String, enum: ["available", "booked"], default: "available" },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "PlayBooking", default: null },
  },
  { timestamps: true }
);

// Idempotent generation relies on this: skip if a slot already exists.
PlaySlotSchema.index({ court: 1, date: 1, startMin: 1 }, { unique: true });
PlaySlotSchema.index({ venue: 1, activity: 1, date: 1 });

module.exports = mongoose.model("PlaySlot", PlaySlotSchema);
