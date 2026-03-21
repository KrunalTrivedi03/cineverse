const jwt  = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function (req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).populate({
      path: "role",
      populate: { path: "permissions", model: "Permission" },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.role) {
      return res.status(401).json({ message: "User has no role assigned" });
    }

    req.user = {
      id:          user._id,
      role:        user.role.name        || "user",
      permissions: user.role.permissions?.map((p) => p.name) || [],
    };

    return next(); // ← explicit return required in Express 5
  } catch (error) {
    // In Express 5, async errors must be passed to next()
    // NOT returned as responses inside catch — pass to Express error handler
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    return next(error); // ← pass unexpected errors to Express 5 error handler
  }
};