import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate  = useNavigate();

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
      <section className="w-full px-4 sm:px-8 md:px-14 py-10 md:py-14 bg-white/70 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <SectionHeader count={0} />
          <div className="flex gap-5 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[190px] sm:w-[210px] animate-pulse">
                <div className="rounded-2xl bg-gray-200" style={{ aspectRatio: "2/3" }} />
                <div className="mt-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!events.length) return null;

  return (
    <section className="w-full px-4 sm:px-8 md:px-14 py-10 md:py-14 bg-white/70 border-b border-gray-100">
      <div className="max-w-7xl mx-auto">
        <SectionHeader count={events.length} onSeeAll={() => navigate("/events")} />

        <div className="relative group/slider">
          {canLeft && (
            <ArrowBtn dir="left" onClick={() => scroll("left")} style={{ left: -18, top: "42%" }} />
          )}
          <div
            ref={sliderRef}
            className="flex gap-5 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth"
          >
            {events.map((ev) => (
              <EventPosterCard
                key={ev._id}
                event={ev}
                onClick={() => navigate(`/events/${ev._id}`)}
              />
            ))}
          </div>
          {canRight && (
            <ArrowBtn dir="right" onClick={() => scroll("right")} style={{ right: -18, top: "42%" }} />
          )}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ count, onSeeAll }) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0545c]/10 text-[#f0545c] text-[11px] font-extrabold uppercase tracking-widest mb-2 border border-[#f0545c]/20">
          <Flame size={12} />
          <span>Live Experiences</span>
        </div>
        <h2 className="text-[22px] sm:text-[26px] font-black text-gray-900 tracking-tight">
          Upcoming Live Events
        </h2>
        {count > 0 && (
          <p className="text-[13px] text-gray-500 mt-1 font-medium">
            {count} concerts, comedy &amp; cultural show{count !== 1 ? "s" : ""} lined up near you
          </p>
        )}
      </div>
      {onSeeAll && (
        <button
          className="flex items-center gap-1 text-[#f0545c] hover:text-[#d94048] text-[13.5px] font-bold group transition-all"
          onClick={onSeeAll}
        >
          <span>Discover All Events</span>
          <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
        </button>
      )}
    </div>
  );
}

function daysUntilEvent(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const diff = Math.ceil((d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
  return diff >= 0 ? diff : null;
}

function EventPosterCard({ event, onClick }) {
  const sched = event.nextSchedule;
  const isTrending = event._tag === "trending";
  const daysLeft = daysUntilEvent(sched?.eventDate);

  const badge = isTrending
    ? { label: "Trending", bg: "rgba(240,84,92,0.92)", icon: Flame }
    : daysLeft != null
    ? { label: daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft}d to go`, bg: "rgba(234,88,12,0.92)", icon: Sparkles }
    : { label: "Coming Soon", bg: "rgba(234,88,12,0.92)", icon: Sparkles };
  const BadgeIcon = badge.icon;

  return (
    <div
      className="flex-shrink-0 w-[190px] sm:w-[210px] cursor-pointer group card-hover-lift"
      onClick={onClick}
    >
      <div
        className="relative rounded-2xl overflow-hidden bg-gray-100 shadow-md group-hover:shadow-2xl transition-all duration-300 border border-gray-100"
        style={{ aspectRatio: "2/3" }}
      >
        {event.poster ? (
          <img
            src={IMG(event.poster)}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 gap-2 p-3">
            <PartyPopper size={24} className="text-gray-400" />
            <div className="text-gray-400 text-[11px] font-bold text-center leading-snug">
              {event.title}
            </div>
          </div>
        )}

        {/* Category badge */}
        {event.category && (
          <span
            className="absolute top-2.5 left-2.5 text-[9.5px] font-black px-2 py-0.5 rounded-md backdrop-blur-md bg-black/60 text-white/90 uppercase tracking-wide border border-white/10"
          >
            {event.category}
          </span>
        )}

        {/* Status badge */}
        <div
          className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-md"
          style={{ background: badge.bg, color: "#fff" }}
        >
          <BadgeIcon size={10} />
          <span>{badge.label}</span>
        </div>

        {/* Rating chip */}
        {event.ratings?.count > 0 && (
          <div
            className="absolute top-8 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-md bg-black/60 border border-white/10 shadow-xs"
          >
            <Star size={10} fill="#facc15" className="text-[#facc15]" />
            <span className="text-[10px] font-black text-white">{event.ratings.average.toFixed(1)}</span>
          </div>
        )}

        {/* Bottom price / date bar */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 px-3 py-2.5"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)" }}
        >
          {sched?.startingPrice != null ? (
            <span className="text-white font-black text-[12.5px]">
              ₹{sched.startingPrice.toLocaleString("en-IN")} onwards
            </span>
          ) : sched?.eventDate ? (
            <span className="flex items-center gap-1 text-white text-[11.5px] font-bold">
              <Calendar size={12} className="text-orange-400 flex-shrink-0" />
              <span>{fmtDate(sched.eventDate)}</span>
            </span>
          ) : (
            <span className="text-white/70 text-[11.5px] font-medium">Details soon</span>
          )}
        </div>
      </div>

      <div className="mt-3 px-1">
        <h3 className="text-[14.5px] font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-[#f0545c] transition-colors">
          {event.title}
        </h3>

        {event.artists?.length > 0 && (
          <p className="text-[12px] font-medium text-gray-500 mt-0.5 truncate">
            {event.artists.map((a) => a.name).join(", ")}
          </p>
        )}

        {sched && (
          <div className="flex items-center gap-1.5 mt-1 text-[11.5px] font-bold text-[#f0545c]">
            <Calendar size={12} className="flex-shrink-0" />
            <span className="truncate">
              {fmtDate(sched.eventDate)}{sched.time ? ` · ${fmt12(sched.time)}` : ""}
            </span>
          </div>
        )}

        {sched?.venue && (
          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-medium text-gray-400">
            <MapPin size={11} className="flex-shrink-0" />
            <span className="truncate">
              {sched.venue.name}{sched.venue.district?.name ? `, ${sched.venue.district.name}` : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ArrowBtn({ dir, onClick, style }) {
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      className="absolute z-10 w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-lg flex items-center justify-center text-gray-700 hover:text-white hover:bg-[#f0545c] hover:border-[#f0545c] transition-all transform hover:scale-110 active:scale-95"
      style={{ ...style, transform: "translateY(-50%)" }}
      aria-label={dir === "left" ? "Previous" : "Next"}
    >
      {dir === "left" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  );
}
