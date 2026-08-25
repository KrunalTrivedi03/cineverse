const mongoose = require("mongoose");

// One pricing band. A court can have several — e.g. weekday-offpeak,
// weekday-peak, weekend-offpeak, weekend-peak — and the slot generator
// resolves the matching rule for each generated time and bakes the
// resulting price into the PlaySlot at creation time (see
// utils/playSlotGenerator.js).
const PricingRuleSchema = new mongoose.Schema(
  {
    dayType: { type: String, enum: ["weekday", "weekend"], required: true },
    band: { type: String, enum: ["offpeak", "peak"], required: true },
    // Minutes since midnight, e.g. 17:00 = 1020. End is exclusive.
    startMin: { type: Number, required: true, min: 0, max: 1440 },
    endMin: { type: Number, required: true, min: 0, max: 1440 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const CourtSchema = new mongoose.Schema(
  {
    venue: { type: mongoose.Schema.Types.ObjectId, ref: "PlayVenue", required: true, index: true },
    activity: { type: mongoose.Schema.Types.ObjectId, ref: "PlayActivity", required: true },

    name: { type: String, required: true, trim: true }, // e.g. "Court 1", "Turf A"
    surfaceType: { type: String, default: "" }, // e.g. "Synthetic", "Wooden", "Astro Turf"
    indoor: { type: Boolean, default: true },
    capacity: { type: Number, default: 0 }, // e.g. max players, informational

    // Bookable window and slot granularity for slot generation.
    operatingHours: {
      startMin: { type: Number, default: 360 },  // 06:00
      endMin: { type: Number, default: 1380 },    // 23:00
    },
    slotDurationMinutes: { type: Number, default: 60, enum: [30, 60, 90, 120] },

    pricingRules: {
      type: [PricingRuleSchema],
      validate: {
        validator: (rules) => rules.length > 0,
        message: "At least one pricing rule is required",
      },
    },

    images: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CourtSchema.index({ venue: 1, activity: 1 });

module.exports = mongoose.model("Court", CourtSchema);
