import { useNavigate, useParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import Footer from "./Footer";
import PageBackgroundWatermark from "../components/PageBackgroundWatermark";
import PageLoader from "../components/PageLoader";
import { MovieDetailArt } from "../components/CinemaIllustrations";
import {
  Play, ChevronLeft, ChevronRight, Ticket, X, ArrowLeft,
  CalendarDays, Share2, MonitorPlay,
  ThumbsUp, Star, Clock, Globe, Film,
  Bookmark, BookmarkCheck, Heart, PlayCircle, CheckCircle, Trash2,
  Sparkles, ShieldCheck,
} from "lucide-react";
import OfferBadge from "./OfferBadge";

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

const getGenreList = (movie) => {
  if (Array.isArray(movie.genres) && movie.genres.length) return movie.genres;
  if (movie.genre) return movie.genre.split(/[,/]/).map((g) => g.trim()).filter(Boolean);
  return [];
};

const getLanguageLabel = (movie) => {
  if (Array.isArray(movie.languages) && movie.languages.length) {
    const [first, ...rest] = movie.languages;
    return rest.length ? `${first} +${rest.length} more` : first;
  }
  return movie.language || "";
};

const getReleaseLine = (movie, status) => {
  if (status === "released") {
    return movie.releaseDate ? `Released ${formatDate(movie.releaseDate)}` : "Now in cinemas";
  }
  if (status === "upcoming") {
    return movie.releaseDate ? `Releasing ${formatDate(movie.releaseDate)}` : "Releasing soon";
  }
  if (status === "streaming") {
    return movie.ottPlatform ? `Streaming on ${movie.ottPlatform}` : "Now streaming";
  }
  return "";
};

const STORAGE_KEY = "voted_movies";
const getVoted = () => {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
  catch { return new Set(); }
};
const saveVoted = (set) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));

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
    color: "#d97706",
    activeBg: "rgba(217,119,6,0.18)",
  },
];

function useWatchlist(movieId) {
  const [wlState, setWlState] = useState({
    inWatchlist: false,
    status:      null,
    loading:     false,
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

function StatusPickerDropdown({ currentStatus, onPick, onRemove, showRemove, dropUp = true }) {
  return (
    <div
      className={`absolute ${dropUp ? "bottom-full mb-2" : "top-full mt-2"} right-0 rounded-2xl overflow-hidden z-50 py-1.5 shadow-2xl backdrop-blur-xl border border-white/10`}
      style={{
        background: "rgba(22,23,30,0.95)",
        minWidth: 180,
      }}
    >
      <p
        className="text-[10px] font-extrabold uppercase tracking-widest px-4 pt-1.5 pb-2 text-white/40"
      >
        Watchlist Status
      </p>

      {WL_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isActive = currentStatus === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onPick(opt.value)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-bold text-left transition-all"
            style={{
              color: isActive ? opt.color : "rgba(255,255,255,0.75)",
              background: isActive ? opt.activeBg : "transparent",
            }}
          >
            <Icon
              size={15}
              style={{ color: isActive ? opt.color : "rgba(255,255,255,0.4)" }}
              fill={isActive && opt.value === "favorites" ? opt.color : "none"}
            />
            <span>{opt.label}</span>
            {isActive && (
              <span className="ml-auto text-emerald-400">
                <CheckCircle size={13} />
              </span>
            )}
          </button>
        );
      })}

      {showRemove && (
        <div className="border-t border-white/10 mt-1 pt-1">
          <button
            onClick={onRemove}
            className="w-full flex items-center gap-2 px-4 py-2 text-[12px] font-bold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={13} /> Remove
          </button>
        </div>
      )}
    </div>
  );
}

