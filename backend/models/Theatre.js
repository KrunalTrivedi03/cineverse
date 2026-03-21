const mongoose = require("mongoose");

const SeatRowSchema = new mongoose.Schema({
  row:      { type: String, required: true },
  seats:    { type: Number, required: true, min: 1 },
  category: { type: String, enum: ["Recliner", "Premium", "Classic"], default: "Classic" },
});

const ScreenSchema = new mongoose.Schema({
  name:       String,
  totalSeats: { type: Number, default: 0 },
  seatLayout: [SeatRowSchema],
});

const TheatreSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  city:         { type: mongoose.Schema.Types.ObjectId, ref: "City", required: true },
  address:      String,
  locationLink: String,
  screens:      [ScreenSchema],
}, { timestamps: true });

module.exports = mongoose.model("Theatre", TheatreSchema);