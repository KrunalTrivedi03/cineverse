import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import LatestMovies from "../components/LatestMovies";
import ComingSoon from "../components/ComingSoon";
import Events from "../components/Events";
import PlayHome from "../components/PlayHome";
import Footer from "../components/Footer";
import api from "../api/axiosInstance";
import { getSelectedDistrict } from "../components/DistrictSelector";

import {
  X, Play, Clock, CalendarDays, Film, Globe, ShieldCheck, Ticket,
  PartyPopper, MapPin, Dumbbell, Trophy,
} from "lucide-react";
import OffersBanner from "../components/OffersBanner";
import BottomNav from "../components/BottomNav";

/* ─── Helpers ─────────────────────────────────────────── */
const IMG = (path) => !path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;

const isLatestMovie = (m) =>
  m.status === "streaming" || (m.status === "released" && m.isInCinemas);

const getDayOfYear = (date) => {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / (1000 * 60 * 60 * 24));
};

const getDailyRotatingSlice = (list, count) => {
  if (list.length === 0) return [];
  const startIdx = getDayOfYear(new Date()) % list.length;
  const result = [];
  for (let i = 0; i < Math.min(count, list.length); i++) {
    result.push(list[(startIdx + i) % list.length]);
  }
  return result;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const getYoutubeEmbed = (url) => {
  const reg = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/;
  const match = url?.match(reg);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;
};

/* Movie doc -> hero slide */
function movieToSlide(m) {
  return {
    type: "movie",
    id: m._id,
    key: `movie-${m._id}`,
    title: m.title,
    tag: m.status === "streaming" ? "Streaming" : "Now Showing",
    meta: [
      m.runtime && { icon: Clock, label: m.runtime },
      m.genre && { icon: Film, label: m.genre },
      m.language && { icon: Globe, label: m.language },
      m.certificate && { icon: ShieldCheck, label: m.certificate },
    ].filter(Boolean),
    description: m.description || "",
    poster: IMG(m.poster),
    background: IMG(m.poster),
    trailer: getYoutubeEmbed(m.trailerLink),
    primaryCta: { label: "Book Tickets", to: `/movie/${m._id}`, icon: Ticket },
    posterBadge: "In Cinemas",
    posterLink: `/movie/${m._id}`,
  };
}

/* Upcoming Event doc -> hero slide */
function eventToSlide(ev) {
  const sched = ev.nextSchedule;
  return {
    type: "event",
    id: ev._id,
    key: `event-${ev._id}`,
    title: ev.title,
    tag: ev.category || "Live Event",
    meta: [
      sched?.eventDate && { icon: CalendarDays, label: formatDate(sched.eventDate) },
      sched?.venue?.name && { icon: MapPin, label: `${sched.venue.name}${sched.venue.district?.name ? `, ${sched.venue.district.name}` : ""}` },
      sched?.startingPrice != null && { icon: Ticket, label: `₹${sched.startingPrice.toLocaleString("en-IN")} onwards` },
    ].filter(Boolean),
    description: ev.description || "",
    poster: IMG(ev.poster),
    background: IMG(ev.poster),
    trailer: null,
    primaryCta: { label: "View Event", to: `/events/${ev._id}`, icon: PartyPopper },
    posterBadge: "Live Event",
    posterLink: `/events/${ev._id}`,
  };
}

/* Play venue doc -> hero slide */
function venueToSlide(v) {
  const activityNames = (v.courtActivities || v.activities || []).map((a) => a.name).slice(0, 3).join(" · ");
  return {
    type: "play",
    id: v._id,
    key: `play-${v._id}`,
    title: v.name,
    tag: "Play",
    meta: [
      v.district?.name && { icon: MapPin, label: v.district.name },
      activityNames && { icon: Trophy, label: activityNames },
      v.startingPrice != null && { icon: Ticket, label: `₹${v.startingPrice} onwards` },
    ].filter(Boolean),
    description: v.description || "",
    poster: IMG(v.images?.[0]),
    background: IMG(v.images?.[0]),
    trailer: null,
    primaryCta: { label: "Book slots", to: `/play/venues/${v._id}`, icon: Dumbbell },
    posterBadge: "Book Now",
    posterLink: `/play/venues/${v._id}`,
  };
}

/* Interleave up to 2 of each type as Movie, Event, Play, Movie, Event, Play —
   missing items are simply skipped so the sequence never breaks, and the
   slider ends up with however many of the 6 slots actually have data. */
function buildSlideOrder(movies, events, plays) {
  const out = [];
  for (let i = 0; i < 2; i++) {
    if (movies[i]) out.push(movieToSlide(movies[i]));
    if (events[i]) out.push(eventToSlide(events[i]));
    if (plays[i]) out.push(venueToSlide(plays[i]));
  }
  return out;
}

/* ─── Home ────────────────────────────────────────────── */
export default function Home() {
  const [slides, setSlides] = useState([]);
  const [trailerUrl, setTrailerUrl] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const autoplayRef = useRef(null);
  const pausedRef = useRef(false);

  const loadSlides = useCallback(async () => {
    setLoading(true);
    const district = getSelectedDistrict();

    const [movieRes, eventRes, playRes] = await Promise.allSettled([
      api.get("/movies"),
      api.get("/events/upcoming", { params: { district: district.id || undefined } }),
      district.id ? api.get(`/play/venues?district=${district.id}`) : Promise.resolve({ data: [] }),
    ]);

    const eligibleMovies = movieRes.status === "fulfilled" ? movieRes.value.data.filter(isLatestMovie) : [];
    const dailyMovies = getDailyRotatingSlice(eligibleMovies, 2);

    const events = eventRes.status === "fulfilled" ? (eventRes.value.data || []).slice(0, 2) : [];
    const plays = playRes.status === "fulfilled" ? (playRes.value.data || []).slice(0, 2) : [];

    setSlides(buildSlideOrder(dailyMovies, events, plays));
    setActiveIdx(0);
    setLoading(false);
  }, []);

  useEffect(() => { loadSlides(); }, [loadSlides]);

  useEffect(() => {
    const handler = () => loadSlides();
    window.addEventListener("districtChanged", handler);
    return () => window.removeEventListener("districtChanged", handler);
  }, [loadSlides]);

  // Self-contained autoplay — no Swiper involved, so there's no fade-effect
  // race where two slides can end up rendered at full opacity together.
  // Only ever one index is "active" at a time; everything else is opacity 0
  // and pointer-events: none.
  useEffect(() => {
    if (slides.length <= 1) return;
    autoplayRef.current = setInterval(() => {
      if (pausedRef.current) return;
      setActiveIdx((i) => (i + 1) % slides.length);
    }, 5500);
    return () => clearInterval(autoplayRef.current);
  }, [slides.length]);

  const goTo = (i) => {
    setActiveIdx(i);
    // Restart the autoplay clock so a manual click doesn't get immediately
    // overridden by a timer that was already halfway through its interval.
    clearInterval(autoplayRef.current);
    if (slides.length > 1) {
      autoplayRef.current = setInterval(() => {
        if (pausedRef.current) return;
        setActiveIdx((i2) => (i2 + 1) % slides.length);
      }, 5500);
    }
  };

  const openTrailer = (url) => {
    if (!url) return;
    pausedRef.current = true;
    setTrailerUrl(url);
  };
  const closeTrailer = () => {
    pausedRef.current = false;
    setTrailerUrl(null);
  };

  useEffect(() => {
    const fn = (e) => e.key === "Escape" && closeTrailer();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f5]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');`}</style>

      <Navbar />
      <BottomNav />

      <div
        className="relative"
        style={{ background: "#111" }}
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
      >
        {loading ? (
          <div
            className="w-full flex items-center justify-center"
            style={{ height: "clamp(420px, 58vw, 600px)", background: "#1a1a1a" }}
          >
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full animate-bounce"
                  style={{ background: "#f0545c", animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        ) : slides.length === 0 ? (
          <div
            className="w-full flex flex-col items-center justify-center gap-2 text-center px-6"
            style={{ height: "clamp(340px, 40vw, 460px)", background: "#1a1a1a" }}
          >
            <p className="text-white/70 text-[14px] font-semibold">Nothing to feature here yet</p>
            <p className="text-white/35 text-[12px]">Check back soon, or pick a district to see local events &amp; play venues.</p>
          </div>
        ) : (
          <div className="relative w-full overflow-hidden" style={{ height: "clamp(420px, 58vw, 600px)" }}>
            {slides.map((item, i) => (
              <div
                key={item.key}
                className="absolute inset-0"
                style={{
                  opacity: i === activeIdx ? 1 : 0,
                  zIndex: i === activeIdx ? 2 : 1,
                  pointerEvents: i === activeIdx ? "auto" : "none",
                  transition: "opacity 0.7s ease",
                }}
                aria-hidden={i !== activeIdx}
              >
                <HeroSlide item={item} onPlay={() => openTrailer(item.trailer)} />
              </div>
            ))}
          </div>
        )}

        {/* Dot indicators */}
        {slides.length > 1 && !loading && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="transition-all duration-300 rounded-full"
                style={{
                  width: i === activeIdx ? 24 : 8,
                  height: 8,
                  background: i === activeIdx ? "#f0545c" : "rgba(255,255,255,0.35)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ══ LIGHT CONTENT ═════════════════════════════════ */}
      <div className="bg-white">
        <OffersBanner />
        <LatestMovies />
        <ComingSoon />
        <Events />
        <PlayHome />
      </div>

      {/* ══ FOOTER ════════════════════════════════════════ */}
      <Footer />

      {/* ══ TRAILER MODAL ═════════════════════════════════ */}
      {trailerUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)" }}
          onClick={closeTrailer}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "scaleUp 0.22s cubic-bezier(.4,0,.2,1) both" }}
          >
            <button
              onClick={closeTrailer}
              className="absolute -top-11 right-0 flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors"
            >
              <X size={15} /> Close
            </button>
            <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <iframe
                width="100%"
                className="aspect-video block"
                src={trailerUrl}
                title="Trailer"
                allow="autoplay; fullscreen; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
          <style>{`
            @keyframes scaleUp {
              from { opacity: 0; transform: scale(0.93); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

/* ─── Single Hero Slide (Movie / Event / Play) ────────── */
function HeroSlide({ item, onPlay }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: item.background ? `url(${item.background})` : undefined,
          background: item.background ? undefined : "linear-gradient(135deg,#1c1c1c,#2d2d2d)",
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
          filter: "brightness(0.22) saturate(1.3)",
          transform: "scale(1.07)",
        }}
      />

      {/* Left-dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(105deg, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.65) 42%, rgba(8,8,8,0.1) 100%)",
        }}
      />

      {/* Bottom bleed into page */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: 80, background: "linear-gradient(to bottom, transparent, #f5f5f5)" }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center px-8 md:px-16 max-w-6xl mx-auto">
        <div className="flex items-center gap-10 md:gap-16 w-full">

          {/* Left: text */}
          <div className="flex-1 min-w-0 text-white">
            {/* Tag pill */}
            <span
              className="inline-block text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
              style={{
                background: "rgba(240,84,92,0.2)",
                color: "#f0545c",
                border: "1px solid rgba(240,84,92,0.35)",
              }}
            >
              {item.tag}
            </span>

            <h2
              className="font-black leading-none mb-3 tracking-tight"
              style={{ fontSize: "clamp(28px, 4.5vw, 52px)" }}
            >
              {item.title}
            </h2>

            {/* Meta row */}
            {item.meta?.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/45 text-[13px] mb-4">
                {item.meta.map((m, i) => {
                  const MetaIcon = m.icon;
                  return (
                    <span key={i} className="flex items-center gap-3">
                      {i > 0 && <Dot />}
                      <span className="flex items-center gap-1"><MetaIcon size={12} /> {m.label}</span>
                    </span>
                  );
                })}
              </div>
            )}

            {item.description && (
              <p
                className="text-white/55 leading-relaxed mb-6 line-clamp-2"
                style={{ maxWidth: 480, fontSize: 14 }}
              >
                {item.description}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to={item.primaryCta.to}
                className="flex items-center gap-2 font-semibold px-7 py-2.5 rounded-xl text-sm text-white transition-all active:scale-95"
                style={{ background: "#f0545c" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#d94048")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#f0545c")}
              >
                <item.primaryCta.icon size={15} /> {item.primaryCta.label}
              </Link>

              {item.trailer && (
                <button
                  onClick={onPlay}
                  className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.75)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                >
                  <Play size={14} fill="currentColor" /> Watch Trailer
                </button>
              )}
            </div>
          </div>

          {/* Right: poster */}
          {item.poster && (
            <div className="flex-shrink-0 hidden sm:block">
              <Link
                to={item.posterLink}
                className="relative group cursor-pointer block"
                style={{ width: "clamp(140px, 14vw, 200px)" }}
              >
                <img
                  src={item.poster}
                  alt={item.title}
                  className="w-full rounded-2xl shadow-2xl object-cover"
                  style={{
                    aspectRatio: "2/3",
                    border: "1px solid rgba(255,255,255,0.1)",
                    transition: "transform 0.3s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                />

                {/* Play overlay — movies with a trailer only */}
                {item.trailer && (
                  <div
                    className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.45)" }}
                  >
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", border: "2px solid rgba(255,255,255,0.5)" }}
                    >
                      <Play size={20} fill="white" className="text-white ml-0.5" />
                    </div>
                  </div>
                )}

                <div
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg"
                  style={{ background: "rgba(20,20,20,0.9)", color: "white", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  {item.posterBadge}
                </div>
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function Dot() {
  return <span className="text-white/20 text-[10px]">•</span>;
}