const WebShow = require("../models/WebShow");

/* ---------- Admin: list all (including inactive) ---------- */
exports.getAllWebShowsAdmin = async (req, res) => {
  try {
    const shows = await WebShow.find().sort({ createdAt: -1 });
    res.json(shows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------- Public: list active, optionally filtered by category ---------- */
exports.getWebShows = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;

    const shows = await WebShow.find(filter).sort({ createdAt: -1 });
    res.json(shows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------- Public/Admin: single show ---------- */
exports.getWebShowById = async (req, res) => {
  try {
    const show = await WebShow.findById(req.params.id);
    if (!show) return res.status(404).json({ message: "Show not found" });
    res.json(show);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------- Admin: create ---------- */
exports.createWebShow = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      genre,
      releaseYear,
      cast,
      rating,
      streamingUrl,
      trailerUrl,
      seasons,
      isActive,
    } = req.body;

    if (!title || !description || !category) {
      return res
        .status(400)
        .json({ message: "Title, description, and category are required" });
    }

    if (!req.files?.poster) {
      return res.status(400).json({ message: "Poster image is required" });
    }

    const showData = {
      title,
      description,
      category,
      poster: req.files.poster[0].path,
      banner: req.files?.banner ? req.files.banner[0].path : "",
      genre: genre ? JSON.parse(genre) : [],
      releaseYear: releaseYear || undefined,
      cast: cast ? JSON.parse(cast) : [],
      rating: rating || 0,
      streamingUrl: streamingUrl || "",
      trailerUrl: trailerUrl || "",
      seasons: seasons ? JSON.parse(seasons) : [],
      isActive: isActive === undefined ? true : isActive === "true" || isActive === true,
    };

    const show = await WebShow.create(showData);

    res.status(201).json({ message: "Show added successfully", show });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------- Admin: update ---------- */
exports.updateWebShow = async (req, res) => {
  try {
    const show = await WebShow.findById(req.params.id);
    if (!show) return res.status(404).json({ message: "Show not found" });

    const {
      title,
      description,
      category,
      genre,
      releaseYear,
      cast,
      rating,
      streamingUrl,
      trailerUrl,
      seasons,
      isActive,
    } = req.body;

    if (title !== undefined) show.title = title;
    if (description !== undefined) show.description = description;
    if (category !== undefined) show.category = category;
    if (releaseYear !== undefined) show.releaseYear = releaseYear;
    if (rating !== undefined) show.rating = rating;
    if (streamingUrl !== undefined) show.streamingUrl = streamingUrl;
    if (trailerUrl !== undefined) show.trailerUrl = trailerUrl;
    if (isActive !== undefined) show.isActive = isActive === "true" || isActive === true;
    if (genre !== undefined) show.genre = JSON.parse(genre);
    if (cast !== undefined) show.cast = JSON.parse(cast);
    if (seasons !== undefined) show.seasons = JSON.parse(seasons);

    if (req.files?.poster) show.poster = req.files.poster[0].path;
    if (req.files?.banner) show.banner = req.files.banner[0].path;

    await show.save();

    res.json({ message: "Show updated successfully", show });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------- Admin: delete ---------- */
exports.deleteWebShow = async (req, res) => {
  try {
    const show = await WebShow.findByIdAndDelete(req.params.id);
    if (!show) return res.status(404).json({ message: "Show not found" });
    res.json({ message: "Show deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};