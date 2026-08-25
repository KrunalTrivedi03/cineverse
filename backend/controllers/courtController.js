const Court = require("../models/Court");
const PlayVenue = require("../models/PlayVenue");
const PlaySlot = require("../models/PlaySlot");
const { backfillPlayWindow } = require("../services/playAutomation");

const WINDOW_DAYS = 14;

/* Keeps PlayVenue.activities in sync with the activities its active courts
   actually offer — denormalized for fast venue browse/filter queries. */
const syncVenueActivities = async (venueId) => {
  const activityIds = await Court.distinct("activity", { venue: venueId, isActive: true });
  await PlayVenue.findByIdAndUpdate(venueId, { $set: { activities: activityIds } });
};

const validatePricingRules = (rules) => {
  if (!Array.isArray(rules) || rules.length === 0) return "At least one pricing rule is required";
  for (const r of rules) {
    if (!["weekday", "weekend"].includes(r.dayType)) return "Invalid dayType in pricing rule";
    if (!["offpeak", "peak"].includes(r.band)) return "Invalid band in pricing rule";
    if (typeof r.startMin !== "number" || typeof r.endMin !== "number" || r.startMin >= r.endMin) {
      return "Pricing rule time range is invalid";
    }
    if (typeof r.price !== "number" || r.price < 0) return "Pricing rule price is invalid";
  }
  return null;
};

exports.addCourt = async (req, res) => {
  try {
    const { venueId } = req.params;
    const { activity, name, surfaceType, indoor, capacity, operatingHours, slotDurationMinutes, pricingRules, images } = req.body;

    if (!activity || !name) return res.status(400).json({ message: "Activity and name are required" });

    const rulesErr = validatePricingRules(pricingRules);
    if (rulesErr) return res.status(400).json({ message: rulesErr });

    const venue = await PlayVenue.findById(venueId);
    if (!venue) return res.status(404).json({ message: "Venue not found" });

    const court = await Court.create({
      venue: venueId,
      activity,
      name,
      surfaceType: surfaceType || "",
      indoor: indoor !== false,
      capacity: capacity || 0,
      operatingHours: operatingHours || { startMin: 360, endMin: 1380 },
      slotDurationMinutes: slotDurationMinutes || 60,
      pricingRules,
      images: images || [],
    });

    await syncVenueActivities(venueId);

    // Generate this court's slots for the rolling window immediately —
    // don't make the venue wait for tonight's cron to become bookable.
    const { generateDailySlotsForCourt } = require("../utils/playSlotGenerator");
    const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    const today = startOfDay(new Date());

    for (let i = 0; i < WINDOW_DAYS; i++) {
      const targetDate = addDays(today, i);
      const daily = generateDailySlotsForCourt(court, targetDate);
      const docs = daily.map((s) => ({
        court: court._id, venue: court.venue, activity: court.activity, date: targetDate, ...s,
      }));
      try {
        await PlaySlot.insertMany(docs, { ordered: false });
      } catch (e) {
        if (e.code !== 11000 && !e.writeErrors?.every((w) => w.code === 11000)) throw e;
      }
    }

    res.json({ message: "Court added", court });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getCourtsByVenue = async (req, res) => {
  try {
    const courts = await Court.find({ venue: req.params.venueId }).populate("activity", "name slug icon").sort({ name: 1 });
    res.json(courts);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateCourt = async (req, res) => {
  try {
    const { courtId } = req.params;
    const update = { ...req.body };

    if (update.pricingRules) {
      const rulesErr = validatePricingRules(update.pricingRules);
      if (rulesErr) return res.status(400).json({ message: rulesErr });
    }

    const court = await Court.findByIdAndUpdate(courtId, { $set: update }, { new: true, runValidators: true });
    if (!court) return res.status(404).json({ message: "Court not found" });

    await syncVenueActivities(court.venue);

    // Pricing or hours changing means future not-yet-booked slots are now
    // stale. Wipe unbooked slots in the rolling window and regenerate —
    // booked slots (status: "booked") are untouched so existing bookings
    // keep their original price.
    const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    const today = startOfDay(new Date());
    const windowEnd = addDays(today, WINDOW_DAYS);

    await PlaySlot.deleteMany({ court: court._id, date: { $gte: today, $lt: windowEnd }, status: "available" });

    const { generateDailySlotsForCourt } = require("../utils/playSlotGenerator");
    for (let i = 0; i < WINDOW_DAYS; i++) {
      const targetDate = addDays(today, i);
      const daily = generateDailySlotsForCourt(court, targetDate);
      const docs = daily.map((s) => ({
        court: court._id, venue: court.venue, activity: court.activity, date: targetDate, ...s,
      }));
      try {
        await PlaySlot.insertMany(docs, { ordered: false });
      } catch (e) {
        if (e.code !== 11000 && !e.writeErrors?.every((w) => w.code === 11000)) throw e;
      }
    }

    res.json({ message: "Court updated", court });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.deleteCourt = async (req, res) => {
  try {
    const { courtId } = req.params;

    const activeBookedSlot = await PlaySlot.exists({ court: courtId, status: "booked" });
    if (activeBookedSlot) {
      return res.status(409).json({ message: "Cannot delete — this court has existing bookings. Deactivate it instead." });
    }

    const court = await Court.findByIdAndDelete(courtId);
    if (!court) return res.status(404).json({ message: "Court not found" });

    await PlaySlot.deleteMany({ court: courtId });
    await syncVenueActivities(court.venue);

    res.json({ message: "Court deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
