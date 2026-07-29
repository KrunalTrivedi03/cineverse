const mongoose = require("mongoose");

const OfferSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true }, // short eyebrow / badge text e.g. "Limited Time"
    description: { type: String, trim: true },

    image: String, // banner / promo image (cloudinary path)

    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      default: "percentage",
    },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscountAmount: { type: Number, default: null }, // cap for percentage offers
    minPurchaseAmount: { type: Number, default: 0 },

    code: { type: String, trim: true, uppercase: true }, // optional coupon code, auto-applied if blank

    termsAndConditions: [{ type: String }],

    validFrom: { type: Date, required: true },
    validTill: { type: Date, required: true },

    // Where the offer applies
    applicableTo: {
      type: String,
      enum: ["all", "movies", "events"],
      default: "all",
    },
    applicableMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
    applicableEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    applicableGenres: [{ type: String }], // optional extra targeting by genre/category

    isActive: { type: Boolean, default: true },

    // Homepage banner carousel controls
    showOnBanner: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    ctaText: { type: String, default: "Explore now" },
    ctaLink: { type: String, default: "/offers" },
    theme: { type: String, default: "coral" }, // used by frontend to pick a gradient palette
  },
  { timestamps: true }
);

OfferSchema.index({ isActive: 1, validFrom: 1, validTill: 1 });
OfferSchema.index({ title: "text", description: "text" });

// True if the offer is active AND within its validity window right now.
OfferSchema.methods.isLive = function () {
  const now = new Date();
  return this.isActive && this.validFrom <= now && this.validTill >= now;
};

module.exports = mongoose.model("Offer", OfferSchema);