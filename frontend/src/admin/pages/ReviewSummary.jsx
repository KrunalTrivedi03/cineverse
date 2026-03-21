import { useEffect, useState } from "react";
import axiosAdmin from "../../api/axiosAdmin";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";
import {
  ArrowLeft,
  Star,
  Calendar,
  Tag,
  Users,
  UserCog,
  Clapperboard,
  Film,
  Play,
  Image,
  Globe,
  Clock,
  Shield,
  Radio,
  Tv,
  MonitorPlay,
  LayoutGrid,
  MapPin,
} from "lucide-react";

const getYoutubeId = (url) => {
  if (!url) return "";
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  return match ? match[1] : "";
};

/* ── Status Badge ────────────────────────────────────── */
const STATUS_STYLES = {
  upcoming:  { bg: "rgba(99,102,241,0.08)",  color: "#6366f1", border: "rgba(99,102,241,0.2)"  },
  released:  { bg: "rgba(16,185,129,0.08)",  color: "#059669", border: "rgba(16,185,129,0.2)"  },
  streaming: { bg: "rgba(245,158,11,0.08)",  color: "#b45309", border: "rgba(245,158,11,0.2)"  },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.upcoming;
  return (
    <span
      className="text-[11px] font-semibold px-3 py-1 rounded-full border capitalize flex items-center gap-1.5"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      <Radio size={10} /> {status}
    </span>
  );
}

/* ── Info Pill (reusable badge) ──────────────────────── */
function InfoPill({ icon: Icon, children, bg, color, border }) {
  return (
    <span
      className="text-[11px] font-semibold px-3 py-1 rounded-full border flex items-center gap-1.5"
      style={{ background: bg, color, borderColor: border }}
    >
      {Icon && <Icon size={10} />}
      {children}
    </span>
  );
}

