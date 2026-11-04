import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import {
  ChevronRight,
  ChevronLeft,
  Star,
  ThumbsUp,
  MonitorPlay,
  Ticket,
  Heart,
} from "lucide-react";

const IMG = (path) => (!path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`);

const formatVotes = (votes = 0) => {
  if (votes >= 1_000_000) return (votes / 1_000_000).toFixed(1) + "M";
  if (votes >= 1_000) return (votes / 1_000).toFixed(1) + "K";
  return String(votes);
};

const STORAGE_KEY = "voted_movies";
const getVoted = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return new Set();
  }
};
const saveVoted = (set) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
};

export default function LatestMovies() {
  const [movies, setMovies] = useState([]);
  const [voted, setVoted] = useState(getVoted);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const sliderRef = useRef(null);
  const navigate = useNavigate();

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
    api
      .get("/movies", { params: { city } })
      .then((res) => {
        const latest = res.data
          .filter((m) => m.status === "streaming" || (m.status === "released" && m.isInCinemas))
          .slice(0, 12);
        setMovies(
          latest.map((m) => ({
            id: m._id,
            title: m.title,
            rating: m.rating ?? 0,
            genre: m.genre || "Drama",
            votes: m.votes || 0,
            poster: m.poster || "/placeholder.jpg",
            releaseDate: m.releaseDate || null,
            certificate: m.certificate || null,
            status: m.status || "upcoming",
            isInCinemas: m.isInCinemas ?? false,
            ottPlatform: m.ottPlatform || null,
            formats: m.formats || [],
            language: m.language || null,
            duration: m.duration || null,
          }))
        );
      })
      .catch(console.error);
  }, [city]);

  const handleVote = async (e, movieId) => {
    e.stopPropagation();
    if (voted.has(movieId)) return;

    setMovies((prev) =>
      prev.map((m) => (m.id === movieId ? { ...m, votes: m.votes + 1 } : m))
    );

    setVoted((prev) => {
      const next = new Set(prev);
      next.add(movieId);
      saveVoted(next);
      return next;
    });

    try {
      await api.put(`/movies/vote/${movieId}`);
    } catch {
      setMovies((prev) =>
        prev.map((m) => (m.id === movieId ? { ...m, votes: Math.max(0, m.votes - 1) } : m))
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
    setCanLeft(el.scrollLeft > 6);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
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
      left: dir === "left" ? -720 : 720,
      behavior: "smooth",
    });

  return (
    <section className="w-full px-4 sm:px-8 md:px-12 py-8 md:py-10 bg-transparent relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
              Now in Cinemas
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Top movies playing in cinemas and streaming in {city}
            </p>
          </div>

          <button
            onClick={() => navigate("/now-showing")}
            className="flex items-center gap-1 text-sm font-bold text-[#ff4d58] hover:text-[#e03d47] transition-colors group cursor-pointer"
          >
            <span>See All</span>
            <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl bg-white border border-neutral-100 shadow-xs">
            <p className="text-sm font-bold text-neutral-800">No movies currently listed in {city}</p>
            <p className="text-xs text-neutral-400 mt-1">
              Select another city or check back soon for updated showtimes.
            </p>
          </div>
        ) : (
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
                  key={movie.id}
                  movie={movie}
                  isVoted={voted.has(movie.id)}
                  onVote={handleVote}
                  onClick={() => navigate(`/movie/${movie.id}`)}
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
        )}
      </div>
    </section>
  );
}

function MovieCard({ movie, isVoted, onVote, onClick }) {
  const isCinema = movie.isInCinemas && movie.status !== "streaming";

  return (
    <div
      className="flex-shrink-0 w-[160px] sm:w-[190px] md:w-[200px] cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-xs transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1.5">
        <img
          src={IMG(movie.poster)}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Certificate Pill */}
        {movie.certificate && (
          <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white">
            {movie.certificate}
          </span>
        )}

        {/* Bottom overlay: Rating on bottom-left, Heart on bottom-right (Mockup Image 1) */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2.5 pt-6 flex items-end justify-between">
          {/* Rating Badge */}
          {movie.rating > 0 ? (
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full px-2 py-0.5 text-white">
              <Star size={10} fill="#facc15" className="text-yellow-400" />
              <span className="text-[11px] font-bold">{Number(movie.rating).toFixed(1)}</span>
            </div>
          ) : (
            <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">
              {isCinema ? "In Cinemas" : movie.ottPlatform || "Streaming"}
            </span>
          )}

          {/* Heart / Wishlist icon button (Mockup Image 1) */}
          <button
            onClick={(e) => onVote(e, movie.id)}
            aria-label="Wishlist"
            className="w-7 h-7 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md flex items-center justify-center text-white hover:text-[#ff4d58] transition-colors"
          >
            <Heart
              size={13}
              fill={isVoted ? "#ff4d58" : "none"}
              className={isVoted ? "text-[#ff4d58]" : "text-white"}
            />
          </button>
        </div>
      </div>

      {/* Title & Metadata */}
      <div className="mt-2.5 px-0.5">
        <h3 className="text-sm font-bold text-neutral-900 truncate group-hover:text-[#ff4d58] transition-colors">
          {movie.title}
        </h3>
        <p className="text-xs text-neutral-500 mt-0.5 truncate">
          {[movie.genre, movie.language].filter(Boolean).join(" · ")}
        </p>
      </div>
    </div>
  );
}
