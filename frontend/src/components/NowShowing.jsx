import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import BottomNav from "./BottomNav";
import Footer from "./Footer";
import PageBackgroundWatermark from "./PageBackgroundWatermark";
import PageLoader from "./PageLoader";
import {
  Star,
  Tv,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  ChevronRight,
  SlidersHorizontal,
  Sparkles,
  Heart,
} from "lucide-react";

const IMG = (path) =>
  !path
    ? null
    : path.startsWith("http")
    ? path
    : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;

const STORAGE_KEY = "voted_movies";
const getVoted = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return new Set();
  }
};
const saveVoted = (set) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));

const GENRES = [
  "Action",
  "Comedy",
  "Drama",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "Adventure",
  "Animation",
];
const CERTIFICATES = ["U", "UA", "A", "PG"];
const LANGUAGES = [
  "Hindi",
  "English",
  "Tamil",
  "Telugu",
  "Malayalam",
  "Gujarati",
  "Kannada",
  "Punjabi",
  "Bengali",
];

function FilterCheckbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 py-1 text-[13px] font-semibold text-neutral-700 hover:text-black cursor-pointer select-none">
      <div
        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
          checked
            ? "bg-[#ff4d58] border-[#ff4d58] text-white shadow-2xs"
            : "border-neutral-300 bg-white hover:border-neutral-400"
        }`}
      >
        {checked && <Check size={11} strokeWidth={3} />}
      </div>
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="hidden"
      />
    </label>
  );
}

function CertificateChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-xl text-[12px] font-bold border transition-all flex items-center justify-center cursor-pointer ${
        active
          ? "bg-[#ff4d58] text-white border-[#ff4d58] shadow-xs"
          : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
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
      className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all flex-shrink-0 cursor-pointer ${
        active
          ? "bg-[#ff4d58] text-white shadow-xs"
          : "bg-white text-neutral-700 border border-neutral-200/80 hover:bg-neutral-50 hover:text-black"
      }`}
    >
      {label}
    </button>
  );
}

function ComingSoonBanner({ movies }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden mb-6 border border-neutral-200/70 bg-white shadow-2xs"
      style={{ minHeight: 70 }}
    >
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
            background:
              "linear-gradient(to right, white 35%, rgba(255,255,255,0.92) 60%, rgba(255,255,255,0.2) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-between px-5 md:px-6 py-3.5 gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="text-[14px] md:text-[15px] font-black text-neutral-900 tracking-tight block leading-tight">
              Coming Soon to Cinemas
            </span>
            <span className="text-[11px] text-neutral-400 font-medium hidden sm:block">
              Sneak peek into upcoming premieres &amp; advance bookings
            </span>
          </div>
        </div>

        <Link
          to="/coming-soon"
          className="inline-flex items-center gap-1 text-[12px] font-bold px-3.5 py-1.5 rounded-full bg-[#ff4d58]/10 text-[#ff4d58] hover:bg-[#ff4d58] hover:text-white transition-all whitespace-nowrap shadow-2xs"
        >
          <span>Explore Upcoming</span>
          <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
}

