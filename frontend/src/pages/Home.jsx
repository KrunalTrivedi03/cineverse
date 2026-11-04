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
import PageBackgroundWatermark from "../components/PageBackgroundWatermark";
import PageLoader from "../components/PageLoader";
import { HeroBannerArt } from "../components/CinemaIllustrations";

import {
  X, Play, Clock, CalendarDays, Film, Globe, ShieldCheck, Ticket,
  PartyPopper, MapPin, Dumbbell, Trophy, ChevronLeft, ChevronRight,
  Tv, Tag, Sparkles,
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

  const CATEGORIES = [
    {
      title: "Movies",
      to: "/now-showing",
      icon: Film,
      active: true,
    },
    {
      title: "Shows",
      to: "/web-shows",
      icon: Tv,
    },
    {
      title: "Events",
      to: "/events",
      icon: CalendarDays,
    },
    {
      title: "Play",
      to: "/play",
      icon: Trophy,
    },
    {
      title: "Offers",
      to: "/offers",
      icon: Tag,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-neutral-900 selection:bg-[#ff4d58] selection:text-white relative overflow-hidden">
      {/* Subtle curved filmstrip background watermark (Image 2 highlighted) */}
      <PageBackgroundWatermark variant="movies" />

      {/* Light-theme full page loading screen */}
      {loading && <PageLoader text="Loading featured cinema premieres and experiences..." />}

      <Navbar />
      <BottomNav />

      {/* ══ HERO BANNER (Image 1 Top-Left) ═════════════════ */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div
          className="relative rounded-3xl sm:rounded-[36px] overflow-hidden bg-gradient-to-r from-[#fff4f5] via-[#fff1f3] to-[#fef6f2] border border-rose-100 shadow-[0_10px_30px_rgba(255,77,88,0.06)]"
          onMouseEnter={() => (pausedRef.current = true)}
          onMouseLeave={() => (pausedRef.current = false)}
        >
          {slides.length === 0 && !loading ? (
            <div className="w-full flex flex-col items-center justify-center gap-2 text-center py-24 px-6">
              <p className="text-neutral-900 text-base font-bold">No featured premieres right now</p>
              <p className="text-neutral-500 text-xs max-w-sm">
                Explore showtimes by choosing your city or district in the navigation bar above.
              </p>
            </div>
          ) : (
            <div className="relative w-full overflow-hidden" style={{ minHeight: "clamp(340px, 44vw, 460px)" }}>
              {slides.map((item, i) => (
                <div
                  key={item.key}
                  className="absolute inset-0"
                  style={{
                    opacity: i === activeIdx ? 1 : 0,
                    zIndex: i === activeIdx ? 2 : 1,
                    pointerEvents: i === activeIdx ? "auto" : "none",
                    transition: "opacity 0.6s ease",
                  }}
                  aria-hidden={i !== activeIdx}
                >
                  <HeroSlide item={item} onPlay={() => openTrailer(item.trailer)} />
                </div>
              ))}

              {/* Prev / Next Slide Nav Arrows (Floating White Buttons) */}
              {slides.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full items-center justify-center bg-white/95 hover:bg-white shadow-md border border-neutral-100 text-neutral-700 hover:text-black hover:scale-105 active:scale-95 transition-all cursor-pointer flex"
                    aria-label="Previous Slide"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full items-center justify-center bg-white/95 hover:bg-white shadow-md border border-neutral-100 text-neutral-700 hover:text-black hover:scale-105 active:scale-95 transition-all cursor-pointer flex"
                    aria-label="Next Slide"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {/* Bottom Dots Indicator (Mockup Style) */}
              {slides.length > 1 && !loading && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      className="rounded-full transition-all duration-300 cursor-pointer"
                      style={{
                        width: i === activeIdx ? 24 : 6,
                        height: 6,
                        background: i === activeIdx ? "#ff4d58" : "rgba(0,0,0,0.15)",
                      }}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ══ CATEGORY QUICK DISCOVERY BAR (Image 1 Mockup) ════ */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.title}
                to={cat.to}
                className={`flex flex-col items-center justify-center py-4 px-3 rounded-2xl transition-all duration-200 cursor-pointer shadow-xs ${
                  cat.active
                    ? "bg-[#fff0f2] border border-[#ff4d58]/30 text-[#ff4d58]"
                    : "bg-white border border-neutral-150/80 text-neutral-700 hover:bg-neutral-50/80 hover:border-neutral-200 hover:shadow-sm"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 transition-colors ${
                    cat.active ? "text-[#ff4d58]" : "text-neutral-600"
                  }`}
                >
                  <Icon size={22} strokeWidth={cat.active ? 2.3 : 1.9} />
                </div>
                <span
                  className={`text-[13px] tracking-tight ${
                    cat.active ? "font-bold text-[#ff4d58]" : "font-semibold text-neutral-800"
                  }`}
                >
                  {cat.title}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ══ MAIN BODY CONTENT ══════════════════════════════ */}
      <div className="relative z-10">
        <LatestMovies />
        <OffersBanner />
        <ComingSoon />
        <Events />
        <PlayHome />
      </div>

      {/* ══ FOOTER ════════════════════════════════════════ */}
      <Footer />

      {/* ══ TRAILER MODAL ═════════════════════════════════ */}
      {trailerUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={closeTrailer}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Official Trailer
              </span>
              <button
                onClick={closeTrailer}
                className="flex items-center gap-1 text-white/80 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
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
    <div className="relative w-full h-full flex items-center px-6 sm:px-10 lg:px-14 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 lg:gap-10 w-full">

        {/* Left: Info */}
        <div className="flex-1 min-w-0 text-neutral-900 max-w-xl">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-[#ff4d58] bg-[#ff4d58]/10 px-3 py-1 rounded-full mb-3">
            {item.tag}
          </span>

          <h1
            className="font-black leading-tight mb-2.5 tracking-tight text-neutral-900 line-clamp-2"
            style={{ fontSize: "clamp(26px, 4vw, 44px)" }}
          >
            {item.title}
          </h1>

          {/* Subtitle / Description */}
          {item.description && (
            <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed mb-3 line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Metadata Line */}
          {item.meta?.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-neutral-500 text-xs font-semibold mb-6">
              {item.meta.map((m, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-neutral-400 mr-1">•</span>}
                  <span>{m.label}</span>
                </span>
              ))}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to={item.primaryCta.to}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl text-sm font-bold text-white bg-[#ff4d58] hover:bg-[#e03d47] shadow-md shadow-[#ff4d58]/20 transition-all active:scale-95 cursor-pointer"
            >
              <span>{item.primaryCta.label}</span>
            </Link>

            {item.trailer && (
              <button
                onClick={onPlay}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-neutral-800 bg-white hover:bg-neutral-50 border border-neutral-200/80 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Play size={15} fill="#ff4d58" className="text-[#ff4d58]" />
                <span>Watch Trailer</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Pastel Artwork Composition (Mockup Top-Left) */}
        <div className="flex-shrink-0 hidden md:flex items-center justify-center">
          <HeroBannerArt className="w-56 h-48 lg:w-72 lg:h-60" />
        </div>

      </div>
    </div>
  );
}