/* ── Release Info Grid ───────────────────────────────── */
function ReleaseInfoCard({ movie }) {
  const hasAny =
    movie.language || movie.duration || movie.certificate ||
    movie.status   || movie.isInCinemas || movie.ottPlatform ||
    movie.formats?.length || movie.cities?.length;;

  if (!hasAny) return null;

  const stats = [
    movie.language    && { icon: Globe,      label: "Language",    value: movie.language },
    movie.duration    && { icon: Clock,      label: "Duration",    value: `${movie.duration} min` },
    movie.certificate && { icon: Shield,     label: "Certificate", value: movie.certificate },
    movie.status      && { icon: Radio,      label: "Status",      value: movie.status, capitalize: true },
    movie.isInCinemas != null && {
      icon: Tv, label: "In Cinemas",
      value: movie.isInCinemas ? "Yes" : "No",
      valueColor: movie.isInCinemas ? "#059669" : "#6b7280",
    },
    movie.status === "streaming" && movie.ottPlatform && {
      icon: MonitorPlay, label: "OTT Platform", value: movie.ottPlatform,
    },
  ].filter(Boolean);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(240,84,92,0.09)" }}
        >
          <Radio size={16} style={{ color: "#f0545c" }} />
        </div>
        <h3 className="text-[15px] font-bold text-gray-900">
          Release Information
        </h3>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-5">
          {stats.map(({ icon: Icon, label, value, capitalize, valueColor }) => (
            <div key={label} className="space-y-1">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Icon size={10} /> {label}
              </p>
              <p
                className={`text-[14px] font-semibold ${capitalize ? "capitalize" : ""}`}
                style={{ color: valueColor || "#111827" }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {movie.formats?.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-gray-50">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <LayoutGrid size={10} /> Available Formats
            </p>
            <div className="flex flex-wrap gap-2">
              {movie.formats.map((fmt) => (
                <span
                  key={fmt}
                  className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border"
                  style={{
                    background: "rgba(240,84,92,0.08)",
                    color: "#f0545c",
                    borderColor: "rgba(240,84,92,0.25)",
                  }}
                >
                  {fmt}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Cities */}
        {movie.cities?.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-gray-50">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <MapPin size={10} /> Available Cities
            </p>
            <div className="flex flex-wrap gap-2">
              {movie.cities.map((city) => (
                <span
                  key={city}
                  className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border"
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    color: "#6366f1",
                    borderColor: "rgba(99,102,241,0.2)",
                  }}
                >
                  {city}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PersonCard({ person, subtitle, baseUrl }) {
  const imgSrc   = person.image ? `${baseUrl}${person.image}` : null;
  const initials = person.name?.slice(0, 2).toUpperCase() || "?";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc} alt={person.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: "#f0545c", opacity: 0.4 }}>
              {initials}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="px-3 py-3">
        <p className="text-[13px] font-semibold text-gray-900 truncate">{person.name}</p>
        <p className="text-[11px] text-gray-400 mt-0.5 truncate">{subtitle}</p>
      </div>
    </div>
  );
}

/* ── Section Header ──────────────────────────────────── */
function SectionHeader({ icon: Icon, title, count }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(240,84,92,0.09)" }}>
          <Icon size={16} style={{ color: "#f0545c" }} />
        </div>
        <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
      </div>
      {count != null && (
        <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
          style={{ background: "rgba(240,84,92,0.08)", color: "#f0545c" }}>
          {count}
        </span>
      )}
    </div>
  );
}

/* ── Skeleton ────────────────────────────────────────── */
function Skeleton() {
  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-8" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gray-200 animate-pulse" />
          <div className="h-6 w-64 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex gap-6">
              <div className="w-36 h-52 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-3 pt-2">
                <div className="h-6 w-48 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                <div className="flex gap-2 mt-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-7 w-20 bg-gray-100 rounded-full animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Release info skeleton */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl overflow-hidden">
                  <div className="aspect-[3/4] bg-gray-100 animate-pulse" />
                  <div className="p-3 space-y-1.5">
                    <div className="h-3.5 w-20 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-14 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

/* ── Main Component ───────────────────────────────────── */
export default function ReviewSummary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);

  const BASE_URL = "http://localhost:5000";

  useEffect(() => {
    const loadMovie = async () => {
      try {
        const res = await axiosAdmin.get(`/admin/movies/${id}`);
        setMovie(res.data);
      } catch (err) {
        console.error("Failed to load movie", err);
      }
    };
    loadMovie();
  }, [id]);

  if (!movie) return <Skeleton />;

  const youtubeId = getYoutubeId(movie.trailerLink);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-8" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all flex-shrink-0"
          >
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight leading-tight">
              {movie.title}
            </h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Movie review & details</p>
          </div>
        </div>

        <div className="space-y-5">

          {/* ── Movie Details Card ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(240,84,92,0.09)" }}>
                <Film size={16} style={{ color: "#f0545c" }} />
              </div>
              <h3 className="text-[15px] font-bold text-gray-900">Movie Details</h3>
            </div>

            <div className="p-6 flex gap-6">
              {/* Poster */}
              <div className="w-36 h-52 rounded-xl overflow-hidden border border-gray-100 shadow-sm flex-shrink-0 bg-gray-50 flex items-center justify-center">
                {movie.poster ? (
                  <img src={`${BASE_URL}${movie.poster}`} alt={movie.title}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-300">
                    <Image size={24} />
                    <span className="text-[11px]">No Poster</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-3 pt-1">
                <h2 className="text-[20px] font-bold text-gray-900 leading-tight">{movie.title}</h2>
                <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-4">
                  {movie.description || <span className="italic text-gray-300">No description provided.</span>}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {movie.genre && (
                    <InfoPill icon={Tag}
                      bg="rgba(99,102,241,0.08)" color="#6366f1" border="rgba(99,102,241,0.2)">
                      {movie.genre}
                    </InfoPill>
                  )}
                  {movie.rating != null && (
                    <InfoPill icon={Star}
                      bg="rgba(245,158,11,0.08)" color="#b45309" border="rgba(245,158,11,0.2)">
                      {movie.rating} / 10
                    </InfoPill>
                  )}
                  {movie.releaseDate && (
                    <InfoPill icon={Calendar}
                      bg="rgba(16,185,129,0.08)" color="#059669" border="rgba(16,185,129,0.2)">
                      {movie.releaseDate?.slice(0, 10)}
                    </InfoPill>
                  )}
                  {movie.status && <StatusBadge status={movie.status} />}
                  {movie.isInCinemas && (
                    <InfoPill icon={Tv}
                      bg="rgba(239,68,68,0.08)" color="#dc2626" border="rgba(239,68,68,0.2)">
                      In Cinemas
                    </InfoPill>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Release Information Card ── */}
          <ReleaseInfoCard movie={movie} />

          {/* ── Cast & Crew side-by-side ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Cast */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <SectionHeader icon={Users} title="Cast Members" count={movie.cast?.length ?? 0} />
              </div>
              <div className="p-5">
                {!movie.cast?.length ? (
                  <div className="text-center py-10 text-gray-400">
                    <Users size={28} className="mx-auto mb-2 opacity-25" />
                    <p className="text-[13px] font-semibold">No cast added</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {movie.cast.map((c, i) => (
                      <PersonCard key={i} person={c} subtitle={c.role} baseUrl={BASE_URL} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <SectionHeader icon={UserCog} title="Crew Members" count={movie.crew?.length ?? 0} />
              </div>
              <div className="p-5">
                {!movie.crew?.length ? (
                  <div className="text-center py-10 text-gray-400">
                    <UserCog size={28} className="mx-auto mb-2 opacity-25" />
                    <p className="text-[13px] font-semibold">No crew added</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {movie.crew.map((c, i) => (
                      <PersonCard key={i} person={c} subtitle={c.position} baseUrl={BASE_URL} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {movie.trailerLink && youtubeId && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(240,84,92,0.09)" }}>
                  <Clapperboard size={16} style={{ color: "#f0545c" }} />
                </div>
                <h3 className="text-[15px] font-bold text-gray-900">Trailer</h3>
              </div>
              <div className="p-5">
                <div className="relative rounded-xl overflow-hidden cursor-pointer group"
                  onClick={() => setShowTrailer(true)}>
                  <img
                    src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                    alt="trailer thumbnail"
                    className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                      <Play size={20} className="text-gray-900 ml-1" />
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full text-white"
                    style={{ background: "#f0545c" }}>
                    Official Trailer
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {showTrailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowTrailer(false)}>
          <div className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 bg-gray-900">
              <span className="text-[13px] font-semibold text-white">{movie.title} — Trailer</span>
              <button onClick={() => setShowTrailer(false)}
                className="text-gray-400 hover:text-white text-xl leading-none">×</button>
            </div>
            <iframe
              className="w-full aspect-video"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}