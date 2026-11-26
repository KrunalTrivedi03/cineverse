const createOrderOnce = require("../services/createOrderOnce");
const settlePayment = require("../services/settlePayment");
const { validSignature, requireSignedWebhook } = require("../utils/razorpaySignatures");
// controllers/playPaymentController.js — mirrors eventPaymentController.js for the Play module
const Razorpay = require("razorpay");
const PlayBooking = require("../models/PlayBooking");
const PlaySlot = require("../models/PlaySlot");
const PlaySlotLock = require("../models/PlaySlotLock");
const Court = require("../models/Court");
const PlayVenue = require("../models/PlayVenue");
const Transaction = require("../models/Transaction");

const HOLD_MINUTES = 15; // payment window for a pending booking, same as events

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* Confirms the caller currently holds a valid lock on every slot they're
   trying to pay for — same check as validateLocks() in eventPaymentController. */
const validateLocks = async (slotIds, userId) => {
  const now = new Date();
  const locks = await PlaySlotLock.find({ slot: { $in: slotIds }, userId, expiresAt: { $gt: now } });
  if (locks.length !== slotIds.length) {
    const lockedIds = new Set(locks.map((l) => l.slot.toString()));
    const expiredSlots = slotIds.filter((id) => !lockedIds.has(id));
    throw { status: 409, message: "Some slot locks have expired. Please re-select your slots.", expiredSlots };
  }
};

const calcPricing = async (slotIds) => {
  const slots = await PlaySlot.find({ _id: { $in: slotIds } }).sort({ startMin: 1 });
  if (slots.length !== slotIds.length) throw { status: 404, message: "One or more slots not found" };
  if (slots.some((s) => s.status === "booked")) throw { status: 409, message: "One or more slots are already booked" };

  const courtId = slots[0].court.toString();
  if (slots.some((s) => s.court.toString() !== courtId)) {
    throw { status: 400, message: "All slots must belong to the same court" };
  }

  const court = await Court.findById(courtId).populate("activity", "name");
  if (!court) throw { status: 404, message: "Court not found" };
  const venue = await PlayVenue.findById(court.venue);
  if (!venue) throw { status: 404, message: "Venue not found" };

  const subtotal = slots.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = Math.round(subtotal * 0.02);
  const total = subtotal + convenienceFee;

  return { slots, court, venue, subtotal, convenienceFee, total };
};

/* ─────────────────────────────────────────────────────────
   1. POST /api/play-payment/create-order
───────────────────────────────────────────────────────── */
exports.createOrder = async (req, res) => {
  try {
    const { slotIds } = req.body;
    const userId = req.user.id.toString();

    if (!slotIds?.length) return res.status(400).json({ message: "slotIds are required" });

    await validateLocks(slotIds, userId);
    const { slots, court, venue, subtotal, convenienceFee, total } = await calcPricing(slotIds);

    const create = async () => {
      const razorpayOrder = await getRazorpay().orders.create({
        amount: total * 100,
        currency: "INR",
        receipt: `play_rcpt_${Date.now()}`,
        notes: { courtId: court._id.toString(), userId },
      });

      const booking = await PlayBooking.create({
        user: userId,
        venue: venue._id,
        court: court._id,
        activity: court.activity._id,
        date: slots[0].date,
        slots: slotIds,
        venueName: venue.name,
        courtName: court.name,
        activityName: court.activity.name,
        pricing: { subtotal, convenienceFee, total },
        status: "pending",
        holdExpiresAt: new Date(Date.now() + HOLD_MINUTES * 60 * 1000),
        razorpayOrderId: razorpayOrder.id,
      });

      return {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        bookingId: booking._id,
        bookingRef: booking.bookingRef,
        subtotal, convenienceFee, total,
        venue: venue.name,
        court: court.name,
        activity: court.activity.name,
        date: slots[0].date,
        slots: slots.map((s) => ({ startTime: s.startTime, endTime: s.endTime, price: s.price })),
      };
    };
    const result = req.user.mobileSessionId ? await createOrderOnce(["play", userId, [...slotIds].sort()], create) : await create();
    return res.json(result);
  } catch (e) {
    console.error("Play createOrder error:", e.message);
    res.status(e.status || 500).json({ message: e.message, expiredSlots: e.expiredSlots });
  }
};

