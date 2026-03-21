const express = require("express");
const router  = express.Router();
const sc      = require("../controllers/seatController");

router.get("/layout/:showId/:slotId",  sc.getSeatLayout);
router.post("/lock",                   sc.lockSeats);
router.delete("/lock",                 sc.unlockSeats);
router.post("/book",                   sc.confirmBooking);
router.get("/bookings/user/:userId",   sc.getUserBookings);
router.get("/bookings/admin",          sc.getAllBookings);

module.exports = router;