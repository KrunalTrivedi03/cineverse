import Dialog from "../../components/Dialog";
import DeleteDialog from "../../components/DeleteDialog";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  ChevronLeft, Plus, Trash2, Edit, Check, X,
  Loader2, CheckCircle2, AlertCircle, Monitor,
  Building2, Users, ArrowUp, ArrowDown,
} from "lucide-react";

const CATEGORIES = ["Recliner", "Premium", "Classic"];
const CAT_COLORS = {
  Recliner: { bg: "rgba(139,92,246,0.1)", text: "#7c3aed", border: "rgba(139,92,246,0.3)" },
  Premium:  { bg: "rgba(16,101,121,0.1)",  text: "#106579", border: "rgba(16,101,121,0.3)"  },
  Classic:  { bg: "rgba(16,185,129,0.1)", text: "#059669", border: "rgba(16,185,129,0.3)" },
};

/* ── Toast ── */
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

/* ── Seat Preview Row ── */
function SeatPreviewRow({ rowData }) {
  const c = CAT_COLORS[rowData.category] || CAT_COLORS.Classic;
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="w-8 text-[11px] font-bold text-gray-400 text-center">{rowData.row}</span>
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: rowData.seats }, (_, i) => (
          <div key={i}
            className="w-6 h-6 rounded-md border text-[9px] font-bold flex items-center justify-center"
            style={{ background: c.bg, borderColor: c.border, color: c.text }}>
            {i + 1}
          </div>
        ))}
      </div>
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-1"
        style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
        {rowData.category}
      </span>
    </div>
  );
}

