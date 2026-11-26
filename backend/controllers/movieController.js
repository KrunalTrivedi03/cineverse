const Movie = require("../models/Movie");

const published = { isDraft: { $ne: true } };
const scalarFields = [
  "title", "description", "genre", "releaseDate", "rating", "trailerLink",
  "language", "duration", "certificate", "votes", "status", "ottPlatform", "isInCinemas",
];

async function syncMovieStatuses() {
  await Movie.updateMany(
    { ...published, status: "upcoming", releaseDate: { $lte: new Date() } },
    { $set: { status: "released", isInCinemas: true } }
  );
}

function readPeople(req, field, roleKey, existing) {
  const uploads = req.files?.[field + "Images"] || [];
  return JSON.parse(req.body[field]).map((person, index) => {
    // Older clients supplied a positional upload array. Current clients map sparse uploads explicitly.
    const uploadIndex = Object.hasOwn(person, "uploadIndex") ? person.uploadIndex : index;
    const saved = person._id ? existing.id(person._id) : null;
    return {
      ...(saved ? { _id: saved._id } : {}),
      name: person.name,
      [roleKey]: person[roleKey],
      image: uploads[uploadIndex]?.path || saved?.image || person.image || null,
    };
  });
}

function applyMovieFields(movie, req) {
  const body = req.body;
  for (const field of scalarFields) {
    if (body[field] !== undefined) movie[field] = body[field];
  }
  for (const field of ["cities", "formats", "languages"]) {
    if (body[field] !== undefined) movie[field] = JSON.parse(body[field]);
  }
  if (movie.isNew && body.languages === undefined && body.language) movie.languages = [body.language];
  for (const field of ["poster", "banner"]) {
    if (req.files?.[field]?.[0]) movie[field] = req.files[field][0].path;
  }
  if (body.cast !== undefined) movie.cast = readPeople(req, "cast", "role", movie.cast);
  if (body.crew !== undefined) movie.crew = readPeople(req, "crew", "position", movie.crew);
}

function handleWriteError(error, res) {
  if (error.name === "VersionError") {
    return res.status(409).json({ message: "This movie changed while you were editing it. Reload it and try again." });
  }
  const badInput = error instanceof SyntaxError || ["ValidationError", "CastError"].includes(error.name);
  res.status(badInput ? 400 : 500).json({ message: error.message });
}

exports.createMovie = async (req, res) => {
  try {
    const movie = new Movie({ isDraft: [true, "true"].includes(req.body.isDraft) });
    applyMovieFields(movie, req);
    await movie.save();
    res.status(201).json({ message: movie.isDraft ? "Draft saved" : "Movie published", movie });
  } catch (error) {
    handleWriteError(error, res);
  }
};

exports.updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    if ([true, "true"].includes(req.body.isDraft) && !movie.isDraft) {
      return res.status(400).json({ message: "Published movies cannot be converted to drafts." });
    }
    if ([false, "false"].includes(req.body.isDraft)) movie.isDraft = false;
    applyMovieFields(movie, req);
    await movie.save();
    res.json({ message: movie.isDraft ? "Draft saved" : "Movie updated", movie });
  } catch (error) {
    handleWriteError(error, res);
  }
};

exports.deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    res.json({ message: "Movie deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function listMovies(admin = false) {
  return async (req, res) => {
    try {
      await syncMovieStatuses();
      const { city, status } = req.query;
      const filter = admin && req.query.published !== "true" ? {} : { ...published };
      if (typeof city === "string" && city) filter.cities = city;
      if (typeof status === "string" && status) filter.status = status;
      res.json(await Movie.find(filter).sort({ createdAt: -1 }));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
}

function readMovie(admin = false) {
  return async (req, res) => {
    try {
      await syncMovieStatuses();
      const movie = await Movie.findOne({ _id: req.params.id, ...(admin ? {} : published) });
      if (!movie) return res.status(404).json({ message: "Movie not found" });
      res.json(movie);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
}

exports.getMovies = listMovies();
exports.getMovie = readMovie();
exports.getAdminMovies = listMovies(true);
exports.getAdminMovie = readMovie(true);

exports.voteMovie = async (req, res) => {
  try {
    const movie = await Movie.findOneAndUpdate(
      { _id: req.params.id, ...published },
      { $inc: { votes: 1 } },
      { new: true }
    );
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    res.json({ message: "Vote added", votes: movie.votes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
