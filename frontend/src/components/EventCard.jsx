import { Link } from "react-router-dom";
import { MapPin, Star, Calendar } from "lucide-react";
import { IMG, fmt12, fmtDate } from "../utils/eventHelpers";

export default function EventCard({ event, width = 190 }) {
  const sched    = event.nextSchedule;

  return (
    <Link
      to={`/events/${event._id}`}
      style={{ width, flexShrink: 0, cursor: "pointer" }}
      className="now-card group block rounded-2xl p-1.5"
    >
      <div style={{
        position: "relative", width: "100%", aspectRatio: "3/4",
        borderRadius: 14, overflow: "hidden", background: "#eee",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}>
        {event.poster ? (
          <img
            src={IMG(event.poster)}
            alt=""
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            className="group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: 12, fontWeight: 600 }}>
            No Image
          </div>
        )}

        <div style={{
          position: "absolute", top: 8, left: 8,
          padding: "3px 9px", borderRadius: 20,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: ".04em", textTransform: "uppercase" }}>
            {event.category}
          </span>
        </div>

        {event.ratings?.count > 0 && (
          <div style={{
            position: "absolute", top: 8, right: 8,
            display: "flex", alignItems: "center", gap: 3,
            padding: "3px 7px", borderRadius: 20,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          }}>
            <Star size={9} color="#facc15" fill="#facc15" />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{event.ratings.average.toFixed(1)}</span>
          </div>
        )}

        {sched?.startingPrice != null && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "8px 10px 6px",
            background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>
              ₹{sched.startingPrice.toLocaleString("en-IN")} onwards
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: "8px 2px 0" }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111", lineHeight: 1.3 }} className="line-clamp-1">
          {event.title}
        </p>
        {event.artists?.length > 0 && (
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }} className="line-clamp-1">
            {event.artists.map((a) => a.name).join(", ")}
          </p>
        )}
        {sched && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
            <Calendar size={10} color="#106579" />
            <span style={{ fontSize: 10, fontWeight: 600, color: "#106579" }}>
              {fmtDate(sched.eventDate)}{sched.time ? ` · ${fmt12(sched.time)}` : ""}
            </span>
          </div>
        )}
        {sched?.venue && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <MapPin size={10} color="#9ca3af" />
            <span style={{ fontSize: 10, color: "#9ca3af" }} className="line-clamp-1">
              {sched.venue.name}{sched.venue.district?.name ? `, ${sched.venue.district.name}` : ""}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}