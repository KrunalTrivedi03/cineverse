const Court = require("../models/Court");
const PlaySlot = require("../models/PlaySlot");
const { generateDailySlotsForCourt } = require("../utils/playSlotGenerator");

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

/** Creates missing slots for every active court on one date. Idempotent —
 *  relies on PlaySlot's unique (court, date, startMin) index, so re-running
 *  this for a date that's already populated is a cheap no-op per slot. */
const generateSlotsForDate = async (dateObj) => {
  const targetDate = startOfDay(dateObj);
  const courts = await Court.find({ isActive: true });
  if (!courts.length) return;

  for (const court of courts) {
    const daily = generateDailySlotsForCourt(court, targetDate);
    if (!daily.length) continue;

    const docs = daily.map((s) => ({
      court: court._id,
      venue: court.venue,
      activity: court.activity,
      date: targetDate,
      ...s,
    }));

    try {
      await PlaySlot.insertMany(docs, { ordered: false });
    } catch (e) {
      // Duplicate-key errors are expected on re-runs (slot already exists)
      // and are safe to ignore; anything else is worth logging.
      if (!e.writeErrors?.every((w) => w.code === 11000) && e.code !== 11000) {
        console.error("Play slot generation error:", e.message);
      }
    }
  }
};

/** Fills every day in the rolling window (cheap — existing slots are skipped). */
const backfillPlayWindow = async (days = 14) => {
  const today = startOfDay(new Date());
  for (let i = 0; i < days; i++) {
    await generateSlotsForDate(addDays(today, i));
  }
};

/** Deletes past, never-booked slots. Booked slots are kept — PlayBooking
 *  and "My Bookings" history need them to still resolve. */
const cleanupCompletedPlaySlots = async () => {
  const today = startOfDay(new Date());
  await PlaySlot.deleteMany({ date: { $lt: today }, status: "available" });
};

/** Runs nightly: extends the rolling window by one day, cleans up
 *  completed unbooked slots, and backfills any gaps as a safety net —
 *  same three-step shape as showAutomation.js's runNightlyAutomation. */
const runNightlyPlayAutomation = async (windowDays = 14) => {
  await cleanupCompletedPlaySlots();
  const today = startOfDay(new Date());
  await generateSlotsForDate(addDays(today, windowDays - 1)); // the day newly entering the window
  await backfillPlayWindow(windowDays); // safety net for any gaps
};

module.exports = {
  generateSlotsForDate,
  backfillPlayWindow,
  cleanupCompletedPlaySlots,
  runNightlyPlayAutomation,
};
