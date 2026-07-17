import { useNavigate, useParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import {
  Play, ChevronLeft, ChevronRight, Ticket, X,
  CalendarDays, Share2, MapPin, MonitorPlay, Tv,
  ThumbsUp, Star, Clock, Shield, Globe,
  Bookmark, BookmarkCheck, Heart, PlayCircle, CheckCircle, Trash2,
} from "lucide-react";

const IMG = (path) => !path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
};

const formatVotes = (votes = 0) => {
  if (votes >= 1_000_000) return (votes / 1_000_000).toFixed(1) + "M";
  if (votes >= 1_000)     return (votes / 1_000).toFixed(1) + "K";
  return String(votes);
};

const getYoutubeEmbed = (url) => {
  const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
};

const groupCrew = (crew = []) => {
  const map = {};
  crew.forEach((m) => {
    const key = (m.name || "").toLowerCase().trim();
    if (!map[key]) {
      map[key] = { name: m.name, image: m.image, roles: m.position ? [m.position] : [] };
    } else {
      if (m.position && !map[key].roles.includes(m.position))
        map[key].roles.push(m.position);
    }
  });
  return Object.values(map);
};

const STORAGE_KEY = "voted_movies";
const getVoted = () => {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
  catch { return new Set(); }
};
const saveVoted = (set) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));

const STATUS_CONFIG = {
  upcoming:  { bg: "bg-orange-400/20", text: "text-orange-300", border: "border-orange-400/25" },
  released:  { bg: "bg-black/65",      text: "text-white/90",   border: "border-white/10" },
  streaming: { bg: "bg-indigo-500/20", text: "text-indigo-300", border: "border-indigo-400/25" },
};

// ─── Watchlist status options ────────────────────────────────────────────────
const WL_OPTIONS = [
  {
    value: "watching",
    label: "Watching",
    icon: PlayCircle,
    color: "#f0545c",
    activeBg: "rgba(240,84,92,0.18)",
  },
  {
    value: "completed",
    label: "Completed",
    icon: CheckCircle,
    color: "#059669",
    activeBg: "rgba(5,150,105,0.18)",
  },
  {
    value: "favorites",
    label: "Favorite",
    icon: Heart,
    color: "#b45309",
    activeBg: "rgba(180,83,9,0.18)",
  },
];

function useWatchlist(movieId) {
  const [wlState, setWlState] = useState({
    inWatchlist: false,
    status:      null,
    loading:     false, // false by default so guests see no spinner
  });
 
  const isLoggedIn = () => !!localStorage.getItem("accessToken");
 
  useEffect(() => {
    if (!movieId) return;
    if (!isLoggedIn()) return;
 
    setWlState((s) => ({ ...s, loading: true }));
    api
      .get(`/watchlist/check/${movieId}`)
      .then((res) =>
        setWlState({
          inWatchlist: res.data.inWatchlist,
          status:      res.data.status,
          loading:     false,
        })
      )
      .catch(() =>
        setWlState({ inWatchlist: false, status: null, loading: false })
      );
  }, [movieId]);
 
  const requireAuth = () => {
    if (!isLoggedIn()) {
      window.location.href = "/login";
      return false;
    }
    return true;
  };
 
  const add = async (status = "watching") => {
    if (!requireAuth()) return;
    setWlState((s) => ({ ...s, loading: true }));
    try {
      await api.post("/watchlist/add", { movieId, status });
      setWlState({ inWatchlist: true, status, loading: false });
    } catch {
      setWlState((s) => ({ ...s, loading: false }));
    }
  };
 
  const remove = async () => {
    if (!requireAuth()) return;
    setWlState((s) => ({ ...s, loading: true }));
    try {
      await api.post("/watchlist/remove", { movieId });
      setWlState({ inWatchlist: false, status: null, loading: false });
    } catch {
      setWlState((s) => ({ ...s, loading: false }));
    }
  };
 
  const updateStatus = async (status) => {
    if (!requireAuth()) return;
    setWlState((s) => ({ ...s, loading: true }));
    try {
      await api.patch("/watchlist/status", { movieId, status });
      setWlState({ inWatchlist: true, status, loading: false });
    } catch {
      setWlState((s) => ({ ...s, loading: false }));
    }
  };
 
  return { ...wlState, add, remove, updateStatus };
}


