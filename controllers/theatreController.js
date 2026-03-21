const Theatre = require("../models/Theatre");
const pop = (q) => q.populate("city");

/* ── Theatre CRUD ─────────────────────────────────────── */
exports.addTheatre = async (req, res) => {
  try {
    const t = await Theatre.create(req.body);
    res.json({ message: "Theatre added", theatre: await pop(Theatre.findById(t._id)) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllTheatres = async (req, res) => {
  try { res.json(await pop(Theatre.find()).sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getTheatreById = async (req, res) => {
  try {
    const t = await pop(Theatre.findById(req.params.id));
    if (!t) return res.status(404).json({ message: "Not found" });
    res.json(t);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getTheatresByCity = async (req, res) => {
  try { res.json(await pop(Theatre.find({ city: req.params.cityId }))); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateTheatre = async (req, res) => {
  try {
    const t = await pop(Theatre.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true }));
    if (!t) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Updated", theatre: t });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteTheatre = async (req, res) => {
  try {
    const t = await Theatre.findByIdAndDelete(req.params.id);
    if (!t) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/* ── Screen CRUD ──────────────────────────────────────── */
exports.addScreen = async (req, res) => {
  try {
    const { name, totalSeats } = req.body;
    const t = await pop(Theatre.findByIdAndUpdate(req.params.id, { $push: { screens: { name, totalSeats } } }, { new: true }));
    if (!t) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Screen added", theatre: t });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateScreen = async (req, res) => {
  try {
    const { name, totalSeats } = req.body;
    const t = await Theatre.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Not found" });
    const s = t.screens.id(req.params.screenId);
    if (!s) return res.status(404).json({ message: "Screen not found" });
    if (name       !== undefined) s.name       = name;
    if (totalSeats !== undefined) s.totalSeats = totalSeats;
    await t.save();
    res.json({ message: "Screen updated", theatre: await pop(Theatre.findById(req.params.id)) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteScreen = async (req, res) => {
  try {
    const t = await pop(Theatre.findByIdAndUpdate(req.params.id, { $pull: { screens: { _id: req.params.screenId } } }, { new: true }));
    if (!t) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Screen deleted", theatre: t });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/* ── Seat Layout ──────────────────────────────────────────
   GET    /:id/screens/:screenId/layout          → get layout
   PUT    /:id/screens/:screenId/layout          → save full layout
   POST   /:id/screens/:screenId/layout/rows     → add one row
   PUT    /:id/screens/:screenId/layout/rows/:rId→ update one row
   DELETE /:id/screens/:screenId/layout/rows/:rId→ delete one row
─────────────────────────────────────────────────────────── */
const getScreenOrFail = async (theatreId, screenId) => {
  const t = await Theatre.findById(theatreId);
  if (!t) throw { status: 404, message: "Theatre not found" };
  const s = t.screens.id(screenId);
  if (!s) throw { status: 404, message: "Screen not found" };
  return { theatre: t, screen: s };
};

exports.getLayout = async (req, res) => {
  try {
    const { theatre, screen } = await getScreenOrFail(req.params.id, req.params.screenId);
    res.json({ layout: screen.seatLayout, totalSeats: screen.totalSeats, screenName: screen.name });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

exports.saveLayout = async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows)) return res.status(400).json({ message: "rows[] required" });
    const { theatre, screen } = await getScreenOrFail(req.params.id, req.params.screenId);
    screen.seatLayout = rows;
    screen.totalSeats = rows.reduce((s, r) => s + (Number(r.seats) || 0), 0);
    await theatre.save();
    res.json({ message: "Layout saved", layout: screen.seatLayout, totalSeats: screen.totalSeats });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

exports.addRow = async (req, res) => {
  try {
    const { row, seats, category } = req.body;
    if (!row || !seats) return res.status(400).json({ message: "row and seats required" });
    const { theatre, screen } = await getScreenOrFail(req.params.id, req.params.screenId);
    if (screen.seatLayout.find((r) => r.row === row))
      return res.status(400).json({ message: `Row "${row}" already exists` });
    screen.seatLayout.push({ row, seats: Number(seats), category: category || "Classic" });
    screen.totalSeats = screen.seatLayout.reduce((s, r) => s + (r.seats || 0), 0);
    await theatre.save();
    res.json({ message: `Row ${row} added`, layout: screen.seatLayout, totalSeats: screen.totalSeats });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

exports.updateRow = async (req, res) => {
  try {
    const { row, seats, category } = req.body;
    const { theatre, screen } = await getScreenOrFail(req.params.id, req.params.screenId);
    const seatRow = screen.seatLayout.id(req.params.rowId);
    if (!seatRow) return res.status(404).json({ message: "Row not found" });
    if (row      !== undefined) seatRow.row      = row;
    if (seats    !== undefined) seatRow.seats     = Number(seats);
    if (category !== undefined) seatRow.category  = category;
    screen.totalSeats = screen.seatLayout.reduce((s, r) => s + (r.seats || 0), 0);
    await theatre.save();
    res.json({ message: "Row updated", layout: screen.seatLayout, totalSeats: screen.totalSeats });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

exports.deleteRow = async (req, res) => {
  try {
    const { theatre, screen } = await getScreenOrFail(req.params.id, req.params.screenId);
    screen.seatLayout = screen.seatLayout.filter((r) => r._id.toString() !== req.params.rowId);
    screen.totalSeats = screen.seatLayout.reduce((s, r) => s + (r.seats || 0), 0);
    await theatre.save();
    res.json({ message: "Row deleted", layout: screen.seatLayout, totalSeats: screen.totalSeats });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};