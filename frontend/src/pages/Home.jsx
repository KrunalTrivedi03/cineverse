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
  PartyPopper, MapPin, Dumbbell, Trophy, ChevronLeft, ChevronRight,
  Sparkles,
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
    tag: m.status === "streaming" ? "Streaming Online" : "Now In Cinemas",
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
    tag: ev.category ? `Live Event · ${ev.category}` : "Live Experience",
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
    tag: "Sports Arena · Book Court",
    meta: [
      v.district?.name && { icon: MapPin, label: v.district.name },
      activityNames && { icon: Trophy, label: activityNames },
      v.startingPrice != null && { icon: Ticket, label: `₹${v.startingPrice} onwards` },
    ].filter(Boolean),
    description: v.description || "",
    poster: IMG(v.images?.[0]),
    background: IMG(v.images?.[0]),
    trailer: null,
    primaryCta: { label: "Book Slots", to: `/play/venues/${v._id}`, icon: Dumbbell },
    posterBadge: "Play Arena",
    posterLink: `/play/venues/${v._id}`,
  };
}

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

  useEffect(() => {
    if (slides.length <= 1) return;
    autoplayRef.current = setInterval(() => {
      if (pausedRef.current) return;
      setActiveIdx((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(autoplayRef.current);
  }, [slides.length]);

  const goTo = (i) => {
    setActiveIdx(i);
    clearInterval(autoplayRef.current);
    if (slides.length > 1) {
      autoplayRef.current = setInterval(() => {
        if (pausedRef.current) return;
        setActiveIdx((i2) => (i2 + 1) % slides.length);
      }, 6000);
    }
  };

  const nextSlide = () => {
    goTo((activeIdx + 1) % slides.length);
  };

  const prevSlide = () => {
    goTo((activeIdx - 1 + slides.length) % slides.length);
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
    <div className="min-h-screen bg-[#0e0f14] text-slate-100 selection:bg-[#f0545c] selection:text-white">
      <Navbar />
      <BottomNav />

      {/* ══ HERO BANNER ═══════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{ background: "#0a0b10" }}
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
      >
        {loading ? (
          <div
            className="w-full flex flex-col items-center justify-center gap-3"
            style={{ height: "clamp(460px, 60vw, 640px)", background: "#0e1017" }}
          >
            <div className="flex gap-2.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-3 h-3 rounded-full animate-bounce"
                  style={{
                    background: "linear-gradient(135deg, #f0545c 0%, #ff8088 100%)",
                    animationDelay: `${i * 0.15}s`,
                    boxShadow: "0 0 12px rgba(240,84,92,0.6)",
                  }}
                />
              ))}
            </div>
            <span className="text-[12px] font-bold tracking-widest uppercase text-white/40">
              Loading Premiere Spotlights
            </span>
          </div>
        ) : slides.length === 0 ? (
          <div
            className="w-full flex flex-col items-center justify-center gap-2.5 text-center px-6"
            style={{ height: "clamp(360px, 42vw, 480px)", background: "#0e1017" }}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/30 mb-1 border border-white/10">
              <Sparkles size={22} />
            </div>
            <p className="text-white/80 text-[16px] font-bold">Nothing to feature here yet</p>
            <p className="text-white/40 text-[13px] max-w-sm">
              Check back soon, or choose a district to explore local live events and sports arenas.
            </p>
          </div>
        ) : (
          <div className="relative w-full overflow-hidden" style={{ height: "clamp(460px, 62vw, 640px)" }}>
            {slides.map((item, i) => (
              <div
                key={item.key}
                className="absolute inset-0"
                style={{
                  opacity: i === activeIdx ? 1 : 0,
                  zIndex: i === activeIdx ? 2 : 1,
                  pointerEvents: i === activeIdx ? "auto" : "none",
                  transition: "opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s ease",
                  transform: i === activeIdx ? "scale(1)" : "scale(1.03)",
                }}
                aria-hidden={i !== activeIdx}
              >
                <HeroSlide item={item} onPlay={() => openTrailer(item.trailer)} />
              </div>
            ))}

            {/* Prev / Next Slide Nav Arrows */}
            {slides.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full items-center justify-center backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white shadow-xl transition-all hover:scale-110 active:scale-95 group"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft size={20} className="transition-transform group-hover:-translate-x-0.5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full items-center justify-center backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white shadow-xl transition-all hover:scale-110 active:scale-95 group"
                  aria-label="Next Slide"
                >
                  <ChevronRight size={20} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </>
            )}

            {/* Bottom Controls / Slide Navigation Bar */}
            {slides.length > 1 && !loading && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 backdrop-blur-xl bg-black/40 px-4 py-2 rounded-full border border-white/10 shadow-2xl">
                <span className="text-[11px] font-mono font-bold text-white/50 tracking-wider">
                  0{activeIdx + 1}
                </span>

                <div className="flex items-center gap-1.5">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      className="transition-all duration-300 rounded-full relative overflow-hidden"
                      style={{
                        width: i === activeIdx ? 28 : 8,
                        height: 7,
                        background: i === activeIdx ? "#f0545c" : "rgba(255,255,255,0.25)",
                        boxShadow: i === activeIdx ? "0 0 10px rgba(240,84,92,0.7)" : "none",
                      }}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>

                <span className="text-[11px] font-mono font-bold text-white/30 tracking-wider">
                  0{slides.length}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ MAIN BODY CONTENT (MODERN LIGHT BACKGROUND) ══════════════ */}
      <div className="bg-[#f8f9fb] text-gray-900 border-t border-white/10 transition-colors">
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
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}
          onClick={closeTrailer}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "scaleUp 0.24s cubic-bezier(.16,1,.3,1) both" }}
          >
            <div className="flex items-center justify-between pb-3">
              <span className="flex items-center gap-2 text-[13px] font-bold text-white/80 uppercase tracking-wider">
                <Play size={14} className="text-[#f0545c]" fill="#f0545c" /> Official Preview Trailer
              </span>
              <button
                onClick={closeTrailer}
                className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-semibold px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/10"
              >
                <X size={15} /> Close
              </button>
            </div>
            
            <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20 bg-black">
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
              from { opacity: 0; transform: scale(0.92); }
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
      {/* Blurred Cinematic Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: item.background ? `url(${item.background})` : undefined,
          background: item.background ? undefined : "linear-gradient(135deg,#0a0b10,#1a1c26)",
          backgroundSize: "cover",
          backgroundPosition: "center 25%",
          filter: "brightness(0.25) saturate(1.4) blur(1px)",
          transform: "scale(1.08)",
        }}
      />

      {/* Multi-layered Left Vignette Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(100deg, rgba(10,11,16,0.98) 0%, rgba(10,11,16,0.85) 45%, rgba(10,11,16,0.25) 100%)",
        }}
      />

      {/* Ambient Radial Coral Glow */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none opacity-25"
        style={{
          background: "radial-gradient(circle, #f0545c 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* Bottom transition into content */}
      <div
        className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, #0a0b10 85%, #f8f9fb 100%)" }}
      />

      {/* Slide Content */}
      <div className="relative z-10 h-full flex items-center px-6 md:px-14 lg:px-20 max-w-7xl mx-auto">
        <div className="flex items-center gap-10 md:gap-14 lg:gap-16 w-full">

          {/* Left: Text & Actions */}
          <div className="flex-1 min-w-0 text-white">
            
            {/* Tag pill with glow */}
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold tracking-widest uppercase px-3.5 py-1.5 rounded-full mb-4 border border-[#f0545c]/35 backdrop-blur-md bg-[#f0545c]/15 text-[#ff6e75] shadow-[0_0_15px_rgba(240,84,92,0.25)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f0545c] animate-ping" />
              <span>{item.tag}</span>
            </div>

            <h1
              className="font-black leading-[1.08] mb-3.5 tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] line-clamp-2"
              style={{ fontSize: "clamp(30px, 5vw, 56px)" }}
            >
              {item.title}
            </h1>

            {/* Meta Row: Badges with Icons */}
            {item.meta?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-white/70 text-[12.5px] font-semibold mb-4">
                {item.meta.map((m, i) => {
                  const MetaIcon = m.icon;
                  return (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md bg-white/10 border border-white/10 text-white/85 text-[12px] shadow-xs"
                    >
                      <MetaIcon size={13} className="text-[#f0545c]" />
                      <span>{m.label}</span>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Description */}
            {item.description && (
              <p
                className="text-white/65 leading-relaxed mb-7 line-clamp-2 md:line-clamp-3 text-[14px] md:text-[15px]"
                style={{ maxWidth: 520 }}
              >
                {item.description}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5">
              <Link
                to={item.primaryCta.to}
                className="flex items-center gap-2.5 font-bold px-7 py-3 rounded-2xl text-[14px] text-white transition-all shadow-[0_8px_25px_-4px_rgba(240,84,92,0.5)] hover:shadow-[0_12px_32px_-4px_rgba(240,84,92,0.7)] hover:-translate-y-0.5 active:translate-y-0"
                style={{ background: "linear-gradient(135deg, #f0545c 0%, #e03a43 100%)" }}
              >
                <item.primaryCta.icon size={16} />
                <span>{item.primaryCta.label}</span>
              </Link>

              {item.trailer && (
                <button
                  onClick={onPlay}
                  className="flex items-center gap-2 font-bold px-6 py-3 rounded-2xl text-[14px] transition-all backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 hover:text-white shadow-md active:scale-95 group"
                >
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <Play size={11} fill="white" className="ml-0.5" />
                  </div>
                  <span>Watch Trailer</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Floating Cinema Poster */}
          {item.poster && (
            <div className="flex-shrink-0 hidden sm:block">
              <Link
                to={item.posterLink}
                className="relative group cursor-pointer block transform transition-all duration-300 hover:-translate-y-2"
                style={{ width: "clamp(150px, 15vw, 220px)" }}
              >
                <div className="relative rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/15 ring-1 ring-white/10">
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ aspectRatio: "2/3" }}
                  />

                  {/* Play Overlay if Trailer is available */}
                  {item.trailer && (
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/45 backdrop-blur-[2px]"
                    >
                      <div className="w-13 h-13 rounded-full flex items-center justify-center bg-[#f0545c] text-white shadow-xl shadow-[#f0545c]/50 transform transition-transform group-hover:scale-110">
                        <Play size={20} fill="white" className="ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Floating Poster Badge */}
                <div
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10.5px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg backdrop-blur-md bg-black/85 text-white border border-white/20 group-hover:border-[#f0545c]/50 group-hover:text-[#ff787f] transition-colors"
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
