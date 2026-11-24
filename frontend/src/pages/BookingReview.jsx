import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import Dialog from "../components/Dialog";
import OffersDrawer from "../components/OffersDrawer";
import { useRazorpay } from "../hooks/useRazorpay";
import { useEventRazorpay } from "../hooks/useEventRazorpay";
import { usePlayRazorpay } from "../hooks/usePlayRazorpay";
import {
  ChevronLeft, ChevronDown, MapPin, Calendar, Clock, Ticket, Timer, Info, Wallet,
  CreditCard, CheckCircle, Loader2, AlertCircle, CheckCircle2,
  ShieldCheck, User, QrCode, X,
} from "lucide-react";
import {
  isAuthenticated,
  getCurrentUser,
  saveBookingDraft,
  getBookingDraft,
  clearBookingDraft,
  savePendingBooking,
} from "../utils/authSession";

const IMG = (path) => (!path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`);
const BASE = import.meta.env.VITE_API_URL;
const ACCENT = "#106579";

const fmt12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${(h % 12 || 12).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
};
const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};
const fmtCountdown = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/**
 * Shared review + payment page for both Movie and Event bookings.
 *
 * Reads a normalized "booking draft" from location.state (or sessionStorage,
 * so it survives refreshes and login redirects). Layout is a single page —
 * no stepper, no popup — with a left column (item details + offers) and a
 * right column (summary / user details / payment / T&Cs), stacking on
 * mobile. The same structure is designed to accommodate future booking
 * types: anything that can produce a draft in this shape can reuse this page.
 */
export default function BookingReview() {
  const location = useLocation();
  const navigate = useNavigate();

  const [draft] = useState(() => location.state?.draft || getBookingDraft());
  const [orderData, setOrderData] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [payMethod, setPayMethod] = useState("razorpay");
  const [paying, setPaying] = useState(false);
  const [quickPay, setQuickPay] = useState(null);
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [toast, setToast] = useState(null);
  const [orderError, setOrderError] = useState("");
  const [orderAmountOpen, setOrderAmountOpen] = useState(false);
  const [bookingChargeOpen, setBookingChargeOpen] = useState(false);
  const [tncOpen, setTncOpen] = useState(false);
  const [paymentPopupOpen, setPaymentPopupOpen] = useState(false);

  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const { initiatePayment: initiateMoviePayment } = useRazorpay();
  const { initiatePayment: initiateEventPayment } = useEventRazorpay();
  const user = getCurrentUser();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Persist whatever draft we ended up with so a refresh / login redirect
  // can rehydrate this page exactly where the user left off.
  useEffect(() => {
    if (!draft) {
      navigate("/", { replace: true });
      return;
    }
    saveBookingDraft(draft);
  }, [draft, navigate]);

  const isMovie = draft?.type === "movie";
  const isEvent = draft?.type === "event";
  const isPlay = draft?.type === "play";

  /* ── Play-only: order creation, hold countdown, pay, unlock-on-leave ──── */
  const { initiatePayment: initiatePlayPayment } = usePlayRazorpay();
  const [playOrderData, setPlayOrderData] = useState(null);
  const [playLoadingOrder, setPlayLoadingOrder] = useState(true);
  const [playPaying, setPlayPaying] = useState(false);
  const [playCountdown, setPlayCountdown] = useState(null);
  const playTimerRef = useRef(null);

  const playPaidRef = useRef(false);

  const releasePlayLock = useCallback(async () => {
    if (!isPlay || !draft) return;
    await api.delete("/play-slots/lock", { data: { slotIds: draft.slotIds, userId: draft.userId } }).catch(() => {});
  }, [isPlay, draft]);

  // Release the hold on unmount — covers the back button, browser back,
  // and closing/navigating away any other way — unless payment just
  // succeeded (in which case the slots are booked, not just held).
  useEffect(() => {
    if (!isPlay || !draft) return;
    return () => { if (!playPaidRef.current) releasePlayLock(); };
  }, [isPlay, draft, releasePlayLock]);

  const handlePlayBack = () => {
    releasePlayLock();
    clearBookingDraft();
    navigate(-1);
  };

  useEffect(() => {
    if (!isPlay || !draft) return;
    setPlayLoadingOrder(true);
    api.post("/play-payment/create-order", { slotIds: draft.slotIds })
      .then((r) => setPlayOrderData(r.data))
      .catch((err) => showToast(err.response?.data?.message || "Couldn't prepare this order", "error"))
      .finally(() => setPlayLoadingOrder(false));
  }, [isPlay, draft]);

  useEffect(() => {
    if (!isPlay || !draft?.lockExpiresAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.round((draft.lockExpiresAt - Date.now()) / 1000));
      setPlayCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(playTimerRef.current);
        showToast("Your hold expired. Please reselect.", "error");
        releasePlayLock();
        clearBookingDraft();
        setTimeout(() => navigate(-1), 1400);
      }
    };
    tick();
    playTimerRef.current = setInterval(tick, 1000);
    return () => clearInterval(playTimerRef.current);
  }, [isPlay, draft, navigate, releasePlayLock]);

  const handlePlayPay = () => {
    if (!requireAuthOrRedirect() || !playOrderData) return;
    setPlayPaying(true);
    initiatePlayPayment({
      existingOrder: playOrderData,
      userDetails: { name: user?.username || "", email: user?.email || "", contact: user?.phone || "" },
      onSuccess: (bookingRef, booking) => {
        playPaidRef.current = true;
        setPlayPaying(false);
        clearBookingDraft();
        navigate("/play/booking-success", { state: { booking, bookingRef } });
      },
      onFailure: (reason) => {
        setPlayPaying(false);
        showToast(reason || "Payment failed. Please try again.", "error");
      },
    });
  };


  /* ── Movie-only: live seat lock + countdown, socket reconnect ────────── */
  useEffect(() => {
    if (!isMovie || !draft) return;
    const socket = io(BASE, { query: { userId: draft.userId }, transports: ["websocket"] });
    socketRef.current = socket;
    socket.emit("join:show", { showId: draft.showId, slotId: draft.slotId });
    return () => {
      socket.emit("leave:show", { showId: draft.showId, slotId: draft.slotId });
      socket.disconnect();
    };
  }, [isMovie, draft]);

  const releaseMovieLock = useCallback(async () => {
    if (!isMovie || !draft) return;
    await api
      .delete("/seats/lock", {
        data: { showId: draft.showId, slotId: draft.slotId, seatIds: draft.seats.map((s) => s.id), userId: draft.userId },
      })
      .catch(() => {});
  }, [isMovie, draft]);

  useEffect(() => {
    if (!isMovie || !draft?.lockExpiresAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.round((draft.lockExpiresAt - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        showToast("Seat reservation expired. Redirecting to Home…", "error");
        releaseMovieLock();
        clearBookingDraft();
        setTimeout(() => navigate("/", { replace: true }), 1400);
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [isMovie, draft, navigate, releaseMovieLock]);

  /* ── Create / recreate the order whenever the applied offer changes ──── */
  const createOrder = useCallback(async () => {
    if (!draft || !isAuthenticated()) return;
    setLoadingOrder(true);
    setOrderError("");
    try {
      if (isMovie) {
        const { data } = await api.post("/payment/create-order", {
          showId: draft.showId,
          slotId: draft.slotId,
          seatIds: draft.seats.map((s) => s.id),
          offerId: appliedOffer?.offerId,
          language: draft.language,
        });
        setOrderData(data);
        setPayMethod(data.wallet?.eligible ? "wallet" : "razorpay");
      } else if (isEvent) {
        const { data } = await api.post("/event-payment/create-order", {
          scheduleId: draft.scheduleId,
          slotId: draft.slotId,
          ticketTypeName: draft.ticketTypeName,
          quantity: draft.quantity,
          offerId: appliedOffer?.offerId,
        });
        setOrderData(data);
        setPayMethod(data.wallet?.eligible ? "wallet" : "razorpay");
      }
    } catch (err) {
      setOrderError(err.response?.data?.message || "Couldn't prepare this order");
    } finally {
      setLoadingOrder(false);
    }
  }, [draft, isMovie, isEvent, appliedOffer]);

  useEffect(() => {
    createOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedOffer?.offerId]);

  useEffect(() => {
    if (!isAuthenticated()) return;
    api.get("/quickpay").then((r) => setQuickPay(r.data)).catch(() => setQuickPay(null));
  }, []);

  /* ── Auth guard on the actual "pay" action ────────────────────────────
   * Browsing/reviewing this page never requires auth by itself (in
   * practice we only reach here after an authenticated seat lock / ticket
   * pick, but a session can lapse — e.g. the 3h inactivity timeout — while
   * the user is still reviewing). If that happens, preserve the draft and
   * bounce through login, landing right back here afterwards. */
  const requireAuthOrRedirect = () => {
    if (isAuthenticated()) return true;
    savePendingBooking({ resumeTo: location.pathname });
    saveBookingDraft(draft);
    navigate("/login", { state: { from: location.pathname } });
    return false;
  };

  const bookingConfirmed = (booking) => {
    clearBookingDraft();
    if (isMovie) {
      socketRef.current?.emit("booking:confirmed", {
        showId: draft.showId,
        slotId: draft.slotId,
        seatIds: draft.seats.map((s) => s.id),
      });
      navigate("/booking/success", { state: { booking, movie: { title: draft.itemTitle, poster: draft.itemPoster, language: draft.language }, theatre: { name: draft.venueName } } });
    } else {
      navigate("/booking/event-success", { state: { booking, event: { title: draft.itemTitle, poster: draft.itemPoster }, venue: { name: draft.venueName } } });
    }
  };

  const handleConfirm = async () => {
    setPaymentPopupOpen(false);
    if (!requireAuthOrRedirect()) return;
    if (!orderData) return;

    if (payMethod === "wallet") {
      setPaying(true);
      try {
        if (isMovie) {
          const { data } = await api.post("/payment/wallet-pay", {
            showId: draft.showId,
            slotId: draft.slotId,
            seatIds: draft.seats.map((s) => s.id),
            offerId: appliedOffer?.offerId,
            language: draft.language,
          });
          bookingConfirmed(data.booking);
        } else {
          const { data } = await api.post("/event-payment/wallet-pay", {
            scheduleId: draft.scheduleId,
            slotId: draft.slotId,
            ticketTypeName: draft.ticketTypeName,
            quantity: draft.quantity,
            offerId: appliedOffer?.offerId,
          });
          bookingConfirmed(data.booking);
        }
      } catch (err) {
        showToast(err.response?.data?.message || "Wallet payment failed. Try another method.", "error");
        setPayMethod("razorpay");
      } finally {
        setPaying(false);
      }
      return;
    }

    const userDetails = { name: user?.username || "", email: user?.email || "", contact: user?.phone || "" };
    const onFailure = (reason) => showToast(reason || "Payment failed. Please try again.", "error");

    if (isMovie) {
      initiateMoviePayment({
        showId: draft.showId,
        slotId: draft.slotId,
        seatIds: draft.seats.map((s) => s.id),
        existingOrder: {
          orderId: orderData.orderId, amount: orderData.amount, currency: orderData.currency,
          keyId: orderData.keyId, bookingId: orderData.bookingId,
        },
        userDetails,
        onSuccess: (_ref, booking) => bookingConfirmed(booking),
        onFailure,
      });
    } else {
      initiateEventPayment({
        existingOrder: orderData,
        userDetails,
        onSuccess: (_ref, booking) => bookingConfirmed(booking),
        onFailure,
      });
    }
  };

  /* ── Derived pricing (used before the order comes back, and as fallback) */
  const subtotal = useMemo(() => {
    if (!draft) return 0;
    if (isMovie) return draft.seats.reduce((s, x) => s + x.price, 0);
    return (draft.unitPrice || 0) * (draft.quantity || 0);
  }, [draft, isMovie]);

  if (!draft) return null;

  if (isPlay) {
    const fmtRange = `${fmt12(draft.startTime)} - ${fmt12(draft.endTime)}`;
    return (
      <div className="min-h-screen" style={{ background: "#fafafb", fontFamily: "var(--now-ui-font)" }}>
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
          <button onClick={handlePlayBack} className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0">
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-bold text-gray-900 truncate">Review your booking</h1>
          </div>
          {playCountdown !== null && (
            <span
              className="flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0"
              style={{
                background: playCountdown <= 60 ? "#fff1f2" : "rgba(16,101,121,0.07)",
                border: `1px solid ${playCountdown <= 60 ? "#fecdd3" : "rgba(16,101,121,0.2)"}`,
                color: playCountdown <= 60 ? "#dc2626" : ACCENT,
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {fmtCountdown(playCountdown)}
            </span>
          )}
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,34%)] lg:items-start gap-6 pb-32 lg:pb-10">
          {/* Left */}
          <div className="order-1 space-y-4 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden" style={{ background: "linear-gradient(135deg,#1c1c1c,#2d2d2d)" }}>
                {draft.venueImage && <img src={IMG(draft.venueImage)} alt={draft.venueName} className="w-full h-full object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-extrabold text-gray-900">{draft.activityName}</p>
                <p className="text-[12px] text-gray-400 mt-0.5 truncate">{draft.venueName}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-gray-900">{fmtDate(draft.date)} | {fmtRange}</p>
                <p className="text-[13px] font-bold text-gray-900 mt-2">{draft.courtName}</p>
                <p className="text-[11.5px] text-gray-400 mt-0.5">
                  {draft.indoor ? "Indoor" : "Outdoor"}{draft.surfaceType ? ` · ${draft.surfaceType}` : ""}
                </p>
              </div>
              <p className="text-[15px] font-extrabold text-gray-900 flex-shrink-0">₹{draft.price?.toFixed ? draft.price.toFixed(2) : `${draft.price}.00`}</p>
            </div>

            <div>
              <h2 className="text-[14px] font-extrabold text-gray-900 mb-2">Things to know</h2>
              <ul className="space-y-1.5">
                {["Footwear suited to the surface is recommended.", "Arrive 5 mins early to avoid losing playtime."].map((t) => (
                  <li key={t} className="text-[12.5px] text-gray-500 flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-gray-300 mt-2 flex-shrink-0" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Payment summary */}
          <div className="order-2 space-y-4 min-w-0">
            <div>
              <h2 className="text-[14px] font-extrabold text-gray-900 mb-2">Payment Summary</h2>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-500">Order Amount</span>
                  <span className="font-bold text-gray-900">₹{playOrderData?.subtotal ?? draft.price}.00</span>
                </div>
                <div className="flex justify-between text-[13px] pt-2.5 border-t border-gray-100">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-bold text-gray-900">₹{playOrderData?.total ?? draft.price}.00</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-[14px] font-extrabold text-gray-900 mb-2">Your Details</h2>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <User size={16} className="text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-gray-900 truncate">{user?.username || "Guest"}</p>
                  <p className="text-[12px] text-gray-400">{user?.phone || ""}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-[14px] font-extrabold text-gray-900 mb-2">More</h2>
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[13px] font-semibold text-gray-700">Cancellation policy</span>
                  <ChevronDown size={15} className="text-gray-300" style={{ transform: "rotate(-90deg)" }} />
                </div>
              </div>
            </div>

            {/* Desktop Pay Now */}
            <button
              onClick={handlePlayPay}
              disabled={playLoadingOrder || playPaying || !playOrderData}
              className="hidden lg:flex w-full items-center justify-between px-5 py-4 rounded-2xl text-white disabled:opacity-60"
              style={{ background: ACCENT }}
            >
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Total</p>
                <p className="text-[18px] font-extrabold">₹{playOrderData?.total ?? draft.price}</p>
              </div>
              <span className="text-[14px] font-bold flex items-center gap-1.5">
                {playLoadingOrder ? <><Loader2 size={15} className="animate-spin" /> Preparing…</> : playPaying ? <><Loader2 size={15} className="animate-spin" /> Processing…</> : "Pay Now"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile sticky Pay Now */}
        <div className="now-checkout-bar fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3 z-40 lg:hidden" style={{ boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
            <p className="text-[18px] font-extrabold text-gray-900">₹{playOrderData?.total ?? draft.price}</p>
          </div>
          <button
            onClick={handlePlayPay}
            disabled={playLoadingOrder || playPaying || !playOrderData}
            className="px-6 py-3 rounded-xl font-black text-[13px] text-white flex items-center gap-2 disabled:opacity-60"
            style={{ background: ACCENT }}
          >
            {playLoadingOrder || playPaying ? <Loader2 size={15} className="animate-spin" /> : null}
            {playLoadingOrder ? "Preparing…" : playPaying ? "Processing…" : "Pay Now"}
          </button>
        </div>

        {toast && (
          <div
            className="fixed bottom-28 lg:bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-xl text-[13px] font-semibold w-max max-w-[calc(100%-2rem)] shadow-lg"
            style={{
              background: toast.type === "error" ? "#fff1f2" : "#f0fdf4",
              color: toast.type === "error" ? "#dc2626" : "#16a34a",
              border: `1px solid ${toast.type === "error" ? "#fecdd3" : "#bbf7d0"}`,
            }}
          >
            {toast.type === "error" ? <AlertCircle size={15} className="shrink-0" /> : <CheckCircle2 size={15} className="shrink-0" />}
            {toast.message}
          </div>
        )}
      </div>
    );
  }


  const discount = orderData?.discountAmount ?? appliedOffer?.discountAmount ?? 0;
  const convFee = orderData?.convenienceFee ?? Math.round(Math.max(subtotal - discount, 0) * 0.02);
  const total = orderData ? (orderData.grandTotal ?? Math.max(subtotal - discount, 0) + convFee) : Math.max(subtotal - discount, 0) + convFee;

  return (
    <div className="min-h-screen" style={{ background: "#fafafb", fontFamily: "var(--now-ui-font)" }}>
      <Navbar />
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-[60px] z-30">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0">
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-bold text-gray-900 truncate">Review your booking</h1>
          </div>
          {isMovie && countdown !== null && (
            <span
              className="flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0"
              style={{
                background: countdown <= 60 ? "#fff1f2" : "rgba(16,101,121,0.07)",
                border: `1px solid ${countdown <= 60 ? "#fecdd3" : "rgba(16,101,121,0.2)"}`,
                color: countdown <= 60 ? "#dc2626" : ACCENT,
                fontFamily: "'DM Mono', monospace",
              }}
            >
              <Timer size={11} /> {fmtCountdown(countdown)}
            </span>
          )}
        </div>
      </div>

      {/* Body: left = details/offers, right = summary/payment. Grid collapses to a single
          stacked column on mobile — same page, same order, no separate mobile flow. */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,38%)] lg:items-start gap-6 pb-32 lg:pb-10">
        {/* ── LEFT: item details + offers ──
            Mobile order: Movie Details → Offers → Payment Summary → Your
            Details → T&Cs, so this stays first in DOM order on every
            breakpoint (order-1). Desktop keeps its normal left position. */}
        <div className="order-1 space-y-4 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 flex gap-4">
            {draft.itemPoster && (
              <img src={IMG(draft.itemPoster)} alt={draft.itemTitle} className="w-20 h-28 object-cover rounded-xl flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-extrabold text-gray-900" style={{ letterSpacing: "-0.2px" }}>
                {draft.itemTitle}
                {isMovie && draft.language && (
                  <span className="text-gray-400 font-semibold"> ({draft.language})</span>
                )}
              </p>

              {isMovie && (draft.certificate || draft.language || (draft.formats && draft.formats.length > 0)) && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {draft.certificate && (
                    <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md border border-gray-200 text-gray-500">
                      {draft.certificate}
                    </span>
                  )}
                  {draft.formats?.map((f) => (
                    <span key={f} className="text-[10.5px] font-bold px-2 py-0.5 rounded-md" style={{ background: "rgba(16,101,121,0.06)", color: ACCENT }}>
                      {f}
                    </span>
                  ))}
                  {draft.language && (
                    <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md border border-gray-200 text-gray-500">
                      {draft.language}
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-1.5 mt-2.5">
                <p className="text-[12.5px] text-gray-500 flex items-center gap-1.5">
                  <MapPin size={12} style={{ color: ACCENT, flexShrink: 0 }} />
                  <span className="truncate">{draft.venueName}</span>
                </p>
                <p className="text-[12.5px] text-gray-500 flex items-center gap-1.5">
                  <Calendar size={12} style={{ flexShrink: 0 }} /> {fmtDate(draft.date)}
                </p>
                <p className="text-[12.5px] text-gray-500 flex items-center gap-1.5">
                  <Clock size={12} style={{ flexShrink: 0 }} /> {fmt12(draft.time)}
                  {draft.venueSub && <span className="text-gray-400">· {draft.venueSub}</span>}
                </p>
              </div>

              {isMovie ? (
                <div className="flex flex-wrap gap-2 mt-3">
                  {draft.seats.map((s) => (
                    <span key={s.id} className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ background: "rgba(16,101,121,0.07)", color: ACCENT }}>
                      {s.id} · {s.category}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-3">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ background: "rgba(16,101,121,0.07)", color: ACCENT }}>
                    {draft.ticketTypeName} × {draft.quantity}
                  </span>
                </div>
              )}
            </div>
          </div>

          <OffersDrawer
            type={isMovie ? "movies" : "events"}
            id={draft.itemId}
            genre={draft.genre}
            amount={subtotal}
            appliedOffer={appliedOffer}
            onApply={setAppliedOffer}
            onRemove={() => setAppliedOffer(null)}
          />
        </div>

        {/* ── RIGHT: payment summary, user details, T&Cs ──
            order-2 keeps this after the movie details + offers on every
            breakpoint (mobile now matches the requested Movie Details →
            Offers → Payment Summary → Your Details → T&Cs order). On
            desktop it sits in its usual right column and stays pinned in
            view (lg:sticky) while the left column scrolls underneath. */}
        <div className="order-2 min-w-0 lg:sticky lg:top-[112px] lg:flex lg:flex-col lg:max-h-[calc(100vh-128px)]">
        <div className="space-y-4 min-w-0 lg:overflow-y-auto lg:pr-0.5" style={{ scrollbarWidth: "thin" }}>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
            <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mb-3">Payment summary</p>

            {/* Order amount — collapsible: tap the chevron to see the
                per-seat / per-ticket-type breakdown and any offer discount. */}
            <button
              type="button"
              onClick={() => setOrderAmountOpen((p) => !p)}
              className="w-full flex items-center justify-between py-2"
            >
              <span className="text-[13.5px] font-semibold text-gray-700 flex items-center gap-1.5">
                Order amount
                <ChevronDown
                  size={13}
                  className="text-gray-400 transition-transform"
                  style={{ transform: orderAmountOpen ? "rotate(180deg)" : "none" }}
                />
              </span>
              <span className="text-[13.5px] font-bold text-gray-900">₹{subtotal.toLocaleString("en-IN")}</span>
            </button>
            {orderAmountOpen && (
              <div className="pb-2 pl-0.5">
                {isMovie ? (
                  ["Recliner", "Premium", "Classic"].map((cat) => {
                    const cs = draft.seats.filter((s) => s.category === cat);
                    if (!cs.length) return null;
                    return (
                      <div key={cat} className="flex items-center justify-between mb-2">
                        <span className="text-[13px] text-gray-500">{cat} × {cs.length}</span>
                        <span className="text-[13px] font-semibold text-gray-700">₹{cs.reduce((s, x) => s + x.price, 0)}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] text-gray-500">{draft.ticketTypeName} × {draft.quantity}</span>
                    <span className="text-[13px] font-semibold text-gray-700">₹{subtotal}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-semibold" style={{ color: "#16a34a" }}>Offer discount</span>
                    <span className="text-[12px] font-semibold" style={{ color: "#16a34a" }}>−₹{discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-gray-100" />

            {/* Booking charge — collapsible: tap the chevron to see what it covers. */}
            <button
              type="button"
              onClick={() => setBookingChargeOpen((p) => !p)}
              className="w-full flex items-center justify-between py-2"
            >
              <span className="text-[13.5px] font-semibold text-gray-700 flex items-center gap-1.5">
                Booking charge (incl. of GST)
                <ChevronDown
                  size={13}
                  className="text-gray-400 transition-transform"
                  style={{ transform: bookingChargeOpen ? "rotate(180deg)" : "none" }}
                />
              </span>
              <span className="text-[13.5px] font-bold text-gray-900">₹{convFee.toLocaleString("en-IN")}</span>
            </button>
            {bookingChargeOpen && (
              <div className="pb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-gray-400">Convenience fee (2%)</span>
                  <span className="text-[12px] text-gray-400">₹{convFee.toLocaleString("en-IN")}</span>
                </div>
                <p className="text-[11px] text-gray-300">Covers payment gateway and platform charges.</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
              <span className="text-[14px] font-bold text-gray-900">To be paid</span>
              <span className="text-[22px] font-black" style={{ color: ACCENT, letterSpacing: "-0.5px" }}>
                ₹{total.toLocaleString("en-IN")}
              </span>
            </div>

            {orderError && (
              <p className="text-[11.5px] font-medium mt-2 flex items-center gap-1.5" style={{ color: ACCENT }}>
                <AlertCircle size={12} /> {orderError}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">Your details</p>
              <button
                onClick={() => navigate("/settings")}
                className="text-[11.5px] font-bold underline-offset-2 hover:underline"
                style={{ color: ACCENT }}
              >
                Edit
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16,101,121,0.08)" }}>
                <User size={15} style={{ color: ACCENT }} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-gray-900 truncate">{user?.username || "Guest"}</p>
                {user?.phone && <p className="text-[11.5px] text-gray-400 truncate">{user.phone}</p>}
                <p className="text-[11.5px] text-gray-400 truncate">{user?.email || ""}</p>
              </div>
            </div>
            <p className="text-[11px] text-gray-300 mt-2.5">Tickets will be sent to this email address.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
            <button
              type="button"
              onClick={() => setTncOpen((p) => !p)}
              className="w-full flex items-center justify-between gap-1.5"
            >
              <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck size={12} /> Terms &amp; Conditions
              </span>
              <ChevronDown
                size={13}
                className="text-gray-300 transition-transform"
                style={{ transform: tncOpen ? "rotate(180deg)" : "none" }}
              />
            </button>
            {tncOpen && (
              <ul className="text-[11.5px] text-gray-400 space-y-1 list-disc pl-4 mt-2.5">
                <li>Tickets once booked cannot be exchanged or refunded.</li>
                <li>Please carry a valid ID proof to the venue.</li>
                <li>Convenience fee is non-refundable.</li>
              </ul>
            )}
          </div>
        </div>

          {/* Desktop CTA — pinned outside the scrollable summary column so
              it's always visible without scrolling. Mobile gets a fixed
              sticky bar below instead. */}
          <div className="hidden lg:flex items-center justify-between rounded-2xl px-5 py-3.5 mt-3 flex-shrink-0" style={{ background: ACCENT }}>
            <div>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Total</p>
              <p className="text-[19px] font-black text-white">₹{total.toLocaleString("en-IN")}</p>
            </div>
            <button
              onClick={() => setPaymentPopupOpen(true)}
              disabled={loadingOrder || paying || !orderData}
              className="px-6 py-3 rounded-xl text-[14px] font-black flex items-center gap-2 disabled:opacity-60 bg-white"
              style={{ color: ACCENT }}
            >
              {loadingOrder ? (
                <><Loader2 size={15} className="animate-spin" /> Preparing…</>
              ) : paying ? (
                <><Loader2 size={15} className="animate-spin" /> Processing…</>
              ) : (
                <><Ticket size={15} /> Pay now</>
              )}
            </button>
          </div>
          <p className="hidden lg:flex items-center justify-center gap-1 text-[11px] text-gray-300 mt-2 flex-shrink-0">
            <Info size={9} /> Secured by Razorpay · 100% safe &amp; encrypted
          </p>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="now-checkout-bar fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3 z-40 lg:hidden" style={{ boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
          <p className="text-[18px] font-extrabold text-gray-900">₹{total.toLocaleString("en-IN")}</p>
        </div>
        <button
          onClick={() => setPaymentPopupOpen(true)}
          disabled={loadingOrder || paying || !orderData}
          className="px-6 py-3 rounded-xl font-black text-[13px] text-white flex items-center gap-2 disabled:opacity-60"
          style={{ background: ACCENT }}
        >
          {loadingOrder || paying ? <Loader2 size={15} className="animate-spin" /> : <Ticket size={15} />}
          {loadingOrder ? "Preparing…" : paying ? "Processing…" : "Pay now"}
        </button>
      </div>

      {paymentPopupOpen && (
        <PaymentMethodPopup
          orderData={orderData}
          quickPay={quickPay}
          payMethod={payMethod}
          setPayMethod={setPayMethod}
          total={total}
          paying={paying}
          onClose={() => setPaymentPopupOpen(false)}
          onConfirm={handleConfirm}
        />
      )}

      {toast && (
        <div
          className="fixed bottom-28 lg:bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-xl text-[13px] font-semibold w-max max-w-[calc(100%-2rem)] shadow-lg"
          style={{
            background: toast.type === "error" ? "#fff1f2" : "#f0fdf4",
            color: toast.type === "error" ? "#dc2626" : "#16a34a",
            border: `1px solid ${toast.type === "error" ? "#fecdd3" : "#bbf7d0"}`,
          }}
        >
          {toast.type === "error" ? <AlertCircle size={15} className="shrink-0" /> : <CheckCircle2 size={15} className="shrink-0" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

/**
 * Payment method popup — opened by the "Pay now" CTA instead of showing
 * payment options inline on the summary page. Methods are grouped by
 * category (Razorpay checkout, NOW Wallet, Scan & Pay via UPI apps).
 * "Scan QR" and "Card / UPI / Net Banking" both route through the same
 * Razorpay order — Razorpay's own checkout surfaces a UPI QR code there —
 * this popup just gives the user a direct, familiar shortcut to it.
 */
function PaymentMethodPopup({ orderData, quickPay, payMethod, setPayMethod, total, paying, onClose, onConfirm }) {
  const walletBalance  = orderData?.wallet?.balance ?? quickPay?.walletBalance ?? 0;
  const walletEligible = !!orderData?.wallet?.eligible;


  return (
    <Dialog variant="sheet" label="Choose payment method" onDismiss={onClose}>
      <div className="flex max-h-[87dvh] flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <p className="text-[15px] font-extrabold text-gray-900">Choose payment method</p>
            <p className="text-[11.5px] text-gray-400 mt-0.5">To be paid: ₹{total.toLocaleString("en-IN")}</p>
          </div>
          <button aria-label="Close payment methods" onClick={onClose} className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-50 flex-shrink-0">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5" style={{ scrollbarWidth: "thin" }}>
          {/* Razorpay */}
          <div>
            <p className="text-[10.5px] font-bold text-gray-300 uppercase tracking-widest mb-2">Razorpay</p>
            <PaymentOption
              active={payMethod === "razorpay"}
              icon={<CreditCard size={16} style={{ color: payMethod === "razorpay" ? ACCENT : "#9ca3af" }} />}
              title="Card / UPI / Net Banking"
              sub="Powered by Razorpay · Secure checkout"
              onClick={() => setPayMethod("razorpay")}
            />
          </div>

          {/* NOW Wallet */}
          <div>
            <p className="text-[10.5px] font-bold text-gray-300 uppercase tracking-widest mb-2">NOW Wallet</p>
            <PaymentOption
              active={payMethod === "wallet"}
              disabled={!walletEligible}
              icon={<Wallet size={16} style={{ color: payMethod === "wallet" ? ACCENT : "#9ca3af" }} />}
              title="NOW Wallet"
              sub={
                walletEligible
                  ? `Balance: ₹${walletBalance.toLocaleString("en-IN")}`
                  : `Balance: ₹${walletBalance.toLocaleString("en-IN")} · Insufficient balance`
              }
              onClick={() => walletEligible && setPayMethod("wallet")}
            />
          </div>

          {/* Scan & Pay */}
          <div>
            <p className="text-[10.5px] font-bold text-gray-300 uppercase tracking-widest mb-2">Scan &amp; Pay</p>
            <PaymentOption
              active={payMethod === "qr"}
              icon={<QrCode size={16} style={{ color: payMethod === "qr" ? ACCENT : "#9ca3af" }} />}
              title="Scan QR — GPay, PhonePe, Paytm"
              sub="Scan with any UPI app from the Razorpay checkout"
              onClick={() => setPayMethod("qr")}
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={() => onConfirm()}
            disabled={paying || (payMethod === "wallet" && !walletEligible)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-black text-white disabled:opacity-60"
            style={{ background: ACCENT }}
          >
            {paying ? <Loader2 size={15} className="animate-spin" /> : <Ticket size={15} />}
            {paying ? "Processing…" : `Pay ₹${total.toLocaleString("en-IN")}`}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function PaymentOption({ active, disabled, icon, title, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className="w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all disabled:cursor-not-allowed"
      style={{
        borderColor: active ? ACCENT : "#e4e4e7",
        background:  active ? "rgba(16,101,121,0.04)" : "#fafafa",
        opacity:     disabled ? 0.45 : 1,
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: active ? "rgba(16,101,121,0.1)" : "#f3f4f6" }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-gray-900">{title}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {active && <CheckCircle size={16} style={{ color: ACCENT, flexShrink: 0 }} />}
    </button>
  );
}
