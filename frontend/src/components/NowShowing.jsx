import Dialog from "./Dialog";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import {
  Star, ThumbsUp, Tv, X, Check,
  ChevronDown, ChevronUp, MapPin, ChevronRight, SlidersHorizontal,
} from "lucide-react";
import BottomNav from "./BottomNav";

const IMG = (path) => !path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;

const formatVotes = (votes = 0) => {
  if (votes >= 1_000_000) return (votes / 1_000_000).toFixed(1) + "M";
  if (votes >= 1_000)     return (votes / 1_000).toFixed(1) + "K";
  return String(votes);
};

const STORAGE_KEY = "voted_movies";
const getVoted    = () => {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
  catch { return new Set(); }
};
const saveVoted = (set) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));

const GENRES       = ["Action", "Comedy", "Drama", "Horror", "Romance", "Sci-Fi", "Thriller", "Adventure", "Animation"];
const CERTIFICATES = ["U", "UA", "A", "PG", "PG-13"];
const LANGUAGES    = ["Hindi", "English", "Tamil", "Telugu", "Malayalam", "Kannada", "Gujarati", "Punjabi", "Bengali"];

function FilterSection({ title, children, onClear, hasActive }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-100 rounded-2xl bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}>
        <div className="flex items-center gap-2">
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
          <span className="text-[13px] font-bold text-gray-700">{title}</span>
        </div>
        {hasActive && (
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="text-[11px] font-semibold text-now-accent hover:underline"
          >
            Clear
          </button>
        )}
      </div>
      {open && (
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

function SideChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all"
      style={
        active
          ? { background: "rgba(16,101,121,0.1)", color: "#106579", borderColor: "rgba(16,101,121,0.4)" }
          : { background: "white", color: "#374151", borderColor: "#e4e4e7" }
      }
    >
      {label}
    </button>
  );
}

function LangPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-all flex-shrink-0"
      style={
        active
          ? { background: "#106579", color: "#fff", borderColor: "#106579" }
          : { background: "white", color: "#374151", borderColor: "#d1d5db" }
      }
    >
      {label}
    </button>
  );
}

/* ── Coming Soon Banner ─────────────────────────────── */
function ComingSoonBanner({ movies }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden mb-6"
      style={{ background: "white", border: "1px solid #f0f0f0", minHeight: 64 }}
    >
      {/* Blurred poster thumbnails */}
      <div className="absolute inset-0 flex justify-end" style={{ pointerEvents: "none" }}>
        <div className="flex h-full">
          {movies.slice(0, 6).map((m, i) => (
            <div
              key={m._id}
              className="h-full"
              style={{
                width: 70,
                backgroundImage: `url(${IMG(m.poster)})`,
                backgroundSize: "cover",
                backgroundPosition: "center top",
                opacity: Math.max(0.12, 0.38 - i * 0.05),
                filter: "blur(1.5px)",
                maskImage: i === 0
                  ? "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 40%, black 100%)"
                  : "none",
                WebkitMaskImage: i === 0
                  ? "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 40%, black 100%)"
                  : "none",
              }}
            />
          ))}
        </div>
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, white 38%, rgba(255,255,255,0.92) 58%, rgba(255,255,255,0.3) 100%)",
          }}
        />
      </div>

      {/* Foreground — single line */}
      <div className="relative z-10 flex items-center justify-between px-4 md:px-5 py-4 gap-3">
        <span className="text-[16px] md:text-[17px] font-black text-gray-900 tracking-tight whitespace-nowrap">
          Coming Soon
        </span>
        <Link
          to="/coming-soon"
          className="flex items-center gap-1 text-[12px] md:text-[13px] font-bold whitespace-nowrap flex-shrink-0 hover:opacity-70 transition-opacity"
          style={{ color: "#106579" }}
        >
          Explore Upcoming
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

