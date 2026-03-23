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

const upload      = multer({ storage: movieStorage, limits: { fileSize: 10 * 1024 * 1024 } });
const avatarUpload = multer({ storage: avatarStorage, limits: { fileSize: 2 * 1024 * 1024 } });

module.exports = { cloudinary, upload, avatarUpload };