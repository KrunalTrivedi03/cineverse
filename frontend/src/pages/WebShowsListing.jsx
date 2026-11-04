import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Play, Info, Tv, AlertCircle, Sparkles, Clapperboard, ChevronRight } from "lucide-react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BottomNav from "../components/BottomNav";

const ACCENT = "#f0545c";

const CATEGORY_LABELS = {
  "trending-series": "Trending Series",
  "web-original": "Web Originals",
};

const CATEGORY_TAGLINES = {
  "trending-series": "Binge-worthy shows captivating audiences worldwide",
  "web-original": "Exclusive premier productions crafted for NOW members",
};

const FILTERS = [
  { key: "all", label: "All Catalog", icon: Sparkles },
  { key: "trending-series", label: "Trending Series", icon: Tv },
  { key: "web-original", label: "Web Originals", icon: Clapperboard },
];

function ShowCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[160px] sm:w-[220px]">
      <div className="aspect-[2/3] w-full rounded-2xl bg-gray-200 animate-pulse" />
      <div className="mt-2.5 h-3.5 w-3/4 rounded bg-gray-200 animate-pulse" />
      <div className="mt-1.5 h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
    </div>
  );
}

function ShowCard({ show, onOpen }) {
  return (
    <div
      className="group relative flex-shrink-0 w-[160px] sm:w-[220px] rounded-2xl overflow-hidden bg-white cursor-pointer card-hover-lift border border-gray-100 shadow-sm hover:shadow-xl"
      onClick={() => onOpen(show._id)}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-900">
        <img
          src={show.poster}
          alt={show.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Rating badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full px-2.5 py-0.5 border border-white/10 shadow-sm">
          <Star size={11} fill="#facc15" className="text-[#facc15]" />
          <span className="text-[11px] font-black text-white">{show.rating ?? "—"}</span>
        </div>

        {/* Streaming quick play button */}
        {show.streamingUrl && (
          <a
            href={show.streamingUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 bg-[#f0545c] text-white"
            aria-label="Watch now"
          >
            <Play size={13} fill="white" className="ml-0.5" />
          </a>
        )}

        {/* Hover info gradient scrim */}
        <div className="hidden sm:flex absolute inset-0 flex-col justify-end p-4 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {show.releaseYear && (
            <span className="text-[11px] font-bold text-white/80 mb-1">{show.releaseYear}</span>
          )}
          <p className="text-[11.5px] text-white/70 line-clamp-3 mb-3 leading-relaxed">
            {show.description}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(show._id);
            }}
            className="flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md w-fit border border-white/20"
          >
            <Info size={13} /> Details
          </button>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-[14px] font-extrabold tracking-tight text-gray-900 truncate group-hover:text-[#f0545c] transition-colors">
          {show.title}
        </h3>
        <p className="text-[11.5px] font-medium text-gray-500 mt-0.5 truncate">
          {show.genre?.slice(0, 2).join(" • ") || "Series"}
        </p>
      </div>
    </div>
  );
}

function ShowsRow({ category, shows, onOpen, loading }) {
  const filtered = shows.filter((s) => s.category === category);
  if (!loading && filtered.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="px-4 sm:px-8 mb-5">
        <h2 className="font-black tracking-tight text-gray-900 text-xl sm:text-2xl">
          {CATEGORY_LABELS[category]}
        </h2>
        <p className="text-[13px] font-medium text-gray-400 mt-0.5">{CATEGORY_TAGLINES[category]}</p>
      </div>
      <div className="flex gap-4 sm:gap-5 overflow-x-auto px-4 sm:px-8 pb-3 no-scrollbar scroll-smooth">
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

  const collagePosters = useMemo(
    () => shows.filter((s) => s.poster).slice(0, 6).map((s) => s.poster),
    [shows]
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex flex-col justify-between">
      <div>
        <Navbar />
        <BottomNav />

        {/* ══ HERO ════════════════════════════════════════ */}
        <div className="relative overflow-hidden bg-[#0c0d12]">
          <div className="absolute inset-0 opacity-20">
            <div className="flex h-full w-full">
              {(collagePosters.length ? collagePosters : Array(6).fill(null)).map((src, i) => (
                <div key={i} className="flex-1 h-full">
                  {src ? (
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-900" />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(12,13,18,0.7) 0%, rgba(12,13,18,0.85) 60%, #0c0d12 100%)",
            }}
          />

          <div className="relative px-6 sm:px-12 pt-12 pb-10 sm:pt-16 sm:pb-14 max-w-7xl mx-auto">
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest mb-3 border border-[#f0545c]/30 backdrop-blur-md bg-[#f0545c]/15 text-[#ff737b]"
            >
              <Tv size={12} />
              <span>Originals &amp; Web Series</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              {category ? CATEGORY_LABELS[category] : "Shows &amp; Series"}
            </h1>
            <p className="text-[14px] sm:text-[15px] text-gray-300 mt-2 max-w-md font-medium">
              {category
                ? CATEGORY_TAGLINES[category]
                : "Binge-worthy series, critically-acclaimed originals, hand-picked for stream lovers."}
            </p>
          </div>
        </div>

        {/* Filter Pills Bar */}
        {!category && (
          <div className="sticky top-[64px] z-20 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-2xs">
            <div className="flex gap-2.5 px-6 sm:px-12 py-3 max-w-7xl mx-auto overflow-x-auto no-scrollbar">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`flex-shrink-0 flex items-center gap-2 text-[13px] font-bold px-4 py-2 rounded-full border transition-all ${
                      active
                        ? "bg-[#f0545c] text-white border-[#f0545c] shadow-xs"
                        : "bg-white text-gray-700 border-gray-200/80 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <f.icon size={13} />
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-10 pb-16 max-w-7xl mx-auto">
          {error && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white rounded-3xl border border-gray-100 mx-6">
              <AlertCircle size={36} className="text-red-400 mb-3" />
              <p className="text-[15px] font-bold text-gray-700">{error}</p>
            </div>
          )}

          {!error && !loading && shows.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white rounded-3xl border border-gray-100 mx-6">
              <Tv size={36} className="text-gray-300 mb-3" />
              <p className="text-[16px] font-black text-gray-700">No shows added yet</p>
              <p className="text-[13px] text-gray-400 mt-1">Check back soon for upcoming digital releases</p>
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
      </div>

      <Footer />
    </div>
  );
}
