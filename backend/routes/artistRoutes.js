const express = require("express");
const router  = express.Router();

const artistController = require("../controllers/artistController");
const { artistUpload, handleUploadError } = require("../middleware/uploadMiddleware");

router.post(
  "/admin/create",
  artistUpload.single("image"),
  handleUploadError,
  artistController.createArtist
);

router.put(
  "/admin/update/:id",
  artistUpload.single("image"),
  handleUploadError,
  artistController.updateArtist
);

router.delete("/admin/delete/:id", artistController.deleteArtist);

router.get("/",         artistController.getArtists);
router.get("/search",   artistController.searchArtists);
router.get("/:id",      artistController.getArtistById);

module.exports = router;