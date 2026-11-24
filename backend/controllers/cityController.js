const City = require("../models/City");
const { cloudinary } = require("../config/cloudinary");

exports.createCity = async (req, res) => {
  try {

    const existing = await City.findOne({ name: req.body.name });

    if (existing) {
      return res.status(400).json({
        message: "City already exists"
      });
    }

    const city = await City.create({
      name: req.body.name
    });

    res.json(city);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCities = async (req, res) => {
  try {

    const cities = await City.find().sort({ name: 1 });

    res.json(cities);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.requireCity = async (req, res, next) => {
  if (!/^[a-f0-9]{24}$/i.test(req.params.id)) {
    return res.status(404).json({ message: "City not found" });
  }
  try {
    const city = await City.exists({ _id: req.params.id });
    if (!city) return res.status(404).json({ message: "City not found" });
    return next();
  } catch (error) {
    return next(error);
  }
};

function removeLogo(publicId) {
  if (!publicId) return;
  cloudinary.uploader.destroy(publicId).catch((error) => {
    console.error("Could not clean up city logo:", error.message);
  });
}

exports.updateLogo = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Choose a logo to upload" });
  const { path: logoUrl, filename: logoPublicId } = req.file;
  try {
    const previous = await City.findByIdAndUpdate(req.params.id, { logoUrl, logoPublicId })
      .select("+logoPublicId");
    if (!previous) {
      removeLogo(logoPublicId);
      return res.status(404).json({ message: "City not found" });
    }
    removeLogo(previous.logoPublicId);
    const city = previous.toObject();
    delete city.logoPublicId;
    return res.json({ ...city, logoUrl });
  } catch (error) {
    removeLogo(logoPublicId);
    return res.status(500).json({ message: "Could not save city logo" });
  }
};
