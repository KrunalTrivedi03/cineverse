// src/pages/TicketQuantitySelection.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import { useEventRazorpay } from "../hooks/useEventRazorpay";
import {
  ChevronLeft, MapPin, Plus, Minus, X, Loader2,
  Wallet, CreditCard, CheckCircle2, IndianRupee,
} from "lucide-react";
import { fmt12, fmtDate, getCurrentUser } from "../utils/eventHelpers";
import BottomNav from "../components/BottomNav";
import {
  savePendingBooking,
  getPendingBooking,
  clearPendingBooking,
  saveBookingDraft,
} from "../utils/authSession";

export default function TicketQuantitySelection() {
  const { scheduleId, slotId } = useParams();
  const location = useLocation();
  const { state } = location;
  const navigate  = useNavigate();

  // If the user was bounced to /login mid-selection (unauthenticated
  // "Proceed"), the event/venue context and chosen quantities were stashed
  // in sessionStorage — restore them so we don't lose the page on return.
  const pendingRef = useRef(getPendingBooking());
  const pending = pendingRef.current;
  const restored =
    pending?.type === "event" && pending?.scheduleId === scheduleId && pending?.slotId === slotId
      ? pending.pageState
      : null;

  const event = restored?.event || state?.event;
  const venue = restored?.venue || state?.venue;

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
  const [appliedOffer, setAppliedOffer] = useState(null);

  const { initiatePayment } = useEventRazorpay();

  useEffect(() => {
    if (!scheduleId || !slotId || !event) { navigate("/"); return; }
    setLoading(true);
    api.get(`/event-seats/availability/${scheduleId}/${slotId}`)
      .then((r) => setAvailability(r.data))
      .catch(() => showToast("Failed to load ticket availability", "error"))
      .finally(() => setLoading(false));
  }, [scheduleId, slotId]);

  // Restore previously-chosen quantities once availability has loaded, and
  // pick straight back up where the user left off before logging in.
  useEffect(() => {
    if (!pending?.resumeQty || !availability) return;
    setQty(pending.resumeQty);
    clearPendingBooking();
    pendingRef.current = null;
    setTimeout(() => proceedToReview(pending.resumeQty), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availability]);

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

  const openCheckout = () => {
    if (!totalQty) return;
    const user = getCurrentUser();
    if (!user?.id) {
      savePendingBooking({
        type: "event",
        scheduleId,
        slotId,
        resumeQty: qty,
        pageState: { event, venue },
      });
      showToast("Please log in to continue booking", "error");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    proceedToReview(qty);
  };

  // Hands off to the shared BookingReview page — order creation + payment
  // now live there, shared with Movies.
  const proceedToReview = (qtyMap) => {
    const chosenType = Object.entries(qtyMap).find(([, c]) => c > 0);
    if (!chosenType) return;
    const [ticketTypeName, quantity] = chosenType;
    const ticketType = (availability?.ticketTypes || []).find((t) => t.name === ticketTypeName);

    const draft = {
      type: "event",
      itemId: event?._id,
      itemTitle: event?.title,
      itemPoster: event?.poster,
      genre: event?.category,
      venueName: venue?.name,
      date: availability?.eventDate,
      time: availability?.eventTime,
      scheduleId,
      slotId,
      ticketTypeName,
      quantity,
      unitPrice: ticketType?.price || 0,
    };
    saveBookingDraft(draft);
    navigate("/booking/review", { state: { draft } });
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
        const { data } = await api.post("/event-payment/wallet-pay", { scheduleId, slotId, ticketTypeName, quantity, offerId: appliedOffer?.offerId });
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
        {[0, 1, 2].map((i) => <span key={i} className="w-2.5 h-2.5 rounded-full bg-now-accent animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#fafafb", fontFamily: "'Outfit', sans-serif" }}>
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
                    style={{ borderColor: "#106579", color: "#106579" }}
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
            <button onClick={openCheckout} disabled={!totalQty}
              className="px-6 py-2.5 rounded-xl font-bold text-[13px] text-white flex items-center gap-2 disabled:opacity-50"
              style={{ background: "#106579" }}>
              Proceed
            </button>
          </div>
        )}
      </div>

    </div>
  );
}