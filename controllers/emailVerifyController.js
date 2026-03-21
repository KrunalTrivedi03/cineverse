const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const decoded = jwt.verify(token, process.env.EMAIL_VERIFY_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user)
      return res.status(400).json({ message: "User not found" });

    if (user.isEmailVerified)
      return res.status(400).json({ message: "Email already verified" });

    if (user.emailVerifyToken !== token)
      return res.status(400).json({ message: "Invalid verification link" });

    user.isEmailVerified = true;
    user.emailVerifyToken = null;
    await user.save();

    return res.redirect(`${process.env.CLIENT_URL}/email-verified`);
  } catch (error) {
    return res.status(400).json({ message: "Verification link expired or invalid" });
  }
};