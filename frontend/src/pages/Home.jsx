import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import LatestMovies from "../components/LatestMovies";
import ComingSoon from "../components/ComingSoon";
import Footer from "../components/Footer";
import api from "../api/axiosInstance";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

import {
  X,
  Play,
  Clock,
  CalendarDays,
  Film,
  Globe,
  ShieldCheck,
  Ticket,
} from "lucide-react";

/* ─── Helpers ─────────────────────────────────────────── */
const IMG = (path) => `http://localhost:5000${path}`;

const isReleased = (dateStr) => {
  if (!dateStr) return true;
  return new Date(dateStr) <= new Date();
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getYoutubeEmbed = (url) => {
  const reg = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/;
  const match = url?.match(reg);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;
};

/* ─── Home ────────────────────────────────────────────── */
export default function Home() {
  const [slides, setSlides]       = useState([]);
  const [trailerUrl, setTrailerUrl] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading]     = useState(true);
  const swiperRef = useRef(null);

  /* Fetch top 3 (last 3) movies for the hero banner */
  useEffect(() => {
    api.get("/movies")
      .then((res) => {
        const top3 = res.data.slice(-3).reverse();
        setSlides(
          top3.map((m) => ({
            id: m._id,
            title: m.title,
            tag: isReleased(m.releaseDate) ? "Now Showing" : "Coming Soon",
            duration: m.runtime || "",
            cert: m.certificate || "",
            date: formatDate(m.releaseDate),
            genres: m.genre || "",
            lang: m.language || "",
            released: isReleased(m.releaseDate),
            description: m.description || "",
            poster: IMG(m.poster),
            background: IMG(m.poster),
            trailer: getYoutubeEmbed(m.trailerLink),
          }))
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openTrailer = (url) => url && setTrailerUrl(url);
  const closeTrailer = () => setTrailerUrl(null);

  useEffect(() => {
    const fn = (e) => e.key === "Escape" && closeTrailer();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f5]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');`}</style>

      <Navbar />

      <div className="relative" style={{ background: "#111" }}>
        {loading ? (
          <div
            className="w-full flex items-center justify-center"
            style={{ height: "clamp(420px, 58vw, 600px)", background: "#1a1a1a" }}
          >
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full animate-bounce"
                  style={{ background: "#f0545c", animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <Swiper
            onSwiper={(s) => (swiperRef.current = s)}
            onSlideChange={(s) => setActiveIdx(s.realIndex)}
            modules={[Autoplay, EffectFade]}
            effect="fade"
            autoplay={{ delay: 5500, disableOnInteraction: false }}
            loop={slides.length > 1}
            speed={900}
            className="w-full"
            style={{ height: "clamp(420px, 58vw, 600px)" }}
          >
            {slides.map((item) => (
              <SwiperSlide key={item.id}>
                <HeroSlide item={item} onPlay={() => openTrailer(item.trailer)} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}

        {/* Dot indicators */}
        {slides.length > 1 && !loading && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => swiperRef.current?.slideToLoop(i)}
                className="transition-all duration-300 rounded-full"
                style={{
                  width: i === activeIdx ? 24 : 8,
                  height: 8,
                  background: i === activeIdx ? "#f0545c" : "rgba(255,255,255,0.35)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ══ LIGHT CONTENT ═════════════════════════════════ */}
      <div className="bg-white">
        <LatestMovies />
        <ComingSoon />
      </div>

      {/* ══ FOOTER ════════════════════════════════════════ */}
      <Footer />

      {/* ══ TRAILER MODAL ═════════════════════════════════ */}
      {trailerUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)" }}
          onClick={closeTrailer}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "scaleUp 0.22s cubic-bezier(.4,0,.2,1) both" }}
          >
            <button
              onClick={closeTrailer}
              className="absolute -top-11 right-0 flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors"
            >
              <X size={15} /> Close
            </button>
            <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <iframe
                width="100%"
                className="aspect-video block"
                src={trailerUrl}
                title="Trailer"
                allow="autoplay; fullscreen; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
          <style>{`
            @keyframes scaleUp {
              from { opacity: 0; transform: scale(0.93); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

/* ─── Single Hero Slide ───────────────────────────────── */
function HeroSlide({ item, onPlay }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${item.background})`,
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
          filter: "blur(0px) brightness(0.22) saturate(1.3)",
          transform: "scale(1.07)",
        }}
      />

      {/* Left-dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.65) 42%, rgba(8,8,8,0.1) 100%)",
        }}
      />

      {/* Bottom bleed into page */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: 80, background: "linear-gradient(to bottom, transparent, #f5f5f5)" }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center px-8 md:px-16 max-w-6xl mx-auto">
        <div className="flex items-center gap-10 md:gap-16 w-full">

          {/* Left: text */}
          <div className="flex-1 min-w-0 text-white">
            {/* Tag pill */}
            <span
              className="inline-block text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
              style={{
                background: item.released ? "rgba(240,84,92,0.2)" : "rgba(251,146,60,0.2)",
                color: item.released ? "#f0545c" : "#fb923c",
                border: `1px solid ${item.released ? "rgba(240,84,92,0.35)" : "rgba(251,146,60,0.35)"}`,
              }}
            >
              {item.tag}
            </span>

            <h2
              className="font-black leading-none mb-3 tracking-tight"
              style={{ fontSize: "clamp(28px, 4.5vw, 52px)" }}
            >
              {item.title}
            </h2>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/45 text-[13px] mb-4">
              {item.duration && (
                <span className="flex items-center gap-1"><Clock size={12} /> {item.duration}</span>
              )}
              {item.duration && item.genres && <Dot />}
              {item.genres && (
                <span className="flex items-center gap-1"><Film size={12} /> {item.genres}</span>
              )}
              {item.genres && item.lang && <Dot />}
              {item.lang && (
                <span className="flex items-center gap-1"><Globe size={12} /> {item.lang}</span>
              )}
              {item.lang && item.cert && <Dot />}
              {item.cert && (
                <span className="flex items-center gap-1"><ShieldCheck size={12} /> {item.cert}</span>
              )}
              {item.cert && item.date && <Dot />}
              {item.date && (
                <span className="flex items-center gap-1"><CalendarDays size={12} /> {item.date}</span>
              )}
            </div>

            {item.description && (
              <p
                className="text-white/55 leading-relaxed mb-6 line-clamp-2"
                style={{ maxWidth: 480, fontSize: 14 }}
              >
                {item.description}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {item.released ? (
                <Link
                  to={`/movie/${item.id}`}
                  className="flex items-center gap-2 font-semibold px-7 py-2.5 rounded-xl text-sm text-white transition-all active:scale-95"
                  style={{ background: "#f0545c" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#d94048")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#f0545c")}
                >
                  <Ticket size={15} /> Book Tickets
                </Link>
              ) : (
                <div
                  className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <CalendarDays size={15} className="text-orange-400 flex-shrink-0" />
                  <div>
                    <p className="text-white/35 text-[10px] uppercase tracking-widest font-semibold leading-none mb-0.5">
                      Releasing On
                    </p>
                    <p className="text-white font-semibold text-[13px]">{item.date}</p>
                  </div>
                </div>
              )}

              {item.trailer && (
                <button
                  onClick={onPlay}
                  className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.75)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                >
                  <Play size={14} fill="currentColor" /> Watch Trailer
                </button>
              )}
            </div>
          </div>

          {/* Right: poster */}
          <div className="flex-shrink-0 hidden sm:block">
            <Link
              to={`/movie/${item.id}`}
              className="relative group cursor-pointer block"
              style={{ width: "clamp(140px, 14vw, 200px)" }}
            >
              <img
                src={item.poster}
                alt={item.title}
                className="w-full rounded-2xl shadow-2xl object-cover"
                style={{
                  aspectRatio: "2/3",
                  border: "1px solid rgba(255,255,255,0.1)",
                  transition: "transform 0.3s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              />

              {/* Play overlay */}
              <div
                className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(0,0,0,0.45)" }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", border: "2px solid rgba(255,255,255,0.5)" }}
                >
                  <Play size={20} fill="white" className="text-white ml-0.5" />
                </div>
              </div>

              <div
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg"
                style={{
                  background: item.released ? "rgba(20,20,20,0.9)" : "rgba(234,88,12,0.85)",
                  color: "white",
                  border: item.released ? "1px solid rgba(255,255,255,0.12)" : "none",
                }}
              >
                {item.released ? "In Cinemas" : "Coming Soon"}
              </div>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

function Dot() {
  return <span className="text-white/20 text-[10px]">•</span>;
}