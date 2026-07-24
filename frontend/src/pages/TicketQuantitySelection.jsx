// src/pages/TicketQuantitySelection.jsx
import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import { useEventRazorpay } from "../hooks/useEventRazorpay";
import {
  ChevronLeft, MapPin, Plus, Minus, X, Loader2,
  Wallet, CreditCard, CheckCircle2, IndianRupee,
} from "lucide-react";
import { fmt12, fmtDate, getCurrentUser } from "../utils/eventHelpers";

export default function TicketQuantitySelection() {
  const { scheduleId, slotId } = useParams();
  const { state } = useLocation();
  const navigate  = useNavigate();

  const event = state?.event;
  const venue = state?.venue;

  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty]         = useState({}); // { ticketTypeName: count }

  const [showSummary, setShowSummary] = useState(false);
  const [orderData, setOrderData]     = useState(null);
  const [payMethod, setPayMethod]     = useState("razorpay");
  const [paying, setPaying]           = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [wallet, setWallet]           = useState(null);
  const [toast, setToast]             = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  const { initiatePayment } = useEventRazorpay();

  useEffect(() => {
    if (!scheduleId || !slotId || !event) { navigate("/"); return; }
    setLoading(true);
    api.get(`/event-seats/availability/${scheduleId}/${slotId}`)
      .then((r) => setAvailability(r.data))
      .catch(() => showToast("Failed to load ticket availability", "error"))
      .finally(() => setLoading(false));
  }, [scheduleId, slotId]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const setCount = (name, delta, max) => {
    setQty((p) => {
      const current = p[name] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...p, [name]: next };
    });
  };

  const totalQty  = Object.values(qty).reduce((a, b) => a + b, 0);
  const subtotal  = (availability?.ticketTypes || []).reduce((s, t) => s + (qty[t.name] || 0) * t.price, 0);

  const handleProceed = async () => {
    const chosenType = Object.entries(qty).find(([, c]) => c > 0);
    if (!chosenType) return;
    const [ticketTypeName, quantity] = chosenType;

    const user = getCurrentUser();
    if (!user?.id) { showToast("Please log in to book tickets", "error"); navigate("/login"); return; }

    setLoadingOrder(true);
    try {
      const { data } = await api.post("/event-payment/create-order", {
        scheduleId, slotId, ticketTypeName, quantity,
      });
      setOrderData(data);
      setPayMethod(data.wallet?.eligible ? "wallet" : "razorpay");
      setShowSummary(true);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to proceed", "error");
    } finally {
      setLoadingOrder(false);
    }
  };

  useEffect(() => {
    if (!showSummary) return;
    const user = getCurrentUser();
    if (!user?.id) return;
    api.get("/quickpay").then((r) => setWallet(r.data)).catch(() => setWallet(null));
  }, [showSummary]);

  const onBookingConfirmed = (booking) => {
    navigate("/booking/event-success", { state: { booking, event, venue } });
  };

  const handleConfirm = async () => {
    const user = getCurrentUser();
    if (!user?.id) { showToast("Please log in to continue", "error"); navigate("/login"); return; }

    if (payMethod === "wallet") {
      setPaying(true);
      try {
        const chosenType = Object.entries(qty).find(([, c]) => c > 0);
        const [ticketTypeName, quantity] = chosenType;
        const { data } = await api.post("/event-payment/wallet-pay", { scheduleId, slotId, ticketTypeName, quantity });
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

  if (loading || !event) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => <span key={i} className="w-2.5 h-2.5 rounded-full bg-[#f0545c] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f5", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>
      <Navbar />

      <div className="bg-white border-b border-gray-200 sticky top-[60px] z-40">
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0">
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-bold text-gray-900 truncate">{event.title}</h1>
            <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
              <MapPin size={10} /> {venue?.name} · {fmtDate(availability?.eventDate)} · {fmt12(availability?.eventTime)}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6">
        <h2 className="text-[16px] font-bold text-gray-900 mb-4">Select Tickets</h2>

        <div className="space-y-3">
          {(availability?.ticketTypes || []).map((t) => {
            const count = qty[t.name] || 0;
            const soldOut = t.available <= 0;
            return (
              <div key={t._id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-bold text-gray-900">{t.name}</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">₹{t.price} per ticket</p>
                  {soldOut ? (
                    <p className="text-[11px] font-semibold text-red-500 mt-1">Sold out</p>
                  ) : t.available <= 10 ? (
                    <p className="text-[11px] font-semibold text-amber-500 mt-1">Only {t.available} left</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCount(t.name, -1, t.available)}
                    disabled={count === 0}
                    className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center disabled:opacity-30"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-5 text-center text-[14px] font-bold text-gray-900">{count}</span>
                  <button
                    onClick={() => setCount(t.name, 1, t.available)}
                    disabled={soldOut || count >= t.available || count >= 10 || (totalQty > 0 && !qty[t.name])}
                    className="w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-30"
                    style={{ borderColor: "#f0545c", color: "#f0545c" }}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {toast && (
          <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-[13px] font-semibold shadow-lg z-50 ${toast.type === "error" ? "bg-red-600 text-white" : "bg-gray-900 text-white"}`}>
            {toast.message}
          </div>
        )}

        {totalQty > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 md:px-8 py-3 flex items-center justify-between z-30" style={{ boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}>
            <div>
              <p className="text-[11px] text-gray-400">{totalQty} ticket{totalQty !== 1 ? "s" : ""}</p>
              <p className="text-[17px] font-extrabold text-gray-900">₹{subtotal.toLocaleString("en-IN")}</p>
            </div>
            <button onClick={handleProceed} disabled={loadingOrder}
              className="px-6 py-2.5 rounded-xl font-bold text-[13px] text-white flex items-center gap-2"
              style={{ background: "#f0545c" }}>
              {loadingOrder ? <Loader2 size={14} className="animate-spin" /> : null}
              {loadingOrder ? "Please wait…" : "Proceed"}
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
              <div className="flex justify-between text-[12px] text-gray-500 mb-1"><span>{orderData.ticketType?.name} × {orderData.quantity}</span><span>₹{orderData.totalAmount}</span></div>
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
    </div>
  );
}