// src/pages/EventSeatSelection.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import { useEventRazorpay } from "../hooks/useEventRazorpay";
import {
  ChevronLeft, MapPin, X, Loader2, Timer,
  Wallet, CreditCard, CheckCircle2, IndianRupee,
  Music2, Mic2, Drama, GraduationCap, Minus, Plus, Ticket,
  CalendarDays, Users, Monitor, Info,
} from "lucide-react";
import { IMG, fmt12, fmtDate, fmtCountdown, getSocketUserId, getCurrentUser, SEAT_CAT } from "../utils/eventHelpers";

const BASE = import.meta.env.VITE_API_URL;
const LOCK_SECONDS = 5 * 60;
const MAX_SEATS = 10;
const MAX_GA_QTY = 10;

// Same icon language as ExploreEvents.jsx category grid
const CATEGORY_ICON = {
  Music: Music2, "Comedy Shows": Mic2, Performances: Drama, Workshops: GraduationCap,
};
const CATEGORY_LABEL = {
  Music: "Music Event", "Comedy Shows": "Standup Show", Performances: "Live Performance", Workshops: "Workshop",
};

// Aisle-break logic — same convention as the movie SeatSelection page:
// splits long rows into groups of ~3 with a visual gap so seat maps read like a real layout
const getAisleBreaks = (count) => (count <= 6 ? [] : count <= 10 ? [3] : [3, count - 3]);

