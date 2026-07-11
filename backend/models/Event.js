const mongoose = require("mongoose");

const EVENT_CATEGORIES = [
  "Music",
  "Nightlife",
  "Comedy Shows",
  "Expos",
  "Performances",
  "Workshops",
  "Sports",
];

const OrganizerSchema = new mongoose.Schema({
  name:  String,
  email: String,
  phone: String,
}, { _id: false });

const EventSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: String,

  category: {
    type: String,
    enum: EVENT_CATEGORIES,
    required: true,
  },
  genre: String, // e.g. "Rock", "Stand-up", "Tech" — free-text sub-classification within category

  artists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Artist",
  }],

  languages: [
  {
    type: String,
  },
],

  duration: Number, // in minutes

  ageRestriction: {
    type: String,
    enum: ["All Ages", "13+", "16+", "18+"],
    default: "All Ages",
  },

  eventRules: [String], // e.g. ["No outside food", "No re-entry", "ID proof mandatory"]

  poster:  String,
  gallery: [String],

  trailerLink: String,

  /* Determines the booking UI/flow used downstream in EventSchedule + EventBooking */
  bookingType: {
    type: String,
    enum: ["seated", "general"],
    default: "general",
  },

  organizer: OrganizerSchema,

  tags: [String],

  ratings: {
    average: { type: Number, default: 0 },
    count:   { type: Number, default: 0 },
  },

  status: {
    type: String,
    enum: ["upcoming", "live", "completed", "cancelled"],
    default: "upcoming",
  },

  isFeatured: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

EventSchema.index({ title: "text", tags: "text", genre: "text" });

module.exports = mongoose.model("Event", EventSchema);