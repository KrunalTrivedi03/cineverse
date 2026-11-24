import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Play, Info, Tv, AlertCircle, Sparkles, Clapperboard } from "lucide-react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BottomNav from "../components/BottomNav";

const ACCENT = "#106579";

const CATEGORY_LABELS = {
  "trending-series": "Trending Series",
  "web-original": "Web Originals",
};

const CATEGORY_TAGLINES = {
  "trending-series": "What everyone's watching right now",
  "web-original": "Exclusive originals you won't find anywhere else",
};

const FILTERS = [
  { key: "all", label: "All Shows", icon: Sparkles },
  { key: "trending-series", label: "Trending Series", icon: Tv },
  { key: "web-original", label: "Web Originals", icon: Clapperboard },
];

function ShowCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[150px] sm:w-[210px]">
      <div className="aspect-[2/3] w-full rounded-xl bg-gray-100 animate-pulse" />
      <div className="mt-2 h-3 w-3/4 rounded bg-gray-100 animate-pulse" />
      <div className="mt-1.5 h-2.5 w-1/2 rounded bg-gray-100 animate-pulse" />
    </div>
  );
}

function ShowCard({ show, onOpen }) {
  return (
    <div
      className="group relative flex-shrink-0 w-[150px] sm:w-[210px] rounded-xl overflow-hidden bg-gray-900 cursor-pointer transition-transform duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-lg"
      onClick={() => onOpen(show._id)}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <img
          src={show.poster}
          alt={show.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Always-on: rating badge + quick watch, so touch devices aren't stuck behind :hover */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5">
          <Star size={11} fill={ACCENT} stroke={ACCENT} />
          <span className="text-[11px] font-semibold text-white">{show.rating}</span>
        </div>
        {show.streamingUrl && (
          <a
            href={show.streamingUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110"
            style={{ backgroundColor: ACCENT }}
            aria-label="Watch now"
          >
            <Play size={12} fill="white" stroke="white" />
          </a>
        )}

        {/* Desktop hover: extra detail on top of what's already visible */}
        <div className="hidden sm:flex absolute inset-0 flex-col justify-end p-3 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {show.releaseYear && (
            <span className="text-[11px] text-gray-300 mb-1">{show.releaseYear}</span>
          )}
          <p className="text-[11px] text-gray-300 line-clamp-3 mb-2">
            {show.description}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(show._id);
            }}
            className="flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-white/10 text-white hover:bg-white/20 w-fit"
          >
            <Info size={12} /> Details
          </button>
        </div>
      </div>

      <div className="p-2.5 bg-white">
        <h3 className="text-[13px] sm:text-sm font-extrabold tracking-tight text-gray-900 truncate">
          {show.title}
        </h3>
        <p className="text-[11px] text-gray-500 mt-0.5 truncate">
          {show.genre?.slice(0, 2).join(" • ")}
        </p>
      </div>
    </div>
  );
}

function ShowsRow({ category, shows, onOpen, loading }) {
  const filtered = shows.filter((s) => s.category === category);
  if (!loading && filtered.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="px-4 sm:px-6 mb-4">
        <h2
          className="font-extrabold tracking-tight text-gray-900 text-xl sm:text-2xl"
          style={{ fontFamily: "var(--now-ui-font)" }}
        >
          {CATEGORY_LABELS[category]}
        </h2>
        <p className="text-[12px] text-gray-400 mt-0.5">{CATEGORY_TAGLINES[category]}</p>
      </div>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-6 pb-3 scrollbar-hide">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <ShowCardSkeleton key={i} />)
          : filtered.map((show) => (
              <ShowCard key={show._id} show={show} onOpen={onOpen} />
            ))}
      </div>
    </section>
  );
}

export default function WebShowsListing({ category }) {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(category || "all");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const fetchShows = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = category ? `?category=${category}` : "";
        const res = await api.get(`/web-shows${query}`);
        if (!cancelled) setShows(res.data);
      } catch (err) {
        console.error("Failed to fetch shows:", err);
        if (!cancelled) setError("Couldn't load shows right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchShows();
    return () => {
      cancelled = true;
    };
  }, [category]);

  const handleOpen = (id) => navigate(`/web-shows/${id}`);

  const showTrending = filter === "all" || filter === "trending-series";
  const showOriginals = filter === "all" || filter === "web-original";

  // Small pool of posters for the hero collage — just whatever's loaded so far.
  const collagePosters = useMemo(
    () => shows.filter((s) => s.poster).slice(0, 6).map((s) => s.poster),
    [shows]
  );

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--now-ui-font)" }}>

      <Navbar />
      <BottomNav />

      {/* ══ HERO ════════════════════════════════════════ */}
      <div className="relative overflow-hidden" style={{ background: "#111" }}>
        <div className="absolute inset-0 opacity-25">
          <div className="flex h-full w-full">
            {(collagePosters.length ? collagePosters : Array(6).fill(null)).map((src, i) => (
              <div key={i} className="flex-1 h-full">
                {src ? (
                  <img src={src} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-800" />
                )}
              </div>
            ))}
          </div>
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(17,17,17,0.55) 0%, rgba(17,17,17,0.75) 55%, #111 100%)",
          }}
        />

        <div className="relative px-4 sm:px-6 pt-10 pb-8 sm:pt-14 sm:pb-10 max-w-7xl mx-auto">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold mb-3"
            style={{ background: "rgba(16,101,121,0.16)", color: "#ff8a90" }}
          >
            <Tv size={12} /> Shows &amp; Originals
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {category ? CATEGORY_LABELS[category] : "Shows"}
          </h1>
          <p className="text-[13px] sm:text-sm text-gray-300 mt-2 max-w-md">
            {category
              ? CATEGORY_TAGLINES[category]
              : "Binge-worthy series and originals, hand-picked for you."}
          </p>
        </div>
      </div>

      {/* ══ FILTER PILLS — only meaningful on the combined /web-shows page ══ */}
      {!category && (
        <div className="sticky top-[60px] z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="flex gap-2 px-4 sm:px-6 py-3 max-w-7xl mx-auto overflow-x-auto scrollbar-hide">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="flex-shrink-0 flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-full border transition-all"
                  style={
                    active
                      ? { background: ACCENT, color: "white", borderColor: ACCENT }
                      : { background: "white", color: "#374151", borderColor: "#e4e4e7" }
                  }
                >
                  <f.icon size={13} />
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-8 pb-16 max-w-7xl mx-auto">
        {error && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <AlertCircle size={36} className="text-gray-200 mb-3" />
            <p className="text-[14px] font-semibold text-gray-500">{error}</p>
          </div>
        )}

        {!error && !loading && shows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Tv size={36} className="text-gray-200 mb-3" />
            <p className="text-[14px] font-semibold text-gray-500">No shows added yet</p>
            <p className="text-[12px] text-gray-300 mt-1">Check back soon</p>
          </div>
        )}

        {!error && (
          <>
            {category ? (
              <ShowsRow category={category} shows={shows} onOpen={handleOpen} loading={loading} />
            ) : (
              <>
                {showTrending && (
                  <ShowsRow category="trending-series" shows={shows} onOpen={handleOpen} loading={loading} />
                )}
                {showOriginals && (
                  <ShowsRow category="web-original" shows={shows} onOpen={handleOpen} loading={loading} />
                )}
              </>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}