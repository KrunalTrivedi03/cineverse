const express = require("express");
const router  = express.Router();
const showController = require("../controllers/showController");

router.post("/admin/create", showController.createShow);
router.put("/admin/update/:id", showController.updateShow);
router.delete("/admin/delete/:id", showController.deleteShow);

router.post("/admin/:id/times", showController.addShowTime);
router.delete("/admin/:id/times/:showTimeId", showController.removeShowTime);

router.get("/", showController.getShows);
router.get("/:id", showController.getShowById);
router.get("/movie/:movieId", showController.getShowsByMovie);
router.get("/city/:cityId/movie/:movieId", showController.getShowsByCity);

module.exports = router;