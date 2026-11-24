import Dialog from "../../components/Dialog";
import { useState, useEffect } from "react";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  Search, Trash2, Tv, Plus, Loader2, CheckCircle2, AlertCircle, X, Edit,
  Image as ImageIcon, Star,
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

function ConfirmModal({ show, onConfirm, onCancel, busy }) {
  return (
    <Dialog variant="form" label={"Delete web show?"} maxWidth={340} onDismiss={() => { if (!busy) onCancel(); }} dismissOnBackdrop={false}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[340px]" style={{ fontFamily: "var(--now-ui-font)" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: "#fff1f2" }}>
          <Trash2 size={18} style={{ color: "#106579" }} />
        </div>
        <h3 className="text-[15px] font-bold text-gray-900 mb-1">Delete Show</h3>
        <p className="text-[13px] text-gray-500 mb-5">Delete <span className="font-semibold text-gray-800">"{show.title}"</span>? This cannot be undone.</p>
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

function WebShowFormModal({ mode = "add", initial = null, onSave, onCancel, saving }) {
  const [form, setForm] = useState(
    mode === "edit" && initial
      ? {
          title: initial.title || "", description: initial.description || "",
          category: initial.category || "trending-series",
          genre: (initial.genre || []).join(", "), releaseYear: initial.releaseYear || "",
          cast: (initial.cast || []).join(", "), rating: initial.rating ?? "",
          streamingUrl: initial.streamingUrl || "", trailerUrl: initial.trailerUrl || "",
          isActive: initial.isActive ?? true,
          seasons: initial.seasons?.length
            ? initial.seasons.map((s) => ({ ...s, releaseDate: s.releaseDate ? s.releaseDate.slice(0, 10) : "" }))
            : [{ seasonNumber: 1, episodeCount: "", releaseDate: "" }],
        }
      : {
          title: "", description: "", category: "trending-series", genre: "",
          releaseYear: "", cast: "", rating: "", streamingUrl: "", trailerUrl: "",
          isActive: true, seasons: [{ seasonNumber: 1, episodeCount: "", releaseDate: "" }],
        }
  );
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(initial?.poster || null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(initial?.banner || null);
  const [errors, setErrors] = useState({});

  const set = (field, val) => { setForm((p) => ({ ...p, [field]: val })); setErrors((p) => ({ ...p, [field]: "" })); };

  const handlePoster = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const handleBanner = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleSeasonChange = (index, field, value) => {
    const updated = [...form.seasons];
    updated[index] = { ...updated[index], [field]: value };
    set("seasons", updated);
  };

  const addSeasonRow = () => {
    set("seasons", [...form.seasons, { seasonNumber: form.seasons.length + 1, episodeCount: "", releaseDate: "" }]);
  };

  const removeSeasonRow = (index) => {
    set("seasons", form.seasons.filter((_, i) => i !== index));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (mode === "add" && !posterFile) e.poster = "Poster image is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("description", form.description.trim());
    fd.append("category", form.category);
    fd.append("genre", JSON.stringify(form.genre.split(",").map((g) => g.trim()).filter(Boolean)));
    fd.append("releaseYear", form.releaseYear || "");
    fd.append("cast", JSON.stringify(form.cast.split(",").map((c) => c.trim()).filter(Boolean)));
    fd.append("rating", form.rating || 0);
    fd.append("streamingUrl", form.streamingUrl.trim());
    fd.append("trailerUrl", form.trailerUrl.trim());
    fd.append("isActive", form.isActive);
    fd.append(
      "seasons",
      JSON.stringify(
        form.seasons
          .filter((s) => s.episodeCount !== "")
          .map((s) => ({
            seasonNumber: Number(s.seasonNumber),
            episodeCount: Number(s.episodeCount),
            releaseDate: s.releaseDate || undefined,
          }))
      )
    );
    if (posterFile) fd.append("poster", posterFile);
    if (bannerFile) fd.append("banner", bannerFile);
    onSave(fd);
  };

  const inp = "w-full px-4 py-2.5 rounded-xl border text-[13px] text-gray-800 placeholder-gray-300 outline-none transition-all";
  const label = "block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <Dialog variant="form" label={(mode === "edit" ? "Edit " : "Add ") + "web show"} maxWidth={600} onDismiss={() => { if (!saving) onCancel(); }} dismissOnBackdrop={false}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[600px] max-h-[90vh] flex flex-col" style={{ fontFamily: "var(--now-ui-font)" }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,101,121,0.08)" }}>
              {mode === "edit" ? <Edit size={18} style={{ color: "#106579" }} /> : <Tv size={18} style={{ color: "#106579" }} />}
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">{mode === "edit" ? "Edit Show" : "Add New Show"}</h3>
              <p className="text-[12px] text-gray-400">Trending Series & Web Originals</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"><X size={16} className="text-gray-400" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 flex items-center justify-center">
                {posterPreview ? <img src={posterPreview} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-gray-300" />}
              </div>
              <label className="px-3 py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-600 cursor-pointer hover:bg-gray-50">
                Poster
                <input type="file" accept="image/*" onChange={handlePoster} className="hidden" />
              </label>
              {errors.poster && <p className="text-[10px] text-red-500">{errors.poster}</p>}
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-32 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 flex items-center justify-center">
                {bannerPreview ? <img src={bannerPreview} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-gray-300" />}
              </div>
              <label className="px-3 py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-600 cursor-pointer hover:bg-gray-50">
                Banner (optional)
                <input type="file" accept="image/*" onChange={handleBanner} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className={label}>Title <span style={{ color: "#106579" }}>*</span></label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Money Heist" className={inp} style={{ borderColor: errors.title ? "#106579" : "#e4e4e7" }} />
            {errors.title && <p className="text-[11px] text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Category</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inp} style={{ borderColor: "#e4e4e7" }}>
                <option value="trending-series">Trending Series</option>
                <option value="web-original">Web Originals</option>
              </select>
            </div>
            <div>
              <label className={label}>Release Year</label>
              <input type="number" value={form.releaseYear} onChange={(e) => set("releaseYear", e.target.value)} placeholder="2024" className={inp} style={{ borderColor: "#e4e4e7" }} />
            </div>
          </div>

          <div>
            <label className={label}>Description <span style={{ color: "#106579" }}>*</span></label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Short synopsis…" className={inp} style={{ borderColor: errors.description ? "#106579" : "#e4e4e7", resize: "vertical" }} />
            {errors.description && <p className="text-[11px] text-red-500 mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Genre (comma separated)</label>
              <input value={form.genre} onChange={(e) => set("genre", e.target.value)} placeholder="Drama, Thriller" className={inp} style={{ borderColor: "#e4e4e7" }} />
            </div>
            <div>
              <label className={label}>Rating (0-10)</label>
              <input type="number" step="0.1" min="0" max="10" value={form.rating} onChange={(e) => set("rating", e.target.value)} placeholder="8.5" className={inp} style={{ borderColor: "#e4e4e7" }} />
            </div>
          </div>

          <div>
            <label className={label}>Cast (comma separated)</label>
            <input value={form.cast} onChange={(e) => set("cast", e.target.value)} placeholder="Actor One, Actor Two" className={inp} style={{ borderColor: "#e4e4e7" }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Streaming URL (Watch Now)</label>
              <input type="url" value={form.streamingUrl} onChange={(e) => set("streamingUrl", e.target.value)} placeholder="https://..." className={inp} style={{ borderColor: "#e4e4e7" }} />
            </div>
            <div>
              <label className={label}>Trailer URL</label>
              <input type="url" value={form.trailerUrl} onChange={(e) => set("trailerUrl", e.target.value)} placeholder="https://youtube.com/..." className={inp} style={{ borderColor: "#e4e4e7" }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={label} style={{ marginBottom: 0 }}>Seasons</label>
              <button type="button" onClick={addSeasonRow} className="text-[12px] font-semibold" style={{ color: "#106579" }}>+ Add Season</button>
            </div>
            <div className="space-y-2">
              {form.seasons.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="number" placeholder="Season #" value={s.seasonNumber}
                    onChange={(e) => handleSeasonChange(i, "seasonNumber", e.target.value)}
                    className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-[12px]" />
                  <input type="number" placeholder="Episodes" value={s.episodeCount}
                    onChange={(e) => handleSeasonChange(i, "episodeCount", e.target.value)}
                    className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-[12px]" />
                  <input type="date" value={s.releaseDate}
                    onChange={(e) => handleSeasonChange(i, "releaseDate", e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-[12px]" />
                  {form.seasons.length > 1 && (
                    <button type="button" onClick={() => removeSeasonRow(i)} className="text-gray-400 hover:text-red-500">
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="w-4 h-4 accent-now-accent" />
            <span className="text-[13px] font-medium text-gray-700">Active (visible on site)</span>
          </label>
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#106579" }}>
            {saving && <Loader2 size={13} className="animate-spin" />} {mode === "edit" ? "Save Changes" : "Add Show"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

const ActionBtn = ({ onClick, color, title, children, disabled }) => {
  const COLOR_MAP = { blue: { bg: "#eff6ff", text: "#2563eb" }, red: { bg: "#fff1f2", text: "#dc2626" } };
  const c = COLOR_MAP[color];
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-40"
      style={{ background: c.bg, color: c.text }}>
      {children}
    </button>
  );
};

export default function WebAdminShows() {
  const [shows, setShows]               = useState([]);
  const [search, setSearch]             = useState("");
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [deletingId, setDeletingId]     = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editShow, setEditShow]         = useState(null);
  const [confirmShow, setConfirmShow]   = useState(null);
  const [toast, setToast]               = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchShows = async () => {
    try {
      setLoading(true);
      const res = await axiosAdmin.get("/web-shows/admin/all");
      setShows(res.data);
    } catch { showToast("Failed to load shows", "error"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchShows(); }, []);

  const handleCreate = async (fd) => {
    setSaving(true);
    try {
      await axiosAdmin.post("/web-shows/admin/create", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setShowAddModal(false);
      showToast("Show added successfully");
      fetchShows();
    } catch (err) { showToast(err.response?.data?.message || "Failed to add show", "error"); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (fd) => {
    setSaving(true);
    try {
      await axiosAdmin.put(`/web-shows/admin/update/${editShow._id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setEditShow(null);
      showToast("Show updated successfully");
      fetchShows();
    } catch (err) { showToast(err.response?.data?.message || "Failed to update show", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmShow) return;
    setDeletingId(confirmShow._id);
    try {
      await axiosAdmin.delete(`/web-shows/admin/delete/${confirmShow._id}`);
      setConfirmShow(null);
      showToast("Show deleted");
      fetchShows();
    } catch (err) { showToast(err.response?.data?.message || "Failed to delete", "error"); }
    finally { setDeletingId(null); }
  };

  const filtered = shows.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-8" style={{ fontFamily: "var(--now-ui-font)" }}>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Shows</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Manage Trending Series & Web Originals</p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white active:scale-[0.98] self-start sm:self-auto"
            style={{ background: "#106579" }}>
            <Plus size={15} /> Add Show
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Shows",      value: shows.length, color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
            { label: "Trending Series",  value: shows.filter((s) => s.category === "trending-series").length, color: "#16a34a", bg: "rgba(22,163,74,0.08)" },
            { label: "Web Originals",    value: shows.filter((s) => s.category === "web-original").length, color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
            { label: "Search Results",   value: search ? filtered.length : "—", color: "#106579", bg: "rgba(16,101,121,0.08)" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-[26px] font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 mb-5 max-w-md">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input type="text" placeholder="Search shows..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-[13px] text-gray-900 outline-none bg-transparent placeholder-gray-400" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["#", "Show", "Category", "Year", "Rating", "Status", "Actions"].map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-4 px-4" colSpan={7}><div className="h-6 bg-gray-100 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(16,101,121,0.08)" }}>
                      <Tv size={22} style={{ color: "#106579" }} />
                    </div>
                    <p className="text-[14px] font-semibold text-gray-400">No shows found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((s, index) => (
                  <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-4 text-[13px] text-gray-400 font-medium w-10">{index + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                          {s.poster ? <img src={s.poster} alt={s.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Tv size={13} className="text-gray-300" /></div>}
                        </div>
                        <p className="text-[13px] font-semibold text-gray-900 max-w-[220px] truncate">{s.title}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[12px] text-gray-500">
                      {s.category === "trending-series" ? "Trending Series" : "Web Original"}
                    </td>
                    <td className="py-4 px-4 text-[12px] text-gray-500">{s.releaseYear || "—"}</td>
                    <td className="py-4 px-4">
                      <span className="flex items-center gap-1 text-[12px] font-bold" style={{ color: "#106579" }}>
                        <Star size={11} fill="#106579" /> {s.rating}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {s.isActive
                        ? <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a" }}>Active</span>
                        : <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">Hidden</span>}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <ActionBtn onClick={() => setEditShow(s)} color="blue" title="Edit"><Edit size={14} /></ActionBtn>
                        <ActionBtn onClick={() => setConfirmShow(s)} disabled={deletingId === s._id} color="red" title="Delete">
                          {deletingId === s._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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

      {showAddModal && <WebShowFormModal mode="add" onSave={handleCreate} onCancel={() => setShowAddModal(false)} saving={saving} />}
      {editShow && <WebShowFormModal mode="edit" initial={editShow} onSave={handleUpdate} onCancel={() => setEditShow(null)} saving={saving} />}
      {confirmShow && <ConfirmModal show={confirmShow} onConfirm={handleDelete} onCancel={() => setConfirmShow(null)} busy={!!deletingId} />}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}