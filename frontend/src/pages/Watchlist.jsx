import { useState, useEffect } from "react";
import {
  Heart,
  PlayCircle,
  CheckCircle,
  Star,
  Trash2,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";

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
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
    label: "Completed",
  },
  watching: {
    icon: PlayCircle,
    color: "#f0545c",
    bg: "rgba(240,84,92,0.08)",
    border: "rgba(240,84,92,0.2)",
    label: "Watching",
  },
  favorites: {
    icon: Heart,
    color: "#d97706",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
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
      className="group cursor-pointer rounded-xl overflow-hidden bg-white border border-neutral-200/80 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
      style={{
        opacity: removing ? 0.4 : 1,
        pointerEvents: removing ? "none" : "auto",
      }}
      onClick={() => navigate(`/movie/${movie.id}`)}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-100">
        <img
          src={IMG(movie.poster)}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Rating badge */}
        {movie.rating > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold text-white bg-black/60 backdrop-blur-md">
            <Star size={10} fill="#facc15" className="text-yellow-400" />
            <span>{movie.rating}</span>
          </div>
        )}

        {/* Status corner indicator */}
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center bg-white/95 shadow-xs">
          <Icon
            size={12}
            style={{ color: st.color }}
            fill={movie.status === "favorites" ? st.color : "none"}
          />
        </div>

        {/* Hover delete button */}
        <button
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center bg-black/60 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
          onClick={handleRemove}
          title="Remove from watchlist"
        >
          {removing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Trash2 size={14} />
          )}
        </button>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold text-neutral-900 truncate group-hover:text-[#f0545c] transition-colors">
          {movie.title}
        </h3>

        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer"
            style={{ background: st.bg, color: st.color, borderColor: st.border }}
            onClick={(e) => {
              e.stopPropagation();
              const order = ["watching", "completed", "favorites"];
              const next = order[(order.indexOf(movie.status) + 1) % order.length];
              onStatusChange(movie.id, next);
            }}
            title="Click to toggle status"
          >
            <Icon size={10} />
            <span>{st.label}</span>
          </button>
        </div>
      </div>
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
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col justify-between">
      <div>
        <Navbar />
        <BottomNav />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                Watchlist
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                Saved titles and viewing progress
              </p>
            </div>

            <span className="text-xs font-semibold text-neutral-500 px-3 py-1 rounded-full bg-neutral-200/60 border border-neutral-300/40 w-fit">
              {movies.length} {movies.length === 1 ? "Title" : "Titles"}
            </span>
          </div>

          {/* Filter Tabs Bar */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl mb-8 w-fit bg-neutral-200/60 border border-neutral-300/40 overflow-x-auto max-w-full no-scrollbar">
            {TABS.map(({ id, label }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-neutral-900 shadow-2xs"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-neutral-100 text-neutral-700" : "text-neutral-400"
                    }`}
                  >
                    {counts[id] || 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* State Displays */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-[2/3] bg-neutral-200" />
                  <div className="p-2 space-y-1.5">
                    <div className="h-3.5 bg-neutral-200 rounded w-3/4" />
                    <div className="h-3 bg-neutral-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-white rounded-xl border border-neutral-200">
              <p className="text-sm font-semibold text-red-500">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-xl border border-neutral-200/80 p-8">
              <p className="text-base font-semibold text-neutral-800">
                {activeTab === "all" ? "Your watchlist is empty" : `No titles in "${activeTab}"`}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Explore movies and click the Watchlist button to save titles here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-12">
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
