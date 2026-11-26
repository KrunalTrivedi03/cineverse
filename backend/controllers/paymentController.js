const createOrderOnce = require("../services/createOrderOnce");
const settlePayment = require("../services/settlePayment");
const { validSignature, requireSignedWebhook } = require("../utils/razorpaySignatures");
// controllers/paymentController.js  — with ticket email on confirmation
const Razorpay    = require("razorpay");
const Booking     = require("../models/Booking");
const Show        = require("../models/Show");
const Theatre     = require("../models/Theatre");
const SeatLock    = require("../models/SeatLock");
const QuickPay    = require("../models/QuickPay");
const Transaction = require("../models/Transaction");
const User        = require("../models/User");
const sendTicketEmail = require("../utils/sendTicketEmail"); // ← NEW
const { resolveOfferDiscount } = require("../utils/resolveOfferDiscount");

const CATEGORY_PRICE_ADD = { Recliner: 200, Premium: 100, Classic: 0 };

const getRazorpay = () => new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ── Shared helper: calculate seats + pricing ─────────── */
const calcPricing = async (showId, slotId, seatIds) => {
  const show    = await Show.findById(showId).populate("movie");
  if (!show) throw { status: 404, message: "Show not found" };

  const slot = show.showTimes?.find((t) => t._id.toString() === slotId);
  if (!slot)  throw { status: 404, message: "Slot not found" };

  const theatre   = await Theatre.findById(show.theatre);
  const screenDoc = theatre?.screens.find((s) => s.name === show.screen);
  const rowMap    = {};
  (screenDoc?.seatLayout || []).forEach((r) => { rowMap[r.row] = r; });

  const seatDocs = seatIds.map((seatId) => {
    const row      = seatId.replace(/\d+/g, "");
    const col      = parseInt(seatId.replace(/\D+/g, ""), 10);
    const category = rowMap[row]?.category || "Classic";
    const priceAdd = CATEGORY_PRICE_ADD[category] || 0;
    return { seatId, row, col, category, price: slot.price + priceAdd };
  });

  const totalAmount    = seatDocs.reduce((s, d) => s + d.price, 0);
  const convenienceFee = Math.round(totalAmount * 0.02);
  const grandTotal     = totalAmount + convenienceFee;

  return { show, slot, theatre, seatDocs, totalAmount, convenienceFee, grandTotal };
};

/* ── Shared helper: validate seat locks ───────────────── */
const validateLocks = async (showId, slotId, seatIds, userId) => {
  const now   = new Date();
  const locks = await SeatLock.find({
    showId, slotId,
    seatId:    { $in: seatIds },
    userId,
    expiresAt: { $gt: now },
  });

  if (locks.length !== seatIds.length) {
    const lockedIds    = new Set(locks.map((l) => l.seatId));
    const expiredSeats = seatIds.filter((id) => !lockedIds.has(id));
    throw {
      status: 409,
      message: "Some seat locks have expired. Please re-select your seats.",
      expiredSeats,
    };
  }
};

/* ── Shared helper: send ticket email safely ──────────── */
const dispatchTicketEmail = async (booking, userId, movieTitle, theatreName) => {
  try {
    const user = await User.findById(userId).select("email username");
    if (!user?.email) return;
    await sendTicketEmail({
      toEmail:    user.email,
      toName:     user.username || "Movie Lover",
      booking,
      movieTitle,
      theatreName,
    });
  } catch (err) {
    // Email failure must never break the booking response
    console.error("sendTicketEmail failed (non-fatal):", err.message);
  }
};

