const User        = require("../models/User");
const QuickPay    = require("../models/QuickPay");
const Transaction = require("../models/Transaction");

exports.getQuickPay = async (req, res) => {
  try {
    let qp = await QuickPay.findOne({ user: req.user.id });

    if (!qp) {
      qp = await QuickPay.create({ user: req.user.id, walletBalance: 0 });
    }

    res.json({
      walletBalance: qp.walletBalance,
      cards: qp.cards,
      upiIds: qp.upiIds,
    });
  } catch (err) {
    console.error("getQuickPay error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.addWalletMoney = async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0)
      return res.status(400).json({ message: "Valid amount is required" });
    if (amount > 10000)
      return res.status(400).json({ message: "Maximum ₹10,000 per top-up" });

    const qp = await QuickPay.findOneAndUpdate(
      { user: req.user.id },
      {
        $inc:      { walletBalance: amount },
        $setOnInsert: { user: req.user.id },
      },
      { new: true, upsert: true }
    );

    await Transaction.create({
      user:        req.user.id,
      type:        "credit",
      amount,
      description: "Wallet top-up",
      source:      "wallet",
      status:      "success",
    });

    res.json({ message: "Wallet updated", walletBalance: qp.walletBalance });
  } catch (err) {
    console.error("addWalletMoney error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.addCard = async (req, res) => {
  try {
    const { cardholderName, last4, expiry, network, token } = req.body;

    if (!last4 || !expiry || !network)
      return res.status(400).json({ message: "last4, expiry and network are required" });

    const qp = await QuickPay.findOne({ user: req.user.id });
    if (!qp) return res.status(404).json({ message: "QuickPay profile not found" });

    const duplicate = qp.cards.find(
      (c) => c.last4 === last4 && c.expiry === expiry
    );
    if (duplicate)
      return res.status(409).json({ message: "This card is already saved" });

    if (qp.cards.length >= 5)
      return res.status(400).json({ message: "Maximum 5 cards allowed" });

    const isPrimary = qp.cards.length === 0;

    qp.cards.push({ cardholderName, last4, expiry, network, token, isPrimary });
    await qp.save();

    res.status(201).json({ message: "Card added", cards: qp.cards });
  } catch (err) {
    console.error("addCard error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.setPrimaryCard = async (req, res) => {
  try {
    const qp = await QuickPay.findOne({ user: req.user.id });
    if (!qp) return res.status(404).json({ message: "QuickPay profile not found" });

    const card = qp.cards.id(req.params.cardId);
    if (!card) return res.status(404).json({ message: "Card not found" });

    qp.cards.forEach((c) => { c.isPrimary = false; });
    card.isPrimary = true;
    await qp.save();

    res.json({ message: "Primary card updated", cards: qp.cards });
  } catch (err) {
    console.error("setPrimaryCard error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.removeCard = async (req, res) => {
  try {
    const qp = await QuickPay.findOne({ user: req.user.id });
    if (!qp) return res.status(404).json({ message: "QuickPay profile not found" });

    const card = qp.cards.id(req.params.cardId);
    if (!card) return res.status(404).json({ message: "Card not found" });

    const wasPrimary = card.isPrimary;
    qp.cards.pull(req.params.cardId);

    if (wasPrimary && qp.cards.length > 0) {
      qp.cards[0].isPrimary = true;
    }

    await qp.save();
    res.json({ message: "Card removed", cards: qp.cards });
  } catch (err) {
    console.error("removeCard error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.addUPI = async (req, res) => {
  try {
    const { upiId } = req.body;
    if (!upiId || !upiId.includes("@"))
      return res.status(400).json({ message: "Invalid UPI ID format" });

    const qp = await QuickPay.findOneAndUpdate(
      { user: req.user.id },
      { $setOnInsert: { user: req.user.id } },
      { new: true, upsert: true }
    );

    if (qp.upiIds.some((u) => u.id === upiId.toLowerCase()))
      return res.status(409).json({ message: "UPI ID already saved" });

    if (qp.upiIds.length >= 3)
      return res.status(400).json({ message: "Maximum 3 UPI IDs allowed" });

    qp.upiIds.push({ id: upiId.toLowerCase() });
    await qp.save();

    res.status(201).json({ message: "UPI ID added", upiIds: qp.upiIds });
  } catch (err) {
    console.error("addUPI error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.removeUPI = async (req, res) => {
  try {
    const qp = await QuickPay.findOne({ user: req.user.id });
    if (!qp) return res.status(404).json({ message: "QuickPay profile not found" });

    const entry = qp.upiIds.id(req.params.upiDocId);
    if (!entry) return res.status(404).json({ message: "UPI ID not found" });

    qp.upiIds.pull(req.params.upiDocId);
    await qp.save();

    res.json({ message: "UPI ID removed", upiIds: qp.upiIds });
  } catch (err) {
    console.error("removeUPI error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const filter = { user: req.user.id };
    if (req.query.type)        filter.type        = req.query.type;        // credit | debit
    if (req.query.status)      filter.status       = req.query.status;      // success | pending | failed
    if (req.query.bookingType) filter.bookingType  = req.query.bookingType; // movie | event | play

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "booking",
          select: "movieTitle moviePoster showDate showTime bookingRef theatre",
          populate: { path: "theatre", select: "name" },
        })
        .populate({
          path: "eventBooking",
          select: "eventDate eventTime bookingRef event venue",
          populate: [
            { path: "event", select: "title poster category" },
            { path: "venue", select: "name" },
          ],
        })
        .populate({
          path: "playBooking",
          select: "date slots venueName courtName activityName bookingRef",
          populate: { path: "slots", select: "startTime" },
        }),
      Transaction.countDocuments(filter),
    ]);

    const result = transactions.map((t) => {
      const base = {
        _id:         t._id,
        type:        t.type,
        amount:      t.amount,
        description: t.description,
        source:      t.source,
        bookingType: t.bookingType,
        status:      t.status,
        gatewayRef:  t.gatewayRef,
        createdAt:   t.createdAt,
      };

      if (t.bookingType === "event" && t.eventBooking) {
        return {
          ...base,
          bookingRef: t.eventBooking.bookingRef,
          title:      t.eventBooking.event?.title || "Event",
          poster:     t.eventBooking.event?.poster || null,
          subtitle:   t.eventBooking.venue?.name || "",
          date:       t.eventBooking.eventDate,
          time:       t.eventBooking.eventTime,
        };
      }

      if (t.bookingType === "movie" && t.booking) {
        return {
          ...base,
          bookingRef: t.booking.bookingRef,
          title:      t.booking.movieTitle || "Movie",
          poster:     t.booking.moviePoster || null,
          subtitle:   t.booking.theatre?.name || "",
          date:       t.booking.showDate,
          time:       t.booking.showTime,
        };
      }

      if (t.bookingType === "play" && t.playBooking) {
        return {
          ...base,
          bookingRef: t.playBooking.bookingRef,
          title:      t.playBooking.activityName || "Play Booking",
          poster:     null,
          subtitle:   `${t.playBooking.venueName || ""} · ${t.playBooking.courtName || ""}`,
          date:       t.playBooking.date,
          time:       t.playBooking.slots?.[0]?.startTime || null,
        };
      }

      // Wallet top-ups, rewards, or transactions with no linked booking
      return { ...base, bookingRef: null, title: t.description || "Wallet transaction", poster: null, subtitle: "", date: null, time: null };
    });

    res.json({
      transactions: result,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("getTransactions error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findOne({ _id: req.params.id, user: req.user.id });
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    // Deleting a transaction only removes it from the user's history log —
    // it never touches the underlying booking, refund or wallet balance.
    await Transaction.deleteOne({ _id: tx._id });

    res.json({ message: "Transaction removed from history", id: tx._id });
  } catch (err) {
    console.error("deleteTransaction error:", err.message);
    res.status(500).json({ message: err.message });
  }
};