const Movie = require("../models/Movie");

const syncMovieStatuses = async () => {
  const now = new Date();
  await Movie.updateMany(
    { status: "upcoming", releaseDate: { $lte: now } },
    { $set: { status: "released", isInCinemas: true } }
  );
};

exports.createMovie = async (req, res) => {
  try {
    const {title,description,genre,releaseDate,rating,trailerLink,language,duration,certificate,votes,status,ottPlatform,isInCinemas,formats,cast,crew,cities} = req.body;

    const movieData = {title,description,genre,releaseDate,rating,trailerLink,language,duration,certificate,votes,status,ottPlatform,isInCinemas,formats: formats ? JSON.parse(formats) : [],cities: cities ? JSON.parse(cities) : [],cast: [],crew: [] };

    if (req.files?.poster) {
      movieData.poster = req.files.poster[0].path;
    }

    if (cast) {
      const castArray = JSON.parse(cast);

      castArray.forEach((member, index) => {
        movieData.cast.push({
          name: member.name,
          role: member.role,
          image: req.files?.castImages?.[index]
            ? req.files.castImages[index].path
            : null,
        });
      });
    }

    if (crew) {
      const crewArray = JSON.parse(crew);

      crewArray.forEach((member, index) => {
        movieData.crew.push({
          name: member.name,
          position: member.position,
          image: req.files?.crewImages?.[index]
            ? req.files.crewImages[index].path
            : null,
        });
      });
    }

    const movie = await Movie.create(movieData);

    res.status(201).json({
      message: "Movie added successfully",
      movie
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.updateMovie = async (req, res) => {
  try {

    const movie = await Movie.findById(req.params.id);

    if (!movie)
      return res.status(404).json({ message: "Movie not found" });

    const {title,description,genre,releaseDate,rating,trailerLink,language,duration,certificate,votes,status,ottPlatform,isInCinemas,formats,cast,crew,cities} = req.body;

    if (title) movie.title = title;
    if (description) movie.description = description;
    if (genre) movie.genre = genre;
    if (cities) movie.cities = JSON.parse(cities);
    if (releaseDate) movie.releaseDate = releaseDate;
    if (rating) movie.rating = rating;
    if (trailerLink) movie.trailerLink = trailerLink;

    if (language) movie.language = language;
    if (duration) movie.duration = duration;
    if (certificate) movie.certificate = certificate;
    if (votes !== undefined) movie.votes = votes;
    if (status) movie.status = status;
    if (ottPlatform) movie.ottPlatform = ottPlatform;

    if (typeof isInCinemas !== "undefined")
      movie.isInCinemas = isInCinemas;

    if (formats)
      movie.formats = JSON.parse(formats);

    if (req.files?.poster) {
      movie.poster = `/uploads/${req.files.poster[0].filename}`;
    }

    if (cast) {
      const castArray = JSON.parse(cast);

      movie.cast = castArray.map((member, index) => ({
        name: member.name,
        role: member.role,
        image: req.files?.castImages?.[index]
          ? `/uploads/${req.files.castImages[index].filename}`
          : member.image || null
      }));
    }

    if (crew) {
      const crewArray = JSON.parse(crew);

      movie.crew = crewArray.map((member, index) => ({
        name: member.name,
        position: member.position,
        image: req.files?.crewImages?.[index]
          ? `/uploads/${req.files.crewImages[index].filename}`
          : member.image || null
      }));
    }

    await movie.save();

    res.json({
      message: "Movie updated successfully",
      movie
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.deleteMovie = async (req, res) => {
  try {

    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie)
      return res.status(404).json({ message: "Movie not found" });

    res.json({ message: "Movie deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getMovies = async (req, res) => {
  try {
    await syncMovieStatuses();
    const { city, status } = req.query;

    let filter = {};
    if (city) filter.cities = city;
    if (status) filter.status = status;

    const movies = await Movie.find(filter).sort({ createdAt: -1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMovie = async (req, res) => {
  try {
    await syncMovieStatuses();

    const movie = await Movie.findById(req.params.id);

    if (!movie)
      return res.status(404).json({ message: "Movie not found" });

    res.json(movie);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

exports.voteMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    movie.votes = (movie.votes || 0) + 1;
    await movie.save();
    res.json({ message: "Vote added", votes: movie.votes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};