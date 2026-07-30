// controllers/eventPaymentController.js — mirrors paymentController.js for the Event module
const Razorpay       = require("razorpay");
const crypto         = require("crypto");
const EventBooking   = require("../models/EventBooking");
const EventSchedule  = require("../models/EventSchedule");
const Venue          = require("../models/Venue");
const EventSeatLock  = require("../models/EventSeatLock");
const QuickPay       = require("../models/QuickPay");
const Transaction    = require("../models/Transaction");
const User           = require("../models/User");
const sendEventTicketEmail = require("../utils/sendEventTicketEmail");
const { resolveOfferDiscount } = require("../utils/resolveOfferDiscount");

const EVENT_CATEGORY_PRICE_ADD = { VIP: 500, Premium: 200, General: 0 };
const HOLD_MINUTES = 15; // payment window for a pending booking

const getRazorpay = () => new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const findSlot = (schedule, slotId) =>
  schedule.showTimes?.id
    ? schedule.showTimes.id(slotId)
    : schedule.showTimes?.find((t) => t._id.toString() === slotId);

/* ── Shared helper: calculate pricing for a SEATED booking ─── */
const calcSeatedPricing = async (scheduleId, slotId, seatIds) => {
  const schedule = await EventSchedule.findById(scheduleId).populate("event");
  if (!schedule) throw { status: 404, message: "Schedule not found" };

  const slot = findSlot(schedule, slotId);
  if (!slot) throw { status: 404, message: "Slot not found" };

  const venue  = await Venue.findById(schedule.venue);
  const rowMap = {};
  (venue?.seatLayout || []).forEach((r) => { rowMap[r.row] = r; });

  const seatDocs = seatIds.map((seatId) => {
    const row      = seatId.replace(/\d+/g, "");
    const col      = parseInt(seatId.replace(/\D+/g, ""), 10);
    const category = rowMap[row]?.category || "General";
    const priceAdd = EVENT_CATEGORY_PRICE_ADD[category] || 0;
    return { seatId, row, col, category, price: slot.price + priceAdd };
  });

  const totalAmount    = seatDocs.reduce((s, d) => s + d.price, 0);
  const convenienceFee = Math.round(totalAmount * 0.02);
  const grandTotal     = totalAmount + convenienceFee;

  return { schedule, slot, venue, seatDocs, totalAmount, convenienceFee, grandTotal };
};

/* ── Shared helper: calculate pricing for a GENERAL-ADMISSION booking ─── */
const calcGeneralPricing = async (scheduleId, slotId, ticketTypeName, quantity) => {
  const schedule = await EventSchedule.findById(scheduleId).populate("event");
  if (!schedule) throw { status: 404, message: "Schedule not found" };

  const slot = findSlot(schedule, slotId);
  if (!slot) throw { status: 404, message: "Slot not found" };

  const tt = (slot.ticketTypes || []).find((t) => t.name === ticketTypeName);
  if (!tt) throw { status: 404, message: "Ticket type not found" };

  const now = new Date();
  const pendingBookings = await EventBooking.find({
    eventSchedule: scheduleId, slotId, status: "pending",
    holdExpiresAt: { $gt: now }, "ticketType.name": ticketTypeName,
  });
  const held      = pendingBookings.reduce((s, b) => s + (b.quantity || 0), 0);
  const available = tt.totalQuantity - tt.bookedQuantity - held;

  if (quantity > available) {
    throw { status: 409, message: `Only ${available} ticket(s) left for ${ticketTypeName}`, available };
  }

  const totalAmount    = tt.price * quantity;
  const convenienceFee = Math.round(totalAmount * 0.02);
  const grandTotal     = totalAmount + convenienceFee;

  const venue = await Venue.findById(schedule.venue);
  return {
    schedule, slot, venue,
    ticketType: { name: tt.name, price: tt.price },
    quantity, totalAmount, convenienceFee, grandTotal,
  };
};

