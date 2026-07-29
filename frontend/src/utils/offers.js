import api from "../api/axiosInstance";

export const IMG = (path) =>
  !path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;

/** All currently-live offers. Optionally narrow to "movies" | "events". */
export async function fetchActiveOffers(applicableTo) {
  const res = await api.get("/offers", { params: applicableTo ? { applicableTo } : {} });
  return res.data || [];
}

/** Offers configured to show on the homepage banner carousel. */
export async function fetchBannerOffers() {
  const res = await api.get("/offers/banners");
  return res.data || [];
}

/**
 * Offers applicable to a specific movie/event, with computed discount if a price is passed.
 * type: "movies" | "events"
 */
export async function fetchApplicableOffers({ type, id, genre, price } = {}) {
  const res = await api.get("/offers/applicable", { params: { type, id, genre, price } });
  return res.data || { offers: [], bestOffer: null };
}

/** Client-side discount calculation, mirrors the backend logic for instant UI feedback. */
export function computeDiscount(offer, price = 0) {
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
  return {
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalPrice: Math.round((price - discountAmount) * 100) / 100,
  };
}

/** Human-readable label, e.g. "20% OFF" or "₹100 OFF". */
export function formatDiscountLabel(offer) {
  if (!offer) return "";
  return offer.discountType === "percentage" ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`;
}

export function formatValidity(offer) {
  if (!offer?.validTill) return "";
  const till = new Date(offer.validTill);
  return `Valid till ${till.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
}

const THEMES = {
  coral: "linear-gradient(135deg, #f0545c 0%, #ff8a65 55%, #ffb199 100%)",
  dark: "linear-gradient(135deg, #14141a 0%, #2b2b35 55%, #43434f 100%)",
  purple: "linear-gradient(135deg, #7c3aed 0%, #a855f7 55%, #c99bff 100%)",
  green: "linear-gradient(135deg, #059669 0%, #10b981 55%, #6ee7b7 100%)",
  blue: "linear-gradient(135deg, #2563eb 0%, #3b82f6 55%, #93c5fd 100%)",
};

export function themeGradient(theme) {
  return THEMES[theme] || THEMES.coral;
}