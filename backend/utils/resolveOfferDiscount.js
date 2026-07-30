const Offer = require("../models/Offer");
const { computeDiscount, offerAppliesTo } = require("../controllers/offerController");

/**
 * Validates an offer server-side (source of truth — never trust the client's
 * discount math) and returns the amount to knock off a booking subtotal.
 *
 * @param {string} offerId
 * @param {{ type: "movies"|"events", id: string, genre?: string }} target
 * @param {number} subtotal - pre-discount ticket subtotal
 * @throws {{ status:number, message:string }} on any invalid/expired/inapplicable offer
 */
async function resolveOfferDiscount(offerId, target, subtotal) {
  if (!offerId) return { appliedOffer: null, discountAmount: 0 };

  const offer = await Offer.findById(offerId);
  if (!offer || !offer.isLive()) {
    throw { status: 400, message: "This offer is no longer available" };
  }
  if (!offerAppliesTo(offer, target)) {
    throw { status: 400, message: "This offer isn't applicable to your booking" };
  }
  if (subtotal < (offer.minPurchaseAmount || 0)) {
    throw { status: 400, message: `Minimum purchase of ₹${offer.minPurchaseAmount} required for this offer` };
  }

  const { discountAmount } = computeDiscount(offer, subtotal);
  if (discountAmount <= 0) {
    throw { status: 400, message: "This offer doesn't apply to your order" };
  }

  return {
    discountAmount,
    appliedOffer: {
      offer: offer._id,
      code: offer.code || "",
      title: offer.title,
      discountAmount,
    },
  };
}

module.exports = { resolveOfferDiscount };