import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Receipt, CheckCircle2, Clock3, XCircle, Ticket, Sparkles,
  ArrowDownLeft, ArrowUpRight, Loader2, ArrowRight, Calendar,
  Trash2, AlertTriangle, X, Check, Wallet, RotateCcw,
} from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../api/axiosInstance";
import BottomNav from "../components/BottomNav";

const ACCENT = "#f0545c";
const IMG = (p) => (!p ? null : p.startsWith("http") ? p : `${import.meta.env.VITE_API_URL}${p}`);

const STATUS_FILTERS = [
  { id: "",        label: "All"     },
  { id: "success", label: "Success" },
  { id: "pending", label: "Pending" },
  { id: "failed",  label: "Failed"  },
];

const TYPE_FILTERS = [
  { id: "",       label: "All"    },
  { id: "debit",  label: "Debits"  },
  { id: "credit", label: "Credits" },
];

const STATUS_STYLE = {
  success: { icon: CheckCircle2, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Success" },
  pending: { icon: Clock3,       color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Pending" },
  failed:  { icon: XCircle,      color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Failed"  },
};

const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const fmtDateTime = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

/* ─────────────────────────────────────────────────────────
   Tiny toast (self-contained, no extra deps)
───────────────────────────────────────────────────────── */
function Toast({ toasts, remove }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[1200] flex flex-col gap-2 pointer-events-none w-[calc(100%-2rem)] max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold"
          style={{
            background: t.type === "error" ? "#fef2f2" : "#f0fdf4",
            color: t.type === "error" ? "#dc2626" : "#16a34a",
            border: `1px solid ${t.type === "error" ? "#fecaca" : "#bbf7d0"}`,
            animation: "toastIn 0.2s cubic-bezier(.4,0,.2,1) both",
          }}
        >
          {t.type === "error" ? <AlertTriangle size={15} /> : <Check size={15} />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)} className="opacity-50 hover:opacity-100">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  };
  const remove = (id) => setToasts((p) => p.filter((t) => t.id !== id));
  return { toasts, toast: add, remove };
}

/* ─────────────────────────────────────────────────────────
   Delete confirmation modal
───────────────────────────────────────────────────────── */
function ConfirmDeleteModal({ txn, onCancel, onConfirm, deleting }) {
  if (!txn) return null;
  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(15,15,15,0.5)", backdropFilter: "blur(2px)" }}
      onClick={onCancel}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "sheetUp 0.22s cubic-bezier(.4,0,.2,1) both" }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "#fef2f2" }}
        >
          <Trash2 size={22} style={{ color: "#dc2626" }} />
        </div>
        <h3 className="text-[17px] font-black text-gray-900 mb-1.5">Remove this transaction?</h3>
        <p className="text-[13px] text-gray-500 leading-relaxed mb-1">
          "{txn.title}" will be removed from your history. This won't affect your booking, refund, or wallet balance.
        </p>
        <p className="text-[12px] text-gray-400 mb-5">This action can't be undone.</p>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-3 rounded-xl text-[13.5px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-3 rounded-xl text-[13.5px] font-bold text-white transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            style={{ background: "#dc2626" }}
          >
            {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={14} />}
            {deleting ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Transaction row — delete lives directly on the card as an
   icon button, identical on touch and pointer devices.
───────────────────────────────────────────────────────── */
function TransactionRow({ t, onRequestDelete }) {
  const st = STATUS_STYLE[t.status] || STATUS_STYLE.success;
  const StatusIcon = st.icon;
  const isCredit = t.type === "credit";
  const isBooking = t.bookingType === "movie" || t.bookingType === "event" || t.bookingType === "play";

  return (
    <div className="bg-white border border-gray-100 hover:border-gray-200 hover:shadow-[0_2px_16px_-6px_rgba(17,17,17,0.08)] transition-all rounded-2xl">
      <div className="flex items-stretch">
        {/* Thumbnail */}
        <div
          className="w-16 md:w-[72px] flex-shrink-0 min-h-[96px] flex items-center justify-center rounded-l-2xl overflow-hidden"
          style={{
            background: t.poster
              ? `url(${IMG(t.poster)}) center/cover`
              : "linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%)",
          }}
        >
          {!t.poster && (
            isBooking
              ? <Ticket size={19} style={{ color: "rgba(255,255,255,0.25)" }} />
              : <Receipt size={19} style={{ color: "rgba(255,255,255,0.25)" }} />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-gray-900 truncate leading-tight">{t.title}</p>
              <p className="text-[10.5px] text-gray-400 mt-0.5 truncate">
                {t.subtitle ? `${t.subtitle} · ` : ""}{fmtDateTime(t.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span
                className="hidden sm:flex items-center gap-1 text-[9.5px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
              >
                <StatusIcon size={10} /> {st.label}
              </span>
              <span
                className="sm:hidden flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0"
                style={{ background: st.bg, border: `1px solid ${st.border}` }}
                title={st.label}
              >
                <StatusIcon size={12} style={{ color: st.color }} />
              </span>
              <button
                onClick={() => onRequestDelete(t)}
                className="flex items-center justify-center w-7 h-7 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 active:scale-90 transition-all"
                title="Remove from history"
                aria-label="Remove transaction"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-2.5 min-w-0">
              {t.bookingRef && (
                <span className="text-[10.5px] font-mono text-gray-400 uppercase tracking-wide truncate">{t.bookingRef}</span>
              )}
              {t.date && (
                <span className="flex items-center gap-1 text-[10.5px] text-gray-400 flex-shrink-0">
                  <Calendar size={10} /> {fmtDate(t.date)}
                </span>
              )}
            </div>
            <p
              className="text-[14px] font-black flex items-center gap-1 flex-shrink-0"
              style={{ color: isCredit ? "#16a34a" : "#111827" }}
            >
              {isCredit ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
              {isCredit ? "+" : "−"}₹{(t.amount || 0).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Segmented filter control — same component, used for both
   status and type so the two rows stay visually consistent.
───────────────────────────────────────────────────────── */
function SegmentedControl({ options, value, onChange, activeBg, activeColor = "#fff" }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-gray-100 w-fit overflow-x-auto">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className="flex-shrink-0 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
          style={value === o.id ? { background: activeBg, color: activeColor } : { color: "#6b7280" }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Summary stat chip — quick at-a-glance counts for what's
   currently loaded (updates as more pages are fetched).
───────────────────────────────────────────────────────── */
function StatChip({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-2xl px-4 py-3 flex-1 min-w-[120px]">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-black text-gray-900 leading-none">{value}</p>
        <p className="text-[10.5px] text-gray-400 font-medium mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}

export default function TransactionHistory() {
  const navigate = useNavigate();
  const { toasts, toast, remove } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [status, setStatus]             = useState("");
  const [type, setType]                 = useState("");
  const [page, setPage]                 = useState(1);
  const [pages, setPages]               = useState(1);
  const [error, setError]               = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting]           = useState(false);

  const fetchTransactions = useCallback((pageNum, append) => {
    const params = { page: pageNum, limit: 15 };
    if (status) params.status = status;
    if (type)   params.type   = type;

    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);

    api.get("/quickpay/transactions", { params })
      .then((r) => {
        setTransactions((prev) => (append ? [...prev, ...r.data.transactions] : r.data.transactions));
        setPages(r.data.pagination.pages);
        setPage(r.data.pagination.page);
      })
      .catch(() => setError("Failed to load your transaction history."))
      .finally(() => { setLoading(false); setLoadingMore(false); });
  }, [status, type]);

  useEffect(() => { fetchTransactions(1, false); }, [fetchTransactions]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/quickpay/transactions/${pendingDelete._id}`);
      setTransactions((prev) => prev.filter((t) => t._id !== pendingDelete._id));
      toast("Transaction removed from history");
    } catch {
      toast("Couldn't remove that transaction. Try again.", "error");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  const successCount = transactions.filter((t) => t.status === "success").length;
  const pendingCount  = transactions.filter((t) => t.status === "pending").length;
  const creditTotal   = transactions.filter((t) => t.type === "credit").reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div className="min-h-screen" style={{ background: "#f7f7f8", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        .fade-in { animation: fadeUp 0.28s cubic-bezier(.4,0,.2,1) both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes sheetUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
        .stagger > * { animation: fadeUp 0.3s cubic-bezier(.4,0,.2,1) both; }
        .stagger > *:nth-child(1) { animation-delay: 0.02s; }
        .stagger > *:nth-child(2) { animation-delay: 0.05s; }
        .stagger > *:nth-child(3) { animation-delay: 0.08s; }
        .stagger > *:nth-child(4) { animation-delay: 0.11s; }
        .stagger > *:nth-child(5) { animation-delay: 0.14s; }
      `}</style>

      <Navbar />
      <BottomNav />
      <Toast toasts={toasts} remove={remove} />

      {/* Extra bottom padding on mobile so content clears the fixed bottom nav */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 pb-24 lg:pb-8">
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>Account</p>
          <h1 className="text-[26px] md:text-[28px] font-black tracking-tight text-gray-900" style={{ letterSpacing: "-0.02em" }}>
            Transaction History
          </h1>
          <p className="text-[13px] text-gray-400 mt-1">Every movie and event payment, refund, and top-up in one place.</p>
        </div>

        {/* Summary stats */}
        {!loading && !error && transactions.length > 0 && (
          <div className="flex flex-wrap gap-2.5 mb-6">
            <StatChip icon={Receipt} label="Loaded" value={transactions.length} color={ACCENT} bg="rgba(240,84,92,0.08)" />
            <StatChip icon={CheckCircle2} label="Successful" value={successCount} color="#16a34a" bg="#f0fdf4" />
            <StatChip icon={Clock3} label="Pending" value={pendingCount} color="#d97706" bg="#fffbeb" />
            <StatChip icon={Wallet} label="Credited" value={`₹${creditTotal.toLocaleString("en-IN")}`} color="#0369a1" bg="#f0f9ff" />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <SegmentedControl options={STATUS_FILTERS} value={status} onChange={setStatus} activeBg={ACCENT} />
          <SegmentedControl options={TYPE_FILTERS} value={type} onChange={setType} activeBg="#1c1c1c" />
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-[96px] overflow-hidden relative">
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.03), transparent)",
                    animation: "shimmer 1.4s ease-in-out infinite",
                    backgroundSize: "200% 100%",
                  }}
                />
              </div>
            ))}
            <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#fef2f2" }}>
              <AlertTriangle size={24} style={{ color: "#dc2626" }} />
            </div>
            <p className="text-[14px] font-semibold text-gray-700 mb-1">{error}</p>
            <button
              onClick={() => fetchTransactions(1, false)}
              className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-xl"
              style={{ color: ACCENT, background: "rgba(240,84,92,0.08)" }}
            >
              <RotateCcw size={13} /> Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && !transactions.length && (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(240,84,92,0.07)" }}>
              <Receipt size={28} style={{ color: ACCENT, opacity: 0.5 }} />
            </div>
            <p className="text-[16px] font-bold text-gray-700 mb-1">No transactions found</p>
            <p className="text-[13px] text-gray-400">
              {status || type ? "Try a different filter." : "Your payments, refunds and top-ups will show up here."}
            </p>
            {!status && !type && (
              <button
                onClick={() => navigate("/")}
                className="mt-5 flex items-center gap-2 text-[13px] font-bold text-white px-6 py-2.5 rounded-xl active:scale-95 transition-transform"
                style={{ background: ACCENT }}
              >
                Explore Movies & Events <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}

        {/* List */}
        {!loading && !error && transactions.length > 0 && (
          <div className="fade-in space-y-3">
            <p className="text-[13px] font-bold text-gray-500 mb-1">
              {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-3 stagger">
              {transactions.map((t) => (
                <TransactionRow key={t._id} t={t} onRequestDelete={setPendingDelete} />
              ))}
            </div>

            {page < pages && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => fetchTransactions(page + 1, true)}
                  disabled={loadingMore}
                  className="flex items-center gap-2 text-[13px] font-semibold px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-white transition-colors disabled:opacity-60"
                >
                  {loadingMore ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={13} style={{ color: ACCENT }} />}
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        txn={pendingDelete}
        deleting={deleting}
        onCancel={() => !deleting && setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}