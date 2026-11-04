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
} from "lucide-react";
import OffersBanner from "../components/OffersBanner";
import BottomNav from "../components/BottomNav";

const IMG = (path) => (!path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`);

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
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-[#f0545c] selection:text-white">
      <Navbar />
      <BottomNav />

      {/* ══ HERO BANNER ═══════════════════════════════════ */}
      <div
        className="relative overflow-hidden bg-[#0c0d12]"
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
      >
        {loading ? (
          <div
            className="w-full flex items-center justify-center bg-[#0c0d12]"
            style={{ height: "clamp(420px, 55vw, 580px)" }}
          >
            <div className="w-6 h-6 border-2 border-white/20 border-t-[#f0545c] rounded-full animate-spin" />
          </div>
        ) : slides.length === 0 ? (
          <div
            className="w-full flex flex-col items-center justify-center gap-2 text-center px-6 bg-[#0c0d12]"
            style={{ height: "clamp(340px, 40vw, 440px)" }}
          >
            <p className="text-white text-sm font-semibold">No featured premieres right now</p>
            <p className="text-neutral-500 text-xs max-w-sm">
              Explore showtimes by choosing your city or district above.
            </p>
          </div>
        ) : (
          <div className="relative w-full overflow-hidden" style={{ height: "clamp(440px, 55vw, 600px)" }}>
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

            {/* Prev / Next Slide Nav Arrows */}
            {slides.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center bg-black/40 hover:bg-black/70 border border-white/10 text-white transition-all cursor-pointer"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={nextSlide}
                  className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center bg-black/40 hover:bg-black/70 border border-white/10 text-white transition-all cursor-pointer"
                  aria-label="Next Slide"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            {/* Bottom Dots Indicator */}
            {slides.length > 1 && !loading && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="rounded-full transition-all duration-300 cursor-pointer"
                    style={{
                      width: i === activeIdx ? 24 : 6,
                      height: 5,
                      background: i === activeIdx ? "#f0545c" : "rgba(255,255,255,0.3)",
                    }}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ MAIN BODY CONTENT ══════════════════════════════ */}
      <div>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={closeTrailer}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Official Trailer
              </span>
              <button
                onClick={closeTrailer}
                className="flex items-center gap-1 text-neutral-400 hover:text-white text-xs font-medium px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X size={14} /> Close
              </button>
            </div>
            
            <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black aspect-video">
              <iframe
                width="100%"
                height="100%"
                className="w-full h-full block"
                src={trailerUrl}
                title="Trailer"
                allow="autoplay; fullscreen; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HeroSlide({ item, onPlay }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Blurred Backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: item.background ? `url(${item.background})` : undefined,
          filter: "brightness(0.3) blur(2px)",
          transform: "scale(1.05)",
        }}
      />

      {/* Subtle Vignette Scrim */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#0c0d12] via-[#0c0d12]/80 to-transparent"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#0c0d12] via-transparent to-transparent"
      />

      {/* Slide Content */}
      <div className="relative z-10 h-full flex items-center px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
        <div className="flex items-center gap-10 lg:gap-14 w-full">

          {/* Left: Info */}
          <div className="flex-1 min-w-0 text-white max-w-2xl">
            <span className="inline-block text-[11px] font-semibold tracking-wider uppercase text-neutral-400 mb-2">
              {item.tag}
            </span>

            <h1
              className="font-bold leading-tight mb-3 tracking-tight text-white line-clamp-2"
              style={{ fontSize: "clamp(26px, 4.5vw, 48px)" }}
            >
              {item.title}
            </h1>

            {/* Metadata Line */}
            {item.meta?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-neutral-300 text-xs font-medium mb-3">
                {item.meta.map((m, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-neutral-600 mr-1">•</span>}
                    <span>{m.label}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {item.description && (
              <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed mb-6 line-clamp-2 md:line-clamp-3 max-w-xl">
                {item.description}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link
                to={item.primaryCta.to}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#f0545c] hover:bg-[#d94048] transition-colors shadow-sm cursor-pointer"
              >
                <span>{item.primaryCta.label}</span>
              </Link>

              {item.trailer && (
                <button
                  onClick={onPlay}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                >
                  <Play size={14} fill="white" />
                  <span>Watch Trailer</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Clean Cinema Poster */}
          {item.poster && (
            <div className="flex-shrink-0 hidden md:block w-48 lg:w-56">
              <Link
                to={item.posterLink}
                className="relative block rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 group cursor-pointer aspect-[2/3]"
              >
                <img
                  src={item.poster}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {item.trailer && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[#f0545c] text-white shadow-lg">
                      <Play size={16} fill="white" className="ml-0.5" />
                    </div>
                  </div>
                )}
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
