import { movieImage as IMG } from "../utils/movieImage";
import Dialog from "./Dialog";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import {
  Play, ChevronLeft, ChevronRight, Ticket, X, ArrowLeft,
  CalendarDays, Share2, MonitorPlay,
  ThumbsUp, Star,
  Bookmark, BookmarkCheck, Heart, PlayCircle, CheckCircle, Trash2,
} from "lucide-react";
import OfferBadge from "./OfferBadge";


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

// ─── Meta-line helpers (certificate | language +N more | duration) ─────────
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

// ─── Watchlist status options ────────────────────────────────────────────────
const WL_OPTIONS = [
  {
    value: "watching",
    label: "Watching",
    icon: PlayCircle,
    color: "#106579",
    activeBg: "rgba(16,101,121,0.18)",
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
            style={{ color: "rgba(16,101,121,0.75)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(16,101,121,0.08)")
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
// `light` renders the trigger for use on a white/light background (mobile
// info panel); default renders for use on the dark hero (desktop).
// `pill` renders a fully-rounded, icon-only trigger for the floating mobile
// action bar (matches the Book Tickets pill in the same bar).
function WatchlistButton({ movieId, mobile, light = false, pill = false }) {
  const { inWatchlist, status, loading, add, remove, updateStatus } =
    useWatchlist(movieId);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Watchlist is an authenticated-only feature — signed-out visitors should
  // never see the button at all, not even a disabled/prompt version of it.
  if (!localStorage.getItem("accessToken")) return null;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = WL_OPTIONS.find((o) => o.value === status);

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

  const shape = pill ? "rounded-full" : "rounded-xl";
  const sizing = pill ? "w-11 h-11 flex-shrink-0" : "";

  const idleStyle = light
    ? {
        borderColor: "#e5e5e5",
        color: "#525252",
        background: "#fff",
      }
    : {
        borderColor: "rgba(255,255,255,0.2)",
        color: "rgba(255,255,255,0.65)",
        background: "rgba(255,255,255,0.07)",
      };
  const idleHover = light
    ? { borderColor: "#c9c9c9", color: "#171717", background: "#fafafa" }
    : { borderColor: "rgba(255,255,255,0.38)", color: "#fff", background: "rgba(255,255,255,0.12)" };

  // ── Loading skeleton ──
  if (loading) {
    return (
      <button
        disabled
        className={`flex items-center justify-center gap-1.5 border font-semibold text-[13px] opacity-40 cursor-not-allowed ${shape} ${sizing}`}
        style={{
          ...idleStyle,
          padding: pill ? 0 : mobile ? "10px 12px" : "10px 20px",
          boxShadow: pill ? "0 8px 24px rgba(0,0,0,0.16)" : undefined,
          border: pill ? "none" : undefined,
        }}
      >
        <Bookmark size={14} />
        {!mobile && !pill && <span>Watchlist</span>}
      </button>
    );
  }

  // ── Saved state: shows colored pill with dropdown to change/remove ──
  if (inWatchlist && current) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center justify-center gap-1.5 border font-semibold text-[13px] transition-all ${shape} ${sizing}`}
          style={{
            borderColor: `${current.color}55`,
            color: current.color,
            background: `${current.color}1a`,
            padding: pill ? 0 : mobile ? "10px 12px" : "10px 20px",
            boxShadow: pill ? "0 8px 24px rgba(0,0,0,0.16)" : undefined,
            border: pill ? "none" : undefined,
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
          {!mobile && !pill && (
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
        className={`flex items-center justify-center gap-1.5 border font-semibold text-[13px] transition-all active:scale-95 ${shape} ${sizing}`}
        style={{
          ...idleStyle,
          padding: pill ? 0 : mobile ? "10px 12px" : "10px 20px",
          boxShadow: pill ? "0 8px 24px rgba(0,0,0,0.16)" : undefined,
          border: pill ? "none" : undefined,
        }}
        onMouseEnter={(e) => Object.assign(e.currentTarget.style, idleHover)}
        onMouseLeave={(e) => Object.assign(e.currentTarget.style, idleStyle)}
      >
        <Bookmark size={14} />
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
    <Dialog label="Age requirement" onDismiss={onBack}>
      <div>

        {/* Body */}
        <div className="px-5 pt-6 pb-5">
          <h2 className="text-[18px] font-extrabold text-gray-900 mb-4"
            style={{ letterSpacing: "-0.2px" }}>
            This movie is rated "A"
          </h2>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-[58px] h-[58px] rounded-full flex items-center justify-center"
              style={{ border: "3px solid #106579" }}>
              <span className="text-[18px] font-extrabold" style={{ color: "#106579" }}>18+</span>
            </div>
            <p className="text-[13px] text-gray-500 leading-relaxed flex-1">
              This movie is only for viewers above 18. Please carry a valid ID/Age Proof
              to the theatre. If you are denied entry due to age or ID issues, you will
              not get a refund.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 px-5 py-4">
        <button type="button" className="min-h-11 rounded-lg px-4 text-sm font-semibold hover:bg-gray-50" onClick={onBack}>Go back</button>
        <button
          onClick={onConfirm}
          className="now-primary"
          style={{ background: "#106579" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#125467")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#106579")}>
          Continue
        </button>
        </div>

      </div>
    </Dialog>
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
              className="w-2.5 h-2.5 rounded-full bg-now-accent animate-bounce"
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

  // ── Primary CTA (Book Tickets / Releasing on.. / Watch on OTT) ──
  // `wide` renders the pill-shaped, flex-1 primary used in the floating
  // mobile action bar, so it visually anchors as the main call to action.
  const PrimaryCta = ({ mobile, wide }) => {
    const wideShadow = wide ? { boxShadow: "0 8px 24px rgba(0,0,0,0.16)" } : undefined;

    if (status === "released") {
      return (
        <button
          onClick={goToBooking}
          className={`flex items-center justify-center gap-1.5 bg-now-accent hover:bg-now-accent-hover text-white font-semibold transition-colors ${
            wide
              ? "flex-1 py-3 rounded-full text-[14px]"
              : mobile
              ? "flex-1 py-2.5 rounded-xl text-[13px] shadow-lg shadow-red-900/20"
              : "px-10 py-2.5 rounded-xl text-sm shadow-lg shadow-red-900/20"
          }`}
          style={wideShadow}
        >
          <Ticket size={wide ? 16 : mobile ? 14 : 15} /> Book Tickets
        </button>
      );
    }
    if (status === "streaming" && movie.ottPlatform) {
      return (
        <button
          className={`flex items-center justify-center gap-1.5 font-semibold transition-all border border-indigo-400/40 text-indigo-300 hover:bg-indigo-500/20 ${
            wide
              ? "flex-1 py-3 rounded-full text-[14px]"
              : mobile
              ? "flex-1 py-2.5 rounded-xl text-[13px]"
              : "px-8 py-2.5 rounded-xl text-sm"
          }`}
          style={{ background: wide ? "#fff" : "rgba(99,102,241,0.12)", ...wideShadow }}
        >
          <MonitorPlay size={wide ? 16 : mobile ? 14 : 15} /> Watch on {movie.ottPlatform}
        </button>
      );
    }
    // upcoming: no bookable action yet — surface the release date as the
    // wide pill so the floating bar always has a primary element
    if (wide) {
      return (
        <div
          className="flex-1 flex items-center gap-2 bg-white rounded-full px-4 py-2.5"
          style={wideShadow}
        >
          <CalendarDays size={15} className="text-orange-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-gray-400 text-[9px] uppercase tracking-widest font-semibold leading-none">Releasing On</p>
            <p className="text-gray-800 font-bold text-[12px] mt-0.5 truncate">{formatDateShort(movie.releaseDate)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--now-ui-font)" }}>

      <Navbar />

      {/* ══════════════════════════ MOBILE ══════════════════════════ */}
      <div className="md:hidden">
        {/* Backdrop banner */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/3", background: "#1c1c1c" }}>
          <img
            src={IMG(movie.banner || movie.poster)}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.55) 100%)" }}
          />

          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
          >
            <ArrowLeft size={16} />
          </button>

          <button className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
            <Share2 size={14} />
          </button>

          {movie.trailerLink && (
            <button
              onClick={() => setShowTrailer(true)}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3.5 py-2 rounded-full whitespace-nowrap"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.35)", backdropFilter: "blur(6px)" }}
            >
              <Play size={11} fill="white" className="text-white" />
              <span className="text-[12px] font-semibold text-white">Watch Trailer</span>
            </button>
          )}
        </div>

        {/* Info panel */}
        <div className="bg-white px-4 pt-5 pb-5">
          <div className="flex items-start gap-2 flex-wrap">
            <h1 className="text-[22px] font-bold tracking-tight text-gray-900 leading-tight flex-1 min-w-0">
              {movie.title}
            </h1>
            <OfferBadge type="movies" id={movie._id} genre={movie.genre} />
          </div>

          <p className="mt-2 text-gray-500 text-[13px] flex flex-wrap items-center gap-x-1.5">
            {movie.certificate && (
              <span className="font-semibold text-gray-700">{movie.certificate}</span>
            )}
            {movie.certificate && langLbl && <span className="text-gray-300">|</span>}
            {langLbl && <span>{langLbl}</span>}
            {(movie.certificate || langLbl) && movie.duration && <span className="text-gray-300">|</span>}
            {movie.duration && (
              <span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>
            )}
          </p>

          {genres.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {genres.map((g) => (
                <span
                  key={g}
                  className="text-[11px] font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-3 flex-wrap">
            {releaseLine && <p className="text-gray-400 text-[13px]">{releaseLine}</p>}
            <span className="flex items-center gap-1 text-gray-400 text-[13px]">
              <Star size={12} fill="#106579" className="text-now-accent" />
              <span className="font-bold text-gray-800">{movie.rating ?? "—"}/10</span>
              <span>· {formatVotes(votes)} votes</span>
            </span>
          </div>

          {movie.formats?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {movie.formats.map((f) => (
                <span
                  key={f}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded border border-gray-200 text-gray-500 bg-gray-50"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════ DESKTOP ══════════════════════════ */}
      <div className="relative overflow-hidden hidden md:block" style={{ background: "#1c1c1c" }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("${IMG(movie.banner || movie.poster)}")`,
            backgroundSize: "cover",
            backgroundPosition: "center 15%",
            filter: "brightness(0.22) saturate(1.4)",
            transform: "scale(1.06)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(100deg, rgba(15,15,15,0.97) 0%, rgba(15,15,15,0.88) 45%, rgba(15,15,15,0.55) 100%)" }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-14"
          style={{ background: "linear-gradient(to bottom, transparent, #ffffff)" }}
        />

        <button className="absolute top-6 right-16 flex items-center gap-1.5 text-white/60 hover:text-white text-[13px] transition-colors z-10 font-medium">
          <Share2 size={14} /> Share
        </button>

        <div className="relative z-10 flex items-center gap-12 px-16 py-14 max-w-6xl mx-auto">
          {/* poster column — now on the left */}
          <div className="flex-shrink-0 hidden lg:block" style={{ width: 230 }}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10" style={{ aspectRatio: "2/3" }}>
              <img src={IMG(movie.poster)} alt={movie.title} className="w-full h-full object-cover" />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 100%)" }}
              />
              {movie.trailerLink && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="absolute inset-0 flex items-center justify-center group"
                >
                  <span
                    className="w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.5)", backdropFilter: "blur(6px)" }}
                  >
                    <Play size={22} fill="white" className="text-white ml-1" />
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* text column — now on the right */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-white text-[34px] font-bold tracking-tight leading-tight">
                {movie.title}
              </h1>
              <OfferBadge type="movies" id={movie._id} genre={movie.genre} size="md" />
            </div>

            <p className="text-white/55 text-[13px] flex flex-wrap items-center gap-x-2">
              {movie.certificate && <span className="text-white/75 font-semibold">{movie.certificate}</span>}
              {movie.certificate && langLbl && <span>|</span>}
              {langLbl && <span>{langLbl}</span>}
              {(movie.certificate || langLbl) && movie.duration && <span>|</span>}
              {movie.duration && <span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>}
            </p>

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {genres.map((g) => (
                  <span
                    key={g}
                    className="text-[11px] font-semibold px-3 py-1 rounded-full text-white/70 border border-white/15"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 flex-wrap mt-1">
              {releaseLine && <span className="text-white/45 text-[13px]">{releaseLine}</span>}
              <span className="flex items-center gap-1.5 text-[13px]">
                <Star size={13} fill="#106579" className="text-now-accent" />
                <span className="text-white font-bold">{movie.rating ?? "—"}/10</span>
                <span className="text-white/40">{formatVotes(votes)} Votes</span>
              </span>
            </div>

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

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <PrimaryCta />
              {status === "upcoming" && (
                <div className="inline-flex items-center gap-3 bg-white/5 border border-white/12 rounded-xl px-4 py-2.5">
                  <CalendarDays size={16} className="text-orange-400 flex-shrink-0" />
                  <div>
                    <p className="text-white/35 text-[10px] uppercase tracking-widest font-semibold">Releasing On</p>
                    <p className="text-white font-semibold text-[13px] mt-0.5">{formatDate(movie.releaseDate)}</p>
                  </div>
                </div>
              )}
              <VoteButton voted={voted} votes={votes} status={status} onVote={handleVote} />
              <WatchlistButton movieId={movie._id} />
            </div>
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
              <button className="text-now-accent text-[13px] font-semibold flex items-center gap-0.5 hover:underline">
                View All <ChevronRight size={14} />
              </button>
            </div>
            <SimilarMovies movies={movie.similarMovies} />
          </div>
        )}
      </div>

      {/* Reserves room above the floating mobile action bar */}
      <div className="md:hidden" style={{ height: "calc(88px + env(safe-area-inset-bottom, 0px))" }} />

      {showAgeGate && (
        <AgeGatePopup
          onConfirm={() => { setShowAgeGate(false); navigate(`/movie/${movie._id}/book`); }}
          onBack={() => setShowAgeGate(false)}
        />
      )}

      {/* ── Trailer modal ── */}
      {showTrailer && (
        <Dialog variant="video" label="Watch trailer" onDismiss={() => setShowTrailer(false)}>
          <div className="p-3 sm:p-4">
            <button
              onClick={() => setShowTrailer(false)}
              className="ml-auto mb-2 flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-white/85 hover:bg-white/10 text-sm"
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
        </Dialog>
      )}

      {/* ── Floating action bar — mobile only ── */}
      {/* Each control carries its own background/shadow — no shared white
          card behind the row, so they read as distinct floating pills. */}
      <div
        className="md:hidden fixed left-4 right-4 z-40 flex items-center gap-2.5"
        style={{ bottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Primary CTA — wider, stands out */}
        <PrimaryCta wide />

        {/* Secondary actions — smaller, pill-shaped, alongside the primary */}
        <VoteButton voted={voted} votes={votes} status={status} onVote={handleVote} mobile light pill />
        <WatchlistButton movieId={movie._id} mobile light pill />
      </div>
    </div>
  );
}

// ─── Sub-components (unchanged from original) ─────────────────────────────────

function VoteButton({ voted, votes, status, onVote, mobile, light = false, pill = false }) {
  const isUpcoming  = status === "upcoming";
  const activeColor = isUpcoming ? "rgba(234,88,12,0.85)" : "rgba(16,101,121,0.85)";
  const activeBorder= isUpcoming ? "rgba(234,88,12,0.5)"  : "rgba(16,101,121,0.5)";

  const idle = light
    ? { borderColor: "#e5e5e5", color: "#525252", background: "#fff" }
    : { borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.07)" };

  const shape = pill ? "rounded-full" : "rounded-xl";

  return (
    <button
      onClick={onVote}
      disabled={voted}
      className={`flex items-center justify-center gap-1.5 font-semibold text-[13px] transition-all border flex-shrink-0 ${shape} ${
        pill ? "w-11 h-11" : mobile ? "px-3 py-2.5" : "px-5 py-2.5"
      }`}
      style={{
        borderColor: voted ? activeBorder            : idle.borderColor,
        color:       voted ? "#fff"                  : idle.color,
        background:  voted ? activeColor             : idle.background,
        cursor:      voted ? "default"               : "pointer",
        minWidth:    pill ? undefined : mobile ? 44 : undefined,
        boxShadow:   pill ? "0 8px 24px rgba(0,0,0,0.16)" : undefined,
        border:      pill ? "none" : undefined,
      }}
    >
      <ThumbsUp size={13} fill={voted ? "#fff" : "none"} />
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
                loading="lazy"
                onError={(event) => { event.currentTarget.hidden = true; }}
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
                as {item.role.replace(/^as\s+/i, "")}
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
          loading="lazy"
          onError={(event) => { event.currentTarget.hidden = true; }}
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
          style={{ color: "#106579" }}
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
            <p className="mt-1.5 text-[12px] md:text-[13px] font-semibold text-gray-900 line-clamp-1 group-hover:text-now-accent transition-colors">
              {m.title}
            </p>
            <p className="text-[11px] md:text-[12px] text-gray-400 mt-0.5">{m.genre}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
