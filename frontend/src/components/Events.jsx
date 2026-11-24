import DiscoveryHeading from "./DiscoveryHeading";
import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosInstance";
import { getSelectedCity } from "./Navbar";
import { getSelectedDistrict } from "./DistrictSelector";
import { IMG, fmt12, fmtDate } from "../utils/eventHelpers";
import {
  ChevronRight,
  ChevronLeft,
  MapPin,
  Star,
  Calendar,
  Flame,
  Sparkles,
  PartyPopper,
} from "lucide-react";

/* Merge trending + upcoming (5 each), tagging each with where it came from.
   If an event appears in both lists, keep it tagged as "trending" only —
   avoids showing the same card twice. */
const mergeEvents = (trending, upcoming) => {
  const seen = new Set();
  const out = [];

  trending.slice(0, 5).forEach((ev) => {
    if (seen.has(ev._id)) return;
    seen.add(ev._id);
    out.push({ ...ev, _tag: "trending" });
  });

  upcoming.slice(0, 5).forEach((ev) => {
    if (seen.has(ev._id)) return;
    seen.add(ev._id);
    out.push({ ...ev, _tag: "upcoming" });
  });

  return out;
};

export default function HomeEvents() {
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [canLeft, setCanLeft]   = useState(false);
  const [canRight, setCanRight] = useState(false);
  const sliderRef = useRef(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const loc = {
        city:     getSelectedCity().id || undefined,
        district: getSelectedDistrict().id || undefined,
      };
      const [t, u] = await Promise.all([
        api.get("/events/trending", { params: loc }),
        api.get("/events/upcoming", { params: loc }),
      ]);
      setEvents(mergeEvents(t.data || [], u.data || []));
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    const handler = () => fetchEvents();
    window.addEventListener("cityChanged", handler);
    window.addEventListener("districtChanged", handler);
    return () => {
      window.removeEventListener("cityChanged", handler);
      window.removeEventListener("districtChanged", handler);
    };
  }, [fetchEvents]);

  const checkScroll = () => {
    const el = sliderRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [events]);

  const scroll = (dir) =>
    sliderRef.current?.scrollBy({
      left: dir === "left" ? -880 : 880,
      behavior: "smooth",
    });

  if (loading) {
    return (
      <section className="w-full px-6 md:px-14 py-10 bg-now-canvas border-t border-gray-100">
        <SectionHeader count={0} />
        <div className="flex gap-4 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[200px] animate-pulse">
              <div className="rounded-2xl bg-gray-200" style={{ aspectRatio: "2/3" }} />
              <div className="mt-2.5 space-y-2">
                <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!events.length) return null;

  return (
    <section className="w-full px-6 md:px-14 py-10 bg-now-canvas border-t border-gray-100">
      <SectionHeader count={events.length} />

      <div className="relative">
        {canLeft && (
          <ArrowBtn dir="left" onClick={() => scroll("left")} style={{ left: -16, top: "38%" }} />
        )}
        <div
          ref={sliderRef}
          className="now-media-rail flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {events.map((ev) => (
            <EventPosterCard
              key={ev._id}
              event={ev}
            />
          ))}
        </div>
        {canRight && (
          <ArrowBtn dir="right" onClick={() => scroll("right")} style={{ right: -16, top: "38%" }} />
        )}
      </div>
    </section>
  );
}

function SectionHeader({ count }) {
  return <DiscoveryHeading title="Live events near you" detail={count ? `${count} upcoming ${count === 1 ? "event" : "events"}` : undefined} to="/events" />;
}

