import { useState, useEffect, Fragment } from "react";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  Search, Trash2, Clapperboard, Plus, SlidersHorizontal,
  Loader2, CheckCircle2, AlertCircle, X, MapPin, Monitor,
  Film, Building2, Clock, CalendarDays, IndianRupee,
  Edit, ChevronDown, ChevronUp,
} from "lucide-react";

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmt12 = (t) => {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const isPast = (d) => d && new Date(d) < new Date();

/* ─────────────────────────────────────────
   Toast
───────────────────────────────────────── */
function Toast({ toast, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-[13px] font-medium"
      style={{
        background: toast.type === "success" ? "#f0fdf4" : "#fff1f2",
        color:      toast.type === "success" ? "#16a34a" : "#dc2626",
        border:    `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecdd3"}`,
        fontFamily: "'Outfit', sans-serif",
      }}>
      {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {toast.message}
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

/* ─────────────────────────────────────────
   Confirm Modal
───────────────────────────────────────── */
function ConfirmModal({ title, description, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[340px]" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: "#fff1f2" }}>
          <Trash2 size={18} style={{ color: "#f0545c" }} />
        </div>
        <h3 className="text-[15px] font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-[13px] text-gray-500 mb-5">{description}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
            style={{ background: "#f0545c" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e04048")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f0545c")}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Show Form Modal — Add / Edit
   One doc = movie + theatre + screen + date + showTimes[]
───────────────────────────────────────── */
function ShowFormModal({ mode = "add", initial = null, movies, theatres, onSave, onCancel, saving }) {
  const [form, setForm] = useState(
    mode === "edit" && initial
      ? {
          movie:    initial.movie?._id   || "",
          theatre:  initial.theatre?._id || "",
          screen:   initial.screen       || "",
          showDate: initial.showDate ? initial.showDate.slice(0, 10) : "",
        }
      : { movie: "", theatre: "", screen: "", showDate: "" }
  );

  const [times, setTimes] = useState(
    mode === "edit" && initial?.showTimes?.length
      ? initial.showTimes.map((t) => ({ time: t.time, price: String(t.price) }))
      : [{ time: "", price: "" }]
  );

  const [errors, setErrors] = useState({});

  const selectedTheatre = theatres.find((t) => t._id === form.theatre);
  const screenOptions   = selectedTheatre?.screens || [];

  const set = (field, val) => {
    if (field === "theatre") setForm((p) => ({ ...p, theatre: val, screen: "" }));
    else                     setForm((p) => ({ ...p, [field]: val }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const addTime    = () => setTimes((p) => [...p, { time: "", price: "" }]);
  const removeTime = (i) => setTimes((p) => p.filter((_, idx) => idx !== i));
  const updateTime = (i, field, val) =>
    setTimes((p) => p.map((t, idx) => (idx === i ? { ...t, [field]: val } : t)));

  const validate = () => {
    const e = {};
    if (!form.movie)           e.movie    = "Select a movie";
    if (!form.theatre)         e.theatre  = "Select a theatre";
    if (!form.screen.trim())   e.screen   = "Select a screen";
    if (!form.showDate)        e.showDate = "Select a date";
    times.forEach((t, i) => {
      if (!t.time)                                 e[`tt${i}`] = "Required";
      if (!t.price || isNaN(t.price) || +t.price <= 0) e[`tp${i}`] = "Required";
    });
    if (times.length === 0)    e.times    = "Add at least one show time";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      ...form,
      showTimes: times.map((t) => ({ time: t.time, price: Number(t.price) })),
    });
  };

  const inp = (err) =>
    `w-full px-4 py-2.5 rounded-xl border text-[13px] text-gray-800 placeholder-gray-300 outline-none transition-all ${err ? "border-red-400" : "border-gray-200"}`;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[540px] max-h-[92vh] flex flex-col" style={{ fontFamily: "'Outfit', sans-serif" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(240,84,92,0.08)" }}>
              {mode === "edit" ? <Edit size={18} style={{ color: "#f0545c" }} /> : <Clapperboard size={18} style={{ color: "#f0545c" }} />}
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">{mode === "edit" ? "Edit Show" : "Add New Show"}</h3>
              <p className="text-[12px] text-gray-400">One entry per movie · theatre · screen · date</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-all">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">

          {/* Movie */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Movie <span style={{ color: "#f0545c" }}>*</span>
            </label>
            <div className="relative">
              <Film size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <ChevronDown size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <select value={form.movie} onChange={(e) => set("movie", e.target.value)}
                className={`w-full pl-9 pr-9 py-2.5 rounded-xl border text-[13px] outline-none appearance-none cursor-pointer transition-all ${errors.movie ? "border-red-400" : "border-gray-200"} ${form.movie ? "text-gray-800" : "text-gray-400"}`}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#f0545c")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = errors.movie ? "#f87171" : "#e5e7eb")}>
                <option value="">Select a movie…</option>
                {movies.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
              </select>
            </div>
            {errors.movie && <p className="text-[11px] text-red-500 mt-1">{errors.movie}</p>}
          </div>

          {/* Theatre */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Theatre <span style={{ color: "#f0545c" }}>*</span>
            </label>
            <div className="relative">
              <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <ChevronDown size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <select value={form.theatre} onChange={(e) => set("theatre", e.target.value)}
                className={`w-full pl-9 pr-9 py-2.5 rounded-xl border text-[13px] outline-none appearance-none cursor-pointer transition-all ${errors.theatre ? "border-red-400" : "border-gray-200"} ${form.theatre ? "text-gray-800" : "text-gray-400"}`}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#f0545c")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = errors.theatre ? "#f87171" : "#e5e7eb")}>
                <option value="">Select a theatre…</option>
                {theatres.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}{t.city?.name ? ` — ${t.city.name}` : ""}</option>
                ))}
              </select>
            </div>
            {errors.theatre && <p className="text-[11px] text-red-500 mt-1">{errors.theatre}</p>}
          </div>

          {/* Screen */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Screen <span style={{ color: "#f0545c" }}>*</span>
            </label>
            <div className="relative">
              <Monitor size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <ChevronDown size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <select value={form.screen} onChange={(e) => set("screen", e.target.value)}
                disabled={!form.theatre}
                className={`w-full pl-9 pr-9 py-2.5 rounded-xl border text-[13px] outline-none appearance-none transition-all ${errors.screen ? "border-red-400" : "border-gray-200"} ${form.screen ? "text-gray-800" : "text-gray-400"} ${!form.theatre ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#f0545c")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = errors.screen ? "#f87171" : "#e5e7eb")}>
                <option value="">{form.theatre ? "Select a screen…" : "Select a theatre first"}</option>
                {screenOptions.map((s) => (
                  <option key={s._id || s.name} value={s.name}>{s.name} ({s.totalSeats} seats)</option>
                ))}
              </select>
            </div>
            {errors.screen && <p className="text-[11px] text-red-500 mt-1">{errors.screen}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Show Date <span style={{ color: "#f0545c" }}>*</span>
            </label>
            <div className="relative">
              <CalendarDays size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <input type="date" value={form.showDate} onChange={(e) => set("showDate", e.target.value)}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-[13px] text-gray-800 outline-none transition-all ${errors.showDate ? "border-red-400" : "border-gray-200"}`}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#f0545c")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = errors.showDate ? "#f87171" : "#e5e7eb")}
              />
            </div>
            {errors.showDate && <p className="text-[11px] text-red-500 mt-1">{errors.showDate}</p>}
          </div>

          {/* ── Show Times ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                Show Times <span style={{ color: "#f0545c" }}>*</span>
              </label>
              <button onClick={addTime}
                className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{ color: "#f0545c", background: "rgba(240,84,92,0.08)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(240,84,92,0.14)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(240,84,92,0.08)")}>
                <Plus size={12} /> Add Time
              </button>
            </div>

            {errors.times && <p className="text-[11px] text-red-500 mb-2">{errors.times}</p>}

            <div className="flex flex-col gap-2">
              {times.map((slot, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 bg-gray-50">
                  {/* Slot number */}
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white" style={{ background: "#f0545c" }}>
                    {i + 1}
                  </div>

                  {/* Time */}
                  <div className="flex-1">
                    <div className="relative">
                      <Clock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                      <input type="time" value={slot.time}
                        onChange={(e) => updateTime(i, "time", e.target.value)}
                        className={`w-full pl-8 pr-3 py-2 rounded-lg border text-[12.5px] text-gray-800 outline-none bg-white transition-all ${errors[`tt${i}`] ? "border-red-400" : "border-gray-200"}`}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#f0545c")}
                        onBlur={(e)  => (e.currentTarget.style.borderColor = errors[`tt${i}`] ? "#f87171" : "#e5e7eb")}
                      />
                    </div>
                    {errors[`tt${i}`] && <p className="text-[10px] text-red-500 mt-0.5">{errors[`tt${i}`]}</p>}
                  </div>

                  {/* Price */}
                  <div className="w-28">
                    <div className="relative">
                      <IndianRupee size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                      <input type="number" min="1" placeholder="Price"
                        value={slot.price}
                        onChange={(e) => updateTime(i, "price", e.target.value)}
                        className={`w-full pl-7 pr-3 py-2 rounded-lg border text-[12.5px] text-gray-800 placeholder-gray-300 outline-none bg-white transition-all ${errors[`tp${i}`] ? "border-red-400" : "border-gray-200"}`}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#f0545c")}
                        onBlur={(e)  => (e.currentTarget.style.borderColor = errors[`tp${i}`] ? "#f87171" : "#e5e7eb")}
                      />
                    </div>
                    {errors[`tp${i}`] && <p className="text-[10px] text-red-500 mt-0.5">{errors[`tp${i}`]}</p>}
                  </div>

                  {/* Remove */}
                  {times.length > 1 && (
                    <button onClick={() => removeTime(i)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                      style={{ background: "#fff1f2" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff1f2")}>
                      <X size={12} style={{ color: "#f0545c" }} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-[11px] text-gray-400 mt-2">
              Each time slot can have its own price (e.g. morning shows cheaper than evening).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#f0545c" }}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "#e04048"; }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f0545c")}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : mode === "edit" ? <Edit size={14} /> : <Plus size={14} />}
            {mode === "edit" ? "Save Changes" : "Schedule Show"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Expanded Times Row
───────────────────────────────────────── */
function TimesRow({ showId, showTimes, onRemoveTime }) {
  return (
    <tr>
      <td colSpan={7} className="px-4 pb-3 pt-0 bg-gray-50/50">
        <div className="ml-12 py-2 flex flex-wrap gap-2">
          {showTimes.length === 0 ? (
            <span className="text-[12px] text-gray-400 italic">No times</span>
          ) : (
            showTimes.map((t) => (
              <div key={t._id}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-100 bg-white text-[12px]">
                <Clock size={11} style={{ color: "#f0545c" }} />
                <span className="font-semibold text-gray-700">{fmt12(t.time)}</span>
                <span className="text-gray-300">·</span>
                <span className="text-gray-500 flex items-center gap-0.5">
                  <IndianRupee size={10} />{t.price}
                </span>
                <button
                  onClick={() => onRemoveTime(showId, t._id)}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 rounded flex items-center justify-center hover:bg-red-50"
                  title="Remove this time slot">
                  <X size={10} style={{ color: "#f0545c" }} />
                </button>
              </div>
            ))
          )}
        </div>
      </td>
    </tr>
  );
}

/* ─────────────────────────────────────────
   Action Button
───────────────────────────────────────── */
const COLOR_MAP = {
  red:  { bg: "#fff1f2", text: "#dc2626", hover: "#fee2e2" },
  blue: { bg: "#eff6ff", text: "#2563eb", hover: "#dbeafe" },
  gray: { bg: "#f9fafb", text: "#6b7280", hover: "#f3f4f6" },
};
function ActionBtn({ onClick, color, title, children, disabled }) {
  const c = COLOR_MAP[color];
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-40"
      style={{ background: c.bg, color: c.text }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = c.hover; }}
      onMouseLeave={(e) => (e.currentTarget.style.background = c.bg)}>
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function AdminShows() {
  const [shows, setShows]               = useState([]);
  const [movies, setMovies]             = useState([]);
  const [theatres, setTheatres]         = useState([]);
  const [search, setSearch]             = useState("");
  const [filterMovie, setFilterMovie]   = useState("");
  const [filterCity, setFilterCity]     = useState("");
  const [sortBy, setSortBy]             = useState("date_asc");
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [deletingId, setDeletingId]     = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editShow, setEditShow]         = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);   // { type: "show"|"time", showId, timeId? }
  const [expandedId, setExpandedId]     = useState(null);
  const [toast, setToast]               = useState(null);

  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  /* ── Fetch ── */
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [sRes, mRes, tRes] = await Promise.all([
        axiosAdmin.get("/shows"),
        axiosAdmin.get("/admin/movies"),
        axiosAdmin.get("/theatres"),
      ]);
      setShows(sRes.data);
      setMovies(mRes.data);
      setTheatres(tRes.data);
    } catch {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  /* ── Derived ── */
  const cities = [...new Map(
    theatres.filter((t) => t.city).map((t) => [t.city._id, t.city])
  ).values()];

  const filtered = shows
    .filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        s.movie?.title?.toLowerCase().includes(q) ||
        s.theatre?.name?.toLowerCase().includes(q) ||
        s.screen?.toLowerCase().includes(q);
      const matchMovie = filterMovie ? s.movie?._id === filterMovie : true;
      const matchCity  = filterCity  ? s.theatre?.city?._id === filterCity : true;
      return matchSearch && matchMovie && matchCity;
    })
    .sort((a, b) => {
      if (sortBy === "date_asc")  return new Date(a.showDate) - new Date(b.showDate);
      if (sortBy === "date_desc") return new Date(b.showDate) - new Date(a.showDate);
      if (sortBy === "movie")     return (a.movie?.title || "").localeCompare(b.movie?.title || "");
      return 0;
    });

  const upcoming     = shows.filter((s) => !isPast(s.showDate)).length;
  const past         = shows.filter((s) =>  isPast(s.showDate)).length;
  const totalSlots   = shows.reduce((acc, s) => acc + (s.showTimes?.length || 0), 0);

  /* ── Create ── */
  const handleCreate = async (data) => {
    try {
      setSaving(true);
      const res = await axiosAdmin.post("/shows/admin/create", data);
      setShows((prev) => [res.data.show, ...prev]);
      setShowAddModal(false);
      showToast("Show scheduled successfully");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create show", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── Update ── */
  const handleUpdate = async (data) => {
    if (!editShow) return;
    try {
      setSaving(true);
      const res = await axiosAdmin.put(`/shows/admin/update/${editShow._id}`, data);
      setShows((prev) => prev.map((s) => (s._id === editShow._id ? res.data.show : s)));
      setEditShow(null);
      showToast("Show updated successfully");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update show", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete entire show ── */
  const handleDeleteShow = async () => {
    const { showId } = confirmDelete;
    try {
      setDeletingId(showId);
      await axiosAdmin.delete(`/shows/admin/delete/${showId}`);
      setShows((prev) => prev.filter((s) => s._id !== showId));
      showToast("Show deleted");
    } catch {
      showToast("Failed to delete show", "error");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  /* ── Remove single time slot ── */
  const handleRemoveTime = (showId, timeId) => {
    setConfirmDelete({ type: "time", showId, timeId });
  };

  const handleDeleteTime = async () => {
    const { showId, timeId } = confirmDelete;
    try {
      const res = await axiosAdmin.delete(`/shows/admin/${showId}/times/${timeId}`);
      setShows((prev) => prev.map((s) => (s._id === showId ? res.data.show : s)));
      showToast("Time slot removed");
    } catch {
      showToast("Failed to remove time slot", "error");
    } finally {
      setConfirmDelete(null);
    }
  };

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-8" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Shows</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Schedule shows with multiple time slots per day</p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all active:scale-[0.98] self-start sm:self-auto"
            style={{ background: "#f0545c" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#d94048")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f0545c")}>
            <Plus size={15} /> Add Show
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Shows",  value: shows.length,  color: "#6366f1", bg: "rgba(99,102,241,0.08)"  },
            { label: "Upcoming",     value: upcoming,      color: "#10b981", bg: "rgba(16,185,129,0.08)"  },
            { label: "Past Shows",   value: past,          color: "#f59e0b", bg: "rgba(245,158,11,0.08)"  },
            { label: "Time Slots",   value: totalSlots,    color: "#f0545c", bg: "rgba(240,84,92,0.08)"   },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-[26px] font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex-1 min-w-[200px]">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input type="text" placeholder="Search movie, theatre, screen..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-[13px] text-gray-900 outline-none bg-transparent placeholder-gray-400"
            />
            {search && <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500 text-[11px] font-medium">Clear</button>}
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
            <Film size={14} className="text-gray-400 flex-shrink-0" />
            <select value={filterMovie} onChange={(e) => setFilterMovie(e.target.value)}
              className="outline-none bg-transparent text-[13px] text-gray-700 cursor-pointer max-w-[140px]">
              <option value="">All Movies</option>
              {movies.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
            <MapPin size={14} className="text-gray-400 flex-shrink-0" />
            <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)}
              className="outline-none bg-transparent text-[13px] text-gray-700 cursor-pointer">
              <option value="">All Cities</option>
              {cities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
            <SlidersHorizontal size={14} className="text-gray-400 flex-shrink-0" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="outline-none bg-transparent text-[13px] text-gray-700 cursor-pointer">
              <option value="date_asc">Date: Earliest</option>
              <option value="date_desc">Date: Latest</option>
              <option value="movie">Movie A → Z</option>
            </select>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["#", "Movie", "Theatre & Screen", "Date", "Time Slots", "Status", "Actions"].map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-4 px-4"><div className="h-4 w-6 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-gray-100 rounded-xl animate-pulse flex-shrink-0" /><div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse" /></div></td>
                    <td className="py-4 px-4"><div className="h-4 w-36 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="flex gap-1">{[1,2,3].map((j) => <div key={j} className="h-6 w-16 bg-gray-100 rounded-lg animate-pulse" />)}</div></td>
                    <td className="py-4 px-4"><div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="flex gap-1.5">{[1,2,3].map((j) => <div key={j} className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse" />)}</div></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(240,84,92,0.08)" }}>
                      <Clapperboard size={22} style={{ color: "#f0545c" }} />
                    </div>
                    <p className="text-[14px] font-semibold text-gray-400">No shows found</p>
                    <p className="text-[12px] text-gray-300 mt-0.5">
                      {search || filterMovie || filterCity ? "Try adjusting your filters" : "Schedule your first show to get started"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((show, index) => (
                  <Fragment key={show._id}>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">

                      {/* # */}
                      <td className="py-4 px-4 text-[13px] text-gray-400 font-medium w-10">{index + 1}</td>

                      {/* Movie */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(240,84,92,0.08)" }}>
                            <Film size={15} style={{ color: "#f0545c" }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 truncate max-w-[140px]">
                              {show.movie?.title || "—"}
                            </p>
                            {show.theatre?.city?.name && (
                              <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                                <MapPin size={9} />{show.theatre.city.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Theatre & Screen */}
                      <td className="py-4 px-4">
                        <p className="text-[12.5px] font-semibold text-gray-700 truncate max-w-[160px]">
                          {show.theatre?.name || "—"}
                        </p>
                        <span className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                          <Monitor size={10} style={{ color: "#f0545c" }} />{show.screen || "—"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4">
                        <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-700">
                          <CalendarDays size={12} style={{ color: "#6366f1" }} />
                          {fmtDate(show.showDate)}
                        </p>
                      </td>

                      {/* Time slots preview */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(show.showTimes || []).slice(0, 3).map((t) => (
                            <span key={t._id}
                              className="text-[11px] font-semibold px-2 py-0.5 rounded-md border border-gray-100 bg-gray-50 text-gray-600 whitespace-nowrap">
                              {fmt12(t.time)}
                            </span>
                          ))}
                          {show.showTimes?.length > 3 && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md border border-gray-100 bg-gray-50 text-gray-400">
                              +{show.showTimes.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {isPast(show.showDate) ? (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">Completed</span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Upcoming</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <ActionBtn onClick={() => toggleExpand(show._id)} color="gray"
                            title={expandedId === show._id ? "Hide times" : "View times"}>
                            {expandedId === show._id ? <ChevronUp size={14} /> : <Clock size={14} />}
                          </ActionBtn>
                          <ActionBtn onClick={() => setEditShow(show)} color="blue" title="Edit show">
                            <Edit size={14} />
                          </ActionBtn>
                          <ActionBtn
                            onClick={() => setConfirmDelete({ type: "show", showId: show._id })}
                            disabled={deletingId === show._id}
                            color="red" title="Delete show">
                            {deletingId === show._id
                              ? <Loader2 size={14} className="animate-spin" />
                              : <Trash2 size={14} />}
                          </ActionBtn>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded time slots */}
                    {expandedId === show._id && (
                      <TimesRow
                        showId={show._id}
                        showTimes={show.showTimes || []}
                        onRemoveTime={handleRemoveTime}
                      />
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>

          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50">
              <p className="text-[12px] text-gray-400">
                Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of{" "}
                <span className="font-semibold text-gray-600">{shows.length}</span> shows
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Modal ── */}
      {showAddModal && (
        <ShowFormModal mode="add" movies={movies} theatres={theatres}
          onSave={handleCreate} onCancel={() => setShowAddModal(false)} saving={saving} />
      )}

      {/* ── Edit Modal ── */}
      {editShow && (
        <ShowFormModal mode="edit" initial={editShow} movies={movies} theatres={theatres}
          onSave={handleUpdate} onCancel={() => setEditShow(null)} saving={saving} />
      )}

      {/* ── Confirm (show delete) ── */}
      {confirmDelete?.type === "show" && (
        <ConfirmModal
          title="Delete Show"
          description="This will permanently delete all time slots for this show date."
          onConfirm={handleDeleteShow}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ── Confirm (time slot delete) ── */}
      {confirmDelete?.type === "time" && (
        <ConfirmModal
          title="Remove Time Slot"
          description="This time slot will be permanently removed from this show."
          onConfirm={handleDeleteTime}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}


