// const User = require("../models/User");

// exports.assignRole = async (req, res) => {
//   try {
//     const { userId, roleId } = req.body;

//     await User.findByIdAndUpdate(userId, { role: roleId });

//     res.json({ message: "Role assigned successfully" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


// controllers/userController.js
const User    = require("../models/User");
const Role    = require("../models/Role");
const bcrypt  = require("bcrypt");

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("role", "name")
      .select("-password -refreshToken -emailOTP -emailOTPExpires");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone   || "",
      city: user.city    || "",
      role: user.role?.name || "user",
      avatar: user.avatar || null,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("getMe error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate("role")
      .select("-password -refreshToken");

    const filtered = users.filter((u) => u.role && u.role.name === "user");
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { username, phone, city } = req.body;

    const allowed = {};
    if (username !== undefined) allowed.username = username.trim();
    if (phone    !== undefined) allowed.phone    = phone.trim();
    if (city     !== undefined) allowed.city     = city.trim();

    if (Object.keys(allowed).length === 0)
      return res.status(400).json({ message: "No valid fields provided" });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: allowed },
      { new: true, runValidators: true }
    )
      .populate("role", "name")
      .select("-password -refreshToken -emailOTP -emailOTPExpires");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      message:  "Profile updated successfully",
      id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone  || "",
      city: user.city   || "",
      role: user.role?.name || "user",
      avatar: user.avatar || null,
    });
  } catch (err) {
    console.error("updateMe error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No image file provided" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.avatarPublicId) {
      const { cloudinary } = require("../config/cloudinary");
      await cloudinary.uploader.destroy(user.avatarPublicId);
    }

    user.avatar = req.file.path;
    user.avatarPublicId = req.file.filename;
    await user.save();

    res.json({
      message: "Avatar updated successfully",
      avatar:  user.avatar,
    });
  } catch (err) {
    console.error("uploadAvatar error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.avatarPublicId) {
      const { cloudinary } = require("../config/cloudinary");
      await cloudinary.uploader.destroy(user.avatarPublicId);
      user.avatar         = null;
      user.avatarPublicId = null;
      await user.save();
    }

    res.json({ message: "Avatar removed" });
  } catch (err) {
    console.error("deleteAvatar error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "currentPassword and newPassword are required" });

    if (newPassword.length < 8)
      return res.status(400).json({ message: "New password must be at least 8 characters" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.password) return res.status(400).json({ message: "This account signs in through Google" });
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match)
      return res.status(400).json({ message: "Current password is incorrect" });

    user.password     = await bcrypt.hash(newPassword, 10);
    user.refreshToken = null;
    await user.save();
    await require("../models/MobileSession").deleteMany({ user: user._id });

    res.json({ message: "Password changed successfully. Please log in again." });
  } catch (err) {
    console.error("changePassword error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.assignRole = async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId)
      return res.status(400).json({ message: "userId and roleId are required" });

    const [user, role] = await Promise.all([
      User.findById(userId),
      Role.findById(roleId),
    ]);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!role) return res.status(404).json({ message: "Role not found" });

    user.role = roleId;
    await user.save();

    res.json({
      message:  "Role assigned successfully",
      userId:   user._id,
      username: user.username,
      role:     role.name,
    });
  } catch (err) {
    console.error("assignRole error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const Booking = require("../models/Booking");

    const bookings = await Booking.find({
      user:   req.user.id,
      status: "confirmed",
    })
      .populate({ path: "show", populate: { path: "movie", select: "title poster" } })
      .populate("theatre", "name address")
      .sort({ createdAt: -1 });

    const result = bookings.map((b) => ({
      _id:         b._id,
      bookingRef:  b.bookingRef,
      movie: {
        title:  b.movieTitle  || b.show?.movie?.title  || "Unknown Movie",
        poster: b.moviePoster || b.show?.movie?.poster || null,
      },
      
      theatre:     { name: b.theatre?.name || "" },
      screen:      b.screen,
      showDate:    b.showDate,
      showTime:    b.showTime,
      seats:       b.seats?.map((s) => s.seatId) || [],
      totalAmount: b.grandTotal,
      status:      b.status,
      createdAt:   b.createdAt,
    }));

    res.json(result);
  } catch (err) {
    console.error("getMyBookings error:", err.message);
    res.status(500).json({ message: err.message });
  }
};
