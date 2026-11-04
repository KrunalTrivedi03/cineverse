import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { getSelectedCity } from "./Navbar";
import { getSelectedDistrict } from "./DistrictSelector";
import { IMG, fmtDate } from "../utils/eventHelpers";
import {
  ChevronRight,
  ChevronLeft,
  Calendar,
  MapPin,
  Star,
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
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const sliderRef = useRef(null);
  const navigate = useNavigate();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const loc = {
        city: getSelectedCity().id || undefined,
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

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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
    setCanLeft(el.scrollLeft > 6);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
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
      left: dir === "left" ? -720 : 720,
      behavior: "smooth",
    });

  if (loading) {
    return (
      <section className="w-full px-4 sm:px-8 md:px-12 py-8 md:py-10 bg-transparent">
        <div className="max-w-7xl mx-auto">
          <SectionHeader count={0} />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[160px] sm:w-[190px] animate-pulse">
                <div className="rounded-2xl bg-neutral-200 aspect-[2/3]" />
                <div className="mt-2.5 space-y-1.5">
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 rounded w-1/2" />
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
    <section className="w-full px-4 sm:px-8 md:px-12 py-8 md:py-10 bg-transparent relative">
      <div className="max-w-7xl mx-auto">
        <SectionHeader count={events.length} onSeeAll={() => navigate("/events")} />

        <div className="relative group/slider">
          {canLeft && (
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="absolute -left-3 top-1/2 -translate-y-8 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-neutral-100 flex items-center justify-center text-neutral-700 hover:text-black hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          <div
            ref={sliderRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth"
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
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="absolute -right-3 top-1/2 -translate-y-8 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-neutral-100 flex items-center justify-center text-neutral-700 hover:text-black hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ count, onSeeAll }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
          Live Events &amp; Experiences
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
          Concerts, comedy, and theater performances
        </p>
      </div>
      {onSeeAll && (
        <button
          className="flex items-center gap-1 text-sm font-bold text-[#ff4d58] hover:text-[#e03d47] transition-colors group cursor-pointer"
          onClick={onSeeAll}
        >
          <span>See All</span>
          <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  );
}

function EventPosterCard({ event, onClick }) {
  const sched = event.nextSchedule;

  return (
    <div
      className="flex-shrink-0 w-[160px] sm:w-[190px] md:w-[200px] cursor-pointer group"
      onClick={onClick}
    >
      <div
        className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-xs transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1.5"
      >
        {event.poster ? (
          <img
            src={IMG(event.poster)}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-100 text-neutral-400 p-4 text-center">
            <span className="text-xs font-semibold">{event.title}</span>
          </div>
        )}

        {event.category && (
          <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white">
            {event.category}
          </span>
        )}

        {event.ratings?.count > 0 && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full px-2 py-0.5 text-white">
            <Star size={10} fill="#facc15" className="text-yellow-400" />
            <span className="text-[11px] font-bold">{event.ratings.average.toFixed(1)}</span>
          </div>
        )}

        {sched?.startingPrice != null && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2.5 pt-6 flex items-end">
            <span className="text-xs font-bold text-white">
              ₹{sched.startingPrice.toLocaleString("en-IN")}{" "}
              <span className="font-normal text-[10px] text-white/80">onwards</span>
            </span>
          </div>
        )}
      </div>

      <div className="mt-2.5 px-0.5">
        <h3 className="text-sm font-bold text-neutral-900 truncate group-hover:text-[#ff4d58] transition-colors">
          {event.title}
        </h3>

        {sched && (
          <p className="text-xs text-neutral-500 mt-0.5 truncate flex items-center gap-1.5">
            <Calendar size={11} className="text-[#ff4d58] flex-shrink-0" />
            <span>{fmtDate(sched.eventDate)}</span>
          </p>
        )}

        {sched?.venue && (
          <p className="text-xs text-neutral-400 mt-0.5 truncate flex items-center gap-1.5">
            <MapPin size={11} className="flex-shrink-0 text-neutral-400" />
            <span>{sched.venue.name}</span>
          </p>
        )}
      </div>
    </div>
  );
}
