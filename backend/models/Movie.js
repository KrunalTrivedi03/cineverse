const mongoose = require("mongoose");

const CastSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: String,
  image: String
});

const CrewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: String,
  image: String
});

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  genre: String,
  releaseDate: Date,
  rating: Number,

  cities: [String],

  language: String,
  languages: [String],

  duration: Number,
  certificate: String,

  votes: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ["upcoming", "released", "streaming"],
    default: "upcoming"
  },

  ottPlatform: String,

  isInCinemas: {
    type: Boolean,
    default: false
  },

  formats: [String],

  poster: String,
  trailerLink: String,

  cast: [CastSchema],
  crew: [CrewSchema],
}, { timestamps: true });

module.exports = mongoose.model("Movie", MovieSchema);