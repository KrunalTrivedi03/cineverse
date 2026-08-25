const mongoose = require("mongoose");

// Mirrors EventBooking.js's shape: a "pending" booking is created right
// before the Razorpay order (with a holdExpiresAt payment window), and
// flipped to "confirmed" once payment verifies. Cancellation is a status
// change, not a delete, so it stays visible in "My Bookings" history.
const PlayBookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    venue: { type: mongoose.Schema.Types.ObjectId, ref: "PlayVenue", required: true },
    court: { type: mongoose.Schema.Types.ObjectId, ref: "Court", required: true },
    activity: { type: mongoose.Schema.Types.ObjectId, ref: "PlayActivity", required: true },

    date: { type: Date, required: true },
    slots: [{ type: mongoose.Schema.Types.ObjectId, ref: "PlaySlot", required: true }],

    // Snapshotted at booking time so the booking's own record never
    // silently changes even if the venue/court/activity is edited or
    // deleted later — same reasoning as Booking.js snapshotting
    // movieTitle/moviePoster.
    venueName: { type: String, required: true },
    courtName: { type: String, required: true },
    activityName: { type: String, required: true },

    pricing: {
      subtotal: { type: Number, required: true },
      convenienceFee: { type: Number, required: true },
      total: { type: Number, required: true },
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "expired"],
      default: "pending",
    },
    holdExpiresAt: { type: Date, default: null }, // payment window for a pending booking

    bookingRef: { type: String, unique: true, sparse: true }, // e.g. "PLY-8F2K91"

    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },

    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

PlayBookingSchema.pre("save", function () {
  if (!this.bookingRef) {
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.bookingRef = `CVP-${d}-${rand}`;
  }
});

module.exports = mongoose.model("PlayBooking", PlayBookingSchema);