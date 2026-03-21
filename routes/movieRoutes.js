const express = require("express");
const router = express.Router();

const movieController = require("../controllers/movieController");
const auth = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/permissionMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const movieUpload = upload.fields([
  { name: "poster", maxCount: 1 },
  { name: "castImages", maxCount: 50 },
  { name: "crewImages", maxCount: 50 }
]);

router.post(
  "/",
  auth,
  requirePermission("CREATE_MOVIE"),
  movieUpload,
  movieController.createMovie
);

router.put(
  "/:id",
  auth,
  requirePermission("UPDATE_MOVIE"),
  movieUpload,
  movieController.updateMovie
);

router.delete(
  "/:id",
  auth,
  requirePermission("DELETE_MOVIE"),
  movieController.deleteMovie
);

router.get(
  "/",
  auth,
  requirePermission("VIEW_MOVIES"),
  movieController.getMovies
);

router.get(
  "/:id",
  auth,
  requirePermission("VIEW_MOVIES"),
  movieController.getMovie
);

module.exports = router;