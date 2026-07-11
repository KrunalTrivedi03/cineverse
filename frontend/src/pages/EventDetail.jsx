// src/pages/EventDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, MapPin, Calendar, Clock, Users, Info,
  ShieldAlert, Building2, Mail, Phone, Star, Ticket,
  InfoIcon,
} from "lucide-react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import EventRow from "../components/EventRow";
import { IMG, fmtDateLong, fmt12 } from "../utils/eventHelpers";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event,     setEvent]     = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [similar,   setSimilar]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [galleryIdx, setGalleryIdx] = useState(0);

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

  return (
    <div
      className="min-h-screen"
      style={{ background: "#f7f7f8", fontFamily: "'Outfit', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>
      <Navbar />

      {/* ── Banner ── */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 320,
          background: "#111",
          overflow: "hidden",
        }}
      >
        {event.poster && (
          <img
            src={IMG(event.poster)}
            alt={event.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.5,
              filter: "blur(2px)",
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(transparent, #111827)",
          }}
        />
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            top: 76,
            left: 16,
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={17} color="#fff" />
        </button>

        <div
          className="max-w-5xl mx-auto px-4 md:px-8"
          style={{ position: "absolute", bottom: 20, left: 0, right: 0 }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", gap: 18 }}>
            {event.poster && (
              <img
                src={IMG(event.poster)}
                alt={event.title}
                style={{
                  width: 110,
                  height: 150,
                  objectFit: "cover",
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  border: "2px solid rgba(255,255,255,0.15)",
                }}
              />
            )}
            <div style={{ paddingBottom: 4 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#f0545c",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                }}
              >
                {event.category}
                {event.genre ? ` · ${event.genre}` : ""}
              </span>
              <h1
                style={{
                  margin: "4px 0 6px",
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-.5px",
                }}
              >
                {event.title}
              </h1>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                {event.ratings?.count > 0 && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#facc15",
                    }}
                  >
                    <Star size={13} fill="#facc15" />{" "}
                    {event.ratings.average.toFixed(1)} ({event.ratings.count})
                  </span>
                )}
                {event.artists?.length > 0 && (
                  <span
                    style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}
                  >
                    {event.artists.map((a) => a.name).join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="max-w-5xl mx-auto px-4 md:px-8 py-6"
        style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 32 }}
      >
        {/* ── Left: details ── */}
        <div>
          {/* Quick facts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {nearestSchedule && (
              <FactCard
                icon={<Calendar size={14} color="#f0545c" />}
                label="Date"
                value={fmtDateLong(nearestSchedule.eventDate)}
              />
            )}
            {nearestSchedule?.showTimes?.[0] && (
              <FactCard
                icon={<Clock size={14} color="#f0545c" />}
                label="Time"
                value={fmt12(nearestSchedule.showTimes[0].time)}
              />
            )}
            {event.duration && (
              <FactCard
                icon={<Clock size={14} color="#f0545c" />}
                label="Duration"
                value={`${event.duration} min`}
              />
            )}
            <FactCard
              icon={<ShieldAlert size={14} color="#f0545c" />}
              label="Age Limit"
              value={event.ageRestriction}
            />
          </div>

          {/* Description */}
          {event.description && (
            <Section title="About this event">
              <p
                style={{
                  fontSize: 13,
                  color: "#4b5563",
                  lineHeight: 1.75,
                  whiteSpace: "pre-line",
                }}
              >
                {event.description}
              </p>
            </Section>
          )}

          {/* Gallery */}
          {event.gallery?.length > 0 && (
            <Section title="Gallery">
              <div
                style={{
                  borderRadius: 14,
                  overflow: "hidden",
                  marginBottom: 10,
                  aspectRatio: "16/9",
                  background: "#eee",
                }}
              >
                <img
                  src={IMG(event.gallery[galleryIdx])}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                {event.gallery.map((g, i) => (
                  <img
                    key={i}
                    src={IMG(g)}
                    onClick={() => setGalleryIdx(i)}
                    style={{
                      width: 64,
                      height: 64,
                      objectFit: "cover",
                      borderRadius: 8,
                      cursor: "pointer",
                      flexShrink: 0,
                      border:
                        i === galleryIdx
                          ? "2px solid #f0545c"
                          : "2px solid transparent",
                      opacity: i === galleryIdx ? 1 : 0.6,
                    }}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* Artists */}
          {event.artists?.length > 0 && (
            <Section title="Artists">
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {event.artists.map((a) => (
                  <div
                    key={a._id}
                    onClick={() => navigate(`/artists/${a._id}`)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        overflow: "hidden",
                        background: "#eee",
                        flexShrink: 0,
                      }}
                    >
                      {a.image ? (
                        <img
                          src={IMG(a.image)}
                          alt={a.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 15,
                            fontWeight: 800,
                            color: "#bbb",
                          }}
                        >
                          {a.name?.[0]}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#374151",
                      }}
                    >
                      {a.name}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Venue */}
          {venue && (
            <Section title="Venue">
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
              >
                <Building2
                  size={16}
                  color="#f0545c"
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#111",
                    }}
                  >
                    {venue.name}
                  </p>
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: 12,
                      color: "#9ca3af",
                    }}
                  >
                    {venue.address}
                    {venue.district?.name ? `, ${venue.district.name}` : ""}
                    {venue.city?.name ? `, ${venue.city.name}` : ""}
                  </p>
                  {venue.locationLink && (
                    <a
                      href={venue.locationLink}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#f0545c",
                      }}
                    >
                      <MapPin size={12} /> Get Directions
                    </a>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* Event Rules */}
          {event.eventRules?.length > 0 && (
            <Section title="Event Rules">
              <div
                style={{
                  border: "1px solid #d4d1d1",
                  borderRadius: 14,
                  padding: "16px 18px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    columnGap: 24,
                    rowGap: 12,
                  }}
                >
                  {event.eventRules.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: "rgba(240,84,92,0.09)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: 1,
                        }}
                      >
                        <InfoIcon size={11} color="#f0545c" />
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          color: "#4b5563",
                          lineHeight: 1.6,
                        }}
                      >
                        {r}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}

          {/* Organizer */}
          {event.organizer?.name && (
            <Section title="Organizer">
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#111",
                }}
              >
                {event.organizer.name}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  marginTop: 6,
                  flexWrap: "wrap",
                }}
              >
                {event.organizer.email && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 12,
                      color: "#9ca3af",
                    }}
                  >
                    <Mail size={12} /> {event.organizer.email}
                  </span>
                )}
                {event.organizer.phone && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 12,
                      color: "#9ca3af",
                    }}
                  >
                    <Phone size={12} /> {event.organizer.phone}
                  </span>
                )}
              </div>
            </Section>
          )}
        </div>

        {/* ── Right: sticky booking card ── */}
        <div>
          <div
            style={{
              position: "sticky",
              top: 90,
              background: "#fff",
              borderRadius: 18,
              border: "1px solid #eee",
              padding: 20,
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            }}
          >
            {minPrice != null && (
              <div style={{ marginBottom: 14 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                  }}
                >
                  Starting from
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#111",
                  }}
                >
                  ₹{minPrice.toLocaleString("en-IN")}
                </p>
              </div>
            )}

            {schedules.length === 0 ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <Info
                  size={20}
                  color="#d1d5db"
                  style={{ margin: "0 auto 6px" }}
                />
                <p style={{ fontSize: 12, color: "#9ca3af" }}>
                  No upcoming dates scheduled yet.
                </p>
              </div>
            ) : (
              <button
                onClick={() => navigate(`/events/${event._id}/book`)}
                style={{
                  width: "100%",
                  padding: "13px 0",
                  border: "none",
                  borderRadius: 14,
                  background: "#f0545c",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Ticket size={16} /> Book Tickets
              </button>
            )}

            {event.language && (
              <p style={{ marginTop: 12, fontSize: 11, color: "#9ca3af" }}>
                <strong style={{ color: "#374151" }}>Language:</strong>{" "}
                {event.language}
              </p>
            )}
            {schedules.length > 0 && (
              <p style={{ marginTop: 4, fontSize: 11, color: "#9ca3af" }}>
                <Users
                  size={11}
                  style={{ display: "inline", marginRight: 4 }}
                />
                {schedules.length} date{schedules.length !== 1 ? "s" : ""}{" "}
                available
              </p>
            )}
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 md:px-8 pb-10">
          <EventRow title="Similar Events" events={similar} />
        </div>
      )}
    </div>
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