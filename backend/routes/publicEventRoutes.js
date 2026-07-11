const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");

/* Specific routes before the /:id wildcard */
router.get("/trending",           eventController.getTrendingEvents);
router.get("/popular",            eventController.getPopularEvents);
router.get("/upcoming",           eventController.getUpcomingEvents);
router.get("/recommended",        eventController.getRecommendedEvents);
router.get("/search",             eventController.searchEvents);
router.get("/category/:category", eventController.getEventsByCategory);
router.get("/artist/:artistId",   eventController.getEventsByArtist);
router.get("/district/:districtId", eventController.getEventsByDistrict);
router.get("/:id/similar",        eventController.getSimilarEvents);

router.get("/",     eventController.getEvents);
router.get("/:id",  eventController.getEvent);

module.exports = router;