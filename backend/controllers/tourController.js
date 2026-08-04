const Tour         = require("../models/Tour");
const Event        = require("../models/Event");
const EventSchedule = require("../models/EventSchedule");

const populateTour = (q) => q.populate("artists", "name image genres");

/*
  Builds the "itinerary" for a tour: every Event (leg) that points at this
  tour, enriched with that leg's nearest upcoming EventSchedule so the UI
  can show city, venue, country and date per stop without extra round trips.
*/
const attachLegs = async (tours) => {
  if (!tours.length) return tours;
  const tourIds = tours.map((t) => t._id);

  const legs = await Event.find({ tour: { $in: tourIds } })
    .populate("artists", "name image genres")
    .sort({ createdAt: 1 });

  const legIds = legs.map((l) => l._id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const schedules = await EventSchedule.find({ event: { $in: legIds } })
    .populate({ path: "venue", populate: ["city", "district"] })
    .sort({ eventDate: 1 });

  const schedulesByEvent = {};
  schedules.forEach((s) => {
    const key = s.event.toString();
    if (!schedulesByEvent[key]) schedulesByEvent[key] = [];
    schedulesByEvent[key].push(s);
  });

  const legsByTour = {};
  legs.forEach((leg) => {
    const key = leg.tour.toString();
    if (!legsByTour[key]) legsByTour[key] = [];

    const legSchedules = schedulesByEvent[leg._id.toString()] || [];
    const upcoming = legSchedules.find((s) => s.eventDate >= today) || legSchedules[0] || null;

    legsByTour[key].push({
      event: leg,
      // Primary/display city — nearest upcoming schedule, kept for
      // backwards-compatible single-line summaries.
      city: upcoming?.venue?.city || null,
      district: upcoming?.venue?.district || null,
      venue: upcoming?.venue || null,
      eventDate: upcoming?.eventDate || null,
      scheduleId: upcoming?._id || null,
      isPast: upcoming ? upcoming.eventDate < today : false,
      totalSchedules: legSchedules.length,
      // Full breakdown — one entry per EventSchedule, so an event that's
      // been scheduled in several cities shows all of them, not just one.
      schedules: legSchedules.map((s) => ({
        scheduleId: s._id,
        city: s.venue?.city || null,
        district: s.venue?.district || null,
        venue: s.venue || null,
        eventDate: s.eventDate,
        isPast: s.eventDate < today,
      })),
    });
  });

  // Sort each tour's legs chronologically (undated legs go last)
  Object.values(legsByTour).forEach((arr) =>
    arr.sort((a, b) => {
      if (!a.eventDate && !b.eventDate) return 0;
      if (!a.eventDate) return 1;
      if (!b.eventDate) return -1;
      return new Date(a.eventDate) - new Date(b.eventDate);
    })
  );

  return tours.map((t) => {
    const obj = t.toObject ? t.toObject() : t;
    const tourLegs = legsByTour[t._id.toString()] || [];
    obj.legs = tourLegs;
    obj.legCount = tourLegs.length;
    obj.cities = [...new Set(
      tourLegs.flatMap((l) => (l.schedules?.length ? l.schedules : [l]))
        .filter((s) => s.city)
        .map((s) => s.city.name)
    )];
    obj.countries = [...new Set(
      tourLegs.flatMap((l) => (l.schedules?.length ? l.schedules : [l]))
        .filter((s) => s.city)
        .map((s) => s.city.country || "India")
    )];
    obj.nextLeg = tourLegs.find((l) => !l.isPast) || null;
    return obj;
  });
};

exports.createTour = async (req, res) => {
  try {
    const {
      title, description, category, artists, trailerLink,
      startDate, endDate, status, isFeatured, tags,
    } = req.body;

    const tourData = {
      title,
      description,
      category: category || undefined,
      trailerLink,
      startDate: startDate || undefined,
      endDate:   endDate   || undefined,
      status:    status    || "upcoming",
      isFeatured: isFeatured === "true" || isFeatured === true,
      artists: artists ? JSON.parse(artists) : [],
      tags:    tags    ? JSON.parse(tags)    : [],
      gallery: [],
    };

    if (req.files?.poster)  tourData.poster  = req.files.poster[0].path;
    if (req.files?.gallery) tourData.gallery = req.files.gallery.map((f) => f.path);

    const tour = await Tour.create(tourData);
    res.status(201).json({ message: "Tour created successfully", tour });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    const {
      title, description, category, artists, trailerLink,
      startDate, endDate, status, isFeatured, tags,
    } = req.body;

    if (title)          tour.title       = title;
    if (description)    tour.description = description;
    if (category)        tour.category    = category;
    if (trailerLink)    tour.trailerLink = trailerLink;
    if (startDate)       tour.startDate   = startDate;
    if (endDate)          tour.endDate     = endDate;
    if (status)           tour.status      = status;
    if (typeof isFeatured !== "undefined") tour.isFeatured = isFeatured === "true" || isFeatured === true;
    if (artists) tour.artists = JSON.parse(artists);
    if (tags)    tour.tags    = JSON.parse(tags);

    if (req.files?.poster)  tour.poster  = req.files.poster[0].path;
    if (req.files?.gallery) tour.gallery = req.files.gallery.map((f) => f.path);

    await tour.save();
    res.json({ message: "Tour updated successfully", tour });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    const legCount = await Event.countDocuments({ tour: tour._id });
    if (legCount > 0) {
      // Don't cascade-delete the actual events/shows — just unlink them so
      // they keep existing as standalone events instead of vanishing.
      await Event.updateMany({ tour: tour._id }, { $set: { tour: null } });
    }

    await tour.deleteOne();
    res.json({ message: "Tour deleted successfully", unlinkedLegs: legCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTours = async (req, res) => {
  try {
    const { status, category, featured } = req.query;
    const filter = {};
    if (status)   filter.status   = status;
    if (category) filter.category = category;
    if (featured) filter.isFeatured = true;

    const tours = await populateTour(Tour.find(filter)).sort({ createdAt: -1 });
    res.json(await attachLegs(tours));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTourById = async (req, res) => {
  try {
    const tour = await populateTour(Tour.findById(req.params.id));
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    const [enriched] = await attachLegs([tour]);
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getToursByArtist = async (req, res) => {
  try {
    const tours = await populateTour(
      Tour.find({ artists: req.params.artistId, status: { $ne: "cancelled" } })
    ).sort({ createdAt: -1 });
    res.json(await attachLegs(tours));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* Attach/detach an existing Event as a leg of a tour — used from the Event
   admin form so a leg can be created as a normal event first, then linked. */
exports.addLeg = async (req, res) => {
  try {
    const { eventId } = req.body;
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    const event = await Event.findByIdAndUpdate(eventId, { tour: tour._id }, { new: true });
    if (!event) return res.status(404).json({ message: "Event not found" });

    res.json({ message: "Event added to tour", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeLeg = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findOneAndUpdate(
      { _id: eventId, tour: req.params.id },
      { tour: null },
      { new: true }
    );
    if (!event) return res.status(404).json({ message: "Leg not found on this tour" });
    res.json({ message: "Event removed from tour", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchTours = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const tours = await populateTour(
      Tour.find({
        $or: [
          { title: { $regex: q, $options: "i" } },
          { tags:  { $regex: q, $options: "i" } },
        ],
        status: { $ne: "cancelled" },
      })
    ).limit(20);

    res.json(await attachLegs(tours));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};