/* ─────────────────────────────────────────────────────────
   1. POST /api/payment/create-order  (Razorpay)
───────────────────────────────────────────────────────── */
exports.createOrder = async (req, res) => {
  try {
    const { showId, slotId, seatIds, offerId, language } = req.body;
    const userId = req.user.id.toString();

    if (!showId || !slotId || !seatIds?.length)
      return res.status(400).json({ message: "showId, slotId and seatIds are required" });

    await validateLocks(showId, slotId, seatIds, userId);

    const { show, slot, theatre, seatDocs, totalAmount } = await calcPricing(showId, slotId, seatIds);

    const { appliedOffer, discountAmount } = await resolveOfferDiscount(
      offerId,
      { type: "movies", id: show.movie?._id, genre: show.movie?.genre },
      totalAmount
    );
    const discountedSubtotal = totalAmount - discountAmount;
    const convenienceFee     = Math.round(discountedSubtotal * 0.02);
    const grandTotal         = discountedSubtotal + convenienceFee;

    const qp = await QuickPay.findOne({ user: userId });
    const walletBalance  = qp?.walletBalance  || 0;
    const walletEligible = walletBalance >= grandTotal;

    const create = async () => {
      const razorpayOrder = await getRazorpay().orders.create({
        amount:   grandTotal * 100,
        currency: "INR",
        receipt:  `rcpt_${Date.now()}`,
        notes:    { showId, slotId, userId, seats: seatIds.join(",") },
      });

      const booking = await Booking.create({
        user:    userId,
        show:    showId,
        slotId,
        theatre: show.theatre,
        screen:  show.screen,
        showDate: show.showDate,
        showTime: slot.time,
        seats:   seatDocs,
        totalAmount,
        convenienceFee,
        grandTotal,
        appliedOffer,
        paymentId: razorpayOrder.id,
        status:  "pending",
        movieTitle:  show.movie?.title  || "",
        moviePoster: show.movie?.poster || null,
        language:    language || show.language || show.movie?.language || "",
      });

      return {
        orderId:        razorpayOrder.id,
        amount:         razorpayOrder.amount,
        currency:       razorpayOrder.currency,
        keyId:          process.env.RAZORPAY_KEY_ID,
        bookingId:      booking._id,
        bookingRef:     booking.bookingRef,
        grandTotal,
        convenienceFee,
        totalAmount,
        discountAmount,
        appliedOffer,
        seats:          seatDocs,
        movie:          show.movie?.title,
        showDate:       show.showDate,
        showTime:       slot.time,
        theatre:        theatre?.name,
        screen:         show.screen,
        wallet: {
          balance:  walletBalance,
          eligible: walletEligible,
        },
      };
    };
    const result = req.user.mobileSessionId ? await createOrderOnce(["movies", userId, showId, slotId, [...seatIds].sort()], create) : await create();
    return res.json(result);
  } catch (e) {
    console.error("createOrder error:", e.message);
    res.status(e.status || 500).json({ message: e.message, expiredSeats: e.expiredSeats });
  }
};

/* ─────────────────────────────────────────────────────────
   2. POST /api/payment/wallet-pay
───────────────────────────────────────────────────────── */
exports.walletPay = async (req, res) => {
  try {
    const { showId, slotId, seatIds, offerId, language } = req.body;
    const userId = req.user.id.toString();

    if (!showId || !slotId || !seatIds?.length)
      return res.status(400).json({ message: "showId, slotId and seatIds are required" });

    await validateLocks(showId, slotId, seatIds, userId);

    const { show, slot, theatre, seatDocs, totalAmount } = await calcPricing(showId, slotId, seatIds);

    const { appliedOffer, discountAmount } = await resolveOfferDiscount(
      offerId,
      { type: "movies", id: show.movie?._id, genre: show.movie?.genre },
      totalAmount
    );
    const discountedSubtotal = totalAmount - discountAmount;
    const convenienceFee     = Math.round(discountedSubtotal * 0.02);
    const grandTotal         = discountedSubtotal + convenienceFee;

    const qp = await QuickPay.findOne({ user: userId });
    if (!qp || qp.walletBalance < grandTotal) {
      return res.status(400).json({
        message:       "Insufficient wallet balance",
        walletBalance: qp?.walletBalance || 0,
        required:      grandTotal,
      });
    }

    qp.walletBalance = parseFloat((qp.walletBalance - grandTotal).toFixed(2));
    await qp.save();

    const booking = await Booking.create({
      user:    userId,
      show:    showId,
      slotId,
      theatre: show.theatre,
      screen:  show.screen,
      showDate: show.showDate,
      showTime: slot.time,
      seats:   seatDocs,
      totalAmount,
      convenienceFee,
      grandTotal,
      appliedOffer,
      paymentId: `wallet_${Date.now()}`,
      paymentMethod: "wallet",
      status:  "confirmed",
      movieTitle:  show.movie?.title  || "",
      moviePoster: show.movie?.poster || null,
      language:    language || show.language || show.movie?.language || "",
    });

    await SeatLock.deleteMany({ showId, slotId, userId });

    await Transaction.create({
      user:        userId,
      type:        "debit",
      amount:      grandTotal,
      description: `Ticket booking — ${show.movie?.title || "Movie"}`,
      source:      "wallet",
      bookingType: "movie",
      booking:     booking._id,
      status:      "success",
    });

    const populated = await Booking.findById(booking._id)
      .populate("show",    "showDate screen")
      .populate("theatre", "name address");

    // ── Send ticket email (non-blocking) ──────────────────
    dispatchTicketEmail(
      populated,
      userId,
      show.movie?.title  || "Movie",
      theatre?.name      || "Theatre",
    );

    res.json({
      message:       "Booking confirmed via wallet!",
      bookingRef:    booking.bookingRef,
      booking:       populated,
      walletBalance: qp.walletBalance,
      discountAmount,
      appliedOffer,
    });
  } catch (e) {
    console.error("walletPay error:", e.message);
    res.status(e.status || 500).json({ message: e.message, expiredSeats: e.expiredSeats });
  }
};

