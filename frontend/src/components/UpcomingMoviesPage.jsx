import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import {
  BellPlus, Star, CalendarDays, X,
  ChevronDown, ChevronUp, MapPin, Clock,
  ChevronRight, SlidersHorizontal,
} from "lucide-react";

const IMG = (path) =>
  !path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;

const formatVotes = (votes = 0) => {
  if (votes >= 1_000_000) return (votes / 1_000_000).toFixed(1) + "M";
  if (votes >= 1_000)     return (votes / 1_000).toFixed(1) + "K";
  return String(votes);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "TBA";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
};

const STORAGE_KEY  = "notified_movies";
const getNotified  = () => {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
  catch { return new Set(); }
};
const saveNotified = (set) => localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));

const GENRES       = ["Action","Comedy","Drama","Horror","Romance","Sci-Fi","Thriller","Adventure","Animation"];
const CERTIFICATES = ["U","UA","A","PG","PG-13"];
const LANGUAGES    = ["Hindi","English","Tamil","Telugu","Malayalam","Kannada","Gujarati","Punjabi","Bengali"];

/* ── Filter section (collapsible) ──────────────────────────────── */
function FilterSection({ title, children, onClear, hasActive }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-gray-100">
      <div
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between px-3.5 py-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-1.5">
          {open
            ? <ChevronUp size={13} className="text-gray-300" />
            : <ChevronDown size={13} className="text-gray-300" />}
          <span className="text-[12px] font-bold text-gray-800 tracking-wide">{title}</span>
        </div>
        {hasActive && (
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="text-[11px] font-semibold text-[#f0545c] bg-transparent border-none cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>
      {open && (
        <div className="px-3.5 pb-3.5 flex flex-wrap gap-1.5">
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
      className="px-2.5 py-1 rounded-lg text-[11.5px] font-semibold cursor-pointer transition-all border"
      style={
        active
          ? { borderColor: "rgba(240,84,92,0.45)", background: "rgba(240,84,92,0.07)", color: "#f0545c" }
          : { borderColor: "#ebebeb", background: "white", color: "#555" }
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
      className="px-4 py-1.5 rounded-full text-[12.5px] font-semibold cursor-pointer transition-all border flex-shrink-0 whitespace-nowrap"
      style={
        active
          ? { borderColor: "#f0545c", background: "#f0545c", color: "#fff" }
          : { borderColor: "#e0e0e0", background: "white", color: "#444" }
      }
    >
      {label}
    </button>
  );
}

/* ── Now Showing Banner ─────────────────────────────────────────── */
function NowShowingBanner({ movies }) {
  return (
    <div className="relative rounded-2xl overflow-hidden mb-5 bg-white border border-gray-100" style={{ minHeight: 64 }}>
      {/* Blurred poster strip */}
      <div className="absolute inset-0 flex justify-end pointer-events-none">
        {movies.slice(0, 7).map((m, i) => (
          <div
            key={m._id}
            style={{
              width: 68, height: "100%",
              backgroundImage: `url(${IMG(m.poster)})`,
              backgroundSize: "cover", backgroundPosition: "center top",
              opacity: Math.max(0.08, 0.3 - i * 0.04),
              filter: "blur(2px)",
            }}
          />
        ))}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, white 35%, rgba(255,255,255,0.95) 55%, rgba(255,255,255,0.2) 100%)" }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-between px-4 md:px-5 h-16">
        <div className="flex items-center gap-2.5">
          <span
            className="text-[9.5px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-full border"
            style={{ background: "rgba(240,84,92,0.09)", color: "#f0545c", borderColor: "rgba(240,84,92,0.18)" }}
          >
            Live
          </span>
          <span className="text-[14px] md:text-[15px] font-extrabold text-gray-900 tracking-tight">
            Now Showing
          </span>
        </div>
        <Link
          to="/now-showing"
          className="flex items-center gap-1 text-[12px] md:text-[12.5px] font-bold flex-shrink-0 no-underline hover:opacity-70 transition-opacity"
          style={{ color: "#f0545c" }}
        >
          <span className="hidden sm:inline">Explore Now Showing</span>
          <span className="sm:hidden">Explore</span>
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

/* ── Mobile Filter Drawer ───────────────────────────────────────── */
function MobileFilterDrawer({ open, onClose, filters, setFilters, availableFormats }) {
  const toggleFilter = (key, val) =>
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter((v) => v !== val) : [...f[key], val],
    }));

  const activeCount =
    filters.genre.length + filters.language.length +
    filters.certificate.length + filters.format.length;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#f4f4f4] rounded-t-2xl overflow-y-auto"
        style={{ maxHeight: "85vh" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100">
          <span className="text-[15px] font-bold text-gray-900">Filters</span>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <button
                onClick={() => setFilters({ genre: [], language: [], certificate: [], format: [] })}
                className="text-[12px] font-semibold text-[#f0545c]"
              >
                Clear All ({activeCount})
              </button>
            )}
            <button onClick={onClose}>
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <FilterSection title="Languages" hasActive={filters.language.length > 0}
            onClear={() => setFilters((f) => ({ ...f, language: [] }))}>
            {LANGUAGES.map((l) => (
              <SideChip key={l} label={l} active={filters.language.includes(l)}
                onClick={() => toggleFilter("language", l)} />
            ))}
          </FilterSection>

          <FilterSection title="Genres" hasActive={filters.genre.length > 0}
            onClear={() => setFilters((f) => ({ ...f, genre: [] }))}>
            {GENRES.map((g) => (
              <SideChip key={g} label={g} active={filters.genre.includes(g)}
                onClick={() => toggleFilter("genre", g)} />
            ))}
          </FilterSection>

          <FilterSection title="Certificate" hasActive={filters.certificate.length > 0}
            onClear={() => setFilters((f) => ({ ...f, certificate: [] }))}>
            {CERTIFICATES.map((c) => (
              <SideChip key={c} label={c} active={filters.certificate.includes(c)}
                onClick={() => toggleFilter("certificate", c)} />
            ))}
          </FilterSection>

          {availableFormats.length > 0 && (
            <FilterSection title="Format" hasActive={filters.format.length > 0}
              onClear={() => setFilters((f) => ({ ...f, format: [] }))}>
              {availableFormats.map((f) => (
                <SideChip key={f} label={f} active={filters.format.includes(f)}
                  onClick={() => toggleFilter("format", f)} />
              ))}
            </FilterSection>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-[14px] font-bold text-white mt-1"
            style={{ background: "#f0545c" }}
          >
            {activeCount > 0 ? `Apply ${activeCount} Filter${activeCount !== 1 ? "s" : ""}` : "Apply Filters"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Page ───────────────────────────────────────────────────────── */
export default function UpcomingMoviesPage() {
  const [movies,     setMovies]     = useState([]);
  const [nowShowing, setNowShowing] = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [notified,   setNotified]   = useState(getNotified);
  const [city,       setCity]       = useState(() => localStorage.getItem("selectedCity") || "Mumbai");
  const [loading,    setLoading]    = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({ genre: [], language: [], certificate: [], format: [] });

  useEffect(() => {
    const handler = () => setCity(localStorage.getItem("selectedCity") || "Mumbai");
    window.addEventListener("cityChanged", handler);
    return () => window.removeEventListener("cityChanged", handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get("/movies", { params: { city } })
      .then((res) => {
        const upcoming = res.data.filter((m) => m.status === "upcoming");
        const released = res.data.filter((m) => m.status === "released");
        upcoming.sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
        setMovies(upcoming);
        setFiltered(upcoming);
        setNowShowing(released);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [city]);

  useEffect(() => {
    let result = [...movies];
    if (filters.language.length)
      result = result.filter((m) => filters.language.includes(m.language));
    if (filters.genre.length)
      result = result.filter((m) => filters.genre.some((g) => m.genre?.toLowerCase().includes(g.toLowerCase())));
    if (filters.certificate.length)
      result = result.filter((m) => filters.certificate.includes(m.certificate));
    if (filters.format.length)
      result = result.filter((m) => m.formats?.some((f) => filters.format.includes(f)));
    setFiltered(result);
  }, [filters, movies]);

  const availableFormats = [...new Set(movies.flatMap((m) => m.formats || []))];
  const toggleFilter = (key, val) =>
    setFilters((f) => ({ ...f, [key]: f[key].includes(val) ? f[key].filter((v) => v !== val) : [...f[key], val] }));
  const clearAll = () => setFilters({ genre: [], language: [], certificate: [], format: [] });
  const activeCount =
    filters.genre.length + filters.language.length +
    filters.certificate.length + filters.format.length;

  const handleNotify = (e, movieId) => {
    e.stopPropagation();
    setNotified((prev) => {
      const next = new Set(prev);
      next.has(movieId) ? next.delete(movieId) : next.add(movieId);
      saveNotified(next);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        ::-webkit-scrollbar { display: none; }
        * { box-sizing: border-box; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
      <Navbar />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 py-5 md:py-7 pb-16 flex gap-5 md:gap-6 items-start">

        {/* ── Desktop Sidebar ── */}
        <aside className="w-[228px] flex-shrink-0 hidden md:flex flex-col gap-2.5 sticky top-[76px]">
          <div className="flex items-center justify-between px-0.5 pb-1">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal size={14} className="text-gray-400" />
              <span className="text-[14px] font-extrabold text-gray-900">Filters</span>
            </div>
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-[11px] font-bold text-[#f0545c] bg-transparent border-none cursor-pointer"
              >
                <X size={11} /> Clear all
              </button>
            )}
          </div>

          <FilterSection title="Languages" hasActive={filters.language.length > 0}
            onClear={() => setFilters((f) => ({ ...f, language: [] }))}>
            {LANGUAGES.map((l) => (
              <SideChip key={l} label={l} active={filters.language.includes(l)}
                onClick={() => toggleFilter("language", l)} />
            ))}
          </FilterSection>

          <FilterSection title="Genres" hasActive={filters.genre.length > 0}
            onClear={() => setFilters((f) => ({ ...f, genre: [] }))}>
            {GENRES.map((g) => (
              <SideChip key={g} label={g} active={filters.genre.includes(g)}
                onClick={() => toggleFilter("genre", g)} />
            ))}
          </FilterSection>

          <FilterSection title="Certificate" hasActive={filters.certificate.length > 0}
            onClear={() => setFilters((f) => ({ ...f, certificate: [] }))}>
            {CERTIFICATES.map((c) => (
              <SideChip key={c} label={c} active={filters.certificate.includes(c)}
                onClick={() => toggleFilter("certificate", c)} />
            ))}
          </FilterSection>

          {availableFormats.length > 0 && (
            <FilterSection title="Format" hasActive={filters.format.length > 0}
              onClear={() => setFilters((f) => ({ ...f, format: [] }))}>
              {availableFormats.map((f) => (
                <SideChip key={f} label={f} active={filters.format.includes(f)}
                  onClick={() => toggleFilter("format", f)} />
              ))}
            </FilterSection>
          )}
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 min-w-0">

          {/* Page header */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[18px] md:text-[22px] font-extrabold text-gray-900 tracking-tight m-0">
                Coming Soon in{" "}
                <span style={{ color: "#f0545c" }}>{city}</span>
              </h1>
              <MapPin size={15} className="text-gray-300" />
            </div>

            {/* Mobile filter button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex md:hidden items-center gap-1.5 px-3 py-2 rounded-xl border text-[13px] font-semibold bg-white transition-all flex-shrink-0"
              style={
                activeCount > 0
                  ? { borderColor: "rgba(240,84,92,0.4)", color: "#f0545c", background: "rgba(240,84,92,0.05)" }
                  : { borderColor: "#e5e7eb", color: "#374151" }
              }
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#f0545c] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          {/* Language pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: "none" }}>
            {LANGUAGES.map((l) => (
              <LangPill key={l} label={l}
                active={filters.language.includes(l)}
                onClick={() => toggleFilter("language", l)} />
            ))}
          </div>

          {/* Now Showing Banner */}
          {!loading && nowShowing.length > 0 && <NowShowingBanner movies={nowShowing} />}

          {/* Active filter chips + count */}
          {!loading && (activeCount > 0 || filtered.length > 0) && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="text-[12.5px] text-gray-400 font-semibold">
                {filtered.length} film{filtered.length !== 1 ? "s" : ""}
              </span>
              {[...filters.genre, ...filters.certificate, ...filters.format].map((v) => (
                <span
                  key={v}
                  className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border"
                  style={{ borderColor: "rgba(240,84,92,0.25)", background: "rgba(240,84,92,0.07)", color: "#f0545c" }}
                >
                  {v}
                  <button
                    onClick={() => {
                      if (filters.genre.includes(v)) toggleFilter("genre", v);
                      else if (filters.certificate.includes(v)) toggleFilter("certificate", v);
                      else toggleFilter("format", v);
                    }}
                    className="bg-transparent border-none cursor-pointer text-[#f0545c] flex"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Skeleton */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <div className="rounded-2xl bg-gray-200" style={{ aspectRatio: "2/3", animation: "pulse 1.5s ease-in-out infinite" }} />
                  <div className="mt-2.5 h-3 w-3/4 bg-gray-200 rounded" style={{ animation: "pulse 1.5s ease-in-out infinite" }} />
                  <div className="mt-1.5 h-2.5 w-2/5 bg-gray-100 rounded" style={{ animation: "pulse 1.5s ease-in-out infinite" }} />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(240,84,92,0.07)" }}>
                <CalendarDays size={26} style={{ color: "#f0545c", opacity: 0.4 }} />
              </div>
              <p className="text-[14px] md:text-[15px] font-bold text-gray-400 m-0">
                {activeCount > 0 ? "No movies match your filters" : `No upcoming movies in ${city}`}
              </p>
              <p className="text-[12px] md:text-[12.5px] text-gray-300 mt-1.5">
                {activeCount > 0 ? "Try adjusting or clearing your filters" : "Try selecting a different city"}
              </p>
              {activeCount > 0 && (
                <button
                  onClick={clearAll}
                  className="mt-4 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white border-none cursor-pointer"
                  style={{ background: "#f0545c" }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Movie grid — fluid columns */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {filtered.map((movie) => (
                <MovieCard
                  key={movie._id}
                  movie={movie}
                  isNotified={notified.has(movie._id)}
                  onNotify={handleNotify}
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

/* ── Movie Card ─────────────────────────────────────────────────── */
function MovieCard({ movie, isNotified, onNotify, onClick }) {
  const [hovered, setHovered] = useState(false);
  const genres = typeof movie.genre === "string"
    ? movie.genre.split(",").map((g) => g.trim()).filter(Boolean)
    : [];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer"
    >
      {/* Poster */}
      <div
        className="relative rounded-2xl overflow-hidden bg-gray-200"
        style={{
          aspectRatio: "2/3",
          boxShadow: hovered ? "0 8px 28px rgba(0,0,0,0.14)" : "0 2px 8px rgba(0,0,0,0.07)",
          transition: "box-shadow 0.25s ease",
        }}
      >
        <img
          src={IMG(movie.poster)}
          alt={movie.title}
          className="w-full h-full object-cover"
          style={{
            transform: hovered ? "scale(1.04)" : "scale(1)",
            transition: "transform 0.35s ease",
          }}
        />

        {movie.certificate && (
          <span
            className="absolute top-2 left-2 text-[9.5px] font-extrabold px-1.5 py-0.5 rounded"
            style={{ background: "rgba(0,0,0,0.52)", color: "rgba(255,255,255,0.88)", letterSpacing: "0.04em" }}
          >
            {movie.certificate}
          </span>
        )}

        <span
          className="absolute top-2 right-2 text-[9.5px] font-extrabold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(240,84,92,0.9)", color: "#fff" }}
        >
          Upcoming
        </span>

        {/* Bottom gradient */}
        <div
          className="absolute bottom-0 left-0 right-0 px-3 py-2.5"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)" }}
        >
          {movie.formats?.length > 0 && (
            <p className="text-[9.5px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>
              {movie.formats.slice(0, 3).join(" · ")}
            </p>
          )}
          <div className="flex items-center gap-1.5">
            <CalendarDays size={10} color="#fb923c" />
            <span className="text-[10px] md:text-[11px] font-bold text-white">
              {formatDate(movie.releaseDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-2 md:mt-2.5 pl-0.5">
        <h3
          className="text-[12.5px] md:text-[13.5px] font-bold m-0 leading-tight overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-150"
          style={{ color: hovered ? "#f0545c" : "#111" }}
        >
          {movie.title}
        </h3>

        <p
          className="text-[11px] md:text-[11.5px] font-medium mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ color: "#aaa" }}
        >
          {[genres[0], movie.language].filter(Boolean).join(" · ")}
        </p>

        {movie.duration && (
          <p className="text-[10.5px] md:text-[11px] mt-0.5 flex items-center gap-1" style={{ color: "#bbb", fontWeight: 500 }}>
            <Clock size={10} />
            {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
          </p>
        )}

        {movie.rating && (
          <div className="flex items-center gap-1 mt-1">
            <Star size={10} fill="#f0545c" color="#f0545c" />
            <span className="text-[11px] font-bold" style={{ color: "#555" }}>{movie.rating}/10</span>
            <span className="text-[10.5px]" style={{ color: "#ccc" }}>· {formatVotes(movie.votes)} votes</span>
          </div>
        )}

        <button
          onClick={(e) => onNotify(e, movie._id)}
          className="mt-2 md:mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 md:py-2 rounded-xl text-[11px] md:text-[11.5px] font-bold cursor-pointer transition-all border"
          style={{
            borderColor: isNotified ? "#f0545c" : "rgba(240,84,92,0.3)",
            background: isNotified ? "#f0545c" : "white",
            color: isNotified ? "#fff" : "#f0545c",
          }}
          onMouseEnter={(e) => { if (!isNotified) e.currentTarget.style.background = "rgba(240,84,92,0.06)"; }}
          onMouseLeave={(e) => { if (!isNotified) e.currentTarget.style.background = "white"; }}
        >
          <BellPlus size={11} />
          {isNotified ? "Notified" : "Notify Me"}
        </button>
      </div>
    </div>
  );
}