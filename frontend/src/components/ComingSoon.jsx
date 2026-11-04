import { useRef, useEffect, useState, useCallback } from "react";
import {
  BellPlus,
  BellRing,
  ChevronRight,
  ChevronLeft,
  Calendar,
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

  const check = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 6);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
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
      left: dir === "left" ? -720 : 720,
      behavior: "smooth",
    });

  const formatReleaseDate = (dateStr) => {
    if (!dateStr) return "TBA";
    const d = new Date(dateStr);
    if (isNaN(d)) return "TBA";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getPosterUrl = (poster) => {
    if (!poster) return null;
    if (poster.startsWith("http")) return poster;
    const base = import.meta.env.VITE_API_URL;
    return `${base}${poster}`;
  };

  const SectionWrapper = ({ children, showSeeAll = false }) => (
    <section className="w-full px-4 sm:px-8 md:px-12 py-8 md:py-10 bg-transparent relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
              Upcoming Premieres
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Anticipated releases coming to theatres soon
            </p>
          </div>
          {showSeeAll && (
            <button
              className="flex items-center gap-1 text-sm font-bold text-[#ff4d58] hover:text-[#e03d47] transition-colors group cursor-pointer"
              onClick={() => navigate("/coming-soon")}
            >
              <span>Explore All</span>
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
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
      </SectionWrapper>
    );
  }

  if (error || !movies.length) {
    return null;
  }

  return (
    <SectionWrapper showSeeAll>
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
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="absolute -right-3 top-1/2 -translate-y-8 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-neutral-100 flex items-center justify-center text-neutral-700 hover:text-black hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </SectionWrapper>
  );
}

function MovieCard({ movie, onView, formatReleaseDate, getPosterUrl }) {
  const [notified, setNotified] = useState(false);
  const [imgError, setImgError] = useState(false);

  const posterUrl = getPosterUrl(movie.poster);

  return (
    <div className="flex-shrink-0 w-[160px] sm:w-[190px] md:w-[200px] group">
      {/* Poster */}
      <div
        className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-xs transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1.5 cursor-pointer"
        onClick={onView}
      >
        {posterUrl && !imgError ? (
          <img
            src={posterUrl}
            alt={movie.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-100 text-neutral-400 p-4 text-center">
            <span className="text-xs font-semibold">{movie.title}</span>
          </div>
        )}

        {/* Release Date overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2.5 pt-6 flex items-center justify-between text-white">
          <span className="text-[11px] font-semibold text-white flex items-center gap-1.5">
            <Calendar size={11} className="text-[#ff4d58]" />
            {formatReleaseDate(movie.releaseDate)}
          </span>
        </div>
      </div>

      {/* Title & Actions */}
      <div className="mt-2.5 px-0.5">
        <div className="flex items-start justify-between gap-1.5">
          <h3
            className="text-sm font-bold text-neutral-900 truncate group-hover:text-[#ff4d58] transition-colors cursor-pointer"
            onClick={onView}
          >
            {movie.title}
          </h3>

          <button
            onClick={() => setNotified((p) => !p)}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              notified ? "text-[#ff4d58]" : "text-neutral-400 hover:text-neutral-700"
            }`}
            title={notified ? "Reminder set" : "Notify me"}
            aria-label={notified ? "Reminder set" : "Notify me"}
          >
            {notified ? <BellRing size={14} /> : <BellPlus size={14} />}
          </button>
        </div>

        <p className="text-xs text-neutral-500 mt-0.5 truncate">
          {Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre || "Cinema"}
        </p>
      </div>
    </div>
  );
}
