const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

async function settlePayment({ model, filter, fields, payment, userId, ledger, fulfill }) {
  return mongoose.connection.transaction(async (session) => {
    const booking = await model.findOneAndUpdate(
      { ...filter, status: "pending" },
      { $set: { ...fields, status: "confirmed" } },
      { new: true, session }
    );
    if (!booking) return null;

    await fulfill(booking, session);
    await Transaction.create([{
      ...ledger(booking),
      user: userId || booking.user,
      type: "debit",
      source: "card",
      gatewayRef: payment,
      status: "success",
    }], { session });
    return booking;
  });
}

module.exports = settlePayment;
