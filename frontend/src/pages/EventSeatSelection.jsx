// src/pages/EventSeatSelection.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import { useEventRazorpay } from "../hooks/useEventRazorpay";
import {
  ChevronLeft, MapPin, Clock, X, Loader2, Timer,
  Wallet, CreditCard, CheckCircle2, IndianRupee,
} from "lucide-react";
import { IMG, fmt12, fmtDate, fmtCountdown, getSocketUserId, getCurrentUser, SEAT_CAT } from "../utils/eventHelpers";

const BASE = import.meta.env.VITE_API_URL;
const LOCK_SECONDS = 5 * 60;
const MAX_SEATS = 10;

export default function EventSeatSelection() {
  const { scheduleId, slotId } = useParams();
  const { state } = useLocation();
  const navigate  = useNavigate();

  const event = state?.event;
  const userId = getSocketUserId();

  const [layoutData, setLayoutData] = useState(null);
  const [seats, setSeats]           = useState({});
  const [selected, setSelected]     = useState([]);
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

  useEffect(() => {
    if (!scheduleId || !slotId) return;
    setLoading(true);
    api.get(`/event-seats/layout/${scheduleId}/${slotId}`)
      .then((res) => { setLayoutData(res.data); setSeats(res.data.seats); })
      .catch((err) => {
        if (err.response?.status === 400) setNoLayout(true);
        else showToast("Failed to load seats", "error");
      })
      .finally(() => setLoading(false));
  }, [scheduleId, slotId]);

  useEffect(() => {
    if (!scheduleId || !slotId) return;
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
  }, [scheduleId, slotId]);

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
    showToast("Seat reservation expired. Please reselect.", "error");
    if (selected.length > 0) {
      await api.delete("/event-seats/lock", { data: { scheduleId, slotId, seatIds: selected, userId } }).catch(() => {});
      selected.forEach((sid) => socketRef.current?.emit("event-seat:deselect", { scheduleId, slotId, seatId: sid }));
    }
    setSelected([]);
    setOrderData(null);
    setSeats((p) => {
      const n = { ...p };
      Object.keys(n).forEach((sid) => { if (n[sid].status === "selected") n[sid] = { ...n[sid], status: "available" }; });
      return n;
    });
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

  const handleProceed = async () => {
    if (!selected.length) return;
    const user = getCurrentUser();
    if (!user?.id) { showToast("Please log in to book tickets", "error"); navigate("/login"); return; }

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
  };

  const onBookingConfirmed = (booking) => {
    socketRef.current?.emit("event-booking:confirmed", { scheduleId, slotId, seatIds: selected });
    stopCountdown();
    navigate("/booking/event-success", { state: { booking, event, venue: layoutData } });
  };

  const handleConfirm = async () => {
    const user = getCurrentUser();
    if (!user?.id) { showToast("Please log in to continue", "error"); navigate("/login"); return; }

    if (payMethod === "wallet") {
      setPaying(true);
      try {
        const { data } = await api.post("/event-payment/wallet-pay", { scheduleId, slotId, seatIds: selected });
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-4">
      <p className="text-[16px] font-bold text-gray-400">Seat layout not configured</p>
      <p className="text-[13px] text-gray-300 mt-1">Please check back later or contact the organizer.</p>
    </div>
  );

  const layout = layoutData?.layout || [];
  const total  = selected.reduce((s, id) => s + (seats[id]?.priceAdd != null ? layoutData.basePrice + seats[id].priceAdd : 0), 0);
  const fee    = Math.round(total * 0.02);
  const grand  = total + fee;

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f5", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>
      <Navbar />

      <div className="bg-white border-b border-gray-200 sticky top-[60px] z-40">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0">
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-bold text-gray-900 truncate">{event?.title}</h1>
            <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
              <MapPin size={10} /> {layoutData?.venue} · {fmtDate(layoutData?.eventDate)} · {fmt12(layoutData?.eventTime)}
            </p>
          </div>
          {countdown != null && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: "rgba(240,84,92,0.08)" }}>
              <Timer size={13} color="#f0545c" />
              <span className="text-[13px] font-bold" style={{ color: "#f0545c" }}>{fmtCountdown(countdown)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
        {/* Legend */}
        <div className="flex items-center gap-5 justify-center mb-6 flex-wrap text-[11px]">
          {Object.entries(SEAT_CAT).map(([cat, c]) => (
            <span key={cat} className="flex items-center gap-1.5 text-gray-500">
              <span className="w-4 h-4 rounded" style={{ background: c.light, border: `1.5px solid ${c.border}` }} /> {cat}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="w-4 h-4 rounded bg-gray-200" /> Booked/Locked
          </span>
        </div>

        {/* Seat grid */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 overflow-x-auto">
          <div className="flex flex-col items-center gap-2 min-w-fit">
            {layout.map((row) => (
              <div key={row.row} className="flex items-center gap-2">
                <span className="w-5 text-[11px] font-bold text-gray-400">{row.row}</span>
                <div className="flex gap-1.5">
                  {Array.from({ length: row.seats }, (_, i) => {
                    const seatId = `${row.row}${i + 1}`;
                    const seat = seats[seatId] || {};
                    const cat  = SEAT_CAT[row.category] || SEAT_CAT.General;
                    const status = seat.status || "available";
                    const isSel = status === "selected";
                    const isDisabled = status === "booked" || status === "locked";
                    return (
                      <button
                        key={seatId}
                        onClick={() => toggleSeat(seatId)}
                        disabled={isDisabled}
                        title={seatId}
                        style={{
                          width: 24, height: 24, borderRadius: 6, fontSize: 8, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          background: isDisabled ? "#e5e7eb" : isSel ? cat.color : cat.light,
                          border: `1.5px solid ${isDisabled ? "#d1d5db" : cat.border}`,
                          color: isDisabled ? "#9ca3af" : isSel ? "#fff" : cat.pillText,
                        }}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {toast && (
          <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-[13px] font-semibold shadow-lg z-50 ${toast.type === "error" ? "bg-red-600 text-white" : "bg-gray-900 text-white"}`}>
            {toast.message}
          </div>
        )}

        {/* Bottom bar */}
        {selected.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 md:px-8 py-3 flex items-center justify-between z-30" style={{ boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}>
            <div>
              <p className="text-[11px] text-gray-400">{selected.length} seat{selected.length !== 1 ? "s" : ""} selected</p>
              <p className="text-[17px] font-extrabold text-gray-900">₹{total.toLocaleString("en-IN")}</p>
            </div>
            <button onClick={handleProceed} disabled={locking}
              className="px-6 py-2.5 rounded-xl font-bold text-[13px] text-white flex items-center gap-2"
              style={{ background: "#f0545c" }}>
              {locking ? <Loader2 size={14} className="animate-spin" /> : null}
              {locking ? "Locking…" : "Proceed"}
            </button>
          </div>
        )}
      </div>

      {/* ── Checkout drawer ── */}
      {showSummary && orderData && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="text-[15px] font-bold text-gray-900">Confirm & Pay</p>
              <button onClick={() => setShowSummary(false)}><X size={18} className="text-gray-400" /></button>
            </div>

            <div className="px-5 py-4">
              <div className="flex justify-between text-[12px] text-gray-500 mb-1"><span>Seats ({selected.length})</span><span>{selected.join(", ")}</span></div>
              <div className="flex justify-between text-[12px] text-gray-500 mb-1"><span>Subtotal</span><span>₹{orderData.totalAmount}</span></div>
              <div className="flex justify-between text-[12px] text-gray-500 mb-3"><span>Convenience fee</span><span>₹{orderData.convenienceFee}</span></div>
              <div className="flex justify-between text-[15px] font-extrabold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span><span>₹{orderData.grandTotal}</span>
              </div>

              <div className="mt-4 space-y-2">
                {wallet && (
                  <button onClick={() => setPayMethod("wallet")}
                    disabled={wallet.walletBalance < orderData.grandTotal}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left"
                    style={{ borderColor: payMethod === "wallet" ? "#f0545c" : "#e5e7eb", background: payMethod === "wallet" ? "rgba(240,84,92,0.05)" : "#fff", opacity: wallet.walletBalance < orderData.grandTotal ? 0.5 : 1 }}>
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-gray-800"><Wallet size={15} /> CineVerse Wallet</span>
                    <span className="text-[12px] text-gray-400">₹{wallet.walletBalance}</span>
                  </button>
                )}
                <button onClick={() => setPayMethod("razorpay")}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left"
                  style={{ borderColor: payMethod === "razorpay" ? "#f0545c" : "#e5e7eb", background: payMethod === "razorpay" ? "rgba(240,84,92,0.05)" : "#fff" }}>
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-gray-800"><CreditCard size={15} /> Card / UPI / NetBanking</span>
                  <CheckCircle2 size={16} className={payMethod === "razorpay" ? "text-[#f0545c]" : "text-gray-200"} />
                </button>
              </div>

              <button onClick={handleConfirm} disabled={paying}
                className="w-full mt-4 py-3 rounded-xl font-bold text-[14px] text-white flex items-center justify-center gap-2"
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