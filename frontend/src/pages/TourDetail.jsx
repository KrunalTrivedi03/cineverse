// src/pages/TourDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, MapPin, Calendar, Globe2, Ticket, Instagram, Twitter, Facebook, Youtube, Globe,
} from "lucide-react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import { IMG, fmtDateLong } from "../utils/eventHelpers";

const SOCIAL_ICON = { instagram: Instagram, twitter: Twitter, facebook: Facebook, youtube: Youtube, website: Globe };

export default function TourDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/tours/${id}`)
      .then((res) => setTour(res.data))
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

  if (!tour) return null;

  const legs = tour.legs || [];
  // Each leg (Event) can have multiple city schedules — flatten those into
  // individual itinerary stops so a multi-city event shows every city it's
  // playing, not just its nearest one.
  const stops = legs.flatMap((leg) =>
    (leg.schedules?.length ? leg.schedules : [{
      scheduleId: null, city: leg.city, venue: leg.venue, eventDate: leg.eventDate, isPast: leg.isPast,
    }]).map((s) => ({ ...s, event: leg.event }))
  );
  const upcomingLegs = stops.filter((s) => !s.isPast);
  const pastLegs = stops.filter((s) => s.isPast);

  return (
    <div className="min-h-screen" style={{ background: "#f7f7f8", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>
      <Navbar />
      <BottomNav />

      {/* ── Banner ── */}
      <div className="relative w-full overflow-hidden" style={{ height: 240, background: "#111" }}>
        {tour.poster && (
          <img src={IMG(tour.poster)} alt={tour.title}
            className="w-full h-full object-cover" style={{ opacity: 0.5, filter: "blur(2px)" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent, #111827)" }} />
        <button onClick={() => navigate(-1)}
          className="absolute top-[76px] left-4 w-8 h-8 rounded-[10px] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", border: "none" }}>
          <ChevronLeft size={17} color="#fff" />
        </button>

        <div className="max-w-5xl mx-auto px-4 md:px-8 absolute left-0 right-0" style={{ bottom: 16 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#f0545c", textTransform: "uppercase", letterSpacing: ".08em" }}>
            {tour.category || "Tour"} · {stops.length} {stops.length === 1 ? "stop" : "stops"}
          </span>
          <h1 className="text-[22px] sm:text-[28px]" style={{ margin: "4px 0 6px", fontWeight: 800, color: "#fff", letterSpacing: "-.5px", lineHeight: 1.15 }}>
            {tour.title}
          </h1>
          {(tour.cities?.length > 0) && (
            <p className="flex items-center gap-1.5 flex-wrap" style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
              <Globe2 size={13} />
              {tour.cities.join(" · ")}
              {tour.countries?.length > 1 && <span style={{ color: "#f0545c", fontWeight: 700 }}> ({tour.countries.join(", ")})</span>}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6 md:gap-8">
        {/* ── Left: itinerary ── */}
        <div className="pb-12 md:pb-0">
          {tour.description && (
            <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.75, marginBottom: 24, whiteSpace: "pre-line" }}>
              {tour.description}
            </p>
          )}

          {tour.artists?.length > 0 && (
            <div className="mb-7">
              <h2 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "#111" }}>Featuring</h2>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {tour.artists.map((a) => (
                  <div key={a._id} onClick={() => navigate(`/artists/${a._id}`)}
                    style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: "#eee", flexShrink: 0 }}>
                      {a.image ? (
                        <img src={IMG(a.image)} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#bbb" }}>
                          {a.name?.[0]}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "#111" }}>
            Tour Itinerary
          </h2>

          {stops.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9ca3af" }}>No city stops have been announced yet — check back soon.</p>
          ) : (
            <div style={{ position: "relative", paddingLeft: 22 }}>
              <div style={{ position: "absolute", left: 5, top: 6, bottom: 6, width: 2, background: "rgba(240,84,92,0.15)" }} />

              {[...upcomingLegs, ...pastLegs].map((leg) => (
                <div key={`${leg.event._id}-${leg.scheduleId || "na"}`} style={{ position: "relative", marginBottom: 18 }}>
                  <div style={{
                    position: "absolute", left: -22, top: 4, width: 12, height: 12, borderRadius: "50%",
                    background: leg.isPast ? "#d1d5db" : "#f0545c", border: "2px solid #f7f7f8",
                  }} />
                  <div
                    onClick={() => navigate(`/events/${leg.event._id}`)}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    style={{
                      background: "#fff", borderRadius: 14, padding: "14px 16px",
                      border: "1px solid #eee", opacity: leg.isPast ? 0.6 : 1,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{leg.event.title}</p>
                        <p className="flex items-center gap-1.5 flex-wrap mt-1" style={{ fontSize: 12, color: "#6b7280" }}>
                          <MapPin size={12} color="#f0545c" />
                          {leg.venue ? `${leg.venue.name}, ${leg.city?.name || ""}` : "Venue TBA"}
                          {leg.city?.country && <span style={{ color: "#9ca3af" }}>· {leg.city.country}</span>}
                        </p>
                        <p className="flex items-center gap-1.5 mt-1" style={{ fontSize: 12, color: "#6b7280" }}>
                          <Calendar size={12} color="#f0545c" /> {leg.eventDate ? fmtDateLong(leg.eventDate) : "Date TBA"}
                        </p>
                      </div>
                      {!leg.isPast && (
                        <span className="flex items-center gap-1 flex-shrink-0"
                          style={{ fontSize: 11, fontWeight: 700, color: "#f0545c", background: "rgba(240,84,92,0.08)", padding: "5px 10px", borderRadius: 999 }}>
                          <Ticket size={12} /> Book
                        </span>
                      )}
                      {leg.isPast && (
                        <span className="flex-shrink-0" style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>Past</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: sidebar ── */}
        <div className="hidden md:block">
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", padding: 18, position: "sticky", top: 96 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
              Tour Snapshot
            </p>
            <div className="flex flex-col gap-3">
              <SnapshotRow icon={<Globe2 size={14} color="#f0545c" />} label="Cities" value={tour.cities?.length || 0} />
              <SnapshotRow icon={<MapPin size={14} color="#f0545c" />} label="Total Stops" value={stops.length} />
              <SnapshotRow icon={<Calendar size={14} color="#f0545c" />} label="Status" value={tour.status} />
            </div>

            {tour.nextLeg && (
              <button
                onClick={() => navigate(`/events/${tour.nextLeg.event._id}`)}
                className="w-full mt-4 py-2.5 rounded-xl text-[13px] font-bold text-white"
                style={{ background: "#f0545c" }}
              >
                Book Next Stop
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SnapshotRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2" style={{ fontSize: 12, color: "#6b7280" }}>{icon} {label}</span>
      <span className="capitalize" style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{value}</span>
    </div>
  );
}