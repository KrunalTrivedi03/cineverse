import { useRef, useEffect, useState, useCallback } from "react";
import {
  BellPlus,
  BellRing,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Globe,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ComingSoon() {
  const sliderRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchUpcoming = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwt") ||
        "";

      const res = await fetch(import.meta.env.VITE_API_URL + "/api/movies?status=upcoming", {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      setMovies(data.filter((m) => m.status === "upcoming"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  // ── Scroll arrows ────────────────────────────────────────────────
  const check = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    const timer = setTimeout(check, 100);
    el.addEventListener("scroll", check);
    window.addEventListener("resize", check);
    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [movies, check]);

  const scroll = (dir) =>
    sliderRef.current?.scrollBy({
      left: dir === "left" ? -880 : 880,
      behavior: "smooth",
    });

  // ── Helpers ──────────────────────────────────────────────────────
  const formatReleaseDate = (dateStr) => {
    if (!dateStr) return "TBA";
    const d = new Date(dateStr);
    if (isNaN(d)) return "TBA";
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  const getPosterUrl = (poster) => {
    if (!poster) return null;
    if (poster.startsWith("http")) return poster;
    const base = import.meta.env.VITE_API_URL;
    return `${base}${poster}`;
  };

  const SectionWrapper = ({ children, showSeeAll = false }) => (
    <section className="w-full px-4 sm:px-8 md:px-14 py-10 md:py-14 bg-[#f8fafc] border-b border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 text-[11px] font-extrabold uppercase tracking-widest mb-2 border border-orange-500/20">
              <CalendarDays size={12} />
              <span>Coming Soon</span>
            </div>
            <h2 className="text-[22px] sm:text-[26px] font-black text-gray-900 tracking-tight">
              Upcoming Premieres
            </h2>
            {!!movies.length && (
              <p className="text-[13px] text-gray-500 mt-1 font-medium">
                {movies.length} blockbuster release{movies.length !== 1 ? "s" : ""} on the radar
              </p>
            )}
          </div>
          {showSeeAll && (
            <button
              className="flex items-center gap-1 text-[#f0545c] hover:text-[#d94048] text-[13.5px] font-bold group transition-all"
              onClick={() => navigate("/coming-soon")}
            >
              <span>Explore All Upcoming</span>
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>
        {children}
      </div>
    </section>
  );

  if (loading) {
    return (
      <SectionWrapper>
        <div className="flex gap-5 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[220px] sm:w-[240px] animate-pulse">
              <div
                className="rounded-2xl bg-gray-200"
                style={{ aspectRatio: "2/3" }}
              />
              <div className="mt-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="flex gap-1.5 mt-2">
                  <div className="h-5 bg-gray-200 rounded-full w-14" />
                  <div className="h-5 bg-gray-200 rounded-full w-16" />
                </div>
                <div className="h-9 bg-gray-200 rounded-xl mt-3" />
              </div>
            </div>
          ))}
        </div>
      </SectionWrapper>
    );
  }

  // ── Error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <SectionWrapper>
        <div className="flex flex-col items-center justify-center h-44 gap-3 bg-white rounded-3xl border border-gray-100 p-6 text-center shadow-xs">
          <AlertCircle size={32} className="text-red-400" />
          <p className="text-[14px] font-bold text-gray-700">Unable to load upcoming movies.</p>
          <button
            onClick={fetchUpcoming}
            className="text-[12.5px] font-bold px-4 py-2 rounded-xl text-white transition-all shadow-md shadow-[#f0545c]/25 hover:shadow-lg"
            style={{ background: "linear-gradient(135deg, #f0545c 0%, #e03a43 100%)" }}
          >
            Retry Connection
          </button>
        </div>
      </SectionWrapper>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────
  if (!movies.length) {
    return (
      <SectionWrapper>
        <div className="flex flex-col items-center justify-center h-44 gap-2 rounded-3xl border border-dashed border-gray-200 bg-white/70 text-center p-6">
          <CalendarDays size={32} className="text-gray-300" />
          <p className="text-[14px] font-bold text-gray-500">No upcoming titles announced right now.</p>
          <p className="text-[12px] text-gray-400">Check back soon for new teasers and release schedules!</p>
        </div>
      </SectionWrapper>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────
  return (
    <SectionWrapper showSeeAll>
      <div className="relative group/slider">
        {canLeft && (
          <ArrowBtn dir="left" onClick={() => scroll("left")} style={{ left: -18, top: "42%" }} />
        )}

        <div
          ref={sliderRef}
          className="flex gap-5 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth"
        >
          {movies.map((movie) => (
            <MovieCard
              key={movie._id}
              movie={movie}
              formatReleaseDate={formatReleaseDate}
              getPosterUrl={getPosterUrl}
              onView={() => navigate(`/movie/${movie._id}`)}
            />
          ))}
        </div>

        {canRight && (
          <ArrowBtn dir="right" onClick={() => scroll("right")} style={{ right: -18, top: "42%" }} />
        )}
      </div>
    </SectionWrapper>
  );
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const diff = Math.ceil((d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
  return diff >= 0 ? diff : null;
}

/* ─── Card ───────────────────────────────────────────────────────── */
function MovieCard({ movie, onView, formatReleaseDate, getPosterUrl }) {
  const [notified, setNotified] = useState(false);
  const [imgError, setImgError] = useState(false);

  const genres = Array.isArray(movie.genre)
    ? movie.genre.map((g) => g.trim()).filter(Boolean)
    : typeof movie.genre === "string"
    ? movie.genre.split(",").map((g) => g.trim()).filter(Boolean)
    : [];

  const posterUrl = getPosterUrl(movie.poster);
  const daysLeft = daysUntil(movie.releaseDate);

  return (
    <div className="flex-shrink-0 w-[210px] sm:w-[230px] group card-hover-lift">
      {/* Poster */}
      <div
        className="relative rounded-2xl overflow-hidden bg-gray-100 shadow-md cursor-pointer transition-all duration-300 border border-gray-100"
        style={{ aspectRatio: "2/3" }}
        onClick={onView}
      >
        {posterUrl && !imgError ? (
          <img
            src={posterUrl}
            alt={movie.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 gap-2 p-4">
            <span className="text-gray-400 text-[12px] font-bold text-center leading-snug">
              {movie.title}
            </span>
          </div>
        )}

        {/* Releasing ribbon */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 px-3 py-2.5"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
          }}
        >
          <CalendarDays size={12} className="text-orange-400 flex-shrink-0" />
          <span className="text-white text-[11.5px] font-bold">
            {formatReleaseDate(movie.releaseDate)}
          </span>
        </div>

        {/* Days left badge */}
        <div
          className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-md"
          style={{ background: "rgba(234,88,12,0.92)", color: "white" }}
        >
          {daysLeft != null ? (daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft}d to go`) : "Upcoming"}
        </div>

        {/* Certificate badge */}
        {movie.certificate && (
          <div
            className="absolute top-2.5 left-2.5 text-[10px] font-black px-2 py-0.5 rounded-md backdrop-blur-md bg-black/60 text-white/90 border border-white/10"
          >
            {movie.certificate}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-3 px-1">
        <h3
          className="text-[14.5px] font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-[#f0545c] transition-colors cursor-pointer"
          onClick={onView}
          title={movie.title}
        >
          {movie.title}
        </h3>

        {/* Language + Duration */}
        <div className="flex items-center gap-1.5 mt-0.5 text-[12px] font-medium text-gray-500">
          <Globe size={11} className="text-gray-400" />
          <span className="line-clamp-1">{movie.language || "Multi-Language"}</span>
          {movie.duration && (
            <>
              <span className="text-gray-300">•</span>
              <span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>
            </>
          )}
        </div>

        {/* Genre pills */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {genres.slice(0, 3).map((g, i) => (
              <span
                key={i}
                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-700 border border-orange-500/20"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={onView}
            className="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all border border-[#f0545c]/25 bg-[#f0545c]/5 text-[#f0545c] hover:bg-[#f0545c] hover:text-white hover:border-[#f0545c] shadow-2xs"
          >
            View Details
          </button>

          <button
            onClick={() => setNotified((p) => !p)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all border ${
              notified
                ? "border-orange-500 bg-orange-500 text-white shadow-xs"
                : "border-gray-200 bg-white text-gray-500 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50/50"
            }`}
            title={notified ? "Reminder enabled" : "Set reminder"}
          >
            {notified ? <BellRing size={14} /> : <BellPlus size={14} />}
          </button>
        </div>
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
