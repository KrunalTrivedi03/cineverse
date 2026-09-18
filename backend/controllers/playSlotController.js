const PlaySlot = require("../models/PlaySlot");
const PlaySlotLock = require("../models/PlaySlotLock");
const Court = require("../models/Court");
const PlayVenue = require("../models/PlayVenue");
const PlayBooking = require("../models/PlayBooking");

const LOCK_MINUTES = 5; // matches EventSeatLock's hold window

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

/* GET /api/play-slots/availability/:venueId/:date
   Returns every active court at the venue with its slots for that date,
   each tagged available/locked/booked — same shape philosophy as
   getSeatLayout, just courts+slots instead of a seat grid. */
exports.getSlotAvailability = async (req, res) => {
  try {
    const { venueId, date } = req.params;
    const targetDate = startOfDay(new Date(date));
    if (isNaN(targetDate.getTime())) return res.status(400).json({ message: "Invalid date" });

    const venue = await PlayVenue.findById(venueId);
    if (!venue) return res.status(404).json({ message: "Venue not found" });

    const courts = await Court.find({ venue: venueId, isActive: true }).populate("activity", "name slug icon").sort({ name: 1 });
    if (!courts.length) return res.json({ venue: venue.name, date: targetDate, courts: [] });

    const courtIds = courts.map((c) => c._id);
    const slots = await PlaySlot.find({ court: { $in: courtIds }, date: targetDate }).sort({ startMin: 1 });

    const now = new Date();
    const locks = await PlaySlotLock.find({ slot: { $in: slots.map((s) => s._id) }, expiresAt: { $gt: now } });
    const lockedSet = new Set(locks.map((l) => l.slot.toString()));

    const slotsByCourt = {};
    slots.forEach((s) => {
      const key = s.court.toString();
      if (!slotsByCourt[key]) slotsByCourt[key] = [];
      slotsByCourt[key].push({
        _id: s._id,
        startTime: s.startTime,
        endTime: s.endTime,
        price: s.price,
        status: s.status === "booked" ? "booked" : lockedSet.has(s._id.toString()) ? "locked" : "available",
      });
    });

    res.json({
      venue: venue.name,
      venueId: venue._id,
      venueImage: venue.images?.[0] || null,
      date: targetDate,
      locksExpireIn: LOCK_MINUTES * 60,
      courts: courts.map((c) => ({
        _id: c._id,
        name: c.name,
        activity: c.activity,
        surfaceType: c.surfaceType,
        indoor: c.indoor,
        slots: slotsByCourt[c._id.toString()] || [],
      })),
    });
  } catch (e) {
    console.error("getSlotAvailability error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

exports.lockSlots = async (req, res) => {
  try {
    const { slotIds } = req.body;
    const userId = req.user.id.toString();
    if (!slotIds?.length) return res.status(400).json({ message: "No slots provided" });
    if (slotIds.length > 8) return res.status(400).json({ message: "Max 8 slots per booking" });
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + LOCK_MINUTES * 60 * 1000);

    const slots = await PlaySlot.find({ _id: { $in: slotIds } });
    if (slots.length !== slotIds.length) {
      return res.status(404).json({ message: "One or more slots not found" });
    }

    const alreadyBooked = slots.filter((s) => s.status === "booked").map((s) => s._id.toString());

    const existingLocks = await PlaySlotLock.find({
      slot: { $in: slotIds },
      userId: { $ne: userId },
      expiresAt: { $gt: now },
    });

    const unavailable = [...new Set([...alreadyBooked, ...existingLocks.map((l) => l.slot.toString())])];

    if (unavailable.length > 0) {
      return res.status(409).json({ message: "Some slots are no longer available", unavailableSlots: unavailable });
    }

    // All slots must belong to the same court — a booking is for one
    // court's slots, not a mix (mirrors the single-court slot grid the
    // frontend presents per column).
    const courtIds = new Set(slots.map((s) => s.court.toString()));
    if (courtIds.size > 1) {
      return res.status(400).json({ message: "All selected slots must belong to the same court" });
    }

    await PlaySlotLock.deleteMany({ slot: { $in: slotIds }, userId });
    await PlaySlotLock.insertMany(slotIds.map((slot) => ({ slot, userId, expiresAt })));

    res.json({ message: "Slots locked", lockedSlots: slotIds, expiresAt, expiresIn: LOCK_MINUTES * 60 });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ message: "Some slots just got taken. Please reselect." });
    }
    console.error("lockSlots error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

exports.unlockSlots = async (req, res) => {
  try {
    const { slotIds, userId } = req.body;
    await PlaySlotLock.deleteMany({ slot: { $in: slotIds }, userId });
    res.json({ message: "Slots unlocked" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ── Bookings (shared list/detail, same shape as eventSeatController) ── */
/* GET /api/play-slots/bookings/admin — admin dashboard listing, with optional
   status/date/venue filters. Declared before the /:id route below so
   "admin" isn't swallowed as an :id param. */
exports.getAllPlayBookings = async (req, res) => {
  try {
    const { status, venue, date } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (venue) filter.venue = venue;
    if (date) {
      const d = startOfDay(new Date(date));
      const next = new Date(d); next.setDate(next.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    }

    const bookings = await PlayBooking.find(filter)
      .populate("user", "username email")
      .populate("venue", "name")
      .populate("activity", "name")
      .sort({ createdAt: -1 })
      .limit(500);
    res.json(bookings);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getUserPlayBookings = async (req, res) => {
  try {
    const bookings = await PlayBooking.find({ user: req.params.userId })
      .populate("activity", "name icon")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getPlayBookingById = async (req, res) => {
  try {
    const booking = await PlayBooking.findById(req.params.id)
      .populate("venue")
      .populate("court")
      .populate("activity", "name icon")
      .populate("slots");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};