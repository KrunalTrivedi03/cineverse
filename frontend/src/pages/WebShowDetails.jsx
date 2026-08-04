import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Play, ArrowLeft, Calendar, Tv } from "lucide-react";
import api from "../api/axiosInstance";

export default function WebShowDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-sm">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-semibold px-4 py-2 rounded-md text-white"
          style={{ backgroundColor: "#f0545c" }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <div className="relative w-full h-[45vh] sm:h-[55vh] overflow-hidden bg-gray-900">
        <img
          src={show.banner || show.poster}
          alt={show.title}
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center gap-1 text-white bg-black/40 hover:bg-black/60 rounded-full px-3 py-1.5 text-sm"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-24 relative">
        <div className="flex flex-col sm:flex-row gap-6">
          <img
            src={show.poster}
            alt={show.title}
            className="w-40 sm:w-56 rounded-xl shadow-xl border-4 border-white flex-shrink-0"
          />

          <div className="flex-1 pt-4 sm:pt-24">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              {show.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Star size={14} fill="#f0545c" stroke="#f0545c" />
                {show.rating}
              </span>
              {show.releaseYear && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} /> {show.releaseYear}
                </span>
              )}
              {show.seasons?.length > 0 && (
                <span className="flex items-center gap-1">
                  <Tv size={14} /> {show.seasons.length} Season
                  {show.seasons.length > 1 ? "s" : ""}
                </span>
              )}
              <span
                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: "rgba(240,84,92,0.1)", color: "#f0545c" }}
              >
                {show.category === "trending-series"
                  ? "Trending Series"
                  : "Web Original"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {show.genre?.map((g) => (
                <span
                  key={g}
                  className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700"
                >
                  {g}
                </span>
              ))}
            </div>

            <p className="text-gray-700 text-sm leading-relaxed mt-4">
              {show.description}
            </p>

            {show.cast?.length > 0 && (
              <p className="text-sm text-gray-500 mt-3">
                <span className="font-semibold text-gray-700">Cast: </span>
                {show.cast.join(", ")}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              {show.streamingUrl && (
                <a
                  href={show.streamingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-lg text-white"
                  style={{ backgroundColor: "#f0545c" }}
                >
                  <Play size={16} fill="white" /> Watch Now
                </a>
              )}
              {show.trailerUrl && (
                <a
                  href={show.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200"
                >
                  Trailer
                </a>
              )}
            </div>
          </div>
        </div>

        {show.seasons?.length > 0 && (
          <div className="mt-10 mb-16">
            <h2 className="font-extrabold tracking-tight text-gray-900 text-lg mb-3">
              Seasons
            </h2>
            <div className="space-y-2">
              {show.seasons.map((s) => (
                <div
                  key={s.seasonNumber}
                  className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3"
                >
                  <span className="text-sm font-semibold text-gray-800">
                    Season {s.seasonNumber}
                  </span>
                  <span className="text-xs text-gray-500">
                    {s.episodeCount} episodes
                    {s.releaseDate &&
                      ` • ${new Date(s.releaseDate).getFullYear()}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}