export default function AdminSeatLayout() {
  const { theatreId, screenId } = useParams();
  const navigate = useNavigate();

  const [screenInfo, setScreenInfo] = useState(null);
  const [layout,     setLayout]     = useState([]);   // [{ _id, row, seats, category }]
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);
  const [randomizing, setRandomizing] = useState(false);

  /* Add row form */
  const [addForm, setAddForm]   = useState({ row: "", seats: "", category: "Classic" });
  const [addErr,  setAddErr]    = useState({});
  const [addBusy, setAddBusy]   = useState(false);

  /* Inline edit */
  const [editingId, setEditingId] = useState(null);
  const [editForm,  setEditForm]  = useState({});
  const [editBusy,  setEditBusy]  = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [confirmRandomLayout, setConfirmRandomLayout] = useState(false);

  const showToast = (message, type = "success") => setToast({ message, type });

  /* ── Fetch layout ── */
  const fetchLayout = async () => {
    try {
      setLoading(true);
      const res = await axiosAdmin.get(`/theatres/admin/${theatreId}/screens/${screenId}/layout`);
      setScreenInfo({ name: res.data.screenName, totalSeats: res.data.totalSeats });
      setLayout(res.data.layout || []);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load layout", "error");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchLayout(); }, []);

  /* ── Stats ── */
  const totalSeats    = layout.reduce((s, r) => s + (r.seats || 0), 0);
  const totalRows     = layout.length;
  const catCounts     = layout.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + r.seats;
    return acc;
  }, {});

  /* ── Validate add form ── */
  const validateAdd = () => {
    const e = {};
    if (!addForm.row.trim())              e.row   = "Required";
    if (!addForm.seats || +addForm.seats < 1) e.seats = "Min 1";
    if (layout.find((r) => r.row === addForm.row.trim())) e.row = "Row label already used";
    setAddErr(e);
    return !Object.keys(e).length;
  };

  /* ── Add row ── */
  const handleAddRow = async () => {
    if (!validateAdd()) return;
    setAddBusy(true);
    try {
      const res = await axiosAdmin.post(
        `/theatres/admin/${theatreId}/screens/${screenId}/layout/rows`,
        { row: addForm.row.trim(), seats: Number(addForm.seats), category: addForm.category }
      );
      setLayout(res.data.layout);
      setScreenInfo((p) => ({ ...p, totalSeats: res.data.totalSeats }));
      setAddForm({ row: "", seats: "", category: "Classic" });
      setAddErr({});
      showToast(`Row "${addForm.row.trim()}" added`);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add row", "error");
    } finally { setAddBusy(false); }
  };

  /* ── Start edit ── */
  const startEdit = (row) => {
    setEditingId(row._id);
    setEditForm({ row: row.row, seats: String(row.seats), category: row.category });
  };

  /* ── Save edit ── */
  const handleSaveEdit = async (rowId) => {
    if (!editForm.row?.trim() || !editForm.seats || +editForm.seats < 1) return;
    setEditBusy(rowId);
    try {
      const res = await axiosAdmin.put(
        `/theatres/admin/${theatreId}/screens/${screenId}/layout/rows/${rowId}`,
        { row: editForm.row.trim(), seats: Number(editForm.seats), category: editForm.category }
      );
      setLayout(res.data.layout);
      setScreenInfo((p) => ({ ...p, totalSeats: res.data.totalSeats }));
      setEditingId(null);
      showToast("Row updated");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update row", "error");
    } finally { setEditBusy(false); }
  };

  /* ── Delete row ── */
  const handleDeleteRow = async (rowId, rowLabel) => {
    setRowToDelete(null);
    setDeletingId(rowId);
    try {
      const res = await axiosAdmin.delete(
        `/theatres/admin/${theatreId}/screens/${screenId}/layout/rows/${rowId}`
      );
      setLayout(res.data.layout);
      setScreenInfo((p) => ({ ...p, totalSeats: res.data.totalSeats }));
      showToast(`Row "${rowLabel}" deleted`);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete row", "error");
    } finally { setDeletingId(null); }
  };

  const handleRandomLayout = async () => {
    setConfirmRandomLayout(false);
    setRandomizing(true);
    try {
      const res = await axiosAdmin.post(`/theatres/admin/${theatreId}/screens/${screenId}/layout/random`);
      setLayout(res.data.layout);
      setScreenInfo((p) => ({ ...p, totalSeats: res.data.totalSeats }));
      showToast("Random seat layout generated");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to generate layout", "error");
    } finally { setRandomizing(false); }
  };

  /* ── Move row up/down (reorder locally, then save full layout) ── */
  const moveRow = async (index, dir) => {
    const newLayout = [...layout];
    const target    = index + dir;
    if (target < 0 || target >= newLayout.length) return;
    [newLayout[index], newLayout[target]] = [newLayout[target], newLayout[index]];

    setSaving(true);
    try {
      const res = await axiosAdmin.put(
        `/theatres/admin/${theatreId}/screens/${screenId}/layout`,
        { rows: newLayout.map(({ row, seats, category }) => ({ row, seats, category })) }
      );
      setLayout(res.data.layout);
      setScreenInfo((p) => ({ ...p, totalSeats: res.data.totalSeats }));
    } catch {
      showToast("Failed to reorder rows", "error");
    } finally { setSaving(false); }
  };

  const inp = "px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-800 outline-none bg-white transition-all focus:border-now-accent";

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-8" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 hover:bg-gray-100 transition-all">
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,101,121,0.08)" }}>
              <Monitor size={18} style={{ color: "#106579" }} />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-gray-900">
                Seat Layout — {screenInfo?.name || "Screen"}
              </h1>
              <p className="text-[13px] text-gray-400 mt-0.5">
                Define rows, seat count and category for each row
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Seats",    value: totalSeats,                   color: "#6366f1" },
            { label: "Total Rows",     value: totalRows,                    color: "#10b981" },
            { label: "Recliner Seats", value: catCounts.Recliner || 0,     color: "#8b5cf6" },
            { label: "Premium Seats",  value: catCounts.Premium  || 0,     color: "#106579" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-[26px] font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* ── Left: Row Manager ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-gray-900">Row Configuration</h2>
              <div className="flex items-center gap-2">
                {saving && <Loader2 size={15} className="animate-spin text-gray-400" />}
                <button onClick={() => setConfirmRandomLayout(true)} disabled={randomizing}
                  className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                  style={{ color: "#106579", background: "rgba(16,101,121,0.08)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(16,101,121,0.14)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(16,101,121,0.08)")}>
                  {randomizing ? <Loader2 size={12} className="animate-spin" /> : <Monitor size={12} />}
                  Generate Random Layout
                </button>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
                <Loader2 size={18} className="animate-spin" style={{ color: "#106579" }} />
                <span className="text-[13px]">Loading layout…</span>
              </div>
            )}

            {/* Row list */}
            {!loading && (
              <div className="divide-y divide-gray-50">
                {layout.length === 0 && (
                  <div className="py-10 text-center text-[13px] text-gray-400 italic">
                    No rows yet — add your first row below
                  </div>
                )}

                {layout.map((row, index) => {
                  const c = CAT_COLORS[row.category] || CAT_COLORS.Classic;
                  const isEditing  = editingId === row._id;
                  const isDeleting = deletingId === row._id;

                  return (
                    <div key={row._id} className="flex items-center gap-3 px-5 py-3 group hover:bg-gray-50/50 transition-colors">

                      {/* Reorder arrows */}
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button onClick={() => moveRow(index, -1)} disabled={index === 0}
                          className="w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">
                          <ArrowUp size={11} />
                        </button>
                        <button onClick={() => moveRow(index, 1)} disabled={index === layout.length - 1}
                          className="w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">
                          <ArrowDown size={11} />
                        </button>
                      </div>

                      {isEditing ? (
                        /* ── Edit mode ── */
                        <>
                          <input value={editForm.row} onChange={(e) => setEditForm((p) => ({ ...p, row: e.target.value }))}
                            className={inp + " w-14"} placeholder="Row" />
                          <input type="number" value={editForm.seats} min="1" max="30"
                            onChange={(e) => setEditForm((p) => ({ ...p, seats: e.target.value }))}
                            className={inp + " w-16"} placeholder="Seats" />
                          <select value={editForm.category} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                            className={inp + " flex-1"}>
                            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <button onClick={() => handleSaveEdit(row._id)} disabled={editBusy === row._id}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                            style={{ background: "#f0fdf4", color: "#16a34a" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#dcfce7")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#f0fdf4")}>
                            {editBusy === row._id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-all text-gray-500">
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        /* ── Display mode ── */
                        <>
                          <span className="w-8 text-[13px] font-bold text-gray-800 text-center">{row.row}</span>
                          <span className="flex items-center gap-1 text-[12px] text-gray-500 w-16">
                            <Users size={11} /> {row.seats}
                          </span>
                          <span className="flex-1 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit"
                            style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                            {row.category}
                          </span>

                          {/* Edit btn */}
                          <button onClick={() => startEdit(row)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                            style={{ background: "#eff6ff", color: "#2563eb" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#dbeafe")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#eff6ff")}>
                            <Edit size={12} />
                          </button>
                          {/* Delete btn */}
                          <button onClick={() => setRowToDelete(row)} aria-label={`Delete row ${row.row}`} disabled={isDeleting}
                            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all disabled:opacity-40"
                            style={{ background: "#fff1f2", color: "#dc2626" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff1f2")}>
                            {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Add row form ── */}
            {!loading && (
              <div className="px-5 py-4 border-t border-dashed border-gray-200 bg-gray-50/50">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Add New Row</p>
                <div className="flex items-start gap-2 flex-wrap">
                  <div>
                    <input value={addForm.row} onChange={(e) => { setAddForm((p) => ({ ...p, row: e.target.value })); setAddErr((p) => ({ ...p, row: "" })); }}
                      placeholder="Row label (e.g. A)" onKeyDown={(e) => e.key === "Enter" && handleAddRow()}
                      className={inp + " w-28"} style={{ borderColor: addErr.row ? "#106579" : "#e4e4e7" }} />
                    {addErr.row && <p className="text-[10px] text-red-500 mt-0.5">{addErr.row}</p>}
                  </div>
                  <div>
                    <input type="number" value={addForm.seats} min="1" max="30"
                      onChange={(e) => { setAddForm((p) => ({ ...p, seats: e.target.value })); setAddErr((p) => ({ ...p, seats: "" })); }}
                      placeholder="Seats" onKeyDown={(e) => e.key === "Enter" && handleAddRow()}
                      className={inp + " w-20"} style={{ borderColor: addErr.seats ? "#106579" : "#e4e4e7" }} />
                    {addErr.seats && <p className="text-[10px] text-red-500 mt-0.5">{addErr.seats}</p>}
                  </div>
                  <select value={addForm.category} onChange={(e) => setAddForm((p) => ({ ...p, category: e.target.value }))}
                    className={inp}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={handleAddRow} disabled={addBusy}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-all disabled:opacity-50"
                    style={{ background: "#106579" }}
                    onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "#e04048"; }}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#106579")}>
                    {addBusy ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    Add Row
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Live Preview ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-[15px] font-bold text-gray-900">Live Preview</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">How seats will appear to users</p>
            </div>

            <div className="p-5">
              {/* Screen indicator */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-3/4 h-1.5 rounded-b-full opacity-40"
                  style={{ background: "linear-gradient(to right, transparent, #106579, transparent)" }} />
                <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mt-1.5 flex items-center gap-1">
                  <Monitor size={10} /> Screen
                </p>
              </div>

              {layout.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                  <Monitor size={28} className="mb-2" />
                  <p className="text-[12px]">Add rows to see preview</p>
                </div>
              ) : (
                <div className="space-y-1 overflow-x-auto">
                  {layout.map((row) => <SeatPreviewRow key={row._id} rowData={row} />)}
                </div>
              )}

              {/* Category legend */}
              {layout.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-100">
                  {CATEGORIES.filter((cat) => layout.some((r) => r.category === cat)).map((cat) => {
                    const c = CAT_COLORS[cat];
                    return (
                      <div key={cat} className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded border" style={{ background: c.bg, borderColor: c.border }} />
                        <span className="text-[11px] font-semibold" style={{ color: c.text }}>{cat}</span>
                        <span className="text-[10px] text-gray-400">({catCounts[cat] || 0} seats)</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {rowToDelete && (
        <DeleteDialog title="Delete seat row?" onCancel={() => setRowToDelete(null)} onDelete={() => handleDeleteRow(rowToDelete._id, rowToDelete.row)}>
          <p>Row <strong>{rowToDelete.row}</strong> will be removed from the seat layout.</p>
        </DeleteDialog>
      )}
      {confirmRandomLayout && (
        <Dialog label="Replace seat layout" onDismiss={() => setConfirmRandomLayout(false)}>
          <div className="p-5 sm:p-7">
            <h2 className="text-xl font-bold">Replace seat layout?</h2>
            <p className="mt-2 text-sm text-gray-500">This replaces the current seat layout with a randomly generated one.</p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button type="button" className="min-h-11 rounded-xl border border-gray-200 px-4 text-sm font-semibold" onClick={() => setConfirmRandomLayout(false)}>Cancel</button>
              <button type="button" className="now-primary" onClick={handleRandomLayout}>Replace layout</button>
            </div>
          </div>
        </Dialog>
      )}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}


