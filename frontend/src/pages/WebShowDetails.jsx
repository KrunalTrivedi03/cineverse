import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Play, ArrowLeft, Calendar, Tv, Film, Layers, AlertCircle } from "lucide-react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BottomNav from "../components/BottomNav";

const ACCENT = "#f0545c";

function DetailsSkeleton() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Navbar />
      <BottomNav />
      <div className="relative w-full h-[38vh] sm:h-[50vh] bg-gray-100 animate-pulse" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-20 relative">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-36 sm:w-56 aspect-[2/3] rounded-xl bg-gray-200 animate-pulse flex-shrink-0 border-4 border-white shadow-xl" />
          <div className="flex-1 pt-4 sm:pt-24 space-y-3">
            <div className="h-7 w-2/3 rounded bg-gray-100 animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-gray-100 animate-pulse" />
            <div className="h-16 w-full rounded bg-gray-100 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WebShowDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [posterLoaded, setPosterLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchShow = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/web-shows/${id}`);
        if (!cancelled) setShow(res.data);
      } catch (err) {
        console.error("Failed to fetch show:", err);
        if (!cancelled) setError("Show not found.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchShow();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <DetailsSkeleton />;

  if (error || !show) {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <Navbar />
        <BottomNav />
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
          <AlertCircle size={36} className="text-gray-200" />
          <p className="text-gray-500 text-sm font-medium">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full text-white transition-transform hover:scale-105"
            style={{ backgroundColor: ACCENT }}
          >
            <ArrowLeft size={15} /> Go Back
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');`}</style>

      <Navbar />
      <BottomNav />

      {/* ══ BACKDROP ════════════════════════════════════ */}
      <div className="relative w-full h-[40vh] sm:h-[52vh] overflow-hidden bg-gray-900">
        <img
          src={show.banner || show.poster}
          alt=""
          className={`w-full h-full object-cover transition-opacity duration-700 ${
            posterLoaded ? "opacity-60" : "opacity-0"
          }`}
          onLoad={() => setPosterLoaded(true)}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 35%, rgba(255,255,255,0.55) 78%, #fff 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-white bg-black/40 backdrop-blur-sm hover:bg-black/60 rounded-full pl-2.5 pr-3.5 py-1.5 text-[13px] font-semibold transition-colors"
        >
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-20 sm:-mt-28 relative">
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-7">
          <img
            src={show.poster}
            alt={show.title}
            className="w-32 sm:w-56 rounded-xl shadow-xl border-4 border-white flex-shrink-0 self-start"
          />

          <div className="flex-1 pt-1 sm:pt-24 min-w-0">
            <span
              className="inline-block text-[10.5px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full mb-2"
              style={{ backgroundColor: "rgba(240,84,92,0.1)", color: ACCENT }}
            >
              {show.category === "trending-series" ? "Trending Series" : "Web Original"}
            </span>

            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-gray-900 leading-tight">
              {show.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-[13px] text-gray-600">
              <span className="flex items-center gap-1 font-semibold text-gray-800">
                <Star size={14} fill={ACCENT} stroke={ACCENT} />
                {show.rating}
              </span>
              {show.releaseYear && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} className="text-gray-400" /> {show.releaseYear}
                </span>
              )}
              {show.seasons?.length > 0 && (
                <span className="flex items-center gap-1">
                  <Layers size={14} className="text-gray-400" /> {show.seasons.length} Season
                  {show.seasons.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {show.genre?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3.5">
                {show.genre.map((g) => (
                  <span
                    key={g}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Action buttons — stacked full-width on mobile, inline from sm up */}
            <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
              {show.streamingUrl && (
                <a
                  href={show.streamingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 font-semibold px-5 py-2.5 rounded-lg text-white shadow-sm transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: ACCENT }}
                >
                  <Play size={16} fill="white" /> Watch Now
                </a>
              )}
              {show.trailerUrl && (
                <a
                  href={show.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 font-semibold px-5 py-2.5 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                >
                  <Film size={16} /> Trailer
                </a>
              )}
            </div>

            {show.description && (
              <p className="text-gray-700 text-[13.5px] leading-relaxed mt-5">
                {show.description}
              </p>
            )}

            {show.cast?.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-bold tracking-wide uppercase text-gray-400 mb-1.5">
                  Cast
                </p>
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  {show.cast.join(", ")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ══ SEASONS ═══════════════════════════════════ */}
        {show.seasons?.length > 0 && (
          <div className="mt-10 mb-16">
            <h2 className="font-extrabold tracking-tight text-gray-900 text-lg sm:text-xl mb-4">
              Seasons
            </h2>
            <div className="space-y-2.5">
              {show.seasons.map((s) => (
                <div
                  key={s.seasonNumber}
                  className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl px-4 py-3.5 transition-colors hover:border-gray-200 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "rgba(240,84,92,0.1)" }}
                    >
                      <Tv size={15} style={{ color: ACCENT }} />
                    </div>
                    <span className="text-[14px] font-semibold text-gray-800 truncate">
                      Season {s.seasonNumber}
                    </span>
                  </div>
                  <span className="text-[12px] text-gray-500 flex-shrink-0">
                    {s.episodeCount} episode{s.episodeCount !== 1 ? "s" : ""}
                    {s.releaseDate && ` • ${new Date(s.releaseDate).getFullYear()}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}