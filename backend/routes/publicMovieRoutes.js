const express = require("express");
const router = express.Router();
const movieController = require("../controllers/movieController");

router.get("/", movieController.getMovies);
router.get("/:id", movieController.getMovie);
router.put("/vote/:id", movieController.voteMovie);

module.exports = router;