/* ─── Card ────────────────────────────────────────────── */
function daysUntilEvent(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const diff = Math.ceil((d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
  return diff >= 0 ? diff : null;
}

function EventPosterCard({ event }) {
  const sched = event.nextSchedule;
  const isTrending = event._tag === "trending";
  const daysLeft = daysUntilEvent(sched?.eventDate);

  const badge = isTrending
    ? { label: "Trending", bg: "rgba(16,101,121,0.9)", icon: Flame }
    : daysLeft != null
    ? { label: daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft}d to go`, bg: "rgba(234,88,12,0.88)", icon: Sparkles }
    : { label: "Coming Soon", bg: "rgba(234,88,12,0.88)", icon: Sparkles };
  const BadgeIcon = badge.icon;

  return (
    <Link to={`/events/${event._id}`} className="now-media-card now-event-card shrink-0 group snap-start">
      <div
        className="relative rounded-2xl overflow-hidden bg-gray-100 shadow-sm transition-shadow group-hover:shadow-lg"
        style={{ aspectRatio: "2/3" }}
      >
        {event.poster ? (
          <img
            src={IMG(event.poster)}
            alt="" loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-200 to-gray-300 gap-2">
            <PartyPopper size={22} className="text-gray-400" />
            <div className="text-gray-400 text-[10px] font-semibold text-center px-4 leading-tight">
              {event.title}
            </div>
          </div>
        )}

        {/* Category badge — top left */}
        {event.category && (
          <span
            className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
            style={{ background: "rgba(0,0,0,0.62)", color: "rgba(255,255,255,0.85)" }}
          >
            {event.category}
          </span>
        )}

        {/* Status badge — top right (Trending / Coming Soon) */}
        <div
          className="now-event-status absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{ background: badge.bg, color: "#fff" }}
        >
          <BadgeIcon size={10} />
          {badge.label}
        </div>

        {/* Rating chip, if present, sits just under status badge */}
        {event.ratings?.count > 0 && (
          <div
            className="now-event-rating absolute top-[30px] right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full"
            style={{ background: "rgba(0,0,0,0.55)" }}
          >
            <Star size={9} color="#facc15" fill="#facc15" />
            <span className="text-[10px] font-bold text-white">{event.ratings.average.toFixed(1)}</span>
          </div>
        )}

        {/* Bottom gradient — price / date */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 px-3 py-2"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)" }}
        >
          {sched?.startingPrice != null ? (
            <span className="text-white font-bold text-[12px]">
              ₹{sched.startingPrice.toLocaleString("en-IN")} onwards
            </span>
          ) : sched?.eventDate ? (
            <span className="flex items-center gap-1 text-white text-[11px] font-semibold">
              <Calendar size={11} className="text-orange-400 flex-shrink-0" />
              {fmtDate(sched.eventDate)}
            </span>
          ) : (
            <span className="text-white/70 text-[11px] font-semibold">Details soon</span>
          )}
        </div>
      </div>

      <div className="mt-2.5 px-0.5">
        <h3 className="text-[14px] font-bold text-gray-900 leading-tight line-clamp-1 group-hover:text-now-accent transition-colors">
          {event.title}
        </h3>

        {event.artists?.length > 0 && (
          <p className="text-[12px] text-gray-400 mt-0.5 truncate">
            {event.artists.map((a) => a.name).join(", ")}
          </p>
        )}

        {sched && (
          <div className="flex items-center gap-1 mt-1">
            <Calendar size={10} color="#106579" />
            <span className="text-[11px] font-semibold text-now-accent truncate">
              {fmtDate(sched.eventDate)}{sched.time ? ` · ${fmt12(sched.time)}` : ""}
            </span>
          </div>
        )}

        {sched?.venue && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={10} color="#9ca3af" />
            <span className="text-[11px] text-gray-400 truncate">
              {sched.venue.name}{sched.venue.district?.name ? `, ${sched.venue.district.name}` : ""}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

/* ─── Arrow Button ────────────────────────────────────── */
function ArrowBtn({ dir, onClick, style }) {
  return (
    <button
      aria-label={dir === "left" ? "Previous events" : "Next events"}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      className="absolute z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:border-gray-400 hover:shadow-lg transition-all"
      style={{ ...style, transform: "translateY(-50%)" }}
    >
      {dir === "left" ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
    </button>
  );
}