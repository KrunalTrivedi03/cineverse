import Dialog from "../../components/Dialog";
import { useState, useEffect } from "react";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import { getSportIcon, renderSportIcon, SPORT_ICONS } from "../../utils/sportIcons";
import {
  Search, Trash2, Plus, Loader2, CheckCircle2, AlertCircle, X, Edit,
  Trophy, Eye, EyeOff, ImagePlus,
} from "lucide-react";
import { IMG } from "../../utils/eventHelpers";

// Default fallback icon shown when an activity has neither a custom icon
// nor an uploaded image — kept as one shared constant so it's easy to swap.
const DEFAULT_SPORT_ICON = Trophy;

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

function ConfirmModal({ activity, onConfirm, onCancel, busy }) {
  return (
    <Dialog variant="form" label={"Delete activity?"} maxWidth={340} onDismiss={() => { if (!busy) onCancel(); }} dismissOnBackdrop={false}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[340px]" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: "#fff1f2" }}>
          <Trash2 size={18} style={{ color: "#106579" }} />
        </div>
        <h3 className="text-[15px] font-bold text-gray-900 mb-1">Delete Activity</h3>
        <p className="text-[13px] text-gray-500 mb-5">
          Delete <span className="font-semibold text-gray-800">"{activity.name}"</span>? Courts already using it must be removed or reassigned first.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={busy} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={busy}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: "#106579" }}>
            {busy && <Loader2 size={13} className="animate-spin" />} Delete
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function ActivityFormModal({ mode = "add", initial = null, onSave, onCancel, saving }) {
  const [form, setForm] = useState(
    mode === "edit" && initial
      ? { name: initial.name || "", icon: initial.icon || "", sortOrder: String(initial.sortOrder ?? 0) }
      : { name: "", icon: "", sortOrder: "0" }
  );
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(mode === "edit" ? initial?.image || "" : "");
  const [error, setError] = useState("");



  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return setError("Activity name is required");
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("icon", form.icon.trim());
    fd.append("sortOrder", Number(form.sortOrder) || 0);
    if (imageFile) fd.append("image", imageFile);
    onSave(fd);
  };

  const inp = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 placeholder-gray-300 outline-none";

  return (
    <Dialog variant="form" label={(mode === "edit" ? "Edit " : "Add ") + "activity"} maxWidth={420} onDismiss={() => { if (!saving) onCancel(); }} dismissOnBackdrop={false}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[420px] max-h-[90vh] overflow-y-auto" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,101,121,0.08)" }}>
              {mode === "edit" ? <Edit size={18} style={{ color: "#106579" }} /> : <DEFAULT_SPORT_ICON size={18} style={{ color: "#106579" }} />}
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">{mode === "edit" ? "Edit Activity" : "Add New Activity"}</h3>
              <p className="text-[12px] text-gray-400">Sports/activities available in Play</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"><X size={16} className="text-gray-400" /></button>
        </div>

        <div className="px-6 py-4 flex flex-col gap-4">
          {error && <div className="px-3 py-2 rounded-lg text-[12px] font-medium bg-red-50 text-red-600 border border-red-100">{error}</div>}

          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Name <span style={{ color: "#106579" }}>*</span></label>
            <input value={form.name} onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setError(""); }} placeholder="e.g. Badminton" className={inp} autoFocus />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tile Image (recommended)</label>
            <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed border-gray-300 cursor-pointer hover:bg-gray-50">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-gray-100">
                {imagePreview ? (
                  <img src={imagePreview.startsWith("blob:") ? imagePreview : IMG(imagePreview)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus size={16} className="text-gray-300" />
                )}
              </div>
              <span className="text-[12.5px] font-medium text-gray-500">{imageFile ? imageFile.name : "Upload an image"}</span>
              <input type="file" accept="image/*" onChange={onPickImage} className="hidden" />
            </label>
            <p className="text-[11px] text-gray-400 mt-1">Shown as the activity tile background. Falls back to the icon below if left empty.</p>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Fallback Icon (lucide-react name)
            </label>
            <div className="flex items-center gap-2">
              <input value={form.icon} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))} placeholder="e.g. Trophy, Volleyball" className={inp} />
              <div className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center flex-shrink-0">
                {form.icon ? renderSportIcon(form.icon, { size: 18, style: { color: "#106579" } }) : <span className="text-[10px] text-gray-300">?</span>}
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Used only when no image is uploaded. Must match a lucide-react component name exactly.</p>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))} className={inp} />
          </div>
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#106579" }}>
            {saving && <Loader2 size={13} className="animate-spin" />} {mode === "edit" ? "Save Changes" : "Add Activity"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

const ActionBtn = ({ onClick, color, title, children, disabled }) => {
  const COLOR_MAP = { blue: { bg: "#eff6ff", text: "#2563eb" }, red: { bg: "#fff1f2", text: "#dc2626" }, gray: { bg: "#f9fafb", text: "#6b7280" } };
  const c = COLOR_MAP[color];
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-40"
      style={{ background: c.bg, color: c.text }}>
      {children}
    </button>
  );
};

