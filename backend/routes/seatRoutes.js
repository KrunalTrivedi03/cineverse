const express = require("express");
const router  = express.Router();
const sc      = require("../controllers/seatController");
const auth = require("../middleware/authMiddleware");

router.get("/layout/:showId/:slotId",  sc.getSeatLayout);
router.post("/lock",                   auth, sc.lockSeats);
router.delete("/lock",                 auth, sc.unlockSeats);
router.post("/book",                   auth, sc.confirmBooking);
router.get("/bookings/user/:userId",   sc.getUserBookings);
router.get("/bookings/admin",          sc.getAllBookings);

module.exports = router;
