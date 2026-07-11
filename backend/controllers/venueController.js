const Venue = require("../models/Venue");

const pop = (q) => q.populate("city", "name").populate("district", "name");

const CATEGORY_ENUM = ["VIP", "Premium", "General"];

/* ── Venue CRUD ────────────────────────────────────────── */
exports.addVenue = async (req, res) => {
  try {
    const {
      name, city, district, address, locationLink,
      hasSeating, capacity, amenities,
    } = req.body;

    const venueData = {
      name, city, district, address, locationLink,
      hasSeating: hasSeating === "true" || hasSeating === true,
      capacity: capacity || 0,
      amenities: amenities ? JSON.parse(amenities) : [],
    };

    if (req.files?.images) {
      venueData.images = req.files.images.map((f) => f.path);
    }

    const v = await Venue.create(venueData);
    res.json({ message: "Venue added", venue: await pop(Venue.findById(v._id)) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllVenues = async (req, res) => {
  try {
    const { cityId, districtId } = req.query;
    const filter = {};
    if (cityId)     filter.city     = cityId;
    if (districtId) filter.district = districtId;

    res.json(await pop(Venue.find(filter)).sort({ createdAt: -1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getVenueById = async (req, res) => {
  try {
    const v = await pop(Venue.findById(req.params.id));
    if (!v) return res.status(404).json({ message: "Venue not found" });
    res.json(v);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getVenuesByDistrict = async (req, res) => {
  try {
    res.json(await pop(Venue.find({ district: req.params.districtId })));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateVenue = async (req, res) => {
  try {
    const v = await Venue.findById(req.params.id);
    if (!v) return res.status(404).json({ message: "Venue not found" });

    const {
      name, city, district, address, locationLink,
      hasSeating, capacity, amenities,
    } = req.body;

    if (name)         v.name         = name;
    if (city)         v.city         = city;
    if (district)     v.district     = district;
    if (address)       v.address      = address;
    if (locationLink) v.locationLink = locationLink;
    if (typeof hasSeating !== "undefined") v.hasSeating = hasSeating === "true" || hasSeating === true;
    if (capacity !== undefined) v.capacity = capacity;
    if (amenities) v.amenities = JSON.parse(amenities);

    if (req.files?.images) {
      v.images = req.files.images.map((f) => f.path);
    }

    await v.save();
    res.json({ message: "Venue updated", venue: await pop(Venue.findById(v._id)) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteVenue = async (req, res) => {
  try {
    const v = await Venue.findByIdAndDelete(req.params.id);
    if (!v) return res.status(404).json({ message: "Venue not found" });
    res.json({ message: "Venue deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/* ── Seat Layout (only relevant when hasSeating = true) ──
   GET    /:id/layout          → get layout
   PUT    /:id/layout          → save full layout
   POST   /:id/layout/rows     → add one row
   PUT    /:id/layout/rows/:rId→ update one row
   DELETE /:id/layout/rows/:rId→ delete one row
──────────────────────────────────────────────────────── */
exports.getLayout = async (req, res) => {
  try {
    const v = await Venue.findById(req.params.id);
    if (!v) return res.status(404).json({ message: "Venue not found" });
    res.json({ layout: v.seatLayout, totalSeats: v.totalSeats });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.saveLayout = async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows)) return res.status(400).json({ message: "rows[] required" });

    const v = await Venue.findById(req.params.id);
    if (!v) return res.status(404).json({ message: "Venue not found" });

    v.seatLayout = rows;
    v.totalSeats = rows.reduce((s, r) => s + (Number(r.seats) || 0), 0);
    v.hasSeating = true;
    await v.save();
    res.json({ message: "Layout saved", layout: v.seatLayout, totalSeats: v.totalSeats });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.addRow = async (req, res) => {
  try {
    const { row, seats, category } = req.body;
    if (!row || !seats) return res.status(400).json({ message: "row and seats required" });
    if (category && !CATEGORY_ENUM.includes(category)) {
      return res.status(400).json({ message: `category must be one of ${CATEGORY_ENUM.join(", ")}` });
    }

    const v = await Venue.findById(req.params.id);
    if (!v) return res.status(404).json({ message: "Venue not found" });
    if (v.seatLayout.find((r) => r.row === row)) {
      return res.status(400).json({ message: `Row "${row}" already exists` });
    }

    v.seatLayout.push({ row, seats: Number(seats), category: category || "General" });
    v.totalSeats = v.seatLayout.reduce((s, r) => s + (r.seats || 0), 0);
    v.hasSeating = true;
    await v.save();
    res.json({ message: `Row ${row} added`, layout: v.seatLayout, totalSeats: v.totalSeats });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateRow = async (req, res) => {
  try {
    const { row, seats, category } = req.body;
    const v = await Venue.findById(req.params.id);
    if (!v) return res.status(404).json({ message: "Venue not found" });

    const seatRow = v.seatLayout.id(req.params.rowId);
    if (!seatRow) return res.status(404).json({ message: "Row not found" });

    if (row      !== undefined) seatRow.row      = row;
    if (seats    !== undefined) seatRow.seats     = Number(seats);
    if (category !== undefined) seatRow.category  = category;

    v.totalSeats = v.seatLayout.reduce((s, r) => s + (r.seats || 0), 0);
    await v.save();
    res.json({ message: "Row updated", layout: v.seatLayout, totalSeats: v.totalSeats });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteRow = async (req, res) => {
  try {
    const v = await Venue.findById(req.params.id);
    if (!v) return res.status(404).json({ message: "Venue not found" });

    v.seatLayout = v.seatLayout.filter((r) => r._id.toString() !== req.params.rowId);
    v.totalSeats = v.seatLayout.reduce((s, r) => s + (r.seats || 0), 0);
    await v.save();
    res.json({ message: "Row deleted", layout: v.seatLayout, totalSeats: v.totalSeats });
  } catch (e) { res.status(500).json({ message: e.message }); }
};