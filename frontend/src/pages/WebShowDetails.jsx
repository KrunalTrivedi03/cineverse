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
  Sparkles,
} from "lucide-react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BottomNav from "../components/BottomNav";

const ACCENT = "#f0545c";

/** Turns a YouTube/Vimeo watch link into an embeddable iframe URL. */
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close trailer"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
      >
        <X size={20} />
      </button>

      <div
        className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10"
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
            <Film size={36} className="text-gray-500" />
            <p className="text-gray-300 text-sm">
              This trailer cannot be played inline.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold px-6 py-2.5 rounded-full text-white shadow-md shadow-[#f0545c]/30"
              style={{ backgroundColor: ACCENT }}
            >
              Open Trailer in New Tab
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Navbar />
      <BottomNav />
      <div className="relative w-full h-[38vh] sm:h-[50vh] bg-gray-900 animate-pulse" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-20 relative">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-36 sm:w-56 aspect-[2/3] rounded-2xl bg-gray-200 animate-pulse flex-shrink-0 border-4 border-white shadow-xl" />
          <div className="flex-1 pt-4 sm:pt-24 space-y-3">
            <div className="h-8 w-2/3 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-4 w-1/2 rounded-md bg-gray-200 animate-pulse" />
            <div className="h-20 w-full rounded-xl bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SimilarShowCard({ show, onOpen }) {
  return (
    <div
      className="group flex-shrink-0 w-[140px] sm:w-[170px] cursor-pointer"
      onClick={() => onOpen(show._id)}
    >
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-gray-900 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
        <img
          src={show.poster}
          alt={show.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/10">
          <Star size={10} fill={ACCENT} stroke={ACCENT} />
          <span className="text-[11px] font-bold text-white">{show.rating}</span>
        </div>
      </div>
      <p className="text-[13px] font-bold text-gray-900 mt-2 truncate group-hover:text-[#f0545c] transition-colors">
        {show.title}
      </p>
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
      <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <Navbar />
        <BottomNav />
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-red-50 text-[#f0545c] flex items-center justify-center">
            <AlertCircle size={32} />
          </div>
          <p className="text-gray-700 text-[16px] font-bold">{error || "Web show could not be found."}</p>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[13px] font-bold px-6 py-3 rounded-2xl text-white shadow-md shadow-[#f0545c]/25 hover:bg-[#e0454d] transition-all cursor-pointer"
            style={{ backgroundColor: ACCENT }}
          >
            <ArrowLeft size={15} /> Return to Listing
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Navbar />
      <BottomNav />

      {/* Cinematic Hero Backdrop */}
      <div className="relative w-full h-[40vh] sm:h-[54vh] overflow-hidden bg-[#0c0d12]">
        <img
          src={backdropSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50"
        />
        <img
          src={backdropSrc}
          alt={show.title}
          onLoad={() => setBgLoaded(true)}
          className={`absolute inset-0 w-full h-full object-contain object-center transition-opacity duration-700 ${
            bgLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* Cinematic gradient fade */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#f8fafc] via-[#0c0d12]/40 to-[#0c0d12]/60"
        />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-5 left-5 flex items-center gap-2 text-white bg-black/50 backdrop-blur-md hover:bg-black/70 border border-white/10 rounded-2xl px-4 py-2 text-[13px] font-bold transition-all cursor-pointer"
        >
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-24 sm:-mt-32 relative z-20 pb-16">
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
          {/* Main Poster Card */}
          <div className="w-36 sm:w-56 rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-gray-900 flex-shrink-0 self-start">
            <img
              src={show.poster}
              alt={show.title}
              className="w-full aspect-[2/3] object-cover"
            />
          </div>

          {/* Details Column */}
          <div className="flex-1 pt-1 sm:pt-20 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-flex items-center gap-1 text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full bg-red-50 text-[#f0545c]"
              >
                <Sparkles size={11} />
                {show.category === "trending-series" ? "Trending Series" : "Web Original"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-gray-900 leading-tight">
              {show.title}
            </h1>

            {/* Quick Meta Stats */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-[13px] text-gray-600 font-medium">
              <span
                className="flex items-center gap-1 font-extrabold px-2.5 py-1 rounded-lg bg-red-50 text-[#f0545c]"
              >
                <Star size={13} fill={ACCENT} stroke={ACCENT} />
                <span>{show.rating}</span>
                <span className="font-semibold opacity-60">/10</span>
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

            {/* Genres */}
            {show.genre?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3.5">
                {show.genre.map((g) => (
                  <span
                    key={g}
                    className="text-[11px] font-bold px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700 shadow-2xs"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              {show.streamingUrl && (
                <a
                  href={show.streamingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 font-black px-6 py-3.5 rounded-2xl text-white shadow-lg shadow-[#f0545c]/30 hover:bg-[#e0454d] transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: ACCENT }}
                >
                  <Play size={16} fill="white" />
                  <span>Watch Now</span>
                </a>
              )}
              {show.trailerUrl && (
                <button
                  type="button"
                  onClick={() => setTrailerOpen(true)}
                  className="flex items-center justify-center gap-2 font-bold px-6 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                >
                  <Film size={16} />
                  <span>Watch Trailer</span>
                </button>
              )}
            </div>

            {/* Overview */}
            {show.description && (
              <div className="mt-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                <h2 className="text-[11px] font-extrabold tracking-wider uppercase text-gray-400 mb-2">
                  Storyline
                </h2>
                <p className="text-gray-700 text-[14px] leading-relaxed font-normal">{show.description}</p>
              </div>
            )}

            {/* Cast */}
            {show.cast?.length > 0 && (
              <div className="mt-6">
                <h2 className="text-[11px] font-extrabold tracking-wider uppercase text-gray-400 mb-2.5 flex items-center gap-1.5">
                  <Users size={13} /> Starring Cast
                </h2>
                <div className="flex flex-wrap gap-2">
                  {show.cast.map((actor) => (
                    <span
                      key={actor}
                      className="text-[12px] font-bold px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-800 shadow-2xs"
                    >
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seasons */}
        {show.seasons?.length > 0 && (
          <div className="mt-12">
            <h2 className="font-black tracking-tight text-gray-900 text-xl sm:text-2xl mb-4">
              All Seasons
            </h2>
            <div className="space-y-3">
              {show.seasons.map((s) => (
                <div
                  key={s.seasonNumber}
                  className="flex items-center justify-between gap-3 bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-xs hover:border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center bg-red-50 text-[#f0545c]"
                    >
                      <Tv size={18} />
                    </div>
                    <div>
                      <span className="text-[15px] font-black text-gray-900">
                        Season {s.seasonNumber}
                      </span>
                      {s.releaseDate && (
                        <p className="text-[12px] text-gray-400 font-medium">
                          Premiered {new Date(s.releaseDate).getFullYear()}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[12px] font-extrabold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1 rounded-xl flex-shrink-0">
                    {s.episodeCount} episode{s.episodeCount !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* More Like This */}
        {similar.length > 0 && (
          <div className="mt-14">
            <h2 className="font-black tracking-tight text-gray-900 text-xl sm:text-2xl mb-4">
              More Series Like This
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
              {similar.map((s) => (
                <SimilarShowCard key={s._id} show={s} onOpen={handleOpenSimilar} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />

      {trailerOpen && (
        <TrailerModal url={show.trailerUrl} title={show.title} onClose={() => setTrailerOpen(false)} />
      )}
    </div>
  );
}
