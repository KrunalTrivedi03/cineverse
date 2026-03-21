const City = require("../models/City");

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