/* ─────────────────────────────────────────────────────────
   3. POST /api/payment/verify  (Razorpay callback)
───────────────────────────────────────────────────────── */
async function confirmCapturedPayment(filter, paymentId) {
  const booking = await settlePayment({
    model: Booking, filter, fields: { paymentId, paymentMethod: "razorpay" }, payment: paymentId,
    ledger: (booking) => ({ amount: booking.grandTotal, description: "Movie ticket (Razorpay)", bookingType: "movie", booking: booking._id }),
    async fulfill(booking, session) {
      await SeatLock.deleteMany({ showId: booking.show.toString(), slotId: booking.slotId, userId: booking.user }, { session });
    },
  });
  if (!booking) return null;
  const populated = await Booking.findById(booking._id).populate({ path: "show", populate: { path: "movie", select: "title" } }).populate("theatre", "name address");
  dispatchTicketEmail(populated, booking.user, populated.show?.movie?.title || "Movie", populated.theatre?.name || "Theatre");
  return populated;
}

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = req.body;

    const userId = req.user.id.toString();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId)
      return res.status(400).json({ message: "Missing required payment fields" });

    if (!validSignature(process.env.RAZORPAY_KEY_SECRET, `${razorpay_order_id}|${razorpay_payment_id}`, razorpay_signature))
      return res.status(400).json({ message: "Payment verification failed" });

    const booking = await Booking.findOne({ _id: bookingId, user: userId, $or: [{ paymentId: razorpay_order_id, status: "pending" }, { paymentId: razorpay_payment_id, status: "confirmed" }] });
    if (!booking) return res.status(404).json({ message: "Matching booking not found" });

    if (booking.status === "confirmed") {
      return res.json({ message: "Booking already confirmed", bookingRef: booking.bookingRef, booking });
    }

    const gatewayPayment = await getRazorpay().payments.fetch(razorpay_payment_id);
    if (gatewayPayment.order_id !== razorpay_order_id || gatewayPayment.currency !== "INR" ||
        gatewayPayment.amount !== Math.round(booking.grandTotal * 100)) {
      return res.status(409).json({ message: "Payment details do not match the booking" });
    }
    if (gatewayPayment.status !== "captured") {
      return res.status(409).json({ message: "Payment is awaiting capture. Check the payment status again shortly." });
    }

    const confirmed = await confirmCapturedPayment({ _id: booking._id, user: userId, paymentId: razorpay_order_id }, razorpay_payment_id)
      || await Booking.findOne({ _id: booking._id, user: userId, status: "confirmed", paymentId: razorpay_payment_id });
    if (!confirmed) return res.status(409).json({ message: "Booking status changed. Check your booking history." });
    return res.json({ message: "Payment verified", bookingRef: confirmed.bookingRef, booking: confirmed });
  } catch (e) {
    console.error("verifyPayment error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

/* ─────────────────────────────────────────────────────────
   4. POST /api/payment/webhook  (Razorpay webhook)
───────────────────────────────────────────────────────── */
exports.handleWebhook = async (req, res) => {
  try {
    if (!requireSignedWebhook(req, res)) return;
    if (req.body.event === "payment.captured") {
      const payment = req.body.payload?.payment?.entity;
      if (!payment?.id || !payment.order_id || payment.currency !== "INR" || !Number.isInteger(payment.amount)) {
        return res.status(400).json({ message: "Invalid payment details" });
      }
      await confirmCapturedPayment({ paymentId: payment.order_id, "grandTotal": payment.amount / 100 }, payment.id);
    }
    return res.json({ received: true });
  } catch (error) {
    console.error("Payment webhook failed:", error.message);
    return res.status(500).json({ message: "Could not process payment webhook" });
  }
};

/* ─────────────────────────────────────────────────────────
   5. GET /api/payment/details/:paymentId
───────────────────────────────────────────────────────── */
exports.getPaymentDetails = async (req, res) => {
  try {
    const payment = await getRazorpay().payments.fetch(req.params.paymentId);
    res.json(payment);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ─────────────────────────────────────────────────────────
   6. POST /api/payment/refund
───────────────────────────────────────────────────────── */
exports.refundPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.id.toString();

    const booking = await Booking.findById(bookingId);
    if (!booking)                            return res.status(404).json({ message: "Booking not found" });
    if (booking.user.toString() !== userId)  return res.status(403).json({ message: "Unauthorized" });
    if (booking.status !== "confirmed")      return res.status(400).json({ message: "Only confirmed bookings can be refunded" });

    if (booking.paymentMethod === "wallet") {
      const qp = await QuickPay.findOneAndUpdate(
        { user: userId },
        { $inc: { walletBalance: booking.grandTotal } },
        { new: true, upsert: true }
      );

      booking.status = "cancelled";
      await booking.save();

      await Transaction.create({
        user:        userId,
        type:        "credit",
        amount:      booking.grandTotal,
        description: `Refund — ${booking.bookingRef}`,
        source:      "refund",
        bookingType: "movie",
        booking:     booking._id,
        status:      "success",
      });

      return res.json({
        message:       "Booking cancelled. Refund added to your wallet.",
        walletBalance: qp.walletBalance,
        bookingRef:    booking.bookingRef,
      });
    }

    if (!booking.paymentId || booking.paymentId.startsWith("order_")) {
      booking.status = "cancelled";
      await booking.save();
      return res.json({ message: "Booking cancelled" });
    }

    const refund = await getRazorpay().payments.refund(booking.paymentId, {
      amount: booking.grandTotal * 100,
      notes:  { bookingRef: booking.bookingRef, reason: "User cancelled" },
    });

    booking.status    = "cancelled";
    booking.paymentId = `refunded_${refund.id}`;
    await booking.save();

    await Transaction.create({
      user:        userId,
      type:        "credit",
      amount:      booking.grandTotal,
      description: `Razorpay refund — ${booking.bookingRef}`,
      source:      "refund",
      bookingType: "movie",
      booking:     booking._id,
      gatewayRef:  refund.id,
      status:      "success",
    });

    res.json({
      message:    "Refund initiated successfully",
      refundId:   refund.id,
      amount:     refund.amount / 100,
      status:     refund.status,
      bookingRef: booking.bookingRef,
    });
  } catch (e) {
    console.error("refundPayment error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

exports.resendConfirmation = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.id.toString();
 
    if (!bookingId)
      return res.status(400).json({ message: "bookingId is required" });
 
    const booking = await Booking.findById(bookingId)
      .populate({ path: "show", populate: { path: "movie", select: "title" } })
      .populate("theatre", "name");
 
    if (!booking)
      return res.status(404).json({ message: "Booking not found" });
 
    if (booking.user.toString() !== userId)
      return res.status(403).json({ message: "Unauthorized" });
 
    if (booking.status !== "confirmed")
      return res.status(400).json({ message: "Only confirmed bookings can be resent" });
 
    const user = await User.findById(userId).select("email username");
    if (!user?.email)
      return res.status(400).json({ message: "No email address on file" });
 
    await sendTicketEmail({
      toEmail:    user.email,
      toName:     user.username || "Movie Lover",
      booking,
      movieTitle:  booking.show?.movie?.title || "Movie",
      theatreName: booking.theatre?.name      || "Theatre",
    });
 
    res.json({ message: "Confirmation email resent successfully" });
  } catch (e) {
    console.error("resendConfirmation error:", e.message);
    res.status(500).json({ message: e.message });
  }
};