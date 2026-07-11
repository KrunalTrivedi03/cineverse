const District = require("../models/District");

exports.createDistrict = async (req, res) => {
  try {
    const { name, city } = req.body;

    if (!name || !city) {
      return res.status(400).json({ message: "name and city are required" });
    }

    const existing = await District.findOne({ name, city });
    if (existing) {
      return res.status(400).json({ message: "District already exists in this city" });
    }

    const district = await District.create({ name, city });
    res.json(district);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDistricts = async (req, res) => {
  try {
    const districts = await District.find().populate("city", "name").sort({ name: 1 });
    res.json(districts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDistrictsByCity = async (req, res) => {
  try {
    const districts = await District.find({ city: req.params.cityId }).sort({ name: 1 });
    res.json(districts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateDistrict = async (req, res) => {
  try {
    const district = await District.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!district) return res.status(404).json({ message: "District not found" });
    res.json(district);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteDistrict = async (req, res) => {
  try {
    const district = await District.findByIdAndDelete(req.params.id);
    if (!district) return res.status(404).json({ message: "District not found" });
    res.json({ message: "District deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};