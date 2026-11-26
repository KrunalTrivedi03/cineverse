const { OAuth2Client } = require("google-auth-library");
const { randomBytes } = require("node:crypto");
const User = require("../models/User");
const Role = require("../models/Role");
const sessions = require("../services/mobileSessions");
const sendWelcomeEmail = require("../utils/sendWelcomeEmail");

const google = new OAuth2Client();

async function googleProfile(req, res) {
  const audience = process.env.MOBILE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  if (!audience) {
    res.status(503).json({ message: "Google sign-in is not configured" });
    return null;
  }
  const idToken = req.body?.idToken;
  if (typeof idToken !== "string" || idToken.length > 8192) {
    res.status(400).json({ message: "A Google ID token is required" });
    return null;
  }
  try {
    const ticket = await google.verifyIdToken({ idToken, audience });
    const profile = ticket.getPayload();
    if (profile?.email_verified && profile.email && profile.sub) return profile;
  } catch {
    // Keep third-party token details out of the response and logs.
  }
  res.status(401).json({ message: "Google could not verify this account" });
  return null;
}

exports.signIn = async (req, res, next) => {
  try {
    const profile = await googleProfile(req, res);
    if (!profile) return;
    const email = profile.email.toLowerCase();
    let user = await User.findOne({ googleId: profile.sub });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        const authoritative = email.endsWith("@gmail.com") || Boolean(profile.hd);
        if (!authoritative || user.googleId || !user.isEmailVerified) {
          return res.status(409).json({ message: "Sign in to your existing NOW account and link Google from Account." });
        }
        user = await User.findOneAndUpdate(
          { _id: user._id, googleId: null },
          { $set: { googleId: profile.sub } },
          { new: true },
        );
        if (!user) return res.status(409).json({ message: "Account linking changed. Try signing in again." });
      } else {
        const role = await Role.findOne({ name: "user" });
        if (!role) return res.status(503).json({ message: "Registration is temporarily unavailable" });
        const name = profile.name || email.split("@")[0];
        const base = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 35) || "NOWUser";
        user = await User.create({
          username: base + randomBytes(6).toString("hex"), email, googleId: profile.sub, authProvider: "google",
          role: role._id, isEmailVerified: true, isOTPVerified: true,
        });
        sendWelcomeEmail({ toEmail: email, toName: name }).catch((error) => console.error("Welcome email failed:", error.message));
      }
    }
    res.set("Cache-Control", "no-store");
    return res.json(await sessions.issue(user));
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Account already exists. Sign in again." });
    return next(error);
  }
};

exports.link = async (req, res, next) => {
  try {
    const profile = await googleProfile(req, res);
    if (!profile) return;
    const user = await User.findById(req.user.id);
    if (!user || profile.email.toLowerCase() !== user.email || (user.googleId && user.googleId !== profile.sub)) {
      return res.status(409).json({ message: "Choose the Google account that matches your NOW account." });
    }
    const other = await User.exists({ _id: { $ne: user._id }, googleId: profile.sub });
    if (other) return res.status(409).json({ message: "This Google account is already linked." });
    const result = await User.updateOne({ _id: user._id, googleId: { $in: [null, profile.sub] } }, { $set: { googleId: profile.sub } });
    if (!result.matchedCount) return res.status(409).json({ message: "Account linking changed. Try again." });
    return res.json({ message: "Google account linked" });
  } catch (error) {
    return next(error);
  }
};
