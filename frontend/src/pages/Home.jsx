import { movieImage as IMG } from "../utils/movieImage";
import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DiscoveryHeading from "../components/DiscoveryHeading";
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
  PartyPopper, MapPin, Dumbbell, Trophy, ArrowUpRight, Pause, ChevronLeft, ChevronRight, Tv,
} from "lucide-react";
import OffersBanner from "../components/OffersBanner";
import BottomNav from "../components/BottomNav";
import Dialog from "../components/Dialog";

/* ─── Helpers ─────────────────────────────────────────── */
const CATEGORIES = [
  { label: "Movies", note: "In cinemas", to: "/now-showing", icon: Film },
  { label: "Shows", note: "Web series", to: "/web-shows", icon: Tv },
  { label: "Live events", note: "Find tickets", to: "/events", icon: CalendarDays },
  { label: "Play", note: "Book a venue", to: "/play", icon: Trophy },
];


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
  const [autoplay, setAutoplay] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
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
    if (slides.length <= 1 || !autoplay) return;
    autoplayRef.current = setInterval(() => {
      if (pausedRef.current) return;
      setActiveIdx((i) => (i + 1) % slides.length);
    }, 5500);
    return () => clearInterval(autoplayRef.current);
  }, [slides.length, autoplay]);

  const goTo = (i) => {
    setActiveIdx(i);
    // Restart the autoplay clock so a manual click doesn't get immediately
    // overridden by a timer that was already halfway through its interval.
    clearInterval(autoplayRef.current);
    if (slides.length > 1 && autoplay) {
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

  return (
    <div className="min-h-screen bg-now-canvas" style={{ fontFamily: "var(--now-ui-font)" }}>

      <a href="#main-content" className="now-skip">Skip to content</a>
      <Navbar />
      <BottomNav />

      <main id="main-content" tabIndex={-1}>
      <div className="now-home-intro">
        <h1>Find your next plan</h1>
        <p>Explore what?s on near you.</p>
      </div>
      <nav className="now-discovery-categories" aria-label="Explore entertainment">
        {CATEGORIES.map(({ label, to, icon, note }) => {
          const Icon = icon;
          return (
            <Link to={to} key={to} data-category={label}>
              <span className="now-discovery-category-icon"><Icon size={24} aria-hidden="true" /></span>
              <span className="now-discovery-category-label"><strong>{label}</strong><small>{note}</small></span>
              <ArrowUpRight size={16} className="now-category-arrow" aria-hidden="true" />
            </Link>
          );
        })}
      </nav>
      <div className="now-featured-section">
        <DiscoveryHeading title="Featured on NOW" />
      <section
        className="now-hero"
        aria-label="Featured entertainment"
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
        onFocus={() => (pausedRef.current = true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget) && !trailerUrl) pausedRef.current = false;
        }}
      >
        {loading ? (
          <div role="status" className="now-discovery-loading flex items-center justify-center">
            <span className="sr-only">Loading featured entertainment</span>
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full animate-bounce"
                  style={{ background: "#106579", animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        ) : slides.length === 0 ? (
          <div className="now-hero-blank now-discovery-empty">
            <div>
              <h2 className="now-hero-title max-w-[12ch]">Make plans worth going out for.</h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-500 sm:text-base">Browse movies, discover live events and find places to play near you.</p>
              <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
                <Link className="now-primary" to="/now-showing">Find movies <ArrowUpRight size={16} /></Link>
                <Link className="now-secondary" to="/events">Explore events</Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="now-discovery-stage">
            {slides.map((item, i) => (
              <div
                key={item.key}
                className="now-discovery-slide"
                style={{
                  opacity: i === activeIdx ? 1 : 0,
                  zIndex: i === activeIdx ? 2 : 1,
                  pointerEvents: i === activeIdx ? "auto" : "none",
                  transition: "opacity 0.7s ease",
                }}
                aria-hidden={i !== activeIdx}
                inert={i !== activeIdx}
              >
                <HeroSlide item={item} onPlay={() => openTrailer(item.trailer)} />
              </div>
            ))}
          </div>
        )}

        {/* Dot indicators */}
        {slides.length > 1 && !loading && (
          <div className="now-discovery-controls">
            <button type="button" onClick={() => goTo((activeIdx + slides.length - 1) % slides.length)} aria-label="Previous featured item"><ChevronLeft size={18} /></button>
            <div className="now-discovery-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Show ${slides[i].title}`}
                aria-current={i === activeIdx ? "true" : undefined}
                className="now-discovery-dot"
              >
                <span className={i === activeIdx ? "h-1.5 w-6 rounded-full bg-now-accent" : "size-1.5 rounded-full bg-now-accent/40"} />
              </button>
            ))}
            </div>
            <button type="button" onClick={() => goTo((activeIdx + 1) % slides.length)} aria-label="Next featured item"><ChevronRight size={18} /></button>
            <button
              type="button"
              onClick={() => setAutoplay((enabled) => !enabled)}
              aria-label={autoplay ? "Pause featured slides" : "Play featured slides"}
            >
              {autoplay ? <Pause size={15} /> : <Play size={15} />}
            </button>
          </div>
        )}
      </section>
      </div>

      {/* ══ LIGHT CONTENT ═════════════════════════════════ */}

      <div className="now-home-content">
        <LatestMovies />
        <Events />
        <PlayHome />
        <ComingSoon />
        <OffersBanner />
      </div>
      </main>

      {/* ══ FOOTER ════════════════════════════════════════ */}
      <Footer />

      {/* ══ TRAILER MODAL ═════════════════════════════════ */}
      {trailerUrl && (
        <Dialog variant="video" label="Watch trailer" onDismiss={closeTrailer}>
          <div
            className="p-3 sm:p-4"
          >
            <button
              onClick={closeTrailer}
              className="ml-auto mb-2 flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-white/85 hover:bg-white/10 text-sm transition-colors"
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
        </Dialog>
      )}
    </div>
  );
}

/* ─── Single Hero Slide (Movie / Event / Play) ────────── */
function HeroSlide({ item, onPlay }) {
  const PrimaryIcon = item.primaryCta.icon;
  return (
    <div className="now-feature">
      <div className="now-feature-art" data-has-poster={Boolean(item.poster)}>
        {item.poster && (
          <>
            <img className="now-feature-backdrop" src={item.background} alt="" />
            <Link className="now-feature-poster" to={item.posterLink} aria-label={item.title}>
              <img src={item.poster} alt="" />
            </Link>
          </>
        )}
      </div>
      <div className="now-feature-copy">
        <span className="now-feature-tag">{item.tag}</span>
        <h2 className="now-feature-title">{item.title}</h2>
        {!!item.meta?.length && (
          <ul className="now-feature-meta">
            {item.meta.map(({ icon, label }, index) => {
              const Icon = icon;
              return <li key={index}><Icon size={14} aria-hidden="true" />{label}</li>;
            })}
          </ul>
        )}
        {item.description && <p className="now-feature-description">{item.description}</p>}
        <div className="now-feature-actions">
          <Link to={item.primaryCta.to} className="now-primary"><PrimaryIcon size={16} /> {item.primaryCta.label}</Link>
          {item.trailer && (
            <button type="button" onClick={onPlay} className="now-secondary"><Play size={14} fill="currentColor" /> Watch trailer</button>
          )}
        </div>
      </div>
    </div>
  );
}
