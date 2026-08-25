const mongoose = require("mongoose");

// A venue that hosts one or more Play activities (courts/tables/turfs).
// Mirrors Venue.js's use of City/District for location, but venues here
// don't have a seat layout — their bookable units are Courts (separate
// collection, one court belongs to exactly one activity).
const PlayVenueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: mongoose.Schema.Types.ObjectId, ref: "City", required: true },
    district: { type: mongoose.Schema.Types.ObjectId, ref: "District", required: true },
    address: { type: String, default: "" },
    locationLink: { type: String, default: "" },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },

    // Denormalized so venue browse/filter queries don't need to join Court —
    // kept in sync whenever a court is added/removed/activated (see
    // courtController.js's syncVenueActivities helper).
    activities: [{ type: mongoose.Schema.Types.ObjectId, ref: "PlayActivity" }],

    amenities: [String], // e.g. ["Parking", "Washroom", "Drinking Water", "Cafeteria"]
    images: [String],
    description: { type: String, default: "" },

    contactPhone: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PlayVenueSchema.index({ district: 1, activities: 1 });

module.exports = mongoose.model("PlayVenue", PlayVenueSchema);