/* ── Mobile Filter Drawer ───────────────────────────── */
function MobileFilterDrawer({ open, onClose, filters, setFilters, availableFormats }) {
  const toggleFilter = (key, val) =>
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter((v) => v !== val) : [...f[key], val],
    }));

  const activeCount =
    filters.genre.length + filters.language.length +
    filters.certificate.length + filters.format.length +
    (filters.inCinemas ? 1 : 0);

  if (!open) return null;

  return (
    <Dialog variant="sheet" label="Filter movies" onDismiss={onClose}>
      <div className="bg-gray-50">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
          <span className="text-[16px] font-bold text-gray-900">Filters</span>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <button
                onClick={() => setFilters({ genre: [], language: [], certificate: [], format: [], inCinemas: false })}
                className="text-[12px] font-semibold text-now-accent"
              >
                Clear All ({activeCount})
              </button>
            )}
            <button aria-label="Close filters" className="grid size-10 place-items-center rounded-lg hover:bg-gray-50" onClick={onClose}>
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <FilterSection
            title="Languages"
            hasActive={filters.language.length > 0}
            onClear={() => setFilters((f) => ({ ...f, language: [] }))}
          >
            {LANGUAGES.map((l) => (
              <SideChip key={l} label={l}
                active={filters.language.includes(l)}
                onClick={() => toggleFilter("language", l)} />
            ))}
          </FilterSection>

          <FilterSection
            title="Genres"
            hasActive={filters.genre.length > 0}
            onClear={() => setFilters((f) => ({ ...f, genre: [] }))}
          >
            {GENRES.map((g) => (
              <SideChip key={g} label={g}
                active={filters.genre.includes(g)}
                onClick={() => toggleFilter("genre", g)} />
            ))}
          </FilterSection>

          <FilterSection
            title="Certificate"
            hasActive={filters.certificate.length > 0}
            onClear={() => setFilters((f) => ({ ...f, certificate: [] }))}
          >
            {CERTIFICATES.map((c) => (
              <SideChip key={c} label={c}
                active={filters.certificate.includes(c)}
                onClick={() => toggleFilter("certificate", c)} />
            ))}
          </FilterSection>

          {availableFormats.length > 0 && (
            <FilterSection
              title="Format"
              hasActive={filters.format.length > 0}
              onClear={() => setFilters((f) => ({ ...f, format: [] }))}
            >
              {availableFormats.map((f) => (
                <SideChip key={f} label={f}
                  active={filters.format.includes(f)}
                  onClick={() => toggleFilter("format", f)} />
              ))}
            </FilterSection>
          )}

          <button
            onClick={() => setFilters((f) => ({ ...f, inCinemas: !f.inCinemas }))}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-[13px] font-semibold transition-all bg-white"
            style={
              filters.inCinemas
                ? { borderColor: "rgba(16,101,121,0.4)", color: "#106579", background: "rgba(16,101,121,0.05)" }
                : { borderColor: "#e4e4e7", color: "#6b7280" }
            }
          >
            <span className="flex items-center gap-2"><Tv size={14} /> In Cinemas Only</span>
            {filters.inCinemas && <Check size={14} />}
          </button>

          {/* Apply button */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-[14px] font-bold text-white mt-1"
            style={{ background: "#106579" }}
          >
            {activeCount > 0 ? `Apply ${activeCount} Filter${activeCount !== 1 ? "s" : ""}` : "Apply Filters"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export default function NowShowingPage() {
  const [movies,       setMovies]       = useState([]);
  const [comingSoon,   setComingSoon]   = useState([]);
  const [filtered,     setFiltered]     = useState([]);
  const [voted,        setVoted]        = useState(getVoted);
  const [city,         setCity]         = useState(() => localStorage.getItem("selectedCity") || "Mumbai");
  const [loading,      setLoading]      = useState(true);
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    genre:       [],
    language:    [],
    certificate: [],
    format:      [],
    inCinemas:   false,
  });

  useEffect(() => {
    const handler = () => setCity(localStorage.getItem("selectedCity") || "Mumbai");
    window.addEventListener("cityChanged", handler);
    return () => window.removeEventListener("cityChanged", handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get("/movies", { params: { city } })
      .then((res) => {
        const released = res.data.filter((m) => m.status === "released");
        const upcoming = res.data.filter((m) => m.status !== "released");
        setMovies(released);
        setFiltered(released);
        setComingSoon(upcoming);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [city]);

  useEffect(() => {
    let result = [...movies];
    if (filters.language.length)
      result = result.filter((m) => filters.language.includes(m.language));
    if (filters.genre.length)
      result = result.filter((m) => filters.genre.includes(m.genre));
    if (filters.certificate.length)
      result = result.filter((m) => filters.certificate.includes(m.certificate));
    if (filters.format.length)
      result = result.filter((m) => m.formats?.some((f) => filters.format.includes(f)));
    if (filters.inCinemas)
      result = result.filter((m) => m.isInCinemas === true);
    setFiltered(result);
  }, [filters, movies]);

  const availableFormats = [...new Set(movies.flatMap((m) => m.formats || []))];

  const toggleFilter = (key, val) =>
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter((v) => v !== val) : [...f[key], val],
    }));

  const activeCount =
    filters.genre.length + filters.language.length +
    filters.certificate.length + filters.format.length +
    (filters.inCinemas ? 1 : 0);

  const handleVote = async (e, movieId) => {
    e.stopPropagation();
    if (voted.has(movieId)) return;
    setFiltered((prev) => prev.map((m) => m._id === movieId ? { ...m, votes: (m.votes || 0) + 1 } : m));
    setVoted((prev) => { const next = new Set(prev); next.add(movieId); saveVoted(next); return next; });
    try {
      await api.put(`/movies/vote/${movieId}`);
    } catch {
      setFiltered((prev) => prev.map((m) => m._id === movieId ? { ...m, votes: Math.max(0, (m.votes || 0) - 1) } : m));
      setVoted((prev) => { const next = new Set(prev); next.delete(movieId); saveVoted(next); return next; });
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f2f2]" style={{ fontFamily: "var(--now-ui-font)" }}>
      <Navbar />

      <BottomNav />

      <div className="max-w-[1300px] mx-auto px-4 md:px-8 py-6 md:py-8 flex gap-6 items-start">

        {/* ── Desktop Sidebar ── */}
        <aside className="w-[240px] flex-shrink-0 hidden md:flex flex-col gap-3 sticky top-[76px]">
          <div className="flex items-center justify-between mb-1 px-1">
            <h2 className="text-[16px] font-bold text-gray-900">Filters</h2>
            {activeCount > 0 && (
              <button
                onClick={() => setFilters({ genre: [], language: [], certificate: [], format: [], inCinemas: false })}
                className="text-[12px] font-semibold text-now-accent hover:underline flex items-center gap-1"
              >
                <X size={12} /> Clear All
              </button>
            )}
          </div>

          <FilterSection
            title="Languages"
            hasActive={filters.language.length > 0}
            onClear={() => setFilters((f) => ({ ...f, language: [] }))}
          >
            {LANGUAGES.map((l) => (
              <SideChip key={l} label={l}
                active={filters.language.includes(l)}
                onClick={() => toggleFilter("language", l)} />
            ))}
          </FilterSection>

          <FilterSection
            title="Genres"
            hasActive={filters.genre.length > 0}
            onClear={() => setFilters((f) => ({ ...f, genre: [] }))}
          >
            {GENRES.map((g) => (
              <SideChip key={g} label={g}
                active={filters.genre.includes(g)}
                onClick={() => toggleFilter("genre", g)} />
            ))}
          </FilterSection>

          <FilterSection
            title="Certificate"
            hasActive={filters.certificate.length > 0}
            onClear={() => setFilters((f) => ({ ...f, certificate: [] }))}
          >
            {CERTIFICATES.map((c) => (
              <SideChip key={c} label={c}
                active={filters.certificate.includes(c)}
                onClick={() => toggleFilter("certificate", c)} />
            ))}
          </FilterSection>

          {availableFormats.length > 0 && (
            <FilterSection
              title="Format"
              hasActive={filters.format.length > 0}
              onClear={() => setFilters((f) => ({ ...f, format: [] }))}
            >
              {availableFormats.map((f) => (
                <SideChip key={f} label={f}
                  active={filters.format.includes(f)}
                  onClick={() => toggleFilter("format", f)} />
              ))}
            </FilterSection>
          )}

          <button
            onClick={() => setFilters((f) => ({ ...f, inCinemas: !f.inCinemas }))}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-[13px] font-semibold transition-all bg-white"
            style={
              filters.inCinemas
                ? { borderColor: "rgba(16,101,121,0.4)", color: "#106579", background: "rgba(16,101,121,0.05)" }
                : { borderColor: "#e4e4e7", color: "#6b7280" }
            }
          >
            <span className="flex items-center gap-2"><Tv size={14} /> In Cinemas Only</span>
            {filters.inCinemas && <Check size={14} />}
          </button>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">

          {/* Page header row */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] md:text-[22px] font-bold text-gray-900">
                Movies In <span style={{ color: "#106579" }}>{city}</span>
              </h1>
              <MapPin size={15} className="text-gray-400" />
            </div>

            {/* Mobile filter button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex md:hidden items-center gap-2 px-3 py-2 rounded-xl border text-[13px] font-semibold bg-white transition-all"
              style={
                activeCount > 0
                  ? { borderColor: "rgba(16,101,121,0.4)", color: "#106579", background: "rgba(16,101,121,0.05)" }
                  : { borderColor: "#e4e4e7", color: "#374151" }
              }
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-now-accent text-white text-[10px] font-bold flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          {/* Language pills — horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: "none" }}>
            {LANGUAGES.map((l) => (
              <LangPill key={l} label={l}
                active={filters.language.includes(l)}
                onClick={() => toggleFilter("language", l)} />
            ))}
          </div>

          {/* Coming Soon Banner */}
          {!loading && comingSoon.length > 0 && (
            <ComingSoonBanner movies={comingSoon} />
          )}

          {/* Active filter chips */}
          {activeCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {!loading && (
                <span className="text-[13px] text-gray-500 font-medium">
                  {filtered.length} movie{filtered.length !== 1 ? "s" : ""}
                </span>
              )}
              {[...filters.genre, ...filters.certificate, ...filters.format].map((v) => (
                <span key={v}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border"
                  style={{ background: "rgba(16,101,121,0.08)", color: "#106579", borderColor: "rgba(16,101,121,0.2)" }}>
                  {v}
                  <button onClick={() => {
                    if (filters.genre.includes(v))            toggleFilter("genre", v);
                    else if (filters.certificate.includes(v)) toggleFilter("certificate", v);
                    else                                       toggleFilter("format", v);
                  }}><X size={10} /></button>
                </span>
              ))}
              {filters.inCinemas && (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border"
                  style={{ background: "rgba(16,101,121,0.08)", color: "#106579", borderColor: "rgba(16,101,121,0.2)" }}>
                  In Cinemas <button onClick={() => setFilters((f) => ({ ...f, inCinemas: false }))}><X size={10} /></button>
                </span>
              )}
            </div>
          )}

          {/* Movie count — only when no active filter chips */}
          {activeCount === 0 && !loading && filtered.length > 0 && (
            <p className="text-[13px] text-gray-400 font-medium mb-4">
              {filtered.length} movie{filtered.length !== 1 ? "s" : ""}
            </p>
          )}

          {/* Skeleton */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <div className="rounded-2xl bg-gray-200 animate-pulse" style={{ aspectRatio: "2/3" }} />
                  <div className="mt-2 space-y-1.5">
                    <div className="h-3.5 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(16,101,121,0.07)" }}>
                <Tv size={30} style={{ color: "#106579", opacity: 0.4 }} />
              </div>
              <p className="text-[16px] font-bold text-gray-400">
                {activeCount > 0 ? "No movies match your filters" : `No movies showing in ${city}`}
              </p>
              <p className="text-[13px] text-gray-300 mt-1">
                {activeCount > 0 ? "Try adjusting or clearing your filters" : "Try selecting a different city"}
              </p>
              {activeCount > 0 && (
                <button
                  onClick={() => setFilters({ genre: [], language: [], certificate: [], format: [], inCinemas: false })}
                  className="mt-4 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white"
                  style={{ background: "#106579" }}>
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Movie grid */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {filtered.map((movie) => (
                <MovieCard
                  key={movie._id}
                  movie={movie}
                  isVoted={voted.has(movie._id)}
                  onVote={handleVote}
                  onClick={() => navigate(`/movie/${movie._id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <MobileFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        setFilters={setFilters}
        availableFormats={availableFormats}
      />
    </div>
  );
}

function MovieCard({ movie, isVoted, onVote, onClick }) {
  return (
    <div className="now-catalog-card cursor-pointer group" onClick={onClick}>
      <div className="relative rounded-2xl overflow-hidden bg-gray-200 shadow-sm" style={{ aspectRatio: "2/3" }}>
        <img src={IMG(movie.poster)} alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />

        {movie.certificate && (
          <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.9)" }}>
            {movie.certificate}
          </span>
        )}

        {movie.isInCinemas && (
          <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(16,101,121,0.88)", color: "#fff" }}>
            In Cinemas
          </span>
        )}

        <div className="absolute bottom-0 left-0 right-0 px-3 py-3"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)" }}>
          {movie.formats?.length > 0 && (
            <p className="text-[10px] text-white/60 font-medium mb-1">
              {movie.formats.slice(0, 3).join(" · ")}
            </p>
          )}
          <div className="flex items-center gap-1.5">
            <Star size={11} fill="#106579" className="text-now-accent flex-shrink-0" />
            <span className="text-white font-bold text-[12px]">{movie.rating}/10</span>
            <span className="text-white/50 text-[11px]">{formatVotes(movie.votes)}+ Votes</span>
          </div>
        </div>
      </div>

      <div className="now-catalog-body mt-2.5 px-0.5">
        <h3 className="text-[14px] font-bold text-gray-900 leading-tight line-clamp-1 group-hover:text-now-accent transition-colors">
          {movie.title}
        </h3>
        <p className="text-[12px] text-gray-400 mt-0.5 truncate">
          {[movie.genre, movie.language].filter(Boolean).join(" · ")}
        </p>
        {movie.duration && (
          <p className="text-[11px] text-gray-400 mt-0.5">
            {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
          </p>
        )}
        <button
          onClick={(e) => onVote(e, movie._id)}
          className="now-catalog-action mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-all border"
          style={{
            borderColor: isVoted ? "rgba(16,101,121,0.5)"  : "rgba(16,101,121,0.25)",
            color:       isVoted ? "#fff"                  : "#106579",
            background:  isVoted ? "#106579"               : "white",
          }}
          onMouseEnter={(e) => { if (!isVoted) e.currentTarget.style.background = "rgba(16,101,121,0.05)"; }}
          onMouseLeave={(e) => { if (!isVoted) e.currentTarget.style.background = "white"; }}
        >
          <ThumbsUp size={12} fill={isVoted ? "#fff" : "none"} />
          {isVoted ? "Interested" : "Interested"}
        </button>
      </div>
    </div>
  );
}