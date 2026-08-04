import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  Play,
  ArrowLeft,
  Calendar,
  Tv,
  Film,
  Layers,
  AlertCircle,
  X,
  Users,
} from "lucide-react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BottomNav from "../components/BottomNav";

const ACCENT = "#f0545c";

/** Turns a YouTube/Vimeo watch link into an embeddable iframe URL.
 *  Returns null for anything else (e.g. direct .mp4 files), which the
 *  player falls back to rendering with a native <video> tag instead. */
function getEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname.startsWith("/embed/")) {
        return `https://www.youtube.com${u.pathname}?autoplay=1&rel=0`;
      }
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function isDirectVideoFile(url) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url || "");
}

function TrailerModal({ url, title, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const embedUrl = getEmbedUrl(url);
  const playableDirectly = !embedUrl && isDirectVideoFile(url);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-3 sm:p-6"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close trailer"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X size={18} />
      </button>

      <div
        className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={`${title} trailer`}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : playableDirectly ? (
          <video
            src={url}
            controls
            autoPlay
            className="w-full h-full"
            title={`${title} trailer`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center px-6">
            <Film size={32} className="text-gray-500" />
            <p className="text-gray-300 text-sm">
              This trailer can't be played inline.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold px-4 py-2 rounded-full text-white"
              style={{ backgroundColor: ACCENT }}
            >
              Open trailer link
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

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

function SimilarShowCard({ show, onOpen }) {
  return (
    <div
      className="group flex-shrink-0 w-[130px] sm:w-[170px] cursor-pointer"
      onClick={() => onOpen(show._id)}
    >
      <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-gray-900">
        <img
          src={show.poster}
          alt={show.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5">
          <Star size={9} fill={ACCENT} stroke={ACCENT} />
          <span className="text-[10px] font-semibold text-white">{show.rating}</span>
        </div>
      </div>
      <p className="text-[12px] font-semibold text-gray-800 mt-1.5 truncate">{show.title}</p>
    </div>
  );
}

export default function WebShowDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const fetchShow = async () => {
      setLoading(true);
      setError(null);
      setBgLoaded(false);
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
    window.scrollTo({ top: 0 });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Pull a few more titles from the same category to round out the page.
  useEffect(() => {
    if (!show?.category) return;
    let cancelled = false;
    api
      .get(`/web-shows?category=${show.category}`)
      .then((res) => {
        if (!cancelled) setSimilar(res.data.filter((s) => s._id !== show._id).slice(0, 8));
      })
      .catch(() => !cancelled && setSimilar([]));
    return () => {
      cancelled = true;
    };
  }, [show?.category, show?._id]);

  const handleOpenSimilar = useCallback(
    (showId) => {
      setSimilar([]);
      navigate(`/web-shows/${showId}`);
    },
    [navigate]
  );

  const backdropSrc = show?.banner || show?.poster;

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

      {/* ══ BACKDROP ════════════════════════════════════
          Show posters are portrait (2:3) but this banner is a wide strip,
          so a plain object-cover crops in tight on faces. Instead we layer
          a blurred, fully-covering copy behind a sharp, uncropped
          object-contain copy — the same "letterboxed hero" pattern
          streaming apps use when only a poster (not a wide banner) is
          available. Real 16:9 banners still render edge-to-edge on top. */}
      <div className="relative w-full h-[38vh] sm:h-[52vh] overflow-hidden bg-[#111]">
        <img
          src={backdropSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60"
        />
        <img
          src={backdropSrc}
          alt={show.title}
          onLoad={() => setBgLoaded(true)}
          className={`absolute inset-0 w-full h-full object-contain object-center transition-opacity duration-700 ${
            bgLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 30%, rgba(255,255,255,0.6) 80%, #fff 100%)",
          }}
        />

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
              <span
                className="flex items-center gap-1 font-bold px-2 py-0.5 rounded-md"
                style={{ backgroundColor: "rgba(240,84,92,0.1)", color: ACCENT }}
              >
                <Star size={13} fill={ACCENT} stroke={ACCENT} />
                {show.rating}
                <span className="font-medium opacity-60">/10</span>
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
              {show.seasons?.length > 0 && (
                <span className="flex items-center gap-1">
                  <Tv size={14} className="text-gray-400" />
                  {show.seasons.reduce((sum, s) => sum + (s.episodeCount || 0), 0)} Episodes
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
                <button
                  onClick={() => setTrailerOpen(true)}
                  className="flex items-center justify-center gap-2 font-semibold px-5 py-2.5 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                >
                  <Film size={16} /> Watch Trailer
                </button>
              )}
            </div>

            {show.description && (
              <div className="mt-6">
                <h2 className="text-[11px] font-bold tracking-wide uppercase text-gray-400 mb-1.5">
                  Overview
                </h2>
                <p className="text-gray-700 text-[13.5px] leading-relaxed">{show.description}</p>
              </div>
            )}

            {show.cast?.length > 0 && (
              <div className="mt-5">
                <h2 className="text-[11px] font-bold tracking-wide uppercase text-gray-400 mb-2 flex items-center gap-1.5">
                  <Users size={12} /> Cast
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {show.cast.map((actor) => (
                    <span
                      key={actor}
                      className="text-[12px] font-medium px-2.5 py-1 rounded-full border border-gray-200 text-gray-700"
                    >
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══ SEASONS ═══════════════════════════════════ */}
        {show.seasons?.length > 0 && (
          <div className="mt-10">
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

      {/* ══ MORE LIKE THIS ══════════════════════════════ */}
      {similar.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-12 mb-16">
          <h2 className="font-extrabold tracking-tight text-gray-900 text-lg sm:text-xl mb-4">
            More Like This
          </h2>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {similar.map((s) => (
              <SimilarShowCard key={s._id} show={s} onOpen={handleOpenSimilar} />
            ))}
          </div>
        </div>
      )}

      <Footer />

      {trailerOpen && (
        <TrailerModal url={show.trailerUrl} title={show.title} onClose={() => setTrailerOpen(false)} />
      )}
    </div>
  );
}