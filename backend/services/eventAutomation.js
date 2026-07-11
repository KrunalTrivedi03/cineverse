const Event         = require("../models/Event");
const EventSchedule = require("../models/EventSchedule");

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

/** Deletes any event schedule whose date has fully passed.
 *  EventBooking keeps its own denormalized eventDate/eventTime fields,
 *  so past bookings still display correctly after their schedule is cleaned up. */
const cleanupCompletedSchedules = async () => {
  const today = startOfDay(new Date());
  await EventSchedule.deleteMany({ eventDate: { $lt: today } });
};

/** Recomputes each (non-cancelled) event's status from its remaining schedules. */
const syncEventStatuses = async () => {
  const today  = startOfDay(new Date());
  const events = await Event.find({ status: { $ne: "cancelled" } });

  for (const event of events) {
    const [todayCount, futureCount] = await Promise.all([
      EventSchedule.countDocuments({ event: event._id, eventDate: today }),
      EventSchedule.countDocuments({ event: event._id, eventDate: { $gte: today } }),
    ]);

    const newStatus = todayCount > 0 ? "live" : futureCount > 0 ? "upcoming" : "completed";

    if (event.status !== newStatus) {
      event.status = newStatus;
      await event.save();
    }
  }
};

/** Runs every night: clean up finished schedules, then resync statuses. */
const runNightlyEventAutomation = async () => {
  await cleanupCompletedSchedules();
  await syncEventStatuses();
};

module.exports = { cleanupCompletedSchedules, syncEventStatuses, runNightlyEventAutomation };