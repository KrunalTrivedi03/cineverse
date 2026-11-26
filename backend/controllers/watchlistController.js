const Watchlist = require("../models/Watchlist");
const Movie = require("../models/Movie");
exports.addToWatchlist = async (req, res) => {
  try {
    const { movieId, status = "watching" } = req.body;
    if (!await Movie.exists({ _id: movieId, isDraft: { $ne: true } })) {
      return res.status(404).json({ message: "Movie not found" });
    }

    const exists = await Watchlist.findOne({
      user: req.user.id,
      movie: movieId,
    });

    if (exists)
      return res.status(400).json({ message: "Already in watchlist" });

    const entry = await Watchlist.create({
      user: req.user.id,
      movie: movieId,
      status,
    });

    res.status(201).json({ message: "Added to watchlist", entry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeFromWatchlist = async (req, res) => {
  try {
    const { movieId } = req.body;

    const deleted = await Watchlist.findOneAndDelete({
      user: req.user.id,
      movie: movieId,
    });

    if (!deleted)
      return res.status(404).json({ message: "Not found in watchlist" });

    res.json({ message: "Removed from watchlist" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { movieId, status } = req.body;

    const entry = await Watchlist.findOneAndUpdate(
      { user: req.user.id, movie: movieId },
      { status },
      { new: true }
    );

    if (!entry)
      return res.status(404).json({ message: "Not in watchlist" });

    res.json({ message: "Status updated", entry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWatchlist = async (req, res) => {
  try {
    const list = await Watchlist.find({ user: req.user.id })
      .populate("movie")
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.checkWatchlist = async (req, res) => {
  try {
    const { movieId } = req.params;

    const entry = await Watchlist.findOne({
      user: req.user.id,
      movie: movieId,
    });

    res.json({
      inWatchlist: !!entry,
      status: entry?.status || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