// ─── StatusPickerDropdown ─────────────────────────────────────────────────────
// Shown both when adding (initial pick) and when changing status of saved movie
function StatusPickerDropdown({ currentStatus, onPick, onRemove, showRemove, dropUp = true }) {
  return (
    <div
      className={`absolute ${dropUp ? "bottom-full mb-2" : "top-full mt-2"} right-0 rounded-2xl overflow-hidden z-50 py-1.5`}
      style={{
        background: "#1a1a1a",
        border: "1px solid rgba(255,255,255,0.1)",
        minWidth: 178,
        width: "max-content",
        maxWidth: "calc(100vw - 32px)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
      }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-widest px-4 pt-1 pb-2"
        style={{ color: "rgba(255,255,255,0.28)" }}
      >
        Add to watchlist
      </p>

      {WL_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isActive = currentStatus === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onPick(opt.value)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-left transition-all"
            style={{
              color: isActive ? opt.color : "rgba(255,255,255,0.7)",
              background: isActive ? opt.activeBg : "transparent",
            }}
            onMouseEnter={(e) => {
              if (!isActive)
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = "transparent";
            }}
          >
            <Icon
              size={14}
              style={{ color: isActive ? opt.color : "rgba(255,255,255,0.4)" }}
              fill={isActive && opt.value === "favorites" ? opt.color : "none"}
            />
            {opt.label}
            {isActive && (
              <span className="ml-auto">
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path
                    d="M1.5 6L4.5 9L10.5 3"
                    stroke={opt.color}
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
          </button>
        );
      })}

      {showRemove && (
        <>
          <div
            style={{
              borderTop: "0.5px solid rgba(255,255,255,0.07)",
              margin: "6px 12px",
            }}
          />
          <button
            onClick={onRemove}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-left transition-all"
            style={{ color: "rgba(240,84,92,0.75)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(240,84,92,0.08)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Trash2 size={13} />
            Remove from list
          </button>
        </>
      )}
    </div>
  );
}

// ─── WatchlistButton ─────────────────────────────────────────────────────────
function WatchlistButton({ movieId, mobile }) {
  const { inWatchlist, status, loading, add, remove, updateStatus } =
    useWatchlist(movieId);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = WL_OPTIONS.find((o) => o.value === status);
  const CurrentIcon = current?.icon || Bookmark;

  const handlePick = async (val) => {
    setOpen(false);
    if (inWatchlist) {
      await updateStatus(val);
    } else {
      await add(val);
    }
  };

  const handleRemove = async () => {
    setOpen(false);
    await remove();
  };

  // ── Loading skeleton ──
  if (loading) {
    return (
      <button
        disabled
        className="flex items-center justify-center gap-1.5 rounded-xl border font-semibold text-[13px] opacity-40 cursor-not-allowed"
        style={{
          borderColor: "rgba(255,255,255,0.2)",
          color: "rgba(255,255,255,0.5)",
          background: "rgba(255,255,255,0.06)",
          padding: mobile ? "10px 12px" : "10px 20px",
        }}
      >
        <Bookmark size={14} />
        {!mobile && <span>Watchlist</span>}
      </button>
    );
  }

  // ── Saved state: shows colored pill with dropdown to change/remove ──
  if (inWatchlist && current) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-xl border font-semibold text-[13px] transition-all"
          style={{
            borderColor: `${current.color}55`,
            color: current.color,
            background: `${current.color}1a`,
            padding: mobile ? "10px 12px" : "10px 20px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${current.color}2e`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${current.color}1a`;
          }}
        >
          <BookmarkCheck
            size={14}
            style={{ color: current.color }}
          />
          {!mobile && (
            <>
              <span>{current.label}</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                style={{
                  opacity: 0.55,
                  transform: open ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.15s",
                }}
              >
                <path
                  d="M2 3.5L5 6.5L8 3.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </>
          )}
        </button>

        {open && (
          <StatusPickerDropdown
            currentStatus={status}
            onPick={handlePick}
            onRemove={handleRemove}
            showRemove={true}
            dropUp={true}
          />
        )}
      </div>
    );
  }

  // ── Not saved: clicking opens status picker ──
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-xl border font-semibold text-[13px] transition-all active:scale-95"
        style={{
          borderColor: "rgba(255,255,255,0.2)",
          color: "rgba(255,255,255,0.65)",
          background: "rgba(255,255,255,0.07)",
          padding: mobile ? "10px 12px" : "10px 20px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.38)";
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.background = "rgba(255,255,255,0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
          e.currentTarget.style.color = "rgba(255,255,255,0.65)";
          e.currentTarget.style.background = "rgba(255,255,255,0.07)";
        }}
      >
        <Bookmark size={14} />
        {!mobile && <span>Watchlist</span>}
      </button>

      {open && (
        <StatusPickerDropdown
          currentStatus={null}
          onPick={handlePick}
          onRemove={null}
          showRemove={false}
          dropUp={true}
        />
      )}
    </div>
  );
}

