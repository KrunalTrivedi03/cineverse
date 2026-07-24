import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import { useRazorpay } from "../hooks/useRazorpay";
import {
  ChevronLeft,
  MapPin,
  Clock,
  Ticket,
  X,
  Info,
  Monitor,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Timer,
  Film,
  Calendar,
  Wallet,
  CreditCard,
  CheckCircle,
  IndianRupee,
} from "lucide-react";

const IMG = (path) => !path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;
const BASE = import.meta.env.VITE_API_URL;
const LOCK_SECONDS = 5 * 60;
const MAX_SEATS = 10;

const CAT = {
  Recliner: {
    color: "#7c3aed",
    light: "rgba(124,58,237,0.08)",
    border: "rgba(124,58,237,0.25)",
    glow: "rgba(124,58,237,0.2)",
    pillText: "#5b21b6",
  },
  Premium: {
    color: "#f0545c",
    light: "rgba(240,84,92,0.07)",
    border: "rgba(240,84,92,0.22)",
    glow: "rgba(240,84,92,0.18)",
    pillText: "#be123c",
  },
  Classic: {
    color: "#059669",
    light: "rgba(5,150,105,0.07)",
    border: "rgba(5,150,105,0.22)",
    glow: "rgba(5,150,105,0.18)",
    pillText: "#065f46",
  },
};

const PRICE_ADD = { Classic: 0, Premium: 100, Recliner: 200 };

const CAT_STATUS = {
  Classic: { label: "Available", cls: "text-emerald-500" },
  Premium: { label: "Filling fast", cls: "text-amber-500" },
  Recliner: { label: "Almost full", cls: "text-red-500" },
};

