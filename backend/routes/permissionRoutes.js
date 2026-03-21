const express = require("express");
const router = express.Router();
const Permission = require("../models/Permission");

router.get("/", async (req, res) => {
  try {
    const permissions = await Permission.find();
    res.json(permissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
