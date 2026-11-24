import Dialog from "../../components/Dialog";
import { useState, useEffect } from "react";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  Search, Trash2, Tag, Plus, Loader2, CheckCircle2, AlertCircle, X, Edit,
  Image as ImageIcon, Percent, Calendar, LayoutGrid,
} from "lucide-react";

const IMG = (path) => !path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;

const dateOnly = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

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

function ConfirmModal({ offer, onConfirm, onCancel, busy }) {
  return (
    <Dialog variant="form" label={"Delete offer?"} maxWidth={340} onDismiss={() => { if (!busy) onCancel(); }} dismissOnBackdrop={false}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[340px]" style={{ fontFamily: "var(--now-ui-font)" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: "#fff1f2" }}>
          <Trash2 size={18} style={{ color: "#106579" }} />
        </div>
        <h3 className="text-[15px] font-bold text-gray-900 mb-1">Delete Offer</h3>
        <p className="text-[13px] text-gray-500 mb-5">Delete <span className="font-semibold text-gray-800">"{offer.title}"</span>? This cannot be undone.</p>
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

const THEMES = ["coral", "dark", "purple", "green", "blue"];

function OfferFormModal({ mode = "add", initial = null, onSave, onCancel, saving }) {
  const [form, setForm] = useState(
    mode === "edit" && initial
      ? {
          title: initial.title || "", subtitle: initial.subtitle || "", description: initial.description || "",
          discountType: initial.discountType || "percentage", discountValue: initial.discountValue ?? "",
          maxDiscountAmount: initial.maxDiscountAmount ?? "", minPurchaseAmount: initial.minPurchaseAmount ?? "",
          code: initial.code || "", termsAndConditions: (initial.termsAndConditions || []).join("\n"),
          validFrom: dateOnly(initial.validFrom), validTill: dateOnly(initial.validTill),
          applicableTo: initial.applicableTo || "all", isActive: initial.isActive ?? true,
          showOnBanner: initial.showOnBanner ?? false, displayOrder: initial.displayOrder ?? 0,
          ctaText: initial.ctaText || "Explore now", ctaLink: initial.ctaLink || "/offers",
          theme: initial.theme || "coral",
        }
      : {
          title: "", subtitle: "", description: "", discountType: "percentage", discountValue: "",
          maxDiscountAmount: "", minPurchaseAmount: "", code: "", termsAndConditions: "",
          validFrom: "", validTill: "", applicableTo: "all", isActive: true,
          showOnBanner: false, displayOrder: 0, ctaText: "Explore now", ctaLink: "/offers", theme: "coral",
        }
  );
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(initial?.image ? IMG(initial.image) : null);
  const [errors, setErrors] = useState({});

  const set = (field, val) => { setForm((p) => ({ ...p, [field]: val })); setErrors((p) => ({ ...p, [field]: "" })); };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.discountValue) e.discountValue = "Discount value is required";
    if (!form.validFrom) e.validFrom = "Start date is required";
    if (!form.validTill) e.validTill = "End date is required";
    if (form.validFrom && form.validTill && form.validFrom > form.validTill) e.validTill = "Must be after start date";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("subtitle", form.subtitle.trim());
    fd.append("description", form.description.trim());
    fd.append("discountType", form.discountType);
    fd.append("discountValue", form.discountValue);
    fd.append("maxDiscountAmount", form.maxDiscountAmount || "");
    fd.append("minPurchaseAmount", form.minPurchaseAmount || 0);
    fd.append("code", form.code.trim());
    fd.append("termsAndConditions", JSON.stringify(form.termsAndConditions.split("\n").map((t) => t.trim()).filter(Boolean)));
    fd.append("validFrom", form.validFrom);
    fd.append("validTill", form.validTill);
    fd.append("applicableTo", form.applicableTo);
    fd.append("isActive", form.isActive);
    fd.append("showOnBanner", form.showOnBanner);
    fd.append("displayOrder", form.displayOrder || 0);
    fd.append("ctaText", form.ctaText.trim());
    fd.append("ctaLink", form.ctaLink.trim());
    fd.append("theme", form.theme);
    if (imageFile) fd.append("image", imageFile);
    onSave(fd);
  };

  const inp = "w-full px-4 py-2.5 rounded-xl border text-[13px] text-gray-800 placeholder-gray-300 outline-none transition-all";
  const label = "block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <Dialog variant="form" label={(mode === "edit" ? "Edit " : "Add ") + "offer"} maxWidth={560} onDismiss={() => { if (!saving) onCancel(); }} dismissOnBackdrop={false}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[560px] max-h-[90vh] flex flex-col" style={{ fontFamily: "var(--now-ui-font)" }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,101,121,0.08)" }}>
              {mode === "edit" ? <Edit size={18} style={{ color: "#106579" }} /> : <Tag size={18} style={{ color: "#106579" }} />}
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">{mode === "edit" ? "Edit Offer" : "Add New Offer"}</h3>
              <p className="text-[12px] text-gray-400">Discounts for movies & events</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"><X size={16} className="text-gray-400" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 flex items-center justify-center">
              {preview ? <img src={preview} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-gray-300" />}
            </div>
            <label className="px-4 py-2 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-600 cursor-pointer hover:bg-gray-50">
              Upload Banner
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
          </div>

          <div>
            <label className={label}>Title <span style={{ color: "#106579" }}>*</span></label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Flat 20% off on all movies" className={inp} style={{ borderColor: errors.title ? "#106579" : "#e4e4e7" }} />
            {errors.title && <p className="text-[11px] text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Subtitle / Badge</label>
              <input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="Limited Time" className={inp} style={{ borderColor: "#e4e4e7" }} />
            </div>
            <div>
              <label className={label}>Coupon Code</label>
              <input value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="Auto-applied if blank" className={inp} style={{ borderColor: "#e4e4e7" }} />
            </div>
          </div>

          <div>
            <label className={label}>Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Short description…" className={inp} style={{ borderColor: "#e4e4e7", resize: "vertical" }} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={label}>Type</label>
              <select value={form.discountType} onChange={(e) => set("discountType", e.target.value)} className={inp} style={{ borderColor: "#e4e4e7" }}>
                <option value="percentage">Percentage</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className={label}>Value <span style={{ color: "#106579" }}>*</span></label>
              <input type="number" value={form.discountValue} onChange={(e) => set("discountValue", e.target.value)} placeholder="20" className={inp} style={{ borderColor: errors.discountValue ? "#106579" : "#e4e4e7" }} />
            </div>
            <div>
              <label className={label}>Max Cap (₹)</label>
              <input type="number" value={form.maxDiscountAmount} onChange={(e) => set("maxDiscountAmount", e.target.value)} placeholder="Optional" className={inp} style={{ borderColor: "#e4e4e7" }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Valid From <span style={{ color: "#106579" }}>*</span></label>
              <input type="date" value={form.validFrom} onChange={(e) => set("validFrom", e.target.value)} className={inp} style={{ borderColor: errors.validFrom ? "#106579" : "#e4e4e7" }} />
              {errors.validFrom && <p className="text-[11px] text-red-500 mt-1">{errors.validFrom}</p>}
            </div>
            <div>
              <label className={label}>Valid Till <span style={{ color: "#106579" }}>*</span></label>
              <input type="date" value={form.validTill} onChange={(e) => set("validTill", e.target.value)} className={inp} style={{ borderColor: errors.validTill ? "#106579" : "#e4e4e7" }} />
              {errors.validTill && <p className="text-[11px] text-red-500 mt-1">{errors.validTill}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Applies To</label>
              <select value={form.applicableTo} onChange={(e) => set("applicableTo", e.target.value)} className={inp} style={{ borderColor: "#e4e4e7" }}>
                <option value="all">All (Movies & Events)</option>
                <option value="movies">Movies only</option>
                <option value="events">Events only</option>
              </select>
            </div>
            <div>
              <label className={label}>Banner Theme</label>
              <select value={form.theme} onChange={(e) => set("theme", e.target.value)} className={inp} style={{ borderColor: "#e4e4e7" }}>
                {THEMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={label}>Terms & Conditions (one per line)</label>
            <textarea value={form.termsAndConditions} onChange={(e) => set("termsAndConditions", e.target.value)} rows={3} placeholder={"Valid on select movies only\nCannot be combined with other offers"} className={inp} style={{ borderColor: "#e4e4e7", resize: "vertical" }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>CTA Text</label>
              <input value={form.ctaText} onChange={(e) => set("ctaText", e.target.value)} className={inp} style={{ borderColor: "#e4e4e7" }} />
            </div>
            <div>
              <label className={label}>CTA Link</label>
              <input value={form.ctaLink} onChange={(e) => set("ctaLink", e.target.value)} className={inp} style={{ borderColor: "#e4e4e7" }} />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="w-4 h-4 accent-now-accent" />
              <span className="text-[13px] font-medium text-gray-700">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.showOnBanner} onChange={(e) => set("showOnBanner", e.target.checked)} className="w-4 h-4 accent-now-accent" />
              <span className="text-[13px] font-medium text-gray-700 flex items-center gap-1"><LayoutGrid size={13} /> Show on homepage banner</span>
            </label>
          </div>
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#106579" }}>
            {saving && <Loader2 size={13} className="animate-spin" />} {mode === "edit" ? "Save Changes" : "Add Offer"}
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

const isLive = (o) => {
  const now = new Date();
  return o.isActive && new Date(o.validFrom) <= now && new Date(o.validTill) >= now;
};

export default function AdminOffers() {
  const [offers, setOffers]             = useState([]);
  const [search, setSearch]             = useState("");
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [deletingId, setDeletingId]     = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editOffer, setEditOffer]       = useState(null);
  const [confirmOffer, setConfirmOffer] = useState(null);
  const [toast, setToast]               = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await axiosAdmin.get("/offers/admin/all");
      setOffers(res.data);
    } catch { showToast("Failed to load offers", "error"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchOffers(); }, []);

  const handleCreate = async (fd) => {
    setSaving(true);
    try {
      await axiosAdmin.post("/offers/admin/create", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setShowAddModal(false);
      showToast("Offer added successfully");
      fetchOffers();
    } catch (err) { showToast(err.response?.data?.message || "Failed to add offer", "error"); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (fd) => {
    setSaving(true);
    try {
      await axiosAdmin.put(`/offers/admin/update/${editOffer._id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setEditOffer(null);
      showToast("Offer updated successfully");
      fetchOffers();
    } catch (err) { showToast(err.response?.data?.message || "Failed to update offer", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmOffer) return;
    setDeletingId(confirmOffer._id);
    try {
      await axiosAdmin.delete(`/offers/admin/delete/${confirmOffer._id}`);
      setConfirmOffer(null);
      showToast("Offer deleted");
      fetchOffers();
    } catch (err) { showToast(err.response?.data?.message || "Failed to delete", "error"); }
    finally { setDeletingId(null); }
  };

  const filtered = offers.filter((o) => o.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-8" style={{ fontFamily: "var(--now-ui-font)" }}>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Offers</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Manage discounts & the homepage offer banner</p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white active:scale-[0.98] self-start sm:self-auto"
            style={{ background: "#106579" }}>
            <Plus size={15} /> Add Offer
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Offers", value: offers.length, color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
            { label: "Live Now",     value: offers.filter(isLive).length, color: "#16a34a", bg: "rgba(22,163,74,0.08)" },
            { label: "On Banner",    value: offers.filter((o) => o.showOnBanner).length, color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
            { label: "Search Results", value: search ? filtered.length : "—", color: "#106579", bg: "rgba(16,101,121,0.08)" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-[26px] font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 mb-5 max-w-md">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input type="text" placeholder="Search offers..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-[13px] text-gray-900 outline-none bg-transparent placeholder-gray-400" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["#", "Offer", "Discount", "Applies To", "Validity", "Status", "Banner", "Actions"].map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-4 px-4" colSpan={8}><div className="h-6 bg-gray-100 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(16,101,121,0.08)" }}>
                      <Tag size={22} style={{ color: "#106579" }} />
                    </div>
                    <p className="text-[14px] font-semibold text-gray-400">No offers found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((o, index) => (
                  <tr key={o._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-4 text-[13px] text-gray-400 font-medium w-10">{index + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                          {o.image ? <img src={IMG(o.image)} alt={o.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Tag size={13} className="text-gray-300" /></div>}
                        </div>
                        <p className="text-[13px] font-semibold text-gray-900 max-w-[220px] truncate">{o.title}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="flex items-center gap-1 text-[12px] font-bold" style={{ color: "#106579" }}>
                        <Percent size={11} /> {o.discountType === "percentage" ? `${o.discountValue}%` : `₹${o.discountValue}`}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[12px] text-gray-500 capitalize">{o.applicableTo}</td>
                    <td className="py-4 px-4">
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Calendar size={11} /> {dateOnly(o.validFrom)} → {dateOnly(o.validTill)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {isLive(o)
                        ? <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a" }}>Live</span>
                        : <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">{o.isActive ? "Scheduled" : "Inactive"}</span>}
                    </td>
                    <td className="py-4 px-4">
                      {o.showOnBanner
                        ? <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(245,158,11,0.08)", color: "#d97706" }}>Yes</span>
                        : <span className="text-gray-300 text-[13px]">—</span>}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <ActionBtn onClick={() => setEditOffer(o)} color="blue" title="Edit"><Edit size={14} /></ActionBtn>
                        <ActionBtn onClick={() => setConfirmOffer(o)} disabled={deletingId === o._id} color="red" title="Delete">
                          {deletingId === o._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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

      {showAddModal && <OfferFormModal mode="add" onSave={handleCreate} onCancel={() => setShowAddModal(false)} saving={saving} />}
      {editOffer && <OfferFormModal mode="edit" initial={editOffer} onSave={handleUpdate} onCancel={() => setEditOffer(null)} saving={saving} />}
      {confirmOffer && <ConfirmModal offer={confirmOffer} onConfirm={handleDelete} onCancel={() => setConfirmOffer(null)} busy={!!deletingId} />}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}