export default function EventSeatSelection() {
  const { scheduleId, slotId } = useParams();
  const { state } = useLocation();
  const navigate  = useNavigate();

  const event = state?.event;
  const userId = getSocketUserId();
  const bookingType = event?.bookingType === "general" ? "general" : "seated";
  const CategoryIcon = CATEGORY_ICON[event?.category] || Ticket;
  const categoryLabel = CATEGORY_LABEL[event?.category] || event?.category || "Event";

  const [layoutData, setLayoutData] = useState(null);
  const [seats, setSeats]           = useState({});
  const [selected, setSelected]     = useState([]);
  const [ticketQty, setTicketQty]   = useState({}); // GA: { ticketTypeId: quantity }
  const [loading, setLoading]       = useState(true);
  const [noLayout, setNoLayout]     = useState(false);
  const [locking, setLocking]       = useState(false);
  const [countdown, setCountdown]   = useState(null);
  const [toast, setToast]           = useState(null);

  const [showSummary, setShowSummary] = useState(false);
  const [orderData, setOrderData]     = useState(null);
  const [payMethod, setPayMethod]     = useState("razorpay");
  const [paying, setPaying]           = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [wallet, setWallet]           = useState(null);

  const { initiatePayment } = useEventRazorpay();
  const socketRef = useRef(null);
  const timerRef  = useRef(null);

  useEffect(() => {
    if (!scheduleId || !slotId || !event) navigate("/");
  }, []);

  /* ── Load layout (seated) or ticket tiers (general admission) ── */
  useEffect(() => {
    if (!scheduleId || !slotId) return;
    setLoading(true);
    api.get(`/event-seats/layout/${scheduleId}/${slotId}`)
      .then((res) => {
        setLayoutData(res.data);
        if (res.data.layout?.length) setSeats(res.data.seats || {});
        if (res.data.ticketTypes?.length) {
          setTicketQty(Object.fromEntries(res.data.ticketTypes.map((t) => [t._id, 0])));
        }
        if (!res.data.layout?.length && !res.data.ticketTypes?.length) setNoLayout(true);
      })
      .catch((err) => {
        if (err.response?.status === 400) setNoLayout(true);
        else showToast("Failed to load event availability", "error");
      })
      .finally(() => setLoading(false));
  }, [scheduleId, slotId]);

  /* ── Socket updates only matter for seated (per-seat) locking ── */
  useEffect(() => {
    if (!scheduleId || !slotId || bookingType !== "seated") return;
    const socket = io(BASE, { query: { userId }, transports: ["websocket"] });
    socketRef.current = socket;
    socket.emit("join:event", { scheduleId, slotId });

    socket.on("event-seat:locked", ({ seatId }) =>
      setSeats((p) => (!p[seatId] || p[seatId].status === "booked") ? p : { ...p, [seatId]: { ...p[seatId], status: "locked" } }));
    socket.on("event-seat:released", ({ seatId }) =>
      setSeats((p) => (!p[seatId] || p[seatId].status === "booked") ? p : { ...p, [seatId]: { ...p[seatId], status: "available" } }));
    socket.on("event-seats:released_bulk", ({ seatIds }) =>
      setSeats((p) => {
        const n = { ...p };
        seatIds.forEach((sid) => { if (n[sid] && n[sid].status !== "booked") n[sid] = { ...n[sid], status: "available" }; });
        return n;
      }));
    socket.on("event-seats:booked", ({ seatIds }) => {
      setSeats((p) => {
        const n = { ...p };
        seatIds.forEach((sid) => { if (n[sid]) n[sid] = { ...n[sid], status: "booked" }; });
        return n;
      });
      setSelected((prev) => {
        const taken = prev.filter((s) => seatIds.includes(s));
        if (taken.length) showToast(`${taken.length} seat(s) just got booked`, "error");
        return prev.filter((s) => !seatIds.includes(s));
      });
    });

    return () => {
      socket.emit("leave:event", { scheduleId, slotId });
      socket.disconnect();
    };
  }, [scheduleId, slotId, bookingType]);

  useEffect(() => {
    if (!showSummary) return;
    const user = getCurrentUser();
    if (!user?.id) return;
    api.get("/quickpay").then((r) => setWallet(r.data)).catch(() => setWallet(null));
  }, [showSummary]);

  const startCountdown = useCallback(() => {
    clearInterval(timerRef.current);
    setCountdown(LOCK_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); handleExpired(); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);
  const stopCountdown = () => { clearInterval(timerRef.current); setCountdown(null); };
  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleExpired = async () => {
    showToast("Reservation expired. Please reselect.", "error");
    if (bookingType === "seated" && selected.length > 0) {
      await api.delete("/event-seats/lock", { data: { scheduleId, slotId, seatIds: selected, userId } }).catch(() => {});
      selected.forEach((sid) => socketRef.current?.emit("event-seat:deselect", { scheduleId, slotId, seatId: sid }));
      setSeats((p) => {
        const n = { ...p };
        Object.keys(n).forEach((sid) => { if (n[sid].status === "selected") n[sid] = { ...n[sid], status: "available" }; });
        return n;
      });
    }
    setSelected([]);
    setTicketQty((p) => Object.fromEntries(Object.keys(p).map((k) => [k, 0])));
    setOrderData(null);
    setShowSummary(false);
    stopCountdown();
  };

  const toggleSeat = (seatId) => {
    const seat = seats[seatId];
    if (!seat || seat.status === "booked" || seat.status === "locked") return;
    if (selected.includes(seatId)) {
      setSelected((p) => p.filter((s) => s !== seatId));
      setSeats((p) => ({ ...p, [seatId]: { ...p[seatId], status: "available" } }));
      socketRef.current?.emit("event-seat:deselect", { scheduleId, slotId, seatId });
      if (selected.length === 1) stopCountdown();
    } else {
      if (selected.length >= MAX_SEATS) { showToast(`Max ${MAX_SEATS} seats per booking`, "error"); return; }
      setSelected((p) => [...p, seatId]);
      setSeats((p) => ({ ...p, [seatId]: { ...p[seatId], status: "selected" } }));
      socketRef.current?.emit("event-seat:select", { scheduleId, slotId, seatId });
      if (selected.length === 0) startCountdown();
    }
  };

  /* ── GA quantity stepper ── */
  const totalGaQty = Object.values(ticketQty).reduce((s, n) => s + n, 0);
  const adjustQty = (ticketTypeId, delta, available) => {
    setTicketQty((p) => {
      const next = Math.max(0, Math.min(available ?? MAX_GA_QTY, MAX_GA_QTY, (p[ticketTypeId] || 0) + delta));
      if (delta > 0 && totalGaQty >= MAX_GA_QTY && next > (p[ticketTypeId] || 0)) {
        showToast(`Max ${MAX_GA_QTY} tickets per booking`, "error");
        return p;
      }
      const updated = { ...p, [ticketTypeId]: next };
      if (Object.values(updated).some((q) => q > 0)) {
        if (countdown == null) startCountdown();
      } else {
        stopCountdown();
      }
      return updated;
    });
  };

  const handleProceed = async () => {
    const user = getCurrentUser();
    if (!user?.id) { showToast("Please log in to book tickets", "error"); navigate("/login"); return; }

    if (bookingType === "seated") {
      if (!selected.length) return;
      setLocking(true);
      try {
        await api.post("/event-seats/lock", { scheduleId, slotId, seatIds: selected, userId });
        startCountdown();
        setLoadingOrder(true);
        const { data } = await api.post("/event-payment/create-order", { scheduleId, slotId, seatIds: selected });
        setOrderData(data);
        setPayMethod(data.wallet?.eligible ? "wallet" : "razorpay");
        setShowSummary(true);
      } catch (err) {
        const conflict = err.response?.data?.unavailableSeats || err.response?.data?.expiredSeats || [];
        if (conflict.length) {
          showToast(`Seats ${conflict.join(", ")} just got taken. Please reselect.`, "error");
          setSelected((p) => p.filter((s) => !conflict.includes(s)));
          setSeats((p) => { const n = { ...p }; conflict.forEach((sid) => { n[sid] = { ...n[sid], status: "locked" }; }); return n; });
        } else {
          showToast(err.response?.data?.message || "Failed to proceed", "error");
        }
      } finally {
        setLocking(false);
        setLoadingOrder(false);
      }
      return;
    }

    // General admission — send ticket-tier quantities instead of seat IDs
    const ticketSelections = Object.entries(ticketQty)
      .filter(([, qty]) => qty > 0)
      .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));
    if (!ticketSelections.length) return;

    setLocking(true);
    try {
      setLoadingOrder(true);
      const { data } = await api.post("/event-payment/create-order", { scheduleId, slotId, ticketSelections });
      setOrderData(data);
      setPayMethod(data.wallet?.eligible ? "wallet" : "razorpay");
      setShowSummary(true);
    } catch (err) {
      showToast(err.response?.data?.message || "Some tickets are no longer available. Please adjust.", "error");
    } finally {
      setLocking(false);
      setLoadingOrder(false);
    }
  };

  const onBookingConfirmed = (booking) => {
    if (bookingType === "seated") {
      socketRef.current?.emit("event-booking:confirmed", { scheduleId, slotId, seatIds: selected });
    }
    stopCountdown();
    navigate("/booking/event-success", { state: { booking, event, venue: layoutData } });
  };

  const handleConfirm = async () => {
    const user = getCurrentUser();
    if (!user?.id) { showToast("Please log in to continue", "error"); navigate("/login"); return; }

    if (payMethod === "wallet") {
      setPaying(true);
      try {
        const payload = bookingType === "seated"
          ? { scheduleId, slotId, seatIds: selected }
          : { scheduleId, slotId, ticketSelections: Object.entries(ticketQty).filter(([, q]) => q > 0).map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity })) };
        const { data } = await api.post("/event-payment/wallet-pay", payload);
        onBookingConfirmed(data.booking);
      } catch (err) {
        showToast(err.response?.data?.message || "Wallet payment failed. Try another method.", "error");
        setPayMethod("razorpay");
      } finally { setPaying(false); }
    } else {
      if (!orderData) return;
      setShowSummary(false);
      initiatePayment({
        existingOrder: orderData,
        userDetails: { name: user.username || "", email: user.email || "", contact: user.phone || "" },
        onSuccess: (_ref, booking) => onBookingConfirmed(booking),
        onFailure: (reason) => { setShowSummary(true); showToast(reason || "Payment failed. Please try again.", "error"); },
      });
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => <span key={i} className="w-2.5 h-2.5 rounded-full bg-[#f0545c] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
      </div>
    </div>
  );

  if (noLayout) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(240,84,92,0.08)" }}>
        <Ticket size={22} color="#f0545c" />
      </div>
      <p className="text-[16px] font-bold text-gray-800">
        {bookingType === "general" ? "Ticket availability not configured" : "Seat layout not configured"}
      </p>
      <p className="text-[13px] text-gray-400 mt-1.5 max-w-xs">Please check back later or contact the organizer for updates on this show.</p>
      <button onClick={() => navigate(-1)} className="mt-5 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white" style={{ background: "#f0545c" }}>
        Go Back
      </button>
    </div>
  );

  const layout = layoutData?.layout || [];
  const ticketTypes = layoutData?.ticketTypes || [];

  const total = bookingType === "seated"
    ? selected.reduce((s, id) => s + (seats[id]?.priceAdd != null ? layoutData.basePrice + seats[id].priceAdd : 0), 0)
    : ticketTypes.reduce((s, t) => s + (ticketQty[t._id] || 0) * t.price, 0);
  const fee   = Math.round(total * 0.02);
  const grand = total + fee;

  const proceedDisabled = bookingType === "seated" ? selected.length === 0 : totalGaQty === 0;
  const proceedCount = bookingType === "seated" ? selected.length : totalGaQty;

  // Group seated rows by category, in the same order as the movie SeatSelection layoutByCategory pattern
  const layoutByCategory = layout.reduce((acc, row) => {
    (acc[row.category] = acc[row.category] || []).push(row);
    return acc;
  }, {});
  const categoryOrder = Object.keys(layoutByCategory);

  // Price per category — derive from the first seat found in that category's first row
  const categoryPrice = (cat) => {
    const row = layoutByCategory[cat]?.[0];
    if (!row) return layoutData?.basePrice || 0;
    const sampleSeatId = `${row.row}1`;
    const priceAdd = seats[sampleSeatId]?.priceAdd || 0;
    return (layoutData?.basePrice || 0) + priceAdd;
  };

  const urgentCountdown = countdown !== null && countdown < 60;

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f6", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        .es-seat-btn { transition: all 0.13s ease; }
        .es-seat-btn:hover:not(:disabled) { transform: translateY(-2px) scale(1.08); }
        .es-seat-btn.es-selected { transform: translateY(-2px) scale(1.06); }
        .es-seat-btn:active:not(:disabled) { transform: scale(0.94); }
        @keyframes es-pulse-urgent { 0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.35); } 50% { box-shadow: 0 0 0 6px rgba(220,38,38,0); } }
        .es-countdown-urgent { animation: es-pulse-urgent 1s ease-in-out infinite; }
      `}</style>
      <Navbar />

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-[60px] z-40">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0 transition-colors">
            <ChevronLeft size={17} />
          </button>

          {event?.poster && (
            <img src={IMG(event.poster)} alt="" className="w-9 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <CategoryIcon size={11} color="#f0545c" className="flex-shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#f0545c" }}>{categoryLabel}</span>
            </div>
            <h1 className="text-[15px] font-bold text-gray-900 truncate leading-tight mt-0.5">{event?.title}</h1>
            <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1"><MapPin size={10} /> {layoutData?.venue}</span>
              <span className="flex items-center gap-1"><CalendarDays size={10} /> {fmtDate(layoutData?.eventDate)}, {fmt12(layoutData?.eventTime)}</span>
            </p>
          </div>

          {countdown != null && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl flex-shrink-0 ${urgentCountdown ? "es-countdown-urgent" : ""}`} style={{ background: urgentCountdown ? "#fff1f2" : "rgba(240,84,92,0.08)" }}>
              <Timer size={13} color={urgentCountdown ? "#dc2626" : "#f0545c"} />
              <span className="text-[13px] font-bold tabular-nums" style={{ color: urgentCountdown ? "#dc2626" : "#f0545c", fontFamily: "'DM Mono', monospace" }}>{fmtCountdown(countdown)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6" style={{ paddingBottom: 110 }}>

        {bookingType === "seated" ? (
          <>
            {/* Stage indicator */}
            <div className="flex flex-col items-center mb-10 mt-2">
              <div style={{
                width: "55%", maxWidth: 420, height: 4, borderRadius: "0 0 60% 60%",
                background: "linear-gradient(to right, transparent, rgba(240,84,92,0.5), transparent)",
                boxShadow: "0 6px 20px rgba(240,84,92,0.1)",
              }} />
              <p className="text-[10px] font-bold tracking-[0.25em] uppercase mt-3 text-gray-400 flex items-center gap-1.5">
                <Monitor size={10} className="text-gray-300" /> STAGE THIS SIDE
              </p>
            </div>

            {/* Seat grid — grouped by category, matching movie SeatSelection layout */}
            <div className="space-y-10">
              {categoryOrder.map((cat, catIdx) => {
                const rows = layoutByCategory[cat];
                const c = SEAT_CAT[cat] || SEAT_CAT.General;
                const price = categoryPrice(cat);
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="h-px flex-1 bg-gray-100" />
                      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full" style={{ background: c.light, border: `1px solid ${c.border}` }}>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                        <span className="text-[12px] font-bold" style={{ color: c.color }}>{cat}</span>
                        <span className="text-[11px] font-semibold" style={{ color: c.pillText, opacity: 0.7 }}>₹{price}</span>
                      </div>
                      <div className="h-px flex-1 bg-gray-100" />
                    </div>

                    <div className="space-y-3.5 overflow-x-auto pb-2">
                      {rows.map(({ row, seats: count }) => {
                        const aisleBreaks = getAisleBreaks(count);
                        return (
                          <div key={row} className="flex flex-col items-center gap-1 min-w-max">
                            <span
                              className="text-[9px] font-bold uppercase tracking-widest text-gray-300"
                              style={{ fontFamily: "'DM Mono', monospace" }}
                            >
                              Row {row}
                            </span>
                            <div className="flex items-center gap-2">
                            <div className="flex gap-1.5 items-center">
                              {Array.from({ length: count }, (_, i) => i + 1).map((col) => {
                                const seatId = `${row}${col}`;
                                const seat = seats[seatId] || {};
                                const status = seat.status || "available";
                                const isSel = status === "selected";
                                const isDisabled = status === "booked" || status === "locked";
                                return (
                                  <div key={seatId} className="flex items-center">
                                    {aisleBreaks.includes(col - 1) && col > 1 && (
                                      <div className="flex flex-col items-center justify-center mx-2 select-none" style={{ width: 10 }}>
                                        <div className="w-0.5 h-4 rounded-full" style={{ background: "#e5e7eb" }} />
                                      </div>
                                    )}
                                    <button
                                      onClick={() => toggleSeat(seatId)}
                                      disabled={isDisabled}
                                      title={isDisabled ? "Unavailable" : `${seatId} · ₹${price}`}
                                      className={`es-seat-btn w-7 h-7 rounded-lg text-[9px] font-bold flex items-center justify-center border ${isSel ? "es-selected" : ""}`}
                                      style={{
                                        fontFamily: "'DM Mono', monospace",
                                        cursor: isDisabled ? "not-allowed" : "pointer",
                                        background: isDisabled ? "#e5e7eb" : isSel ? c.color : c.light,
                                        borderColor: isDisabled ? "#d1d5db" : c.border,
                                        color: isDisabled ? "#9ca3af" : isSel ? "#fff" : c.pillText,
                                        boxShadow: isSel ? `0 4px 12px ${c.color}33` : "none",
                                      }}
                                    >
                                      {col}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {catIdx < categoryOrder.length - 1 && (
                      <div className="flex items-center gap-3 mt-6">
                        <div className="h-px flex-1" style={{ background: "repeating-linear-gradient(90deg, #e5e7eb 0, #e5e7eb 6px, transparent 6px, transparent 12px)" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                        <div className="h-px flex-1" style={{ background: "repeating-linear-gradient(90deg, #e5e7eb 0, #e5e7eb 6px, transparent 6px, transparent 12px)" }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-5 mt-12 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md border-2" style={{ background: "#fff", borderColor: "#e5e7eb" }} />
                <span className="text-[11px] text-gray-400 font-medium">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center" style={{ background: "#f3f4f6", borderColor: "#e5e7eb", opacity: 0.6 }}>
                  <X size={8} className="text-gray-300" />
                </div>
                <span className="text-[11px] text-gray-400 font-medium">Booked / Locked</span>
              </div>
              {categoryOrder.map((cat) => {
                const c = SEAT_CAT[cat] || SEAT_CAT.General;
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md border-2" style={{ background: c.color, borderColor: c.color }} />
                    <span className="text-[11px] text-gray-400 font-medium">Selected ({cat})</span>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-[11px] text-gray-300 mt-3 flex items-center justify-center gap-1.5">
              <Info size={10} /> Max {MAX_SEATS} seats · Reservation expires in {LOCK_SECONDS / 60} min
            </p>
          </>
        ) : (
          /* ── General Admission — ticket tier quantity selector ── */
          <div>
            <div className="flex items-center gap-2 mb-4 px-1">
              <Users size={14} className="text-gray-400" />
              <p className="text-[13px] text-gray-500">
                General admission — no assigned seats. Pick your tier and quantity below.
              </p>
            </div>

            <div className="space-y-3">
              {ticketTypes.map((t, idx) => {
                const qty = ticketQty[t._id] || 0;
                const soldOut = t.available === 0;
                const accent = ["#f0545c", "#6366f1", "#059669", "#b45309"][idx % 4];
                return (
                  <div
                    key={t._id}
                    className="bg-white rounded-2xl border overflow-hidden flex items-stretch transition-all"
                    style={{
                      borderColor: qty > 0 ? accent : "#e5e7eb",
                      boxShadow: qty > 0 ? `0 4px 14px ${accent}22` : "none",
                      opacity: soldOut ? 0.5 : 1,
                    }}
                  >
                    <div style={{ width: 5, background: accent, flexShrink: 0 }} />
                    <div className="flex-1 flex items-center justify-between gap-4 p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}15` }}>
                          <Ticket size={16} color={accent} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-gray-900 truncate">{t.name}</p>
                          <p className="text-[12px] text-gray-400 mt-0.5">
                            <span className="font-semibold" style={{ color: accent }}>₹{t.price.toLocaleString("en-IN")}</span>
                            {soldOut ? " · Sold out" : t.available != null ? ` · ${t.available} left` : ""}
                          </p>
                        </div>
                      </div>

                      {!soldOut && (
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <button
                            onClick={() => adjustQty(t._id, -1, t.available)}
                            disabled={qty === 0}
                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-5 text-center text-[15px] font-extrabold text-gray-900 tabular-nums">{qty}</span>
                          <button
                            onClick={() => adjustQty(t._id, 1, t.available)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-transform active:scale-90"
                            style={{ background: accent }}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {toast && (
          <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-[13px] font-semibold shadow-lg z-50 ${toast.type === "error" ? "bg-red-600 text-white" : "bg-gray-900 text-white"}`}>
            {toast.message}
          </div>
        )}

        {/* Bottom bar */}
        {!proceedDisabled && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 md:px-8 py-3.5 flex items-center justify-between z-30" style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.07)" }}>
            <div>
              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                {bookingType === "seated" ? <Ticket size={11} /> : <Users size={11} />}
                {proceedCount} {bookingType === "seated" ? "seat" : "ticket"}{proceedCount !== 1 ? "s" : ""} selected
              </p>
              <p className="text-[18px] font-extrabold text-gray-900 mt-0.5">₹{total.toLocaleString("en-IN")}</p>
            </div>
            <button onClick={handleProceed} disabled={locking}
              className="px-7 py-3 rounded-xl font-bold text-[13px] text-white flex items-center gap-2 transition-transform active:scale-95"
              style={{ background: "#f0545c" }}>
              {locking ? <Loader2 size={14} className="animate-spin" /> : null}
              {locking ? "Locking…" : "Proceed"}
            </button>
          </div>
        )}
      </div>

      {/* ── Checkout drawer ── */}
      {showSummary && orderData && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-[15px] font-bold text-gray-900">Confirm & Pay</p>
                <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[240px]">{event?.title}</p>
              </div>
              <button onClick={() => setShowSummary(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-50">
                <X size={17} className="text-gray-400" />
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 mb-4">
                {bookingType === "seated" ? (
                  <div className="flex justify-between text-[12px] text-gray-500">
                    <span>Seats ({selected.length})</span>
                    <span className="font-semibold text-gray-700">{selected.join(", ")}</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {ticketTypes.filter((t) => (ticketQty[t._id] || 0) > 0).map((t) => (
                      <div key={t._id} className="flex justify-between text-[12px] text-gray-500">
                        <span>{t.name} × {ticketQty[t._id]}</span>
                        <span className="font-semibold text-gray-700">₹{(t.price * ticketQty[t._id]).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between text-[12px] text-gray-500 mb-1.5"><span>Subtotal</span><span>₹{orderData.totalAmount}</span></div>
              <div className="flex justify-between text-[12px] text-gray-500 mb-3"><span>Convenience fee</span><span>₹{orderData.convenienceFee}</span></div>
              <div className="flex justify-between text-[16px] font-extrabold text-gray-900 pt-3 border-t border-dashed border-gray-200">
                <span>Total</span><span>₹{orderData.grandTotal}</span>
              </div>

              <div className="mt-5 space-y-2">
                {wallet && (
                  <button onClick={() => setPayMethod("wallet")}
                    disabled={wallet.walletBalance < orderData.grandTotal}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors"
                    style={{ borderColor: payMethod === "wallet" ? "#f0545c" : "#e5e7eb", background: payMethod === "wallet" ? "rgba(240,84,92,0.05)" : "#fff", opacity: wallet.walletBalance < orderData.grandTotal ? 0.5 : 1 }}>
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-gray-800"><Wallet size={15} /> CineVerse Wallet</span>
                    <span className="text-[12px] text-gray-400">₹{wallet.walletBalance}</span>
                  </button>
                )}
                <button onClick={() => setPayMethod("razorpay")}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors"
                  style={{ borderColor: payMethod === "razorpay" ? "#f0545c" : "#e5e7eb", background: payMethod === "razorpay" ? "rgba(240,84,92,0.05)" : "#fff" }}>
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-gray-800"><CreditCard size={15} /> Card / UPI / NetBanking</span>
                  <CheckCircle2 size={16} className={payMethod === "razorpay" ? "text-[#f0545c]" : "text-gray-200"} />
                </button>
              </div>

              <button onClick={handleConfirm} disabled={paying}
                className="w-full mt-5 py-3.5 rounded-xl font-bold text-[14px] text-white flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                style={{ background: "#f0545c" }}>
                {paying ? <Loader2 size={15} className="animate-spin" /> : <IndianRupee size={15} />}
                {paying ? "Processing…" : `Pay ₹${orderData.grandTotal}`}
              </button>
            </div>
          </div>
        </div>
      )}
      {loadingOrder && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
          <Loader2 size={28} className="animate-spin text-white" />
        </div>
      )}
    </div>
  );
}