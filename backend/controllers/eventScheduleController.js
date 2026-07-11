const EventSchedule = require("../models/EventSchedule");
const { cleanupCompletedSchedules } = require("../services/eventAutomation");

const populate = (q) => q.populate("event").populate({ path: "venue", populate: [{ path: "city" }, { path: "district" }] });

exports.createSchedule = async (req, res) => {
  try {
    const { event, venue, eventDate, showTimes } = req.body;

    const existing = await EventSchedule.findOne({ event, venue, eventDate });
    if (existing) {
      return res.status(400).json({
        message: "A schedule for this event, venue and date already exists. Use update to modify times.",
      });
    }

    const schedule = await EventSchedule.create({ event, venue, eventDate, showTimes });
    const populated = await populate(EventSchedule.findById(schedule._id));

    res.json({ message: "Schedule created successfully", schedule: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSchedules = async (req, res) => {
  try {
    await cleanupCompletedSchedules();
    const schedules = await populate(EventSchedule.find()).sort({ eventDate: 1 });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await populate(EventSchedule.findById(req.params.id));
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSchedulesByEvent = async (req, res) => {
  try {
    await cleanupCompletedSchedules();
    const schedules = await populate(
      EventSchedule.find({ event: req.params.eventId })
    ).sort({ eventDate: 1 });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSchedulesByDistrict = async (req, res) => {
  try {
    await cleanupCompletedSchedules();
    const { districtId, eventId } = req.params;

    const schedules = await EventSchedule.find({ event: eventId })
      .populate({
        path: "venue",
        match: { district: districtId },
        populate: [{ path: "city" }, { path: "district" }],
      })
      .populate("event")
      .sort({ eventDate: 1 });

    res.json(schedules.filter((s) => s.venue));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const schedule = await populate(
      EventSchedule.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      )
    );

    if (!schedule) return res.status(404).json({ message: "Schedule not found" });
    res.json({ message: "Schedule updated successfully", schedule });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "A schedule for this event, venue and date already exists.",
      });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.addTimeSlot = async (req, res) => {
  try {
    const { time, endTime, price, ticketTypes } = req.body;
    const schedule = await populate(
      EventSchedule.findByIdAndUpdate(
        req.params.id,
        { $push: { showTimes: { time, endTime, price, ticketTypes } } },
        { new: true, runValidators: true }
      )
    );
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });
    res.json({ message: "Time slot added", schedule });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeTimeSlot = async (req, res) => {
  try {
    const schedule = await populate(
      EventSchedule.findByIdAndUpdate(
        req.params.id,
        { $pull: { showTimes: { _id: req.params.timeSlotId } } },
        { new: true }
      )
    );
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });
    res.json({ message: "Time slot removed", schedule });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await EventSchedule.findByIdAndDelete(req.params.id);
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });
    res.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bulkDeleteSchedules = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No schedule IDs provided" });
    }
    const result = await EventSchedule.deleteMany({ _id: { $in: ids } });
    res.json({ message: `${result.deletedCount} schedule(s) deleted successfully`, deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};