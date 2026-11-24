import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  ChevronLeft, Plus, Trash2, Edit, Check, X,
  Loader2, CheckCircle2, AlertCircle, Armchair, Users,
} from "lucide-react";

const CATEGORIES = ["VIP", "Premium", "General"];
const CAT_COLORS = {
  VIP:     { bg: "rgba(139,92,246,0.1)", text: "#7c3aed", border: "rgba(139,92,246,0.3)" },
  Premium: { bg: "rgba(16,101,121,0.1)",  text: "#106579", border: "rgba(16,101,121,0.3)"  },
  General: { bg: "rgba(16,185,129,0.1)", text: "#059669", border: "rgba(16,185,129,0.3)" },
};

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

function SeatPreviewRow({ rowData }) {
  const c = CAT_COLORS[rowData.category] || CAT_COLORS.General;
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="w-8 text-[11px] font-bold text-gray-400 text-center">{rowData.row}</span>
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: rowData.seats }, (_, i) => (
          <div key={i} className="w-6 h-6 rounded-md border text-[9px] font-bold flex items-center justify-center"
            style={{ background: c.bg, borderColor: c.border, color: c.text }}>{i + 1}</div>
        ))}
      </div>
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-1" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
        {rowData.category}
      </span>
    </div>
  );
}

export default function AdminVenueSeatLayout() {
  const { venueId } = useParams();
  const navigate = useNavigate();

  const [venueName, setVenueName] = useState("");
  const [layout, setLayout]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);

  const [addForm, setAddForm] = useState({ row: "", seats: "", category: "General" });
  const [addErr, setAddErr]   = useState({});
  const [addBusy, setAddBusy] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [editBusy, setEditBusy]   = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchLayout = async () => {
    try {
      setLoading(true);
      const [layoutRes, venueRes] = await Promise.all([
        axiosAdmin.get(`/venues/admin/${venueId}/layout`),
        axiosAdmin.get(`/venues/${venueId}`),
      ]);
      setLayout(layoutRes.data.layout || []);
      setVenueName(venueRes.data.name);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load layout", "error");
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchLayout(); }, []);

  const totalSeats = layout.reduce((s, r) => s + (r.seats || 0), 0);
  const catCounts  = layout.reduce((acc, r) => { acc[r.category] = (acc[r.category] || 0) + r.seats; return acc; }, {});

  const validateAdd = () => {
    const e = {};
    if (!addForm.row.trim()) e.row = "Required";
    if (!addForm.seats || +addForm.seats < 1) e.seats = "Min 1";
    if (layout.find((r) => r.row === addForm.row.trim())) e.row = "Row label already used";
    setAddErr(e);
    return !Object.keys(e).length;
  };

  const handleAddRow = async () => {
    if (!validateAdd()) return;
    setAddBusy(true);
    try {
      const res = await axiosAdmin.post(`/venues/admin/${venueId}/layout/rows`, {
        row: addForm.row.trim(), seats: Number(addForm.seats), category: addForm.category,
      });
      setLayout(res.data.layout);
      setAddForm({ row: "", seats: "", category: "General" });
      setAddErr({});
      showToast(`Row "${addForm.row.trim()}" added`);
    } catch (err) { showToast(err.response?.data?.message || "Failed to add row", "error"); }
    finally { setAddBusy(false); }
  };

  const startEdit = (row) => { setEditingId(row._id); setEditForm({ row: row.row, seats: String(row.seats), category: row.category }); };

  const handleSaveEdit = async (rowId) => {
    if (!editForm.row?.trim() || !editForm.seats || +editForm.seats < 1) return;
    setEditBusy(rowId);
    try {
      const res = await axiosAdmin.put(`/venues/admin/${venueId}/layout/rows/${rowId}`, {
        row: editForm.row.trim(), seats: Number(editForm.seats), category: editForm.category,
      });
      setLayout(res.data.layout);
      setEditingId(null);
      showToast("Row updated");
    } catch (err) { showToast(err.response?.data?.message || "Failed to update row", "error"); }
    finally { setEditBusy(false); }
  };

  const handleDeleteRow = async (rowId, label) => {
    setDeletingId(rowId);
    try {
      const res = await axiosAdmin.delete(`/venues/admin/${venueId}/layout/rows/${rowId}`);
      setLayout(res.data.layout);
      showToast(`Row "${label}" deleted`);
    } catch (err) { showToast(err.response?.data?.message || "Failed to delete row", "error"); }
    finally { setDeletingId(null); }
  };

  const inp = "px-3 py-1.5 rounded-lg border text-[12px] text-gray-800 outline-none";

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-8" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

        <button onClick={() => navigate("/admin/venues")} className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-gray-800 mb-4">
          <ChevronLeft size={15} /> Back to Venues
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Seat Layout</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">{venueName || "…"}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(16,101,121,0.08)" }}>
            <Armchair size={15} style={{ color: "#106579" }} />
            <span className="text-[13px] font-bold" style={{ color: "#106579" }}>{totalSeats} total seats</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: row editor */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-[15px] font-bold text-gray-900">Rows</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">Define seating rows and categories</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
            ) : (
              <div className="px-5 py-3 divide-y divide-gray-50">
                {layout.length === 0 ? (
                  <p className="text-[12px] text-gray-300 py-6 text-center">No rows yet — add one below</p>
                ) : layout.map((row) => {
                  const isEditing = editingId === row._id;
                  const isDeleting = deletingId === row._id;
                  const c = CAT_COLORS[row.category] || CAT_COLORS.General;
                  return (
                    <div key={row._id} className="flex items-center gap-2 py-2.5 group">
                      {isEditing ? (
                        <>
                          <input value={editForm.row} onChange={(e) => setEditForm((p) => ({ ...p, row: e.target.value }))} className={inp + " w-14"} style={{ borderColor: "#e4e4e7" }} placeholder="Row" />
                          <input type="number" value={editForm.seats} min="1" max="50" onChange={(e) => setEditForm((p) => ({ ...p, seats: e.target.value }))} className={inp + " w-16"} style={{ borderColor: "#e4e4e7" }} placeholder="Seats" />
                          <select value={editForm.category} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))} className={inp + " flex-1"} style={{ borderColor: "#e4e4e7" }}>
                            {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                          <button onClick={() => handleSaveEdit(row._id)} disabled={editBusy === row._id}
                            className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                            {editBusy === row._id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          </button>
                          <button onClick={() => setEditingId(null)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-100 text-gray-500"><X size={12} /></button>
                        </>
                      ) : (
                        <>
                          <span className="w-8 text-[13px] font-bold text-gray-800 text-center">{row.row}</span>
                          <span className="flex items-center gap-1 text-[12px] text-gray-500 w-16"><Users size={11} /> {row.seats}</span>
                          <span className="flex-1 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{row.category}</span>
                          <button onClick={() => startEdit(row)} className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100" style={{ background: "#eff6ff", color: "#2563eb" }}><Edit size={12} /></button>
                          <button onClick={() => handleDeleteRow(row._id, row.row)} disabled={isDeleting}
                            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 disabled:opacity-40" style={{ background: "#fff1f2", color: "#dc2626" }}>
                            {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && (
              <div className="px-5 py-4 border-t border-dashed border-gray-200 bg-gray-50/50">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Add New Row</p>
                <div className="flex items-start gap-2 flex-wrap">
                  <div>
                    <input value={addForm.row} onChange={(e) => { setAddForm((p) => ({ ...p, row: e.target.value })); setAddErr((p) => ({ ...p, row: "" })); }}
                      placeholder="Row label (A)" onKeyDown={(e) => e.key === "Enter" && handleAddRow()} className={inp + " w-28"} style={{ borderColor: addErr.row ? "#106579" : "#e4e4e7" }} />
                    {addErr.row && <p className="text-[10px] text-red-500 mt-0.5">{addErr.row}</p>}
                  </div>
                  <div>
                    <input type="number" value={addForm.seats} min="1" max="50"
                      onChange={(e) => { setAddForm((p) => ({ ...p, seats: e.target.value })); setAddErr((p) => ({ ...p, seats: "" })); }}
                      placeholder="Seats" onKeyDown={(e) => e.key === "Enter" && handleAddRow()} className={inp + " w-20"} style={{ borderColor: addErr.seats ? "#106579" : "#e4e4e7" }} />
                    {addErr.seats && <p className="text-[10px] text-red-500 mt-0.5">{addErr.seats}</p>}
                  </div>
                  <select value={addForm.category} onChange={(e) => setAddForm((p) => ({ ...p, category: e.target.value }))} className={inp} style={{ borderColor: "#e4e4e7" }}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={handleAddRow} disabled={addBusy}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: "#106579" }}>
                    {addBusy ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add Row
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: live preview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-[15px] font-bold text-gray-900">Live Preview</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">How seats will appear to users</p>
            </div>
            <div className="p-5">
              <div className="flex flex-col items-center mb-6">
                <div className="w-3/4 h-1.5 rounded-b-full opacity-40" style={{ background: "linear-gradient(to right, transparent, #106579, transparent)" }} />
                <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mt-1.5">STAGE</p>
              </div>
              {layout.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                  <Armchair size={28} className="mb-2" />
                  <p className="text-[12px]">Add rows to see preview</p>
                </div>
              ) : (
                <div className="space-y-1 overflow-x-auto">
                  {layout.map((row) => <SeatPreviewRow key={row._id} rowData={row} />)}
                </div>
              )}
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
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}