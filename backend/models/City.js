const mongoose = require("mongoose");

const CitySchema = new mongoose.Schema({
  logoUrl: String,
  logoPublicId: { type: String, select: false },
  name: {
    type: String,
    required: true,
    unique: true
  },
  country: {
    type: String,
    default: "India"
  }
});

module.exports = mongoose.model("City", CitySchema);