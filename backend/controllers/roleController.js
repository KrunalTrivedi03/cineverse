const Role = require("../models/Role");

exports.createRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;

    const role = await Role.create({
      name,
      permissions
    });

    res.json(role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
