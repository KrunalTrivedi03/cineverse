const mongoose = require("mongoose");

/*
  A Tour groups several Events (one Event per city/venue leg) that belong to
  the same touring production — e.g. "Arijit Singh — Forever Tour 2026".

  Each individual leg is still a normal Event (with its own EventSchedule(s),
  venue, city, pricing, etc). The Tour document itself just holds the shared
  branding/metadata and a back-reference is stored on Event.tour so a leg
  knows which tour it belongs to.
*/

const TourSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g. "Forever Tour 2026"
    description: String,

    artists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Artist",
      },
    ],

    category: {
      type: String,
      enum: ["Music", "Nightlife", "Comedy Shows", "Expos", "Performances", "Workshops", "Sports"],
    },

    poster: String, // tour banner / key art
    gallery: [String],

    trailerLink: String,

    /* Overall tour window — usually derived from the earliest/latest leg dates,
       but kept editable so admins can announce a tour before legs are added. */
    startDate: Date,
    endDate: Date,

    status: {
      type: String,
      enum: ["upcoming", "live", "completed", "cancelled"],
      default: "upcoming",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    tags: [String],
  },
  { timestamps: true }
);

TourSchema.index({ title: "text", tags: "text" });

module.exports = mongoose.model("Tour", TourSchema);
