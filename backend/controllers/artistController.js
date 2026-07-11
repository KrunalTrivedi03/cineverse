const Artist = require("../models/Artist");

exports.createArtist = async (req, res) => {
  try {
    const { name, bio, genres, socialLinks, isFeatured } = req.body;

    const artistData = {
      name,
      bio,
      genres: genres ? JSON.parse(genres) : [],
      socialLinks: socialLinks ? JSON.parse(socialLinks) : {},
      isFeatured: isFeatured === "true" || isFeatured === true,
    };

    if (req.file) {
      artistData.image = req.file.path;
    }

    const artist = await Artist.create(artistData);
    res.status(201).json({ message: "Artist added successfully", artist });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateArtist = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    const { name, bio, genres, socialLinks, isFeatured } = req.body;

    if (name)   artist.name = name;
    if (bio)    artist.bio  = bio;
    if (genres) artist.genres = JSON.parse(genres);
    if (socialLinks) artist.socialLinks = JSON.parse(socialLinks);
    if (typeof isFeatured !== "undefined") artist.isFeatured = isFeatured === "true" || isFeatured === true;

    if (req.file) {
      artist.image = req.file.path;
    }

    await artist.save();
    res.json({ message: "Artist updated successfully", artist });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteArtist = async (req, res) => {
  try {
    const artist = await Artist.findByIdAndDelete(req.params.id);
    if (!artist) return res.status(404).json({ message: "Artist not found" });
    res.json({ message: "Artist deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getArtists = async (req, res) => {
  try {
    const { genre, featured } = req.query;
    const filter = {};
    if (genre)    filter.genres = genre;
    if (featured) filter.isFeatured = true;

    const artists = await Artist.find(filter).sort({ name: 1 });
    res.json(artists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getArtistById = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).json({ message: "Artist not found" });
    res.json(artist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchArtists = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const artists = await Artist.find({ name: { $regex: q, $options: "i" } }).limit(20);
    res.json(artists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};