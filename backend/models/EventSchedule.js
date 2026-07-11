const mongoose = require("mongoose");

const TicketTypeSchema = new mongoose.Schema({
  name:            { type: String, required: true }, // e.g. "General", "VIP", "Fan Pit"
  price:           { type: Number, required: true },
  totalQuantity:   { type: Number, required: true, min: 1 },
  bookedQuantity:  { type: Number, default: 0 },
});

const EventTimeSlotSchema = new mongoose.Schema({
  time:    { type: String, required: true }, // "19:30"
  endTime: String,

  /* Used when the parent Event.bookingType === "seated" — base price,
     per-seat-category add-on comes from EVENT_CATEGORY_PRICE_ADD (see eventSeatController) */
  price: Number,

  /* Used when the parent Event.bookingType === "general" */
  ticketTypes: [TicketTypeSchema],
});

const EventScheduleSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Venue",
    required: true,
  },
  eventDate: {
    type: Date,
    required: true,
  },
  showTimes: {
    type: [EventTimeSlotSchema],
    validate: {
      validator: (arr) => arr.length > 0,
      message: "At least one time slot is required",
    },
  },
}, { timestamps: true });

EventScheduleSchema.index(
  { event: 1, venue: 1, eventDate: 1 },
  { unique: true }
);

module.exports = mongoose.model("EventSchedule", EventScheduleSchema);