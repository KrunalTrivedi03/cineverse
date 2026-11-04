import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { CheckCircle2, MapPin, Calendar, Clock, Home, Ticket, Sparkles, Download, Share2 } from "lucide-react";
import BottomNav from "./BottomNav";

const IMG = (path) => (!path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`);

const fmt12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${(h % 12 || 12).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ap}`;
};

const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const CAT_COLOR = {
  Recliner: { color: "#7c3aed", bg: "#f3eeff", border: "#c4b5fd" },
  Premium: { color: "#e11d48", bg: "#fff1f2", border: "#fda4af" },
  Classic: { color: "#059669", bg: "#ecfdf5", border: "#6ee7b7" },
};

export default function BookingSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { booking, movie, theatre } = state || {};

  useEffect(() => {
    if (!booking) navigate("/");
  }, [booking, navigate]);

  if (!booking) return null;

  const seats = booking.seats || [];
  const ref = booking.bookingRef || "";
  const total = booking.grandTotal || 0;
  const sub = booking.totalAmount || 0;
  const fee = booking.convenienceFee || 0;
  const title = movie?.title || "";
  const poster = movie?.poster || "";
  const venue = theatre?.name || "";

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Navbar />
      <BottomNav />

      <div className="max-w-md mx-auto px-4 py-8 pb-28">
        {/* Celebration Header */}
        <div className="text-center mb-6">
          <div className="relative inline-flex items-center justify-center mb-3">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 size={32} className="stroke-[2.5]" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-sm">
              <Sparkles size={13} className="stroke-[2.5]" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Booking Confirmed!</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Your e-ticket has been generated and sent to your registered email.
          </p>
        </div>

        {/* Digital Ticket Pass Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/60 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#0f1117] p-5 text-white flex items-center gap-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-[#f0545c]/10 rounded-full blur-2xl pointer-events-none" />

            {poster && (
              <img
                src={IMG(poster)}
                alt={title}
                className="w-12 h-16 object-cover rounded-xl flex-shrink-0 border border-white/20 shadow-md"
              />
            )}
            <div className="flex-1 min-w-0">
              <span className="inline-block text-[9px] font-extrabold uppercase tracking-widest text-[#f0545c] bg-white/10 px-2 py-0.5 rounded-full mb-1">
                Verified Ticket
              </span>
              <p className="text-[15px] font-black text-white leading-tight truncate">{title}</p>
              <p className="text-[11px] text-white/50 font-mono mt-0.5 tracking-wider">{ref}</p>
            </div>
            {booking.screen && (
              <div className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                <span className="text-[11px] font-black text-[#f87171]">{booking.screen}</span>
              </div>
            )}
          </div>

          {/* Show Info Grid */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/50">
            <div className="p-3.5 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <Calendar size={11} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Date</span>
              </div>
              <p className="text-[12px] font-extrabold text-gray-900 leading-tight">
                {fmtDate(booking.showDate)}
              </p>
            </div>

            <div className="p-3.5 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <Clock size={11} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Time</span>
              </div>
              <p className="text-[12px] font-extrabold text-gray-900 leading-tight">
                {fmt12(booking.showTime)}
              </p>
            </div>

            <div className="p-3.5 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <MapPin size={11} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Cinema</span>
              </div>
              <p className="text-[12px] font-extrabold text-gray-900 leading-tight truncate" title={venue}>
                {venue}
              </p>
            </div>
          </div>

          {/* Perforated Divider Strip with Notches */}
          <div className="relative flex items-center justify-between px-3 py-0 bg-white">
            <div className="w-5 h-5 -ml-5.5 rounded-full bg-[#f8fafc] border-r border-gray-100 shadow-inner" />
            <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-2" />
            <div className="w-5 h-5 -mr-5.5 rounded-full bg-[#f8fafc] border-l border-gray-100 shadow-inner" />
          </div>

          {/* Seats & Payment Section */}
          <div className="p-5">
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2.5">
              {seats.length} Reserved Seat{seats.length !== 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {seats.map((s) => {
                const c = CAT_COLOR[s.category] || CAT_COLOR.Classic;
                return (
                  <div
                    key={s.seatId}
                    className="px-3 py-1.5 rounded-xl border flex flex-col items-center shadow-xs"
                    style={{ background: c.bg, borderColor: c.border }}
                  >
                    <span className="text-[13px] font-black font-mono" style={{ color: c.color }}>
                      {s.seatId}
                    </span>
                    <span
                      className="text-[8px] font-bold uppercase tracking-wider"
                      style={{ color: c.color, opacity: 0.8 }}
                    >
                      {s.category}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Price Breakdown */}
            <div className="pt-3 border-t border-gray-100 space-y-1.5 text-[12px]">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-700">₹{sub?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Convenience fee</span>
                <span className="font-semibold text-gray-700">₹{fee}</span>
              </div>
              <div className="flex justify-between text-[14px] font-black text-gray-900 pt-2 border-t border-gray-100">
                <span>Total Amount Paid</span>
                <span className="text-[#f0545c]">₹{total?.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Pass Footer Bar */}
          <div className="bg-gray-50/80 px-5 py-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <Ticket size={14} className="text-[#f0545c]" />
              <span className="font-extrabold text-gray-900">NOW Cinema Pass</span>
            </div>
            <span className="font-mono text-gray-400 font-medium tracking-wider">{ref}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#f0545c] text-white font-bold text-[13px] shadow-md shadow-[#f0545c]/25 hover:bg-[#e0454d] transition-all active:scale-[0.98]"
          >
            <Home size={15} />
            <span>Home</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-white border border-gray-200 text-gray-800 font-bold text-[13px] shadow-xs hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            <Ticket size={15} />
            <span>My Bookings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
