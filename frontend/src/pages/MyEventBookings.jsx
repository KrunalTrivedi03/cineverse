import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, Ticket, Sparkles, ArrowRight } from "lucide-react";
import api from "../api/axiosInstance";

// Dedicated utility proxy to parse environment asset configurations securely
const IMG = (p) => !p ? null : p.startsWith("http") ? p : `${import.meta.env.VITE_API_URL}${p}`;

/* ═══════════════════════════════════════════════
   EVENT BOOKINGS SECTION (SETTINGS ARCHITECTURE)
═══════════════════════════════════════════════ */
export default function MyEventBookings({ toast }) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let userId = null;
    try {
      const stored = localStorage.getItem("userInfo");
      if (stored && stored !== "undefined") {
        const parsed = JSON.parse(stored);
        userId = parsed?._id || parsed?.id;
      }
    } catch (e) {
      console.error("Failed to parse user session info", e);
    }

    if (!userId) {
      if (toast) toast("Authentication context missing. Please sign in.", "error");
      setLoading(false);
      return;
    }

    api.get(`/event-seats/bookings/user/${userId}`)
      .then((r) => setBookings(r.data))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [toast]);

  // Design matching formatting handlers
  const fmtDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-IN", { 
      day: "numeric", 
      month: "short", 
      year: "numeric" 
    });
  };

  const fmt12 = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    return `${((h % 12) || 12).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ap}`;
  };

  if (loading) {
    return (
      <div className="fade-in bg-white rounded-2xl border border-gray-100 flex items-center justify-center py-24">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span 
              key={i} 
              className="w-2.5 h-2.5 rounded-full bg-[#f0545c] animate-bounce" 
              style={{ animationDelay: `${i * 0.15}s` }} 
            />
          ))}
        </div>
      </div>
    );
  }

  if (!bookings.length) {
    return (
      <div className="fade-in bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(240,84,92,0.07)" }}>
          <Ticket size={28} style={{ color: "#f0545c", opacity: 0.6 }} />
        </div>
        <p className="text-[16px] font-bold text-gray-700 mb-1">No event tickets found</p>
        <p className="text-[13px] text-gray-400">Your live concert passes and event bookings appear here.</p>
        <button 
          onClick={() => navigate("/events")} 
          className="mt-5 flex items-center gap-2 text-[13px] font-bold text-white px-6 py-2.5 rounded-xl active:scale-95 transition-transform" 
          style={{ background: "#f0545c" }}
        >
          Explore Live Events <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-3">
      <p className="text-[13px] font-bold text-gray-500 mb-1">
        {bookings.length} live entry event{bookings.length !== 1 ? "s" : ""}
      </p>
      
      {bookings.map((b) => (
        <div key={b._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors">
          <div className="flex items-stretch">
            
            {/* Dynamic Event Cover Banner */}
            <div 
              className="w-16 md:w-20 flex-shrink-0 min-h-[100px]"
              style={{ 
                background: b.event?.poster ? `url(${IMG(b.event.poster)}) center/cover` : "linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%)" 
              }}
            >
              {!b.event?.poster && (
                <div className="w-full h-full flex items-center justify-center">
                  <Sparkles size={20} style={{ color: "rgba(255,255,255,0.2)" }} />
                </div>
              )}
            </div>

            {/* Core Card Details Container */}
            <div className="flex-1 min-w-0 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-gray-900 truncate leading-tight">{b.event?.title || "Live Performance"}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5 tracking-wide uppercase">{b.bookingRef}</p>
                </div>
                <span 
                  className="flex-shrink-0 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                  style={{ background: "rgba(240,84,92,0.09)", color: "#f0545c" }}
                >
                  {b.event?.category || "Live"}
                </span>
              </div>

              {/* Context Meta Subtitles */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
                  <Calendar size={11} className="text-gray-400" /> {fmtDate(b.eventDate)}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
                  <Clock size={11} className="text-gray-400" /> {fmt12(b.eventTime)}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500 truncate max-w-[160px] md:max-w-[220px]">
                  <MapPin size={11} className="text-gray-400" /> {b.venue?.name || "Event Venue"}
                </span>
              </div>

              {/* Calculations Footer Summary Row */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <span className="text-[11px] font-semibold text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-lg border border-gray-100">
                  {b.bookingType === "seated" 
                    ? `${b.seats?.length || 0} Assigned Seat(s)` 
                    : `${b.quantity || 1} × ${b.ticketType?.name || "Pass"}`
                  }
                </span>
                <p className="text-[14px] font-black text-gray-900">
                  ₹{(b.grandTotal || b.totalAmount || 0).toLocaleString("en-IN")}
                </p>
              </div>

            </div>
          </div>
        </div>
      ))}
    </div>
  );
}