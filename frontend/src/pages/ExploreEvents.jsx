// src/pages/ExploreEvents.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Music2, Moon, Mic2, Building, Drama, GraduationCap, Trophy } from "lucide-react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import EventRow from "../components/EventRow";
import EventCard from "../components/EventCard";
import DistrictSelector, { getSelectedDistrict } from "../components/DistrictSelector";
import { EVENT_CATEGORIES } from "../utils/eventHelpers";

const CATEGORY_ICON = {
  Music: Music2, Nightlife: Moon, "Comedy Shows": Mic2,
  Expos: Building, Performances: Drama, Workshops: GraduationCap, Sports: Trophy,
};

export default function ExploreEvents() {
  const navigate = useNavigate();

  const [trending,    setTrending]    = useState([]);
  const [popular,     setPopular]     = useState([]);
  const [upcoming,    setUpcoming]    = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [byDistrict,  setByDistrict]  = useState([]);
  const [artists,     setArtists]     = useState([]);

  const [district, setDistrict] = useState(getSelectedDistrict());
  const [loading,  setLoading]  = useState(true);

  const [searchQuery,  setSearchQuery]  = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [t, p, u, r, a] = await Promise.all([
        api.get("/events/trending"),
        api.get("/events/popular"),
        api.get("/events/upcoming"),
        api.get("/events/recommended"),
        api.get("/artists", { params: { featured: true } }),
      ]);
      setTrending(t.data);
      setPopular(p.data);
      setUpcoming(u.data);
      setRecommended(r.data);
      setArtists(a.data.slice(0, 10));
    } catch {
      /* silent — sections just render empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const d = getSelectedDistrict();
    setDistrict(d);
    if (!d.id) { setByDistrict([]); return; }
    api.get(`/events/district/${d.id}`).then((r) => setByDistrict(r.data)).catch(() => setByDistrict([]));
  }, []);

  useEffect(() => {
    const handler = () => {
      const d = getSelectedDistrict();
      setDistrict(d);
      if (!d.id) { setByDistrict([]); return; }
      api.get(`/events/district/${d.id}`).then((r) => setByDistrict(r.data)).catch(() => setByDistrict([]));
    };
    window.addEventListener("districtChanged", handler);
    return () => window.removeEventListener("districtChanged", handler);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    setSearching(true);
    const t = setTimeout(() => {
      api.get("/events/search", { params: { q: searchQuery } })
        .then((r) => setSearchResults(r.data))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  return (
    <div className="min-h-screen" style={{ background: "#f7f7f8", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>
      <Navbar />

      {/* Header bar */}
      <div className="bg-white border-b border-gray-200 sticky top-[60px] z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center gap-3 flex-wrap">
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111", flexShrink: 0 }}>Events</h1>

          <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, artists, venues…"
              className="flex-1 bg-transparent text-[13px] text-gray-800 outline-none placeholder-gray-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X size={13} className="text-gray-400" />
              </button>
            )}
          </div>

          <DistrictSelector compact />
        </div>

        {/* Category pills — quick-jump shortcut, kept sticky at top */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 pb-3 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {EVENT_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICON[cat] || Music2;
            return (
              <button
                key={cat}
                onClick={() => navigate(`/events/category/${encodeURIComponent(cat)}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                  padding: "7px 14px", borderRadius: 20,
                  border: "1.5px solid #e5e7eb", background: "#fff",
                  fontSize: 12, fontWeight: 700, color: "#374151", cursor: "pointer",
                }}
              >
                <Icon size={13} color="#f0545c" /> {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">

        {/* ── Search results override ── */}
        {searchQuery.trim() ? (
          <section>
            <h2 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 800, color: "#111" }}>
              {searching ? "Searching…" : `Results for "${searchQuery}"`}
            </h2>
            {!searching && searchResults?.length === 0 && (
              <p style={{ fontSize: 13, color: "#9ca3af" }}>No events found. Try a different search.</p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
              {(searchResults || []).map((ev) => <EventCard key={ev._id} event={ev} width="100%" />)}
            </div>
          </section>
        ) : (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-2.5 h-2.5 rounded-full bg-[#f0545c] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* ── Browse by Category — now first ── */}
                <section style={{ marginBottom: 32 }}>
                  <h2 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 800, color: "#111" }}>Browse by Category</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                    {EVENT_CATEGORIES.map((cat) => {
                      const Icon = CATEGORY_ICON[cat] || Music2;
                      return (
                        <div
                          key={cat}
                          onClick={() => navigate(`/events/category/${encodeURIComponent(cat)}`)}
                          style={{
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                            padding: "20px 10px", borderRadius: 16, background: "#fff",
                            border: "1px solid #eee", cursor: "pointer",
                            transition: "transform 0.15s ease, box-shadow 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.08)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(240,84,92,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon size={18} color="#f0545c" />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", textAlign: "center" }}>{cat}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* ── Trending — next, highest-signal row ── */}
                <EventRow title="Trending Events" events={trending} seeAllPath="/events/category/Music" />

                {/* ── Artists to Watch — right after Trending ── */}
                {artists.length > 0 && (
                  <section style={{ marginBottom: 28 }}>
                    <h2 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 800, color: "#111" }}>Artists to Watch</h2>
                    <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" }}>
                      {artists.map((a) => (
                        <div
                          key={a._id}
                          onClick={() => navigate(`/artists/${a._id}`)}
                          style={{ flexShrink: 0, width: 84, textAlign: "center", cursor: "pointer" }}
                        >
                          <div style={{
                            width: 72, height: 72, borderRadius: "50%", overflow: "hidden",
                            margin: "0 auto 6px", background: "#eee", border: "2px solid #fff",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                          }}>
                            {a.image ? (
                              <img src={a.image.startsWith("http") ? a.image : `https://res.cloudinary.com/duhc0vvqz/image/upload${a.image}`}
                                alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#bbb" }}>
                                {a.name?.[0]}
                              </div>
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#374151" }} className="line-clamp-1">{a.name}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* ── District row ── */}
                {district.id && (
                  <EventRow
                    title={`Happening in ${district.name}`}
                    events={byDistrict}
                    seeAllPath={`/events/district/${district.id}`}
                    emptyText={`No events found in ${district.name} yet.`}
                  />
                )}

                {/* ── Remaining algorithmic rows ── */}
                <EventRow title="Recommended For You" events={recommended} />
                <EventRow title="Popular Right Now"   events={popular} />
                <EventRow title="Upcoming Events"     events={upcoming} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}