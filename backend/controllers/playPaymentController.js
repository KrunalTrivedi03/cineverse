// controllers/playPaymentController.js — mirrors eventPaymentController.js for the Play module
const Razorpay = require("razorpay");
const crypto = require("crypto");
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

    res.json({
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
    });
  } catch (e) {
    console.error("Play createOrder error:", e.message);
    res.status(e.status || 500).json({ message: e.message, expiredSlots: e.expiredSlots });
  }
};

/* ─────────────────────────────────────────────────────────
   2. POST /api/play-payment/verify
───────────────────────────────────────────────────────── */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
    const userId = req.user.id.toString();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return res.status(400).json({ message: "Missing required payment fields" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      const failedBooking = await PlayBooking.findByIdAndUpdate(bookingId, { status: "cancelled", cancelledAt: new Date() });
      if (failedBooking) {
        await Transaction.create({
          user: userId, type: "debit", amount: failedBooking.pricing.total,
          description: `Play booking (Razorpay) — signature mismatch`,
          source: "card", bookingType: "play", playBooking: failedBooking._id,
          gatewayRef: razorpay_payment_id, status: "failed",
        });
      }
      return res.status(400).json({ message: "Payment verification failed. Signature mismatch." });
    }

    const booking = await PlayBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status === "confirmed") {
      return res.json({ message: "Booking already confirmed", bookingRef: booking.bookingRef, booking: await booking.populate("slots") });
    }

    booking.razorpayPaymentId = razorpay_payment_id;
    booking.status = "confirmed";
    booking.holdExpiresAt = null;
    await booking.save();

    await PlaySlot.updateMany(
      { _id: { $in: booking.slots } },
      { $set: { status: "booked", booking: booking._id } }
    );
    await PlaySlotLock.deleteMany({ slot: { $in: booking.slots }, userId });

    await Transaction.create({
      user: userId, type: "debit", amount: booking.pricing.total,
      description: `Play booking — ${booking.activityName} at ${booking.venueName}`,
      source: "card", bookingType: "play", playBooking: booking._id,
      gatewayRef: razorpay_payment_id, status: "success",
    });

    res.json({ message: "Payment successful! Booking confirmed.", bookingRef: booking.bookingRef, booking: await booking.populate("slots") });
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
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const receivedSig = req.headers["x-razorpay-signature"];

    if (webhookSecret && webhookSecret !== "skipping_for_now") {
      const expectedSig = crypto.createHmac("sha256", webhookSecret).update(JSON.stringify(req.body)).digest("hex");
      if (expectedSig !== receivedSig) return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const { event, payload } = req.body;

    if (event === "payment.captured") {
      const payment = payload?.payment?.entity;
      const orderId = payment?.order_id;
      if (orderId) {
        const booking = await PlayBooking.findOne({ razorpayOrderId: orderId, status: "pending" });
        if (booking) {
          booking.razorpayPaymentId = payment.id;
          booking.status = "confirmed";
          booking.holdExpiresAt = null;
          await booking.save();
          await PlaySlot.updateMany({ _id: { $in: booking.slots } }, { $set: { status: "booked", booking: booking._id } });
          await PlaySlotLock.deleteMany({ slot: { $in: booking.slots } });
        }
      }
    } else if (event === "payment.failed") {
      const payment = payload?.payment?.entity;
      const orderId = payment?.order_id;
      if (orderId) {
        const failedBooking = await PlayBooking.findOneAndUpdate(
          { razorpayOrderId: orderId, status: "pending" },
          { status: "cancelled", cancelledAt: new Date() }
        );
        if (failedBooking) {
          await Transaction.create({
            user: failedBooking.user, type: "debit", amount: failedBooking.pricing.total,
            description: `Play booking (Razorpay) — payment failed`,
            source: "card", bookingType: "play", playBooking: failedBooking._id,
            gatewayRef: payment?.id || "", status: "failed",
          });
        }
      }
    } else {
      console.log(`Unhandled Play webhook event: ${event}`);
    }

    res.status(200).json({ received: true });
  } catch (e) {
    console.error("Play handleWebhook error:", e.message);
    res.status(200).json({ received: true });
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