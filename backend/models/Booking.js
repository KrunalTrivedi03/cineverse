const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
  show:    { type: mongoose.Schema.Types.ObjectId, ref: "Show",    required: true },
  slotId:  { type: String, required: true },
  movieTitle:  { type: String, default: "" },
  moviePoster: { type: String, default: null },
  theatre: { type: mongoose.Schema.Types.ObjectId, ref: "Theatre", required: true },
  screen:  { type: String, required: true },
  showDate:{ type: Date,   required: true },
  showTime:{ type: String, required: true },

  seats: [{
    seatId:   String,
    row:      String,
    col:      Number,
    category: String,
    price:    Number,
  }],

  totalAmount:    { type: Number, required: true },
  convenienceFee: { type: Number, default: 0 },
  grandTotal:     { type: Number, required: true },

  appliedOffer: {
    offer:          { type: mongoose.Schema.Types.ObjectId, ref: "Offer", default: null },
    code:           { type: String,  default: "" },
    title:          { type: String,  default: "" },
    discountAmount: { type: Number,  default: 0 },
  },

  status:    { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
  paymentId: { type: String, default: "" },

  paymentMethod: {
    type:    String,
    enum:    ["razorpay", "wallet", "free"],
    default: "razorpay",
  },

  bookingRef: { type: String, unique: true },
}, { timestamps: true });

BookingSchema.pre("save", function () {
  if (!this.bookingRef) {
    const d    = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.bookingRef = `CV-${d}-${rand}`;
  }
});

module.exports = mongoose.model("Booking", BookingSchema);