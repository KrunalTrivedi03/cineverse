import Dialog from "../../components/Dialog";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  Search, Trash2, Building2, Plus, SlidersHorizontal,
  Loader2, CheckCircle2, AlertCircle, X, MapPin,
  ExternalLink, Edit, Grid3x3, Phone,
} from "lucide-react";

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

function ConfirmModal({ title, description, onConfirm, onCancel, busy }) {
  return (
    <Dialog variant="form" label={title} maxWidth={340} onDismiss={() => { if (!busy) onCancel(); }} dismissOnBackdrop={false}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[340px]" style={{ fontFamily: "var(--now-ui-font)" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: "#fff1f2" }}>
          <Trash2 size={18} style={{ color: "#106579" }} />
        </div>
        <h3 className="text-[15px] font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-[13px] text-gray-500 mb-5">{description}</p>
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

function VenueFormModal({ mode = "add", initial = null, cities, districts, onSave, onCancel, saving }) {
  const [form, setForm] = useState(
    mode === "edit" && initial
      ? {
          name: initial.name || "", city: initial.city?._id || "", district: initial.district?._id || "",
          address: initial.address || "", locationLink: initial.locationLink || "",
          latitude: initial.latitude ?? "", longitude: initial.longitude ?? "",
          contactPhone: initial.contactPhone || "", description: initial.description || "",
          amenities: (initial.amenities || []).join(", "),
        }
      : { name: "", city: "", district: "", address: "", locationLink: "", latitude: "", longitude: "", contactPhone: "", description: "", amenities: "" }
  );
  const [images, setImages] = useState(null);
  const [errors, setErrors] = useState({});

  const set = (field, val) => {
    if (field === "city") setForm((p) => ({ ...p, city: val, district: "" }));
    else setForm((p) => ({ ...p, [field]: val }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const districtOptions = districts.filter((d) => !form.city || d.city?._id === form.city || d.city === form.city);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Venue name is required";
    if (!form.city)        e.city = "Please select a city";
    if (!form.district)    e.district = "Please select a district";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("city", form.city);
    fd.append("district", form.district);
    fd.append("address", form.address.trim());
    fd.append("locationLink", form.locationLink.trim());
    fd.append("latitude", form.latitude);
    fd.append("longitude", form.longitude);
    fd.append("contactPhone", form.contactPhone.trim());
    fd.append("description", form.description.trim());
    fd.append("amenities", JSON.stringify(form.amenities.split(",").map((a) => a.trim()).filter(Boolean)));
    if (images?.length) Array.from(images).forEach((f) => fd.append("images", f));
    onSave(fd);
  };

  const inp = "w-full px-4 py-2.5 rounded-xl border text-[13px] text-gray-800 placeholder-gray-300 outline-none transition-all";

  return (
    <Dialog variant="form" label={(mode === "edit" ? "Edit " : "Add ") + "play venue"} maxWidth={560} onDismiss={() => { if (!saving) onCancel(); }} dismissOnBackdrop={false}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[560px] max-h-[90vh] flex flex-col" style={{ fontFamily: "var(--now-ui-font)" }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,101,121,0.08)" }}>
              {mode === "edit" ? <Edit size={18} style={{ color: "#106579" }} /> : <Building2 size={18} style={{ color: "#106579" }} />}
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">{mode === "edit" ? "Edit Play Venue" : "Add Play Venue"}</h3>
              <p className="text-[12px] text-gray-400">Fill in the venue details below</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"><X size={16} className="text-gray-400" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Venue Name <span style={{ color: "#106579" }}>*</span></label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Smash Sports Arena" className={inp} style={{ borderColor: errors.name ? "#106579" : "#e4e4e7" }} />
            {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">City <span style={{ color: "#106579" }}>*</span></label>
              <select value={form.city} onChange={(e) => set("city", e.target.value)} className={inp + " cursor-pointer"} style={{ borderColor: errors.city ? "#106579" : "#e4e4e7" }}>
                <option value="">Select city…</option>
                {cities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.city && <p className="text-[11px] text-red-500 mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">District <span style={{ color: "#106579" }}>*</span></label>
              <select value={form.district} onChange={(e) => set("district", e.target.value)} className={inp + " cursor-pointer"} style={{ borderColor: errors.district ? "#106579" : "#e4e4e7" }}>
                <option value="">Select district…</option>
                {districtOptions.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
              {errors.district && <p className="text-[11px] text-red-500 mt-1">{errors.district}</p>}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Address</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Full address" className={inp} style={{ borderColor: "#e4e4e7" }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Google Maps Link</label>
              <input value={form.locationLink} onChange={(e) => set("locationLink", e.target.value)} placeholder="https://maps.google.com/…" className={inp} style={{ borderColor: "#e4e4e7" }} />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Contact Phone</label>
              <input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="+91…" className={inp} style={{ borderColor: "#e4e4e7" }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Latitude</label>
              <input type="number" step="any" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="e.g. 23.0225" className={inp} style={{ borderColor: "#e4e4e7" }} />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Longitude</label>
              <input type="number" step="any" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="e.g. 72.5714" className={inp} style={{ borderColor: "#e4e4e7" }} />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 -mt-2">Used for the "distance" sort in venue search. Leave blank if unknown.</p>

          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Amenities (comma-separated)</label>
            <input value={form.amenities} onChange={(e) => set("amenities", e.target.value)} placeholder="Parking, Washroom, Drinking Water, Cafeteria" className={inp} style={{ borderColor: "#e4e4e7" }} />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Short description shown on the venue page" className={inp + " resize-none"} style={{ borderColor: "#e4e4e7" }} />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Photos {mode === "edit" && <span className="normal-case font-normal text-gray-400">(uploading replaces existing photos)</span>}
            </label>
            <input type="file" accept="image/*" multiple onChange={(e) => setImages(e.target.files)}
              className="w-full text-[12px] text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-[12px] file:font-semibold file:bg-gray-100 file:text-gray-700" />
          </div>
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#106579" }}>
            {saving && <Loader2 size={13} className="animate-spin" />} {mode === "edit" ? "Save Changes" : "Add Venue"}
          </button>
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

export default function AdminPlayVenues() {
  const navigate = useNavigate();
  const [venues, setVenues]     = useState([]);
  const [cities, setCities]     = useState([]);
  const [districts, setDistricts] = useState([]);
  const [search, setSearch]     = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editVenue, setEditVenue] = useState(null);
  const [confirmVenue, setConfirmVenue] = useState(null);
  const [toast, setToast]       = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [v, c, d] = await Promise.all([axiosAdmin.get("/play/venues/admin"), axiosAdmin.get("/cities"), axiosAdmin.get("/districts")]);
      setVenues(v.data);
      setCities(c.data);
      setDistricts(d.data);
    } catch { showToast("Failed to load venues", "error"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (fd) => {
    setSaving(true);
    try {
      await axiosAdmin.post("/play/venues/admin/create", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setShowAddModal(false);
      showToast("Venue added successfully");
      fetchAll();
    } catch (err) { showToast(err.response?.data?.message || "Failed to add venue", "error"); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (fd) => {
    setSaving(true);
    try {
      await axiosAdmin.put(`/play/venues/admin/update/${editVenue._id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setEditVenue(null);
      showToast("Venue updated successfully");
      fetchAll();
    } catch (err) { showToast(err.response?.data?.message || "Failed to update venue", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmVenue) return;
    setDeletingId(confirmVenue._id);
    try {
      await axiosAdmin.delete(`/play/venues/admin/delete/${confirmVenue._id}`);
      setConfirmVenue(null);
      showToast("Venue deleted");
      fetchAll();
    } catch (err) { showToast(err.response?.data?.message || "Failed to delete", "error"); }
    finally { setDeletingId(null); }
  };

  const filtered = venues
    .filter((v) => v.name.toLowerCase().includes(search.toLowerCase()))
    .filter((v) => !filterDistrict || v.district?._id === filterDistrict);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-8" style={{ fontFamily: "var(--now-ui-font)" }}>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Play Venues</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Venues offering sports/activity bookings</p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white active:scale-[0.98] self-start sm:self-auto"
            style={{ background: "#106579" }}>
            <Plus size={15} /> Add Venue
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Venues", value: venues.length, color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
            { label: "Active Venues", value: venues.filter((v) => v.isActive).length, color: "#10b981", bg: "rgba(16,185,129,0.08)" },
            { label: "No Courts Yet", value: venues.filter((v) => !v.activities?.length).length, color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
            { label: "Search Results", value: search ? filtered.length : "—", color: "#106579", bg: "rgba(16,101,121,0.08)" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-[26px] font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex-1 min-w-0">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input type="text" placeholder="Search venues..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-[13px] text-gray-900 outline-none bg-transparent placeholder-gray-400" />
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-600">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)} className="outline-none bg-transparent text-[13px] text-gray-700 cursor-pointer">
              <option value="">All Districts</option>
              {districts.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["#", "Venue", "District", "Activities", "Actions"].map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-4 px-4"><div className="h-4 w-6 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-32 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-24 bg-gray-100 rounded-full animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="flex gap-1.5">{[1, 2, 3].map((j) => <div key={j} className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse" />)}</div></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(16,101,121,0.08)" }}>
                      <Building2 size={22} style={{ color: "#106579" }} />
                    </div>
                    <p className="text-[14px] font-semibold text-gray-400">No venues found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((v, index) => (
                  <tr key={v._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-4 text-[13px] text-gray-400 font-medium w-10">{index + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16,101,121,0.08)" }}>
                          <Building2 size={16} style={{ color: "#106579" }} />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900">{v.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {v.locationLink && (
                              <a href={v.locationLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-600">
                                <ExternalLink size={10} /> Maps
                              </a>
                            )}
                            {v.contactPhone && (
                              <span className="flex items-center gap-1 text-[11px] text-gray-400"><Phone size={10} /> {v.contactPhone}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {v.district ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit" style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1" }}>
                          <MapPin size={10} /> {v.district.name}
                        </span>
                      ) : <span className="text-gray-300 text-[13px]">—</span>}
                    </td>
                    <td className="py-4 px-4">
                      {v.activities?.length ? (
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {v.activities.slice(0, 3).map((a) => (
                            <span key={a._id} className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.08)", color: "#059669" }}>{a.name}</span>
                          ))}
                          {v.activities.length > 3 && <span className="text-[10.5px] text-gray-400">+{v.activities.length - 3}</span>}
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit" style={{ background: "rgba(245,158,11,0.08)", color: "#d97706" }}>No courts yet</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <ActionBtn onClick={() => navigate(`/admin/play/venues/${v._id}/courts`)} color="purple" title="Manage courts">
                          <Grid3x3 size={14} />
                        </ActionBtn>
                        <ActionBtn onClick={() => setEditVenue(v)} color="blue" title="Edit venue"><Edit size={14} /></ActionBtn>
                        <ActionBtn onClick={() => setConfirmVenue(v)} disabled={deletingId === v._id} color="red" title="Delete venue">
                          {deletingId === v._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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

      {showAddModal && <VenueFormModal mode="add" cities={cities} districts={districts} onSave={handleCreate} onCancel={() => setShowAddModal(false)} saving={saving} />}
      {editVenue && <VenueFormModal mode="edit" initial={editVenue} cities={cities} districts={districts} onSave={handleUpdate} onCancel={() => setEditVenue(null)} saving={saving} />}
      {confirmVenue && (
        <ConfirmModal title="Delete Venue" description={`Delete "${confirmVenue.name}"? It must have no courts remaining.`}
          onConfirm={handleDelete} onCancel={() => setConfirmVenue(null)} busy={!!deletingId} />
      )}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
