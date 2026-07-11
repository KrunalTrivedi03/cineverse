const mongoose = require("mongoose");

const SocialLinksSchema = new mongoose.Schema({
  instagram: String,
  twitter:   String,
  facebook:  String,
  youtube:   String,
  website:   String,
}, { _id: false });

const ArtistSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  image: String,
  bio:   String,

  genres: [String], // e.g. ["Pop", "Stand-up", "EDM"] — helps with "Explore by Artist" filtering

  socialLinks: SocialLinksSchema,

  isFeatured: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

ArtistSchema.index({ name: "text" });

module.exports = mongoose.model("Artist", ArtistSchema);