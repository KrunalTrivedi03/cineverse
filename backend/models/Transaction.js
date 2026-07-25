// models/Transaction.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    type: {
      type:     String,
      enum:     ["credit", "debit"],
      required: true,
    },
    amount: {
      type:     Number,
      required: true,
      min:      0,
    },
    description: { type: String, default: "" },
    // Where the money went / came from
    source: {
      type:    String,
      enum:    ["wallet", "card", "upi", "refund", "booking", "reward"],
      default: "wallet",
    },
    // Which module this transaction belongs to
    bookingType: {
      type:    String,
      enum:    ["movie", "event"],
      default: "movie",
    },
    // Reference to a movie booking, if applicable
    booking: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "Booking",
      default: null,
    },
    // Reference to an event booking, if applicable
    eventBooking: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "EventBooking",
      default: null,
    },
    status: {
      type:    String,
      enum:    ["success", "pending", "failed"],
      default: "success",
    },
    // External payment gateway reference (Razorpay payment ID etc.)
    gatewayRef: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);