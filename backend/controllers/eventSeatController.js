const EventSchedule  = require("../models/EventSchedule");
const Venue          = require("../models/Venue");
const Event          = require("../models/Event");
const EventSeatLock  = require("../models/EventSeatLock");
const EventBooking   = require("../models/EventBooking");

const LOCK_MINUTES = 5;
const EVENT_CATEGORY_PRICE_ADD = { VIP: 500, Premium: 200, General: 0 };

const findSlot = (schedule, slotId) =>
  schedule.showTimes?.id
    ? schedule.showTimes.id(slotId)
    : schedule.showTimes?.find((t) => t._id.toString() === slotId);

/* ═══════════════════════════════════════════════════════
   SEATED EVENTS
═══════════════════════════════════════════════════════ */

exports.getSeatLayout = async (req, res) => {
  try {
    const { scheduleId, slotId } = req.params;

    const schedule = await EventSchedule.findById(scheduleId).populate("event");
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    const slot = findSlot(schedule, slotId);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    if (schedule.event.bookingType !== "seated") {
      return res.status(400).json({ message: "This event uses general-admission ticketing, not seat selection." });
    }

    const venue = await Venue.findById(schedule.venue).populate("city district");
    if (!venue) return res.status(404).json({ message: "Venue not found" });

    const layout = venue.seatLayout || [];
    if (layout.length === 0) {
      return res.status(400).json({
        message: "Seat layout not configured for this venue. Please ask admin to set it up.",
      });
    }

    const now   = new Date();
    const locks = await EventSeatLock.find({ eventScheduleId: scheduleId, slotId, expiresAt: { $gt: now } });
    const lockedSet = new Set(locks.map((l) => l.seatId));

    const bookings  = await EventBooking.find({ eventSchedule: scheduleId, slotId, status: "confirmed" });
    const bookedSet = new Set(bookings.flatMap((b) => b.seats.map((s) => s.seatId)));

    const seats = {};
    layout.forEach(({ row, seats: count, category }) => {
      for (let col = 1; col <= count; col++) {
        const id = `${row}${col}`;
        seats[id] = {
          id, row, col, category,
          priceAdd: EVENT_CATEGORY_PRICE_ADD[category] || 0,
          status: bookedSet.has(id) ? "booked"
                : lockedSet.has(id) ? "locked"
                : "available",
        };
      }
    });

    res.json({
      scheduleId, slotId,
      basePrice:   slot.price,
      venue:       venue.name,
      venueId:     venue._id,
      district:    venue.district,
      eventDate:   schedule.eventDate,
      eventTime:   slot.time,
      layout,
      seats,
      locksExpireIn: LOCK_MINUTES * 60,
    });
  } catch (e) {
    console.error("getSeatLayout error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

exports.lockSeats = async (req, res) => {
  try {
    const { scheduleId, slotId, seatIds, userId } = req.body;
    if (!seatIds?.length) return res.status(400).json({ message: "No seats provided" });
    if (seatIds.length > 10) return res.status(400).json({ message: "Max 10 seats per booking" });

    const now       = new Date();
    const expiresAt = new Date(now.getTime() + LOCK_MINUTES * 60 * 1000);

    const existingLocks = await EventSeatLock.find({
      eventScheduleId: scheduleId, slotId,
      seatId:    { $in: seatIds },
      userId:    { $ne: userId },
      expiresAt: { $gt: now },
    });

    const existingBookings = await EventBooking.find({
      eventSchedule:  scheduleId,
      slotId,
      "seats.seatId": { $in: seatIds },
      status:         "confirmed",
    });

    const unavailable = [
      ...existingLocks.map((l) => l.seatId),
      ...existingBookings.flatMap((b) => b.seats.map((s) => s.seatId)),
    ];

    if (unavailable.length > 0) {
      return res.status(409).json({
        message:          "Some seats are no longer available",
        unavailableSeats: unavailable,
      });
    }

    await EventSeatLock.deleteMany({ eventScheduleId: scheduleId, slotId, userId });
    await EventSeatLock.insertMany(
      seatIds.map((seatId) => ({ eventScheduleId: scheduleId, slotId, seatId, userId, expiresAt }))
    );

    res.json({
      message:     "Seats locked successfully",
      lockedSeats: seatIds,
      expiresAt,
      expiresIn:   LOCK_MINUTES * 60,
    });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ message: "Seats just got taken. Please reselect." });
    }
    console.error("lockSeats error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

exports.unlockSeats = async (req, res) => {
  try {
    const { scheduleId, slotId, seatIds, userId } = req.body;
    await EventSeatLock.deleteMany({ eventScheduleId: scheduleId, slotId, seatId: { $in: seatIds }, userId });
    res.json({ message: "Seats unlocked" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ═══════════════════════════════════════════════════════
   GENERAL-ADMISSION EVENTS
═══════════════════════════════════════════════════════ */

exports.getTicketAvailability = async (req, res) => {
  try {
    const { scheduleId, slotId } = req.params;

    const schedule = await EventSchedule.findById(scheduleId).populate("event");
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    const slot = findSlot(schedule, slotId);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    if (schedule.event.bookingType !== "general") {
      return res.status(400).json({ message: "This event uses seat selection, not general-admission ticketing." });
    }

    const now = new Date();
    // Sum quantities currently held by *other* pending bookings for this slot
    const pendingBookings = await EventBooking.find({
      eventSchedule: scheduleId, slotId, status: "pending", holdExpiresAt: { $gt: now },
    });

    const heldByType = {};
    pendingBookings.forEach((b) => {
      const key = b.ticketType?.name;
      if (!key) return;
      heldByType[key] = (heldByType[key] || 0) + (b.quantity || 0);
    });

    const ticketTypes = (slot.ticketTypes || []).map((t) => ({
      _id:            t._id,
      name:           t.name,
      price:          t.price,
      totalQuantity:  t.totalQuantity,
      bookedQuantity: t.bookedQuantity,
      held:           heldByType[t.name] || 0,
      available:      Math.max(0, t.totalQuantity - t.bookedQuantity - (heldByType[t.name] || 0)),
    }));

    res.json({
      scheduleId, slotId,
      eventDate: schedule.eventDate,
      eventTime: slot.time,
      ticketTypes,
    });
  } catch (e) {
    console.error("getTicketAvailability error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

/* ═══════════════════════════════════════════════════════
   SHARED — bookings list (both booking types)
═══════════════════════════════════════════════════════ */

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await EventBooking.find({ user: req.params.userId, status: "confirmed" })
      .populate("event", "title poster category")
      .populate("venue", "name address")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await EventBooking.find()
      .populate("user",  "username email")
      .populate("event", "title category")
      .populate("venue", "name")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await EventBooking.findById(req.params.id)
      .populate("event")
      .populate("venue")
      .populate("eventSchedule");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (e) { res.status(500).json({ message: e.message }); }
};