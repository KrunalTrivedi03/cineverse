const { Types } = require("mongoose");
const QRCode = require("qrcode");
const Booking = require("../models/Booking");
const EventBooking = require("../models/EventBooking");
const PlayBooking = require("../models/PlayBooking");

const models = { movies: Booking, events: EventBooking, play: PlayBooking };

exports.getTicket = async (req, res, next) => {
  try {
    const { kind, id } = req.params;
    const model = Object.hasOwn(models, kind) && models[kind];
    if (!model || !Types.ObjectId.isValid(id)) return res.status(404).json({ message: "Booking not found" });
    let query = model.findOne({ _id: id, user: req.user.id });
    if (kind === "movies") query = query.populate("theatre", "name").populate({ path: "show", populate: { path: "movie", select: "title" } });
    if (kind === "events") query = query.populate("venue", "name").populate("event", "title");
    if (kind === "play") query = query.populate("slots", "startTime endTime");
    const booking = await query.lean();
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status !== "confirmed") return res.status(409).json({ message: "A ticket is available only after payment is confirmed" });

    const bookingRef = booking.bookingRef;
    const qr = await QRCode.toDataURL(bookingRef, { errorCorrectionLevel: "M", width: 280, margin: 2 });
    res.set("Cache-Control", "private, no-store");
    return res.json({
      bookingRef, qr,
      title: booking.movieTitle || booking.show?.movie?.title || booking.event?.title || booking.activityName || "NOW ticket",
      venue: booking.theatre?.name || booking.venue?.name || booking.venueName,
      date: booking.showDate || booking.eventDate || booking.date,
      time: booking.showTime || booking.eventTime || booking.slots?.map((slot) => slot.startTime + "–" + slot.endTime).join(", "),
      seats: booking.seats?.map((seat) => seat.seatId),
      ticketType: booking.ticketType?.name,
      quantity: booking.quantity,
      total: booking.grandTotal ?? booking.pricing?.total,
      status: booking.status,
    });
  } catch (error) {
    return next(error);
  }
};
