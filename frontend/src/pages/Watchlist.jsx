import { useState, useEffect } from "react";
import {
  Heart,
  PlayCircle,
  Bookmark,
  CheckCircle,
  Star,
  Trash2,
  Loader2,
  Film,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";

const IMG = (path) =>
  !path ? null : path.startsWith("http") ? path : `${import.meta.env.VITE_API_URL}${path}`;

const TABS = [
  { id: "all",       label: "All Titles" },
  { id: "watching",  label: "Currently Watching" },
  { id: "completed", label: "Finished" },
  { id: "favorites", label: "My Favorites" },
];

const STATUS = {
  completed: {
    icon: CheckCircle,
    color: "#059669",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.25)",
    label: "Completed",
  },
  watching: {
    icon: PlayCircle,
    color: "#f0545c",
    bg: "rgba(240,84,92,0.1)",
    border: "rgba(240,84,92,0.25)",
    label: "Watching",
  },
  favorites: {
    icon: Heart,
    color: "#d97706",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
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
      className="group cursor-pointer rounded-2xl overflow-hidden bg-white transition-all duration-300 border border-gray-100 shadow-2xs hover:shadow-xl hover:-translate-y-1"
      style={{
        opacity: removing ? 0.4 : 1,
        pointerEvents: removing ? "none" : "auto",
      }}
      onClick={() => navigate(`/movie/${movie.id}`)}
    >
      <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: "2/3" }}>
        <img
          src={IMG(movie.poster)}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Hover dark scrim */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/45 backdrop-blur-[2px]"
        />

        {/* Rating badge */}
        <div
          className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black text-white backdrop-blur-md bg-black/60 border border-white/10"
        >
          <Star size={10} fill="#facc15" className="text-[#facc15]" />
          <span>{movie.rating ?? "—"}</span>
        </div>

        {/* Status Icon corner */}
        <div
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md bg-white/90 shadow-sm"
        >
          <Icon
            size={13}
            style={{ color: st.color }}
            fill={movie.status === "favorites" ? st.color : "none"}
          />
        </div>

        {/* Hover Action Buttons */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 bg-[#f0545c] hover:bg-[#d94048] text-white"
            onClick={(e) => { e.stopPropagation(); navigate(`/movie/${movie.id}`); }}
            title="View details"
          >
            <PlayCircle size={18} />
          </button>
          
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 bg-white/20 hover:bg-red-500/80 border border-white/30 text-white backdrop-blur-md"
            onClick={handleRemove}
            title="Remove from watchlist"
          >
            {removing ? (
              <Loader2 size={16} className="animate-spin text-white" />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      </div>

      <div className="p-3.5">
        <h3 className="text-[13.5px] font-bold text-gray-900 truncate leading-snug group-hover:text-[#f0545c] transition-colors">
          {movie.title}
        </h3>

        <div className="flex items-center justify-between mt-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-1 rounded-full border transition-all active:scale-95"
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
  const [activeTab, setActiveTab]   = useState("all");
  const [movies, setMovies]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get("/watchlist")
      .then((res) => {
        setMovies(
          res.data.map((entry) => ({
            entryId: entry._id,
            id:      entry.movie._id,
            title:   entry.movie.title,
            poster:  entry.movie.poster,
            rating:  entry.movie.rating,
            status:  entry.status,
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
            id:      entry.movie._id,
            title:   entry.movie.title,
            poster:  entry.movie.poster,
            rating:  entry.movie.rating,
            status:  entry.status,
          }))
        )
      );
    }
  };

  const counts = {
    all:       movies.length,
    watching:  movies.filter((m) => m.status === "watching").length,
    completed: movies.filter((m) => m.status === "completed").length,
    favorites: movies.filter((m) => m.status === "favorites").length,
  };

  const filtered =
    activeTab === "all" ? movies : movies.filter((m) => m.status === activeTab);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex flex-col justify-between">
      <div>
        <Navbar />
        <BottomNav />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-16">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0545c]/10 text-[#f0545c] text-[11px] font-extrabold uppercase tracking-widest mb-2 border border-[#f0545c]/20">
                <Bookmark size={11} />
                <span>Personal Vault</span>
              </div>
              <h1 className="text-[26px] sm:text-[36px] font-black tracking-tight text-gray-900">
                My Watchlist
              </h1>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-200/80 shadow-2xs self-start sm:self-auto">
              <Film size={14} className="text-[#f0545c]" />
              <span className="text-[13px] font-bold text-gray-700">
                {movies.length} {movies.length === 1 ? "Title" : "Titles"} Saved
              </span>
            </div>
          </div>

          {/* Modern Filter Tabs Bar */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl mb-8 w-fit bg-white border border-gray-200/80 shadow-2xs overflow-x-auto max-w-full no-scrollbar">
            {TABS.map(({ id, label }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${
                    isActive
                      ? "bg-[#f0545c] text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <span>{label}</span>
                  {counts[id] > 0 && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center ${
                        isActive
                          ? "bg-white/25 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {counts[id]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-28">
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-3 h-3 rounded-full bg-[#f0545c] animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-gray-100 p-8 shadow-xs">
              <p className="text-[15px] font-bold text-gray-700 mb-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl bg-[#f0545c] text-white text-[13px] font-bold shadow-md hover:bg-[#d94048] transition-colors"
              >
                Reload Watchlist
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200 p-8">
              <div className="w-18 h-18 rounded-2xl flex items-center justify-center mb-4 bg-red-50 text-[#f0545c]">
                <Bookmark size={32} />
              </div>
              <h3 className="text-[20px] font-black text-gray-900 mb-1">
                {activeTab === "all" ? "Your Watchlist is Empty" : `No ${activeTab} titles`}
              </h3>
              <p className="text-[13.5px] text-gray-400 max-w-sm mb-6">
                {activeTab === "all"
                  ? "Explore trending movies and series to curate your personal cinema schedule."
                  : `Titles you mark as "${activeTab}" will be neatly organized here.`}
              </p>
              <Link
                to="/now-showing"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#f0545c] text-white text-[13.5px] font-bold shadow-md hover:bg-[#d94048] transition-all hover:scale-105 active:scale-95"
              >
                <span>Browse Now Playing</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
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