/* ── Shared helper: validate seat locks (seated events only) ─── */
const validateLocks = async (scheduleId, slotId, seatIds, userId) => {
  const now   = new Date();
  const locks = await EventSeatLock.find({
    eventScheduleId: scheduleId, slotId,
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

/* ── Shared helper: atomically bump bookedQuantity for a general-admission ticket type ─── */
const incrementBookedQuantity = async (scheduleId, slotId, ticketTypeName, quantity) => {
  await EventSchedule.updateOne(
    { _id: scheduleId, "showTimes._id": slotId },
    { $inc: { "showTimes.$[st].ticketTypes.$[tt].bookedQuantity": quantity } },
    { arrayFilters: [{ "st._id": slotId }, { "tt.name": ticketTypeName }] }
  );
};

const decrementBookedQuantity = async (scheduleId, slotId, ticketTypeName, quantity) => {
  await EventSchedule.updateOne(
    { _id: scheduleId, "showTimes._id": slotId },
    { $inc: { "showTimes.$[st].ticketTypes.$[tt].bookedQuantity": -quantity } },
    { arrayFilters: [{ "st._id": slotId }, { "tt.name": ticketTypeName }] }
  );
};

/* ── Shared helper: send ticket email safely ─── */
const dispatchTicketEmail = async (booking, userId, eventTitle, venueName, category) => {
  try {
    const user = await User.findById(userId).select("email username");
    if (!user?.email) return;
    await sendEventTicketEmail({
      toEmail: user.email,
      toName:  user.username || "Event Goer",
      booking, eventTitle, venueName, category,
    });
  } catch (err) {
    console.error("sendEventTicketEmail failed (non-fatal):", err.message);
  }
};

/* ─────────────────────────────────────────────────────────
   1. POST /api/event-payment/create-order  (Razorpay)
───────────────────────────────────────────────────────── */
exports.createOrder = async (req, res) => {
  try {
    const { scheduleId, slotId, seatIds, ticketTypeName, quantity, offerId } = req.body;
    const userId = req.user.id.toString();

    if (!scheduleId || !slotId) {
      return res.status(400).json({ message: "scheduleId and slotId are required" });
    }

    const schedule = await EventSchedule.findById(scheduleId).populate("event");
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });
    const bookingType = schedule.event.bookingType;

    let pricing;
    if (bookingType === "seated") {
      if (!seatIds?.length) return res.status(400).json({ message: "seatIds are required for a seated event" });
      await validateLocks(scheduleId, slotId, seatIds, userId);
      pricing = await calcSeatedPricing(scheduleId, slotId, seatIds);
    } else {
      if (!ticketTypeName || !quantity) {
        return res.status(400).json({ message: "ticketTypeName and quantity are required for a general-admission event" });
      }
      pricing = await calcGeneralPricing(scheduleId, slotId, ticketTypeName, quantity);
    }

    const { slot, venue, totalAmount } = pricing;

    const { appliedOffer, discountAmount } = await resolveOfferDiscount(
      offerId,
      { type: "events", id: schedule.event._id, genre: schedule.event.category },
      totalAmount
    );
    const discountedSubtotal = totalAmount - discountAmount;
    const convenienceFee     = Math.round(discountedSubtotal * 0.02);
    const grandTotal         = discountedSubtotal + convenienceFee;

    const qp = await QuickPay.findOne({ user: userId });
    const walletBalance  = qp?.walletBalance  || 0;
    const walletEligible = walletBalance >= grandTotal;

    const razorpayOrder = await getRazorpay().orders.create({
      amount:   grandTotal * 100,
      currency: "INR",
      receipt:  `evt_rcpt_${Date.now()}`,
      notes:    { scheduleId, slotId, userId, bookingType },
    });

    const bookingData = {
      user:          userId,
      event:         schedule.event._id,
      eventSchedule: scheduleId,
      slotId,
      venue:         schedule.venue,
      eventDate:     schedule.eventDate,
      eventTime:     slot.time,
      bookingType,
      totalAmount, convenienceFee, grandTotal,
      appliedOffer,
      paymentId:     razorpayOrder.id,
      status:        "pending",
      holdExpiresAt: new Date(Date.now() + HOLD_MINUTES * 60 * 1000),
    };

    if (bookingType === "seated") {
      bookingData.seats = pricing.seatDocs;
    } else {
      bookingData.ticketType = pricing.ticketType;
      bookingData.quantity   = pricing.quantity;
    }

    const booking = await EventBooking.create(bookingData);

    res.json({
      orderId:    razorpayOrder.id,
      amount:     razorpayOrder.amount,
      currency:   razorpayOrder.currency,
      keyId:      process.env.RAZORPAY_KEY_ID,
      bookingId:  booking._id,
      bookingRef: booking.bookingRef,
      grandTotal, convenienceFee, totalAmount,
      discountAmount,
      appliedOffer,
      bookingType,
      seats:      bookingType === "seated" ? pricing.seatDocs   : undefined,
      ticketType: bookingType === "general" ? pricing.ticketType : undefined,
      quantity:   bookingType === "general" ? pricing.quantity   : undefined,
      event:      schedule.event.title,
      eventDate:  schedule.eventDate,
      eventTime:  slot.time,
      venue:      venue?.name,
      wallet: { balance: walletBalance, eligible: walletEligible },
    });
  } catch (e) {
    console.error("createOrder error:", e.message);
    res.status(e.status || 500).json({ message: e.message, expiredSeats: e.expiredSeats, available: e.available });
  }
};

/* ─────────────────────────────────────────────────────────
   2. POST /api/event-payment/wallet-pay
───────────────────────────────────────────────────────── */
exports.walletPay = async (req, res) => {
  try {
    const { scheduleId, slotId, seatIds, ticketTypeName, quantity, offerId } = req.body;
    const userId = req.user.id.toString();

    if (!scheduleId || !slotId) {
      return res.status(400).json({ message: "scheduleId and slotId are required" });
    }

    const schedule = await EventSchedule.findById(scheduleId).populate("event");
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });
    const bookingType = schedule.event.bookingType;

    let pricing;
    if (bookingType === "seated") {
      if (!seatIds?.length) return res.status(400).json({ message: "seatIds are required for a seated event" });
      await validateLocks(scheduleId, slotId, seatIds, userId);
      pricing = await calcSeatedPricing(scheduleId, slotId, seatIds);
    } else {
      if (!ticketTypeName || !quantity) {
        return res.status(400).json({ message: "ticketTypeName and quantity are required for a general-admission event" });
      }
      pricing = await calcGeneralPricing(scheduleId, slotId, ticketTypeName, quantity);
    }

    const { slot, venue, totalAmount } = pricing;

    const { appliedOffer, discountAmount } = await resolveOfferDiscount(
      offerId,
      { type: "events", id: schedule.event._id, genre: schedule.event.category },
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

    const bookingData = {
      user:          userId,
      event:         schedule.event._id,
      eventSchedule: scheduleId,
      slotId,
      venue:         schedule.venue,
      eventDate:     schedule.eventDate,
      eventTime:     slot.time,
      bookingType,
      totalAmount, convenienceFee, grandTotal,
      appliedOffer,
      paymentId:     `wallet_${Date.now()}`,
      paymentMethod: "wallet",
      status:        "confirmed",
    };

    if (bookingType === "seated") {
      bookingData.seats = pricing.seatDocs;
    } else {
      bookingData.ticketType = pricing.ticketType;
      bookingData.quantity   = pricing.quantity;
    }

    const booking = await EventBooking.create(bookingData);

    if (bookingType === "seated") {
      await EventSeatLock.deleteMany({ eventScheduleId: scheduleId, slotId, userId });
    } else {
      await incrementBookedQuantity(scheduleId, slotId, pricing.ticketType.name, pricing.quantity);
    }

    await Transaction.create({
      user:         userId,
      type:         "debit",
      amount:       grandTotal,
      description:  `Event ticket — ${schedule.event.title}`,
      source:       "wallet",
      bookingType:  "event",
      eventBooking: booking._id,
      status:       "success",
    });

    const populated = await EventBooking.findById(booking._id)
      .populate("event", "title category")
      .populate("venue", "name address");

    dispatchTicketEmail(populated, userId, schedule.event.title, venue?.name || "Venue", schedule.event.category);

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
    res.status(e.status || 500).json({ message: e.message, expiredSeats: e.expiredSeats, available: e.available });
  }
};

