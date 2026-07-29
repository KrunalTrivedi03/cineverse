const Offer = require("../models/Offer");

/* ── helpers ─────────────────────────────────────────────── */

const liveFilter = () => {
  const now = new Date();
  return { isActive: true, validFrom: { $lte: now }, validTill: { $gte: now } };
};

// Given an offer + a price, return { discountAmount, finalPrice }
function computeDiscount(offer, price = 0) {
  if (!offer || typeof price !== "number") return { discountAmount: 0, finalPrice: price };
  if (price < (offer.minPurchaseAmount || 0)) return { discountAmount: 0, finalPrice: price };

  let discountAmount = 0;
  if (offer.discountType === "percentage") {
    discountAmount = (price * offer.discountValue) / 100;
    if (offer.maxDiscountAmount) discountAmount = Math.min(discountAmount, offer.maxDiscountAmount);
  } else {
    discountAmount = offer.discountValue;
  }
  discountAmount = Math.min(discountAmount, price);
  return { discountAmount: Math.round(discountAmount * 100) / 100, finalPrice: Math.round((price - discountAmount) * 100) / 100 };
}

// Does this offer apply to the given item (movie/event) by id / genre?
function offerAppliesTo(offer, { type, id, genre } = {}) {
  if (offer.applicableTo === "all") {
    if (offer.applicableGenres?.length && genre) {
      return offer.applicableGenres.some((g) => g.toLowerCase() === String(genre).toLowerCase());
    }
    return true;
  }
  if (!type) return false;
  if (offer.applicableTo !== type) return false;

  const list = type === "movies" ? offer.applicableMovies : offer.applicableEvents;
  const scopedToSpecificItems = list && list.length > 0;
  const genreMatches =
    offer.applicableGenres?.length && genre
      ? offer.applicableGenres.some((g) => g.toLowerCase() === String(genre).toLowerCase())
      : false;

  if (scopedToSpecificItems) {
    const matchesId = id ? list.some((itemId) => String(itemId) === String(id)) : false;
    return matchesId || genreMatches;
  }
  // No specific items configured → applies to the whole category (optionally narrowed by genre)
  if (offer.applicableGenres?.length) return genreMatches;
  return true;
}

/* ── admin CRUD ──────────────────────────────────────────── */

exports.createOffer = async (req, res) => {
  try {
    const body = req.body;
    const offerData = {
      title: body.title,
      subtitle: body.subtitle,
      description: body.description,
      discountType: body.discountType || "percentage",
      discountValue: Number(body.discountValue),
      maxDiscountAmount: body.maxDiscountAmount ? Number(body.maxDiscountAmount) : null,
      minPurchaseAmount: body.minPurchaseAmount ? Number(body.minPurchaseAmount) : 0,
      code: body.code || undefined,
      termsAndConditions: body.termsAndConditions ? JSON.parse(body.termsAndConditions) : [],
      validFrom: body.validFrom,
      validTill: body.validTill,
      applicableTo: body.applicableTo || "all",
      applicableMovies: body.applicableMovies ? JSON.parse(body.applicableMovies) : [],
      applicableEvents: body.applicableEvents ? JSON.parse(body.applicableEvents) : [],
      applicableGenres: body.applicableGenres ? JSON.parse(body.applicableGenres) : [],
      isActive: body.isActive === undefined ? true : body.isActive === "true" || body.isActive === true,
      showOnBanner: body.showOnBanner === "true" || body.showOnBanner === true,
      displayOrder: body.displayOrder ? Number(body.displayOrder) : 0,
      ctaText: body.ctaText || "Explore now",
      ctaLink: body.ctaLink || "/offers",
      theme: body.theme || "coral",
    };

    if (req.file) offerData.image = req.file.path;

    const offer = await Offer.create(offerData);
    res.status(201).json({ message: "Offer created successfully", offer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: "Offer not found" });

    const body = req.body;
    const set = (field, val, parse) => {
      if (val === undefined) return;
      offer[field] = parse ? parse(val) : val;
    };

    set("title", body.title);
    set("subtitle", body.subtitle);
    set("description", body.description);
    set("discountType", body.discountType);
    set("discountValue", body.discountValue, Number);
    set("maxDiscountAmount", body.maxDiscountAmount, Number);
    set("minPurchaseAmount", body.minPurchaseAmount, Number);
    set("code", body.code);
    set("termsAndConditions", body.termsAndConditions, JSON.parse);
    set("validFrom", body.validFrom);
    set("validTill", body.validTill);
    set("applicableTo", body.applicableTo);
    set("applicableMovies", body.applicableMovies, JSON.parse);
    set("applicableEvents", body.applicableEvents, JSON.parse);
    set("applicableGenres", body.applicableGenres, JSON.parse);
    if (body.isActive !== undefined) offer.isActive = body.isActive === "true" || body.isActive === true;
    if (body.showOnBanner !== undefined) offer.showOnBanner = body.showOnBanner === "true" || body.showOnBanner === true;
    set("displayOrder", body.displayOrder, Number);
    set("ctaText", body.ctaText);
    set("ctaLink", body.ctaLink);
    set("theme", body.theme);

    if (req.file) offer.image = req.file.path;

    await offer.save();
    res.json({ message: "Offer updated successfully", offer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    res.json({ message: "Offer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllOffersAdmin = async (req, res) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOfferByIdAdmin = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── public reads ────────────────────────────────────────── */

// GET /api/offers  — all currently-live offers, optionally filtered by ?applicableTo=movies|events
exports.getActiveOffers = async (req, res) => {
  try {
    const { applicableTo } = req.query;
    const filter = liveFilter();
    if (applicableTo) filter.applicableTo = { $in: [applicableTo, "all"] };

    const offers = await Offer.find(filter).sort({ displayOrder: 1, createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/offers/banners — live offers flagged for the homepage banner carousel
exports.getBannerOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ ...liveFilter(), showOnBanner: true }).sort({
      displayOrder: 1,
      createdAt: -1,
    });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/offers/applicable?type=movies|events&id=<itemId>&genre=<genre>&price=<price>
exports.getApplicableOffers = async (req, res) => {
  try {
    const { type, id, genre, price } = req.query;
    const offers = await Offer.find(liveFilter()).sort({ displayOrder: 1 });

    const matching = offers.filter((offer) => offerAppliesTo(offer, { type, id, genre }));

    const numericPrice = price !== undefined ? Number(price) : undefined;
    const withDiscounts = matching.map((offer) => {
      const obj = offer.toObject();
      if (numericPrice !== undefined && !Number.isNaN(numericPrice)) {
        obj.computed = computeDiscount(offer, numericPrice);
      }
      return obj;
    });

    // Best offer = the one that saves the most money (if price given), else the first by displayOrder
    let best = null;
    if (numericPrice !== undefined && withDiscounts.length) {
      best = withDiscounts.reduce((a, b) =>
        (b.computed?.discountAmount || 0) > (a.computed?.discountAmount || 0) ? b : a
      );
    } else if (withDiscounts.length) {
      best = withDiscounts[0];
    }

    res.json({ offers: withDiscounts, bestOffer: best });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer || !offer.isLive()) return res.status(404).json({ message: "Offer not found" });
    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.computeDiscount = computeDiscount;
exports.offerAppliesTo = offerAppliesTo;