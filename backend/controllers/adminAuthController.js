const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email }).populate({
      path: "role",
      populate: { path: "permissions" }
    });

    if (!admin || admin.role.name !== "admin") {
      return res.status(403).json({ message: "Not an admin account" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const permissions = admin.role.permissions.map((p) => p.name);

    const accessToken = jwt.sign(
      {
        id: admin._id,
        role: admin.role.name,
        permissions: permissions,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Admin login success",
      accessToken,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role.name,
        permissions,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
