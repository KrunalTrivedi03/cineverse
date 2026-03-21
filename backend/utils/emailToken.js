const jwt = require("jsonwebtoken");

exports.generateEmailVerifyToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.EMAIL_VERIFY_SECRET,
    { expiresIn: "24h" }
  );
};
