const mongoose = require("mongoose");

const EventBookingSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: "User",         required: true },
  event:          { type: mongoose.Schema.Types.ObjectId, ref: "Event",        required: true },
  eventSchedule:  { type: mongoose.Schema.Types.ObjectId, ref: "EventSchedule",required: true },
  slotId:         { type: String, required: true }, // showTimes._id within the schedule
  venue:          { type: mongoose.Schema.Types.ObjectId, ref: "Venue",        required: true },

  eventDate: { type: Date,   required: true },
  eventTime: { type: String, required: true },

  bookingType: {
    type: String,
    enum: ["seated", "general"],
    required: true,
  },

  /* ── Seated bookings ── */
  seats: [{
    seatId:   String,
    row:      String,
    col:      Number,
    category: String,
    price:    Number,
  }],

  /* ── General-admission bookings ── */
  ticketType: {
    name:  String,
    price: Number,
  },
  quantity: { type: Number, default: 0 },

  totalAmount:    { type: Number, required: true },
  convenienceFee: { type: Number, default: 0 },
  grandTotal:     { type: Number, required: true },

  status:    { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
  paymentId: { type: String, default: "" },

  paymentMethod: {
    type:    String,
    enum:    ["razorpay", "wallet", "free"],
    default: "razorpay",
  },

  bookingRef: { type: String, unique: true },
  qrCode:     { type: String, default: "" }, // rendered client-side from bookingRef

  /* TTL — only meaningful while status === "pending"; cleared once confirmed/cancelled */
  holdExpiresAt: { type: Date, default: null },
}, { timestamps: true });

EventBookingSchema.pre("save", function () {
  if (!this.bookingRef) {
    const d    = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.bookingRef = `CVE-${d}-${rand}`;
  }
});

/* Auto-cancel stale pending holds (only while status is still "pending") */
EventBookingSchema.index(
  { holdExpiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { status: "pending" } }
);

module.exports = mongoose.model("EventBooking", EventBookingSchema);