function AgeGatePopup({ onConfirm, onBack }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onBack}>
      <div className="bg-white rounded-2xl w-[340px] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        {/* Body */}
        <div className="px-5 pt-6 pb-5">
          <h2 className="text-[18px] font-extrabold text-gray-900 mb-4"
            style={{ letterSpacing: "-0.2px" }}>
            This movie is rated "A"
          </h2>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-[58px] h-[58px] rounded-full flex items-center justify-center"
              style={{ border: "3px solid #f0545c" }}>
              <span className="text-[18px] font-extrabold" style={{ color: "#f0545c" }}>18+</span>
            </div>
            <p className="text-[13px] text-gray-500 leading-relaxed flex-1">
              This movie is only for viewers above 18. Please carry a valid ID/Age Proof
              to the theatre. If you are denied entry due to age or ID issues, you will
              not get a refund.
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onConfirm}
          className="w-full py-4 text-[15px] font-bold text-white transition-all"
          style={{ background: "#f0545c" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#d94048")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#f0545c")}>
          Continue
        </button>

      </div>
    </div>
  );
}

export default function MovieDetailWrapper() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    api.get(`/movies/${id}`).then((res) => setMovie(res.data));
  }, [id]);

  if (!movie)
    return (
      <div className="flex items-center justify-center h-screen bg-white">
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
    );

  return <MovieDetail movie={movie} />;
}

