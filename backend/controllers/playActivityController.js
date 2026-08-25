const PlayActivity = require("../models/PlayActivity");

const slugify = (name) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/* ── Admin CRUD ───────────────────────────────────────── */
exports.addActivity = async (req, res) => {
  try {
    const { name, icon, image, sortOrder } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const activity = await PlayActivity.create({
      name,
      slug: slugify(name),
      icon: icon || "",
      image: req.file?.path || image || "",
      sortOrder: sortOrder || 0,
    });
    res.json({ message: "Activity added", activity });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: "An activity with this name already exists" });
    res.status(500).json({ message: e.message });
  }
};

exports.getAllActivities = async (req, res) => {
  try {
    res.json(await PlayActivity.find().sort({ sortOrder: 1, name: 1 }));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* Public: active only, same list shape minus admin-only fields */
exports.getActiveActivities = async (req, res) => {
  try {
    res.json(await PlayActivity.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateActivity = async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.name) update.slug = slugify(update.name);
    if (req.file?.path) update.image = req.file.path;

    const activity = await PlayActivity.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!activity) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Updated", activity });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: "An activity with this name already exists" });
    res.status(500).json({ message: e.message });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    const Court = require("../models/Court");
    const inUse = await Court.exists({ activity: req.params.id });
    if (inUse) {
      return res.status(409).json({ message: "Cannot delete — one or more courts still use this activity. Reassign or delete them first." });
    }

    const activity = await PlayActivity.findByIdAndDelete(req.params.id);
    if (!activity) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};