// src/pages/MyEventBookings.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, Ticket, ChevronLeft } from "lucide-react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import { IMG, fmtDate, fmt12, getCurrentUser } from "../utils/eventHelpers";

export default function MyEventBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user?.id) { navigate("/login"); return; }
    api.get(`/event-seats/bookings/user/${user.id}`)
      .then((r) => setBookings(r.data))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#f7f7f8", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>
      <Navbar />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0">
            <ChevronLeft size={16} />
          </button>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111" }}>My Event Bookings</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => <span key={i} className="w-2.5 h-2.5 rounded-full bg-[#f0545c] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Ticket size={32} className="text-gray-200 mb-3" />
            <p className="text-[16px] font-bold text-gray-400">No bookings yet</p>
            <p className="text-[13px] text-gray-300 mt-1 mb-4">Your confirmed event tickets will show up here.</p>
            <button onClick={() => navigate("/events")}
              className="px-5 py-2.5 rounded-xl font-bold text-[13px] text-white"
              style={{ background: "#f0545c" }}>
              Explore Events
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b._id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex">
                {b.event?.poster && (
                  <img src={IMG(b.event.poster)} alt={b.event.title} style={{ width: 84, objectFit: "cover", flexShrink: 0 }} />
                )}
                <div className="flex-1 p-4 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-gray-900 truncate">{b.event?.title}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{b.bookingRef}</p>
                    </div>
                    <span style={{
                      flexShrink: 0, padding: "3px 9px", borderRadius: 20, fontSize: 9, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: ".04em",
                      background: "rgba(240,84,92,0.1)", color: "#f0545c",
                    }}>
                      {b.event?.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="flex items-center gap-1 text-[11px] text-gray-500"><Calendar size={11} /> {fmtDate(b.eventDate)}</span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-500"><Clock size={11} /> {fmt12(b.eventTime)}</span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-500"><MapPin size={11} /> {b.venue?.name}</span>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[11px] font-semibold text-gray-600">
                      {b.bookingType === "seated" ? `${b.seats?.length || 0} seat(s)` : `${b.quantity} × ${b.ticketType?.name || "Ticket"}`}
                    </span>
                    <span className="text-[14px] font-extrabold text-gray-900">₹{b.grandTotal?.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}