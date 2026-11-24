const Booking = require("../models/Booking");
const EventBooking = require("../models/EventBooking");
const PlayBooking = require("../models/PlayBooking");
const Movie = require("../models/Movie");
const Event = require("../models/Event");
const PlayVenue = require("../models/PlayVenue");
const City = require("../models/City");

exports.getPlatformStats = async (req, res, next) => {
  const confirmed = { status: "confirmed" };
  try {
    const [movieBookings, eventBookings, playBookings, movies, events, playVenues, cities, rating] =
      await Promise.all([
        Booking.countDocuments(confirmed),
        EventBooking.countDocuments(confirmed),
        PlayBooking.countDocuments(confirmed),
        Movie.countDocuments(),
        Event.countDocuments({ status: { $in: ["upcoming", "live"] } }),
        PlayVenue.countDocuments({ isActive: true }),
        City.countDocuments(),
        Movie.aggregate([
          { $match: { rating: { $type: "number", $gt: 0, $lte: 10 } } },
          { $group: { _id: null, average: { $avg: "$rating" } } },
        ]),
      ]);

    res.json({
      bookings: movieBookings + eventBookings + playBookings,
      movies,
      events,
      playVenues,
      cities,
      averageMovieRating: rating[0]?.average ?? null,
    });
  } catch (error) {
    next(error);
  }
};
