const { createHash, randomBytes } = require("node:crypto");
const MobileSession = require("../models/MobileSession");
const User = require("../models/User");
const { generateAccessToken } = require("../utils/generateTokens");

const lifetime = 7 * 24 * 60 * 60 * 1000;
const digest = (token) => createHash("sha256").update(token).digest("hex");
const createToken = () => randomBytes(32).toString("hex");
const valid = (token) => typeof token === "string" && /^[a-f0-9]{64}$/.test(token);

exports.issue = async (user) => {
  const refreshToken = createToken();
  const session = await MobileSession.create({ user: user._id, digest: digest(refreshToken), expiresAt: new Date(Date.now() + lifetime) });
  return { accessToken: generateAccessToken(user, session._id), refreshToken };
};

exports.refresh = async (req, res, next) => {
  try {
    const previous = req.body?.refreshToken;
    if (!valid(previous)) return res.status(401).json({ message: "Sign in to continue" });
    const refreshToken = createToken();
    const session = await MobileSession.findOneAndUpdate(
      { digest: digest(previous), expiresAt: { $gt: new Date() } },
      { digest: digest(refreshToken), expiresAt: new Date(Date.now() + lifetime) },
    );
    if (!session) return res.status(401).json({ message: "Sign in to continue" });
    const user = await User.findById(session.user);
    if (!user || !user.isEmailVerified) {
      await MobileSession.deleteOne({ _id: session._id });
      return res.status(401).json({ message: "Sign in to continue" });
    }
    res.set("Cache-Control", "no-store");
    return res.json({ accessToken: generateAccessToken(user, session._id), refreshToken });
  } catch (error) {
    return next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.body?.refreshToken;
    if (valid(token)) await MobileSession.deleteOne({ digest: digest(token) });
    return res.json({ message: "Logged out" });
  } catch (error) {
    return next(error);
  }
};
