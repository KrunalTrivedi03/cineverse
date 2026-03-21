import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import {
  BellPlus, Star, CalendarDays, X,
  ChevronDown, ChevronUp, MapPin, Clock,
  ChevronRight, SlidersHorizontal,
} from "lucide-react";

const IMG = (path) => `http://localhost:5000${path}`;

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

const STORAGE_KEY = "notified_movies";
const getNotified = () => {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
  catch { return new Set(); }
};
const saveNotified = (set) => localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));

const GENRES       = ["Action", "Comedy", "Drama", "Horror", "Romance", "Sci-Fi", "Thriller", "Adventure", "Animation"];
const CERTIFICATES = ["U", "UA", "A", "PG", "PG-13"];
const LANGUAGES    = ["Hindi", "English", "Tamil", "Telugu", "Malayalam", "Kannada", "Gujarati", "Punjabi", "Bengali"];

function FilterSection({ title, children, onClear, hasActive }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background: "white", border: "1px solid #ebebeb", borderRadius: 16, overflow: "hidden" }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", cursor: "pointer", userSelect: "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {open ? <ChevronUp size={13} color="#bbb" /> : <ChevronDown size={13} color="#bbb" />}
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", letterSpacing: "0.02em" }}>{title}</span>
        </div>
        {hasActive && (
          <button onClick={e => { e.stopPropagation(); onClear(); }}
            style={{ fontSize: 11, fontWeight: 600, color: "#f0545c", background: "none", border: "none", cursor: "pointer" }}>
            Clear
          </button>
        )}
      </div>
      {open && (
        <div style={{ padding: "2px 14px 14px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function SideChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 11px", borderRadius: 8, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
      border: active ? "1.5px solid rgba(240,84,92,0.45)" : "1.5px solid #ebebeb",
      background: active ? "rgba(240,84,92,0.07)" : "white",
      color: active ? "#f0545c" : "#555",
      transition: "all 0.13s ease",
    }}>
      {label}
    </button>
  );
}

function LangPill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 16px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
      border: active ? "1.5px solid #f0545c" : "1.5px solid #e0e0e0",
      background: active ? "#f0545c" : "white",
      color: active ? "#fff" : "#444",
      flexShrink: 0, transition: "all 0.13s ease", whiteSpace: "nowrap",
    }}>
      {label}
    </button>
  );
}

