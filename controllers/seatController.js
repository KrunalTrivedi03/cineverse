const Show     = require("../models/Show");
const Theatre  = require("../models/Theatre");
const SeatLock = require("../models/SeatLock");
const Booking  = require("../models/Booking");

const LOCK_MINUTES = 5;
const CATEGORY_PRICE_ADD = { Recliner: 200, Premium: 100, Classic: 0 };

exports.getSeatLayout = async (req, res) => {
  try {
    const { showId, slotId } = req.params;

    const show = await Show.findById(showId);
    if (!show) return res.status(404).json({ message: "Show not found" });

    const slot = show.showTimes?.id
      ? show.showTimes.id(slotId)
      : show.showTimes?.find((t) => t._id.toString() === slotId);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    const theatre = await Theatre.findById(show.theatre).populate("city");
    if (!theatre) return res.status(404).json({ message: "Theatre not found" });

    const screenDoc = theatre.screens.find((s) => s.name === show.screen);
    if (!screenDoc) {
      return res.status(404).json({ message: `Screen "${show.screen}" not found in theatre` });
    }

    const layout = screenDoc.seatLayout || [];
    if (layout.length === 0) {
      return res.status(400).json({
        message: "Seat layout not configured for this screen. Please ask admin to set it up.",
      });
    }

    const now    = new Date();
    const locks  = await SeatLock.find({ showId, slotId, expiresAt: { $gt: now } });
    const lockedSet = new Set(locks.map((l) => l.seatId));

    const bookings  = await Booking.find({ show: showId, slotId, status: "confirmed" });
    const bookedSet = new Set(bookings.flatMap((b) => b.seats.map((s) => s.seatId)));

    const seats = {};
    layout.forEach(({ row, seats: count, category }) => {
      for (let col = 1; col <= count; col++) {
        const id = `${row}${col}`;
        seats[id] = {
          id,
          row,
          col,
          category,
          priceAdd: CATEGORY_PRICE_ADD[category] || 0,
          status: bookedSet.has(id) ? "booked"
                : lockedSet.has(id) ? "locked"
                : "available",
        };
      }
    });

    res.json({
      showId,
      slotId,
      basePrice:    slot.price,
      screen:       show.screen,
      screenName:   screenDoc.name,
      theatre:      theatre.name,
      theatreId:    theatre._id,
      showDate:     show.showDate,
      showTime:     slot.time,
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
    const { showId, slotId, seatIds, userId } = req.body;
    if (!seatIds?.length) return res.status(400).json({ message: "No seats provided" });
    if (seatIds.length > 10) return res.status(400).json({ message: "Max 10 seats per booking" });

    const now       = new Date();
    const expiresAt = new Date(now.getTime() + LOCK_MINUTES * 60 * 1000);

    const existingLocks = await SeatLock.find({
      showId, slotId,
      seatId:    { $in: seatIds },
      userId:    { $ne: userId },
      expiresAt: { $gt: now },
    });

    const existingBookings = await Booking.find({
      show:             showId,
      slotId,
      "seats.seatId":   { $in: seatIds },
      status:           "confirmed",
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

    await SeatLock.deleteMany({ showId, slotId, userId });
    await SeatLock.insertMany(
      seatIds.map((seatId) => ({ showId, slotId, seatId, userId, expiresAt }))
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
    const { showId, slotId, seatIds, userId } = req.body;
    await SeatLock.deleteMany({ showId, slotId, seatId: { $in: seatIds }, userId });
    res.json({ message: "Seats unlocked" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.confirmBooking = async (req, res) => {
  try {
    const { showId, slotId, seatIds, userId, paymentId } = req.body;

    const show = await Show.findById(showId);
    if (!show) return res.status(404).json({ message: "Show not found" });

    const slot = show.showTimes?.id
      ? show.showTimes.id(slotId)
      : show.showTimes?.find((t) => t._id.toString() === slotId);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    const now   = new Date();
    const locks = await SeatLock.find({
      showId, slotId,
      seatId:    { $in: seatIds },
      userId,
      expiresAt: { $gt: now },
    });

    if (locks.length !== seatIds.length) {
      return res.status(409).json({
        message: "Some seat locks have expired. Please restart your seat selection.",
      });
    }

    const theatre   = await Theatre.findById(show.theatre);
    const screenDoc = theatre?.screens.find((s) => s.name === show.screen);
    const layout    = screenDoc?.seatLayout || [];
    const rowMap    = {};
    layout.forEach((r) => { rowMap[r.row] = r; });

    const seatDocs = seatIds.map((seatId) => {
      const row      = seatId.replace(/\d+/g, "");
      const col      = parseInt(seatId.replace(/\D+/g, ""), 10);
      const category = rowMap[row]?.category || "Classic";
      const priceAdd = CATEGORY_PRICE_ADD[category] || 0;
      return { seatId, row, col, category, price: slot.price + priceAdd };
    });

    const totalAmount    = seatDocs.reduce((s, d) => s + d.price, 0);
    const convenienceFee = Math.round(totalAmount * 0.02);
    const grandTotal     = totalAmount + convenienceFee;

    const booking = await Booking.create({
      user:    userId,
      show:    showId,
      slotId,
      theatre: show.theatre,
      screen:  show.screen,
      showDate: show.showDate,
      showTime: slot.time,
      seats:   seatDocs,
      totalAmount,
      convenienceFee,
      grandTotal,
      paymentId: paymentId || "",
      status:    "confirmed",
    });

    await SeatLock.deleteMany({ showId, slotId, userId });

    res.json({
      message:    "Booking confirmed!",
      bookingRef: booking.bookingRef,
      booking,
    });
  } catch (e) {
    console.error("confirmBooking error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.params.userId, status: "confirmed" })
      .populate("show", "showDate screen")
      .populate("theatre", "name address")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user",    "username email")
      .populate("show")
      .populate("theatre", "name")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (e) { res.status(500).json({ message: e.message }); }
};