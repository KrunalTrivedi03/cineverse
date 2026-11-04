import { useState, useEffect } from "react";
import {
  Heart,
  PlayCircle,
  CheckCircle,
  Star,
  Trash2,
  Loader2,
  Play,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";
import PageBackgroundWatermark from "../components/PageBackgroundWatermark";
import PageLoader from "../components/PageLoader";
import { WatchlistArt } from "../components/CinemaIllustrations";

const IMG = (path) =>
  !path ? null : path.startsWith("http") ? path : `${import.meta.env.VITE_API_URL}${path}`;

const TABS = [
  { id: "all", label: "All Titles" },
  { id: "watching", label: "Watching" },
  { id: "completed", label: "Completed" },
  { id: "favorites", label: "Favorites" },
];

const STATUS = {
  completed: {
    icon: CheckCircle,
    color: "#059669",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    label: "Completed",
  },
  watching: {
    icon: PlayCircle,
    color: "#ff4d58",
    bg: "#fff0f2",
    border: "#fecdd3",
    label: "Watching",
  },
  favorites: {
    icon: Heart,
    color: "#d97706",
    bg: "#fefce8",
    border: "#fef08a",
    label: "Favorite",
  },
};

function MovieCard({ movie, onRemove, onStatusChange }) {
  const navigate = useNavigate();
  const [removing, setRemoving] = useState(false);
  const st = STATUS[movie.status] || STATUS.watching;
  const Icon = st.icon;

  const handleRemove = async (e) => {
    e.stopPropagation();
    setRemoving(true);
    await onRemove(movie.id);
  };

  return (
    <div
      className="group cursor-pointer rounded-2xl overflow-hidden bg-white border border-neutral-150/80 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-3 sm:p-4 flex gap-4 items-center"
      style={{
        opacity: removing ? 0.4 : 1,
        pointerEvents: removing ? "none" : "auto",
      }}
      onClick={() => navigate(`/movie/${movie.id}`)}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-20 sm:w-24 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
        <img
          src={IMG(movie.poster)}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Rating badge */}
        {movie.rating > 0 && (
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-black/60 backdrop-blur-md">
            <Star size={9} fill="#facc15" className="text-yellow-400" />
            <span>{movie.rating}</span>
          </div>
        )}

        {/* Delete button */}
        <button
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center bg-black/60 hover:bg-red-600 text-white transition-all cursor-pointer"
          onClick={handleRemove}
          title="Remove from watchlist"
        >
          {removing ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
        </button>
      </div>

      {/* Info & Progress */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-neutral-900 truncate group-hover:text-[#ff4d58] transition-colors">
            {movie.title}
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5 truncate">
            Cinema · Action · Streaming
          </p>
        </div>

        {/* Viewing progress bar (Mockup Image 1 Bottom-Left) */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 mb-1">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
            >
              <Icon size={10} />
              <span>{st.label}</span>
            </span>
            <span>46%</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#ff4d58] rounded-full" style={{ width: "46%" }} />
          </div>
        </div>
      </div>

      {/* Play Icon CTA */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/movie/${movie.id}`);
        }}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-[#fff0f2] hover:bg-[#ff4d58] text-[#ff4d58] hover:text-white transition-all shadow-xs flex-shrink-0 cursor-pointer"
        aria-label="Play title"
      >
        <Play size={16} fill="currentColor" className="ml-0.5" />
      </button>
    </div>
  );
}

export default function Watchlist() {
  const [activeTab, setActiveTab] = useState("all");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get("/watchlist")
      .then((res) => {
        setMovies(
          res.data.map((entry) => ({
            entryId: entry._id,
            id: entry.movie._id,
            title: entry.movie.title,
            poster: entry.movie.poster,
            rating: entry.movie.rating,
            status: entry.status,
          }))
        );
      })
      .catch(() => setError("Failed to load your watchlist."))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (movieId) => {
    try {
      await api.post("/watchlist/remove", { movieId });
      setMovies((prev) => prev.filter((m) => m.id !== movieId));
    } catch {
      // rollback or silent
    }
  };

  const handleStatusChange = async (movieId, newStatus) => {
    setMovies((prev) =>
      prev.map((m) => (m.id === movieId ? { ...m, status: newStatus } : m))
    );
    try {
      await api.patch("/watchlist/status", { movieId, status: newStatus });
    } catch {
      api.get("/watchlist").then((res) =>
        setMovies(
          res.data.map((entry) => ({
            entryId: entry._id,
            id: entry.movie._id,
            title: entry.movie.title,
            poster: entry.movie.poster,
            rating: entry.movie.rating,
            status: entry.status,
          }))
        )
      );
    }
  };

  const counts = {
    all: movies.length,
    watching: movies.filter((m) => m.status === "watching").length,
    completed: movies.filter((m) => m.status === "completed").length,
    favorites: movies.filter((m) => m.status === "favorites").length,
  };

  const filtered =
    activeTab === "all" ? movies : movies.filter((m) => m.status === activeTab);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-neutral-900 flex flex-col justify-between relative overflow-hidden selection:bg-[#ff4d58] selection:text-white">
      {/* Background Watermark (Image 2) */}
      <PageBackgroundWatermark variant="movies" />

      {loading && <PageLoader text="Loading your saved watchlist and progress..." />}

      <div className="relative z-10">
        <Navbar />
        <BottomNav />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header Card (Mockup Image 1 Bottom-Left) */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#fff5f6] via-white to-[#fef7f2] border border-rose-100 shadow-[0_10px_30px_rgba(255,77,88,0.06)] p-6 sm:p-8 flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
                My Watchlist
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Saved titles and viewing progress
              </p>
            </div>

            <div className="flex items-center gap-4">
              <WatchlistArt className="w-24 h-24 sm:w-28 sm:h-28 hidden sm:flex" />
            </div>
          </div>

          {/* Filter Tabs Bar (Mockup Image 1 Bottom-Left) */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
            {TABS.map(({ id, label }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                    isActive
                      ? "bg-[#ff4d58] text-white shadow-xs"
                      : "bg-white border border-neutral-200/80 text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {counts[id] || 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* State Displays */}
          {error ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200 shadow-xs">
              <p className="text-sm font-semibold text-red-500">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-neutral-150/80 p-8 shadow-xs">
              <p className="text-base font-bold text-neutral-800">
                {activeTab === "all" ? "Your watchlist is empty" : `No titles in "${activeTab}"`}
              </p>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                Explore movies or web shows and click the Watchlist button to track your titles here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
              {filtered.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onRemove={handleRemove}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
