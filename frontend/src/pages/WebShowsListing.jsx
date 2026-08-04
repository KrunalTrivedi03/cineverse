import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Play, Info } from "lucide-react";
import api from "../api/axiosInstance";

const CATEGORY_LABELS = {
  "trending-series": "Trending Series",
  "web-original": "Web Originals",
};

function ShowCard({ show, onOpen }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex-shrink-0 w-[180px] sm:w-[210px] rounded-xl overflow-hidden bg-gray-900 cursor-pointer transition-transform duration-300"
      style={{ transform: hovered ? "translateY(-6px)" : "translateY(0)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(show._id)}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <img
          src={show.poster}
          alt={show.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div
          className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          <div className="flex items-center gap-1 text-xs text-gray-200 mb-2">
            <Star size={12} fill="#f0545c" stroke="#f0545c" />
            <span>{show.rating}</span>
            {show.releaseYear && (
              <span className="text-gray-400">• {show.releaseYear}</span>
            )}
          </div>
          <p className="text-[11px] text-gray-300 line-clamp-3 mb-2">
            {show.description}
          </p>
          <div className="flex gap-2">
            {show.streamingUrl && (
              <a
                href={show.streamingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md"
                style={{ backgroundColor: "#f0545c", color: "white" }}
                onClick={(e) => e.stopPropagation()}
              >
                <Play size={12} fill="white" /> Watch
              </a>
            )}
            <button
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-white/10 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(show._id);
              }}
            >
              <Info size={12} /> Info
            </button>
          </div>
        </div>
      </div>
      <div className="p-2.5">
        <h3 className="text-sm font-extrabold tracking-tight text-gray-900 truncate">
          {show.title}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {show.genre?.slice(0, 2).join(" • ")}
        </p>
      </div>
    </div>
  );
}

function ShowsRow({ category, shows, onOpen }) {
  const filtered = shows.filter((s) => s.category === category);
  if (filtered.length === 0) return null;

  return (
    <section className="mb-10">
      <h2
        className="font-extrabold tracking-tight text-gray-900 text-xl sm:text-2xl mb-4 px-4 sm:px-6"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        {CATEGORY_LABELS[category]}
      </h2>
      <div className="flex gap-4 overflow-x-auto px-4 sm:px-6 pb-3 scrollbar-hide">
        {filtered.map((show) => (
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

  return (
    <div
      className="min-h-screen bg-white pt-8 pb-16"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {loading && (
        <p className="px-4 sm:px-6 text-gray-500 text-sm">Loading shows...</p>
      )}
      {error && (
        <p className="px-4 sm:px-6 text-sm" style={{ color: "#f0545c" }}>
          {error}
        </p>
      )}
      {!loading && !error && shows.length === 0 && (
        <p className="px-4 sm:px-6 text-gray-500 text-sm">
          No shows added yet. Check back soon.
        </p>
      )}

      {!loading && !error && (
        <>
          {category ? (
            <ShowsRow category={category} shows={shows} onOpen={handleOpen} />
          ) : (
            <>
              <ShowsRow
                category="trending-series"
                shows={shows}
                onOpen={handleOpen}
              />
              <ShowsRow
                category="web-original"
                shows={shows}
                onOpen={handleOpen}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}