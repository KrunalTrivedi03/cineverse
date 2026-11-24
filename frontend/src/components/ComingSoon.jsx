import { useRef, useEffect, useState, useCallback } from "react";
import { BellPlus, ChevronRight, ChevronLeft, CalendarDays, Globe, Loader2, AlertCircle } from "lucide-react";
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
    // Small delay so DOM has rendered the cards
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
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  };

  const getPosterUrl = (poster) => {
    if (!poster) return null;
    if (poster.startsWith("http")) return poster;
    const base = import.meta.env.VITE_API_URL;
    return `${base}${poster}`;
  };

  const SectionWrapper = ({ children, showSeeAll = false }) => (
    <section className="w-full px-6 md:px-14 py-10 bg-now-canvas border-t border-gray-100">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-4.5 h-4.5 rounded-full flex items-center justify-center" style={{ background: "rgba(234,88,12,0.12)" }}>
              <CalendarDays size={10} style={{ color: "#ea580c" }} />
            </span>
            <p className="text-[10.5px] font-bold uppercase tracking-widest" style={{ color: "#ea580c" }}>
              Mark your calendar
            </p>
          </div>
          <h2 className="text-[20px] md:text-[22px] font-black text-gray-900 tracking-tight" style={{ letterSpacing: "-0.02em" }}>
            Upcoming Movies
          </h2>
          {!!movies.length && (
            <p className="text-[13px] text-gray-400 mt-0.5">{movies.length} release{movies.length !== 1 ? "s" : ""} on the way</p>
          )}
        </div>
        {showSeeAll && (
          <button className="flex items-center gap-0.5 text-now-accent text-[13px] font-semibold hover:underline flex-shrink-0"
          onClick={() => navigate("/coming-soon")}
          >
            See All <ChevronRight size={15} />
          </button>
        )}
      </div>
      {children}
    </section>
  );

  if (loading) {
    return (
      <SectionWrapper>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[250px] animate-pulse">
              <div
                className="rounded-xl bg-gray-200"
                style={{ aspectRatio: "2/3" }}
              />
              <div className="mt-2.5 space-y-2">
                <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="flex gap-1 mt-1">
                  <div className="h-4 bg-gray-200 rounded-full w-12" />
                  <div className="h-4 bg-gray-200 rounded-full w-14" />
                </div>
                <div className="h-7 bg-gray-200 rounded-lg mt-2" />
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
        <div className="flex flex-col items-center justify-center h-40 gap-3">
          <AlertCircle size={28} className="text-red-300" />
          <p className="text-[13px] text-gray-500">Something went wrong loading upcoming movies.</p>
          <button
            onClick={fetchUpcoming}
            className="text-[12px] font-semibold px-4 py-1.5 rounded-lg border transition-all"
            style={{
              borderColor: "rgba(16,101,121,0.3)",
              color: "#106579",
              background: "rgba(16,101,121,0.05)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(16,101,121,0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(16,101,121,0.05)")}
          >
            Try Again
          </button>
        </div>
      </SectionWrapper>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────
  if (!movies.length) {
    return (
      <SectionWrapper>
        <div className="flex flex-col items-center justify-center h-40 gap-2 rounded-2xl border border-dashed border-gray-200 bg-white/60">
          <CalendarDays size={28} className="text-gray-300" />
          <p className="text-[13px] text-gray-400">No upcoming movies right now. Check back soon!</p>
        </div>
      </SectionWrapper>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────
  return (
    <SectionWrapper showSeeAll>
      <div className="relative">
        {canLeft && (
          <ArrowBtn dir="left" onClick={() => scroll("left")} style={{ left: -16, top: "42%" }} />
        )}

        <div
          ref={sliderRef}
          className="flex gap-4 overflow-x-auto pb-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
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
          <ArrowBtn dir="right" onClick={() => scroll("right")} style={{ right: -16, top: "42%" }} />
        )}
      </div>
    </SectionWrapper>
  );
}

/* Days remaining until release, for the countdown chip. Returns null once released. */
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

  // genre is stored as a string like " Action , Thriller" — split by comma
  const genres = Array.isArray(movie.genre)
    ? movie.genre.map((g) => g.trim()).filter(Boolean)
    : typeof movie.genre === "string"
    ? movie.genre.split(",").map((g) => g.trim()).filter(Boolean)
    : [];

  const posterUrl = getPosterUrl(movie.poster);
  const daysLeft = daysUntil(movie.releaseDate);

  return (
    <div className="flex-shrink-0 w-[250px] group snap-start">
      {/* Poster */}
      <div
        className="relative rounded-2xl overflow-hidden bg-gray-200 shadow-sm cursor-pointer transition-shadow group-hover:shadow-lg"
        style={{ aspectRatio: "2/3" }}
        onClick={onView}
      >
        {posterUrl && !imgError ? (
          <img
            src={posterUrl}
            alt={movie.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          /* Fallback placeholder */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-200 to-gray-300 gap-2">
            <div className="text-gray-400 text-[10px] font-semibold text-center px-4 leading-tight">
              {movie.title}
            </div>
          </div>
        )}

        {/* Releasing ribbon */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 px-3 py-2"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)",
          }}
        >
          <CalendarDays size={11} className="text-orange-400 flex-shrink-0" />
          <span className="text-white text-[11px] font-semibold">
            Releasing {formatReleaseDate(movie.releaseDate)}
          </span>
        </div>

        {/* Days-left countdown chip, top right (replaces the plain "Upcoming" label when we know the date) */}
        <div
          className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{ background: "rgba(234,88,12,0.9)", color: "white" }}
        >
          {daysLeft != null ? (daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft}d to go`) : "Upcoming"}
        </div>

        {/* Certificate badge */}
        {movie.certificate && (
          <div
            className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: "rgba(0,0,0,0.55)", color: "white", letterSpacing: "0.03em" }}
          >
            {movie.certificate}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-2.5 px-0.5">
        <h3
          className="text-[14px] font-bold text-gray-900 leading-tight line-clamp-1 group-hover:text-now-accent transition-colors cursor-pointer"
          onClick={onView}
          title={movie.title}
        >
          {movie.title}
        </h3>

        {/* Language + Duration */}
        <div className="flex items-center gap-2 mt-0.5">
          <p className="flex items-center gap-1 text-[12px] text-gray-400">
            <Globe size={11} />
            <span className="line-clamp-1">{movie.language || "—"}</span>
          </p>
          {movie.duration && (
            <span className="text-[11px] text-gray-300">•</span>
          )}
          {movie.duration && (
            <span className="text-[12px] text-gray-400">
              {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
            </span>
          )}
        </div>

        {/* Genre pills */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {genres.slice(0, 3).map((g, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(16,101,121,0.08)",
                  color: "#c0353b",
                  border: "1px solid rgba(16,101,121,0.2)",
                }}
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Formats */}
        {movie.formats?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {movie.formats.map((f, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold px-2 py-0.5 rounded"
                style={{
                  background: "rgba(0,0,0,0.05)",
                  color: "#888",
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={onView}
            className="flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-all border"
            style={{
              borderColor: "rgba(16,101,121,0.3)",
              color: "#106579",
              background: "rgba(16,101,121,0.05)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(16,101,121,0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(16,101,121,0.05)")}
          >
            View Details
          </button>

          <button
            onClick={() => setNotified((p) => !p)} aria-label="Release reminder" aria-pressed={notified}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all border"
            style={{
              borderColor: notified ? "rgba(16,101,121,0.4)" : "rgba(0,0,0,0.12)",
              background: notified ? "rgba(16,101,121,0.1)" : "white",
              color: notified ? "#106579" : "#666",
            }}
            title={notified ? "Reminder set" : "Remind me"}
          >
            <BellPlus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ArrowBtn({ dir, onClick, style }) {
  return (
    <button
      aria-label={dir === "left" ? "Previous releases" : "Next releases"}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      className="absolute z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:border-gray-400 hover:shadow-lg transition-all"
      style={{ ...style, transform: "translateY(-50%)" }}
    >
      {dir === "left" ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
    </button>
  );
}