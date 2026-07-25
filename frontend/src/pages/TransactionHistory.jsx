import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Receipt, CheckCircle2, Clock3, XCircle, Ticket, Sparkles,
  ArrowDownLeft, ArrowUpRight, Loader2, ArrowRight, Calendar,
} from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../api/axiosInstance";

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

function TransactionRow({ t }) {
  const st = STATUS_STYLE[t.status] || STATUS_STYLE.success;
  const StatusIcon = st.icon;
  const isCredit = t.type === "credit";
  const isBooking = t.bookingType === "movie" || t.bookingType === "event";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors">
      <div className="flex items-stretch">
        {/* Thumbnail */}
        <div
          className="w-14 md:w-16 flex-shrink-0 min-h-[92px] flex items-center justify-center"
          style={{
            background: t.poster
              ? `url(${IMG(t.poster)}) center/cover`
              : "linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%)",
          }}
        >
          {!t.poster && (
            isBooking
              ? <Ticket size={18} style={{ color: "rgba(255,255,255,0.25)" }} />
              : <Receipt size={18} style={{ color: "rgba(255,255,255,0.25)" }} />
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
            <span
              className="flex-shrink-0 flex items-center gap-1 text-[9.5px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
              style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
            >
              <StatusIcon size={10} /> {st.label}
            </span>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-2">
              {t.bookingRef && (
                <span className="text-[10.5px] font-mono text-gray-400 uppercase tracking-wide">{t.bookingRef}</span>
              )}
              {t.date && (
                <span className="flex items-center gap-1 text-[10.5px] text-gray-400">
                  <Calendar size={10} /> {fmtDate(t.date)}
                </span>
              )}
            </div>
            <p
              className="text-[14px] font-black flex items-center gap-1"
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

export default function TransactionHistory() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [status, setStatus]             = useState("");
  const [type, setType]                 = useState("");
  const [page, setPage]                 = useState(1);
  const [pages, setPages]               = useState(1);
  const [error, setError]               = useState(null);

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

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f5", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        .fade-in { animation: fadeUp 0.28s cubic-bezier(.4,0,.2,1) both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <Navbar />

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#f0545c" }}>Account</p>
          <h1 className="text-[28px] font-black tracking-tight text-gray-900" style={{ letterSpacing: "-0.02em" }}>
            Transaction History
          </h1>
          <p className="text-[13px] text-gray-400 mt-1">Every movie and event payment, refund, and top-up in one place.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-gray-100 w-fit overflow-x-auto">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setStatus(f.id)}
                className="flex-shrink-0 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                style={status === f.id ? { background: "#f0545c", color: "#fff" } : { color: "#6b7280" }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-gray-100 w-fit overflow-x-auto">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setType(f.id)}
                className="flex-shrink-0 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                style={type === f.id ? { background: "#1c1c1c", color: "#fff" } : { color: "#6b7280" }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center py-24">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2.5 h-2.5 rounded-full bg-[#f0545c] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[14px] font-semibold text-gray-700 mb-1">{error}</p>
            <button onClick={() => fetchTransactions(1, false)} className="mt-2 text-[13px] font-semibold" style={{ color: "#f0545c" }}>
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && !transactions.length && (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(240,84,92,0.07)" }}>
              <Receipt size={28} style={{ color: "#f0545c", opacity: 0.5 }} />
            </div>
            <p className="text-[16px] font-bold text-gray-700 mb-1">No transactions found</p>
            <p className="text-[13px] text-gray-400">
              {status || type ? "Try a different filter." : "Your payments, refunds and top-ups will show up here."}
            </p>
            {!status && !type && (
              <button
                onClick={() => navigate("/")}
                className="mt-5 flex items-center gap-2 text-[13px] font-bold text-white px-6 py-2.5 rounded-xl active:scale-95 transition-transform"
                style={{ background: "#f0545c" }}
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
            {transactions.map((t) => <TransactionRow key={t._id} t={t} />)}

            {page < pages && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => fetchTransactions(page + 1, true)}
                  disabled={loadingMore}
                  className="flex items-center gap-2 text-[13px] font-semibold px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-white transition-colors disabled:opacity-60"
                >
                  {loadingMore ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={13} style={{ color: "#f0545c" }} />}
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}