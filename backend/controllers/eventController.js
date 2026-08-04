const Event         = require("../models/Event");
const EventSchedule = require("../models/EventSchedule");
const { syncEventStatuses } = require("../services/eventAutomation");

const populateEvent = (q) => q.populate("artists", "name image genres").populate("tour", "title poster status");

const attachNextSchedule = async (events, { city, district } = {}) => {
  if (!events.length) return events;
  const eventIds = events.map((e) => e._id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const schedules = await EventSchedule.find({ event: { $in: eventIds }, eventDate: { $gte: today } })
    .populate({ path: "venue", populate: ["city", "district"] })
    .sort({ eventDate: 1 });

  const byEvent = {};
  schedules.forEach((s) => {
    const key = s.event.toString();
    if (!byEvent[key]) byEvent[key] = [];
    byEvent[key].push(s); // already sorted by eventDate above
  });

  const cityId     = city     ? city.toString()     : null;
  const districtId = district ? district.toString() : null;

  const enriched = events.map((e) => {
    const obj  = e.toObject();
    const all  = byEvent[e._id.toString()] || [];

    // When a city is selected, only that city's schedules count for this event
    const candidates = cityId
      ? all.filter((s) => s.venue?.city?._id?.toString() === cityId)
      : all;

    const sched = candidates[0]; // earliest matching schedule
    if (sched) {
      const prices = (sched.showTimes || []).flatMap((st) =>
        st.ticketTypes?.length ? st.ticketTypes.map((tt) => tt.price) : (st.price != null ? [st.price] : [])
      );
      obj.nextSchedule = {
        scheduleId:    sched._id,
        eventDate:     sched.eventDate,
        time:          sched.showTimes?.[0]?.time,
        venue:         sched.venue,
        startingPrice: prices.length ? Math.min(...prices) : null,
      };
    } else {
      obj.nextSchedule = null;
    }

    obj._matchesCity     = cityId ? candidates.length > 0 : true;
    obj._matchesDistrict = districtId
      ? candidates.some((s) => s.venue?.district?._id?.toString() === districtId)
      : false;

    return obj;
  });

  let result = enriched;
  if (cityId) result = result.filter((e) => e._matchesCity);
  if (districtId) result.sort((a, b) => b._matchesDistrict - a._matchesDistrict);

  return result.map(({ _matchesCity, _matchesDistrict, ...rest }) => rest);
};

exports.createEvent = async (req, res) => {
  try {
    const {
      title, description, category, genre, artists, languages, duration,
      ageRestriction, eventRules, trailerLink, bookingType, organizer,
      tags, status, isFeatured, tour,
    } = req.body;

    const eventData = {
      title, description, category, genre, languages: languages ? JSON.parse(languages) : [],
      duration:      duration || undefined,
      ageRestriction: ageRestriction || "All Ages",
      bookingType:    bookingType || "general",
      status:         status || "upcoming",
      isFeatured:     isFeatured === "true" || isFeatured === true,
      trailerLink,
      artists:    artists    ? JSON.parse(artists)    : [],
      eventRules: eventRules ? JSON.parse(eventRules) : [],
      organizer:  organizer  ? JSON.parse(organizer)  : {},
      tags:       tags       ? JSON.parse(tags)       : [],
      tour:       tour || null,
      gallery: [],
    };

    if (req.files?.poster)  eventData.poster  = req.files.poster[0].path;
    if (req.files?.gallery) eventData.gallery = req.files.gallery.map((f) => f.path);

    const event = await Event.create(eventData);
    res.status(201).json({ message: "Event added successfully", event });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const {
      title, description, category, genre, artists, languages, duration,
      ageRestriction, eventRules, trailerLink, bookingType, organizer,
      tags, status, isFeatured, tour,
    } = req.body;

    if (title)         event.title         = title;
    if (description)   event.description   = description;
    if (category)       event.category      = category;
    if (genre)          event.genre         = genre;
    if (languages) { event.languages = JSON.parse(languages); }
    if (duration !== undefined) event.duration = duration;
    if (ageRestriction) event.ageRestriction = ageRestriction;
    if (bookingType)    event.bookingType    = bookingType;
    if (status)          event.status         = status;
    if (trailerLink)    event.trailerLink   = trailerLink;
    if (typeof isFeatured !== "undefined") event.isFeatured = isFeatured === "true" || isFeatured === true;
    // Explicit empty string / "null" clears the tour link; omitted field leaves it untouched
    if (typeof tour !== "undefined") event.tour = tour || null;

    if (artists)    event.artists    = JSON.parse(artists);
    if (eventRules) event.eventRules = JSON.parse(eventRules);
    if (organizer)  event.organizer  = JSON.parse(organizer);
    if (tags)       event.tags       = JSON.parse(tags);

    if (req.files?.poster)  event.poster  = req.files.poster[0].path;
    if (req.files?.gallery) event.gallery = req.files.gallery.map((f) => f.path);

    await event.save();
    res.json({ message: "Event updated successfully", event });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    await EventSchedule.deleteMany({ event: event._id });

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    await syncEventStatuses();

    const { category, status, district, city, tour, unlinked } = req.query;
    let filter = {};
    if (category) filter.category = category;
    if (status)   filter.status   = status;
    if (tour)     filter.tour     = tour;
    if (unlinked === "true") filter.tour = null;

    if (district || city) {
      const scheduleFilter = {};
      if (district) scheduleFilter["venue"] = { $exists: true }; // narrowed below via join
      const schedules = await EventSchedule.find(scheduleFilter).populate({
        path: "venue",
        match: {
          ...(district ? { district } : {}),
          ...(city ? { city } : {}),
        },
      });
      const eventIds = [...new Set(
        schedules.filter((s) => s.venue).map((s) => s.event.toString())
      )];
      filter._id = { $in: eventIds };
    }

    const events = await populateEvent(Event.find(filter)).sort({ createdAt: -1 });
    res.json(await attachNextSchedule(events));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEvent = async (req, res) => {
  try {
    const event = await populateEvent(Event.findById(req.params.id));
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEventsByCategory = async (req, res) => {
  try {
    const { city, district } = req.query;
    const events = await populateEvent(
      Event.find({ category: req.params.category, status: { $ne: "cancelled" } })
    ).sort({ createdAt: -1 });
    res.json(await attachNextSchedule(events, { city, district }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEventsByArtist = async (req, res) => {
  try {
    const { city, district } = req.query;
    const events = await populateEvent(
      Event.find({ artists: req.params.artistId, status: { $ne: "cancelled" } })
    ).sort({ createdAt: -1 });
    res.json(await attachNextSchedule(events, { city, district }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEventsByTour = async (req, res) => {
  try {
    const events = await populateEvent(
      Event.find({ tour: req.params.tourId })
    ).sort({ createdAt: 1 });
    res.json(await attachNextSchedule(events));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEventsByDistrict = async (req, res) => {
  try {
    const schedules = await EventSchedule.find().populate({
      path: "venue",
      match: { district: req.params.districtId },
    });
    const eventIds = [...new Set(
      schedules.filter((s) => s.venue).map((s) => s.event.toString())
    )];

    const events = await populateEvent(
      Event.find({ _id: { $in: eventIds }, status: { $ne: "cancelled" } })
    ).sort({ createdAt: -1 });
    res.json(await attachNextSchedule(events));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchEvents = async (req, res) => {
  try {
    const { q, city, district } = req.query;
    if (!q) return res.json([]);

    const events = await populateEvent(
      Event.find({
        $or: [
          { title: { $regex: q, $options: "i" } },
          { tags:  { $regex: q, $options: "i" } },
          { genre: { $regex: q, $options: "i" } },
        ],
        status: { $ne: "cancelled" },
      })
    ).limit(city ? 60 : 30);

    res.json((await attachNextSchedule(events, { city, district })).slice(0, 30));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTrendingEvents = async (req, res) => {
  try {
    const { city, district } = req.query;
    const events = await populateEvent(
      Event.find({ status: { $in: ["upcoming", "live"] } })
    ).sort({ "ratings.count": -1, createdAt: -1 }).limit(city ? 40 : 12);
    res.json((await attachNextSchedule(events, { city, district })).slice(0, 12));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPopularEvents = async (req, res) => {
  try {
    const { city, district } = req.query;
    const events = await populateEvent(
      Event.find({ status: { $in: ["upcoming", "live"] }, "ratings.count": { $gt: 0 } })
    ).sort({ "ratings.average": -1 }).limit(city ? 40 : 12);
    res.json((await attachNextSchedule(events, { city, district })).slice(0, 12));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUpcomingEvents = async (req, res) => {
  try {
    await syncEventStatuses();
    const { city, district } = req.query;
    const events = await populateEvent(Event.find({ status: "upcoming" })).sort({ createdAt: -1 }).limit(city ? 60 : 20);
    res.json((await attachNextSchedule(events, { city, district })).slice(0, 20));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecommendedEvents = async (req, res) => {
  try {
    // MVP heuristic — admin-curated featured events. Swap for personalized logic later.
    const { city, district } = req.query;
    const events = await populateEvent(
      Event.find({ isFeatured: true, status: { $in: ["upcoming", "live"] } })
    ).sort({ createdAt: -1 }).limit(city ? 40 : 12);
    res.json((await attachNextSchedule(events, { city, district })).slice(0, 12));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSimilarEvents = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const events = await populateEvent(
      Event.find({
        _id: { $ne: event._id },
        category: event.category,
        status: { $in: ["upcoming", "live"] },
      })
    ).limit(8);
    res.json(await attachNextSchedule(events));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};