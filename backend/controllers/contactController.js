const ContactMessage = require("../models/ContactMessage");

/* ── public ──────────────────────────────────────────────── */

// POST /api/contact
exports.submitContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "Name, email, subject, and message are required" });
    }

    const contactMessage = await ContactMessage.create({
      name,
      email,
      phone,
      subject,
      message,
    });

    res.status(201).json({
      message: "Your message has been received. We'll get back to you soon!",
      contactMessage,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── admin ───────────────────────────────────────────────── */

// GET /api/contact/admin/all
exports.getAllContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/contact/admin/:id/status
exports.updateContactMessageStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["new", "read", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const contactMessage = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!contactMessage) return res.status(404).json({ message: "Contact message not found" });

    res.json({ message: "Status updated successfully", contactMessage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};