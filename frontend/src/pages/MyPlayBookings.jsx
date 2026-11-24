import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Calendar, Clock, MapPin, Trophy, ArrowRight,
  X, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import { fmtDate, getCurrentUser, OUTFIT_IMPORT } from "../utils/eventHelpers";

const STATUS_STYLES = {
  confirmed: { bg: "rgba(16,185,129,0.08)", text: "#059669", label: "Confirmed" },
  cancelled: { bg: "rgba(156,163,175,0.12)", text: "#6b7280", label: "Cancelled" },
  pending:   { bg: "rgba(245,158,11,0.08)",  text: "#d97706", label: "Pending" },
  expired:   { bg: "rgba(156,163,175,0.12)", text: "#6b7280", label: "Expired" },
};

export default function MyPlayBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming"); // upcoming | past
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmBooking, setConfirmBooking] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBookings = () => {
    const user = getCurrentUser();
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    api.get(`/play-slots/bookings/user/${user.id}`)
      .then((r) => setBookings(r.data))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, []);

  const now = new Date();
  const isPast = (b) => b.status !== "confirmed" || new Date(b.date) < new Date(now.toDateString());

  const filtered = bookings.filter((b) => (tab === "upcoming" ? !isPast(b) : isPast(b)));

  const handleCancel = async () => {
    if (!confirmBooking) return;
    setCancellingId(confirmBooking._id);
    try {
      await api.post("/play-payment/cancel", { bookingId: confirmBooking._id });
      showToast("Booking cancelled — refund initiated");
      setConfirmBooking(null);
      fetchBookings();
    } catch (err) {
      showToast(err.response?.data?.message || "Couldn't cancel this booking", "error");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fafafb", fontFamily: "var(--now-ui-font)" }}>

      <Navbar />
      <BottomNav />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 16px 32px" }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-[18px] font-extrabold tracking-tight text-gray-900">My Play Bookings</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[{ id: "upcoming", label: "Upcoming" }, { id: "past", label: "Past" }].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 rounded-full text-[12.5px] font-semibold"
              style={tab === t.id
                ? { background: "#106579", color: "#fff" }
                : { background: "#fff", color: "#6b7280", border: "1px solid #e4e4e7" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-gray-300" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(16,101,121,0.07)" }}>
              <Trophy size={28} style={{ color: "#106579", opacity: 0.6 }} />
            </div>
            <p className="text-[15px] font-bold text-gray-700 mb-1">
              {tab === "upcoming" ? "No upcoming bookings" : "No past bookings"}
            </p>
            <p className="text-[13px] text-gray-400">Your slot bookings will show up here.</p>
            {tab === "upcoming" && (
              <button onClick={() => navigate("/play")} className="mt-5 flex items-center gap-2 text-[13px] font-bold text-white px-6 py-2.5 rounded-xl active:scale-95 transition-transform" style={{ background: "#106579" }}>
                Book a Slot <ArrowRight size={14} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((b) => {
              const st = STATUS_STYLES[b.status] || STATUS_STYLES.pending;
              const canCancel = b.status === "confirmed" && !isPast(b);
              return (
                <div key={b._id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-gray-900 truncate">{b.activityName}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase tracking-wide">{b.bookingRef}</p>
                    </div>
                    <span className="flex-shrink-0 text-[9.5px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ background: st.bg, color: st.text }}>
                      {st.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
                      <Calendar size={11} className="text-gray-400" /> {fmtDate(b.date)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500 truncate max-w-[200px]">
                      <MapPin size={11} className="text-gray-400" /> {b.venueName} · {b.courtName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-lg border border-gray-100 flex items-center gap-1">
                      <Clock size={10} /> {b.slots?.length || 0} slot{b.slots?.length !== 1 ? "s" : ""}
                    </span>
                    <p className="text-[14px] font-black text-gray-900">₹{(b.pricing?.total || 0).toLocaleString("en-IN")}</p>
                  </div>

                  {canCancel && (
                    <button
                      onClick={() => setConfirmBooking(b)}
                      className="w-full mt-3 py-2 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5"
                      style={{ background: "#fff1f2", color: "#dc2626" }}
                    >
                      <X size={12} /> Cancel Booking
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel confirm modal */}
      {confirmBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-[340px]">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: "#fff1f2" }}>
              <X size={18} style={{ color: "#106579" }} />
            </div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-1">Cancel Booking</h3>
            <p className="text-[13px] text-gray-500 mb-5">
              Cancel your {confirmBooking.activityName} booking on {fmtDate(confirmBooking.date)}? This refunds ₹{confirmBooking.pricing?.total} to your original payment method.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmBooking(null)} disabled={!!cancellingId} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                Keep Booking
              </button>
              <button onClick={handleCancel} disabled={!!cancellingId} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2" style={{ background: "#106579" }}>
                {cancellingId && <Loader2 size={13} className="animate-spin" />} Cancel & Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-[13px] font-medium"
          style={{ background: toast.type === "success" ? "#f0fdf4" : "#fff1f2", color: toast.type === "success" ? "#16a34a" : "#dc2626", border: `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecdd3"}` }}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}