function MobileFilterDrawer({
  open,
  onClose,
  filters,
  setFilters,
  toggleFilter,
  activeCount,
}) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#f8f9fa] rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl border-t border-neutral-100 animate-in slide-in-from-bottom duration-200">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-neutral-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-white sticky top-0 z-10">
          <span className="text-[16px] font-black text-neutral-900">
            Filter Movies
          </span>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <button
                onClick={() =>
                  setFilters({
                    genre: [],
                    language: [],
                    certificate: [],
                    format: [],
                    inCinemas: false,
                  })
                }
                className="text-[12px] font-bold text-[#ff4d58]"
              >
                Clear All ({activeCount})
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-black"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-4 border border-neutral-200/70">
            <h4 className="text-[13px] font-bold text-neutral-900 mb-2">
              Languages
            </h4>
            <div className="space-y-1">
              {LANGUAGES.map((l) => (
                <FilterCheckbox
                  key={l}
                  label={l}
                  checked={filters.language.includes(l)}
                  onChange={() => toggleFilter("language", l)}
                />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-neutral-200/70">
            <h4 className="text-[13px] font-bold text-neutral-900 mb-2">
              Genres
            </h4>
            <div className="space-y-1">
              {GENRES.map((g) => (
                <FilterCheckbox
                  key={g}
                  label={g}
                  checked={filters.genre.includes(g)}
                  onChange={() => toggleFilter("genre", g)}
                />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-neutral-200/70">
            <h4 className="text-[13px] font-bold text-neutral-900 mb-3">
              Certificate
            </h4>
            <div className="flex flex-wrap gap-2">
              {CERTIFICATES.map((c) => (
                <CertificateChip
                  key={c}
                  label={c}
                  active={filters.certificate.includes(c)}
                  onClick={() => toggleFilter("certificate", c)}
                />
              ))}
            </div>
          </div>
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
  const [seeMoreLang, setSeeMoreLang] = useState(false);
  const [seeMoreGenre, setSeeMoreGenre] = useState(false);
  const [sortBy, setSortBy] = useState("popular");

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
    api
      .get("/movies", { params: { city } })
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
      result = result.filter((m) =>
        filters.certificate.includes(m.certificate)
      );
    if (filters.format.length)
      result = result.filter((m) =>
        m.formats?.some((f) => filters.format.includes(f))
      );
    if (filters.inCinemas)
      result = result.filter((m) => m.isInCinemas === true);

    if (sortBy === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "popular") {
      result.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    } else if (sortBy === "newest") {
      result.sort(
        (a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0)
      );
    }

    setFiltered(result);
  }, [filters, movies, sortBy]);

  const toggleFilter = (key, val) =>
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(val)
        ? f[key].filter((v) => v !== val)
        : [...f[key], val],
    }));

  const activeCount =
    filters.genre.length +
    filters.language.length +
    filters.certificate.length +
    filters.format.length +
    (filters.inCinemas ? 1 : 0);

  const handleVote = async (e, movieId) => {
    e.stopPropagation();
    if (voted.has(movieId)) return;
    setFiltered((prev) =>
      prev.map((m) =>
        m._id === movieId ? { ...m, votes: (m.votes || 0) + 1 } : m
      )
    );
    setVoted((prev) => {
      const next = new Set(prev);
      next.add(movieId);
      saveVoted(next);
      return next;
    });
    try {
      await api.put(`/movies/vote/${movieId}`);
    } catch {
      setFiltered((prev) =>
        prev.map((m) =>
          m._id === movieId
            ? { ...m, votes: Math.max(0, (m.votes || 0) - 1) }
            : m
        )
      );
      setVoted((prev) => {
        const next = new Set(prev);
        next.delete(movieId);
        saveVoted(next);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-neutral-900 flex flex-col justify-between relative">
      <PageBackgroundWatermark variant="movies" />

      {loading && <PageLoader />}

      <div className="relative z-10">
        <Navbar />
        <BottomNav />

        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 pb-32 md:pb-16 flex gap-7 items-start">
          {/* ── Left Filters Sidebar matching Mockup ── */}
          <aside className="w-[240px] flex-shrink-0 hidden md:flex flex-col gap-4 sticky top-[80px]">
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
                <h2 className="text-[16px] font-black text-neutral-900">
                  Filters
                </h2>
                {activeCount > 0 && (
                  <button
                    onClick={() =>
                      setFilters({
                        genre: [],
                        language: [],
                        certificate: [],
                        format: [],
                        inCinemas: false,
                      })
                    }
                    className="text-[12px] font-bold text-[#ff4d58] hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Languages */}
              <div className="mb-5">
                <h3 className="text-[13px] font-bold text-neutral-900 mb-2">
                  Languages
                </h3>
                <div className="space-y-1">
                  {(seeMoreLang ? LANGUAGES : LANGUAGES.slice(0, 5)).map(
                    (lang) => (
                      <FilterCheckbox
                        key={lang}
                        label={lang}
                        checked={filters.language.includes(lang)}
                        onChange={() => toggleFilter("language", lang)}
                      />
                    )
                  )}
                </div>
                {LANGUAGES.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setSeeMoreLang((v) => !v)}
                    className="text-[11px] font-bold text-neutral-400 hover:text-[#ff4d58] flex items-center gap-1 mt-2 cursor-pointer transition-colors"
                  >
                    <span>{seeMoreLang ? "Show Less" : "See More"}</span>
                    <ChevronDown
                      size={12}
                      className={seeMoreLang ? "rotate-180" : ""}
                    />
                  </button>
                )}
              </div>

              {/* Genres */}
              <div className="mb-5 pt-3 border-t border-neutral-100">
                <h3 className="text-[13px] font-bold text-neutral-900 mb-2">
                  Genres
                </h3>
                <div className="space-y-1">
                  {(seeMoreGenre ? GENRES : GENRES.slice(0, 5)).map((genre) => (
                    <FilterCheckbox
                      key={genre}
                      label={genre}
                      checked={filters.genre.includes(genre)}
                      onChange={() => toggleFilter("genre", genre)}
                    />
                  ))}
                </div>
                {GENRES.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setSeeMoreGenre((v) => !v)}
                    className="text-[11px] font-bold text-neutral-400 hover:text-[#ff4d58] flex items-center gap-1 mt-2 cursor-pointer transition-colors"
                  >
                    <span>{seeMoreGenre ? "Show Less" : "See More"}</span>
                    <ChevronDown
                      size={12}
                      className={seeMoreGenre ? "rotate-180" : ""}
                    />
                  </button>
                )}
              </div>

              {/* Certificate */}
              <div className="pt-3 border-t border-neutral-100">
                <h3 className="text-[13px] font-bold text-neutral-900 mb-2.5">
                  Certificate
                </h3>
                <div className="flex flex-wrap gap-2">
                  {CERTIFICATES.map((cert) => (
                    <CertificateChip
                      key={cert}
                      label={cert}
                      active={filters.certificate.includes(cert)}
                      onClick={() => toggleFilter("certificate", cert)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main Movies Grid Area matching Mockup ── */}
          <div className="flex-1 min-w-0">
            {/* Header row with Movies in <City> and Popular ⌵ */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <h1 className="text-[20px] md:text-[24px] font-black text-neutral-900 tracking-tight">
                Movies in <span className="text-[#ff4d58]">{city}</span>
              </h1>

              <div className="flex items-center gap-2">
                {/* Mobile filter button */}
                <button
                  onClick={() => setDrawerOpen(true)}
                  className={`flex md:hidden items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-bold transition-all shadow-2xs ${
                    activeCount > 0
                      ? "border-[#ff4d58]/40 text-[#ff4d58] bg-[#fff0f2]"
                      : "border-neutral-200 bg-white text-neutral-700"
                  }`}
                >
                  <SlidersHorizontal size={13} />
                  <span>Filters</span>
                  {activeCount > 0 && <span>({activeCount})</span>}
                </button>

                {/* Popular Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-[12px] font-bold text-neutral-700 bg-white border border-neutral-200/80 rounded-full px-3.5 py-1.5 pr-7 appearance-none cursor-pointer hover:bg-neutral-50 shadow-2xs outline-none"
                  >
                    <option value="popular">Popular</option>
                    <option value="rating">Top Rated</option>
                    <option value="newest">Newest</option>
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Horizontal Language Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
              <LangPill
                label="All"
                active={filters.language.length === 0}
                onClick={() => setFilters((f) => ({ ...f, language: [] }))}
              />
              {LANGUAGES.map((l) => (
                <LangPill
                  key={l}
                  label={l}
                  active={filters.language.includes(l)}
                  onClick={() => toggleFilter("language", l)}
                />
              ))}
            </div>

            {/* Results count text matching Mockup */}
            <p className="text-[12px] font-semibold text-neutral-400 mb-4">
              {filtered.length} Results
            </p>

            {/* Coming Soon Teaser Banner */}
            {!loading && comingSoon.length > 0 && (
              <ComingSoonBanner movies={comingSoon} />
            )}

            {/* Empty State */}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-neutral-200/80 p-8 shadow-2xs">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-red-50 text-[#ff4d58]">
                  <Tv size={30} />
                </div>
                <p className="text-[17px] font-black text-neutral-800">
                  {activeCount > 0
                    ? "No movies match your filters"
                    : `No movies currently showing in ${city}`}
                </p>
                <p className="text-[13px] text-neutral-400 mt-1 max-w-sm">
                  {activeCount > 0
                    ? "Try loosening your filter parameters or selecting other genres."
                    : "Switch to a nearby metropolitan city from the top bar to view cinemas."}
                </p>
                {activeCount > 0 && (
                  <button
                    onClick={() =>
                      setFilters({
                        genre: [],
                        language: [],
                        certificate: [],
                        format: [],
                        inCinemas: false,
                      })
                    }
                    className="mt-5 px-6 py-2.5 rounded-full text-[13px] font-bold text-white shadow-xs bg-[#ff4d58] hover:bg-[#e03d47] transition-all"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            )}

            {/* Movies Grid matching Mockup Image 1 */}
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
        toggleFilter={toggleFilter}
        activeCount={activeCount}
      />
    </div>
  );
}

function MovieCard({ movie, isVoted, onVote, onClick }) {
  return (
    <div className="cursor-pointer group card-hover-lift" onClick={onClick}>
      <div
        className="relative rounded-2xl overflow-hidden bg-neutral-100 shadow-2xs group-hover:shadow-xl transition-all duration-300 border border-neutral-100"
        style={{ aspectRatio: "2/3" }}
      >
        <img
          src={IMG(movie.poster)}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Certificate / Format tag */}
        {movie.certificate && (
          <span className="absolute top-2.5 left-2.5 text-[10px] font-black px-2 py-0.5 rounded-md backdrop-blur-md bg-black/60 text-white/90">
            {movie.certificate}
          </span>
        )}

        {/* Bottom stats overlay: Star rating on bottom-left, heart on bottom-right */}
        <div className="absolute bottom-2 left-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg text-white text-[11px] font-black">
          <Star size={11} fill="#facc15" className="text-[#facc15]" />
          <span>{movie.rating ? Number(movie.rating).toFixed(1) : "N/A"}</span>
        </div>

        <button
          onClick={(e) => onVote(e, movie._id)}
          className="absolute bottom-2 right-2.5 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 flex items-center justify-center text-white transition-all active:scale-90"
          aria-label="Interested"
        >
          <Heart
            size={14}
            className={isVoted ? "fill-[#ff4d58] text-[#ff4d58]" : "text-white"}
          />
        </button>
      </div>

      <div className="mt-2.5 px-0.5">
        <h3 className="text-[14px] font-bold text-neutral-900 leading-snug line-clamp-1 group-hover:text-[#ff4d58] transition-colors">
          {movie.title}
        </h3>
        <p className="text-[12px] font-medium text-neutral-500 mt-0.5 truncate">
          ★ {movie.rating ? Number(movie.rating).toFixed(1) : "N/A"}
        </p>
      </div>
    </div>
  );
}
