import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import { getSocketUserId, getCurrentUser, OUTFIT_IMPORT } from "../utils/eventHelpers";
import {
  ArrowLeft, CheckCircle2, AlertCircle, IndianRupee, Loader2, Clock,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL;

const fmtDateLabel = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};

/**
 * Slot picking only. "Continue" locks the selected slots and hands off to
 * the shared BookingReview page (same summary/payment UI used by movies and
 * events) via a normalized draft — this page no longer owns its own
 * summary sheet or payment flow.
 */
export default function PlaySlotSelection() {
  const { id: venueId } = useParams();
  const [params] = useSearchParams();
  const date = params.get("date");
  const navigate = useNavigate();
  const userId = getSocketUserId();

  const [venueName, setVenueName] = useState("");
  const [courts, setCourts] = useState([]);
  const [activeCourtId, setActiveCourtId] = useState(null);
  const [selected, setSelected] = useState([]); // slot IDs, all within activeCourtId
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [locking, setLocking] = useState(false);

  const socketRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (!venueId || !date) navigate(-1);
  }, []);

  /* ── Load availability ── */
  const loadAvailability = useCallback(() => {
    if (!venueId || !date) return;
    setLoading(true);
    api.get(`/play-slots/availability/${venueId}/${date}`)
      .then((res) => {
        setVenueName(res.data.venue);
        setCourts(res.data.courts);
        setActiveCourtId((prev) => prev || res.data.courts?.[0]?._id || null);
      })
      .catch(() => setError("Couldn't load slot availability."))
      .finally(() => setLoading(false));
  }, [venueId, date]);

  useEffect(() => { loadAvailability(); }, [loadAvailability]);

  /* ── Socket: live lock/release/book updates for this venue+date ── */
  useEffect(() => {
    if (!venueId || !date) return;
    const socket = io(BASE, { query: { userId }, transports: ["websocket"] });
    socketRef.current = socket;
    socket.emit("join:play", { venueId, date });

    socket.on("play-slot:locked", ({ courtId, slotId }) => {
      setCourts((prev) => prev.map((c) => c._id !== courtId ? c : {
        ...c, slots: c.slots.map((s) => s._id === slotId && s.status === "available" ? { ...s, status: "locked" } : s),
      }));
    });

    socket.on("play-slot:released", ({ courtId, slotId }) => {
      setCourts((prev) => prev.map((c) => c._id !== courtId ? c : {
        ...c, slots: c.slots.map((s) => s._id === slotId && s.status !== "booked" ? { ...s, status: "available" } : s),
      }));
    });

    socket.on("play-slots:booked", ({ courtId, slotIds }) => {
      setCourts((prev) => prev.map((c) => c._id !== courtId ? c : {
        ...c, slots: c.slots.map((s) => slotIds.includes(s._id) ? { ...s, status: "booked" } : s),
      }));
      setSelected((prev) => {
        const taken = prev.filter((id) => slotIds.includes(id));
        if (taken.length) showToast("Some selected slots were just booked by someone else", "error");
        return prev.filter((id) => !slotIds.includes(id));
      });
    });

    return () => {
      socket.emit("leave:play", { venueId, date });
      socket.disconnect();
    };
  }, [venueId, date]);

  const activeCourt = courts.find((c) => c._id === activeCourtId);

  const toggleSlot = (slot) => {
    if (slot.status === "booked" || slot.status === "locked") return;
    setSelected((prev) => {
      if (prev.includes(slot._id)) return prev.filter((id) => id !== slot._id);
      if (prev.length >= 8) { showToast("You can select up to 8 slots at once", "error"); return prev; }
      return [...prev, slot._id];
    });
  };

  // Switching courts clears the selection — a booking is single-court.
  const switchCourt = (courtId) => {
    if (courtId === activeCourtId) return;
    setActiveCourtId(courtId);
    setSelected([]);
  };

  const selectedSlots = (activeCourt?.slots || [])
    .filter((s) => selected.includes(s._id))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const subtotal = selectedSlots.reduce((sum, s) => sum + s.price, 0);

  const handleProceed = async () => {
    const user = getCurrentUser();
    if (!user?.id) { showToast("Please log in to book a slot", "error"); navigate("/login"); return; }
    if (!selected.length) return;

    setLocking(true);
    try {
      const { data: lockData } = await api.post("/play-slots/lock", { slotIds: selected });

      // Normalized draft — same shape BookingReview already expects for
      // movies/events, with a "play" type so it knows which order/payment
      // endpoints and which summary fields to use.
      const draft = {
        type: "play",
        itemId: activeCourtId,
        itemTitle: activeCourt?.activity?.name || venueName,
        itemPoster: null,
        venueName,
        venueSub: activeCourt?.name,
        date,
        timeLabel: selectedSlots.length
          ? `${selectedSlots[0].startTime} – ${selectedSlots[selectedSlots.length - 1].endTime}`
          : "",
        slots: selectedSlots.map((s) => ({ id: s._id, startTime: s.startTime, endTime: s.endTime, price: s.price })),
        slotIds: selected,
        venueId,
        courtId: activeCourtId,
        lockExpiresAt: new Date(lockData.expiresAt).getTime(),
      };
      navigate("/booking/review", { state: { draft } });
    } catch (err) {
      const conflict = err.response?.data?.unavailableSlots || err.response?.data?.expiredSlots || [];
      if (conflict.length) {
        showToast("Some slots just got taken. Please reselect.", "error");
        setSelected((prev) => prev.filter((id) => !conflict.includes(id)));
        loadAvailability();
      } else {
        showToast(err.response?.data?.message || "Failed to proceed", "error");
      }
    } finally {
      setLocking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => <span key={i} className="w-2.5 h-2.5 rounded-full bg-[#f0545c] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f7", fontFamily: "'Outfit', sans-serif" }}>
        <Navbar /><BottomNav />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <p className="text-[14px] font-semibold text-gray-500 mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white" style={{ background: "#f0545c" }}>Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7", fontFamily: "'Outfit', sans-serif" }}>
      <style>{OUTFIT_IMPORT}</style>
      <Navbar />
      <BottomNav />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 140px" }}>
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0">
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="text-[16px] font-extrabold tracking-tight text-gray-900 truncate">{venueName}</h1>
            <p className="text-[12px] text-gray-400">{fmtDateLabel(date)}</p>
          </div>
        </div>

        {/* Court tabs */}
        {courts.length > 1 && (
          <div className="flex gap-2 overflow-x-auto mt-4 pb-1" style={{ scrollbarWidth: "none" }}>
            {courts.map((c) => (
              <button
                key={c._id}
                onClick={() => switchCourt(c._id)}
                className="px-4 py-2 rounded-full text-[12.5px] font-semibold flex-shrink-0 whitespace-nowrap"
                style={c._id === activeCourtId
                  ? { background: "#f0545c", color: "#fff" }
                  : { background: "#fff", color: "#6b7280", border: "1px solid #e5e7eb" }}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 mb-3">
          {[
            { label: "Available", color: "#fff", border: "#e5e7eb", text: "#374151" },
            { label: "Selected", color: "#f0545c", border: "#f0545c", text: "#fff" },
            { label: "Held / Booked", color: "#f3f4f6", border: "#f3f4f6", text: "#9ca3af" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md" style={{ background: l.color, border: `1.5px solid ${l.border}` }} />
              <span className="text-[10.5px] font-medium text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>

        {/* Slot grid */}
        {!activeCourt?.slots?.length ? (
          <div className="rounded-2xl border border-gray-100 bg-white flex flex-col items-center text-center px-6 py-14">
            <Clock size={26} style={{ color: "#d1d5db" }} className="mb-3" />
            <p className="text-[14px] font-semibold text-gray-500">No slots for this date</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {activeCourt.slots.map((s) => {
              const isSelected = selected.includes(s._id);
              const disabled = s.status === "booked" || s.status === "locked";
              return (
                <button
                  key={s._id}
                  onClick={() => toggleSlot(s)}
                  disabled={disabled}
                  className="flex flex-col items-center justify-center rounded-xl py-2.5 px-1 transition-colors"
                  style={{
                    background: isSelected ? "#f0545c" : disabled ? "#f3f4f6" : "#fff",
                    border: isSelected ? "1.5px solid #f0545c" : "1.5px solid #e5e7eb",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.6 : 1,
                  }}
                >
                  <span className="text-[12px] font-bold" style={{ color: isSelected ? "#fff" : disabled ? "#9ca3af" : "#111827" }}>
                    {s.startTime}
                  </span>
                  <span className="text-[10px] font-semibold mt-0.5 flex items-center gap-0.5" style={{ color: isSelected ? "rgba(255,255,255,0.85)" : disabled ? "#c1c5cb" : "#6b7280" }}>
                    <IndianRupee size={9} />{s.price}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      {selected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="max-w-lg mx-auto px-4 pb-4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-[13px] font-bold text-gray-900">{selected.length} slot{selected.length !== 1 ? "s" : ""} selected</p>
                <p className="text-[11px] text-gray-400 flex items-center gap-1"><IndianRupee size={10} />{subtotal} + fees</p>
              </div>
              <button
                onClick={handleProceed}
                disabled={locking}
                className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white flex items-center gap-2 disabled:opacity-60"
                style={{ background: "#f0545c" }}
              >
                {locking ? <Loader2 size={14} className="animate-spin" /> : null} Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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