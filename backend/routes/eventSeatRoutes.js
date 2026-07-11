const express = require("express");
const router  = express.Router();
const esc = require("../controllers/eventSeatController");

/* Seated events */
router.get   ("/layout/:scheduleId/:slotId",  esc.getSeatLayout);
router.post  ("/lock",                        esc.lockSeats);
router.delete("/lock",                        esc.unlockSeats);

/* General-admission events */
router.get("/availability/:scheduleId/:slotId", esc.getTicketAvailability);

/* Shared */
router.get("/bookings/user/:userId",   esc.getUserBookings);
router.get("/bookings/admin",          esc.getAllBookings);
router.get("/bookings/:id",            esc.getBookingById);

module.exports = router;