/* ─────────────────────────────────────────────────────────
   3. POST /api/event-payment/verify  (Razorpay callback)
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
      const failedBooking = await EventBooking.findByIdAndUpdate(bookingId, { status: "cancelled" });
      if (failedBooking) {
        await Transaction.create({
          user:         userId,
          type:         "debit",
          amount:       failedBooking.grandTotal,
          description:  `Event ticket (Razorpay) — signature mismatch`,
          source:       "card",
          bookingType:  "event",
          eventBooking: failedBooking._id,
          gatewayRef:   razorpay_payment_id,
          status:       "failed",
        });
      }
      return res.status(400).json({ message: "Payment verification failed. Signature mismatch." });
    }

    const booking = await EventBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status === "confirmed") {
      return res.json({ message: "Booking already confirmed", bookingRef: booking.bookingRef, booking });
    }

    booking.paymentId     = razorpay_payment_id;
    booking.paymentMethod = "razorpay";
    booking.status        = "confirmed";
    booking.holdExpiresAt = null;
    await booking.save();

    if (booking.bookingType === "seated") {
      await EventSeatLock.deleteMany({ eventScheduleId: booking.eventSchedule.toString(), slotId: booking.slotId, userId });
    } else {
      await incrementBookedQuantity(booking.eventSchedule.toString(), booking.slotId, booking.ticketType.name, booking.quantity);
    }

    await Transaction.create({
      user:         userId,
      type:         "debit",
      amount:       booking.grandTotal,
      description:  `Event ticket (Razorpay)`,
      source:       "card",
      bookingType:  "event",
      eventBooking: booking._id,
      gatewayRef:   razorpay_payment_id,
      status:       "success",
    });

    const populated = await EventBooking.findById(booking._id)
      .populate("event", "title category")
      .populate("venue", "name address");

    dispatchTicketEmail(
      populated, userId,
      populated.event?.title || "Event",
      populated.venue?.name  || "Venue",
      populated.event?.category,
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
   4. POST /api/event-payment/webhook  (Razorpay webhook)
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
          const booking = await EventBooking.findOne({ paymentId: orderId, status: "pending" });
          if (booking) {
            booking.paymentId     = paymentId;
            booking.status        = "confirmed";
            booking.holdExpiresAt = null;
            await booking.save();

            if (booking.bookingType === "seated") {
              await EventSeatLock.deleteMany({ eventScheduleId: booking.eventSchedule.toString(), slotId: booking.slotId });
            } else {
              await incrementBookedQuantity(booking.eventSchedule.toString(), booking.slotId, booking.ticketType.name, booking.quantity);
            }
          }
        }
        break;
      }
      case "payment.failed": {
        const payment = payload?.payment?.entity;
        const orderId = payment?.order_id;
        if (orderId) {
          const failedBooking = await EventBooking.findOneAndUpdate(
            { paymentId: orderId, status: "pending" },
            { status: "cancelled" },
          );
          if (failedBooking) {
            await Transaction.create({
              user:         failedBooking.user,
              type:         "debit",
              amount:       failedBooking.grandTotal,
              description:  `Event ticket (Razorpay) — payment failed`,
              source:       "card",
              bookingType:  "event",
              eventBooking: failedBooking._id,
              gatewayRef:   payment?.id || "",
              status:       "failed",
            });
          }
        }
        break;
      }
      case "order.paid": {
        const order   = payload?.order?.entity;
        const payment = payload?.payment?.entity;
        if (order?.id) {
          const booking = await EventBooking.findOne({ paymentId: order.id });
          if (booking && booking.status !== "confirmed") {
            booking.paymentId     = payment?.id || order.id;
            booking.status        = "confirmed";
            booking.holdExpiresAt = null;
            await booking.save();

            if (booking.bookingType === "general") {
              await incrementBookedQuantity(booking.eventSchedule.toString(), booking.slotId, booking.ticketType.name, booking.quantity);
            }
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
   5. GET /api/event-payment/details/:paymentId
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
   6. POST /api/event-payment/refund
───────────────────────────────────────────────────────── */
exports.refundPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.id.toString();

    const booking = await EventBooking.findById(bookingId);
    if (!booking)                            return res.status(404).json({ message: "Booking not found" });
    if (booking.user.toString() !== userId)  return res.status(403).json({ message: "Unauthorized" });
    if (booking.status !== "confirmed")      return res.status(400).json({ message: "Only confirmed bookings can be refunded" });

    const releaseInventory = async () => {
      if (booking.bookingType === "general") {
        await decrementBookedQuantity(booking.eventSchedule.toString(), booking.slotId, booking.ticketType.name, booking.quantity);
      }
      // Seated bookings free up automatically — availability checks filter on status:"confirmed"
    };

    if (booking.paymentMethod === "wallet") {
      const qp = await QuickPay.findOneAndUpdate(
        { user: userId },
        { $inc: { walletBalance: booking.grandTotal } },
        { new: true, upsert: true }
      );

      booking.status = "cancelled";
      await booking.save();
      await releaseInventory();

      await Transaction.create({
        user:         userId,
        type:         "credit",
        amount:       booking.grandTotal,
        description:  `Refund — ${booking.bookingRef}`,
        source:       "refund",
        bookingType:  "event",
        eventBooking: booking._id,
        status:       "success",
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
      await releaseInventory();
      return res.json({ message: "Booking cancelled" });
    }

    const refund = await getRazorpay().payments.refund(booking.paymentId, {
      amount: booking.grandTotal * 100,
      notes:  { bookingRef: booking.bookingRef, reason: "User cancelled" },
    });

    booking.status    = "cancelled";
    booking.paymentId = `refunded_${refund.id}`;
    await booking.save();
    await releaseInventory();

    await Transaction.create({
      user:         userId,
      type:         "credit",
      amount:       booking.grandTotal,
      description:  `Razorpay refund — ${booking.bookingRef}`,
      source:       "refund",
      bookingType:  "event",
      eventBooking: booking._id,
      gatewayRef:   refund.id,
      status:       "success",
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

    const booking = await EventBooking.findById(bookingId)
      .populate("event", "title category")
      .populate("venue", "name");

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    if (booking.user.toString() !== userId)
      return res.status(403).json({ message: "Unauthorized" });

    if (booking.status !== "confirmed")
      return res.status(400).json({ message: "Only confirmed bookings can be resent" });

    const user = await User.findById(userId).select("email username");
    if (!user?.email)
      return res.status(400).json({ message: "No email address on file" });

    await sendEventTicketEmail({
      toEmail:    user.email,
      toName:     user.username || "Event Goer",
      booking,
      eventTitle: booking.event?.title || "Event",
      venueName:  booking.venue?.name  || "Venue",
      category:   booking.event?.category,
    });

    res.json({ message: "Confirmation email resent successfully" });
  } catch (e) {
    console.error("resendConfirmation error:", e.message);
    res.status(500).json({ message: e.message });
  }
};