function NowShowingBanner({ movies }) {
  return (
    <div style={{
      position: "relative", borderRadius: 18, overflow: "hidden",
      background: "white", border: "1px solid #ebebeb",
      marginBottom: 20, minHeight: 68,
    }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "flex-end", pointerEvents: "none" }}>
        {movies.slice(0, 7).map((m, i) => (
          <div key={m._id} style={{
            width: 72, height: "100%",
            backgroundImage: `url(${IMG(m.poster)})`,
            backgroundSize: "cover", backgroundPosition: "center top",
            opacity: Math.max(0.08, 0.3 - i * 0.04),
            filter: "blur(2px)",
          }} />
        ))}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, white 35%, rgba(255,255,255,0.95) 55%, rgba(255,255,255,0.2) 100%)",
        }} />
      </div>

      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: 68,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: 9.5, fontWeight: 800, letterSpacing: "0.14em",
            textTransform: "uppercase", padding: "3px 9px", borderRadius: 999,
            background: "rgba(240,84,92,0.09)", color: "#f0545c",
            border: "1px solid rgba(240,84,92,0.18)",
          }}>
            Live
          </span>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#111", letterSpacing: "-0.3px" }}>
            Now Showing
          </span>
        </div>
        <Link to="/now-showing" style={{
          display: "flex", alignItems: "center", gap: 4,
          fontSize: 12.5, fontWeight: 700, color: "#f0545c",
          textDecoration: "none", flexShrink: 0,
        }}>
          Explore Now Showing <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export default function UpcomingMoviesPage() {
  const [movies,     setMovies]     = useState([]);
  const [nowShowing, setNowShowing] = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [notified,   setNotified]   = useState(getNotified);
  const [city,       setCity]       = useState(() => localStorage.getItem("selectedCity") || "Mumbai");
  const [loading,    setLoading]    = useState(true);
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
      .then(res => {
        const upcoming = res.data.filter(m => m.status === "upcoming");
        const released = res.data.filter(m => m.status === "released");
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
    if (filters.language.length)   result = result.filter(m => filters.language.includes(m.language));
    if (filters.genre.length)       result = result.filter(m => filters.genre.some(g => m.genre?.toLowerCase().includes(g.toLowerCase())));
    if (filters.certificate.length) result = result.filter(m => filters.certificate.includes(m.certificate));
    if (filters.format.length)      result = result.filter(m => m.formats?.some(f => filters.format.includes(f)));
    setFiltered(result);
  }, [filters, movies]);

  const availableFormats = [...new Set(movies.flatMap(m => m.formats || []))];
  const toggleFilter = (key, val) =>
    setFilters(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(v => v !== val) : [...f[key], val] }));
  const clearAll = () => setFilters({ genre: [], language: [], certificate: [], format: [] });
  const activeCount = filters.genre.length + filters.language.length + filters.certificate.length + filters.format.length;

  const handleNotify = (e, movieId) => {
    e.stopPropagation();
    setNotified(prev => {
      const next = new Set(prev);
      next.has(movieId) ? next.delete(movieId) : next.add(movieId);
      saveNotified(next);
      return next;
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        ::-webkit-scrollbar { display: none; }
        * { box-sizing: border-box; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
      <Navbar />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 28px 60px", display: "flex", gap: 24, alignItems: "flex-start" }}>

        <aside style={{ width: 228, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, position: "sticky", top: 76 }}
          className="hidden md:flex">

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px 4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <SlidersHorizontal size={14} color="#888" />
              <span style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>Filters</span>
            </div>
            {activeCount > 0 && (
              <button onClick={clearAll} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#f0545c", background: "none", border: "none", cursor: "pointer" }}>
                <X size={11} /> Clear all
              </button>
            )}
          </div>

          <FilterSection title="Languages" hasActive={filters.language.length > 0} onClear={() => setFilters(f => ({ ...f, language: [] }))}>
            {LANGUAGES.map(l => <SideChip key={l} label={l} active={filters.language.includes(l)} onClick={() => toggleFilter("language", l)} />)}
          </FilterSection>

          <FilterSection title="Genres" hasActive={filters.genre.length > 0} onClear={() => setFilters(f => ({ ...f, genre: [] }))}>
            {GENRES.map(g => <SideChip key={g} label={g} active={filters.genre.includes(g)} onClick={() => toggleFilter("genre", g)} />)}
          </FilterSection>

          <FilterSection title="Certificate" hasActive={filters.certificate.length > 0} onClear={() => setFilters(f => ({ ...f, certificate: [] }))}>
            {CERTIFICATES.map(c => <SideChip key={c} label={c} active={filters.certificate.includes(c)} onClick={() => toggleFilter("certificate", c)} />)}
          </FilterSection>

          {availableFormats.length > 0 && (
            <FilterSection title="Format" hasActive={filters.format.length > 0} onClear={() => setFilters(f => ({ ...f, format: [] }))}>
              {availableFormats.map(f => <SideChip key={f} label={f} active={filters.format.includes(f)} onClick={() => toggleFilter("format", f)} />)}
            </FilterSection>
          )}
        </aside>

        <div style={{ flex: 1, minWidth: 0 }}>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: "-0.4px", margin: 0 }}>
              Coming Soon in <span style={{ color: "#f0545c" }}>{city}</span>
            </h1>
            <MapPin size={15} color="#bbb" />
          </div>

          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 18 }}>
            {LANGUAGES.map(l => (
              <LangPill key={l} label={l} active={filters.language.includes(l)} onClick={() => toggleFilter("language", l)} />
            ))}
          </div>

          {!loading && nowShowing.length > 0 && <NowShowingBanner movies={nowShowing} />}

          {(!loading && (activeCount > 0 || filtered.length > 0)) && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              <span style={{ fontSize: 12.5, color: "#999", fontWeight: 600 }}>
                {filtered.length} film{filtered.length !== 1 ? "s" : ""}
              </span>
              {[...filters.genre, ...filters.certificate, ...filters.format].map(v => (
                <span key={v} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999,
                  border: "1px solid rgba(240,84,92,0.25)",
                  background: "rgba(240,84,92,0.07)", color: "#f0545c",
                }}>
                  {v}
                  <button onClick={() => {
                    if (filters.genre.includes(v)) toggleFilter("genre", v);
                    else if (filters.certificate.includes(v)) toggleFilter("certificate", v);
                    else toggleFilter("format", v);
                  }} style={{ background: "none", border: "none", cursor: "pointer", color: "#f0545c", display: "flex" }}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <div style={{ borderRadius: 16, background: "#e8e8e8", aspectRatio: "2/3", animation: "pulse 1.5s ease-in-out infinite" }} />
                  <div style={{ marginTop: 10, height: 13, width: "70%", background: "#e8e8e8", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
                  <div style={{ marginTop: 6, height: 11, width: "45%", background: "#efefef", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", textAlign: "center" }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, background: "rgba(240,84,92,0.07)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <CalendarDays size={26} color="#f0545c" style={{ opacity: 0.4 }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#999", margin: 0 }}>
                {activeCount > 0 ? "No movies match your filters" : `No upcoming movies in ${city}`}
              </p>
              <p style={{ fontSize: 12.5, color: "#bbb", marginTop: 6 }}>
                {activeCount > 0 ? "Try adjusting or clearing your filters" : "Try selecting a different city"}
              </p>
              {activeCount > 0 && (
                <button onClick={clearAll} style={{ marginTop: 18, padding: "10px 22px", borderRadius: 12, fontSize: 13, fontWeight: 700, color: "white", background: "#f0545c", border: "none", cursor: "pointer" }}>
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: 20 }}>
              {filtered.map(movie => (
                <MovieCard key={movie._id} movie={movie}
                  isNotified={notified.has(movie._id)}
                  onNotify={handleNotify}
                  onClick={() => navigate(`/movie/${movie._id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MovieCard({ movie, isNotified, onNotify, onClick }) {
  const [hovered, setHovered] = useState(false);
  const genres = typeof movie.genre === "string"
    ? movie.genre.split(",").map(g => g.trim()).filter(Boolean)
    : [];

  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ cursor: "pointer" }}>

      <div style={{
        position: "relative", borderRadius: 16, overflow: "hidden",
        aspectRatio: "2/3", background: "#ddd",
        boxShadow: hovered ? "0 8px 28px rgba(0,0,0,0.14)" : "0 2px 8px rgba(0,0,0,0.07)",
        transition: "box-shadow 0.25s ease",
      }}>
        <img src={IMG(movie.poster)} alt={movie.title} style={{
          width: "100%", height: "100%", objectFit: "cover",
          transform: hovered ? "scale(1.04)" : "scale(1)",
          transition: "transform 0.35s ease",
        }} />

        {movie.certificate && (
          <span style={{
            position: "absolute", top: 10, left: 10,
            fontSize: 9.5, fontWeight: 800, padding: "2px 7px", borderRadius: 6,
            background: "rgba(0,0,0,0.52)", color: "rgba(255,255,255,0.88)", letterSpacing: "0.04em",
          }}>
            {movie.certificate}
          </span>
        )}

        <span style={{
          position: "absolute", top: 10, right: 10,
          fontSize: 9.5, fontWeight: 800, padding: "3px 8px", borderRadius: 999,
          background: "rgba(240,84,92,0.9)", color: "#fff",
        }}>
          Upcoming
        </span>

        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "28px 12px 10px",
          background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)",
        }}>
          {movie.formats?.length > 0 && (
            <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.55)", fontWeight: 600, marginBottom: 4 }}>
              {movie.formats.slice(0, 3).join(" · ")}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <CalendarDays size={10} color="#fb923c" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>
              {formatDate(movie.releaseDate)}
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 10, paddingLeft: 2 }}>
        <h3 style={{
          fontSize: 13.5, fontWeight: 700, margin: 0, lineHeight: 1.3,
          color: hovered ? "#f0545c" : "#111",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          transition: "color 0.15s ease",
        }}>
          {movie.title}
        </h3>

        <p style={{ fontSize: 11.5, color: "#aaa", margin: "3px 0 0", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {[genres[0], movie.language].filter(Boolean).join(" · ")}
        </p>

        {movie.duration && (
          <p style={{ fontSize: 11, color: "#bbb", margin: "2px 0 0", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={10} />
            {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
          </p>
        )}

        {movie.rating && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
            <Star size={10} fill="#f0545c" color="#f0545c" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#555" }}>{movie.rating}/10</span>
            <span style={{ fontSize: 10.5, color: "#ccc" }}>· {formatVotes(movie.votes)} votes</span>
          </div>
        )}

        <button
          onClick={e => onNotify(e, movie._id)}
          style={{
            marginTop: 9, width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "7px 0", borderRadius: 10, fontSize: 11.5, fontWeight: 700,
            cursor: "pointer", transition: "all 0.15s ease",
            border: isNotified ? "1.5px solid #f0545c" : "1.5px solid rgba(240,84,92,0.3)",
            background: isNotified ? "#f0545c" : "white",
            color: isNotified ? "#fff" : "#f0545c",
          }}
          onMouseEnter={e => { if (!isNotified) e.currentTarget.style.background = "rgba(240,84,92,0.06)"; }}
          onMouseLeave={e => { if (!isNotified) e.currentTarget.style.background = "white"; }}
        >
          <BellPlus size={11} />
          {isNotified ? "Notified" : "Notify Me"}
        </button>
      </div>
    </div>
  );
}