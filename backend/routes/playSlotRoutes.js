const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const psc = require("../controllers/playSlotController");

router.get("/availability/:venueId/:date", psc.getSlotAvailability);
router.post("/lock", verifyToken, psc.lockSlots);
router.delete("/lock", verifyToken, psc.unlockSlots);

/* Shared bookings list/detail (same URL shape as event-seats) */
router.get("/bookings/admin", psc.getAllPlayBookings);
router.get("/bookings/user/:userId", psc.getUserPlayBookings);
router.get("/bookings/:id", psc.getPlayBookingById);

module.exports = router;
