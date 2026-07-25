// src/pages/EventDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronDown, MapPin, Calendar, Clock, Users, Info,
  ShieldAlert, Building2, Mail, Phone, Star, Ticket, InfoIcon,
} from "lucide-react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import EventRow from "../components/EventRow";
import { IMG, fmtDateLong, fmt12 } from "../utils/eventHelpers";
import BottomNav from "../components/BottomNav";

const RULES_COLLAPSED_COUNT = 5;
const DESC_COLLAPSED_LINES = 4;

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [event,     setEvent]     = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [similar,   setSimilar]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [galleryIdx, setGalleryIdx] = useState(0);

  const [descExpanded, setDescExpanded]   = useState(false);
  const [rulesExpanded, setRulesExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/events/${id}`),
      api.get(`/event-schedules/event/${id}`),
      api.get(`/events/${id}/similar`),
    ])
      .then(([ev, sch, sim]) => {
        setEvent(ev.data);
        setSchedules(sch.data);
        setSimilar(sim.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-2.5 h-2.5 rounded-full bg-[#f0545c] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );

  if (!event) return null;

  const nearestSchedule = schedules[0];
  const venue = nearestSchedule?.venue;

  const allPrices = schedules.flatMap((s) =>
    (s.showTimes || []).flatMap((st) =>
      st.ticketTypes?.length ? st.ticketTypes.map((tt) => tt.price) : (st.price != null ? [st.price] : [])
    )
  );
  const minPrice = allPrices.length ? Math.min(...allPrices) : null;

  const visibleRules = rulesExpanded ? event.eventRules : (event.eventRules || []).slice(0, RULES_COLLAPSED_COUNT);
  const hasMoreRules = (event.eventRules?.length || 0) > RULES_COLLAPSED_COUNT;

  return (
    <div className="min-h-screen" style={{ background: "#f7f7f8", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        .desc-clamp { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
      <Navbar />

      <BottomNav />

      {/* ── Banner ── */}
      <div className="relative w-full overflow-hidden" style={{ height: 260, background: "#111" }}>
        {event.poster && (
          <img src={IMG(event.poster)} alt={event.title}
            className="w-full h-full object-cover"
            style={{ opacity: 0.5, filter: "blur(2px)" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent, #111827)" }} />
        <button onClick={() => navigate(-1)}
          className="absolute top-[76px] left-4 w-8 h-8 rounded-[10px] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", border: "none" }}>
          <ChevronLeft size={17} color="#fff" />
        </button>

        <div className="max-w-5xl mx-auto px-4 md:px-8 absolute left-0 right-0" style={{ bottom: 16 }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-[18px]">
            {event.poster && (
              <img src={IMG(event.poster)} alt={event.title}
                className="object-cover rounded-xl flex-shrink-0"
                style={{ width: 84, height: 116, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", border: "2px solid rgba(255,255,255,0.15)" }} />
            )}
            <div className="pb-1 min-w-0">
              <span style={{ fontSize: 10, fontWeight: 700, color: "#f0545c", textTransform: "uppercase", letterSpacing: ".08em" }}>
                {event.category}{event.genre ? ` · ${event.genre}` : ""}
              </span>
              <h1 className="text-[20px] sm:text-[26px]" style={{ margin: "4px 0 6px", fontWeight: 800, color: "#fff", letterSpacing: "-.5px", lineHeight: 1.15 }}>
                {event.title}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                {event.ratings?.count > 0 && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#facc15" }}>
                    <Star size={13} fill="#facc15" /> {event.ratings.average.toFixed(1)} ({event.ratings.count})
                  </span>
                )}
                {event.artists?.length > 0 && (
                  <span className="truncate max-w-[220px] sm:max-w-none" style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                    {event.artists.map((a) => a.name).join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 md:gap-8">

        {/* ── Left: details ── */}
        <div className="pb-15 md:pb-0">
          {/* Quick facts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))", gap: 12, marginBottom: 24 }}>
            {nearestSchedule && (
              <FactCard icon={<Calendar size={14} color="#f0545c" />} label="Date" value={fmtDateLong(nearestSchedule.eventDate)} />
            )}
            {nearestSchedule?.showTimes?.[0] && (
              <FactCard icon={<Clock size={14} color="#f0545c" />} label="Time" value={fmt12(nearestSchedule.showTimes[0].time)} />
            )}
            {event.duration && (
              <FactCard icon={<Clock size={14} color="#f0545c" />} label="Duration" value={`${event.duration} min`} />
            )}
            <FactCard icon={<ShieldAlert size={14} color="#f0545c" />} label="Age Limit" value={event.ageRestriction} />
          </div>

          {/* Description — collapsible on both mobile and desktop */}
          {event.description && (
            <Section title="About this event">
              <p
                className="desc-clamp"
                style={{
                  fontSize: 13, color: "#4b5563", lineHeight: 1.75, whiteSpace: "pre-line",
                  WebkitLineClamp: descExpanded ? "unset" : DESC_COLLAPSED_LINES,
                }}
              >
                {event.description}
              </p>
              {event.description.length > 220 && (
                <button
                  onClick={() => setDescExpanded((v) => !v)}
                  className="mt-1.5 text-[12px] font-bold flex items-center gap-1"
                  style={{ color: "#f0545c" }}
                >
                  {descExpanded ? "Read less" : "Read more"}
                  <ChevronDown size={13} style={{ transform: descExpanded ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
                </button>
              )}
            </Section>
          )}

          {/* Gallery */}
          {event.gallery?.length > 0 && (
            <Section title="Gallery">
              <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 10, aspectRatio: "16/9", background: "#eee" }}>
                <img src={IMG(event.gallery[galleryIdx])} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                {event.gallery.map((g, i) => (
                  <img key={i} src={IMG(g)} onClick={() => setGalleryIdx(i)}
                    style={{
                      width: 64, height: 64, objectFit: "cover", borderRadius: 8, cursor: "pointer", flexShrink: 0,
                      border: i === galleryIdx ? "2px solid #f0545c" : "2px solid transparent", opacity: i === galleryIdx ? 1 : 0.6,
                    }} />
                ))}
              </div>
            </Section>
          )}

          {/* Artists */}
          {event.artists?.length > 0 && (
            <Section title="Artists">
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {event.artists.map((a) => (
                  <div key={a._id} onClick={() => navigate(`/artists/${a._id}`)}
                    style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", background: "#eee", flexShrink: 0 }}>
                      {a.image ? (
                        <img src={IMG(a.image)} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#bbb" }}>{a.name?.[0]}</div>
                      )}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{a.name}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Venue */}
          {venue && (
            <Section title="Venue">
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <Building2 size={16} color="#f0545c" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111" }}>{venue.name}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "#9ca3af" }}>
                    {venue.address}{venue.district?.name ? `, ${venue.district.name}` : ""}{venue.city?.name ? `, ${venue.city.name}` : ""}
                  </p>
                  {venue.locationLink && (
                    <a href={venue.locationLink} target="_blank" rel="noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 12, fontWeight: 700, color: "#f0545c" }}>
                      <MapPin size={12} /> Get Directions
                    </a>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* Event Rules — vertical icon+divider list, matching the Event Guide reference pattern */}
          {event.eventRules?.length > 0 && (
            <Section title="Event Rules">
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                {visibleRules.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: i < visibleRules.length - 1 ? "1px solid #f0f0f0" : "none" }}
                  >
                    <InfoIcon size={15} className="flex-shrink-0" style={{ color: "#9ca3af" }} />
                    <span className="text-[13px]" style={{ color: "#374151" }}>{r}</span>
                  </div>
                ))}
                {hasMoreRules && (
                  <button
                    onClick={() => setRulesExpanded((v) => !v)}
                    className="w-full flex items-center justify-center gap-1 px-4 py-3 text-[12px] font-bold"
                    style={{ color: "#f0545c", borderTop: "1px solid #f0f0f0" }}
                  >
                    {rulesExpanded ? "Show less" : "See more"}
                    <ChevronDown size={13} style={{ transform: rulesExpanded ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
                  </button>
                )}
              </div>
            </Section>
          )}

          {/* Organizer */}
          {event.organizer?.name && (
            <Section title="Organizer">
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111" }}>{event.organizer.name}</p>
              <div style={{ display: "flex", gap: 16, marginTop: 6, flexWrap: "wrap" }}>
                {event.organizer.email && (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#9ca3af" }}>
                    <Mail size={12} /> {event.organizer.email}
                  </span>
                )}
                {event.organizer.phone && (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#9ca3af" }}>
                    <Phone size={12} /> {event.organizer.phone}
                  </span>
                )}
              </div>
            </Section>
          )}
        </div>

        {/* ── Right: sticky booking card — desktop only ── */}
        <div className="hidden md:block">
          <div style={{
            position: "sticky", top: 90, background: "#fff", borderRadius: 18,
            border: "1px solid #eee", padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          }}>
            <BookingCardContent event={event} schedules={schedules} minPrice={minPrice} navigate={navigate} />
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 md:px-8 pb-10" style={{ paddingBottom: 96 }}>
          <EventRow title="Similar Events" events={similar} />
        </div>
      )}

      <div
        className="md:hidden fixed left-4 right-4 z-40 bg-white px-4 py-3 flex items-center justify-between gap-3 rounded-4xl border border-gray-100"
        style={{
          bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
          boxShadow: "0 10px 30px rgba(0,0,0,0.14)",
        }}
      >
        <div className="min-w-0">
          {minPrice != null ? (
            <>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Starting from</p>
              <p className="text-[18px] font-extrabold text-gray-900 mt-0.5">₹{minPrice.toLocaleString("en-IN")}</p>
            </>
          ) : (
            <p className="text-[12px] text-gray-400">No dates scheduled yet.</p>
          )}
        </div>
        {schedules.length > 0 && (
          <button
            onClick={() => navigate(`/events/${event._id}/book`)}
            className="flex items-center gap-2 px-6 py-3 rounded-4xl font-bold text-[13px] text-white flex-shrink-0"
            style={{ background: "#f0545c" }}
          >
            <Ticket size={15} /> Book Tickets
          </button>
        )}
      </div>
    </div>
  );
}

function BookingCardContent({ event, schedules, minPrice, navigate }) {
  return (
    <>
      {minPrice != null && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".08em" }}>Starting from</p>
          <p style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 800, color: "#111" }}>₹{minPrice.toLocaleString("en-IN")}</p>
        </div>
      )}

      {schedules.length === 0 ? (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <Info size={20} color="#d1d5db" style={{ margin: "0 auto 6px" }} />
          <p style={{ fontSize: 12, color: "#9ca3af" }}>No upcoming dates scheduled yet.</p>
        </div>
      ) : (
        <button
          onClick={() => navigate(`/events/${event._id}/book`)}
          style={{
            width: "100%", padding: "13px 0", border: "none", borderRadius: 14,
            background: "#f0545c", color: "#fff", fontSize: 14, fontWeight: 800,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <Ticket size={16} /> Book Tickets
        </button>
      )}

      {event.language && (
        <p style={{ marginTop: 12, fontSize: 11, color: "#9ca3af" }}>
          <strong style={{ color: "#374151" }}>Language:</strong> {event.language}
        </p>
      )}
    </>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#111" }}>{title}</h2>
      {children}
    </div>
  );
}

function FactCard({ icon, label, value }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
        {icon}
        <span style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#111" }}>{value}</p>
    </div>
  );
}