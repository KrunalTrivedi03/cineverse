import Dialog from "../../components/Dialog";
import { useState, useEffect, useMemo } from "react";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  Search, Trash2, Plus, Loader2, CheckCircle2, AlertCircle, X, Edit,
  Image as ImageIcon, Star, Globe2, MapPin, Route, Calendar, Link2, Unlink,
} from "lucide-react";

const IMG = (path) =>
  !path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;

const TOUR_CATEGORIES = ["Music", "Nightlife", "Comedy Shows", "Expos", "Performances", "Workshops", "Sports"];
const TOUR_STATUSES   = ["upcoming", "live", "completed", "cancelled"];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "TBA";

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

function ConfirmModal({ tour, onConfirm, onCancel, busy }) {
  return (
    <Dialog variant="form" label={"Delete tour?"} maxWidth={360} onDismiss={() => { if (!busy) onCancel(); }} dismissOnBackdrop={false}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[360px]" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: "#fff1f2" }}>
          <Trash2 size={18} style={{ color: "#106579" }} />
        </div>
        <h3 className="text-[15px] font-bold text-gray-900 mb-1">Delete Tour</h3>
        <p className="text-[13px] text-gray-500 mb-1">
          Delete <span className="font-semibold text-gray-800">"{tour.title}"</span>?
        </p>
        {tour.legCount > 0 && (
          <p className="text-[12px] text-amber-600 mb-4">
            {tour.legCount} linked event{tour.legCount > 1 ? "s" : ""} will be unlinked (not deleted) and kept as standalone events.
          </p>
        )}
        <div className="flex gap-2 mt-2">
          <button onClick={onCancel} disabled={busy} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={busy} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2" style={{ background: "#106579" }}>
            {busy && <Loader2 size={13} className="animate-spin" />} Delete
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function TourFormModal({ mode = "add", initial = null, artistOptions, onSave, onCancel, saving }) {
  const [form, setForm] = useState(
    mode === "edit" && initial
      ? {
          title: initial.title || "", description: initial.description || "",
          category: initial.category || "", tags: (initial.tags || []).join(", "),
          artists: (initial.artists || []).map((a) => a._id || a),
          trailerLink: initial.trailerLink || "",
          startDate: initial.startDate ? initial.startDate.slice(0, 10) : "",
          endDate:   initial.endDate   ? initial.endDate.slice(0, 10)   : "",
          status: initial.status || "upcoming",
          isFeatured: !!initial.isFeatured,
        }
      : {
          title: "", description: "", category: "", tags: "", artists: [],
          trailerLink: "", startDate: "", endDate: "", status: "upcoming", isFeatured: false,
        }
  );
  const [posterFile, setPosterFile] = useState(null);
  const [preview, setPreview] = useState(initial?.poster ? IMG(initial.poster) : null);
  const [artistSearch, setArtistSearch] = useState("");
  const [errors, setErrors] = useState({});

  const set = (field, val) => { setForm((p) => ({ ...p, [field]: val })); setErrors((p) => ({ ...p, [field]: "" })); };

  const toggleArtist = (id) =>
    set("artists", form.artists.includes(id) ? form.artists.filter((a) => a !== id) : [...form.artists, id]);

  const filteredArtists = artistOptions.filter((a) => a.name.toLowerCase().includes(artistSearch.toLowerCase()));
  const selectedArtists = artistOptions.filter((a) => form.artists.includes(a._id));

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPosterFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Tour title is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("description", form.description.trim());
    if (form.category) fd.append("category", form.category);
    fd.append("tags", JSON.stringify(form.tags.split(",").map((t) => t.trim()).filter(Boolean)));
    fd.append("artists", JSON.stringify(form.artists));
    fd.append("trailerLink", form.trailerLink);
    if (form.startDate) fd.append("startDate", form.startDate);
    if (form.endDate)    fd.append("endDate", form.endDate);
    fd.append("status", form.status);
    fd.append("isFeatured", form.isFeatured);
    if (posterFile) fd.append("poster", posterFile);
    onSave(fd);
  };

  const inp = "w-full px-4 py-2.5 rounded-xl border text-[13px] text-gray-800 placeholder-gray-300 outline-none transition-all";

  return (
    <Dialog variant="form" label={(mode === "edit" ? "Edit " : "Add ") + "tour"} maxWidth={520} onDismiss={() => { if (!saving) onCancel(); }} dismissOnBackdrop={false}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[520px] max-h-[90vh] flex flex-col" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,101,121,0.08)" }}>
              {mode === "edit" ? <Edit size={18} style={{ color: "#106579" }} /> : <Route size={18} style={{ color: "#106579" }} />}
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">{mode === "edit" ? "Edit Tour" : "Create New Tour"}</h3>
              <p className="text-[12px] text-gray-400">Groups multiple city/country events into one tour</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"><X size={16} className="text-gray-400" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 flex items-center justify-center">
              {preview ? <img src={preview} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-gray-300" />}
            </div>
            <label className="px-4 py-2 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-600 cursor-pointer hover:bg-gray-50">
              Upload Banner
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tour Title <span style={{ color: "#106579" }}>*</span></label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Arijit Singh — Forever Tour 2026"
              className={inp} style={{ borderColor: errors.title ? "#106579" : "#e4e4e7" }} />
            {errors.title && <p className="text-[11px] text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3}
              placeholder="What's this tour about…" className={inp} style={{ borderColor: "#e4e4e7", resize: "vertical" }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inp} style={{ borderColor: "#e4e4e7" }}>
                <option value="">Select category</option>
                {TOUR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inp} style={{ borderColor: "#e4e4e7" }}>
                {TOUR_STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className={inp} style={{ borderColor: "#e4e4e7" }} />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className={inp} style={{ borderColor: "#e4e4e7" }} />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 -mt-2">Leave blank to auto-derive from linked legs' show dates later.</p>

          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Artists / Performers</label>
            {selectedArtists.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedArtists.map((a) => (
                  <span key={a._id} className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1 rounded-lg border"
                    style={{ background: "rgba(16,101,121,0.08)", color: "#106579", borderColor: "rgba(16,101,121,0.25)" }}>
                    {a.name}
                    <button type="button" onClick={() => toggleArtist(a._id)} className="hover:opacity-70 leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
            <input value={artistSearch} onChange={(e) => setArtistSearch(e.target.value)} placeholder="Search artists..." className={inp} style={{ borderColor: "#e4e4e7" }} />
            <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
              {filteredArtists.length === 0 ? (
                <p className="text-[13px] text-gray-400 text-center py-6">No matches</p>
              ) : (
                filteredArtists.map((a) => {
                  const active = form.artists.includes(a._id);
                  return (
                    <button key={a._id} type="button" onClick={() => toggleArtist(a._id)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left">
                      <span className="flex-1 text-[13px] font-medium text-gray-800 truncate">{a.name}</span>
                      {active && <CheckCircle2 size={14} style={{ color: "#106579" }} />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tags (comma-separated)</label>
            <input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="world tour, live, 2026" className={inp} style={{ borderColor: "#e4e4e7" }} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} className="w-4 h-4 accent-now-accent" />
            <span className="text-[13px] font-medium text-gray-700 flex items-center gap-1"><Star size={13} /> Feature this tour</span>
          </label>
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#106579" }}>
            {saving && <Loader2 size={13} className="animate-spin" />} {mode === "edit" ? "Save Changes" : "Create Tour"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

/* Manage which Events (city legs) belong to this tour */
function LegsModal({ tour, onClose, onChanged, showToast }) {
  const [allEvents, setAllEvents] = useState([]);
  const [schedulesByEvent, setSchedulesByEvent] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState("");

  const loadEvents = async () => {
    setLoading(true);
    try {
      const [eventsRes, schedulesRes] = await Promise.all([
        axiosAdmin.get("/admin/events"),
        axiosAdmin.get("/event-schedules"),
      ]);
      setAllEvents(eventsRes.data || []);

      // Group schedules by event id so each candidate can show every city
      // it's been scheduled in, not just a single one.
      const grouped = {};
      (schedulesRes.data || []).forEach((s) => {
        const eventId = s.event?._id || s.event;
        if (!eventId) return;
        if (!grouped[eventId]) grouped[eventId] = [];
        grouped[eventId].push(s);
      });
      setSchedulesByEvent(grouped);
    } catch {
      showToast("Failed to load events", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadEvents(); }, []);

  const linkedIds = new Set((tour.legs || []).map((l) => l.event._id));
  const candidates = allEvents.filter((e) => !linkedIds.has(e._id) && e.title.toLowerCase().includes(search.toLowerCase()));

  const citiesFor = (eventId) => {
    const schedules = schedulesByEvent[eventId] || [];
    return [...new Set(schedules.map((s) => s.venue?.city?.name).filter(Boolean))];
  };

  const handleLink = async (eventId) => {
    setBusyId(eventId);
    try {
      await axiosAdmin.post(`/tours/admin/${tour._id}/legs`, { eventId });
      showToast("Event added as a tour leg");
      await loadEvents();
      onChanged();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to link event", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleUnlink = async (eventId) => {
    setBusyId(eventId);
    try {
      await axiosAdmin.delete(`/tours/admin/${tour._id}/legs/${eventId}`);
      showToast("Event removed from tour");
      await loadEvents();
      onChanged();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to unlink event", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog variant="form" label={"Tour stops"} maxWidth={560} onDismiss={onClose} dismissOnBackdrop={false}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[560px] max-h-[85vh] flex flex-col" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,101,121,0.08)" }}>
              <Route size={18} style={{ color: "#106579" }} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">Manage Legs</h3>
              <p className="text-[12px] text-gray-400">{tour.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"><X size={16} className="text-gray-400" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-5">
          <div>
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Linked Legs ({(tour.legs || []).length})
            </p>
            {(tour.legs || []).length === 0 ? (
              <p className="text-[13px] text-gray-400 py-3">No city legs linked yet. Add existing events below.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {tour.legs.map((leg) => (
                  <div key={leg.event._id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/60">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{leg.event.title}</p>
                      {leg.schedules?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {leg.schedules.map((s) => (
                            <span key={s.scheduleId} className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-white border border-gray-200 text-gray-600">
                              <MapPin size={10} className="text-gray-400" />
                              {s.venue ? `${s.city?.name || s.venue.name}` : "TBA"}
                              <span className="text-gray-300">•</span>
                              <Calendar size={10} className="text-gray-400" /> {fmtDate(s.eventDate)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-400 mt-1">No schedule yet</p>
                      )}
                    </div>
                    <button onClick={() => handleUnlink(leg.event._id)} disabled={busyId === leg.event._id}
                      title="Remove from tour"
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                      style={{ background: "#fff1f2", color: "#dc2626" }}>
                      {busyId === leg.event._id ? <Loader2 size={14} className="animate-spin" /> : <Unlink size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Add Existing Event as a Leg</p>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-2">
              <Search size={14} className="text-gray-400 flex-shrink-0" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events by title..."
                className="flex-1 text-[13px] bg-transparent outline-none placeholder-gray-400" />
            </div>
            {loading ? (
              <p className="text-[13px] text-gray-400 py-3">Loading events…</p>
            ) : candidates.length === 0 ? (
              <p className="text-[13px] text-gray-400 py-3">No unlinked events match. Create one in Events, then link it here.</p>
            ) : (
              <div className="max-h-52 overflow-y-auto flex flex-col gap-2">
                {candidates.map((e) => {
                  const cities = citiesFor(e._id);
                  return (
                    <div key={e._id} className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{e.title}</p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 flex-wrap">
                          <span>{e.category}</span>
                          {e.tour && <span>• already on another tour</span>}
                          {cities.length > 0 && (
                            <span className="flex items-center gap-1 text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: "rgba(14,165,233,0.08)", color: "#0284c7" }}>
                              <MapPin size={10} /> {cities.length > 1 ? `${cities.length} cities: ${cities.join(", ")}` : cities[0]}
                            </span>
                          )}
                        </p>
                      </div>
                      <button onClick={() => handleLink(e._id)} disabled={busyId === e._id}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 flex-shrink-0 disabled:opacity-40"
                        style={{ background: "rgba(16,101,121,0.08)", color: "#106579" }}>
                        {busyId === e._id ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />} Add
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white" style={{ background: "#106579" }}>Done</button>
        </div>
      </div>
    </Dialog>
  );
}

const ActionBtn = ({ onClick, color, title, children, disabled }) => {
  const COLOR_MAP = { blue: { bg: "#eff6ff", text: "#2563eb" }, red: { bg: "#fff1f2", text: "#dc2626" }, purple: { bg: "#f5f3ff", text: "#7c3aed" } };
  const c = COLOR_MAP[color];
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-40"
      style={{ background: c.bg, color: c.text }}>
      {children}
    </button>
  );
};

export default function AdminTours() {
  const [tours, setTours]               = useState([]);
  const [artistOptions, setArtistOptions] = useState([]);
  const [search, setSearch]             = useState("");
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [deletingId, setDeletingId]     = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTour, setEditTour]         = useState(null);
  const [legsTour, setLegsTour]         = useState(null);
  const [confirmTour, setConfirmTour]   = useState(null);
  const [toast, setToast]               = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchTours = async () => {
    try {
      setLoading(true);
      const res = await axiosAdmin.get("/tours");
      setTours(res.data || []);
    } catch { showToast("Failed to load tours", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchTours();
    axiosAdmin.get("/artists").then((res) => setArtistOptions(res.data || [])).catch(() => {});
  }, []);

  const handleCreate = async (fd) => {
    setSaving(true);
    try {
      await axiosAdmin.post("/tours/admin/create", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setShowAddModal(false);
      showToast("Tour created successfully");
      fetchTours();
    } catch (err) { showToast(err.response?.data?.message || "Failed to create tour", "error"); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (fd) => {
    setSaving(true);
    try {
      await axiosAdmin.put(`/tours/admin/update/${editTour._id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setEditTour(null);
      showToast("Tour updated successfully");
      fetchTours();
    } catch (err) { showToast(err.response?.data?.message || "Failed to update tour", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmTour) return;
    setDeletingId(confirmTour._id);
    try {
      await axiosAdmin.delete(`/tours/admin/delete/${confirmTour._id}`);
      setConfirmTour(null);
      showToast("Tour deleted");
      fetchTours();
    } catch (err) { showToast(err.response?.data?.message || "Failed to delete", "error"); }
    finally { setDeletingId(null); }
  };

  const filtered = tours.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));

  const stats = useMemo(() => ([
    { label: "Total Tours",  value: tours.length, color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
    { label: "Live Now",     value: tours.filter((t) => t.status === "live").length, color: "#16a34a", bg: "rgba(22,163,74,0.08)" },
    { label: "Multi-Country", value: tours.filter((t) => (t.countries || []).length > 1).length, color: "#0ea5e9", bg: "rgba(14,165,233,0.08)" },
    { label: "Search Results", value: search ? filtered.length : "—", color: "#106579", bg: "rgba(16,101,121,0.08)" },
  ]), [tours, search, filtered.length]);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-8" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Tours</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">
              Group multi-city / multi-country events for the same artist into one tour
            </p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white active:scale-[0.98] self-start sm:self-auto"
            style={{ background: "#106579" }}>
            <Plus size={15} /> Create Tour
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-[26px] font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 mb-5 max-w-md">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input type="text" placeholder="Search tours..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-[13px] text-gray-900 outline-none bg-transparent placeholder-gray-400" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["Tour", "Legs / Cities", "Status", "Featured", "Actions"].map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-4 px-4" colSpan={5}><div className="h-4 w-full bg-gray-100 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(16,101,121,0.08)" }}>
                      <Route size={22} style={{ color: "#106579" }} />
                    </div>
                    <p className="text-[14px] font-semibold text-gray-400">No tours found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors align-top">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                          {t.poster ? <img src={IMG(t.poster)} alt={t.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Route size={14} className="text-gray-300" /></div>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 truncate max-w-[220px]">{t.title}</p>
                          <p className="text-[11px] text-gray-400 truncate max-w-[220px]">
                            {(t.artists || []).map((a) => a.name).join(", ") || "No artists linked"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-[12px] font-semibold text-gray-700">{t.legCount || 0} leg{t.legCount === 1 ? "" : "s"}</p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Globe2 size={11} /> {(t.cities || []).slice(0, 3).join(", ") || "No cities yet"}
                        {(t.cities || []).length > 3 ? ` +${t.cities.length - 3}` : ""}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
                        style={{
                          background: t.status === "live" ? "rgba(22,163,74,0.08)" : t.status === "cancelled" ? "rgba(220,38,38,0.08)" : "rgba(99,102,241,0.08)",
                          color:      t.status === "live" ? "#16a34a" : t.status === "cancelled" ? "#dc2626" : "#6366f1",
                        }}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {t.isFeatured
                        ? <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit" style={{ background: "rgba(245,158,11,0.08)", color: "#d97706" }}><Star size={10} /> Yes</span>
                        : <span className="text-gray-300 text-[13px]">—</span>}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <ActionBtn onClick={() => setLegsTour(t)} color="purple" title="Manage Legs"><Route size={14} /></ActionBtn>
                        <ActionBtn onClick={() => setEditTour(t)} color="blue" title="Edit"><Edit size={14} /></ActionBtn>
                        <ActionBtn onClick={() => setConfirmTour(t)} disabled={deletingId === t._id} color="red" title="Delete">
                          {deletingId === t._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <TourFormModal mode="add" artistOptions={artistOptions} onSave={handleCreate} onCancel={() => setShowAddModal(false)} saving={saving} />
      )}
      {editTour && (
        <TourFormModal mode="edit" initial={editTour} artistOptions={artistOptions} onSave={handleUpdate} onCancel={() => setEditTour(null)} saving={saving} />
      )}
      {legsTour && (
        <LegsModal tour={legsTour} onClose={() => setLegsTour(null)} showToast={showToast}
          onChanged={async () => {
            const res = await axiosAdmin.get("/tours");
            setTours(res.data || []);
            const fresh = res.data.find((t) => t._id === legsTour._id);
            if (fresh) setLegsTour(fresh);
          }} />
      )}
      {confirmTour && <ConfirmModal tour={confirmTour} onConfirm={handleDelete} onCancel={() => setConfirmTour(null)} busy={!!deletingId} />}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}