export default function AdminPlayActivities() {
  const [activities, setActivities] = useState([]);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editActivity, setEditActivity] = useState(null);
  const [confirmActivity, setConfirmActivity] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchAll = async () => {
    try {
      setLoading(true);
      const { data } = await axiosAdmin.get("/play/activities/admin");
      setActivities(data);
    } catch { showToast("Failed to load activities", "error"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      await axiosAdmin.post("/play/activities/admin/create", payload, { headers: { "Content-Type": "multipart/form-data" } });
      setShowAddModal(false);
      showToast("Activity added");
      fetchAll();
    } catch (err) { showToast(err.response?.data?.message || "Failed to add activity", "error"); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (payload) => {
    setSaving(true);
    try {
      await axiosAdmin.put(`/play/activities/admin/update/${editActivity._id}`, payload, { headers: { "Content-Type": "multipart/form-data" } });
      setEditActivity(null);
      showToast("Activity updated");
      fetchAll();
    } catch (err) { showToast(err.response?.data?.message || "Failed to update activity", "error"); }
    finally { setSaving(false); }
  };

  const handleToggleActive = async (activity) => {
    setTogglingId(activity._id);
    try {
      await axiosAdmin.put(`/play/activities/admin/update/${activity._id}`, { isActive: !activity.isActive });
      fetchAll();
    } catch (err) { showToast(err.response?.data?.message || "Failed to update", "error"); }
    finally { setTogglingId(null); }
  };

  const handleDelete = async () => {
    if (!confirmActivity) return;
    setDeletingId(confirmActivity._id);
    try {
      await axiosAdmin.delete(`/play/activities/admin/delete/${confirmActivity._id}`);
      setConfirmActivity(null);
      showToast("Activity deleted");
      fetchAll();
    } catch (err) { showToast(err.response?.data?.message || "Failed to delete", "error"); }
    finally { setDeletingId(null); }
  };

  const filtered = activities.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-8" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Play Activities</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Sports/activities offered through Play</p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white active:scale-[0.98] self-start sm:self-auto"
            style={{ background: "#106579" }}>
            <Plus size={15} /> Add Activity
          </button>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 mb-5 max-w-sm">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input type="text" placeholder="Search activities..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-[13px] text-gray-900 outline-none bg-transparent placeholder-gray-400" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["#", "Activity", "Sort Order", "Status", "Actions"].map((h) => (
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
                    <td className="py-4 px-4"><div className="h-4 w-10 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="flex gap-1.5">{[1, 2].map((j) => <div key={j} className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse" />)}</div></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(16,101,121,0.08)" }}>
                      <DEFAULT_SPORT_ICON size={22} style={{ color: "#106579" }} />
                    </div>
                    <p className="text-[14px] font-semibold text-gray-400">No activities found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((a, index) => {
                  const IconComp = getSportIcon(a.icon);
                  return (
                    <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="py-4 px-4 text-[13px] text-gray-400 font-medium w-10">{index + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: "rgba(16,101,121,0.08)" }}>
                            {a.image ? <img src={IMG(a.image)} alt="" className="w-full h-full object-cover" /> : <IconComp size={16} style={{ color: "#106579" }} />}
                          </div>
                          <p className="text-[13px] font-semibold text-gray-900">{a.name}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[13px] text-gray-500">{a.sortOrder}</td>
                      <td className="py-4 px-4">
                        <button onClick={() => handleToggleActive(a)} disabled={togglingId === a._id}
                          className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit transition-colors"
                          style={{
                            background: a.isActive ? "rgba(16,185,129,0.08)" : "rgba(156,163,175,0.12)",
                            color:      a.isActive ? "#059669" : "#6b7280",
                          }}>
                          {togglingId === a._id ? <Loader2 size={10} className="animate-spin" /> : a.isActive ? <Eye size={10} /> : <EyeOff size={10} />}
                          {a.isActive ? "Active" : "Hidden"}
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <ActionBtn onClick={() => setEditActivity(a)} color="blue" title="Edit"><Edit size={14} /></ActionBtn>
                          <ActionBtn onClick={() => setConfirmActivity(a)} disabled={deletingId === a._id} color="red" title="Delete">
                            {deletingId === a._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </ActionBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && <ActivityFormModal mode="add" onSave={handleCreate} onCancel={() => setShowAddModal(false)} saving={saving} />}
      {editActivity && <ActivityFormModal mode="edit" initial={editActivity} onSave={handleUpdate} onCancel={() => setEditActivity(null)} saving={saving} />}
      {confirmActivity && (
        <ConfirmModal activity={confirmActivity} onConfirm={handleDelete} onCancel={() => setConfirmActivity(null)} busy={!!deletingId} />
      )}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}