const mongoose = require("mongoose");

const SeatRowSchema = new mongoose.Schema({
  row:      { type: String, required: true },
  seats:    { type: Number, required: true, min: 1 },
  category: { type: String, enum: ["VIP", "Premium", "General"], default: "General" },
});

const VenueSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  city:         { type: mongoose.Schema.Types.ObjectId, ref: "City",     required: true },
  district:     { type: mongoose.Schema.Types.ObjectId, ref: "District", required: true },
  address:      String,
  locationLink: String,

  /* A venue can host seated events (uses seatLayout) or general-admission events (no layout needed) */
  hasSeating: {
    type: Boolean,
    default: false,
  },
  seatLayout: [SeatRowSchema],
  totalSeats: { type: Number, default: 0 },

  /* For general-admission venues, a rough capacity is still useful for display */
  capacity: { type: Number, default: 0 },

  amenities: [String], // e.g. ["Parking", "Food Court", "Wheelchair Access"]
  images: [String],
}, { timestamps: true });

module.exports = mongoose.model("Venue", VenueSchema);