const PlayVenue = require("../models/PlayVenue");
const Court = require("../models/Court");

const pop = (q) => q.populate("city", "name").populate("district", "name").populate("activities", "name slug icon");

/* Haversine distance in km — used for the public "distance" sort/filter.
   Kept dependency-free rather than pulling in a geo library for one formula. */
const distanceKm = (lat1, lon1, lat2, lon2) => {
  if ([lat1, lon1, lat2, lon2].some((v) => v === null || v === undefined)) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ── Admin CRUD ───────────────────────────────────────── */
exports.addVenue = async (req, res) => {
  try {
    const {
      name, city, district, address, locationLink,
      latitude, longitude, amenities, description, contactPhone,
    } = req.body;

    if (!name || !city || !district) {
      return res.status(400).json({ message: "Name, city, and district are required" });
    }

    const venueData = {
      name, city, district, address, locationLink,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      amenities: amenities ? JSON.parse(amenities) : [],
      description: description || "",
      contactPhone: contactPhone || "",
    };

    if (req.files?.images) {
      venueData.images = req.files.images.map((f) => f.path);
    }

    const v = await PlayVenue.create(venueData);
    res.json({ message: "Venue added", venue: await pop(PlayVenue.findById(v._id)) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getAllVenuesAdmin = async (req, res) => {
  try {
    const { cityId, districtId } = req.query;
    const filter = {};
    if (cityId) filter.city = cityId;
    if (districtId) filter.district = districtId;
    res.json(await pop(PlayVenue.find(filter)).sort({ createdAt: -1 }));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getVenueByIdAdmin = async (req, res) => {
  try {
    const v = await pop(PlayVenue.findById(req.params.id));
    if (!v) return res.status(404).json({ message: "Not found" });
    const courts = await Court.find({ venue: v._id }).populate("activity", "name slug icon").sort({ name: 1 });
    res.json({ venue: v, courts });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateVenue = async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.amenities !== undefined) update.amenities = JSON.parse(update.amenities);
    if (update.latitude !== undefined) update.latitude = update.latitude ? Number(update.latitude) : null;
    if (update.longitude !== undefined) update.longitude = update.longitude ? Number(update.longitude) : null;
    if (req.files?.images) update.images = req.files.images.map((f) => f.path);

    const v = await pop(PlayVenue.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true }));
    if (!v) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Updated", venue: v });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.deleteVenue = async (req, res) => {
  try {
    const courtCount = await Court.countDocuments({ venue: req.params.id });
    if (courtCount > 0) {
      return res.status(409).json({ message: `Cannot delete — this venue still has ${courtCount} court(s). Delete them first.` });
    }
    const v = await PlayVenue.findByIdAndDelete(req.params.id);
    if (!v) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ── Public browse ────────────────────────────────────────
   GET /api/play/venues?district=<id>&activity=<id>&sort=distance|price|rating
                        &lat=&lng=&amenities=Parking,Cafeteria&minPrice=&maxPrice=
   "price" here means the venue's cheapest active court price, computed
   on the fly — venues don't store a price themselves. */
exports.getPublicVenues = async (req, res) => {
  try {
    const { district, activity, activities, sort, lat, lng, amenities, minPrice, maxPrice, maxDistanceKm } = req.query;

    if (!district) {
      return res.status(400).json({ message: "district is required" });
    }

    // `activity` (single, legacy) or `activities` (comma-separated, from the
    // filter chips) — either narrows results to venues offering those
    // sport(s). Neither present = "All Sports Venues" (no sport filter).
    const activityIds = activities ? activities.split(",").filter(Boolean) : activity ? [activity] : [];

    const filter = { district, isActive: true };
    if (activityIds.length) filter.activities = { $in: activityIds };
    if (amenities) {
      const list = amenities.split(",").filter(Boolean);
      if (list.length) filter.amenities = { $all: list };
    }

    let venues = await pop(PlayVenue.find(filter)).lean();

    // Attach each venue's cheapest active court price — scoped to the
    // filtered activity/activities if any were requested, otherwise across
    // every active court at the venue — plus distance if coordinates were supplied.
    const courtFilter = { venue: { $in: venues.map((v) => v._id) }, isActive: true };
    if (activityIds.length) courtFilter.activity = { $in: activityIds };
    const courts = await Court.find(courtFilter).populate("activity", "name slug icon").lean();

    const cheapestByVenue = {};
    const activitiesByVenue = {};
    for (const c of courts) {
      const minRulePrice = Math.min(...c.pricingRules.map((r) => r.price));
      const key = c.venue.toString();
      if (!(key in cheapestByVenue) || minRulePrice < cheapestByVenue[key]) {
        cheapestByVenue[key] = minRulePrice;
      }
      if (!activitiesByVenue[key]) activitiesByVenue[key] = new Map();
      if (c.activity) activitiesByVenue[key].set(c.activity._id.toString(), c.activity);
    }

    venues = venues
      .filter((v) => cheapestByVenue[v._id.toString()] !== undefined) // only venues with a matching active court
      .map((v) => ({
        ...v,
        startingPrice: cheapestByVenue[v._id.toString()],
        // Sport tags actually bookable at this venue (post-filter) — used
        // for the little pills on each venue card ("Pool", "Snooker", ...).
        courtActivities: Array.from(activitiesByVenue[v._id.toString()]?.values() || []),
        distanceKm: lat && lng ? distanceKm(Number(lat), Number(lng), v.latitude, v.longitude) : null,
      }));

    if (minPrice) venues = venues.filter((v) => v.startingPrice >= Number(minPrice));
    if (maxPrice) venues = venues.filter((v) => v.startingPrice <= Number(maxPrice));
    if (maxDistanceKm && lat && lng) {
      venues = venues.filter((v) => v.distanceKm != null && v.distanceKm <= Number(maxDistanceKm));
    }

    if (sort === "price") venues.sort((a, b) => a.startingPrice - b.startingPrice);
    else if (sort === "distance") venues.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    // "rating" sort omitted for now — no rating field is populated by
    // anything yet (no review system exists); left as a documented no-op
    // so the query param doesn't error, rather than faking a sort.

    res.json(venues);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getPublicVenueById = async (req, res) => {
  try {
    const v = await pop(PlayVenue.findOne({ _id: req.params.id, isActive: true }));
    if (!v) return res.status(404).json({ message: "Venue not found" });

    const courts = await Court.find({ venue: v._id, isActive: true }).populate("activity", "name slug icon").sort({ name: 1 });
    res.json({ venue: v, courts });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};