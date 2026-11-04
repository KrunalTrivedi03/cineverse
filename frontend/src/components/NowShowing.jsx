import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import BottomNav from "./BottomNav";
import Footer from "./Footer";
import {
  Star, ThumbsUp, Tv, X, Check,
  ChevronDown, ChevronUp, MapPin, ChevronRight, SlidersHorizontal,
  Sparkles, Film, Filter,
} from "lucide-react";

const IMG = (path) => !path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;

const formatVotes = (votes = 0) => {
  if (votes >= 1_000_000) return (votes / 1_000_000).toFixed(1) + "M";
  if (votes >= 1_000)     return (votes / 1_000).toFixed(1) + "K";
  return String(votes);
};

const STORAGE_KEY = "voted_movies";
const getVoted = () => {
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
    <div className="border border-gray-100 rounded-2xl bg-white overflow-hidden shadow-2xs">
      <div
        className="flex items-center justify-between px-4 py-3.5 cursor-pointer select-none hover:bg-gray-50/50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
          <span className="text-[13px] font-bold text-gray-800">{title}</span>
        </div>
        {hasActive && (
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="text-[11px] font-bold text-[#f0545c] hover:underline"
          >
            Clear
          </button>
        )}
      </div>
      {open && (
        <div className="px-4 pb-4 pt-1 flex flex-wrap gap-2">
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
      className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all ${
        active
          ? "bg-[#f0545c]/10 text-[#f0545c] border-[#f0545c]/40 shadow-2xs"
          : "bg-white text-gray-700 border-gray-200/80 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}

function LangPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-[13px] font-bold border transition-all flex-shrink-0 shadow-2xs ${
        active
          ? "bg-[#f0545c] text-white border-[#f0545c] shadow-xs"
          : "bg-white text-gray-700 border-gray-200/80 hover:border-[#f0545c]/30 hover:bg-[#f0545c]/5 hover:text-[#f0545c]"
      }`}
    >
      {label}
    </button>
  );
}

function ComingSoonBanner({ movies }) {
  return (
    <div
      className="relative rounded-3xl overflow-hidden mb-6 border border-gray-100 bg-white shadow-sm"
      style={{ minHeight: 70 }}
    >
      {/* Blurred poster previews */}
      <div className="absolute inset-0 flex justify-end pointer-events-none">
        <div className="flex h-full">
          {movies.slice(0, 6).map((m, i) => (
            <div
              key={m._id}
              className="h-full"
              style={{
                width: 75,
                backgroundImage: `url(${IMG(m.poster)})`,
                backgroundSize: "cover",
                backgroundPosition: "center top",
                opacity: Math.max(0.1, 0.35 - i * 0.05),
                filter: "blur(2px)",
              }}
            />
          ))}
        </div>
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, white 35%, rgba(255,255,255,0.92) 60%, rgba(255,255,255,0.2) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-between px-5 md:px-6 py-4 gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="text-[15px] md:text-[16px] font-black text-gray-900 tracking-tight block leading-tight">
              Coming Soon to Cinemas
            </span>
            <span className="text-[12px] text-gray-400 font-medium hidden sm:block">
              Sneak peek into upcoming premieres &amp; advance bookings
            </span>
          </div>
        </div>

        <Link
          to="/coming-soon"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-4 py-2 rounded-xl bg-[#f0545c]/10 text-[#f0545c] hover:bg-[#f0545c] hover:text-white transition-all whitespace-nowrap shadow-2xs"
        >
          <span>Explore Upcoming</span>
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

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
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#f8fafc] rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl border-t border-white/20 animate-in slide-in-from-bottom duration-200"
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <span className="text-[16px] font-black text-gray-900">Filter Movies</span>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <button
                onClick={() => setFilters({ genre: [], language: [], certificate: [], format: [], inCinemas: false })}
                className="text-[12px] font-bold text-[#f0545c]"
              >
                Clear All ({activeCount})
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-3">
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
              title="Screen Format"
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
        </div>
      </div>
    </>
  );
}

export default function NowShowing() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(getVoted);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [city, setCity] = useState(
    () => localStorage.getItem("selectedCity") || "Mumbai"
  );

  const [filters, setFilters] = useState({
    genre: [],
    language: [],
    certificate: [],
    format: [],
    inCinemas: false,
  });

  useEffect(() => {
    const handler = () => {
      setCity(localStorage.getItem("selectedCity") || "Mumbai");
    };
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
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex flex-col justify-between">
      <div>
        <Navbar />
        <BottomNav />

        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10 pb-24 md:pb-10 flex gap-7 items-start">

          {/* Desktop Filter Sidebar */}
          <aside className="w-[260px] flex-shrink-0 hidden md:flex flex-col gap-3.5 sticky top-[80px]">
            <div className="flex items-center justify-between mb-1 px-1">
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-[#f0545c]" />
                <h2 className="text-[17px] font-black text-gray-900">Filters</h2>
              </div>
              {activeCount > 0 && (
                <button
                  onClick={() => setFilters({ genre: [], language: [], certificate: [], format: [], inCinemas: false })}
                  className="text-[12px] font-bold text-[#f0545c] hover:underline flex items-center gap-1"
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
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-[13px] font-bold transition-all ${
                filters.inCinemas
                  ? "border-[#f0545c]/40 text-[#f0545c] bg-[#f0545c]/8 shadow-2xs"
                  : "border-gray-200/80 text-gray-700 bg-white hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center gap-2"><Tv size={15} /> In Cinemas Only</span>
              {filters.inCinemas && <Check size={15} />}
            </button>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">

            {/* Header row */}
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] md:text-[24px] font-black text-gray-900 tracking-tight">
                  Now Showing in <span className="text-[#f0545c]">{city}</span>
                </h1>
                <MapPin size={17} className="text-[#f0545c]" />
              </div>

              {/* Mobile filter button */}
              <button
                onClick={() => setDrawerOpen(true)}
                className={`flex md:hidden items-center gap-2 px-3.5 py-2 rounded-2xl border text-[13px] font-bold transition-all shadow-2xs ${
                  activeCount > 0
                    ? "border-[#f0545c]/40 text-[#f0545c] bg-[#f0545c]/8"
                    : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                <SlidersHorizontal size={15} />
                <span>Filters</span>
                {activeCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#f0545c] text-white text-[10.5px] font-black flex items-center justify-center">
                    {activeCount}
                  </span>
                )}
              </button>
            </div>

            {/* Horizontal Language Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-5 no-scrollbar">
              {LANGUAGES.map((l) => (
                <LangPill key={l} label={l}
                  active={filters.language.includes(l)}
                  onClick={() => toggleFilter("language", l)} />
              ))}
            </div>

            {/* Coming Soon Teaser Banner */}
            {!loading && comingSoon.length > 0 && (
              <ComingSoonBanner movies={comingSoon} />
            )}

            {/* Active filter chips row */}
            {activeCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-5">
                {!loading && (
                  <span className="text-[13px] text-gray-500 font-bold mr-1">
                    Showing {filtered.length} movie{filtered.length !== 1 ? "s" : ""}:
                  </span>
                )}
                {[...filters.genre, ...filters.certificate, ...filters.format].map((v) => (
                  <span
                    key={v}
                    className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border bg-[#f0545c]/10 text-[#f0545c] border-[#f0545c]/25 shadow-2xs"
                  >
                    <span>{v}</span>
                    <button
                      onClick={() => {
                        if (filters.genre.includes(v))            toggleFilter("genre", v);
                        else if (filters.certificate.includes(v)) toggleFilter("certificate", v);
                        else                                       toggleFilter("format", v);
                      }}
                      className="hover:scale-125 transition-transform"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
                {filters.inCinemas && (
                  <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border bg-[#f0545c]/10 text-[#f0545c] border-[#f0545c]/25 shadow-2xs">
                    <span>In Cinemas</span>
                    <button onClick={() => setFilters((f) => ({ ...f, inCinemas: false }))}>
                      <X size={11} />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Loading Skeletons */}
            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="rounded-2xl bg-gray-200" style={{ aspectRatio: "2/3" }} />
                    <div className="mt-3 space-y-2">
                      <div className="h-4 w-3/4 bg-gray-200 rounded" />
                      <div className="h-3 w-1/2 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-gray-100 p-8 shadow-xs">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-red-50 text-[#f0545c]"
                >
                  <Tv size={30} />
                </div>
                <p className="text-[17px] font-black text-gray-800">
                  {activeCount > 0 ? "No movies match your filters" : `No movies currently showing in ${city}`}
                </p>
                <p className="text-[13px] text-gray-400 mt-1 max-w-sm">
                  {activeCount > 0
                    ? "Try loosening your filter parameters or selecting other genres."
                    : "Switch to a nearby metropolitan city from the top bar to view cinemas."}
                </p>
                {activeCount > 0 && (
                  <button
                    onClick={() => setFilters({ genre: [], language: [], certificate: [], format: [], inCinemas: false })}
                    className="mt-5 px-6 py-2.5 rounded-2xl text-[13px] font-bold text-white shadow-md shadow-[#f0545c]/30 hover:bg-[#d94048] transition-all"
                    style={{ background: "#f0545c" }}
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            )}

            {/* Movies Grid */}
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
      </div>

      <Footer />

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
    <div className="cursor-pointer group card-hover-lift" onClick={onClick}>
      <div
        className="relative rounded-2xl overflow-hidden bg-gray-100 shadow-md group-hover:shadow-2xl transition-all duration-300 border border-gray-100"
        style={{ aspectRatio: "2/3" }}
      >
        <img
          src={IMG(movie.poster)}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {movie.certificate && (
          <span
            className="absolute top-2.5 left-2.5 text-[10px] font-black px-2 py-0.5 rounded-md backdrop-blur-md bg-black/60 text-white/90 border border-white/10"
          >
            {movie.certificate}
          </span>
        )}

        {movie.isInCinemas && (
          <span
            className="absolute top-2.5 right-2.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-md bg-[#f0545c] text-white"
          >
            In Cinemas
          </span>
        )}

        {/* Bottom stats overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 px-3 py-3"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)" }}
        >
          {movie.formats?.length > 0 && (
            <p className="text-[10px] text-white/80 font-bold mb-1 tracking-wider uppercase">
              {movie.formats.slice(0, 3).join(" · ")}
            </p>
          )}
          <div className="flex items-center gap-1.5">
            <Star size={12} fill="#facc15" className="text-[#facc15] flex-shrink-0" />
            <span className="text-white font-black text-[12.5px]">{movie.rating ? Number(movie.rating).toFixed(1) : "N/A"}</span>
            <span className="text-white/60 text-[11px] font-semibold">{formatVotes(movie.votes)} Votes</span>
          </div>
        </div>
      </div>

      <div className="mt-3 px-1">
        <h3 className="text-[14px] font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-[#f0545c] transition-colors">
          {movie.title}
        </h3>
        <p className="text-[12px] font-medium text-gray-500 mt-0.5 truncate">
          {[movie.genre, movie.language].filter(Boolean).join(" · ")}
        </p>
        {movie.duration && (
          <p className="text-[11px] font-medium text-gray-400 mt-0.5">
            {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
          </p>
        )}

        <button
          onClick={(e) => onVote(e, movie._id)}
          className={`mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-bold transition-all border ${
            isVoted
              ? "bg-[#f0545c] text-white border-[#f0545c] shadow-xs"
              : "bg-[#f0545c]/5 text-[#f0545c] border-[#f0545c]/25 hover:bg-[#f0545c]/10"
          }`}
        >
          <ThumbsUp size={12} fill={isVoted ? "#fff" : "none"} />
          <span>{isVoted ? "Voted Interested" : "Interested"}</span>
        </button>
      </div>
    </div>
  );
}
