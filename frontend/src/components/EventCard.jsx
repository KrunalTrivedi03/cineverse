import { useNavigate } from "react-router-dom";
import { MapPin, Star, Calendar } from "lucide-react";
import { IMG, fmt12, fmtDate } from "../utils/eventHelpers";

const CATEGORY_COLORS = {
  Music: { bg: "rgba(168,85,247,0.9)", text: "#fff" },
  Comedy: { bg: "rgba(249,115,22,0.9)", text: "#fff" },
  Workshops: { bg: "rgba(14,165,233,0.9)", text: "#fff" },
  Performances: { bg: "rgba(236,72,153,0.9)", text: "#fff" },
  Nightlife: { bg: "rgba(99,102,241,0.9)", text: "#fff" },
};

export default function EventCard({ event, width = 200 }) {
  const navigate = useNavigate();
  const sched    = event.nextSchedule;
  const catColor = CATEGORY_COLORS[event.category] || { bg: "rgba(0,0,0,0.65)", text: "#fff" };

  return (
    <div
      onClick={() => navigate(`/events/${event._id}`)}
      style={{ width, flexShrink: 0 }}
      className="group cursor-pointer card-hover-lift"
    >
      <div
        className="relative w-full rounded-2xl overflow-hidden bg-gray-100 shadow-md group-hover:shadow-2xl transition-all duration-300 border border-gray-100"
        style={{ aspectRatio: "3/4" }}
      >
        {event.poster ? (
          <img
            src={IMG(event.poster)}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 text-gray-400 text-[12px] font-bold">
            No Poster
          </div>
        )}

        {/* Category Badge */}
        {event.category && (
          <div
            className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-md"
            style={{ background: catColor.bg, color: catColor.text }}
          >
            <span className="text-[10px] font-black uppercase tracking-wider">
              {event.category}
            </span>
          </div>
        )}

        {/* Rating Badge */}
        {event.ratings?.count > 0 && (
          <div
            className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-md bg-black/60 border border-white/10 shadow-md"
          >
            <Star size={10} fill="#facc15" className="text-[#facc15]" />
            <span className="text-[11px] font-black text-white">
              {event.ratings.average.toFixed(1)}
            </span>
          </div>
        )}

        {/* Starting Price Pill */}
        {sched?.startingPrice != null && (
          <div
            className="absolute bottom-0 left-0 right-0 px-3 py-2"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
            }}
          >
            <span className="text-[11.5px] font-extrabold text-white">
              ₹{sched.startingPrice.toLocaleString("en-IN")} onwards
            </span>
          </div>
        )}
      </div>

      <div className="mt-2.5 px-1">
        <h3 className="text-[14px] font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-[#f0545c] transition-colors">
          {event.title}
        </h3>

        {event.artists?.length > 0 && (
          <p className="text-[12px] font-medium text-gray-500 mt-0.5 line-clamp-1">
            {event.artists.map((a) => a.name).join(", ")}
          </p>
        )}

        {sched && (
          <div className="flex items-center gap-1.5 mt-1.5 text-[11.5px] font-bold text-[#f0545c]">
            <Calendar size={12} className="flex-shrink-0" />
            <span className="truncate">
              {fmtDate(sched.eventDate)}{sched.time ? ` · ${fmt12(sched.time)}` : ""}
            </span>
          </div>
        )}

        {sched?.venue && (
          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-medium text-gray-400">
            <MapPin size={11} className="flex-shrink-0 text-gray-400" />
            <span className="truncate">
              {sched.venue.name}{sched.venue.district?.name ? `, ${sched.venue.district.name}` : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
