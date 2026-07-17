import { useState, useEffect } from "react";
import {
  Heart,
  PlayCircle,
  Bookmark,
  CheckCircle,
  Star,
  Trash2,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";

const IMG = (path) =>
  path?.startsWith("http") ? path : `${import.meta.env.VITE_API_URL}${path}`;

const TABS = [
  { id: "all",       label: "All" },
  { id: "watching",  label: "Watching" },
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
    color: "#b45309",
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
      className="group cursor-pointer rounded-2xl overflow-hidden bg-white transition-all duration-300"
      style={{
        border: "1px solid #efefef",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        opacity: removing ? 0.4 : 1,
        pointerEvents: removing ? "none" : "auto",
      }}
      onClick={() => navigate(`/movie/${movie.id}`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 10px 28px rgba(0,0,0,0.11)";
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: "2/3" }}>
        <img
          src={IMG(movie.poster)}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div
          className="absolute inset-0 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: "rgba(0,0,0,0.42)" }}
        />

        <div
          className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold text-white"
          style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(6px)" }}
        >
          <Star size={10} fill="#f59e0b" stroke="none" />
          {movie.rating ?? "—"}
        </div>

        <div
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(6px)" }}
        >
          <Icon
            size={13}
            style={{ color: st.color }}
            fill={movie.status === "favorites" ? st.color : "none"}
          />
        </div>

        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
            style={{ background: "#f0545c" }}
            onClick={(e) => { e.stopPropagation(); navigate(`/movie/${movie.id}`); }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#d94040")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f0545c")}
            title="View movie"
          >
            <PlayCircle size={18} className="text-white" />
          </button>
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.35)",
            }}
            onClick={handleRemove}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.45)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
            title="Remove from watchlist"
          >
            {removing ? (
              <Loader2 size={15} className="text-white animate-spin" />
            ) : (
              <Trash2 size={15} className="text-white" />
            )}
          </button>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: 40,
            background: "linear-gradient(to top, rgba(0,0,0,0.18), transparent)",
          }}
        />
      </div>

      <div className="px-3 pt-3 pb-3">
        <h3 className="text-[13px] font-semibold text-gray-900 truncate leading-snug">
          {movie.title}
        </h3>

        <div className="flex items-center justify-between mt-1.5">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer select-none transition-all active:scale-95"
            style={{ background: st.bg, color: st.color, borderColor: st.border }}
            onClick={(e) => {
              e.stopPropagation();
              const order = ["watching", "completed", "favorites"];
              const next = order[(order.indexOf(movie.status) + 1) % order.length];
              onStatusChange(movie.id, next);
            }}
            title="Click to change status"
          >
            <Icon size={9} />
            {st.label}
          </span>
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
    <div
      className="min-h-screen"
      style={{ fontFamily: "'Outfit', sans-serif", background: "#f5f5f5" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');`}</style>

      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-10 pt-6 sm:pt-10 pb-16">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-widest mb-1.5"
              style={{ color: "#f0545c" }}
            >
              Your Collection
            </p>
            <h1
              className="font-black leading-none tracking-tight text-gray-900"
              style={{ fontSize: "clamp(26px, 4vw, 38px)" }}
            >
              My Watchlist
            </h1>
          </div>

          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white self-start sm:self-auto"
            style={{ border: "1px solid #e5e7eb" }}
          >
            <Bookmark size={13} style={{ color: "#f0545c" }} />
            <span className="text-[13px] font-semibold text-gray-600">
              {movies.length} {movies.length === 1 ? "title" : "titles"} saved
            </span>
          </div>
        </div>

        <div
          className="flex items-center gap-1 p-1 rounded-2xl mb-8 w-fit bg-white overflow-x-auto max-w-full"
          style={{ border: "1px solid #e5e7eb", scrollbarWidth: "none" }}
        >
          {TABS.map(({ id, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all"
                style={
                  isActive
                    ? { background: "#f0545c", color: "#fff" }
                    : { background: "transparent", color: "#6b7280" }
                }
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = "#111827";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = "#6b7280";
                }}
              >
                {label}
                {counts[id] > 0 && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                    style={
                      isActive
                        ? { background: "rgba(255,255,255,0.25)", color: "#fff" }
                        : { background: "#f3f4f6", color: "#6b7280" }
                    }
                  >
                    {counts[id]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-32">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-[#f0545c] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-[15px] font-semibold text-gray-700 mb-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-[13px] font-semibold text-[#f0545c] hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-white"
              style={{ border: "1px solid #fce7e7" }}
            >
              <Bookmark size={30} style={{ color: "#f0545c", opacity: 0.45 }} />
            </div>
            <h3 className="text-[20px] font-bold text-gray-800 mb-2">
              {activeTab === "all" ? "Nothing here yet" : `No ${activeTab} titles`}
            </h3>
            <p className="text-[14px] text-gray-400">
              {activeTab === "all"
                ? "Start adding movies and shows you want to watch."
                : `Movies you mark as "${activeTab}" will appear here.`}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
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
  );
}


