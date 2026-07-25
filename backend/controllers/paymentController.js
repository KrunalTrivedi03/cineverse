// controllers/paymentController.js  — with ticket email on confirmation
const Razorpay    = require("razorpay");
const crypto      = require("crypto");
const Booking     = require("../models/Booking");
const Show        = require("../models/Show");
const Theatre     = require("../models/Theatre");
const SeatLock    = require("../models/SeatLock");
const QuickPay    = require("../models/QuickPay");
const Transaction = require("../models/Transaction");
const User        = require("../models/User");
const sendTicketEmail = require("../utils/sendTicketEmail"); // ← NEW

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
    const { showId, slotId, seatIds } = req.body;
    const userId = req.user.id.toString();

    if (!showId || !slotId || !seatIds?.length)
      return res.status(400).json({ message: "showId, slotId and seatIds are required" });

    await validateLocks(showId, slotId, seatIds, userId);

    const { show, slot, theatre, seatDocs, totalAmount, convenienceFee, grandTotal } =
      await calcPricing(showId, slotId, seatIds);

    const qp = await QuickPay.findOne({ user: userId });
    const walletBalance  = qp?.walletBalance  || 0;
    const walletEligible = walletBalance >= grandTotal;

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
      paymentId: razorpayOrder.id,
      status:  "pending",
      movieTitle:  show.movie?.title  || "",
      moviePoster: show.movie?.poster || null,
    });

    res.json({
      orderId:        razorpayOrder.id,
      amount:         razorpayOrder.amount,
      currency:       razorpayOrder.currency,
      keyId:          process.env.RAZORPAY_KEY_ID,
      bookingId:      booking._id,
      bookingRef:     booking.bookingRef,
      grandTotal,
      convenienceFee,
      totalAmount,
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
    });
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
    const { showId, slotId, seatIds } = req.body;
    const userId = req.user.id.toString();

    if (!showId || !slotId || !seatIds?.length)
      return res.status(400).json({ message: "showId, slotId and seatIds are required" });

    await validateLocks(showId, slotId, seatIds, userId);

    const { show, slot, theatre, seatDocs, totalAmount, convenienceFee, grandTotal } =
      await calcPricing(showId, slotId, seatIds);

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
      paymentId: `wallet_${Date.now()}`,
      paymentMethod: "wallet",
      status:  "confirmed",
      movieTitle:  show.movie?.title  || "",
      moviePoster: show.movie?.poster || null,
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
    });
  } catch (e) {
    console.error("walletPay error:", e.message);
    res.status(e.status || 500).json({ message: e.message, expiredSeats: e.expiredSeats });
  }
};

/* ─────────────────────────────────────────────────────────
   3. POST /api/payment/verify  (Razorpay callback)
───────────────────────────────────────────────────────── */
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

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      const failedBooking = await Booking.findByIdAndUpdate(bookingId, { status: "cancelled" });
      if (failedBooking) {
        await Transaction.create({
          user:        userId,
          type:        "debit",
          amount:      failedBooking.grandTotal,
          description: `Ticket booking (Razorpay) — signature mismatch`,
          source:      "card",
          bookingType: "movie",
          booking:     failedBooking._id,
          gatewayRef:  razorpay_payment_id,
          status:      "failed",
        });
      }
      return res.status(400).json({ message: "Payment verification failed. Signature mismatch." });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status === "confirmed") {
      return res.json({ message: "Booking already confirmed", bookingRef: booking.bookingRef, booking });
    }

    booking.paymentId     = razorpay_payment_id;
    booking.paymentMethod = "razorpay";
    booking.status        = "confirmed";
    await booking.save();

    await SeatLock.deleteMany({ showId: booking.show.toString(), slotId: booking.slotId, userId });

    await Transaction.create({
      user:        userId,
      type:        "debit",
      amount:      booking.grandTotal,
      description: `Ticket booking (Razorpay)`,
      source:      "card",
      bookingType: "movie",
      booking:     booking._id,
      gatewayRef:  razorpay_payment_id,
      status:      "success",
    });

    const populated = await Booking.findById(booking._id)
      .populate({ path: "show", populate: { path: "movie", select: "title" } })
      .populate("theatre", "name address");

    // ── Send ticket email (non-blocking) ──────────────────
    dispatchTicketEmail(
      populated,
      userId,
      populated.show?.movie?.title || "Movie",
      populated.theatre?.name      || "Theatre",
    );

    res.json({
      message:    "Payment successful! Booking confirmed.",
      bookingRef: booking.bookingRef,
      booking:    populated,
    });
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
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const receivedSig   = req.headers["x-razorpay-signature"];

    if (webhookSecret && webhookSecret !== "skipping_for_now") {
      const expectedSig = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (expectedSig !== receivedSig)
        return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const { event, payload } = req.body;

    switch (event) {
      case "payment.captured": {
        const payment   = payload?.payment?.entity;
        const orderId   = payment?.order_id;
        const paymentId = payment?.id;
        if (orderId) {
          const booking = await Booking.findOne({ paymentId: orderId, status: "pending" });
          if (booking) {
            booking.paymentId = paymentId;
            booking.status    = "confirmed";
            await booking.save();
          }
        }
        break;
      }
      case "payment.failed": {
        const payment = payload?.payment?.entity;
        const orderId = payment?.order_id;
        if (orderId) {
          const failedBooking = await Booking.findOneAndUpdate(
            { paymentId: orderId, status: "pending" },
            { status: "cancelled" },
          );
          if (failedBooking) {
            await Transaction.create({
              user:        failedBooking.user,
              type:        "debit",
              amount:      failedBooking.grandTotal,
              description: `Ticket booking (Razorpay) — payment failed`,
              source:      "card",
              bookingType: "movie",
              booking:     failedBooking._id,
              gatewayRef:  payment?.id || "",
              status:      "failed",
            });
          }
        }
        break;
      }
      case "order.paid": {
        const order   = payload?.order?.entity;
        const payment = payload?.payment?.entity;
        if (order?.id) {
          const booking = await Booking.findOne({ paymentId: order.id });
          if (booking && booking.status !== "confirmed") {
            booking.paymentId = payment?.id || order.id;
            booking.status    = "confirmed";
            await booking.save();
          }
        }
        break;
      }
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    res.status(200).json({ received: true });
  } catch (e) {
    console.error("handleWebhook error:", e.message);
    res.status(200).json({ received: true });
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