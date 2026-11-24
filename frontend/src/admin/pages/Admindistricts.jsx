import Dialog from "../../components/Dialog";
import { useState, useEffect } from "react";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  Search, Trash2, MapPin, Plus, SlidersHorizontal,
  Loader2, CheckCircle2, AlertCircle, X, Building,
} from "lucide-react";

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

function ConfirmModal({ district, onConfirm, onCancel, busy }) {
  return (
    <Dialog variant="form" label={"Delete district?"} maxWidth={340} onDismiss={() => { if (!busy) onCancel(); }} dismissOnBackdrop={false}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[340px]" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: "#fff1f2" }}>
          <Trash2 size={18} style={{ color: "#106579" }} />
        </div>
        <h3 className="text-[15px] font-bold text-gray-900 mb-1">Delete District</h3>
        <p className="text-[13px] text-gray-500 mb-5">
          Are you sure you want to delete <span className="font-semibold text-gray-800">"{district.name}"</span>? This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={busy} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={busy}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all flex items-center justify-center gap-2"
            style={{ background: "#106579" }}>
            {busy && <Loader2 size={13} className="animate-spin" />} Delete
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function AddDistrictModal({ cities, onAdd, onCancel, adding }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const canSubmit = name.trim() && city;

  return (
    <Dialog variant="form" label={"Add district"} maxWidth={380} onDismiss={() => { if (!adding) onCancel(); }} dismissOnBackdrop={false}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[380px]" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16,101,121,0.08)" }}>
            <MapPin size={18} style={{ color: "#106579" }} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">Add New District</h3>
            <p className="text-[12px] text-gray-400">Districts belong to a city</p>
          </div>
        </div>

        <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">City <span style={{ color: "#106579" }}>*</span></label>
        <select value={city} onChange={(e) => setCity(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 outline-none mb-4"
          style={{ fontFamily: "'Outfit', sans-serif" }}>
          <option value="">Select a city…</option>
          {cities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>

        <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">District Name <span style={{ color: "#106579" }}>*</span></label>
        <input type="text" placeholder="e.g. Bandra, Koramangala…" value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && canSubmit && onAdd(name.trim(), city)}
          autoFocus
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 placeholder-gray-300 outline-none mb-5"
          style={{ fontFamily: "'Outfit', sans-serif" }} />

        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
          <button onClick={() => canSubmit && onAdd(name.trim(), city)} disabled={adding || !canSubmit}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: "#106579" }}>
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add District
          </button>
        </div>
      </div>
    </Dialog>
  );
}

const ActionBtn = ({ onClick, title, children, disabled }) => (
  <button onClick={onClick} title={title} disabled={disabled}
    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-40"
    style={{ background: "#fff1f2", color: "#dc2626" }}>
    {children}
  </button>
);

export default function AdminDistricts() {
  const [districts, setDistricts]       = useState([]);
  const [cities, setCities]             = useState([]);
  const [search, setSearch]             = useState("");
  const [filterCity, setFilterCity]     = useState("");
  const [loading, setLoading]           = useState(true);
  const [adding, setAdding]             = useState(false);
  const [deletingId, setDeletingId]     = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDistrict, setConfirmDistrict] = useState(null);
  const [toast, setToast]               = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [d, c] = await Promise.all([axiosAdmin.get("/districts"), axiosAdmin.get("/cities")]);
      setDistricts(d.data);
      setCities(c.data);
    } catch { showToast("Failed to load districts", "error"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (name, city) => {
    setAdding(true);
    try {
      await axiosAdmin.post("/districts/admin/create", { name, city });
      setShowAddModal(false);
      showToast(`"${name}" added successfully`);
      fetchAll();
    } catch (err) { showToast(err.response?.data?.message || "Failed to add district", "error"); }
    finally { setAdding(false); }
  };

  const handleDelete = async () => {
    if (!confirmDistrict) return;
    setDeletingId(confirmDistrict._id);
    try {
      await axiosAdmin.delete(`/districts/admin/delete/${confirmDistrict._id}`);
      setConfirmDistrict(null);
      showToast("District deleted");
      fetchAll();
    } catch (err) { showToast(err.response?.data?.message || "Failed to delete", "error"); }
    finally { setDeletingId(null); }
  };

  const filtered = districts
    .filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    .filter((d) => !filterCity || d.city?._id === filterCity);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-8" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Districts</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Manage districts used for event filtering</p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all active:scale-[0.98] self-start sm:self-auto"
            style={{ background: "#106579" }}>
            <Plus size={15} /> Add District
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Districts", value: districts.length, color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
            { label: "Cities Covered",  value: new Set(districts.map((d) => d.city?._id)).size, color: "#10b981", bg: "rgba(16,185,129,0.08)" },
            { label: "Search Results",  value: search ? filtered.length : "—", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
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
            <input type="text" placeholder="Search districts..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-[13px] text-gray-900 outline-none bg-transparent placeholder-gray-400" />
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-600">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="outline-none bg-transparent text-[13px] text-gray-700 cursor-pointer">
              <option value="">All Cities</option>
              {cities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["#", "District", "City", "Actions"].map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-4 px-4"><div className="h-4 w-6 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-28 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(16,101,121,0.08)" }}>
                      <MapPin size={22} style={{ color: "#106579" }} />
                    </div>
                    <p className="text-[14px] font-semibold text-gray-400">No districts found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((d, index) => (
                  <tr key={d._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-4 text-[13px] text-gray-400 font-medium w-10">{index + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16,101,121,0.08)" }}>
                          <MapPin size={14} style={{ color: "#106579" }} />
                        </div>
                        <p className="text-[13px] font-semibold text-gray-900">{d.name}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit" style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1" }}>
                        <Building size={10} /> {d.city?.name || "—"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <ActionBtn onClick={() => setConfirmDistrict(d)} disabled={deletingId === d._id} title="Delete district">
                        {deletingId === d._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </ActionBtn>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && <AddDistrictModal cities={cities} onAdd={handleCreate} onCancel={() => setShowAddModal(false)} adding={adding} />}
      {confirmDistrict && <ConfirmModal district={confirmDistrict} onConfirm={handleDelete} onCancel={() => setConfirmDistrict(null)} busy={!!deletingId} />}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}