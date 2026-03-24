import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BellPlus, CalendarDays, Globe, AlertCircle,
  ChevronDown, ChevronUp, X, Check, SlidersHorizontal, MapPin,
} from "lucide-react";
import Navbar from "../components/Navbar";

const GENRES       = ["Action", "Comedy", "Drama", "Horror", "Romance", "Sci-Fi", "Thriller", "Adventure", "Animation"];
const CERTIFICATES = ["U", "UA", "A", "PG", "PG-13"];
const LANGUAGES    = ["Hindi", "English", "Tamil", "Telugu", "Malayalam", "Kannada", "Gujarati", "Punjabi", "Bengali"];

const getPosterUrl = (poster) => {
  if (!poster) return null;
  if (poster.startsWith("http")) return poster;
  return `${import.meta.env.VITE_API_URL}${poster}`;
};

const formatReleaseDate = (dateStr) => {
  if (!dateStr) return "TBA";
  const d = new Date(dateStr);
  if (isNaN(d)) return "TBA";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
};

/* ── Filter Section ─────────────────────────────────────────── */
function FilterSection({ title, children, onClear, hasActive }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-100 rounded-2xl bg-white overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          {open
            ? <ChevronUp size={14} className="text-gray-400" />
            : <ChevronDown size={14} className="text-gray-400" />}
          <span className="text-[13px] font-bold text-gray-700">{title}</span>
        </div>
        {hasActive && (
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="text-[11px] font-semibold text-[#f0545c] hover:underline"
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
          ? { background: "rgba(240,84,92,0.1)", color: "#f0545c", borderColor: "rgba(240,84,92,0.4)" }
          : { background: "white", color: "#374151", borderColor: "#e5e7eb" }
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
          ? { background: "#f0545c", color: "#fff", borderColor: "#f0545c" }
          : { background: "white", color: "#374151", borderColor: "#d1d5db" }
      }
    >
      {label}
    </button>
  );
}

