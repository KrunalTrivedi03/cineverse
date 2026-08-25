const mongoose = require("mongoose");

// Sports/activities are admin-managed rather than hardcoded, so new ones
// (e.g. "Squash") can be added without a code change — same reasoning as
// City/District being their own collections rather than enums.
const PlayActivitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    icon: { type: String, default: "" }, // lucide-react icon name, e.g. "Dumbbell"
    image: { type: String, default: "" }, // tile background image URL
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlayActivity", PlayActivitySchema);
