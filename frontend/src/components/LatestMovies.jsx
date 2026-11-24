import DiscoveryHeading from "./DiscoveryHeading";
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosInstance";
import { ChevronRight, ChevronLeft, Star, ThumbsUp, MonitorPlay, Tv } from "lucide-react";

const IMG = (path) => !path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;

const formatVotes = (votes = 0) => {
  if (votes >= 1_000_000) return (votes / 1_000_000).toFixed(1) + "M";
  if (votes >= 1_000)     return (votes / 1_000).toFixed(1) + "K";
  return String(votes);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
};

const STORAGE_KEY = "voted_movies";
const getVoted    = () => {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
  catch { return new Set(); }
};
const saveVoted = (set) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
};

const STATUS_BADGE = {
  upcoming:  { label: "Upcoming",   bg: "rgba(234,88,12,0.88)",  color: "#fff" },
  streaming: { label: "Streaming",  bg: "rgba(99,102,241,0.88)", color: "#fff" },
};

const getBadge = (movie) => {
  if (movie.status === "released") {
    return movie.isInCinemas
      ? { label: "In Cinemas", bg: "rgba(16,101,121,0.88)", color: "#fff" }
      : { label: "Not Showing", bg: "rgba(107,114,128,0.85)", color: "#fff" };
  }
  return STATUS_BADGE[movie.status] || STATUS_BADGE.upcoming;
};

export default function LatestMovies() {
  const [movies,   setMovies]   = useState([]);
  const [voted,    setVoted]    = useState(getVoted);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(false);
  const sliderRef = useRef(null);

  const [city, setCity] = useState(
  () => localStorage.getItem("selectedCity") || "Mumbai"
);

useEffect(() => {
  const handler = () => {
    const newCity = localStorage.getItem("selectedCity") || "Mumbai";
    setCity(newCity);
  };
  window.addEventListener("cityChanged", handler);
  return () => window.removeEventListener("cityChanged", handler);
}, []);

useEffect(() => {
  api.get("/movies", { params: { city } })
    .then((res) => {
      const latest = res.data.filter((m) => m.status === "streaming" || (m.status === "released" && m.isInCinemas)).slice(0, 10);
      setMovies(
        latest.map((m) => ({
          id:          m._id,
          title:       m.title,
          rating:      m.rating      ?? 0,
          genre:       m.genre       || "Drama",
          votes:       m.votes       || 0,
          poster:      m.poster      || "/placeholder.jpg",
          releaseDate: m.releaseDate || null,
          certificate: m.certificate || null,
          status:      m.status      || "upcoming",
          isInCinemas: m.isInCinemas ?? false,
          ottPlatform: m.ottPlatform || null,
          formats:     m.formats     || [],
          language:    m.language    || null,
          duration:    m.duration    || null,
        }))
      );
    })
    .catch(console.error);
}, [city]);

  const handleVote = async (e, movieId) => {
  e.stopPropagation();

  if (voted.has(movieId)) return;

  setMovies((prev) =>
    prev.map((m) => m.id === movieId ? { ...m, votes: m.votes + 1 } : m)
  );

  setVoted((prev) => {
    const next = new Set(prev);
    next.add(movieId);
    saveVoted(next);
    return next;
  });

  try {
    await api.put(`/movies/vote/${movieId}`);
  } catch (err) {
    console.error("Vote failed, rolling back", err);
    setMovies((prev) =>
      prev.map((m) => m.id === movieId ? { ...m, votes: Math.max(0, m.votes - 1) } : m)
    );
    setVoted((prev) => {
      const next = new Set(prev);
      next.delete(movieId);
      saveVoted(next);
      return next;
    });
  }
};

  const checkScroll = () => {
    const el = sliderRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
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
  }, [movies]);

  const scroll = (dir) =>
    sliderRef.current?.scrollBy({
      left: dir === "left" ? -880 : 880,
      behavior: "smooth",
    });

  return (
    <section className="w-full px-6 md:px-14 py-10 bg-white">
      <DiscoveryHeading title="Movies for you" detail={`Playing and streaming in ${city}`} to="/now-showing" />

      {movies.length === 0 && (
        <div className="now-rail-empty">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "rgba(16,101,121,0.07)" }}>
            <Tv size={26} style={{ color: "#106579", opacity: 0.4 }} />
          </div>
          <p className="text-[15px] font-bold text-gray-900">No movies in {city}</p>
          <p className="text-[12px] text-gray-500 mt-1">Try selecting a different city from the navbar</p>
        </div>
      )}

      {movies.length > 0 && (
        <div className="relative">
          {canLeft && (
            <ArrowBtn dir="left" onClick={() => scroll("left")} style={{ left: -16, top: "45%" }} />
          )}
          <div
            ref={sliderRef}
            className="now-media-rail flex gap-4 overflow-x-auto px-1 pt-1 pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                isVoted={voted.has(movie.id)}
                onVote={handleVote}
              />
            ))}
          </div>
          {canRight && (
            <ArrowBtn dir="right" onClick={() => scroll("right")} style={{ right: -16, top: "45%" }} />
          )}
        </div>
      )}
    </section>
  );
}

