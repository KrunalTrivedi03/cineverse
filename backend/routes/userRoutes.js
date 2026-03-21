// const express = require("express");
// const router = express.Router();
// const User = require("../models/User");

// router.get("/", async (req, res) => {
//   try {
//     const users = await User.find()
//       .populate("role")
//       .select("-password -refreshToken");

//     const filtered = users
//       .filter((u) => u.role && u.role.name === "user");

//     res.json(filtered);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// module.exports = router;

// routes/userRoutes.js
const express    = require("express");
const router     = express.Router();

const {
  getMe,
  getAllUsers,
  updateMe,
  uploadAvatar,
  deleteAvatar,
  changePassword,
  assignRole,
  getMyBookings,
} = require("../controllers/userController");

const { avatarUpload, handleUploadError } = require("../middleware/uploadMiddleware");
const verifyToken  = require("../middleware/authMiddleware");   // default export
const allowRoles   = require("../middleware/roleMiddleware");   // default export

/* ── Authenticated user routes ────────────────────────── */
router.get   ("/me",          verifyToken, getMe);
router.put   ("/me",          verifyToken, updateMe);

router.post  ("/me/avatar",
  verifyToken,
  avatarUpload.single("avatar"),
  handleUploadError,
  uploadAvatar
);
router.delete("/me/avatar",   verifyToken, deleteAvatar);
router.put   ("/me/password", verifyToken, changePassword);
router.get   ("/me/bookings", verifyToken, getMyBookings);

/* ── Admin-only routes ────────────────────────────────── */
router.get  ("/",            verifyToken, allowRoles("admin"), getAllUsers);
router.post ("/assign-role", verifyToken, allowRoles("admin"), assignRole);

module.exports = router;