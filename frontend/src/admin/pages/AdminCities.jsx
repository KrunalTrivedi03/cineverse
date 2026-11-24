import Dialog from "../../components/Dialog";
import CityLogo from "../../components/CityLogo";
import { useState, useEffect } from "react";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  Search,
  ImagePlus,
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
        fontFamily: "var(--now-ui-font)",
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
    <Dialog variant="form" label={"Delete city?"} maxWidth={340} onDismiss={onCancel} dismissOnBackdrop={false}>
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-[340px]"
        style={{ fontFamily: "var(--now-ui-font)" }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
          style={{ background: "#fff1f2" }}
        >
          <Trash2 size={18} style={{ color: "#106579" }} />
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
            style={{ background: "#106579" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e04048")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#106579")}
          >
            Delete
          </button>
        </div>
      </div>
    </Dialog>
  );
}

/* ── Add City Modal ─────────────────────────────────────── */
function AddCityModal({ onAdd, onCancel, adding }) {
  const [name, setName] = useState("");

  return (
    <Dialog variant="form" label={"Add city"} maxWidth={380} onDismiss={() => { if (!adding) onCancel(); }} dismissOnBackdrop={false}>
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-[380px]"
        style={{ fontFamily: "var(--now-ui-font)" }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(16,101,121,0.08)" }}
          >
            <MapPin size={18} style={{ color: "#106579" }} />
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
          style={{ fontFamily: "var(--now-ui-font)" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#106579")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#e4e4e7")}
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
            style={{ background: "#106579" }}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "#e04048"; }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#106579")}
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add City
          </button>
        </div>
      </div>
    </Dialog>
  );
}

/* ── Action Button ──────────────────────────────────────── */
const COLOR_MAP = {
  teal: { bg: "#e8fbfc", text: "#106579", hover: "#cbfafb" },
  red: { bg: "#fff1f2", text: "#dc2626", hover: "#fee2e2" },
};

function ActionBtn({ onClick, color, title, children, disabled }) {
  const c = COLOR_MAP[color];
  return (
    <button
      onClick={onClick}
      title={title} aria-label={title}
      disabled={disabled}
      className="grid size-11 shrink-0 place-items-center rounded-xl transition-colors disabled:opacity-40"
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
  const [logoCity, setLogoCity] = useState(null);
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
        style={{ fontFamily: "var(--now-ui-font)" }}
      >

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
            style={{ background: "#106579" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#125467")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#106579")}
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
            { label: "Last Added",     value: lastAdded,                        color: "#106579", bg: "rgba(16,101,121,0.08)"   },
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
          <table className="now-admin-cities w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["#", "City Name", "City ID", "Actions"].map((h) => (
                  <th
                    key={h}
                    scope="col" className="py-3 px-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest sm:px-4"
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
                      style={{ background: "rgba(16,101,121,0.08)" }}
                    >
                      <MapPin size={22} style={{ color: "#106579" }} />
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

                    <td className="py-3 px-2 sm:px-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <CityLogo src={city.logoUrl} />
                        <p className="min-w-0 break-words text-[13px] font-semibold text-gray-900">{city.name}</p>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="text-[11px] font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
                        {city._id}
                      </span>
                    </td>

                    <td className="py-3 px-2 sm:px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                      <ActionBtn onClick={() => setLogoCity(city)} color="teal" title={city.logoUrl ? "Replace city logo" : "Add city logo"}>
                        <ImagePlus size={16} />
                      </ActionBtn>
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
                      </div>
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
      {logoCity && (
        <CityLogoForm city={logoCity} onClose={() => setLogoCity(null)} onSaved={(updated) => {
          setCities((current) => current.map((city) => city._id === updated._id ? updated : city));
          setLogoCity(null);
          showToast("City logo updated");
        }} />
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



function CityLogoForm({ city, onClose, onSaved }) {
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  function selectLogo(event) {
    const file = event.target.files?.[0];
    setError("");
    setLogo(null);
    setPreview("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError("Choose a PNG, JPEG, or WebP image up to 2 MB.");
      event.target.value = "";
      return;
    }
    setLogo(file);
    setPreview(URL.createObjectURL(file));
  }

  async function upload(event) {
    event.preventDefault();
    if (!logo || saving) return;
    setSaving(true);
    setError("");
    const data = new FormData();
    data.append("logo", logo);
    try {
      const result = await axiosAdmin.put("/cities/admin/" + city._id + "/logo", data);
      onSaved(result.data);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn?t save the city logo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog label={"Logo for " + city.name} onDismiss={() => { if (!saving) onClose(); }}>
      <form className="p-5 sm:p-7" onSubmit={upload}>
        <div className="flex items-center gap-3">
          <CityLogo src={preview || city.logoUrl} />
          <div><h2 className="text-xl font-bold">{city.name} logo</h2><p className="text-sm text-gray-500">Shown in the city picker.</p></div>
        </div>
        <label htmlFor="city-logo-file" className="mt-5 block text-sm font-semibold">Logo image</label>
        <input id="city-logo-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={selectLogo}
          disabled={saving} aria-describedby="city-logo-requirements" className="now-logo-file mt-2 w-full" />
        <p className="mt-2 text-xs text-gray-500" id="city-logo-requirements">PNG, JPEG, or WebP, up to 2 MB.</p>
        {error && <p className="mt-2 text-sm font-medium text-red-700" role="alert">{error}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="now-secondary">Cancel</button>
          <button type="submit" disabled={saving || !logo} className="now-primary">{saving ? "Uploading?" : "Save logo"}</button>
        </div>
      </form>
    </Dialog>
  );
}
