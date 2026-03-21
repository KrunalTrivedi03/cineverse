const Permission = require("../models/Permission");

exports.createPermission = async (req, res) => {
  try {
    const permission = await Permission.create({ name: req.body.name });
    res.json(permission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
