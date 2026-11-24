import Dialog from "../../components/Dialog";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  ArrowLeft, Plus, Trash2, Edit, X, Loader2, CheckCircle2, AlertCircle,
  Grid3x3, Sun, Moon, Clock, IndianRupee, Building2,
} from "lucide-react";

/* ── Time <-> minutes helpers ─────────────────────────────
   <input type="time"> works in "HH:MM" strings; everything is stored
   server-side as minutes-since-midnight (see Court.js / playSlotGenerator.js). */
const toTimeStr = (mins) => {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};
const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

const DEFAULT_PRICING_RULES = [
  { dayType: "weekday", band: "offpeak", startMin: 360, endMin: 1020, price: 400 },  // 6am-5pm
  { dayType: "weekday", band: "peak",    startMin: 1020, endMin: 1380, price: 700 }, // 5pm-11pm
  { dayType: "weekend", band: "offpeak", startMin: 360, endMin: 720, price: 500 },   // 6am-12pm
  { dayType: "weekend", band: "peak",    startMin: 720, endMin: 1380, price: 900 },  // 12pm-11pm
];

function Toast({ toast, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-[13px] font-medium"
      style={{
        background: toast.type === "success" ? "#f0fdf4" : "#fff1f2",
        color:      toast.type === "success" ? "#16a34a" : "#dc2626",
        border:    `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecdd3"}`,
        fontFamily: "var(--now-ui-font)",
      }}>
      {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {toast.message}
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

function ConfirmModal({ court, onConfirm, onCancel, busy }) {
  return (
    <Dialog variant="form" label={"Delete court?"} maxWidth={340} onDismiss={() => { if (!busy) onCancel(); }} dismissOnBackdrop={false}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[340px]" style={{ fontFamily: "var(--now-ui-font)" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: "#fff1f2" }}>
          <Trash2 size={18} style={{ color: "#106579" }} />
        </div>
        <h3 className="text-[15px] font-bold text-gray-900 mb-1">Delete Court</h3>
        <p className="text-[13px] text-gray-500 mb-5">
          Delete <span className="font-semibold text-gray-800">"{court.name}"</span> and its generated slots? Courts with existing bookings can't be deleted — deactivate them instead.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={busy} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={busy} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2" style={{ background: "#106579" }}>
            {busy && <Loader2 size={13} className="animate-spin" />} Delete
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function PricingRuleRow({ rule, onChange, onRemove }) {
  const sel = "px-2.5 py-2 rounded-lg border border-gray-200 text-[12px] text-gray-800 outline-none cursor-pointer";
  const timeInp = "px-2.5 py-2 rounded-lg border border-gray-200 text-[12px] text-gray-800 outline-none w-[92px]";
  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
      <select value={rule.dayType} onChange={(e) => onChange({ ...rule, dayType: e.target.value })} className={sel}>
        <option value="weekday">Weekday</option>
        <option value="weekend">Weekend</option>
      </select>
      <select value={rule.band} onChange={(e) => onChange({ ...rule, band: e.target.value })} className={sel}>
        <option value="offpeak">Off-peak</option>
        <option value="peak">Peak</option>
      </select>
      <input type="time" value={toTimeStr(rule.startMin)} onChange={(e) => onChange({ ...rule, startMin: toMinutes(e.target.value) })} className={timeInp} />
      <span className="text-gray-300 text-[12px]">to</span>
      <input type="time" value={toTimeStr(rule.endMin)} onChange={(e) => onChange({ ...rule, endMin: toMinutes(e.target.value) })} className={timeInp} />
      <div className="flex items-center gap-1 flex-1">
        <IndianRupee size={12} className="text-gray-400" />
        <input type="number" min="0" value={rule.price} onChange={(e) => onChange({ ...rule, price: Number(e.target.value) })}
          className="w-20 px-2.5 py-2 rounded-lg border border-gray-200 text-[12px] text-gray-800 outline-none" />
        <span className="text-[11px] text-gray-400">/slot</span>
      </div>
      <button onClick={onRemove} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

function CourtFormModal({ mode = "add", initial = null, activities, onSave, onCancel, saving }) {
  const [form, setForm] = useState(
    mode === "edit" && initial
      ? {
          activity: initial.activity?._id || "",
          name: initial.name || "",
          surfaceType: initial.surfaceType || "",
          indoor: initial.indoor !== false,
          capacity: initial.capacity ? String(initial.capacity) : "",
          startMin: initial.operatingHours?.startMin ?? 360,
          endMin: initial.operatingHours?.endMin ?? 1380,
          slotDurationMinutes: initial.slotDurationMinutes || 60,
          isActive: initial.isActive !== false,
        }
      : { activity: "", name: "", surfaceType: "", indoor: true, capacity: "", startMin: 360, endMin: 1380, slotDurationMinutes: 60, isActive: true }
  );
  const [pricingRules, setPricingRules] = useState(
    mode === "edit" && initial?.pricingRules?.length ? initial.pricingRules : DEFAULT_PRICING_RULES
  );
  const [error, setError] = useState("");

  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));

  const updateRule = (index, updated) => setPricingRules((p) => p.map((r, i) => (i === index ? updated : r)));
  const removeRule = (index) => setPricingRules((p) => p.filter((_, i) => i !== index));
  const addRule = () => setPricingRules((p) => [...p, { dayType: "weekday", band: "offpeak", startMin: 360, endMin: 1020, price: 0 }]);

  const validate = () => {
    if (!form.activity) return "Please select an activity";
    if (!form.name.trim()) return "Court name is required";
    if (form.startMin >= form.endMin) return "Operating hours: start must be before end";
    if (!pricingRules.length) return "At least one pricing rule is required";
    for (const r of pricingRules) {
      if (r.startMin >= r.endMin) return "Every pricing rule needs start before end time";
      if (r.price < 0 || r.price === "") return "Every pricing rule needs a valid price";
    }
    return null;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) return setError(err);
    onSave({
      activity: form.activity,
      name: form.name.trim(),
      surfaceType: form.surfaceType.trim(),
      indoor: form.indoor,
      capacity: Number(form.capacity) || 0,
      operatingHours: { startMin: form.startMin, endMin: form.endMin },
      slotDurationMinutes: Number(form.slotDurationMinutes),
      pricingRules,
      isActive: form.isActive,
    });
  };

  const inp = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 placeholder-gray-300 outline-none";

  return (
    <Dialog variant="form" label={(mode === "edit" ? "Edit " : "Add ") + "court"} maxWidth={620} onDismiss={() => { if (!saving) onCancel(); }} dismissOnBackdrop={false}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[620px] max-h-[92vh] flex flex-col" style={{ fontFamily: "var(--now-ui-font)" }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,101,121,0.08)" }}>
              {mode === "edit" ? <Edit size={18} style={{ color: "#106579" }} /> : <Grid3x3 size={18} style={{ color: "#106579" }} />}
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">{mode === "edit" ? "Edit Court" : "Add Court"}</h3>
              <p className="text-[12px] text-gray-400">Editing pricing/hours regenerates unbooked slots</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"><X size={16} className="text-gray-400" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-4">
          {error && <div className="px-3 py-2 rounded-lg text-[12px] font-medium bg-red-50 text-red-600 border border-red-100">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Activity <span style={{ color: "#106579" }}>*</span></label>
              <select value={form.activity} onChange={(e) => { set("activity", e.target.value); setError(""); }} className={inp + " cursor-pointer"}>
                <option value="">Select activity…</option>
                {activities.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Court Name <span style={{ color: "#106579" }}>*</span></label>
              <input value={form.name} onChange={(e) => { set("name", e.target.value); setError(""); }} placeholder="e.g. Court 1" className={inp} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Surface Type</label>
              <input value={form.surfaceType} onChange={(e) => set("surfaceType", e.target.value)} placeholder="Synthetic, Wooden…" className={inp} />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Capacity</label>
              <input type="number" min="0" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="Max players" className={inp} />
            </div>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.indoor} onChange={(e) => set("indoor", e.target.checked)} className="w-4 h-4 accent-now-accent" />
                <span className="text-[13px] font-medium text-gray-700">Indoor</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Opens</label>
              <input type="time" value={toTimeStr(form.startMin)} onChange={(e) => set("startMin", toMinutes(e.target.value))} className={inp} />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Closes</label>
              <input type="time" value={toTimeStr(form.endMin)} onChange={(e) => set("endMin", toMinutes(e.target.value))} className={inp} />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Slot Length</label>
              <select value={form.slotDurationMinutes} onChange={(e) => set("slotDurationMinutes", e.target.value)} className={inp + " cursor-pointer"}>
                <option value={30}>30 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>120 min</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Pricing Rules <span style={{ color: "#106579" }}>*</span></label>
              <button onClick={addRule} className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#106579" }}>
                <Plus size={12} /> Add Rule
              </button>
            </div>
            <div className="rounded-xl border border-gray-200 px-3 py-1 bg-gray-50/50">
              {pricingRules.map((r, i) => (
                <PricingRuleRow key={i} rule={r} onChange={(u) => updateRule(i, u)} onRemove={() => removeRule(i)} />
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              A slot's start time is matched against these bands to price it. Weekday/weekend + off-peak/peak covers most pricing structures without one row per hour.
            </p>
          </div>

          {mode === "edit" && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="w-4 h-4 accent-now-accent" />
              <span className="text-[13px] font-medium text-gray-700">Court is active (bookable)</span>
            </label>
          )}
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#106579" }}>
            {saving && <Loader2 size={13} className="animate-spin" />} {mode === "edit" ? "Save Changes" : "Add Court"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export default function AdminPlayVenueCourts() {
  const { venueId } = useParams();
  const navigate = useNavigate();

  const [venue, setVenue] = useState(null);
  const [courts, setCourts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCourt, setEditCourt] = useState(null);
  const [confirmCourt, setConfirmCourt] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [venueRes, activitiesRes] = await Promise.all([
        axiosAdmin.get(`/play/venues/admin/${venueId}`),
        axiosAdmin.get("/play/activities/admin"),
      ]);
      setVenue(venueRes.data.venue);
      setCourts(venueRes.data.courts);
      setActivities(activitiesRes.data);
    } catch {
      showToast("Failed to load venue", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchAll(); }, [venueId]);

  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      await axiosAdmin.post(`/play/venues/admin/${venueId}/courts`, payload);
      setShowAddModal(false);
      showToast("Court added — slots generated for the next 14 days");
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add court", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload) => {
    setSaving(true);
    try {
      await axiosAdmin.put(`/play/venues/admin/${venueId}/courts/${editCourt._id}`, payload);
      setEditCourt(null);
      showToast("Court updated — unbooked slots regenerated");
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update court", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmCourt) return;
    setDeletingId(confirmCourt._id);
    try {
      await axiosAdmin.delete(`/play/venues/admin/${venueId}/courts/${confirmCourt._id}`);
      setConfirmCourt(null);
      showToast("Court deleted");
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete court", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const priceRange = (rules) => {
    const prices = rules.map((r) => r.price);
    const min = Math.min(...prices), max = Math.max(...prices);
    return min === max ? `₹${min}` : `₹${min}–${max}`;
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-8" style={{ fontFamily: "var(--now-ui-font)" }}>

        <button onClick={() => navigate("/admin/play/venues")} className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-400 hover:text-gray-600 mb-4">
          <ArrowLeft size={13} /> Back to Play Venues
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16,101,121,0.08)" }}>
              <Building2 size={20} style={{ color: "#106579" }} />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-gray-900 tracking-tight">{loading ? "Loading…" : venue?.name}</h1>
              <p className="text-[13px] text-gray-400 mt-0.5">{loading ? "" : `${venue?.district?.name || ""} · Manage courts & pricing`}</p>
            </div>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white active:scale-[0.98] self-start sm:self-auto"
            style={{ background: "#106579" }}>
            <Plus size={15} /> Add Court
          </button>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-44 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
          </div>
        ) : courts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(16,101,121,0.08)" }}>
              <Grid3x3 size={22} style={{ color: "#106579" }} />
            </div>
            <p className="text-[14px] font-semibold text-gray-400">No courts yet</p>
            <p className="text-[12px] text-gray-400 mt-1">Add a court to start generating bookable slots.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courts.map((c) => (
              <div key={c._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[14px] font-bold text-gray-900">{c.name}</p>
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full mt-1" style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1" }}>
                      {c.activity?.name || "—"}
                    </span>
                  </div>
                  <span
                    className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: c.isActive ? "rgba(16,185,129,0.08)" : "rgba(156,163,175,0.12)", color: c.isActive ? "#059669" : "#6b7280" }}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 text-[12px] text-gray-500 mb-4">
                  <div className="flex items-center gap-1.5">
                    {c.indoor ? <Moon size={12} /> : <Sun size={12} />} {c.indoor ? "Indoor" : "Outdoor"}
                    {c.surfaceType && <span className="text-gray-300">· {c.surfaceType}</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} /> {toTimeStr(c.operatingHours.startMin)}–{toTimeStr(c.operatingHours.endMin)} · {c.slotDurationMinutes}min slots
                  </div>
                  <div className="flex items-center gap-1.5">
                    <IndianRupee size={12} /> {priceRange(c.pricingRules)} per slot
                  </div>
                </div>

                <div className="flex gap-2 mt-auto pt-3 border-t border-gray-50">
                  <button onClick={() => setEditCourt(c)} className="flex-1 py-2 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5" style={{ background: "#eff6ff", color: "#2563eb" }}>
                    <Edit size={12} /> Edit
                  </button>
                  <button onClick={() => setConfirmCourt(c)} disabled={deletingId === c._id} className="flex-1 py-2 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50" style={{ background: "#fff1f2", color: "#dc2626" }}>
                    {deletingId === c._id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && <CourtFormModal mode="add" activities={activities} onSave={handleCreate} onCancel={() => setShowAddModal(false)} saving={saving} />}
      {editCourt && <CourtFormModal mode="edit" initial={editCourt} activities={activities} onSave={handleUpdate} onCancel={() => setEditCourt(null)} saving={saving} />}
      {confirmCourt && <ConfirmModal court={confirmCourt} onConfirm={handleDelete} onCancel={() => setConfirmCourt(null)} busy={!!deletingId} />}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
