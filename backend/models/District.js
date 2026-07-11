const mongoose = require("mongoose");

const DistrictSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "City",
    required: true,
  },
}, { timestamps: true });

/* Same district name can repeat across different cities, but not within one city */
DistrictSchema.index({ name: 1, city: 1 }, { unique: true });

module.exports = mongoose.model("District", DistrictSchema);