const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const movieStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          "cineverse/movies",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          "cineverse/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation:  [{ width: 400, height: 400, crop: "fill" }],
  },
});

const eventStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          "cineverse/events",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const artistStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          "cineverse/artists",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const venueStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          "cineverse/venues",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const offerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          "cineverse/offers",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const tourStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          "cineverse/tours",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload       = multer({ storage: movieStorage,  limits: { fileSize: 10 * 1024 * 1024 } });
const avatarUpload = multer({ storage: avatarStorage, limits: { fileSize: 2  * 1024 * 1024 } });
const eventUpload  = multer({ storage: eventStorage,  limits: { fileSize: 10 * 1024 * 1024 } });
const artistUpload = multer({ storage: artistStorage, limits: { fileSize: 5  * 1024 * 1024 } });
const venueUpload  = multer({ storage: venueStorage,  limits: { fileSize: 5  * 1024 * 1024 } });
const offerUpload  = multer({ storage: offerStorage,  limits: { fileSize: 5  * 1024 * 1024 } });
const tourUpload   = multer({ storage: tourStorage,   limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = { cloudinary, upload, avatarUpload, eventUpload, artistUpload, venueUpload, offerUpload, tourUpload };