function MovieDetail({ movie }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showAgeGate, setShowAgeGate] = useState(false);  
  const [votes, setVotes] = useState(movie.votes || 0);
  const [voted, setVoted] = useState(() => getVoted().has(movie._id));

  const status = movie.status || "upcoming";
  const cfg    = STATUS_CONFIG[status] || STATUS_CONFIG.upcoming;

  const handleVote = async () => {
    if (voted) return;
    setVotes((v) => v + 1);
    setVoted(true);
    const next = getVoted();
    next.add(movie._id);
    saveVoted(next);
    try {
      await api.put(`/movies/vote/${movie._id}`);
    } catch {
      setVotes((v) => Math.max(0, v - 1));
      setVoted(false);
      const rollback = getVoted();
      rollback.delete(movie._id);
      saveVoted(rollback);
    }
  };

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f5f5]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');`}</style>

      <Navbar />

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden" style={{ background: "#1c1c1c" }}>

        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${IMG(movie.poster)})`,
            backgroundSize: "cover",
            backgroundPosition: "center 15%",
            filter: "blur(0px) brightness(0.2) saturate(1.4)",
            transform: "scale(1.06)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(15,15,15,0.97) 0%, rgba(15,15,15,0.7) 55%, rgba(15,15,15,0.3) 100%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-10 md:h-14"
          style={{ background: "linear-gradient(to bottom, transparent, #f5f5f5)" }}
        />

        <button className="absolute top-4 right-4 md:right-6 flex items-center gap-1.5 text-white/60 hover:text-white text-[13px] transition-colors z-10 font-medium">
          <Share2 size={14} /> <span className="hidden sm:inline">Share</span>
        </button>

        {/* ── Mobile Layout ── */}
        <div className="relative z-10 flex flex-col md:hidden px-4 pt-6 pb-2">
          <div className="flex gap-4 items-start">
            {/* poster */}
            <div className="flex-shrink-0" style={{ width: 110 }}>
              <div
                className="relative rounded-xl overflow-hidden shadow-2xl"
                style={{ aspectRatio: "2/3" }}
              >
                <img
                  src={IMG(movie.poster)}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute bottom-0 left-0 right-0 h-12 rounded-b-xl pointer-events-none"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}
                />
                {movie.trailerLink && (
                  <button
                    onClick={() => setShowTrailer(true)}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full whitespace-nowrap"
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <Play size={9} fill="white" className="text-white" />
                    <span className="text-[10px] font-semibold text-white">Trailer</span>
                  </button>
                )}
              </div>
              <div
                className={`mt-2 w-full text-center text-[10px] font-semibold py-1 rounded-lg border ${cfg.bg} ${cfg.text} ${cfg.border}`}
              >
                {status === "released" && (
                  <span className="flex items-center justify-center gap-1">
                    <MapPin size={9} /> {movie.isInCinemas ? "In Cinemas" : "Released"}
                  </span>
                )}
                {status === "upcoming" && (
                  <span className="flex items-center justify-center gap-1">
                    <CalendarDays size={9} /> Releasing Soon
                  </span>
                )}
                {status === "streaming" && (
                  <span className="flex items-center justify-center gap-1">
                    <MonitorPlay size={9} /> {movie.ottPlatform || "Streaming"}
                  </span>
                )}
              </div>
            </div>

            {/* meta */}
            <div className="flex-1 min-w-0 pt-1 flex flex-col gap-2">
              <h1 className="text-white text-[20px] font-bold tracking-tight leading-snug">
                {movie.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                {movie.duration && (
                  <span className="text-white/50 text-[11px] flex items-center gap-0.5">
                    <Clock size={10} /> {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
                  </span>
                )}
                {movie.duration && movie.genre && (
                  <span className="text-white/25 text-[10px]">•</span>
                )}
                {movie.genre && (
                  <span className="text-white/50 text-[11px]">{movie.genre}</span>
                )}
                {movie.certificate && (
                  <span className="text-white/25 text-[10px]">•</span>
                )}
                {movie.certificate && (
                  <span className="text-white/50 text-[11px] flex items-center gap-0.5">
                    <Shield size={10} /> {movie.certificate}
                  </span>
                )}
                {movie.language && (
                  <span className="text-white/25 text-[10px]">•</span>
                )}
                {movie.language && (
                  <span className="text-white/50 text-[11px] flex items-center gap-0.5">
                    <Globe size={10} /> {movie.language}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Star size={12} fill="#f0545c" className="text-[#f0545c]" />
                <span className="text-white font-bold text-[13px]">
                  {movie.rating ?? "—"}/10
                </span>
                <span className="text-white/40 text-[11px]">{formatVotes(votes)} Votes</span>
              </div>
              {movie.formats?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {movie.formats.map((f) => (
                    <span
                      key={f}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded border border-white/20 text-white/50"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 pb-2 flex-wrap">
            {status === "released" && (
              <>
                <button
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#f0545c] hover:bg-[#d94048] text-white font-semibold py-2.5 rounded-xl text-[13px] transition-colors"
                  onClick={() => movie.certificate === "A" ? setShowAgeGate(true) : navigate(`/movie/${movie._id}/book`)}                
                  >
                  <Ticket size={14} /> Book Tickets
                </button>
                <VoteButton voted={voted} votes={votes} status={status} onVote={handleVote} mobile />
                <WatchlistButton movieId={movie._id} mobile />
              </>
            )}
            {status === "upcoming" && (
              <>
                <div
                  className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2"
                >
                  <CalendarDays size={14} className="text-orange-400 flex-shrink-0" />
                  <div>
                    <p className="text-white/35 text-[9px] uppercase tracking-widest font-semibold">
                      Releasing On
                    </p>
                    <p className="text-white font-semibold text-[12px]">
                      {formatDateShort(movie.releaseDate)}
                    </p>
                  </div>
                </div>
                <VoteButton voted={voted} votes={votes} status={status} onVote={handleVote} mobile />
                <WatchlistButton movieId={movie._id} mobile />
              </>
            )}
            {status === "streaming" && (
              <>
                {movie.ottPlatform && (
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 font-semibold py-2.5 rounded-xl text-[13px] transition-all border border-indigo-400/40 text-indigo-300"
                    style={{ background: "rgba(99,102,241,0.12)" }}
                  >
                    <MonitorPlay size={14} /> {movie.ottPlatform}
                  </button>
                )}
                <VoteButton voted={voted} votes={votes} status={status} onVote={handleVote} mobile />
                <WatchlistButton movieId={movie._id} mobile />
              </>
            )}
          </div>
        </div>

        {/* ── Desktop Layout ── */}
        <div className="relative z-10 hidden md:flex items-start gap-10 px-16 py-8 max-w-6xl mx-auto">
          {/* poster col */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="relative group" style={{ width: 150 }}>
              <img
                src={IMG(movie.poster)}
                alt={movie.title}
                className="rounded-xl object-cover shadow-2xl w-full"
                style={{ aspectRatio: "2/3" }}
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-16 rounded-b-xl pointer-events-none"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }}
              />
              {movie.trailerLink && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.35)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <Play size={11} fill="white" className="text-white flex-shrink-0" />
                  <span className="text-[11px] font-semibold text-white tracking-wide">
                    Trailer
                  </span>
                </button>
              )}
            </div>
            <div
              className={`w-full text-center text-[11px] font-semibold py-1.5 rounded-lg border ${cfg.bg} ${cfg.text} ${cfg.border}`}
              style={{ width: 150 }}
            >
              {status === "released" && (
                <span className="flex items-center justify-center gap-1.5">
                  <MapPin size={11} /> {movie.isInCinemas ? "In Cinemas" : "Released"}
                </span>
              )}
              {status === "upcoming" && (
                <span className="flex items-center justify-center gap-1.5">
                  <CalendarDays size={11} /> Releasing Soon
                </span>
              )}
              {status === "streaming" && (
                <span className="flex items-center justify-center gap-1.5">
                  <MonitorPlay size={11} /> {movie.ottPlatform || "Streaming"}
                </span>
              )}
            </div>
          </div>

          {/* info col */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-3 pt-2">
            <h1 className="text-white text-[28px] font-bold tracking-tight leading-tight">
              {movie.title}
            </h1>
            <p className="text-white/45 text-[13px] flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {movie.duration && (
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
                </span>
              )}
              {movie.duration && <span>•</span>}
              {movie.genre && <span>{movie.genre}</span>}
              {movie.genre && movie.language && <span>•</span>}
              {movie.language && (
                <span className="flex items-center gap-1">
                  <Globe size={11} /> {movie.language}
                </span>
              )}
              {movie.certificate && <span>•</span>}
              {movie.certificate && (
                <span className="flex items-center gap-1">
                  <Shield size={11} /> {movie.certificate}
                </span>
              )}
              {movie.releaseDate && <span>•</span>}
              {movie.releaseDate && <span>{formatDate(movie.releaseDate)}</span>}
            </p>

            {movie.formats?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {movie.formats.map((f) => (
                  <span
                    key={f}
                    className="text-[11px] font-semibold px-3 py-1 rounded border border-white/20 text-white/55 tracking-wide"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Star size={14} fill="#f0545c" className="text-[#f0545c]" />
              <span className="text-white font-bold text-[14px]">
                {movie.rating ?? "—"}/10
              </span>
              <span className="text-white/40 text-[12px]">{formatVotes(votes)} Votes</span>
            </div>

            {/* ── Desktop CTA rows — all 3 status variants ── */}
            {status === "released" && (
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <button
                  className="flex items-center gap-2 bg-[#f0545c] hover:bg-[#d94048] text-white font-semibold px-10 py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-red-900/25"
                  onClick={() => movie.certificate === "A" ? setShowAgeGate(true) : navigate(`/movie/${movie._id}/book`)}
                >
                  <Ticket size={15} /> Book Tickets
                </button>
                <VoteButton voted={voted} votes={votes} status={status} onVote={handleVote} />
                <WatchlistButton movieId={movie._id} />
              </div>
            )}
            {status === "upcoming" && (
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <div className="inline-flex items-center gap-3 bg-white/5 border border-white/12 rounded-xl px-4 py-2.5">
                  <CalendarDays size={16} className="text-orange-400 flex-shrink-0" />
                  <div>
                    <p className="text-white/35 text-[10px] uppercase tracking-widest font-semibold">
                      Releasing On
                    </p>
                    <p className="text-white font-semibold text-[13px] mt-0.5">
                      {formatDate(movie.releaseDate)}
                    </p>
                  </div>
                </div>
                <VoteButton voted={voted} votes={votes} status={status} onVote={handleVote} />
                <WatchlistButton movieId={movie._id} />
              </div>
            )}
            {status === "streaming" && (
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {movie.ottPlatform && (
                  <button
                    className="flex items-center gap-2 font-semibold px-8 py-2.5 rounded-xl text-sm border border-indigo-400/40 text-indigo-300 hover:bg-indigo-500/20 transition-all"
                    style={{ background: "rgba(99,102,241,0.12)" }}
                  >
                    <MonitorPlay size={15} /> Watch on {movie.ottPlatform}
                  </button>
                )}
                <VoteButton voted={voted} votes={votes} status={status} onVote={handleVote} />
                <WatchlistButton movieId={movie._id} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body sections (unchanged) ── */}
      <div className="bg-white">
        <div className="px-4 md:px-16 py-6 md:py-8 border-b border-gray-100 max-w-6xl mx-auto">
          <SectionTitle>About the movie</SectionTitle>
          <p className="text-gray-500 text-[13px] md:text-[14px] leading-relaxed">
            {movie.description}
          </p>
        </div>

        {(movie.language ||
          movie.duration ||
          movie.certificate ||
          movie.isInCinemas ||
          movie.ottPlatform ||
          movie.formats?.length > 0) && (
          <div className="px-4 md:px-16 py-5 md:py-6 border-b border-gray-100 max-w-6xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-x-6 md:gap-x-8 gap-y-4">
              {movie.language && (
                <InfoStat icon={Globe} label="Language" value={movie.language} />
              )}
              {movie.duration && (
                <InfoStat
                  icon={Clock}
                  label="Duration"
                  value={`${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m`}
                />
              )}
              {movie.certificate && (
                <InfoStat icon={Shield} label="Certificate" value={movie.certificate} />
              )}
              {movie.isInCinemas && (
                <InfoStat
                  icon={Tv}
                  label="Cinemas"
                  value="Now Showing"
                  valueClass="text-green-600"
                />
              )}
              {movie.status === "streaming" && movie.ottPlatform && (
                <InfoStat
                  icon={MonitorPlay}
                  label="Streaming On"
                  value={movie.ottPlatform}
                  valueClass="text-indigo-600"
                />
              )}
              {movie.formats?.length > 0 && (
                <div className="col-span-2 sm:col-span-3 md:col-span-1">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                    <Star size={9} /> Formats
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {movie.formats.map((f) => (
                      <span
                        key={f}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded border border-gray-200 text-gray-600 bg-gray-50"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {movie.cast?.length > 0 && (
          <div className="px-4 md:px-16 py-6 md:py-8 border-b border-gray-100 max-w-6xl mx-auto">
            <SectionTitle>Cast</SectionTitle>
            <CastSlider data={movie.cast} />
          </div>
        )}

        {movie.crew?.length > 0 && (
          <div className="px-4 md:px-16 py-6 md:py-8 border-b border-gray-100 max-w-6xl mx-auto">
            <SectionTitle>Crew</SectionTitle>
            <CrewSlider data={groupCrew(movie.crew)} />
          </div>
        )}

        {movie.similarMovies?.length > 0 && (
          <div className="px-4 md:px-16 py-6 md:py-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <SectionTitle noMargin>You might also like</SectionTitle>
              <button className="text-[#f0545c] text-[13px] font-semibold flex items-center gap-0.5 hover:underline">
                View All <ChevronRight size={14} />
              </button>
            </div>
            <SimilarMovies movies={movie.similarMovies} />
          </div>
        )}
      </div>

      {showAgeGate && (
        <AgeGatePopup
          onConfirm={() => { setShowAgeGate(false); navigate(`/movie/${movie._id}/book`); }}
          onBack={() => setShowAgeGate(false)}
        />
      )}

      {/* ── Trailer modal ── */}
      {showTrailer && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-3 md:p-4">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute -top-9 right-0 text-white/60 hover:text-white flex items-center gap-1.5 text-[13px] transition-colors"
            >
              <X size={14} /> Close
            </button>
            <div className="rounded-xl md:rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <iframe
                className="w-full aspect-video"
                src={getYoutubeEmbed(movie.trailerLink)}
                title="Trailer"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components (unchanged from original) ─────────────────────────────────

function VoteButton({ voted, votes, status, onVote, mobile }) {
  const isUpcoming  = status === "upcoming";
  const activeColor = isUpcoming ? "rgba(234,88,12,0.85)" : "rgba(240,84,92,0.85)";
  const activeBorder= isUpcoming ? "rgba(234,88,12,0.5)"  : "rgba(240,84,92,0.5)";

  return (
    <button
      onClick={onVote}
      disabled={voted}
      className={`flex items-center justify-center gap-1.5 font-semibold rounded-xl text-[13px] transition-all border ${mobile ? "px-3 py-2.5" : "px-5 py-2.5"}`}
      style={{
        borderColor: voted ? activeBorder            : "rgba(255,255,255,0.2)",
        color:       voted ? "#fff"                  : "rgba(255,255,255,0.65)",
        background:  voted ? activeColor             : "rgba(255,255,255,0.07)",
        cursor:      voted ? "default"               : "pointer",
        minWidth:    mobile ? 44 : undefined,
      }}
    >
      <ThumbsUp size={13} fill={voted ? "#fff" : "none"} />
      {!mobile && (
        <span>
          {isUpcoming
            ? voted ? `Notified · ${formatVotes(votes)}` : "Notify Me"
            : voted ? `Interested · ${formatVotes(votes)}` : "Interested"}
        </span>
      )}
      {mobile && voted && <span className="text-[11px]">{formatVotes(votes)}</span>}
    </button>
  );
}

function InfoStat({ icon: Icon, label, value, valueClass = "text-gray-900" }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1">
        <Icon size={9} /> {label}
      </p>
      <p className={`text-[13px] font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

function SectionTitle({ children, noMargin }) {
  return (
    <h2
      className={`text-[15px] md:text-[16px] font-bold text-gray-900 ${noMargin ? "" : "mb-4 md:mb-5"}`}
      style={{ letterSpacing: "-0.01em" }}
    >
      {children}
    </h2>
  );
}

function SliderArrow({ dir, top, onClick }) {
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      className="absolute z-10 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:border-gray-400 hover:shadow-lg transition-all"
      style={{
        [dir === "left" ? "left" : "right"]: -12,
        top,
        transform: "translateY(-50%)",
      }}
    >
      {dir === "left" ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
    </button>
  );
}

function CastSlider({ data }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft]   = useState(false);
  const [canRight, setCanRight] = useState(false);

  const check = () => {
    if (!ref.current) return;
    setCanLeft(ref.current.scrollLeft > 4);
    setCanRight(
      ref.current.scrollLeft < ref.current.scrollWidth - ref.current.clientWidth - 4
    );
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    check();
    el.addEventListener("scroll", check);
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [data]);

  return (
    <div className="relative">
      {canLeft && (
        <SliderArrow
          dir="left"
          top={65}
          onClick={() => ref.current?.scrollBy({ left: -400, behavior: "smooth" })}
        />
      )}
      {canRight && (
        <SliderArrow
          dir="right"
          top={65}
          onClick={() => ref.current?.scrollBy({ left: 400, behavior: "smooth" })}
        />
      )}
      <div
        ref={ref}
        className="flex gap-3 md:gap-4 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {data.map((item, i) => (
          <div key={i} className="flex-shrink-0 w-[100px] md:w-[130px] group cursor-default">
            <div
              className="relative rounded-xl overflow-hidden bg-gray-100 shadow-sm"
              style={{ aspectRatio: "3/4", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <img
                src={IMG(item.image)}
                alt={item.name}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <p className="mt-1.5 text-[12px] md:text-[13px] font-bold text-gray-900 leading-tight line-clamp-1">
              {item.name}
            </p>
            {item.role && (
              <p
                className="mt-0.5 text-[10px] md:text-[11px] font-medium italic line-clamp-1 leading-snug"
                style={{ color: "#8a3a3e" }}
              >
                as {item.role}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CrewSlider({ data }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft]   = useState(false);
  const [canRight, setCanRight] = useState(false);

  const check = () => {
    if (!ref.current) return;
    setCanLeft(ref.current.scrollLeft > 4);
    setCanRight(
      ref.current.scrollLeft < ref.current.scrollWidth - ref.current.clientWidth - 4
    );
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    check();
    el.addEventListener("scroll", check);
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [data]);

  return (
    <div className="relative">
      {canLeft && (
        <SliderArrow
          dir="left"
          top={60}
          onClick={() => ref.current?.scrollBy({ left: -400, behavior: "smooth" })}
        />
      )}
      {canRight && (
        <SliderArrow
          dir="right"
          top={60}
          onClick={() => ref.current?.scrollBy({ left: 400, behavior: "smooth" })}
        />
      )}
      <div
        ref={ref}
        className="flex gap-3 md:gap-4 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {data.map((item, i) => (
          <CrewCard key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

function CrewCard({ item }) {
  return (
    <div className="flex-shrink-0 w-[120px] md:w-[148px] rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white group hover:shadow-md transition-all cursor-default">
      <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: "1/1" }}>
        <img
          src={IMG(item.image)}
          alt={item.name}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="px-2.5 md:px-3 pt-2 pb-2.5">
        <p className="text-[12px] md:text-[13px] font-bold text-gray-900 line-clamp-1 leading-tight">
          {item.name}
        </p>
        <p
          className="mt-0.5 text-[10px] md:text-[11px] font-medium line-clamp-1 leading-snug"
          style={{ color: "#f0545c" }}
          title={item.roles.join(" · ")}
        >
          {item.roles.join(" · ")}
        </p>
      </div>
    </div>
  );
}

function SimilarMovies({ movies }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft]   = useState(false);
  const [canRight, setCanRight] = useState(false);

  const check = () => {
    if (!ref.current) return;
    setCanLeft(ref.current.scrollLeft > 4);
    setCanRight(
      ref.current.scrollLeft < ref.current.scrollWidth - ref.current.clientWidth - 4
    );
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    check();
    el.addEventListener("scroll", check);
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [movies]);

  return (
    <div className="relative">
      {canLeft && (
        <SliderArrow
          dir="left"
          top={85}
          onClick={() => ref.current?.scrollBy({ left: -400, behavior: "smooth" })}
        />
      )}
      {canRight && (
        <SliderArrow
          dir="right"
          top={85}
          onClick={() => ref.current?.scrollBy({ left: 400, behavior: "smooth" })}
        />
      )}
      <div
        ref={ref}
        className="flex gap-3 md:gap-4 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {movies.map((m, i) => (
          <a key={i} href={`/movie/${m._id}`} className="flex-shrink-0 w-[120px] md:w-[148px] group no-underline">
            <div className="relative rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              <img
                src={IMG(m.poster)}
                alt={m.title}
                className="w-full h-[160px] md:h-[200px] object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div
                className="absolute bottom-0 left-0 right-0 py-1.5 text-center text-[9px] md:text-[10px] font-bold tracking-wide uppercase"
                style={{
                  background:
                    m.status === "streaming"
                      ? "rgba(99,102,241,0.85)"
                      : m.status === "released"
                      ? "rgba(0,0,0,0.65)"
                      : "rgba(234,88,12,0.85)",
                  color: "#fff",
                }}
              >
                {m.status === "streaming"
                  ? m.ottPlatform || "Streaming"
                  : m.status === "released"
                  ? "In Cinemas"
                  : formatDateShort(m.releaseDate)}
              </div>
            </div>
            <p className="mt-1.5 text-[12px] md:text-[13px] font-semibold text-gray-900 line-clamp-1 group-hover:text-[#f0545c] transition-colors">
              {m.title}
            </p>
            <p className="text-[11px] md:text-[12px] text-gray-400 mt-0.5">{m.genre}</p>
          </a>
        ))}
      </div>
    </div>
  );
}


