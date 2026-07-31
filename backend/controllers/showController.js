const Show = require("../models/Show");
const { cleanupCompletedShows } = require("../services/showAutomation");

const populate = (q) => q.populate("movie").populate({ path: "theatre", populate: { path: "city" } });

exports.createShow = async (req, res) => {
  try {
    const { movie, theatre, screen, showDate, showTimes, language } = req.body;

    const existing = await Show.findOne({ movie, theatre, screen, showDate });
    if (existing) {
      return res.status(400).json({
        message: "A show for this movie, theatre, screen and date already exists. Use update to modify times.",
      });
    }

    const show = await Show.create({ movie, theatre, screen, showDate, showTimes, language: language || "" });
    const populated = await populate(Show.findById(show._id));

    res.json({ message: "Show created successfully", show: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getShows = async (req, res) => {
  try {
    await cleanupCompletedShows();
    const shows = await populate(Show.find()).sort({ showDate: 1 });
    res.json(shows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getShowById = async (req, res) => {
  try {
    const show = await populate(Show.findById(req.params.id));
    if (!show) return res.status(404).json({ message: "Show not found" });
    res.json(show);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getShowsByMovie = async (req, res) => {
  try {
    await cleanupCompletedShows();
    const shows = await populate(
      Show.find({ movie: req.params.movieId })
    ).sort({ showDate: 1 });
    res.json(shows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getShowsByCity = async (req, res) => {
  try {
    await cleanupCompletedShows();
    const { cityId, movieId } = req.params;

    const shows = await Show.find({ movie: movieId })
      .populate({
        path: "theatre",
        match: { city: cityId },
        populate: { path: "city" },
      })
      .populate("movie")
      .sort({ showDate: 1 });

    res.json(shows.filter((s) => s.theatre));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateShow = async (req, res) => {
  try {
    const show = await populate(
      Show.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      )
    );

    if (!show) return res.status(404).json({ message: "Show not found" });
    res.json({ message: "Show updated successfully", show });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "A show for this movie, theatre, screen and date already exists.",
      });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.addShowTime = async (req, res) => {
  try {
    const { time, price } = req.body;
    const show = await populate(
      Show.findByIdAndUpdate(
        req.params.id,
        { $push: { showTimes: { time, price } } },
        { new: true, runValidators: true }
      )
    );
    if (!show) return res.status(404).json({ message: "Show not found" });
    res.json({ message: "Show time added", show });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeShowTime = async (req, res) => {
  try {
    const show = await populate(
      Show.findByIdAndUpdate(
        req.params.id,
        { $pull: { showTimes: { _id: req.params.showTimeId } } },
        { new: true }
      )
    );
    if (!show) return res.status(404).json({ message: "Show not found" });
    res.json({ message: "Show time removed", show });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteShow = async (req, res) => {
  try {
    const show = await Show.findByIdAndDelete(req.params.id);
    if (!show) return res.status(404).json({ message: "Show not found" });
    res.json({ message: "Show deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bulkDeleteShows = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No show IDs provided" });
    }
    const result = await Show.deleteMany({ _id: { $in: ids } });
    res.json({ message: `${result.deletedCount} show(s) deleted successfully`, deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};