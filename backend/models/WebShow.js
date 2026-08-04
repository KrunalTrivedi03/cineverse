const mongoose = require("mongoose");

const seasonSchema = new mongoose.Schema(
  {
    seasonNumber: { type: Number, required: true },
    episodeCount: { type: Number, required: true },
    releaseDate: { type: Date },
  },
  { _id: false }
);

const webShowSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    poster: { type: String, required: true }, // Cloudinary URL
    banner: { type: String }, // Cloudinary URL (optional, details page hero)
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["trending-series", "web-original"],
      required: true,
    },
    genre: [{ type: String }],
    releaseYear: { type: Number },
    cast: [{ type: String }],
    rating: { type: Number, min: 0, max: 10, default: 0 },
    streamingUrl: { type: String }, // external "Watch Now" link
    trailerUrl: { type: String },
    seasons: [seasonSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

webShowSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model("WebShow", webShowSchema);