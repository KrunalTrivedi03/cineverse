// src/pages/BookEventTickets.jsx
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import { ChevronLeft, MapPin, Clock, IndianRupee } from "lucide-react";
import { IMG, fmt12, localDateKey } from "../utils/eventHelpers";
import BottomNav from "../components/BottomNav";

const getDates = (scheduleDates) => {
  // Build the picker strictly from dates that actually have a schedule
  const days   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const today  = localDateKey(new Date());

  return [...scheduleDates].sort().map((key) => {
    const d = new Date(key + "T00:00:00");
    return {
      key,
      day:   key === today ? "Today" : days[d.getDay()],
      date:  d.getDate(),
      month: months[d.getMonth()],
    };
  });
};

export default function BookEventTickets() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [event,      setEvent]      = useState(null);
  const [schedules,  setSchedules]  = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/events/${id}`),
      api.get(`/event-schedules/event/${id}`),
    ])
      .then(([ev, sch]) => {
        setEvent(ev.data);
        setSchedules(sch.data);
        if (sch.data.length) setSelectedDate(localDateKey(new Date(sch.data[0].eventDate)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const dateOptions = useMemo(
    () => getDates([...new Set(schedules.map((s) => localDateKey(new Date(s.eventDate))))]),
    [schedules]
  );

  const schedulesForDate = useMemo(
    () => schedules.filter((s) => localDateKey(new Date(s.eventDate)) === selectedDate),
    [schedules, selectedDate]
  );

  const handleSlotClick = (schedule, slot) => {
    const base = event.bookingType === "seated"
      ? `/events/${event._id}/schedule/${schedule._id}/slot/${slot._id}/seats`
      : `/events/${event._id}/schedule/${schedule._id}/slot/${slot._id}/tickets`;

    navigate(base, {
      state: {
        event,
        scheduleId: schedule._id,
        slotId:     slot._id,
        venue:      schedule.venue,
        eventDate:  schedule.eventDate,
        time:       slot.time,
        price:      slot.price,
        ticketTypes: slot.ticketTypes,
      },
    });
  };

  if (loading || !event) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-2.5 h-2.5 rounded-full bg-now-accent animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#fafafb", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>
      <Navbar />

      <BottomNav />

      {/* ── Event info bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-[60px] z-40">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0">
            <ChevronLeft size={16} />
          </button>
          {event.poster && (
            <img src={IMG(event.poster)} alt={event.title} className="w-9 h-[52px] object-cover rounded-lg flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-bold text-gray-900 truncate">{event.title}</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">{event.category}{event.genre ? ` · ${event.genre}` : ""}</p>
          </div>
        </div>

        {/* Date picker */}
        <div className="max-w-4xl mx-auto px-4 md:px-8 pb-3 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {dateOptions.map((d) => {
            const active = selectedDate === d.key;
            return (
              <button
                key={d.key}
                onClick={() => setSelectedDate(d.key)}
                style={{
                  flexShrink: 0, minWidth: 56, padding: "8px 4px", borderRadius: 12, textAlign: "center",
                  border: `1.5px solid ${active ? "#106579" : "#e4e4e7"}`,
                  background: active ? "#106579" : "#fff", cursor: "pointer",
                }}
              >
                <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: active ? "#fff" : "#9ca3af", textTransform: "uppercase" }}>{d.day}</p>
                <p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 800, color: active ? "#fff" : "#111" }}>{d.date}</p>
                <p style={{ margin: 0, fontSize: 9, fontWeight: 600, color: active ? "rgba(255,255,255,0.8)" : "#9ca3af" }}>{d.month}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
        {schedulesForDate.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-[16px] font-bold text-gray-400">No shows on this date</p>
            <p className="text-[13px] text-gray-300 mt-1">Pick another date above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {schedulesForDate.map((schedule) => (
              <div key={schedule._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[15px] font-bold text-gray-900">{schedule.venue?.name}</h3>
                    {schedule.venue?.locationLink && (
                      <a href={schedule.venue.locationLink} target="_blank" rel="noreferrer"
                        className="flex items-center gap-0.5 text-[11px] font-semibold text-now-accent hover:underline">
                        <MapPin size={11} /> Directions
                      </a>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-400 mt-0.5">
                    {schedule.venue?.address}{schedule.venue?.district?.name ? `, ${schedule.venue.district.name}` : ""}
                  </p>
                </div>

                <div className="border-t border-gray-100 px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {schedule.showTimes.map((slot) => {
                      const minPrice = slot.ticketTypes?.length
                        ? Math.min(...slot.ticketTypes.map((t) => t.price))
                        : slot.price;
                      return (
                        <button
                          key={slot._id}
                          onClick={() => handleSlotClick(schedule, slot)}
                          className="flex flex-col items-start gap-0.5 px-4 py-2 rounded-md border border-gray-300 hover:border-now-accent hover:bg-[#fff8f8] transition-all"
                        >
                          <span className="flex items-center gap-1 text-[14px] font-bold text-gray-900">
                            <Clock size={12} className="text-gray-400" /> {fmt12(slot.time)}
                          </span>
                          {minPrice != null && (
                            <span className="flex items-center text-[10px] font-semibold text-emerald-600">
                              <IndianRupee size={9} /> {minPrice} onwards
                            </span>
                          )}
                        </button>
                      );
                    })}
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