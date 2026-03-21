const mongoose = require("mongoose");

const WatchlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    status: {
      type: String,
      enum: ["watching", "completed", "favorites"],
      default: "watching",
    },
  },
  { timestamps: true }
);

WatchlistSchema.index({ user: 1, movie: 1 }, { unique: true });

module.exports = mongoose.model("Watchlist", WatchlistSchema);