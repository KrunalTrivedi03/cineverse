// src/pages/ArtistDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Instagram, Twitter, Facebook, Youtube, Globe, Route } from "lucide-react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import EventCard from "../components/EventCard";
import { IMG } from "../utils/eventHelpers";
import BottomNav from "../components/BottomNav";

const SOCIAL_ICON = { instagram: Instagram, twitter: Twitter, facebook: Facebook, youtube: Youtube, website: Globe };

export default function ArtistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [artist, setArtist] = useState(null);
  const [events, setEvents] = useState([]);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/artists/${id}`),
      api.get(`/events/artist/${id}`),
      api.get(`/tours/artist/${id}`),
    ])
      .then(([a, e, t]) => { setArtist(a.data); setEvents(e.data); setTours(t.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-2.5 h-2.5 rounded-full bg-[#f0545c] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );

  if (!artist) return null;

  return (
    <div className="min-h-screen" style={{ background: "#f7f7f8", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>
      <Navbar />

      <BottomNav />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-3">
          <button onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 mb-4">
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-5 pb-6">
            <div style={{
              width: 96, height: 96, borderRadius: "50%", overflow: "hidden",
              flexShrink: 0, background: "#eee", boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}>
              {artist.image ? (
                <img src={IMG(artist.image)} alt={artist.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, color: "#bbb" }}>
                  {artist.name?.[0]}
                </div>
              )}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111" }}>{artist.name}</h1>
              {artist.genres?.length > 0 && (
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>{artist.genres.join(" · ")}</p>
              )}
              {artist.socialLinks && (
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  {Object.entries(artist.socialLinks).map(([key, url]) => {
                    if (!url) return null;
                    const Icon = SOCIAL_ICON[key] || Globe;
                    return (
                      <a key={key} href={url} target="_blank" rel="noreferrer"
                        style={{
                          width: 28, height: 28, borderRadius: "50%", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          background: "rgba(240,84,92,0.08)", color: "#f0545c",
                        }}>
                        <Icon size={13} />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
        {artist.bio && (
          <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.7, marginBottom: 28 }}>{artist.bio}</p>
        )}

        {tours.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: "#111" }}>
              On Tour
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tours.map((t) => (
                <div key={t._id} onClick={() => navigate(`/tours/${t._id}`)}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  style={{
                    display: "flex", alignItems: "center", gap: 12, background: "#fff",
                    border: "1px solid #eee", borderRadius: 14, padding: "12px 14px",
                  }}>
                  {t.poster ? (
                    <img src={IMG(t.poster)} alt={t.title} style={{ width: 52, height: 38, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 52, height: 38, borderRadius: 8, background: "rgba(240,84,92,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Route size={16} color="#f0545c" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate" style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{t.title}</p>
                    <p className="truncate" style={{ fontSize: 11, color: "#9ca3af" }}>
                      {(t.cities || []).slice(0, 3).join(" · ") || "Cities announced soon"}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#f0545c", flexShrink: 0 }}>{t.legCount || 0} stops</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: "#111" }}>
          Events with {artist.name}
        </h2>
        {events.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>No upcoming events right now.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
            {events.map((ev) => <EventCard key={ev._id} event={ev} width="100%" />)}
          </div>
        )}
      </div>
    </div>
  );
}