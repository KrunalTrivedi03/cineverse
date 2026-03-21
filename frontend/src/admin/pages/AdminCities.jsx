import { useState, useEffect } from "react";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  Search,
  Trash2,
  MapPin,
  Plus,
  SlidersHorizontal,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

/* ── Toast ─────────────────────────────────────────────── */
function Toast({ toast, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-[13px] font-medium"
      style={{
        background: toast.type === "success" ? "#f0fdf4" : "#fff1f2",
        color: toast.type === "success" ? "#16a34a" : "#dc2626",
        border: `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecdd3"}`,
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {toast.message}
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

/* ── Confirm Modal ──────────────────────────────────────── */
function ConfirmModal({ city, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-[340px]"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
          style={{ background: "#fff1f2" }}
        >
          <Trash2 size={18} style={{ color: "#f0545c" }} />
        </div>
        <h3 className="text-[15px] font-bold text-gray-900 mb-1">Delete City</h3>
        <p className="text-[13px] text-gray-500 mb-5">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-800">"{city.name}"</span>? This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
            style={{ background: "#f0545c" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e04048")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f0545c")}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Add City Modal ─────────────────────────────────────── */
function AddCityModal({ onAdd, onCancel, adding }) {
  const [name, setName] = useState("");

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-[380px]"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(240,84,92,0.08)" }}
          >
            <MapPin size={18} style={{ color: "#f0545c" }} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">Add New City</h3>
            <p className="text-[12px] text-gray-400">City names must be unique</p>
          </div>
        </div>

        <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          City Name
        </label>
        <input
          type="text"
          placeholder="e.g. Mumbai, Delhi, Bangalore…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onAdd(name.trim())}
          autoFocus
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 placeholder-gray-300 outline-none transition-all mb-5"
          style={{ fontFamily: "'Outfit', sans-serif" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#f0545c")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
        />

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onAdd(name.trim())}
            disabled={adding || !name.trim()}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#f0545c" }}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "#e04048"; }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f0545c")}
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add City
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Action Button ──────────────────────────────────────── */
const COLOR_MAP = {
  red: { bg: "#fff1f2", text: "#dc2626", hover: "#fee2e2" },
};

function ActionBtn({ onClick, color, title, children, disabled }) {
  const c = COLOR_MAP[color];
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-40"
      style={{ background: c.bg, color: c.text }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = c.hover; }}
      onMouseLeave={(e) => (e.currentTarget.style.background = c.bg)}
    >
      {children}
    </button>
  );
}

/* ── Main Component ─────────────────────────────────────── */
export default function AdminCities() {
  const [cities, setCities]             = useState([]);
  const [search, setSearch]             = useState("");
  const [sortBy, setSortBy]             = useState("az");
  const [loading, setLoading]           = useState(true);
  const [adding, setAdding]             = useState(false);
  const [deletingId, setDeletingId]     = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmCity, setConfirmCity]   = useState(null);
  const [toast, setToast]               = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  /* ── Fetch ── */
  const fetchCities = async () => {
    try {
      setLoading(true);
      const res = await axiosAdmin.get("/cities");
      setCities(res.data);
    } catch {
      showToast("Failed to load cities", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCities(); }, []);

  /* ── Filter + Sort ── */
  const filtered = cities
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "az")     return a.name.localeCompare(b.name);
      if (sortBy === "za")     return b.name.localeCompare(a.name);
      if (sortBy === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      return 0;
    });

  /* ── Create ── */
  const handleCreate = async (name) => {
    try {
      setAdding(true);
      const res = await axiosAdmin.post("/cities/admin/create", { name });
      setCities((prev) => [...prev, res.data]);
      setShowAddModal(false);
      showToast(`"${res.data.name}" added successfully`);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add city", "error");
    } finally {
      setAdding(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!confirmCity) return;
    try {
      setDeletingId(confirmCity._id);
      await axiosAdmin.delete(`/cities/${confirmCity._id}`);
      setCities((prev) => prev.filter((c) => c._id !== confirmCity._id));
      showToast(`"${confirmCity.name}" deleted`);
    } catch {
      showToast("Failed to delete city", "error");
    } finally {
      setDeletingId(null);
      setConfirmCity(null);
    }
  };

  /* ── Last added city name (truncated) ── */
  const lastAdded = cities.length
    ? cities[cities.length - 1]?.name?.length > 8
      ? cities[cities.length - 1].name.slice(0, 8) + "…"
      : cities[cities.length - 1]?.name
    : "—";

  return (
    <AdminLayout>
      <div
        className="min-h-screen bg-gray-50 p-6 md:p-8"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Cities</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">
              Manage cities where theatres are available
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all active:scale-[0.98] self-start sm:self-auto"
            style={{ background: "#f0545c" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#d94048")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f0545c")}
          >
            <Plus size={15} /> Add City
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Cities",   value: cities.length,                    color: "#6366f1", bg: "rgba(99,102,241,0.08)"  },
            { label: "Active Cities",  value: cities.length,                    color: "#10b981", bg: "rgba(16,185,129,0.08)"  },
            { label: "Search Results", value: search ? filtered.length : "—",  color: "#f59e0b", bg: "rgba(245,158,11,0.08)"  },
            { label: "Last Added",     value: lastAdded,                        color: "#f0545c", bg: "rgba(240,84,92,0.08)"   },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                {s.label}
              </p>
              <p className="text-[26px] font-bold" style={{ color: s.color }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex-1 min-w-0">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search cities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-[13px] text-gray-900 outline-none bg-transparent placeholder-gray-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-gray-300 hover:text-gray-500 text-[11px] font-medium flex-shrink-0"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-600">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="outline-none bg-transparent text-[13px] text-gray-700 cursor-pointer"
            >
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["#", "City Name", "City ID", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="py-3 px-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest"
                  >
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
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse flex-shrink-0" />
                        <div className="h-3.5 w-28 bg-gray-100 rounded animate-pulse" />
                      </div>
                    </td>
                    <td className="py-4 px-4"><div className="h-4 w-40 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ background: "rgba(240,84,92,0.08)" }}
                    >
                      <MapPin size={22} style={{ color: "#f0545c" }} />
                    </div>
                    <p className="text-[14px] font-semibold text-gray-400">No cities found</p>
                    <p className="text-[12px] text-gray-300 mt-0.5">
                      {search ? `No results for "${search}"` : "Add your first city to get started"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((city, index) => (
                  <tr
                    key={city._id}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="py-4 px-4 text-[13px] text-gray-400 font-medium w-10">
                      {index + 1}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(240,84,92,0.08)" }}
                        >
                          <MapPin size={14} style={{ color: "#f0545c" }} />
                        </div>
                        <p className="text-[13px] font-semibold text-gray-900">{city.name}</p>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="text-[11px] font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
                        {city._id}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <ActionBtn
                        onClick={() => setConfirmCity(city)}
                        disabled={deletingId === city._id}
                        color="red"
                        title="Delete city"
                      >
                        {deletingId === city._id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />}
                      </ActionBtn>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
              <p className="text-[12px] text-gray-400">
                Showing{" "}
                <span className="font-semibold text-gray-600">{filtered.length}</span> of{" "}
                <span className="font-semibold text-gray-600">{cities.length}</span> cities
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showAddModal && (
        <AddCityModal
          onAdd={handleCreate}
          onCancel={() => setShowAddModal(false)}
          adding={adding}
        />
      )}
      {confirmCity && (
        <ConfirmModal
          city={confirmCity}
          onConfirm={handleDelete}
          onCancel={() => setConfirmCity(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}