/* ── Mobile Filter Drawer ───────────────────────────────────── */
function MobileFilterDrawer({ open, onClose, filters, setFilters, availableFormats }) {
  const toggleFilter = (key, val) =>
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter((v) => v !== val) : [...f[key], val],
    }));

  const activeCount =
    filters.genre.length + filters.language.length + filters.certificate.length + filters.format.length;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#f5f5f7] rounded-t-2xl"
        style={{ maxHeight: "85vh", overflowY: "auto" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
          <span className="text-[16px] font-bold text-gray-900">Filters</span>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <button
                onClick={() => setFilters({ genre: [], language: [], certificate: [], format: [] })}
                className="text-[12px] font-semibold text-[#f0545c]"
              >
                Clear All ({activeCount})
              </button>
            )}
            <button onClick={onClose}><X size={20} className="text-gray-500" /></button>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <FilterSection
            title="Languages"
            hasActive={filters.language.length > 0}
            onClear={() => setFilters((f) => ({ ...f, language: [] }))}
          >
            {LANGUAGES.map((l) => (
              <SideChip key={l} label={l} active={filters.language.includes(l)}
                onClick={() => toggleFilter("language", l)} />
            ))}
          </FilterSection>

          <FilterSection
            title="Genres"
            hasActive={filters.genre.length > 0}
            onClear={() => setFilters((f) => ({ ...f, genre: [] }))}
          >
            {GENRES.map((g) => (
              <SideChip key={g} label={g} active={filters.genre.includes(g)}
                onClick={() => toggleFilter("genre", g)} />
            ))}
          </FilterSection>

          <FilterSection
            title="Certificate"
            hasActive={filters.certificate.length > 0}
            onClear={() => setFilters((f) => ({ ...f, certificate: [] }))}
          >
            {CERTIFICATES.map((c) => (
              <SideChip key={c} label={c} active={filters.certificate.includes(c)}
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

/* ── Movie Card ─────────────────────────────────────────────── */
function MovieCard({ movie, onView }) {
  const [notified, setNotified] = useState(false);
  const [imgError, setImgError] = useState(false);

  const genres = Array.isArray(movie.genre)
    ? movie.genre.map((g) => g.trim()).filter(Boolean)
    : typeof movie.genre === "string"
    ? movie.genre.split(",").map((g) => g.trim()).filter(Boolean)
    : [];

  const posterUrl = getPosterUrl(movie.poster);

  return (
    <div className="group cursor-pointer" onClick={onView}>
      {/* Poster */}
      <div
        className="relative rounded-2xl overflow-hidden bg-gray-200 shadow-sm"
        style={{ aspectRatio: "2/3" }}
      >
        {posterUrl && !imgError ? (
          <img
            src={posterUrl}
            alt={movie.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-200 to-gray-300">
            <span className="text-gray-400 text-[10px] font-semibold text-center px-3 leading-tight">
              {movie.title}
            </span>
          </div>
        )}

        {/* Releasing ribbon */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center gap-1 px-2.5 py-2"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)" }}
        >
          <CalendarDays size={10} className="text-orange-400 flex-shrink-0" />
          <span className="text-white text-[10px] md:text-[11px] font-semibold">
            Releasing {formatReleaseDate(movie.releaseDate)}
          </span>
        </div>

        {/* Upcoming badge */}
        <div
          className="absolute top-2 right-2 text-[9px] md:text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
          style={{ background: "rgba(234,88,12,0.88)", color: "white" }}
        >
          Upcoming
        </div>

        {/* Certificate badge */}
        {movie.certificate && (
          <div
            className="absolute top-2 left-2 text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: "rgba(0,0,0,0.55)", color: "white" }}
          >
            {movie.certificate}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-2 md:mt-2.5 px-0.5">
        <h3
          className="text-[13px] md:text-[14px] font-bold text-gray-900 leading-tight line-clamp-1 group-hover:text-[#f0545c] transition-colors"
          title={movie.title}
        >
          {movie.title}
        </h3>

        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="flex items-center gap-1 text-[11px] md:text-[12px] text-gray-400">
            <Globe size={10} />
            <span className="line-clamp-1">{movie.language || "—"}</span>
          </p>
          {movie.duration && <span className="text-[10px] text-gray-300">•</span>}
          {movie.duration && (
            <span className="text-[11px] md:text-[12px] text-gray-400">
              {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
            </span>
          )}
        </div>

        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {genres.slice(0, 2).map((g, i) => (
              <span
                key={i}
                className="text-[9px] md:text-[10px] font-semibold px-1.5 md:px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(240,84,92,0.08)",
                  color: "#c0353b",
                  border: "1px solid rgba(240,84,92,0.2)",
                }}
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Formats — desktop only */}
        {movie.formats?.length > 0 && (
          <div className="hidden md:flex flex-wrap gap-1 mt-1.5">
            {movie.formats.map((f, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold px-2 py-0.5 rounded"
                style={{ background: "rgba(0,0,0,0.05)", color: "#888", border: "1px solid rgba(0,0,0,0.1)" }}
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-2 md:mt-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onView}
            className="flex-1 py-1.5 rounded-xl text-[11px] md:text-[12px] font-semibold transition-all border"
            style={{
              borderColor: "rgba(240,84,92,0.3)",
              color: "#f0545c",
              background: "rgba(240,84,92,0.05)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(240,84,92,0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(240,84,92,0.05)")}
          >
            View Details
          </button>
          <button
            onClick={() => setNotified((p) => !p)}
            className="w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all border"
            style={{
              borderColor: notified ? "rgba(240,84,92,0.4)" : "rgba(0,0,0,0.12)",
              background: notified ? "rgba(240,84,92,0.1)" : "white",
              color: notified ? "#f0545c" : "#666",
            }}
            title={notified ? "Reminder set" : "Remind me"}
          >
            <BellPlus size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function ComingSoonPage() {
  const [movies, setMovies]       = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [city, setCity] = useState(() => localStorage.getItem("selectedCity") || "Mumbai");
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    genre: [], language: [], certificate: [], format: [],
  });

  useEffect(() => {
    const handler = () => setCity(localStorage.getItem("selectedCity") || "Mumbai");
    window.addEventListener("cityChanged", handler);
    return () => window.removeEventListener("cityChanged", handler);
  }, []);

  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token") || localStorage.getItem("authToken") || "";
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/movies?status=upcoming`,
        { headers: { ...(token && { Authorization: `Bearer ${token}` }) } }
      );
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const upcoming = data.filter((m) => m.status === "upcoming");
      setMovies(upcoming);
      setFiltered(upcoming);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMovies(); }, [fetchMovies]);

  // Apply filters
  useEffect(() => {
    let result = [...movies];
    if (filters.language.length)
      result = result.filter((m) => filters.language.includes(m.language));
    if (filters.genre.length)
      result = result.filter((m) =>
        filters.genre.some((g) =>
          Array.isArray(m.genre) ? m.genre.includes(g) : m.genre === g
        )
      );
    if (filters.certificate.length)
      result = result.filter((m) => filters.certificate.includes(m.certificate));
    if (filters.format.length)
      result = result.filter((m) => m.formats?.some((f) => filters.format.includes(f)));
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
    filters.certificate.length + filters.format.length;

  return (
    <div className="min-h-screen bg-[#f2f2f2]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>
      <Navbar />

      <div className="max-w-[1300px] mx-auto px-4 md:px-8 py-6 md:py-8 flex gap-6 items-start">

        {/* ── Desktop Sidebar ── */}
        <aside className="w-[240px] flex-shrink-0 hidden md:flex flex-col gap-3 sticky top-[76px]">
          <div className="flex items-center justify-between mb-1 px-1">
            <h2 className="text-[16px] font-bold text-gray-900">Filters</h2>
            {activeCount > 0 && (
              <button
                onClick={() => setFilters({ genre: [], language: [], certificate: [], format: [] })}
                className="text-[12px] font-semibold text-[#f0545c] hover:underline flex items-center gap-1"
              >
                <X size={12} /> Clear All
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
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] md:text-[22px] font-bold text-gray-900">
                Coming Soon in <span style={{ color: "#f0545c" }}>{city}</span>
              </h1>
              <MapPin size={15} className="text-gray-400" />
            </div>

            {/* Mobile filter button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex md:hidden items-center gap-2 px-3 py-2 rounded-xl border text-[13px] font-semibold bg-white transition-all"
              style={
                activeCount > 0
                  ? { borderColor: "rgba(240,84,92,0.4)", color: "#f0545c", background: "rgba(240,84,92,0.05)" }
                  : { borderColor: "#e5e7eb", color: "#374151" }
              }
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#f0545c] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          {/* Language pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: "none" }}>
            {LANGUAGES.map((l) => (
              <LangPill key={l} label={l} active={filters.language.includes(l)}
                onClick={() => toggleFilter("language", l)} />
            ))}
          </div>

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
                  style={{ background: "rgba(240,84,92,0.08)", color: "#f0545c", borderColor: "rgba(240,84,92,0.2)" }}>
                  {v}
                  <button onClick={() => {
                    if (filters.genre.includes(v))            toggleFilter("genre", v);
                    else if (filters.certificate.includes(v)) toggleFilter("certificate", v);
                    else                                       toggleFilter("format", v);
                  }}><X size={10} /></button>
                </span>
              ))}
            </div>
          )}

          {/* Movie count */}
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

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <AlertCircle size={28} className="text-red-300" />
              <p className="text-[13px] text-gray-500">Something went wrong loading upcoming movies.</p>
              <button
                onClick={fetchMovies}
                className="text-[12px] font-semibold px-4 py-1.5 rounded-lg border"
                style={{ borderColor: "rgba(240,84,92,0.3)", color: "#f0545c", background: "rgba(240,84,92,0.05)" }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(240,84,92,0.07)" }}>
                <CalendarDays size={30} style={{ color: "#f0545c", opacity: 0.4 }} />
              </div>
              <p className="text-[16px] font-bold text-gray-400">
                {activeCount > 0 ? "No movies match your filters" : "No upcoming movies right now"}
              </p>
              <p className="text-[13px] text-gray-300 mt-1">
                {activeCount > 0 ? "Try adjusting or clearing your filters" : "Check back soon!"}
              </p>
              {activeCount > 0 && (
                <button
                  onClick={() => setFilters({ genre: [], language: [], certificate: [], format: [] })}
                  className="mt-4 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white"
                  style={{ background: "#f0545c" }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Movie grid */}
          {!loading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {filtered.map((movie) => (
                <MovieCard
                  key={movie._id}
                  movie={movie}
                  onView={() => navigate(`/movie/${movie._id}`)}
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