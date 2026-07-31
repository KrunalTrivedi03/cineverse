const mongoose = require("mongoose");

const ShowTimeSchema = new mongoose.Schema({
  time:  { type: String, required: true },   // e.g. "10:30"
  price: { type: Number, required: true },
});

const ShowSchema = new mongoose.Schema({
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
    required: true,
  },
  theatre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Theatre",
    required: true,
  },
  screen: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    default: "",
  },
  showDate: {
    type: Date,
    required: true,
  },
  showTimes: {
    type: [ShowTimeSchema],
    validate: {
      validator: (arr) => arr.length > 0,
      message: "At least one show time is required",
    },
  },
}, { timestamps: true });

ShowSchema.index(
  { movie: 1, theatre: 1, screen: 1, showDate: 1 },
  { unique: true }
);

module.exports = mongoose.model("Show", ShowSchema);