import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import { getSocketUserId, getCurrentUser, OUTFIT_IMPORT } from "../utils/eventHelpers";
import {
  ArrowLeft, X, CheckCircle2, AlertCircle, IndianRupee, Loader2, Clock, Check,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL;
const LOCK_MINUTES = 5;
const DAYS_AHEAD = 14; // matches the backend's rolling slot-generation window

const fmtDateLabel = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};

const dateKey = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

function buildDateStrip() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

// Minutes-of-day helper so we can print a human duration like "1 hr" / "1.5 hr".
const durationLabel = (start, end) => {
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const mins = toMin(end) - toMin(start);
  if (mins <= 0) return "";
  const hrs = mins / 60;
  return `${hrs % 1 === 0 ? hrs : hrs.toFixed(1)} hr`;
};

export default function PlaySlotSelection() {
  const { id: venueId } = useParams();
  const [params, setParams] = useSearchParams();
  const date = params.get("date");
  const navigate = useNavigate();
  const userId = getSocketUserId();

  const [venueName, setVenueName] = useState("");
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [locking, setLocking] = useState(false);

  // Two-step selection matching the district.in flow: pick a time range,
  // then pick one specific pitch/court available in that range. The Play
  // backend requires every slot in a booking to belong to the same court,
  // so exactly one pitch (one slot) can be held at a time.
  const [selectedRangeKey, setSelectedRangeKey] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null); // { slotId, courtId, courtName, startTime, endTime, price, indoor, surfaceType, activityName }

  const socketRef = useRef(null);

  const dateStrip = useMemo(buildDateStrip, []);

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
      })
      .catch(() => setError("Couldn't load slot availability."))
      .finally(() => setLoading(false));
  }, [venueId, date]);

  useEffect(() => { loadAvailability(); }, [loadAvailability]);

  // Changing the date clears any in-progress selection.
  const changeDate = (d) => {
    setSelectedRangeKey(null);
    setSelectedSlot(null);
    const next = new URLSearchParams(params);
    next.set("date", dateKey(d));
    setParams(next, { replace: true });
  };

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
      setSelectedSlot((prev) => {
        if (prev && slotIds.includes(prev.slotId)) {
          showToast("That pitch was just booked by someone else", "error");
          return null;
        }
        return prev;
      });
    });

    return () => {
      socket.emit("leave:play", { venueId, date });
      socket.disconnect();
    };
  }, [venueId, date]);

  // Group every court's slots by their (startTime, endTime) range so we can
  // show "Time slots available" cards, then a "N pitch available" list —
  // mirroring the district.in booking flow.
  const timeRanges = useMemo(() => {
    const map = new Map();
    courts.forEach((c) => {
      (c.slots || []).forEach((s) => {
        const key = `${s.startTime}-${s.endTime}`;
        if (!map.has(key)) map.set(key, { key, startTime: s.startTime, endTime: s.endTime, pitches: [] });
        map.get(key).pitches.push({
          slotId: s._id, status: s.status, price: s.price,
          startTime: s.startTime, endTime: s.endTime,
          courtId: c._id, courtName: c.name, indoor: c.indoor, surfaceType: c.surfaceType,
          activityName: c.activity?.name,
        });
      });
    });
    return [...map.values()].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [courts]);

  const activeRange = timeRanges.find((r) => r.key === selectedRangeKey) || null;
  const anyDuration = timeRanges[0] ? durationLabel(timeRanges[0].startTime, timeRanges[0].endTime) : "";

  const pickRange = (range) => {
    setSelectedRangeKey(range.key === selectedRangeKey ? null : range.key);
  };

  const togglePitch = (p) => {
    if (p.status === "booked" || p.status === "locked") return;
    setSelectedSlot((prev) => (prev?.slotId === p.slotId ? null : p));
  };

  const handleProceed = async () => {
    const user = getCurrentUser();
    if (!user?.id) { showToast("Please log in to book a slot", "error"); navigate("/login"); return; }
    if (!selectedSlot) return;

    setLocking(true);
    try {
      await api.post("/play-slots/lock", { slotIds: [selectedSlot.slotId] });
      navigate("/booking/review", {
        state: {
          draft: {
            type: "play",
            venueId, venueName, date, userId,
            courtId: selectedSlot.courtId, courtName: selectedSlot.courtName,
            activityName: selectedSlot.activityName,
            slotIds: [selectedSlot.slotId],
            startTime: selectedSlot.startTime, endTime: selectedSlot.endTime,
            price: selectedSlot.price, indoor: selectedSlot.indoor, surfaceType: selectedSlot.surfaceType,
            lockExpiresAt: Date.now() + LOCK_MINUTES * 60 * 1000,
          },
        },
      });
    } catch (err) {
      const conflict = err.response?.data?.unavailableSlots || err.response?.data?.expiredSlots || [];
      showToast(conflict.length ? "That pitch just got taken. Please reselect." : (err.response?.data?.message || "Failed to proceed"), "error");
      setSelectedSlot(null);
      loadAvailability();
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

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 16px 140px" }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0">
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="text-[16px] font-extrabold tracking-tight text-gray-900 truncate">{venueName}</h1>
            <p className="text-[12px] text-gray-400">{fmtDateLabel(date)}</p>
          </div>
        </div>

        {/* Date strip */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: "none" }}>
          {dateStrip.map((d) => {
            const active = dateKey(d) === date;
            return (
              <button
                key={dateKey(d)}
                onClick={() => changeDate(d)}
                className="flex flex-col items-center justify-center flex-shrink-0 rounded-xl"
                style={{ width: 52, height: 62, background: active ? "#f0545c" : "#fff", border: active ? "none" : "1px solid #e5e7eb" }}
              >
                <span className="text-[10px] font-semibold" style={{ color: active ? "rgba(255,255,255,0.7)" : "#9ca3af" }}>
                  {d.toLocaleDateString("en-IN", { weekday: "short" })}
                </span>
                <span className="text-[16px] font-extrabold mt-0.5" style={{ color: active ? "#fff" : "#111827" }}>{d.getDate()}</span>
              </button>
            );
          })}
        </div>

        {timeRanges.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white flex flex-col items-center text-center px-6 py-14">
            <Clock size={26} style={{ color: "#d1d5db" }} className="mb-3" />
            <p className="text-[14px] font-semibold text-gray-500">No slots for this date</p>
          </div>
        ) : (
          <>
            {/* Duration (informational — slot length is fixed by the venue) */}
            {anyDuration && (
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[13.5px] font-bold text-gray-900">Duration</p>
                  <p className="text-[11.5px] text-gray-400">Duration of the slots</p>
                </div>
                <span className="px-3.5 py-1.5 rounded-full text-[12.5px] font-bold text-white" style={{ background: "#f0545c" }}>{anyDuration}</span>
              </div>
            )}

            {/* Time slots available */}
            <h2 className="text-[14px] font-extrabold text-gray-900 mb-2.5">Time slots available</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 mb-6">
              {timeRanges.map((r) => {
                const availableCount = r.pitches.filter((p) => p.status === "available" || p.slotId === selectedSlot?.slotId).length;
                const active = r.key === selectedRangeKey;
                const allTaken = availableCount === 0;
                return (
                  <button
                    key={r.key}
                    onClick={() => pickRange(r)}
                    disabled={allTaken}
                    className="flex flex-col items-start rounded-xl px-3.5 py-3 text-left disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "#fff", border: active ? "2px solid #f0545c" : "1px solid #e5e7eb" }}
                  >
                    <span className="text-[13.5px] font-bold text-gray-900">{r.startTime} - {r.endTime}</span>
                    <span className="text-[11px] font-semibold mt-0.5" style={{ color: "#f0545c" }}>
                      {allTaken ? "Fully booked" : `${availableCount} pitch${availableCount !== 1 ? "es" : ""}`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* N pitch available — pitches within the selected time range */}
            {activeRange && (
              <>
                <h2 className="text-[14px] font-extrabold text-gray-900 mb-2.5">
                  {activeRange.pitches.length} pitch{activeRange.pitches.length !== 1 ? "es" : ""} available
                </h2>
                <div className="flex flex-col gap-2.5">
                  {activeRange.pitches.map((p) => {
                    const disabled = p.status === "booked" || p.status === "locked";
                    const isSelected = selectedSlot?.slotId === p.slotId;
                    return (
                      <button
                        key={p.slotId}
                        onClick={() => togglePitch(p)}
                        disabled={disabled && !isSelected}
                        className="flex items-center gap-3.5 bg-white rounded-2xl border px-4 py-3.5 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ borderColor: isSelected ? "#f0545c" : "#e5e7eb" }}
                      >
                        <div className="w-14 h-14 rounded-xl flex-shrink-0" style={{ background: "linear-gradient(135deg,#1c1c1c,#2d2d2d)" }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-bold text-gray-900 truncate">{p.courtName}{p.activityName ? ` (${p.activityName})` : ""}</p>
                          <p className="text-[11.5px] text-gray-400 mt-0.5 truncate">
                            {p.indoor ? "Indoor" : "Outdoor"}{p.surfaceType ? ` · ${p.surfaceType}` : ""}
                          </p>
                          <p className="text-[12.5px] font-bold text-gray-700 mt-1 flex items-center"><IndianRupee size={11} />{p.price}</p>
                        </div>
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: isSelected ? "#f0545c" : "#fff", border: isSelected ? "none" : "1.5px solid #d1d5db" }}
                        >
                          {isSelected && <Check size={13} color="#fff" strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Sticky bottom bar */}
      {selectedSlot && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-gray-900">1 pitch reserved</p>
              <p className="text-[11.5px] text-gray-400">{selectedSlot.startTime} - {selectedSlot.endTime}</p>
            </div>
            <button
              onClick={handleProceed}
              disabled={locking}
              className="px-6 py-3 rounded-xl text-[13.5px] font-bold text-white flex items-center gap-2 disabled:opacity-60"
              style={{ background: "#f0545c" }}
            >
              {locking ? <Loader2 size={14} className="animate-spin" /> : null} Proceed
            </button>
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