const { createHmac, timingSafeEqual } = require("node:crypto");

function validSignature(secret, payload, signature) {
  if (!secret || !payload || typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(payload).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

function requireSignedWebhook(req, res) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || secret === "skipping_for_now") {
    res.status(503).json({ message: "Payment webhook is not configured" });
    return false;
  }
  if (!validSignature(secret, req.razorpayRawBody, req.get("x-razorpay-signature"))) {
    res.status(400).json({ message: "Invalid webhook signature" });
    return false;
  }
  return true;
}

module.exports = { validSignature, requireSignedWebhook };
