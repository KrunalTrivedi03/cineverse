const { createHash } = require("node:crypto");
const CheckoutAttempt = require("../models/CheckoutAttempt");

const reservationMs = 5 * 60 * 1000;

async function createOrderOnce(key, create) {
  const id = createHash("sha256").update(JSON.stringify(key)).digest("hex");
  const expiresAt = new Date(Date.now() + reservationMs);
  let attempt;
  try {
    attempt = await CheckoutAttempt.create({ _id: id, expiresAt });
  } catch (error) {
    if (error.code !== 11000) throw error;
    const existing = await CheckoutAttempt.findById(id).lean();
    if (existing?.result && existing.expiresAt > new Date()) return existing.result;
    throw { status: 409, message: "An order for this selection is processing or has expired. Check booking history before starting again." };
  }
  const result = { ...await create(), expiresAt };
  await CheckoutAttempt.updateOne({ _id: attempt._id }, { $set: { result } });
  return result;
}

module.exports = createOrderOnce;
