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
  Ticket3DIllustration,
  Clapper3DIllustration,
  GlassSphere3D,
  Disco3DIllustration,
} from "../components/District3DGraphics";

import {
  X, Play, Clock, CalendarDays, Film, Globe, ShieldCheck, Ticket,
  PartyPopper, MapPin, Dumbbell, Trophy, ChevronLeft, ChevronRight,
  Sparkles,
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

  const DISTRICT_CATEGORIES = [
    {
      title: "Movies",
      tagline: "In Theatres & IMAX",
      to: "/now-showing",
      badge: "In Cinemas",
      emoji: "🎬",
      glow: "from-rose-500/20 to-orange-500/5",
      border: "hover:border-[#f0545c]/50",
    },
    {
      title: "Live Events",
      tagline: "Concerts & Comedy",
      to: "/events",
      badge: "Trending",
      emoji: "🎤",
      glow: "from-purple-500/20 to-pink-500/5",
      border: "hover:border-purple-500/50",
    },
    {
      title: "Play & Turfs",
      tagline: "Box Cricket & Sports",
      to: "/play",
      badge: "Instant Slots",
      emoji: "🏟️",
      glow: "from-emerald-500/20 to-teal-500/5",
      border: "hover:border-emerald-500/50",
    },
    {
      title: "Web Shows",
      tagline: "Series & Originals",
      to: "/web-shows",
      badge: "Binge Watch",
      emoji: "📺",
      glow: "from-blue-500/20 to-indigo-500/5",
      border: "hover:border-blue-500/50",
    },
    {
      title: "Offers & Deals",
      tagline: "Banking & Passes",
      to: "/offers",
      badge: "Up to 50% Off",
      emoji: "🎟️",
      glow: "from-amber-500/20 to-yellow-500/5",
      border: "hover:border-amber-500/50",
    },
  ];

  return (
    <div className="min-h-screen bg-[#090a10] text-[#f8fafc] selection:bg-[#f0545c] selection:text-white relative overflow-hidden">
      {/* Global Ambient Glow Auroras */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[700px] h-[450px] bg-[radial-gradient(ellipse_at_top,_rgba(240,84,92,0.16)_0%,_transparent_70%)] pointer-events-none blur-3xl" />
      <div className="absolute top-96 right-10 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.12)_0%,_transparent_70%)] pointer-events-none blur-3xl" />
      <div className="absolute top-[1600px] left-10 w-[550px] h-[550px] bg-[radial-gradient(circle,_rgba(245,158,11,0.08)_0%,_transparent_70%)] pointer-events-none blur-3xl" />

      <Navbar />
      <BottomNav />

      {/* ══ HERO BANNER ═══════════════════════════════════ */}
      <div
        className="relative overflow-hidden bg-[#090a10]"
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
      >
        {/* Floating 3D Background Decorative Illustrations */}
        <div className="absolute top-10 left-6 sm:left-12 pointer-events-none select-none opacity-80 animate-float-slow z-20 hidden md:block">
          <Ticket3DIllustration size={110} />
        </div>
        <div className="absolute top-16 right-8 sm:right-16 pointer-events-none select-none opacity-75 animate-float-reverse z-20 hidden md:block">
          <Clapper3DIllustration size={100} />
        </div>
        <div className="absolute bottom-16 right-1/4 pointer-events-none select-none opacity-50 animate-float-slow z-20 hidden lg:block">
          <GlassSphere3D size={68} color="coral" />
        </div>
        <div className="absolute top-1/2 left-8 pointer-events-none select-none opacity-40 animate-float-reverse z-20 hidden xl:block">
          <GlassSphere3D size={56} color="purple" />
        </div>

        {loading ? (
          <div
            className="w-full flex items-center justify-center bg-[#090a10]"
            style={{ height: "clamp(420px, 55vw, 580px)" }}
          >
            <div className="w-7 h-7 border-2 border-white/20 border-t-[#f0545c] rounded-full animate-spin" />
          </div>
        ) : slides.length === 0 ? (
          <div
            className="w-full flex flex-col items-center justify-center gap-2 text-center px-6 bg-[#090a10]"
            style={{ height: "clamp(340px, 40vw, 440px)" }}
          >
            <p className="text-white text-sm font-semibold">No featured premieres right now</p>
            <p className="text-slate-400 text-xs max-w-sm">
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
                  className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center bg-[#0e111a]/80 hover:bg-[#f0545c] border border-white/10 text-white transition-all cursor-pointer shadow-xl hover:scale-105 active:scale-95"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={nextSlide}
                  className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center bg-[#0e111a]/80 hover:bg-[#f0545c] border border-white/10 text-white transition-all cursor-pointer shadow-xl hover:scale-105 active:scale-95"
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
                      boxShadow: i === activeIdx ? "0 0 10px #f0545c" : "none",
                    }}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ DISTRICT CATEGORY QUICK-DISCOVERY BAR ═══════════ */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-8 md:px-12 -mt-6 sm:-mt-8 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {DISTRICT_CATEGORIES.map((cat) => (
            <Link
              key={cat.title}
              to={cat.to}
              className={`group relative overflow-hidden rounded-2xl bg-[#121520]/80 backdrop-blur-xl border border-white/[0.08] p-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.8),0_0_24px_rgba(240,84,92,0.18)] ${cat.border}`}
            >
              {/* Vibrant hover radial glow */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${cat.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
              />

              <div className="relative z-10 flex items-center justify-between gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-white/[0.06] border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-300">
                  <span>{cat.emoji}</span>
                </div>
                {cat.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.08] border border-white/10 text-slate-300 group-hover:text-white transition-colors">
                    {cat.badge}
                  </span>
                )}
              </div>

              <div className="relative z-10">
                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#f0545c] transition-colors leading-tight">
                  {cat.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
                  {cat.tagline}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ MAIN BODY CONTENT ══════════════════════════════ */}
      <div className="relative">
        {/* Subtle mid-page 3D disco & floating graphics */}
        <div className="absolute top-[850px] right-6 pointer-events-none select-none opacity-50 animate-float-slow z-0 hidden xl:block">
          <Disco3DIllustration size={105} />
        </div>
        <div className="absolute top-[1350px] left-6 pointer-events-none select-none opacity-45 animate-float-reverse z-0 hidden xl:block">
          <GlassSphere3D size={64} color="amber" />
        </div>

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
          filter: "brightness(0.35) blur(3px)",
          transform: "scale(1.08)",
        }}
      />

      {/* Subtle Vignette Scrim fading seamlessly to #090a10 */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#090a10] via-[#090a10]/80 to-transparent"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#090a10] via-transparent to-transparent"
      />

      {/* Slide Content */}
      <div className="relative z-10 h-full flex items-center px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
        <div className="flex items-center gap-10 lg:gap-14 w-full">

          {/* Left: Info */}
          <div className="flex-1 min-w-0 text-white max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-[#f0545c] bg-[#f0545c]/10 border border-[#f0545c]/25 px-2.5 py-1 rounded-full mb-3">
              <Sparkles size={11} className="text-[#f0545c]" />
              {item.tag}
            </span>

            <h1
              className="font-black leading-tight mb-3 tracking-tight text-white line-clamp-2"
              style={{ fontSize: "clamp(26px, 4.5vw, 48px)" }}
            >
              {item.title}
            </h1>

            {/* Metadata Line */}
            {item.meta?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-slate-300 text-xs font-medium mb-3">
                {item.meta.map((m, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-slate-600 mr-1">•</span>}
                    <span>{m.label}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {item.description && (
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 line-clamp-2 md:line-clamp-3 max-w-xl">
                {item.description}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link
                to={item.primaryCta.to}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#f0545c] hover:bg-[#d94048] shadow-[0_0_24px_rgba(240,84,92,0.45)] hover:shadow-[0_0_32px_rgba(240,84,92,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <span>{item.primaryCta.label}</span>
              </Link>

              {item.trailer && (
                <button
                  onClick={onPlay}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
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
                className="relative block rounded-2xl overflow-hidden ring-1 ring-white/20 shadow-[0_24px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(240,84,92,0.2)] group cursor-pointer aspect-[2/3] transition-all duration-300 hover:-translate-y-1"
              >
                <img
                  src={item.poster}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {item.trailer && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#f0545c] text-white shadow-[0_0_20px_#f0545c]">
                      <Play size={18} fill="white" className="ml-0.5" />
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