function WatchlistButton({ movieId, mobile = false, light = false, pill = false }) {
  const { inWatchlist, status, loading, add, remove, updateStatus } = useWatchlist(movieId);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const handlePick = (newStatus) => {
    if (!inWatchlist) add(newStatus);
    else updateStatus(newStatus);
    setOpen(false);
  };

  const handleRemove = () => {
    remove();
    setOpen(false);
  };

  const current = WL_OPTIONS.find((o) => o.value === status);
  const shape = pill ? "rounded-full" : "rounded-2xl";

  if (loading) {
    return (
      <button
        disabled
        className={`flex items-center justify-center border font-bold text-[13px] transition-all ${shape} ${
          pill ? "w-11 h-11" : mobile ? "px-3 py-2.5" : "px-6 py-3"
        } bg-white/5 border-white/15 text-white/50`}
      >
        <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-[#f0545c] rounded-full animate-spin" />
      </button>
    );
  }

  if (inWatchlist && current) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center justify-center gap-2 border font-bold text-[13px] transition-all shadow-md ${shape} ${
            pill ? "w-11 h-11 p-0" : mobile ? "px-3.5 py-2.5" : "px-6 py-3"
          }`}
          style={{
            borderColor: `${current.color}66`,
            color: current.color,
            background: `${current.color}1a`,
          }}
        >
          <BookmarkCheck size={16} />
          {!mobile && !pill && <span>{current.label}</span>}
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-center gap-2 font-bold text-[13px] transition-all shadow-md active:scale-95 ${shape} ${
          pill ? "w-11 h-11 p-0" : mobile ? "px-3.5 py-2.5" : "px-6 py-3"
        } ${
          light
            ? "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            : "backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white"
        }`}
      >
        <Bookmark size={15} />
        {!mobile && !pill && <span>Watchlist</span>}
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
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onBack}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-50 text-[#f0545c] mb-4 border border-[#f0545c]/20">
            <span className="text-[20px] font-black">18+</span>
          </div>

          <h2 className="text-[20px] font-black text-gray-900 tracking-tight mb-2">
            Age Verification (Rated A)
          </h2>
          <p className="text-[13px] text-gray-500 leading-relaxed">
            This movie is intended solely for adult viewers aged 18 and above. Please carry government-issued photo identification to the cinema. Entry is strictly restricted by theatre staff without refund for age non-compliance.
          </p>
        </div>

        <div className="flex border-t border-gray-100">
          <button
            onClick={onBack}
            className="flex-1 py-4 text-[13.5px] font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 text-[13.5px] font-black text-white transition-all shadow-inner"
            style={{ background: "linear-gradient(135deg, #f0545c 0%, #e03a43 100%)" }}
          >
            I Agree &amp; Proceed
          </button>
        </div>
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
    return <PageLoader text="Loading movie synopsis, cast details and showtimes..." />;

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

  const status   = movie.status || "upcoming";
  const genres   = getGenreList(movie);
  const langLbl  = getLanguageLabel(movie);
  const releaseLine = getReleaseLine(movie, status);

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

  const goToBooking = () =>
    movie.certificate === "A" ? setShowAgeGate(true) : navigate(`/movie/${movie._id}/book`);

  const PrimaryCta = ({ mobile, wide }) => {
    if (status === "released") {
      return (
        <button
          onClick={goToBooking}
          className={`flex items-center justify-center gap-2 text-white font-bold transition-all bg-[#f0545c] hover:bg-[#e03a43] shadow-sm hover:shadow active:scale-[0.98] ${
            wide
              ? "flex-1 py-3.5 rounded-xl text-[14px]"
              : mobile
              ? "flex-1 py-3 rounded-xl text-[13px]"
              : "px-8 py-3 rounded-xl text-[14.5px]"
          }`}
        >
          <Ticket size={wide ? 18 : mobile ? 15 : 17} />
          <span>Book Tickets</span>
        </button>
      );
    }
    if (status === "streaming" && movie.ottPlatform) {
      return (
        <button
          className={`flex items-center justify-center gap-2 font-bold transition-all border border-indigo-400/40 text-white ${
            wide
              ? "flex-1 py-3.5 rounded-2xl text-[14px] bg-indigo-600 shadow-md"
              : mobile
              ? "flex-1 py-3 rounded-xl text-[13px] bg-indigo-600"
              : "px-8 py-3 rounded-2xl text-[14.5px] bg-indigo-600/90 hover:bg-indigo-600"
          }`}
        >
          <MonitorPlay size={wide ? 18 : mobile ? 15 : 17} />
          <span>Watch on {movie.ottPlatform}</span>
        </button>
      );
    }
    if (wide) {
      return (
        <div
          className="flex-1 flex items-center gap-2.5 bg-white rounded-2xl px-4 py-2.5 shadow-md border border-gray-100"
        >
          <CalendarDays size={16} className="text-orange-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-gray-400 text-[9.5px] uppercase tracking-widest font-extrabold leading-none">Releases On</p>
            <p className="text-gray-900 font-extrabold text-[12.5px] mt-0.5 truncate">{formatDateShort(movie.releaseDate)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const [activeTab, setActiveTab] = useState("about");

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-neutral-900 flex flex-col justify-between relative overflow-hidden selection:bg-[#ff4d58] selection:text-white">
      {/* Background Watermark (Image 2) */}
      <PageBackgroundWatermark variant="movies" />

      <div className="relative z-10">
        <Navbar />

        {/* ── Main Container ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          
          {/* Breadcrumb (Mockup Top-Right) */}
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="hover:text-neutral-900 flex items-center gap-1 cursor-pointer transition-colors"
            >
              ← Movies
            </button>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-800 font-bold truncate max-w-xs">{movie.title}</span>
          </div>

          {/* ══════════════════════════ HERO CARD (Mockup Top-Right) ══════════════════════════ */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#fff5f6] via-white to-[#fef7f2] border border-rose-100 shadow-[0_10px_30px_rgba(255,77,88,0.06)] p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 lg:gap-10">
              
              {/* Left: Movie Poster with Play Overlay */}
              <div className="flex-shrink-0 w-44 sm:w-52">
                <div
                  className="relative rounded-2xl overflow-hidden shadow-xl border border-neutral-200/80 aspect-[2/3] group cursor-pointer"
                  onClick={() => movie.trailerLink && setShowTrailer(true)}
                >
                  <img
                    src={IMG(movie.poster)}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {movie.trailerLink && (
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center transition-opacity">
                      <div className="w-13 h-13 rounded-full bg-white/95 text-[#ff4d58] shadow-xl flex items-center justify-center transition-transform group-hover:scale-110">
                        <Play size={20} fill="#ff4d58" className="ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Center: Movie Details */}
              <div className="flex-1 min-w-0 flex flex-col items-start gap-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-neutral-900 tracking-tight leading-tight">
                  {movie.title}
                </h1>

                {/* Badges Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#ff4d58] text-white shadow-2xs">
                    {status === "released" ? "In Cinemas" : status === "streaming" ? "Streaming" : "Coming Soon"}
                  </span>
                  {movie.certificate && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg border border-neutral-200 text-neutral-700 bg-white">
                      {movie.certificate}
                    </span>
                  )}
                  <OfferBadge type="movies" id={movie._id} genre={movie.genre} size="sm" />
                </div>

                {/* Metadata Line */}
                <p className="text-xs sm:text-sm font-semibold text-neutral-500">
                  {[langLbl, genres.join(", ")].filter(Boolean).join(" · ")}
                </p>

                {/* Release Date & Rating */}
                <div className="flex items-center gap-4 text-xs font-semibold text-neutral-600 flex-wrap">
                  {movie.releaseDate && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={14} className="text-[#ff4d58]" />
                      <span>Released {formatDateShort(movie.releaseDate)}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star size={13} fill="#facc15" className="text-yellow-400" />
                    <span className="font-bold text-neutral-900">{movie.rating ?? "—"}/10</span>
                    <span className="text-neutral-400 font-normal">({formatVotes(votes)} votes)</span>
                  </span>
                </div>

                {/* Action Buttons Row (Matching Mockup) */}
                <div className="flex items-center gap-3 flex-wrap mt-2 pt-2">
                  <PrimaryCta />
                  <VoteButton voted={voted} votes={votes} status={status} onVote={handleVote} light />
                  <WatchlistButton movieId={movie._id} light />
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: movie.title, url: window.location.href }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Link copied to clipboard!");
                      }
                    }}
                    className="p-3 rounded-2xl bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 hover:text-black transition-all shadow-xs cursor-pointer"
                    aria-label="Share"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>

              {/* Right: Pastel Cinema Illustration (Mockup Top-Right) */}
              <div className="hidden lg:flex flex-shrink-0 items-center justify-center">
                <MovieDetailArt className="w-48 h-48 xl:w-56 xl:h-56" />
              </div>

            </div>
          </div>

          {/* ══════════════════════════ NAVIGATION TABS ══════════════════════════ */}
          <div className="border-b border-neutral-200 mt-8 mb-6">
            <div className="flex items-center gap-8 text-sm font-bold">
              {[
                { id: "about", label: "About" },
                { id: "cast", label: "Cast & Crew" },
                { id: "videos", label: "Videos" },
                { id: "reviews", label: "Reviews" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 relative transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? "text-[#ff4d58] font-bold"
                      : "text-neutral-500 hover:text-neutral-800 font-semibold"
                  }`}
                >
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#ff4d58] rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ══════════════════════════ TAB CONTENT ══════════════════════════ */}
          {activeTab === "about" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Synopsis */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-neutral-150/80 shadow-xs">
                <h3 className="text-base font-black text-neutral-900 mb-3 tracking-tight">
                  About the Movie
                </h3>
                <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                  {movie.description || "An immersive cinematic experience with compelling drama, action, and performances."}
                </p>
              </div>

              {/* Right Column: Structured Metadata Grid (Mockup Top-Right) */}
              <div className="bg-white rounded-3xl p-6 border border-neutral-150/80 shadow-xs space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50/70 border border-neutral-100">
                  <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200/80 flex items-center justify-center text-neutral-700 shadow-2xs">
                    <Clock size={18} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Duration</span>
                    <span className="text-sm font-bold text-neutral-800">
                      {movie.duration ? `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m` : "2h 15m"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50/70 border border-neutral-100">
                  <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200/80 flex items-center justify-center text-neutral-700 shadow-2xs">
                    <Globe size={18} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Language</span>
                    <span className="text-sm font-bold text-neutral-800">
                      {langLbl || "Hindi"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50/70 border border-neutral-100">
                  <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200/80 flex items-center justify-center text-neutral-700 shadow-2xs">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Certificate</span>
                    <span className="text-sm font-bold text-neutral-800">
                      {movie.certificate || "UA"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50/70 border border-neutral-100">
                  <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200/80 flex items-center justify-center text-neutral-700 shadow-2xs">
                    <Film size={18} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Genre</span>
                    <span className="text-sm font-bold text-neutral-800 truncate">
                      {genres.join(", ") || "Drama, Action"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "cast" && (
            <div className="space-y-6">
              {movie.cast?.length > 0 && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-150/80 shadow-xs">
                  <SectionTitle>Lead Cast</SectionTitle>
                  <CastSlider data={movie.cast} />
                </div>
              )}
              {movie.crew?.length > 0 && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-150/80 shadow-xs">
                  <SectionTitle>Crew Members</SectionTitle>
                  <CrewSlider data={groupCrew(movie.crew)} />
                </div>
              )}
            </div>
          )}

          {activeTab === "videos" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-150/80 shadow-xs">
              <SectionTitle>Official Trailers &amp; Promos</SectionTitle>
              {movie.trailerLink ? (
                <div className="max-w-2xl aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
                  <iframe
                    width="100%"
                    height="100%"
                    src={getYoutubeEmbed(movie.trailerLink)}
                    title="Movie Trailer"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                  />
                </div>
              ) : (
                <p className="text-sm text-neutral-400">No official trailer uploaded yet.</p>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-150/80 shadow-xs">
              <SectionTitle>User Reviews &amp; Ratings</SectionTitle>
              <div className="flex items-center gap-3 mb-4">
                <Star size={24} fill="#facc15" className="text-yellow-400" />
                <span className="text-2xl font-black text-neutral-900">{movie.rating ?? "—"}/10</span>
                <span className="text-sm text-neutral-500 font-medium">based on {formatVotes(votes)} audience votes</span>
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Audiences are praising the standout performances, cinematography, and direction of this film.
              </p>
            </div>
          )}

          {/* Similar Recommended Titles */}
          {movie.similarMovies?.length > 0 && (
            <div className="mt-8 bg-white rounded-3xl p-6 sm:p-8 border border-neutral-150/80 shadow-xs">
              <SectionTitle>Recommended Similar Titles</SectionTitle>
              <SimilarMovies movies={movie.similarMovies} />
            </div>
          )}

        </div>

        {/* Mobile floating action spacer */}
        <div className="md:hidden" style={{ height: "calc(90px + env(safe-area-inset-bottom, 0px))" }} />

        {/* Age Gate */}
        {showAgeGate && (
          <AgeGatePopup
            onConfirm={() => { setShowAgeGate(false); navigate(`/movie/${movie._id}/book`); }}
            onBack={() => setShowAgeGate(false)}
          />
        )}

        {/* Trailer Modal */}
        {showTrailer && (
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 p-4"
            onClick={() => setShowTrailer(false)}
          >
            <div
              className="relative w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3">
                <span className="text-[14px] font-bold text-white flex items-center gap-2">
                  <Play size={14} className="text-[#f0545c]" fill="#f0545c" /> {movie.title} - Trailer
                </span>
                <button
                  onClick={() => setShowTrailer(false)}
                  className="text-white/70 hover:text-white flex items-center gap-1.5 text-[13px] font-bold px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X size={15} /> Close
                </button>
              </div>
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20 bg-black">
                <iframe
                  className="w-full aspect-video block"
                  src={getYoutubeEmbed(movie.trailerLink)}
                  title="Trailer"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Floating Bar */}
        <div
          className="md:hidden fixed left-4 right-4 z-40 flex items-center gap-2.5 backdrop-blur-2xl bg-white/95 p-2 rounded-2xl border border-gray-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.18)]"
          style={{ bottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
        >
          <PrimaryCta wide />
          <VoteButton voted={voted} votes={votes} status={status} onVote={handleVote} mobile light pill />
          <WatchlistButton movieId={movie._id} mobile light pill />
        </div>
      </div>

      <Footer />
    </div>
  );
}

function VoteButton({ voted, votes, status, onVote, mobile, light = false, pill = false }) {
  const isUpcoming  = status === "upcoming";
  const shape = pill ? "rounded-full" : "rounded-2xl";

  return (
    <button
      onClick={onVote}
      disabled={voted}
      className={`flex items-center justify-center gap-2 font-bold text-[13px] transition-all border flex-shrink-0 shadow-md ${shape} ${
        pill ? "w-11 h-11" : mobile ? "px-3.5 py-2.5" : "px-6 py-3"
      } ${
        voted
          ? "bg-[#f0545c] text-white border-[#f0545c]"
          : light
          ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          : "backdrop-blur-md bg-white/10 hover:bg-white/20 border-white/20 text-white"
      }`}
    >
      <ThumbsUp size={14} fill={voted ? "#fff" : "none"} />
      {!mobile && !pill && (
        <span>
          {isUpcoming
            ? voted ? `Notified · ${formatVotes(votes)}` : "Notify Me"
            : voted ? `Interested · ${formatVotes(votes)}` : "Interested"}
        </span>
      )}
    </button>
  );
}

function SectionTitle({ children, noMargin }) {
  return (
    <h2
      className={`text-[17px] md:text-[19px] font-black text-gray-900 ${noMargin ? "" : "mb-4 md:mb-5"}`}
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
      className="absolute z-10 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-700 hover:text-white hover:bg-[#f0545c] hover:border-[#f0545c] transition-all transform hover:scale-110 active:scale-95"
      style={{
        [dir === "left" ? "left" : "right"]: -14,
        top,
        transform: "translateY(-50%)",
      }}
      aria-label={dir === "left" ? "Previous" : "Next"}
    >
      {dir === "left" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
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
    <div className="relative group/slider">
      {canLeft && (
        <SliderArrow
          dir="left"
          top={75}
          onClick={() => ref.current?.scrollBy({ left: -400, behavior: "smooth" })}
        />
      )}
      {canRight && (
        <SliderArrow
          dir="right"
          top={75}
          onClick={() => ref.current?.scrollBy({ left: 400, behavior: "smooth" })}
        />
      )}
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth"
      >
        {data.map((item, i) => (
          <div key={i} className="flex-shrink-0 w-[110px] sm:w-[135px] group cursor-default">
            <div
              className="relative rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100"
              style={{ aspectRatio: "3/4" }}
            >
              <img
                src={IMG(item.image)}
                alt={item.name}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <p className="mt-2 text-[13px] font-bold text-gray-900 leading-tight line-clamp-1">
              {item.name}
            </p>
            {item.role && (
              <p className="mt-0.5 text-[11px] font-medium text-gray-500 line-clamp-1">
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
    <div className="relative group/slider">
      {canLeft && (
        <SliderArrow
          dir="left"
          top={70}
          onClick={() => ref.current?.scrollBy({ left: -400, behavior: "smooth" })}
        />
      )}
      {canRight && (
        <SliderArrow
          dir="right"
          top={70}
          onClick={() => ref.current?.scrollBy({ left: 400, behavior: "smooth" })}
        />
      )}
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth"
      >
        {data.map((item, i) => (
          <div key={i} className="flex-shrink-0 w-[125px] sm:w-[150px] rounded-2xl overflow-hidden border border-gray-100 shadow-2xs bg-white group hover:shadow-md transition-all cursor-default">
            <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: "1/1" }}>
              <img
                src={IMG(item.image)}
                alt={item.name}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-3">
              <p className="text-[13px] font-bold text-gray-900 line-clamp-1 leading-tight">
                {item.name}
              </p>
              <p
                className="mt-0.5 text-[11px] font-semibold text-[#f0545c] line-clamp-1"
                title={item.roles.join(" · ")}
              >
                {item.roles.join(" · ")}
              </p>
            </div>
          </div>
        ))}
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
    <div className="relative group/slider">
      {canLeft && (
        <SliderArrow
          dir="left"
          top={90}
          onClick={() => ref.current?.scrollBy({ left: -400, behavior: "smooth" })}
        />
      )}
      {canRight && (
        <SliderArrow
          dir="right"
          top={90}
          onClick={() => ref.current?.scrollBy({ left: 400, behavior: "smooth" })}
        />
      )}
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth"
      >
        {movies.map((m, i) => (
          <a key={i} href={`/movie/${m._id}`} className="flex-shrink-0 w-[130px] sm:w-[155px] group no-underline card-hover-lift">
            <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ aspectRatio: "2/3" }}>
              <img
                src={IMG(m.poster)}
                alt={m.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div
                className="absolute bottom-0 left-0 right-0 py-1 text-center text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm"
                style={{
                  background:
                    m.status === "streaming"
                      ? "rgba(99,102,241,0.9)"
                      : m.status === "released"
                      ? "rgba(240,84,92,0.9)"
                      : "rgba(234,88,12,0.9)",
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
            <p className="mt-2 text-[13px] font-bold text-gray-900 line-clamp-1 group-hover:text-[#f0545c] transition-colors">
              {m.title}
            </p>
            <p className="text-[11.5px] font-medium text-gray-400 mt-0.5">{m.genre}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
