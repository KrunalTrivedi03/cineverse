import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import {
  ChevronRight,
  ChevronLeft,
  Star,
  ThumbsUp,
  MonitorPlay,
  Tv,
  Sparkles,
  Ticket,
} from "lucide-react";

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
const getVoted = () => {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
  catch { return new Set(); }
};
const saveVoted = (set) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
};

const STATUS_BADGE = {
  upcoming:  { label: "Upcoming",   bg: "rgba(234,88,12,0.92)",  color: "#fff" },
  streaming: { label: "Streaming",  bg: "rgba(99,102,241,0.92)", color: "#fff" },
};

const getBadge = (movie) => {
  if (movie.status === "released") {
    return movie.isInCinemas
      ? { label: "In Cinemas", bg: "rgba(240,84,92,0.92)", color: "#fff" }
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
  const navigate  = useNavigate();

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
    <section className="w-full px-4 sm:px-8 md:px-14 py-10 md:py-14 bg-white/70 border-b border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0545c]/10 text-[#f0545c] text-[11px] font-extrabold uppercase tracking-widest mb-2 border border-[#f0545c]/20">
              <Sparkles size={12} />
              <span>Recommended Releases</span>
            </div>
            <h2 className="text-[22px] sm:text-[26px] font-black text-gray-900 tracking-tight">
              Recommended Movies
            </h2>
            <p className="text-[13px] text-gray-500 mt-1 font-medium">
              Handpicked blockbuster screenings &amp; stream premieres in <span className="font-bold text-gray-800">{city}</span>
            </p>
          </div>

          <button
            onClick={() => navigate("/now-showing")}
            className="flex items-center gap-1 text-[#f0545c] hover:text-[#d94048] text-[13.5px] font-bold group transition-all"
          >
            <span>See All Movies</span>
            <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-3xl bg-gray-50/80 border border-gray-100">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-inner"
              style={{ background: "rgba(240,84,92,0.08)" }}
            >
              <Tv size={28} style={{ color: "#f0545c", opacity: 0.6 }} />
            </div>
            <p className="text-[16px] font-extrabold text-gray-700">No movies found in {city}</p>
            <p className="text-[13px] text-gray-400 mt-1">
              Select another city from the location menu at top to explore showtimes.
            </p>
          </div>
        ) : (
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
                  key={movie.id}
                  movie={movie}
                  isVoted={voted.has(movie.id)}
                  onVote={handleVote}
                  onClick={() => navigate(`/movie/${movie.id}`)}
                />
              ))}
            </div>

            {canRight && (
              <ArrowBtn dir="right" onClick={() => scroll("right")} style={{ right: -18, top: "42%" }} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function MovieCard({ movie, isVoted, onVote, onClick }) {
  const badge = getBadge(movie);

  return (
    <div
      className="flex-shrink-0 w-[190px] sm:w-[210px] cursor-pointer group card-hover-lift"
      onClick={onClick}
    >
      <div
        className="relative rounded-2xl overflow-hidden bg-gray-100 shadow-md group-hover:shadow-2xl transition-all duration-300 border border-gray-100"
        style={{ aspectRatio: "2/3" }}
      >
        <img
          src={IMG(movie.poster)}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Certificate Badge */}
        {movie.certificate && (
          <span
            className="absolute top-2.5 left-2.5 text-[10px] font-black px-2 py-0.5 rounded-md backdrop-blur-md bg-black/60 text-white/90 border border-white/10"
          >
            {movie.certificate}
          </span>
        )}

        {/* Status Tag Badge */}
        <div
          className="absolute top-2.5 right-2.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-sm"
          style={{ background: badge.bg, color: badge.color }}
        >
          {badge.label}
        </div>

        {/* OTT platform pill */}
        {movie.status === "streaming" && movie.ottPlatform && (
          <div className="absolute bottom-12 left-0 right-0 flex justify-center">
            <span
              className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-md"
              style={{ background: "rgba(99,102,241,0.9)", color: "#fff" }}
            >
              <MonitorPlay size={10} /> {movie.ottPlatform}
            </span>
          </div>
        )}

        {/* Now Showing overlay pill */}
        {movie.isInCinemas && movie.status !== "streaming" && (
          <div className="absolute bottom-12 left-0 right-0 flex justify-center">
            <span
              className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-md"
              style={{ background: "rgba(240,84,92,0.9)", color: "#fff" }}
            >
              <Ticket size={10} /> Book Now
            </span>
          </div>
        )}

        {/* Rating overlay bottom bar */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2.5"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
          }}
        >
          <div className="flex items-center gap-1.5">
            <Star
              size={13}
              fill="#facc15"
              className="text-[#facc15] flex-shrink-0"
            />
            <span className="text-white font-black text-[13px]">
              {movie.rating ? Number(movie.rating).toFixed(1) : "N/A"}
            </span>
          </div>

          <span className="text-white/70 text-[11px] font-semibold">
            {formatVotes(movie.votes)} votes
          </span>
        </div>
      </div>

      {/* Card Details */}
      <div className="mt-3 px-1">
        <h3 className="text-[14.5px] font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-[#f0545c] transition-colors">
          {movie.title}
        </h3>

        <p className="text-[12px] font-medium text-gray-500 mt-0.5 truncate">
          {[movie.genre, movie.language].filter(Boolean).join(" · ")}
        </p>

        {(movie.duration || movie.formats?.length > 0) && (
          <p className="text-[11px] font-medium text-gray-400 mt-0.5 truncate">
            {[
              movie.duration ? `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m` : null,
              movie.formats?.length > 0 ? movie.formats.slice(0, 2).join(" / ") : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        {movie.status === "upcoming" && movie.releaseDate && (
          <p className="text-[11.5px] text-orange-500 font-bold mt-1">
            Releases {formatDate(movie.releaseDate)}
          </p>
        )}

        {/* Action Button */}
        {movie.status === "released" && (
          <button
            onClick={(e) => onVote(e, movie.id)}
            className={`mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-bold transition-all border ${
              isVoted
                ? "bg-[#f0545c] text-white border-[#f0545c] shadow-xs"
                : "bg-[#f0545c]/5 text-[#f0545c] border-[#f0545c]/25 hover:bg-[#f0545c]/10"
            }`}
          >
            <ThumbsUp size={12} fill={isVoted ? "#fff" : "none"} />
            <span>{isVoted ? "Voted Interested" : "Interested"}</span>
          </button>
        )}

        {movie.status === "upcoming" && (
          <button
            onClick={(e) => onVote(e, movie.id)}
            className={`mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-bold transition-all border ${
              isVoted
                ? "bg-orange-500 text-white border-orange-500 shadow-xs"
                : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
            }`}
          >
            <ThumbsUp size={12} fill={isVoted ? "#fff" : "none"} />
            <span>{isVoted ? "Reminder Set" : "Notify Me"}</span>
          </button>
        )}

        {movie.status === "streaming" && (
          <button
            onClick={(e) => e.stopPropagation()}
            className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-bold transition-all border border-indigo-200/80 bg-indigo-50/70 text-indigo-600 hover:bg-indigo-100/70"
          >
            <MonitorPlay size={12} /> Watch Now
          </button>
        )}
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
