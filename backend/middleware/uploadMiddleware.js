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
  cloudinary,
} = require("../config/cloudinary");

const handleUploadError = (err, req, res, next) => {
  if (err) return res.status(400).json({ message: err.message });
  next();
};

module.exports = {
  upload,
  avatarUpload,
  eventUpload,
  artistUpload,
  venueUpload,
  offerUpload,
  tourUpload,
  handleUploadError,
  cloudinary,
};