const fmt12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${(h % 12 || 12).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
};
const fmtCountdown = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const getSocketUserId = () => {
  let uid = localStorage.getItem("cvUserId");
  if (!uid) {
    uid = `u_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("cvUserId", uid);
  }
  return uid;
};
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("userInfo") || "null");
  } catch {
    return null;
  }
};

function buildCategories(layout, basePrice) {
  const map = {};
  (layout || []).forEach(({ category, seats }) => {
    if (!map[category])
      map[category] = {
        totalSeats: 0,
        price: basePrice + (PRICE_ADD[category] || 0),
      };
    map[category].totalSeats += seats;
  });
  return Object.entries(map).map(([name, d]) => ({
    name,
    price: d.price,
    totalSeats: d.totalSeats,
  }));
}

function SeatCountSelector({ max, onSelect, layoutData }) {
  const categories = buildCategories(
    layoutData?.layout,
    layoutData?.basePrice || 0,
  );
  const [count, setCount] = useState(1);
  const [selectedCat, setSelectedCat] = useState(categories[0]?.name);

  const visibleSeats = Math.min(count, 6);
  const extraSeats = count > 6 ? count - 6 : 0;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}
    >
      <div className="bg-white rounded-[20px] w-full max-w-[420px] overflow-hidden shadow-2xl">
        <div className="flex justify-center pt-[18px]">
          <div
            className="flex items-center gap-1.5 px-4 py-[5px] rounded-full text-[13px] font-medium"
            style={{
              border: "1px solid #f8c6c8",
              color: "#c0373e",
              background: "#fff5f5",
            }}
          >
            <div
              className="w-[7px] h-[7px] rounded-full flex-shrink-0"
              style={{ background: "#f0545c" }}
            />
            CineVerse
          </div>
        </div>

        <h2
          className="text-[20px] sm:text-[24px] font-extrabold text-center text-gray-900 mt-3.5 mb-4 px-6"
          style={{ letterSpacing: "-0.3px" }}
        >
          How many seats?
        </h2>

        <div className="flex gap-[5px] sm:gap-[7px] px-4 sm:px-6 justify-center flex-wrap">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-xl flex items-center justify-center text-[13px] sm:text-[14px] transition-all flex-shrink-0"
              style={{
                border:
                  count === n ? "2px solid #f0545c" : "1.5px solid #e5e7eb",
                background: count === n ? "#f0545c" : "#fff",
                color: count === n ? "#fff" : "#111",
                fontWeight: count === n ? 700 : 500,
              }}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2.5 py-3.5 px-6">
          <div className="flex gap-1 items-end">
            {Array.from({ length: visibleSeats }).map((_, i) => (
              <div
                key={i}
                className="relative flex-shrink-0"
                style={{
                  width: "20px",
                  height: "24px",
                  background: "#f8c5c7",
                  borderRadius: "5px 5px 3px 3px",
                }}
              >
                <div
                  className="absolute left-[2px] right-[2px]"
                  style={{
                    bottom: "-4px",
                    height: "4px",
                    background: "#f4a5a8",
                    borderRadius: "0 0 4px 4px",
                  }}
                />
              </div>
            ))}
            {extraSeats > 0 && (
              <span className="text-[11px] text-gray-400 self-center ml-1">
                +{extraSeats} more
              </span>
            )}
          </div>
          <p className="text-[13px] sm:text-[14px] text-gray-500">
            <span className="font-semibold text-gray-900">{count}</span> seat
            {count !== 1 ? "s" : ""} selected
          </p>
        </div>

        <div className="border-t border-b border-gray-100 mb-4 overflow-x-auto">
          <div
            className="flex px-4 sm:px-6 py-3 gap-0"
            style={{ minWidth: "max-content", width: "100%" }}
          >
            {categories.map((cat, idx) => {
              const st = CAT_STATUS[cat.name] || {
                label: "Available",
                cls: "text-emerald-500",
              };
              return (
                <div
                  key={cat.name}
                  className="flex-1 min-w-[80px] sm:min-w-[90px] text-center py-2 px-1"
                  style={{
                    borderRight:
                      idx < categories.length - 1
                        ? "1px solid #f0f0f0"
                        : "none",
                  }}
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-gray-400 mb-1">
                    {cat.name}
                  </p>
                  <p className="text-[14px] sm:text-[16px] font-extrabold text-gray-900 leading-none">
                    ₹{cat.price}
                  </p>
                  <p className={`text-[10px] font-semibold mt-1 ${st.cls}`}>
                    {st.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-[18px]">
          <button
            onClick={() => onSelect(count)}
            className="w-full py-3 sm:py-3.5 rounded-xl text-[14px] sm:text-[15px] font-semibold flex items-center cursor-pointer justify-center gap-2 transition-all"
            style={{
              border: "1.5px solid #d1d5db",
              background: "#fff",
              color: "#111",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            <Ticket size={15} />
            Select {count} Seat{count !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodPicker({ wallet, payMethod, setPayMethod }) {
  return (
    <div className="px-5 py-4 border-t border-gray-100">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
        Payment Method
      </p>
      <div className="space-y-2">
        <button
          onClick={() => wallet?.eligible && setPayMethod("wallet")}
          className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
          style={{
            borderColor: payMethod === "wallet" ? "#f0545c" : "#e5e7eb",
            background:
              payMethod === "wallet" ? "rgba(240,84,92,0.04)" : "#fafafa",
            opacity: wallet?.eligible ? 1 : 0.45,
            cursor: wallet?.eligible ? "pointer" : "not-allowed",
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background:
                payMethod === "wallet" ? "rgba(240,84,92,0.1)" : "#f3f4f6",
            }}
          >
            <Wallet
              size={16}
              style={{ color: payMethod === "wallet" ? "#f0545c" : "#9ca3af" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-gray-900">
              CineVerse Wallet
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Balance: ₹{(wallet?.balance || 0).toLocaleString("en-IN")}
              {!wallet?.eligible && wallet?.balance !== undefined && (
                <span className="text-red-400 ml-1.5">
                  · Insufficient balance
                </span>
              )}
            </p>
          </div>
          {payMethod === "wallet" && wallet?.eligible && (
            <CheckCircle
              size={15}
              style={{ color: "#f0545c", flexShrink: 0 }}
            />
          )}
        </button>

        <button
          onClick={() => setPayMethod("razorpay")}
          className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
          style={{
            borderColor: payMethod === "razorpay" ? "#f0545c" : "#e5e7eb",
            background:
              payMethod === "razorpay" ? "rgba(240,84,92,0.04)" : "#fafafa",
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background:
                payMethod === "razorpay" ? "rgba(240,84,92,0.1)" : "#f3f4f6",
            }}
          >
            <CreditCard
              size={16}
              style={{
                color: payMethod === "razorpay" ? "#f0545c" : "#9ca3af",
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-gray-900">
              Card / UPI / Net Banking
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Powered by Razorpay · Secure checkout
            </p>
          </div>
          {payMethod === "razorpay" && (
            <CheckCircle
              size={15}
              style={{ color: "#f0545c", flexShrink: 0 }}
            />
          )}
        </button>
      </div>
    </div>
  );
}

export default function SeatSelection() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { movie, showId, slotId, screen, time, price, theatre, date } =
    location.state || {};

  const currentUser = getCurrentUser();
  const userId = useRef(currentUser?.id || getSocketUserId()).current;

  const [layoutData, setLayoutData] = useState(null);
  const [seats, setSeats] = useState({});
  const [selected, setSelected] = useState([]);
  const [targetCount, setTargetCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [toast, setToast] = useState(null);
  const [noLayout, setNoLayout] = useState(false);
  const [summaryStep, setSummaryStep] = useState(1);

  const [orderData, setOrderData] = useState(null);
  const [payMethod, setPayMethod] = useState("razorpay");
  const [paying, setPaying] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [quickPayData, setQuickPayData] = useState(null);

  const { initiatePayment, loading: paymentLoading } = useRazorpay();
  const socketRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!showId || !slotId || !movie) navigate("/");
  }, []);

  useEffect(() => {
    if (!showId || !slotId) return;
    setLoading(true);
    api
      .get(`/seats/layout/${showId}/${slotId}`)
      .then((res) => {
        setLayoutData(res.data);
        setSeats(res.data.seats);
      })
      .catch((err) => {
        if (err.response?.status === 400) setNoLayout(true);
        else showToast("Failed to load seats", "error");
      })
      .finally(() => setLoading(false));
  }, [showId, slotId]);

  useEffect(() => {
    if (!showSummary) return;
    const user = getCurrentUser();
    if (!user?.id) return;
    api
      .get("/quickpay")
      .then((r) => setQuickPayData(r.data))
      .catch(() => setQuickPayData(null));
  }, [showSummary]);

  useEffect(() => {
    if (!showId || !slotId) return;
    const socket = io(BASE, { query: { userId }, transports: ["websocket"] });
    socketRef.current = socket;
    socket.emit("join:show", { showId, slotId });
    socket.on("seat:locked", ({ seatId }) =>
      setSeats((p) =>
        !p[seatId] || p[seatId].status === "booked"
          ? p
          : { ...p, [seatId]: { ...p[seatId], status: "locked" } },
      ),
    );
    socket.on("seat:released", ({ seatId }) =>
      setSeats((p) =>
        !p[seatId] || p[seatId].status === "booked"
          ? p
          : { ...p, [seatId]: { ...p[seatId], status: "available" } },
      ),
    );
    socket.on("seats:released_bulk", ({ seatIds }) =>
      setSeats((p) => {
        const n = { ...p };
        seatIds.forEach((sid) => {
          if (n[sid] && n[sid].status !== "booked")
            n[sid] = { ...n[sid], status: "available" };
        });
        return n;
      }),
    );
    socket.on("seats:booked", ({ seatIds }) => {
      setSeats((p) => {
        const n = { ...p };
        seatIds.forEach((sid) => {
          if (n[sid]) n[sid] = { ...n[sid], status: "booked" };
        });
        return n;
      });
      setSelected((prev) => {
        const taken = prev.filter((s) => seatIds.includes(s));
        if (taken.length)
          showToast(`${taken.length} seat(s) just got booked`, "error");
        return prev.filter((s) => !seatIds.includes(s));
      });
    });
    return () => {
      socket.emit("leave:show", { showId, slotId });
      socket.disconnect();
    };
  }, [showId, slotId]);

  const startCountdown = useCallback(() => {
    clearInterval(timerRef.current);
    setCountdown(LOCK_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopCountdown = () => {
    clearInterval(timerRef.current);
    setCountdown(null);
  };
  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleExpired = async () => {
    showToast("Seat reservation expired. Please reselect.", "error");
    if (selected.length > 0) {
      await api
        .delete("/seats/lock", {
          data: { showId, slotId, seatIds: selected, userId },
        })
        .catch(() => {});
      selected.forEach((sid) =>
        socketRef.current?.emit("seat:deselect", {
          showId,
          slotId,
          seatId: sid,
        }),
      );
    }
    setSelected([]);
    setTargetCount(null);
    setOrderData(null);
    setSeats((p) => {
      const n = { ...p };
      Object.keys(n).forEach((sid) => {
        if (n[sid].status === "selected")
          n[sid] = { ...n[sid], status: "available" };
      });
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
      setSeats((p) => ({
        ...p,
        [seatId]: { ...p[seatId], status: "available" },
      }));
      socketRef.current?.emit("seat:deselect", { showId, slotId, seatId });
      if (selected.length === 1) stopCountdown();
    } else {
      if (targetCount && selected.length >= targetCount) {
        showToast(
          `You selected ${targetCount} seat${targetCount !== 1 ? "s" : ""}. Deselect one to swap.`,
          "error",
        );
        return;
      }
      if (selected.length >= MAX_SEATS) {
        showToast(`Max ${MAX_SEATS} seats per booking`, "error");
        return;
      }
      setSelected((p) => [...p, seatId]);
      setSeats((p) => ({
        ...p,
        [seatId]: { ...p[seatId], status: "selected" },
      }));
      socketRef.current?.emit("seat:select", { showId, slotId, seatId });
      if (selected.length === 0) startCountdown();
    }
  };

  const handleProceed = async () => {
    if (!selected.length) return;
    const user = getCurrentUser();
    if (!user?.id) {
      showToast("Please log in to book tickets", "error");
      navigate("/login");
      return;
    }
    setLocking(true);
    try {
      await api.post("/seats/lock", {
        showId,
        slotId,
        seatIds: selected,
        userId,
      });
      startCountdown();
      setLoadingOrder(true);
      const { data } = await api.post("/payment/create-order", {
        showId,
        slotId,
        seatIds: selected,
      });
      setOrderData(data);
      setPayMethod(data.wallet?.eligible ? "wallet" : "razorpay");
      setSummaryStep(1); // ✅ always reset to step 1 when opening
      setShowSummary(true);
    } catch (err) {
      const conflict =
        err.response?.data?.unavailableSeats ||
        err.response?.data?.expiredSeats ||
        [];
      if (conflict.length) {
        showToast(
          `Seats ${conflict.join(", ")} just got taken. Please reselect.`,
          "error",
        );
        setSelected((p) => p.filter((s) => !conflict.includes(s)));
        setSeats((p) => {
          const n = { ...p };
          conflict.forEach((sid) => {
            n[sid] = { ...n[sid], status: "locked" };
          });
          return n;
        });
      } else {
        showToast(err.response?.data?.message || "Failed to proceed", "error");
      }
    } finally {
      setLocking(false);
      setLoadingOrder(false);
    }
  };

  const handleConfirm = async () => {
    const user = getCurrentUser();
    if (!user?.id) {
      showToast("Please log in to continue", "error");
      navigate("/login");
      return;
    }

    if (payMethod === "wallet") {
      setPaying(true);
      try {
        const { data } = await api.post("/payment/wallet-pay", {
          showId,
          slotId,
          seatIds: selected,
        });
        socketRef.current?.emit("booking:confirmed", {
          showId,
          slotId,
          seatIds: selected,
        });
        stopCountdown();
        navigate("/booking/success", {
          state: { booking: data.booking, movie, theatre },
        });
      } catch (err) {
        showToast(
          err.response?.data?.message ||
            "Wallet payment failed. Try another method.",
          "error",
        );
        setPayMethod("razorpay");
      } finally {
        setPaying(false);
      }
    } else if (payMethod.startsWith("card_") || payMethod.startsWith("upi_")) {
      // Saved card / UPI — still processed via Razorpay
      if (!orderData) return;
      setShowSummary(false);
      initiatePayment({
        showId,
        slotId,
        seatIds: selected,
        existingOrder: {
          orderId: orderData.orderId,
          amount: orderData.amount,
          currency: orderData.currency,
          keyId: orderData.keyId,
          bookingId: orderData.bookingId,
        },
        userDetails: {
          name: user.username || "",
          email: user.email || "",
          contact: user.phone || "",
        },
        onSuccess: (bookingRef, booking) => {
          socketRef.current?.emit("booking:confirmed", {
            showId,
            slotId,
            seatIds: selected,
          });
          stopCountdown();
          navigate("/booking/success", { state: { booking, movie, theatre } });
        },
        onFailure: (reason) => {
          setShowSummary(true);
          showToast(reason || "Payment failed. Please try again.", "error");
        },
      });
    } else {
      // Razorpay default
      if (!orderData) return;
      setShowSummary(false);
      initiatePayment({
        showId,
        slotId,
        seatIds: selected,
        existingOrder: {
          orderId: orderData.orderId,
          amount: orderData.amount,
          currency: orderData.currency,
          keyId: orderData.keyId,
          bookingId: orderData.bookingId,
        },
        userDetails: {
          name: user.username || "",
          email: user.email || "",
          contact: user.phone || "",
        },
        onSuccess: (bookingRef, booking) => {
          socketRef.current?.emit("booking:confirmed", {
            showId,
            slotId,
            seatIds: selected,
          });
          stopCountdown();
          navigate("/booking/success", { state: { booking, movie, theatre } });
        },
        onFailure: (reason) => {
          setShowSummary(true);
          showToast(reason || "Payment failed. Please try again.", "error");
        },
      });
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const basePrice = layoutData?.basePrice || price || 0;
  const selectedSeats = selected
    .map((sid) => {
      const s = seats[sid];
      return s
        ? {
            id: sid,
            row: s.row,
            col: s.col,
            category: s.category,
            price: basePrice + (s.priceAdd || 0),
          }
        : null;
    })
    .filter(Boolean);
  const totalAmount = selectedSeats.reduce((s, x) => s + x.price, 0);
  const convFee = selected.length ? Math.round(totalAmount * 0.02) : 0;
  const grandTotal = totalAmount + convFee;
  const layoutByCategory = (layoutData?.layout || []).reduce((acc, row) => {
    (acc[row.category] = acc[row.category] || []).push(row);
    return acc;
  }, {});
  const urgentCountdown = countdown !== null && countdown < 60;
  const isProcessingPayment = paying || paymentLoading || loadingOrder;

  if (!movie || !showId) return null;

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        .seat-btn { transition: all 0.13s ease; }
        .seat-btn:hover:not(:disabled) { transform: translateY(-2px) scale(1.08); }
        .seat-btn.selected { transform: translateY(-2px) scale(1.06); }
        .seat-btn:active:not(:disabled) { transform: scale(0.94); }
        @keyframes pulse-urgent { 0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.35); } 50% { box-shadow: 0 0 0 6px rgba(220,38,38,0); } }
        .countdown-urgent { animation: pulse-urgent 1s ease-in-out infinite; }
        @keyframes slide-up { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .slide-up { animation: slide-up 0.25s ease forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .fade-in { animation: fade-in 0.3s ease forwards; }
      `}</style>

      <Navbar />

      {/* ── Seat Count Selector — shown after layout loads, before seats are picked ── */}
      {!loading && layoutData && targetCount === null && (
        <SeatCountSelector
          max={MAX_SEATS}
          onSelect={setTargetCount}
          layoutData={layoutData}
        />
      )}

      {/* Top bar */}
      <div
        className="sticky top-[60px] z-40 bg-white"
        style={{
          borderBottom: "1px solid #f0f0f0",
          boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
        }}
      >
        <div className="max-w-5xl mx-auto px-3 md:px-8 py-2.5 flex items-center gap-2 md:gap-3">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
          >
            <ChevronLeft size={15} />
          </button>

          {/* Poster — hidden on very small screens */}
          {movie.poster && (
            <img
              src={IMG(movie.poster)}
              alt={movie.title}
              className="hidden sm:block w-8 h-11 md:w-9 md:h-12 object-cover rounded-lg flex-shrink-0 shadow-sm"
            />
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] md:text-[14px] font-bold text-gray-900 truncate">
              {movie.title}
            </p>

            {/* Mobile: compact single line */}
            <div className="flex md:hidden items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[10px] text-gray-400 flex items-center gap-0.5 truncate max-w-[140px]">
                <MapPin size={8} style={{ color: "#f0545c", flexShrink: 0 }} />
                {theatre?.name}
              </span>
              <span className="text-gray-200 text-[9px]">·</span>
              <span className="text-[10px] text-gray-400 flex items-center gap-0.5 flex-shrink-0">
                <Clock size={8} /> {fmt12(time)}
              </span>
              {screen && (
                <span
                  className="flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: "rgba(240,84,92,0.08)",
                    color: "#f0545c",
                    border: "1px solid rgba(240,84,92,0.2)",
                  }}
                >
                  <Monitor size={7} /> {screen}
                </span>
              )}
            </div>

            {/* Desktop: full meta row */}
            <div className="hidden md:flex items-center gap-2 flex-wrap mt-0.5">
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <MapPin size={9} style={{ color: "#f0545c" }} /> {theatre?.name}
              </span>
              <span className="text-gray-200">·</span>
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Calendar size={9} /> {fmtDate(date)}
              </span>
              <span className="text-gray-200">·</span>
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Clock size={9} /> {fmt12(time)}
              </span>
              {screen && (
                <span
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(240,84,92,0.08)",
                    color: "#f0545c",
                    border: "1px solid rgba(240,84,92,0.2)",
                  }}
                >
                  <Monitor size={8} /> {screen}
                </span>
              )}
            </div>
          </div>

          {/* Countdown */}
          {countdown !== null && countdown > 0 && (
            <div
              className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-xl text-[11px] md:text-[12px] font-bold flex-shrink-0 ${urgentCountdown ? "countdown-urgent" : ""}`}
              style={{
                background: urgentCountdown
                  ? "#fff1f2"
                  : "rgba(240,84,92,0.07)",
                border: `1px solid ${urgentCountdown ? "#fecdd3" : "rgba(240,84,92,0.2)"}`,
                color: urgentCountdown ? "#dc2626" : "#f0545c",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              <Timer size={11} /> {fmtCountdown(countdown)}
            </div>
          )}

          {/* Seat count badge */}
          {targetCount !== null && (
            <button
              onClick={handleExpired}
              title="Change seat count"
              className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-xl text-[11px] md:text-[12px] font-semibold flex-shrink-0 transition-all border"
              style={{
                background: "rgba(240,84,92,0.06)",
                borderColor: "rgba(240,84,92,0.2)",
                color: "#f0545c",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(240,84,92,0.12)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(240,84,92,0.06)")
              }
            >
              <Ticket size={11} />
              <span className="hidden sm:inline">
                {selected.length}/{targetCount}
              </span>
              <span className="sm:hidden">{selected.length}</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 pb-40 fade-in">
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center relative"
              style={{
                background: "rgba(240,84,92,0.07)",
                border: "1.5px solid rgba(240,84,92,0.15)",
              }}
            >
              <Film size={24} style={{ color: "#f0545c" }} />
              <Loader2
                size={13}
                className="animate-spin absolute -bottom-1 -right-1"
                style={{ color: "#f0545c" }}
              />
            </div>
            <p className="text-[14px] text-gray-400 font-medium">
              Loading seats…
            </p>
          </div>
        )}

        {!loading && noLayout && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
              style={{
                background: "rgba(240,84,92,0.06)",
                border: "1.5px solid rgba(240,84,92,0.12)",
              }}
            >
              <Monitor size={30} style={{ color: "rgba(240,84,92,0.4)" }} />
            </div>
            <p className="text-[17px] font-bold text-gray-400">
              Seat layout not configured
            </p>
            <p className="text-[13px] text-gray-400 mt-2">
              The admin hasn't set up the seating layout for this screen yet.
            </p>
          </div>
        )}

        {!loading && layoutData && targetCount !== null && (
          <div className="slide-up">
            <div className="flex flex-col items-center mb-12 mt-2">
              <div
                style={{
                  width: "55%",
                  height: "4px",
                  background:
                    "linear-gradient(to right, transparent, rgba(240,84,92,0.5), transparent)",
                  borderRadius: "0 0 60% 60%",
                  boxShadow: "0 6px 20px rgba(240,84,92,0.1)",
                }}
              />
              <p className="text-[10px] font-bold tracking-[0.25em] uppercase mt-3 text-gray-400 flex items-center gap-1.5">
                <Monitor size={10} className="text-gray-300" /> SCREEN THIS SIDE
              </p>
            </div>

            <div className="space-y-10">
              {["Classic", "Premium", "Recliner"].map((cat, catIdx) => {
                const rows = layoutByCategory[cat];
                if (!rows?.length) return null;
                const c = CAT[cat];
                const catPrice = basePrice + (PRICE_ADD[cat] || 0);
                const getAisleBreaks = (count) =>
                  count <= 6 ? [] : count <= 10 ? [3] : [3, count - 3];
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="h-px flex-1 bg-gray-100" />
                      <div
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                        style={{
                          background: c.light,
                          border: `1px solid ${c.border}`,
                        }}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: c.color }}
                        />
                        <span
                          className="text-[12px] font-bold"
                          style={{ color: c.color }}
                        >
                          {cat}
                        </span>
                        <span
                          className="text-[11px] font-semibold"
                          style={{ color: c.pillText, opacity: 0.7 }}
                        >
                          ₹{catPrice}
                        </span>
                      </div>
                      <div className="h-px flex-1 bg-gray-100" />
                    </div>
                    <div className="space-y-2 overflow-x-auto pb-2">
                      {rows.map(({ row, seats: count }) => {
                        const aisleBreaks = getAisleBreaks(count);
                        return (
                          <div
                            key={row}
                            className="flex items-center gap-3 min-w-max"
                          >
                            <span
                              className="w-5 text-[10px] font-bold text-gray-300 text-center flex-shrink-0"
                              style={{ fontFamily: "'DM Mono', monospace" }}
                            >
                              {row}
                            </span>
                            <div className="w-3" />
                            <div className="flex gap-1.5 items-center">
                              {Array.from(
                                { length: count },
                                (_, i) => i + 1,
                              ).map((col) => {
                                const sid = `${row}${col}`;
                                const seat = seats[sid];
                                const isSel = seat?.status === "selected";
                                const isBkd = seat?.status === "booked";
                                const isLkd = seat?.status === "locked";
                                const atMax =
                                  targetCount && selected.length >= targetCount;
                                let bg, border, color, opacity, shadow;
                                if (!seat) {
                                  bg = "transparent";
                                  border = "transparent";
                                  color = "transparent";
                                  opacity = 0;
                                  shadow = "none";
                                } else if (isBkd) {
                                  bg = "#f3f4f6";
                                  border = "#e5e7eb";
                                  color = "#d1d5db";
                                  opacity = 1;
                                  shadow = "none";
                                } else if (isLkd) {
                                  bg = "#fef9c3";
                                  border = "#fde047";
                                  color = "#a16207";
                                  opacity = 1;
                                  shadow = "none";
                                } else if (isSel) {
                                  bg = c.color;
                                  border = c.color;
                                  color = "#fff";
                                  opacity = 1;
                                  shadow = `0 4px 12px ${c.glow}`;
                                } else if (atMax) {
                                  bg = "#f9fafb";
                                  border = "#e5e7eb";
                                  color = "#d1d5db";
                                  opacity = 0.55;
                                  shadow = "none";
                                } else {
                                  bg = "#fff";
                                  border = "#e5e7eb";
                                  color = "#374151";
                                  opacity = 1;
                                  shadow = "none";
                                }
                                return (
                                  <div key={sid} className="flex items-center">
                                    {aisleBreaks.includes(col - 1) &&
                                      col > 1 && (
                                        <div
                                          className="flex flex-col items-center justify-center mx-2 select-none"
                                          style={{ width: "18px" }}
                                        >
                                          <div
                                            className="w-0.5 h-4 rounded-full"
                                            style={{ background: "#e5e7eb" }}
                                          />
                                          <span
                                            className="text-[8px] font-bold mt-0.5 rotate-90 whitespace-nowrap"
                                            style={{
                                              color: "#d1d5db",
                                              letterSpacing: "0.1em",
                                            }}
                                          >
                                            ↕
                                          </span>
                                          <div
                                            className="w-0.5 h-4 rounded-full"
                                            style={{ background: "#e5e7eb" }}
                                          />
                                        </div>
                                      )}
                                    <button
                                      onClick={() => toggleSeat(sid)}
                                      disabled={
                                        !seat ||
                                        isBkd ||
                                        isLkd ||
                                        (atMax && !isSel)
                                      }
                                      title={
                                        isBkd
                                          ? "Booked"
                                          : isLkd
                                            ? "Being selected"
                                            : `${sid} · ₹${catPrice}`
                                      }
                                      className={`seat-btn w-8 h-8 rounded-lg text-[10px] font-bold flex items-center justify-center select-none border ${isSel ? "selected" : ""}`}
                                      style={{
                                        background: bg,
                                        borderColor: border,
                                        color,
                                        opacity,
                                        cursor:
                                          !seat ||
                                          isBkd ||
                                          isLkd ||
                                          (atMax && !isSel)
                                            ? "not-allowed"
                                            : "pointer",
                                        boxShadow: shadow,
                                        fontFamily: "'DM Mono', monospace",
                                      }}
                                      onMouseEnter={(e) => {
                                        if (
                                          seat &&
                                          !isBkd &&
                                          !isLkd &&
                                          !isSel &&
                                          !(atMax && !isSel)
                                        ) {
                                          e.currentTarget.style.borderColor =
                                            c.color;
                                          e.currentTarget.style.background =
                                            c.light;
                                          e.currentTarget.style.color = c.color;
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (
                                          seat &&
                                          !isBkd &&
                                          !isLkd &&
                                          !isSel &&
                                          !(atMax && !isSel)
                                        ) {
                                          e.currentTarget.style.borderColor =
                                            "#e5e7eb";
                                          e.currentTarget.style.background =
                                            "#fff";
                                          e.currentTarget.style.color =
                                            "#374151";
                                        }
                                      }}
                                    >
                                      {!seat ? (
                                        ""
                                      ) : isBkd ? (
                                        <X size={9} />
                                      ) : isLkd ? (
                                        "~"
                                      ) : (
                                        col
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="w-3" />
                            <span
                              className="w-5 text-[10px] font-bold text-gray-300 text-center flex-shrink-0"
                              style={{ fontFamily: "'DM Mono', monospace" }}
                            >
                              {row}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {catIdx < 2 && (
                      <div className="flex items-center gap-3 mt-6">
                        <div
                          className="h-px flex-1"
                          style={{
                            background:
                              "repeating-linear-gradient(90deg, #e5e7eb 0, #e5e7eb 6px, transparent 6px, transparent 12px)",
                          }}
                        />
                        <div
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
                          style={{
                            background: "#f9fafb",
                            border: "1px solid #e5e7eb",
                            color: "#9ca3af",
                          }}
                        >
                          <span>▲</span> STAIRS <span>▲</span>
                        </div>
                        <div
                          className="h-px flex-1"
                          style={{
                            background:
                              "repeating-linear-gradient(90deg, #e5e7eb 0, #e5e7eb 6px, transparent 6px, transparent 12px)",
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-5 mt-12 pt-6 border-t border-gray-100">
              {[
                { bg: "#fff", border: "#e5e7eb", label: "Available" },
                {
                  bg: "#f3f4f6",
                  border: "#e5e7eb",
                  label: "Booked",
                  isBooked: true,
                },
                { bg: "#fef9c3", border: "#fde047", label: "Being selected" },
                ...["Classic", "Premium", "Recliner"].map((label) => {
                  const c = CAT[label];
                  return {
                    bg: c.color,
                    border: c.color,
                    label: `Selected (${label})`,
                  };
                }),
              ].map(({ bg, border, label, isBooked }) => (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-md border-2 flex items-center justify-center"
                    style={{
                      background: bg,
                      borderColor: border,
                      opacity: isBooked ? 0.6 : 1,
                    }}
                  >
                    {isBooked && <X size={8} className="text-gray-300" />}
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-center text-[11px] text-gray-300 mt-3 flex items-center justify-center gap-1.5">
              <Info size={10} /> Max {MAX_SEATS} seats · Reservation expires in{" "}
              {LOCK_SECONDS / 60} min
            </p>
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white"
        style={{
          borderTop: "1px solid #f0f0f0",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.07)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 md:py-4">
          {selected.length === 0 ? (
            <div className="flex items-center justify-center py-1">
              <p className="text-[13px] text-gray-400">
                {targetCount
                  ? `Select ${targetCount} seat${targetCount !== 1 ? "s" : ""} to continue`
                  : "Select seats to continue"}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              {/* Left — selected seat chips + summary */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {selectedSeats.map((s) => {
                    const c = CAT[s.category] || CAT.Classic;
                    return (
                      <span
                        key={s.id}
                        className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg"
                        style={{
                          background: c.light,
                          border: `1px solid ${c.border}`,
                          color: c.color,
                        }}
                      >
                        {s.id}
                        <button
                          onClick={() => toggleSeat(s.id)}
                          className="ml-0.5 hover:opacity-60 transition-opacity"
                        >
                          <X size={9} />
                        </button>
                      </span>
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-400">
                  {selected.length} seat{selected.length !== 1 ? "s" : ""}
                  <span className="mx-1 text-gray-300">·</span>₹
                  {totalAmount.toLocaleString("en-IN")}
                  <span className="mx-1 text-gray-300">+</span>₹
                  {convFee.toLocaleString("en-IN")} fee
                </p>
              </div>

              {/* Right — total + pay button */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Total — hidden on very small screens */}
                <div className="hidden sm:block text-right">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                    Total
                  </p>
                  <p
                    className="text-[20px] font-black text-gray-900 leading-none"
                    style={{ letterSpacing: "-0.5px" }}
                  >
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </p>
                </div>

                {/* Pay button */}
                <button
                  onClick={handleProceed}
                  disabled={
                    locking ||
                    loadingOrder ||
                    (targetCount !== null && selected.length < targetCount)
                  }
                  className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl text-[13px] sm:text-[14px] font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                  style={{
                    background: "#f0545c",
                    boxShadow: "0 4px 16px rgba(240,84,92,0.35)",
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled)
                      e.currentTarget.style.background = "#d94048";
                  }}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#f0545c")
                  }
                >
                  {locking || loadingOrder ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Ticket size={15} />
                  )}
                  <span>
                    {targetCount && selected.length < targetCount
                      ? `${targetCount - selected.length} more`
                      : locking
                        ? "Locking…"
                        : loadingOrder
                          ? "Loading…"
                          : `Pay ₹${grandTotal.toLocaleString("en-IN")}`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Booking Summary Modal ── */}
      {showSummary && (
        <div
          className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowSummary(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl slide-up flex flex-col"
            style={{ maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                {summaryStep === 2 && (
                  <button
                    onClick={() => setSummaryStep(1)}
                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all"
                  >
                    <ChevronLeft size={14} className="text-gray-500" />
                  </button>
                )}
                <p
                  className="text-[15px] font-extrabold text-gray-900"
                  style={{ letterSpacing: "-0.2px" }}
                >
                  {summaryStep === 1 ? "Booking Summary" : "Payment"}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                {/* Step indicator */}
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-1.5 rounded-full"
                    style={{ background: "#f0545c" }}
                  />
                  <div
                    className="w-5 h-1.5 rounded-full"
                    style={{
                      background: summaryStep === 2 ? "#f0545c" : "#e5e7eb",
                    }}
                  />
                </div>
                {countdown !== null && countdown > 0 && (
                  <span
                    className={`flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1.5 rounded-lg ${urgentCountdown ? "countdown-urgent" : ""}`}
                    style={{
                      background: urgentCountdown
                        ? "#fff1f2"
                        : "rgba(240,84,92,0.07)",
                      border: `1px solid ${urgentCountdown ? "#fecdd3" : "rgba(240,84,92,0.2)"}`,
                      color: urgentCountdown ? "#dc2626" : "#f0545c",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    <Timer size={11} /> {fmtCountdown(countdown)}
                  </span>
                )}
                <button
                  onClick={() => setShowSummary(false)}
                  className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all"
                >
                  <X size={13} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* ── STEP 1: Booking details ── */}
            {summaryStep === 1 && (
              <>
                <div
                  className="overflow-y-auto flex-1"
                  style={{ scrollbarWidth: "none" }}
                >
                  {/* Movie info */}
                  <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-50 border-b border-gray-100">
                    {movie.poster && (
                      <img
                        src={IMG(movie.poster)}
                        alt={movie.title}
                        className="w-12 h-[68px] object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p
                        className="text-[14px] font-extrabold text-gray-900 truncate"
                        style={{ letterSpacing: "-0.2px" }}
                      >
                        {movie.title}
                      </p>
                      <div className="flex flex-col gap-1 mt-1.5">
                        <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                          <MapPin
                            size={10}
                            style={{ color: "#f0545c", flexShrink: 0 }}
                          />
                          <span className="truncate">{theatre?.name}</span>
                        </p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                          <Calendar size={10} style={{ flexShrink: 0 }} />{" "}
                          {fmtDate(date)}
                        </p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                          <Clock size={10} style={{ flexShrink: 0 }} />{" "}
                          {fmt12(time)}
                          <span
                            className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{
                              background: "rgba(240,84,92,0.07)",
                              color: "#f0545c",
                            }}
                          >
                            <Monitor size={8} /> {screen}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Selected seats */}
                  <div className="px-5 py-3.5 border-b border-gray-100">
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-2.5">
                      Selected Seats
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSeats.map((s) => {
                        const c = CAT[s.category] || CAT.Classic;
                        return (
                          <div
                            key={s.id}
                            className="flex flex-col items-center px-3 py-2 rounded-xl"
                            style={{
                              background: c.light,
                              border: `1px solid ${c.border}`,
                            }}
                          >
                            <span
                              className="text-[13px] font-black"
                              style={{
                                color: c.color,
                                fontFamily: "'DM Mono', monospace",
                              }}
                            >
                              {s.id}
                            </span>
                            <span
                              className="text-[9px] font-semibold mt-0.5"
                              style={{ color: c.pillText }}
                            >
                              {s.category}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="px-5 py-3.5 space-y-2">
                    {["Recliner", "Premium", "Classic"].map((cat) => {
                      const cs = selectedSeats.filter(
                        (s) => s.category === cat,
                      );
                      if (!cs.length) return null;
                      const c = CAT[cat];
                      return (
                        <div
                          key={cat}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: c.color }}
                            />
                            <span className="text-[13px] text-gray-500">
                              {cat} × {cs.length}
                            </span>
                          </div>
                          <span className="text-[13px] font-semibold text-gray-700">
                            ₹{cs.reduce((s, x) => s + x.price, 0)}
                          </span>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-gray-400">
                        Convenience Fee (2%)
                      </span>
                      <span className="text-[12px] text-gray-400">
                        ₹{convFee}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                      <span className="text-[14px] font-bold text-gray-900">
                        Total Payable
                      </span>
                      <span
                        className="text-[22px] font-black"
                        style={{ color: "#f0545c", letterSpacing: "-0.5px" }}
                      >
                        ₹{grandTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 1 CTA */}
                <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
                  <button
                    onClick={() => setSummaryStep(2)}
                    className="w-full py-3.5 rounded-xl text-[15px] font-black text-white transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    style={{ background: "#f0545c" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#d94048")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#f0545c")
                    }
                  >
                    <Ticket size={16} /> Continue to Payment · ₹
                    {grandTotal.toLocaleString("en-IN")}
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 2: Payment ── */}
            {summaryStep === 2 && (
              <>
                <div
                  className="overflow-y-auto flex-1"
                  style={{ scrollbarWidth: "none" }}
                >
                  {/* Order summary pill */}
                  <div
                    className="mx-5 mt-4 mb-1 flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{
                      background: "#fafafa",
                      border: "1px solid #f3f4f6",
                    }}
                  >
                    <div>
                      <p className="text-[12px] font-bold text-gray-900">
                        {movie.title}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {selected.length} seat{selected.length !== 1 ? "s" : ""}{" "}
                        · {fmt12(time)} · {fmtDate(date)}
                      </p>
                    </div>
                    <span
                      className="text-[18px] font-black"
                      style={{ color: "#f0545c", letterSpacing: "-0.5px" }}
                    >
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Payment options */}
                  <div className="px-5 py-4 space-y-2.5">
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-3">
                      Choose Payment Method
                    </p>

                    {/* Wallet */}
                    <button
                      onClick={() =>
                        orderData?.wallet?.eligible && setPayMethod("wallet")
                      }
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left"
                      style={{
                        borderColor:
                          payMethod === "wallet" ? "#f0545c" : "#e5e7eb",
                        background:
                          payMethod === "wallet"
                            ? "rgba(240,84,92,0.04)"
                            : "#fafafa",
                        opacity: orderData?.wallet?.eligible ? 1 : 0.45,
                        cursor: orderData?.wallet?.eligible
                          ? "pointer"
                          : "not-allowed",
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background:
                            payMethod === "wallet"
                              ? "rgba(240,84,92,0.1)"
                              : "#f3f4f6",
                        }}
                      >
                        <Wallet
                          size={15}
                          style={{
                            color:
                              payMethod === "wallet" ? "#f0545c" : "#9ca3af",
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-gray-900">
                          CineVerse Wallet
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Balance: ₹
                          {(orderData?.wallet?.balance || 0).toLocaleString(
                            "en-IN",
                          )}
                          {!orderData?.wallet?.eligible &&
                            orderData?.wallet?.balance !== undefined && (
                              <span className="text-red-400 ml-1">
                                · Insufficient balance
                              </span>
                            )}
                        </p>
                      </div>
                      {payMethod === "wallet" &&
                        orderData?.wallet?.eligible && (
                          <CheckCircle
                            size={15}
                            style={{ color: "#f0545c", flexShrink: 0 }}
                          />
                        )}
                    </button>

                    {/* Saved Cards */}
                    {quickPayData?.cards?.map((card) => {
                      const key = `card_${card._id}`;
                      return (
                        <button
                          key={key}
                          onClick={() => setPayMethod(key)}
                          className="w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left"
                          style={{
                            borderColor:
                              payMethod === key ? "#f0545c" : "#e5e7eb",
                            background:
                              payMethod === key
                                ? "rgba(240,84,92,0.04)"
                                : "#fafafa",
                          }}
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background:
                                payMethod === key
                                  ? "rgba(240,84,92,0.1)"
                                  : "#f3f4f6",
                            }}
                          >
                            <CreditCard
                              size={15}
                              style={{
                                color:
                                  payMethod === key ? "#f0545c" : "#9ca3af",
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-gray-900">
                              •••• {card.last4}
                              {card.isPrimary && (
                                <span
                                  className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                  style={{
                                    background: "rgba(240,84,92,0.09)",
                                    color: "#f0545c",
                                  }}
                                >
                                  Primary
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {card.network} · Expires {card.expiry}
                            </p>
                          </div>
                          {payMethod === key && (
                            <CheckCircle
                              size={15}
                              style={{ color: "#f0545c", flexShrink: 0 }}
                            />
                          )}
                        </button>
                      );
                    })}

                    {/* Saved UPI IDs */}
                    {quickPayData?.upiIds?.map((upi) => {
                      const key = `upi_${upi._id}`;
                      return (
                        <button
                          key={key}
                          onClick={() => setPayMethod(key)}
                          className="w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left"
                          style={{
                            borderColor:
                              payMethod === key ? "#f0545c" : "#e5e7eb",
                            background:
                              payMethod === key
                                ? "rgba(240,84,92,0.04)"
                                : "#fafafa",
                          }}
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background:
                                payMethod === key
                                  ? "rgba(240,84,92,0.1)"
                                  : "#f3f4f6",
                            }}
                          >
                            <IndianRupee
                              size={15}
                              style={{
                                color:
                                  payMethod === key ? "#f0545c" : "#9ca3af",
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-gray-900">
                              {upi.id}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              UPI
                            </p>
                          </div>
                          {payMethod === key && (
                            <CheckCircle
                              size={15}
                              style={{ color: "#f0545c", flexShrink: 0 }}
                            />
                          )}
                        </button>
                      );
                    })}

                    {/* Razorpay — always last */}
                    <button
                      onClick={() => setPayMethod("razorpay")}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left"
                      style={{
                        borderColor:
                          payMethod === "razorpay" ? "#f0545c" : "#e5e7eb",
                        background:
                          payMethod === "razorpay"
                            ? "rgba(240,84,92,0.04)"
                            : "#fafafa",
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background:
                            payMethod === "razorpay"
                              ? "rgba(240,84,92,0.1)"
                              : "#f3f4f6",
                        }}
                      >
                        <CreditCard
                          size={15}
                          style={{
                            color:
                              payMethod === "razorpay" ? "#f0545c" : "#9ca3af",
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-gray-900">
                          Card / UPI / Net Banking
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Powered by Razorpay · Secure checkout
                        </p>
                      </div>
                      {payMethod === "razorpay" && (
                        <CheckCircle
                          size={15}
                          style={{ color: "#f0545c", flexShrink: 0 }}
                        />
                      )}
                    </button>
                  </div>
                </div>

                {/* Step 2 CTA */}
                <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
                  <button
                    onClick={handleConfirm}
                    disabled={isProcessingPayment || countdown === 0}
                    className="w-full py-3.5 rounded-xl text-[15px] font-black text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                    style={{ background: "#f0545c" }}
                    onMouseEnter={(e) => {
                      if (!isProcessingPayment)
                        e.currentTarget.style.background = "#d94048";
                    }}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#f0545c")
                    }
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />{" "}
                        Processing…
                      </>
                    ) : payMethod === "wallet" ? (
                      <>
                        <Wallet size={16} /> Pay with Wallet · ₹
                        {grandTotal.toLocaleString("en-IN")}
                      </>
                    ) : payMethod.startsWith("card_") ? (
                      <>
                        <CreditCard size={16} /> Pay with Card · ₹
                        {grandTotal.toLocaleString("en-IN")}
                      </>
                    ) : payMethod.startsWith("upi_") ? (
                      <>
                        <IndianRupee size={16} /> Pay with UPI · ₹
                        {grandTotal.toLocaleString("en-IN")}
                      </>
                    ) : (
                      <>
                        <IndianRupee size={16} /> Pay with Razorpay · ₹
                        {grandTotal.toLocaleString("en-IN")}
                      </>
                    )}
                  </button>
                  <p className="text-center text-[11px] text-gray-300 mt-2 flex items-center justify-center gap-1">
                    <Info size={9} />
                    {payMethod === "wallet"
                      ? `Wallet balance after: ₹${((orderData?.wallet?.balance || 0) - grandTotal).toLocaleString("en-IN")}`
                      : "Secured by Razorpay · 100% safe & encrypted"}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-xl text-[13px] font-semibold whitespace-nowrap slide-up shadow-lg"
          style={{
            background: toast.type === "error" ? "#fff1f2" : "#f0fdf4",
            color: toast.type === "error" ? "#dc2626" : "#16a34a",
            border: `1px solid ${toast.type === "error" ? "#fecdd3" : "#bbf7d0"}`,
          }}
        >
          {toast.type === "error" ? (
            <AlertCircle size={15} />
          ) : (
            <CheckCircle2 size={15} />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}