function MovieCard({ movie, isVoted, onVote }) {
  const badge = getBadge(movie);

  return (
    <article className="now-catalog-card now-media-card now-card flex-shrink-0 w-[200px] rounded-2xl p-1.5 group">
      <Link className="now-card-link" to={`/movie/${movie.id}`} aria-label={movie.title} />
      <div
        className="relative rounded-xl overflow-hidden bg-gray-100 shadow-sm"
        style={{ aspectRatio: "2/3" }}
      >
        <img
          src={IMG(movie.poster)}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {movie.certificate && (
          <span
            className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(0,0,0,0.62)",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {movie.certificate}
          </span>
        )}

        <div
          className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{ background: badge.bg, color: badge.color }}
        >
          {badge.label}
        </div>

        {movie.status === "streaming" && movie.ottPlatform && (
          <div className="absolute bottom-10 left-0 right-0 flex justify-center">
            <span
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(99,102,241,0.85)", color: "#fff" }}
            >
              <MonitorPlay size={9} /> {movie.ottPlatform}
            </span>
          </div>
        )}

        {movie.isInCinemas && movie.status !== "streaming" && (
          <div className="absolute bottom-10 left-0 right-0 flex justify-center">
            <span
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(16,101,121,0.85)", color: "#fff" }}
            >
              <Tv size={9} /> Now Showing
            </span>
          </div>
        )}

        <div
          className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 px-3 py-2"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)",
          }}
        >
          <Star
            size={12}
            fill="#106579"
            className="text-now-accent flex-shrink-0"
          />
          <span className="text-white font-bold text-[12px]">
            {movie.rating}/10
          </span>
          <span className="text-white/50 text-[11px]">
            {formatVotes(movie.votes)} Votes
          </span>
        </div>
      </div>

      <div className="now-catalog-body mt-2.5 px-0.5">
        <h3 className="text-[14px] font-bold text-gray-900 leading-tight line-clamp-1 group-hover:text-now-accent transition-colors">
          {movie.title}
        </h3>

        <p className="text-[12px] text-gray-400 mt-0.5 truncate">
          {[movie.genre, movie.language].filter(Boolean).join(" · ")}
        </p>

        {(movie.duration || movie.formats?.length > 0) && (
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">
            {[
              movie.duration? `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m` : null,
              movie.formats?.length > 0 ? movie.formats.slice(0, 2).join(" / ") : null,
            ]
              .filter(Boolean)
              .join("  ·  ")}
          </p>
        )}

        {movie.status === "upcoming" && movie.releaseDate && (
          <p className="text-[11px] text-orange-500 font-medium mt-0.5">
            {formatDate(movie.releaseDate)}
          </p>
        )}

        {movie.status === "released" && (
          <button
            onClick={(e) => onVote(e, movie.id)} aria-pressed={isVoted}
            className="now-catalog-action relative z-10 mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all border"
            style={{
              borderColor: isVoted
                ? "rgba(16,101,121,0.5)"
                : "rgba(16,101,121,0.3)",
              color: isVoted ? "#fff" : "#106579",
              background: isVoted ? "#106579" : "rgba(16,101,121,0.05)",
            }}
            onMouseEnter={(e) => {
              if (!isVoted)
                e.currentTarget.style.background = "rgba(16,101,121,0.1)";
            }}
            onMouseLeave={(e) => {
              if (!isVoted)
                e.currentTarget.style.background = "rgba(16,101,121,0.05)";
            }}
          >
            <ThumbsUp size={12} fill={isVoted ? "#fff" : "none"} />
            {isVoted ? "Marked interested" : "Interested"}
          </button>
        )}

        {/* ── CTA: Interested (upcoming — no booking yet, just vote) ── */}
        {movie.status === "upcoming" && (
          <button
            onClick={(e) => onVote(e, movie.id)} aria-pressed={isVoted}
            className="now-catalog-action relative z-10 mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all border"
            style={{
              borderColor: isVoted
                ? "rgba(234,88,12,0.5)"
                : "rgba(234,88,12,0.3)",
              color: isVoted ? "#fff" : "#ea580c",
              background: isVoted ? "#ea580c" : "rgba(234,88,12,0.05)",
            }}
            onMouseEnter={(e) => {
              if (!isVoted)
                e.currentTarget.style.background = "rgba(234,88,12,0.1)";
            }}
            onMouseLeave={(e) => {
              if (!isVoted)
                e.currentTarget.style.background = "rgba(234,88,12,0.05)";
            }}
          >
            <ThumbsUp size={12} fill={isVoted ? "#fff" : "none"} />
            {isVoted ? "Notified" : "Notify Me"}
          </button>
        )}

        {/* ── CTA: Watch Now (streaming) ── */}
        {movie.status === "streaming" && (
          <Link
            to={`/movie/${movie.id}`}
            className="now-catalog-action relative z-10 mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all border"
            style={{
              borderColor: "rgba(99,102,241,0.3)",
              color: "#6366f1",
              background: "rgba(99,102,241,0.05)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(99,102,241,0.1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(99,102,241,0.05)")
            }
          >
            <MonitorPlay size={12} /> Watch Now
          </Link>
        )}
      </div>
    </article>
  );
}

/* ─── Arrow Button ────────────────────────────────────── */
function ArrowBtn({ dir, onClick, style }) {
  return (
    <button
      aria-label={dir === "left" ? "Previous movies" : "Next movies"}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      className="absolute z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:border-gray-400 hover:shadow-lg transition-all"
      style={{ ...style, transform: "translateY(-50%)" }}
    >
      {dir === "left" ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
    </button>
  );
}


