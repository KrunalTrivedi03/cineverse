// const multer = require("multer");
// const path = require("path");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
//   }
// });

// const upload = multer({ storage });

// module.exports = upload;

const {
  upload,
  avatarUpload,
  eventUpload,
  artistUpload,
  venueUpload,
  offerUpload,
  tourUpload,
  webShowUpload,
  activityUpload,
  cloudinary,
} = require("../config/cloudinary");

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const cityLogoUpload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: { folder: "cineverse/city-logos", allowed_formats: ["jpg", "jpeg", "png", "webp"] },
  }),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter(req, file, done) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.mimetype)) {
      return done(new Error("Choose a PNG, JPEG, or WebP image."));
    }
    return done(null, true);
  },
});

const handleUploadError = (err, req, res, next) => {
  if (err) return res.status(400).json({ message: err.message });
  next();
};

module.exports = { cityLogoUpload,
  upload,
  avatarUpload,
  eventUpload,
  artistUpload,
  venueUpload,
  offerUpload,
  tourUpload,
  webShowUpload,
  activityUpload,
  handleUploadError,
  cloudinary,
};