/* ─────────────────────────────────────────────────────────
   2. POST /api/play-payment/verify
───────────────────────────────────────────────────────── */
async function confirmCapturedPayment(filter, paymentId) {
  const booking = await settlePayment({
    model: PlayBooking, filter, fields: { razorpayPaymentId: paymentId, holdExpiresAt: null }, payment: paymentId,
    ledger: (booking) => ({ amount: booking.pricing.total, description: "Play booking (Razorpay)", bookingType: "play", playBooking: booking._id }),
    async fulfill(booking, session) {
      const inventory = await PlaySlot.updateMany(
        { _id: { $in: booking.slots }, status: "available" },
        { $set: { status: "booked", booking: booking._id } },
        { session }
      );
      if (inventory.modifiedCount !== booking.slots.length) throw new Error("A paid Play slot is no longer available");
      await PlaySlotLock.deleteMany({ slot: { $in: booking.slots }, userId: booking.user }, { session });
    },
  });
  if (!booking) return null;
  return booking.populate("slots");
}

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
    const userId = req.user.id.toString();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return res.status(400).json({ message: "Missing required payment fields" });
    }

    if (!validSignature(process.env.RAZORPAY_KEY_SECRET, `${razorpay_order_id}|${razorpay_payment_id}`, razorpay_signature))
      return res.status(400).json({ message: "Payment verification failed" });

    const booking = await PlayBooking.findOne({ _id: bookingId, user: userId, $or: [{ razorpayOrderId: razorpay_order_id, status: "pending" }, { razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id, status: "confirmed" }] });
    if (!booking) return res.status(404).json({ message: "Matching booking not found" });

    if (booking.status === "confirmed") {
      return res.json({ message: "Booking already confirmed", bookingRef: booking.bookingRef, booking: await booking.populate("slots") });
    }

    const gatewayPayment = await getRazorpay().payments.fetch(razorpay_payment_id);
    if (gatewayPayment.order_id !== razorpay_order_id || gatewayPayment.currency !== "INR" ||
        gatewayPayment.amount !== Math.round(booking.pricing.total * 100)) {
      return res.status(409).json({ message: "Payment details do not match the booking" });
    }
    if (gatewayPayment.status !== "captured") {
      return res.status(409).json({ message: "Payment is awaiting capture. Check the payment status again shortly." });
    }

    const confirmed = await confirmCapturedPayment({ _id: booking._id, user: userId, razorpayOrderId: razorpay_order_id }, razorpay_payment_id)
      || await PlayBooking.findOne({ _id: booking._id, user: userId, status: "confirmed", razorpayPaymentId: razorpay_payment_id });
    if (!confirmed) return res.status(409).json({ message: "Booking status changed. Check your booking history." });
    return res.json({ message: "Payment verified", bookingRef: confirmed.bookingRef, booking: confirmed });
  } catch (e) {
    console.error("Play verifyPayment error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

/* ─────────────────────────────────────────────────────────
   3. POST /api/play-payment/webhook
───────────────────────────────────────────────────────── */
exports.handleWebhook = async (req, res) => {
  try {
    if (!requireSignedWebhook(req, res)) return;
    if (req.body.event === "payment.captured") {
      const payment = req.body.payload?.payment?.entity;
      if (!payment?.id || !payment.order_id || payment.currency !== "INR" || !Number.isInteger(payment.amount)) {
        return res.status(400).json({ message: "Invalid payment details" });
      }
      await confirmCapturedPayment({ razorpayOrderId: payment.order_id, "pricing.total": payment.amount / 100 }, payment.id);
    }
    return res.json({ received: true });
  } catch (error) {
    console.error("Payment webhook failed:", error.message);
    return res.status(500).json({ message: "Could not process payment webhook" });
  }
};

/* ─────────────────────────────────────────────────────────
   4. POST /api/play-payment/cancel — user-initiated cancellation
───────────────────────────────────────────────────────── */
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.id.toString();

    const booking = await PlayBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.user.toString() !== userId) return res.status(403).json({ message: "Unauthorized" });
    if (booking.status !== "confirmed") return res.status(400).json({ message: "Only confirmed bookings can be cancelled" });

    // Simple cutoff: no cancellation once the first slot has already started.
    const firstSlot = await PlaySlot.findById(booking.slots[0]);
    if (firstSlot) {
      const slotStart = new Date(booking.date);
      slotStart.setMinutes(slotStart.getMinutes() + firstSlot.startMin);
      if (slotStart <= new Date()) {
        return res.status(400).json({ message: "This booking has already started and can't be cancelled" });
      }
    }

    if (!booking.razorpayPaymentId) {
      booking.status = "cancelled";
      booking.cancelledAt = new Date();
      await booking.save();
      await PlaySlot.updateMany({ _id: { $in: booking.slots } }, { $set: { status: "available", booking: null } });
      return res.json({ message: "Booking cancelled" });
    }

    const refund = await getRazorpay().payments.refund(booking.razorpayPaymentId, {
      amount: booking.pricing.total * 100,
      notes: { bookingRef: booking.bookingRef, reason: "User cancelled" },
    });

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    await booking.save();
    await PlaySlot.updateMany({ _id: { $in: booking.slots } }, { $set: { status: "available", booking: null } });

    await Transaction.create({
      user: userId, type: "credit", amount: booking.pricing.total,
      description: `Refund — ${booking.bookingRef}`,
      source: "refund", bookingType: "play", playBooking: booking._id,
      gatewayRef: refund.id, status: "success",
    });

    res.json({ message: "Booking cancelled and refund initiated", refundId: refund.id, bookingRef: booking.bookingRef });
  } catch (e) {
    console.error("Play cancelBooking error:", e.message);
    res.status(500).json({ message: e.message });
  }
};
