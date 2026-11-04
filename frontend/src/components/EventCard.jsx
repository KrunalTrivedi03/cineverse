import { useNavigate } from "react-router-dom";
import { MapPin, Star, Calendar } from "lucide-react";
import { IMG, fmt12, fmtDate } from "../utils/eventHelpers";

export default function EventCard({ event, width = 200 }) {
  const navigate = useNavigate();
  const sched = event.nextSchedule;

  return (
    <div
      onClick={() => navigate(`/events/${event._id}`)}
      style={{ width, flexShrink: 0 }}
      className="group cursor-pointer"
    >
      <div
        className="relative w-full rounded-xl overflow-hidden bg-neutral-100 ring-1 ring-black/[0.06] transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1"
        style={{ aspectRatio: "3/4" }}
      >
        {event.poster ? (
          <img
            src={IMG(event.poster)}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-200 text-neutral-400 text-xs font-semibold p-3 text-center">
            {event.title}
          </div>
        )}

        {/* Category Pill */}
        {event.category && (
          <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white/90">
            {event.category}
          </span>
        )}

        {/* Rating Badge */}
        {event.ratings?.count > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
            <Star size={10} fill="#facc15" className="text-yellow-400" />
            <span>{event.ratings.average.toFixed(1)}</span>
          </div>
        )}

        {/* Bottom subtle gradient with price */}
        {sched?.startingPrice != null && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2.5 pt-6 flex items-end">
            <span className="text-xs font-bold text-white">
              ₹{sched.startingPrice.toLocaleString("en-IN")} <span className="font-normal text-[10px] text-white/70">onwards</span>
            </span>
          </div>
        )}
      </div>

      <div className="mt-2.5 px-0.5">
        <h3 className="text-sm font-semibold text-neutral-900 truncate group-hover:text-[#f0545c] transition-colors">
          {event.title}
        </h3>

        {sched && (
          <p className="text-xs text-neutral-500 mt-0.5 truncate flex items-center gap-1">
            <Calendar size={11} className="text-[#f0545c] flex-shrink-0" />
            <span>{fmtDate(sched.eventDate)}</span>
          </p>
        )}

        {sched?.venue && (
          <p className="text-xs text-neutral-400 mt-0.5 truncate flex items-center gap-1">
            <MapPin size={11} className="flex-shrink-0" />
            <span>{sched.venue.name}</span>
          </p>
        )}
      </div>
    </div>
  );
}
