import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  Search, Trash2, Building2, Plus, SlidersHorizontal,
  Loader2, CheckCircle2, AlertCircle, X, MapPin, Monitor,
  ExternalLink, ChevronUp, Edit, Check, ChevronDown,
} from "lucide-react";

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
   Theatre Form Modal  (Add + Edit)
───────────────────────────────────────── */
function TheatreFormModal({ mode = "add", initial = null, cities, onSave, onCancel, saving }) {
  const [form, setForm] = useState(
    mode === "edit" && initial
      ? { name: initial.name || "", city: initial.city?._id || "", address: initial.address || "", locationLink: initial.locationLink || "" }
      : { name: "", city: "", address: "", locationLink: "" }
  );
  const [screens, setScreens] = useState(
    mode === "edit" && initial?.screens?.length
      ? initial.screens.map((s) => ({ name: s.name, totalSeats: String(s.totalSeats) }))
      : [{ name: "", totalSeats: "" }]
  );
  const [errors, setErrors] = useState({});

  const set = (field, val) => {
    setForm((p) => ({ ...p, [field]: val }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };
  const addScreen    = () => setScreens((p) => [...p, { name: "", totalSeats: "" }]);
  const removeScreen = (i) => setScreens((p) => p.filter((_, idx) => idx !== i));
  const updateScreen = (i, field, val) => setScreens((p) => p.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Theatre name is required";
    if (!form.city)        e.city = "Please select a city";
    screens.forEach((s, i) => {
      if (!s.name.trim())                                    e[`sn${i}`] = "Required";
      if (!s.totalSeats || isNaN(s.totalSeats) || +s.totalSeats <= 0) e[`ss${i}`] = "Required";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({ ...form, screens: screens.map((s) => ({ name: s.name.trim(), totalSeats: Number(s.totalSeats) })) });
  };

  const inp = "w-full px-4 py-2.5 rounded-xl border text-[13px] text-gray-800 placeholder-gray-300 outline-none transition-all";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[520px] max-h-[90vh] flex flex-col" style={{ fontFamily: "'Outfit', sans-serif" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(240,84,92,0.08)" }}>
              {mode === "edit" ? <Edit size={18} style={{ color: "#f0545c" }} /> : <Building2 size={18} style={{ color: "#f0545c" }} />}
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">{mode === "edit" ? "Edit Theatre" : "Add New Theatre"}</h3>
              <p className="text-[12px] text-gray-400">{mode === "edit" ? "Update theatre details" : "Fill in the details below"}</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-all">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Theatre Name <span style={{ color: "#f0545c" }}>*</span></label>
            <input type="text" placeholder="e.g. PVR Phoenix Mall" value={form.name} onChange={(e) => set("name", e.target.value)}
              className={inp} style={{ borderColor: errors.name ? "#f0545c" : "#e5e7eb" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#f0545c")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = errors.name ? "#f0545c" : "#e5e7eb")} />
            {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* City */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">City <span style={{ color: "#f0545c" }}>*</span></label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <select value={form.city} onChange={(e) => set("city", e.target.value)}
                className={inp + " pl-9 appearance-none cursor-pointer"}
                style={{ borderColor: errors.city ? "#f0545c" : "#e5e7eb", color: form.city ? "#1f2937" : "#9ca3af" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#f0545c")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = errors.city ? "#f0545c" : "#e5e7eb")}>
                <option value="">Select a city…</option>
                {cities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            {errors.city && <p className="text-[11px] text-red-500 mt-1">{errors.city}</p>}
          </div>

          {/* Address */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Address</label>
            <input type="text" placeholder="e.g. 4th Floor, Phoenix Palassio" value={form.address}
              onChange={(e) => set("address", e.target.value)} className={inp} style={{ borderColor: "#e5e7eb" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#f0545c")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#e5e7eb")} />
          </div>

          {/* Location Link */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Google Maps Link</label>
            <input type="url" placeholder="https://maps.google.com/…" value={form.locationLink}
              onChange={(e) => set("locationLink", e.target.value)} className={inp} style={{ borderColor: "#e5e7eb" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#f0545c")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#e5e7eb")} />
          </div>

          {/* Screens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Screens <span style={{ color: "#f0545c" }}>*</span></label>
              <button onClick={addScreen}
                className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{ color: "#f0545c", background: "rgba(240,84,92,0.08)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(240,84,92,0.14)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(240,84,92,0.08)")}>
                <Plus size={12} /> Add Screen
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {screens.map((screen, i) => (
                <div key={i} className="flex gap-2 items-start p-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-1.5 text-[11px] font-bold text-white" style={{ background: "#f0545c" }}>{i + 1}</div>
                  <div className="flex-1 flex gap-2">
                    <div className="flex-1">
                      <input type="text" placeholder="Screen name (e.g. Audi 1)" value={screen.name}
                        onChange={(e) => updateScreen(i, "name", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border text-[12.5px] text-gray-800 placeholder-gray-300 outline-none bg-white transition-all"
                        style={{ borderColor: errors[`sn${i}`] ? "#f0545c" : "#e5e7eb" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#f0545c")}
                        onBlur={(e)  => (e.currentTarget.style.borderColor = errors[`sn${i}`] ? "#f0545c" : "#e5e7eb")} />
                      {errors[`sn${i}`] && <p className="text-[10px] text-red-500 mt-0.5">{errors[`sn${i}`]}</p>}
                    </div>
                    <div className="w-28">
                      <input type="number" placeholder="Seats" value={screen.totalSeats} min="1"
                        onChange={(e) => updateScreen(i, "totalSeats", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border text-[12.5px] text-gray-800 placeholder-gray-300 outline-none bg-white transition-all"
                        style={{ borderColor: errors[`ss${i}`] ? "#f0545c" : "#e5e7eb" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#f0545c")}
                        onBlur={(e)  => (e.currentTarget.style.borderColor = errors[`ss${i}`] ? "#f0545c" : "#e5e7eb")} />
                      {errors[`ss${i}`] && <p className="text-[10px] text-red-500 mt-0.5">{errors[`ss${i}`]}</p>}
                    </div>
                  </div>
                  {screens.length > 1 && (
                    <button onClick={() => removeScreen(i)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center mt-1 flex-shrink-0 transition-all"
                      style={{ background: "#fff1f2" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff1f2")}>
                      <X size={12} style={{ color: "#f0545c" }} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#f0545c" }}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "#e04048"; }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f0545c")}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : mode === "edit" ? <Edit size={14} /> : <Plus size={14} />}
            {mode === "edit" ? "Save Changes" : "Add Theatre"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Inline Screen Manager Row
───────────────────────────────────────── */
function ScreensManagerRow({ theatre, onScreenAdd, onScreenEdit, onScreenDelete, onSeatLayout }) {
  const [addForm, setAddForm]       = useState({ name: "", totalSeats: "" });
  const [addErrors, setAddErrors]   = useState({});
  const [addingScreen, setAdding]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [editForm, setEditForm]     = useState({});
  const [savingId, setSavingId]     = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmScreen, setConfirmScreen] = useState(null);

  const validateAdd = () => {
    const e = {};
    if (!addForm.name.trim()) e.name = "Required";
    if (!addForm.totalSeats || isNaN(addForm.totalSeats) || +addForm.totalSeats <= 0) e.totalSeats = "Required";
    setAddErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validateAdd()) return;
    setAdding(true);
    await onScreenAdd(theatre._id, { name: addForm.name.trim(), totalSeats: Number(addForm.totalSeats) });
    setAddForm({ name: "", totalSeats: "" });
    setAdding(false);
  };

  const startEdit = (screen) => {
    setEditingId(screen._id);
    setEditForm({ name: screen.name, totalSeats: String(screen.totalSeats) });
  };

  const handleSaveEdit = async (screenId) => {
    if (!editForm.name?.trim() || !editForm.totalSeats || +editForm.totalSeats <= 0) return;
    setSavingId(screenId);
    await onScreenEdit(theatre._id, screenId, { name: editForm.name.trim(), totalSeats: Number(editForm.totalSeats) });
    setEditingId(null);
    setSavingId(null);
  };

  const handleDelete = async () => {
    if (!confirmScreen) return;
    setDeletingId(confirmScreen._id);
    await onScreenDelete(theatre._id, confirmScreen._id);
    setDeletingId(null);
    setConfirmScreen(null);
  };

  const rowInp = "px-2.5 py-1.5 rounded-lg border border-gray-200 text-[12.5px] text-gray-800 outline-none bg-white transition-all focus:border-[#f0545c]";

  return (
    <>
      <tr>
        <td colSpan={6} className="px-4 pb-4 pt-1 bg-gray-50/60">
          <div className="ml-12">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Monitor size={11} style={{ color: "#f0545c" }} /> Screens
            </p>

            <div className="flex flex-col gap-1.5 mb-3">
              {theatre.screens?.length === 0 && (
                <p className="text-[12px] text-gray-400 italic">No screens yet — add one below.</p>
              )}

              {theatre.screens?.map((screen) => (
                <div key={screen._id}
                  className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 group">

                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white"
                    style={{ background: "#f0545c" }}>
                    <Monitor size={11} />
                  </div>

                  {editingId === screen._id ? (
                    <>
                      <input value={editForm.name}
                        onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Screen name"
                        className={rowInp + " flex-1 min-w-0"} />
                      <input type="number" value={editForm.totalSeats} min="1"
                        onChange={(e) => setEditForm((p) => ({ ...p, totalSeats: e.target.value }))}
                        placeholder="Seats"
                        className={rowInp + " w-24"} />
                      <button onClick={() => handleSaveEdit(screen._id)} disabled={savingId === screen._id}
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
                        style={{ background: "#f0fdf4", color: "#16a34a" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#dcfce7")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#f0fdf4")}>
                        {savingId === screen._id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ background: "#f9fafb", color: "#6b7280" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#f9fafb")}>
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-[13px] font-semibold text-gray-800">{screen.name}</span>
                      <span className="text-[12px] text-gray-400 flex items-center gap-1">
                        <Monitor size={10} /> {screen.totalSeats} seats
                      </span>

                      {/* ── Seat Layout button ── */}
                      <button
                        onClick={() => onSeatLayout(screen._id)}
                        title="Manage seat layout"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                        style={{ background: "rgba(240,84,92,0.08)", color: "#f0545c" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(240,84,92,0.16)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(240,84,92,0.08)")}>
                        <Monitor size={11} /> Layout
                      </button>

                      {/* Edit btn */}
                      <button onClick={() => startEdit(screen)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                        style={{ background: "#eff6ff", color: "#2563eb" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#dbeafe")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#eff6ff")}>
                        <Edit size={12} />
                      </button>

                      {/* Delete btn */}
                      <button onClick={() => setConfirmScreen(screen)}
                        disabled={deletingId === screen._id}
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-40"
                        style={{ background: "#fff1f2", color: "#dc2626" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#fff1f2")}>
                        {deletingId === screen._id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <Trash2 size={12} />}
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* ── Add new screen inline ── */}
            <div className="flex items-start gap-2 p-3 rounded-xl border border-dashed border-gray-200 bg-white">
              <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-1 text-[11px] font-bold"
                style={{ background: "rgba(240,84,92,0.08)", color: "#f0545c" }}>
                <Plus size={12} />
              </div>
              <div className="flex-1">
                <input type="text" placeholder="New screen name (e.g. Audi 3)"
                  value={addForm.name}
                  onChange={(e) => { setAddForm((p) => ({ ...p, name: e.target.value })); setAddErrors((p) => ({ ...p, name: "" })); }}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className={`w-full px-3 py-1.5 rounded-lg border text-[12.5px] text-gray-800 placeholder-gray-300 outline-none bg-gray-50 transition-all ${addErrors.name ? "border-red-400" : "border-gray-200"} focus:border-[#f0545c] focus:bg-white`}
                />
                {addErrors.name && <p className="text-[10px] text-red-500 mt-0.5">{addErrors.name}</p>}
              </div>
              <div className="w-24">
                <input type="number" placeholder="Seats" min="1"
                  value={addForm.totalSeats}
                  onChange={(e) => { setAddForm((p) => ({ ...p, totalSeats: e.target.value })); setAddErrors((p) => ({ ...p, totalSeats: "" })); }}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className={`w-full px-3 py-1.5 rounded-lg border text-[12.5px] text-gray-800 placeholder-gray-300 outline-none bg-gray-50 transition-all ${addErrors.totalSeats ? "border-red-400" : "border-gray-200"} focus:border-[#f0545c] focus:bg-white`}
                />
                {addErrors.totalSeats && <p className="text-[10px] text-red-500 mt-0.5">{addErrors.totalSeats}</p>}
              </div>
              <button onClick={handleAdd} disabled={addingScreen}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-all flex-shrink-0 disabled:opacity-50 mt-0.5"
                style={{ background: "#f0545c" }}
                onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "#e04048"; }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#f0545c")}>
                {addingScreen ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Add
              </button>
            </div>
          </div>
        </td>
      </tr>

      {confirmScreen && (
        <ConfirmModal
          title="Delete Screen"
          description={`Remove "${confirmScreen.name}" (${confirmScreen.totalSeats} seats) from ${theatre.name}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmScreen(null)}
        />
      )}
    </>
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
export default function AdminTheatres() {
  const navigate = useNavigate();

  const [theatres, setTheatres]             = useState([]);
  const [cities, setCities]                 = useState([]);
  const [search, setSearch]                 = useState("");
  const [filterCity, setFilterCity]         = useState("");
  const [sortBy, setSortBy]                 = useState("newest");
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [deletingId, setDeletingId]         = useState(null);
  const [showAddModal, setShowAddModal]     = useState(false);
  const [editTheatre, setEditTheatre]       = useState(null);
  const [confirmTheatre, setConfirmTheatre] = useState(null);
  const [expandedId, setExpandedId]         = useState(null);
  const [toast, setToast]                   = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  /* ── Fetch ── */
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [tRes, cRes] = await Promise.all([axiosAdmin.get("/theatres"), axiosAdmin.get("/cities")]);
      setTheatres(tRes.data);
      setCities(cRes.data);
    } catch {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const updateTheatreInState = (updated) =>
    setTheatres((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));

  /* ── Filter + Sort ── */
  const filtered = theatres
    .filter((t) => {
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.city?.name?.toLowerCase().includes(search.toLowerCase());
      const matchCity = filterCity ? t.city?._id === filterCity : true;
      return matchSearch && matchCity;
    })
    .sort((a, b) => {
      if (sortBy === "newest")  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === "oldest")  return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === "az")      return a.name.localeCompare(b.name);
      if (sortBy === "za")      return b.name.localeCompare(a.name);
      if (sortBy === "screens") return (b.screens?.length || 0) - (a.screens?.length || 0);
      return 0;
    });

  const totalScreens = theatres.reduce((s, t) => s + (t.screens?.length || 0), 0);
  const totalSeats   = theatres.reduce((s, t) => s + (t.screens?.reduce((ss, sc) => ss + (sc.totalSeats || 0), 0) || 0), 0);
  const uniqueCities = new Set(theatres.map((t) => t.city?._id)).size;

  /* ── Theatre CRUD ── */
  const handleCreate = async (data) => {
    try {
      setSaving(true);
      const res = await axiosAdmin.post("/theatres/admin/create", data);
      setTheatres((prev) => [res.data.theatre, ...prev]);
      setShowAddModal(false);
      showToast(`"${res.data.theatre.name}" added successfully`);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add theatre", "error");
    } finally { setSaving(false); }
  };

  const handleUpdate = async (data) => {
    if (!editTheatre) return;
    try {
      setSaving(true);
      const res = await axiosAdmin.put(`/theatres/admin/update/${editTheatre._id}`, data);
      updateTheatreInState(res.data.theatre);
      setEditTheatre(null);
      showToast(`"${res.data.theatre.name}" updated successfully`);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update theatre", "error");
    } finally { setSaving(false); }
  };

  const handleDeleteTheatre = async () => {
    if (!confirmTheatre) return;
    try {
      setDeletingId(confirmTheatre._id);
      await axiosAdmin.delete(`/theatres/admin/delete/${confirmTheatre._id}`);
      setTheatres((prev) => prev.filter((t) => t._id !== confirmTheatre._id));
      showToast(`"${confirmTheatre.name}" deleted`);
    } catch {
      showToast("Failed to delete theatre", "error");
    } finally { setDeletingId(null); setConfirmTheatre(null); }
  };

  /* ── Screen CRUD ── */
  const handleScreenAdd = async (theatreId, data) => {
    try {
      const res = await axiosAdmin.post(`/theatres/admin/${theatreId}/screens`, data);
      updateTheatreInState(res.data.theatre);
      showToast(`Screen "${data.name}" added`);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add screen", "error");
    }
  };

  const handleScreenEdit = async (theatreId, screenId, data) => {
    try {
      const res = await axiosAdmin.put(`/theatres/admin/${theatreId}/screens/${screenId}`, data);
      updateTheatreInState(res.data.theatre);
      showToast("Screen updated");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update screen", "error");
    }
  };

  const handleScreenDelete = async (theatreId, screenId) => {
    try {
      const res = await axiosAdmin.delete(`/theatres/admin/${theatreId}/screens/${screenId}`);
      updateTheatreInState(res.data.theatre);
      showToast("Screen deleted");
    } catch {
      showToast("Failed to delete screen", "error");
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
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Theatres</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Manage theatres and their screens</p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all active:scale-[0.98] self-start sm:self-auto"
            style={{ background: "#f0545c" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#d94048")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f0545c")}>
            <Plus size={15} /> Add Theatre
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Theatres", value: theatres.length,             color: "#6366f1" },
            { label: "Cities Covered", value: uniqueCities,                color: "#10b981" },
            { label: "Total Screens",  value: totalScreens,                color: "#f59e0b" },
            { label: "Total Seats",    value: totalSeats.toLocaleString(), color: "#f0545c" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-[26px] font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex-1 min-w-0">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input type="text" placeholder="Search theatres or cities..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-[13px] text-gray-900 outline-none bg-transparent placeholder-gray-400" />
            {search && <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500 text-[11px] font-medium flex-shrink-0">Clear</button>}
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
            <MapPin size={14} className="text-gray-400" />
            <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)}
              className="outline-none bg-transparent text-[13px] text-gray-700 cursor-pointer">
              <option value="">All Cities</option>
              {cities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="outline-none bg-transparent text-[13px] text-gray-700 cursor-pointer">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
              <option value="screens">Most Screens</option>
            </select>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["#", "Theatre", "City", "Screens", "Address", "Actions"].map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-4 px-4"><div className="h-4 w-6 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-gray-100 rounded-xl animate-pulse flex-shrink-0" /><div className="h-3.5 w-36 bg-gray-100 rounded animate-pulse" /></div></td>
                    <td className="py-4 px-4"><div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-32 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="flex gap-1.5">{[1,2,3].map((j) => <div key={j} className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse" />)}</div></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(240,84,92,0.08)" }}>
                      <Building2 size={22} style={{ color: "#f0545c" }} />
                    </div>
                    <p className="text-[14px] font-semibold text-gray-400">No theatres found</p>
                    <p className="text-[12px] text-gray-300 mt-0.5">
                      {search || filterCity ? "Try adjusting your filters" : "Add your first theatre to get started"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((theatre, index) => (
                  <Fragment key={theatre._id}>
                    <tr className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${expandedId === theatre._id ? "bg-gray-50/60" : ""}`}>
                      <td className="py-4 px-4 text-[13px] text-gray-400 font-medium w-10">{index + 1}</td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(240,84,92,0.08)" }}>
                            <Building2 size={16} style={{ color: "#f0545c" }} />
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-gray-900">{theatre.name}</p>
                            {theatre.locationLink && (
                              <a href={theatre.locationLink} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-600 transition-colors mt-0.5">
                                <ExternalLink size={10} /> Maps
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {theatre.city ? (
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit" style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1" }}>
                            <MapPin size={10} />{theatre.city.name}
                          </span>
                        ) : <span className="text-gray-300 text-[13px]">—</span>}
                      </td>

                      <td className="py-4 px-4">
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit" style={{ background: "rgba(245,158,11,0.08)", color: "#d97706" }}>
                          <Monitor size={10} />
                          {theatre.screens?.length || 0} screen{theatre.screens?.length !== 1 ? "s" : ""}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <p className="text-[12px] text-gray-400 truncate max-w-[160px]">
                          {theatre.address || <span className="italic text-gray-300">No address</span>}
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleExpand(theatre._id)}
                            title="Manage screens"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                            style={{
                              background: expandedId === theatre._id ? "rgba(240,84,92,0.08)" : "#f9fafb",
                              color:      expandedId === theatre._id ? "#f0545c" : "#6b7280",
                            }}
                            onMouseEnter={(e) => { if (expandedId !== theatre._id) e.currentTarget.style.background = "#f3f4f6"; }}
                            onMouseLeave={(e) => { if (expandedId !== theatre._id) e.currentTarget.style.background = "#f9fafb"; }}
                          >
                            <Monitor size={12} />
                            Screens
                            {expandedId === theatre._id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </button>

                          <ActionBtn onClick={() => setEditTheatre(theatre)} color="blue" title="Edit theatre">
                            <Edit size={14} />
                          </ActionBtn>
                          <ActionBtn
                            onClick={() => setConfirmTheatre(theatre)}
                            disabled={deletingId === theatre._id}
                            color="red" title="Delete theatre">
                            {deletingId === theatre._id
                              ? <Loader2 size={14} className="animate-spin" />
                              : <Trash2 size={14} />}
                          </ActionBtn>
                        </div>
                      </td>
                    </tr>

                    {expandedId === theatre._id && (
                      <ScreensManagerRow
                        theatre={theatre}
                        onScreenAdd={handleScreenAdd}
                        onScreenEdit={handleScreenEdit}
                        onScreenDelete={handleScreenDelete}
                        onSeatLayout={(screenId) =>
                          navigate(`/admin/theatres/${theatre._id}/screens/${screenId}/layout`)
                        }
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
                <span className="font-semibold text-gray-600">{theatres.length}</span> theatres
              </p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <TheatreFormModal mode="add" cities={cities} onSave={handleCreate} onCancel={() => setShowAddModal(false)} saving={saving} />
      )}
      {editTheatre && (
        <TheatreFormModal mode="edit" initial={editTheatre} cities={cities} onSave={handleUpdate} onCancel={() => setEditTheatre(null)} saving={saving} />
      )}
      {confirmTheatre && (
        <ConfirmModal
          title="Delete Theatre"
          description={`Delete "${confirmTheatre.name}" and all its screen data? This cannot be undone.`}
          onConfirm={handleDeleteTheatre}
          onCancel={() => setConfirmTheatre(null)}
        />
      )}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
