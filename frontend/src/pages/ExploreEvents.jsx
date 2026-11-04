import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, X, Music2, Moon, Mic2, Building, Drama, GraduationCap,
  Trophy, ChevronLeft, ChevronRight, Sparkles, Flame,
} from "lucide-react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import EventRow from "../components/EventRow";
import EventCard from "../components/EventCard";
import DistrictSelector, { getSelectedDistrict } from "../components/DistrictSelector";
import { getSelectedCity } from "../components/Navbar";
import { EVENT_CATEGORIES } from "../utils/eventHelpers";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";

const CATEGORY_ICON = {
  Music: Music2, Nightlife: Moon, "Comedy Shows": Mic2,
  Expos: Building, Performances: Drama, Workshops: GraduationCap
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
  const [city,     setCity]     = useState(getSelectedCity());
  const [loading,  setLoading]  = useState(true);

  const [searchQuery,  setSearchQuery]  = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const categoryScrollRef = useRef(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const loc = { city: getSelectedCity().id || undefined, district: getSelectedDistrict().id || undefined };
      const [t, p, u, r, a] = await Promise.all([
        api.get("/events/trending",    { params: loc }),
        api.get("/events/popular",     { params: loc }),
        api.get("/events/upcoming",    { params: loc }),
        api.get("/events/recommended", { params: loc }),
        api.get("/artists", { params: { featured: true } }),
      ]);
      setTrending(t.data);
      setPopular(p.data);
      setUpcoming(u.data);
      setRecommended(r.data);
      setArtists(a.data.slice(0, 10));
    } catch {
      // silent
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
    const handler = () => { setCity(getSelectedCity()); fetchAll(); };
    window.addEventListener("cityChanged", handler);
    return () => window.removeEventListener("cityChanged", handler);
  }, [fetchAll]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    setSearching(true);
    const t = setTimeout(() => {
      api.get("/events/search", { params: { q: searchQuery, city: getSelectedCity().id || undefined, district: getSelectedDistrict().id || undefined } })
        .then((r) => setSearchResults(r.data))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const scrollCategories = (dir) => {
    categoryScrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex flex-col justify-between">
      <div>
        <Navbar />
        <BottomNav />

        {/* Sticky Search & Location Bar */}
        <div className="bg-white/95 backdrop-blur-xl border-b border-gray-100 sticky top-[64px] z-40 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3.5 flex items-center gap-3 flex-wrap">
            <h1 className="text-[20px] font-black text-gray-900 tracking-tight flex-shrink-0">
              Live Events
            </h1>

            <div className="flex-1 min-w-[200px] flex items-center gap-2.5 bg-gray-50 border border-gray-200/90 rounded-2xl px-4 py-2.5 focus-within:bg-white focus-within:border-[#f0545c] transition-all shadow-2xs">
              <Search size={15} className="text-gray-400 flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search live events, musicians, comedians, venues…"
                className="flex-1 bg-transparent text-[13.5px] font-medium text-gray-800 outline-none placeholder-gray-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X size={14} className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            <DistrictSelector compact />
          </div>

          {/* Quick Jump Category Pills */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {EVENT_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICON[cat] || Music2;
              return (
                <button
                  key={cat}
                  onClick={() => navigate(`/events/category/${encodeURIComponent(cat)}`)}
                  className="flex items-center gap-1.5 flex-shrink-0 px-3.5 py-1.5 rounded-full border border-gray-200/90 bg-white hover:border-[#f0545c]/40 hover:bg-[#f0545c]/5 text-[12px] font-bold text-gray-700 transition-all shadow-2xs group"
                >
                  <Icon size={13} className="text-[#f0545c] group-hover:scale-110 transition-transform" />
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-10">

          {/* Search Results */}
          {searchQuery.trim() ? (
            <section>
              <h2 className="text-[20px] font-black text-gray-900 tracking-tight mb-5">
                {searching ? "Searching events…" : `Results for "${searchQuery}"`}
              </h2>
              {!searching && searchResults?.length === 0 && (
                <div className="py-20 text-center bg-white rounded-3xl border border-gray-100 p-8">
                  <p className="text-[15px] font-bold text-gray-500">No events matched your search query.</p>
                  <p className="text-[12.5px] text-gray-400 mt-1">Try another keyword or select a category below.</p>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                {(searchResults || []).map((ev) => <EventCard key={ev._id} event={ev} width="100%" />)}
              </div>
            </section>
          ) : (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-28">
                  <div className="flex gap-2.5">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-3 h-3 rounded-full bg-[#f0545c] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Browse by Category Tiles */}
                  <section className="mb-12">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0545c]/10 text-[#f0545c] text-[11px] font-extrabold uppercase tracking-widest mb-1.5 border border-[#f0545c]/20">
                          <Sparkles size={11} />
                          <span>Curated Experiences</span>
                        </div>
                        <h2 className="text-[20px] sm:text-[24px] font-black text-gray-900 tracking-tight">
                          Explore by Category
                        </h2>
                      </div>

                      <div className="hidden md:flex items-center gap-2">
                        <button
                          onClick={() => scrollCategories(-1)}
                          className="w-9 h-9 rounded-full bg-white border border-gray-200/90 flex items-center justify-center text-gray-600 hover:text-white hover:bg-[#f0545c] hover:border-[#f0545c] transition-all shadow-xs"
                          aria-label="Previous categories"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={() => scrollCategories(1)}
                          className="w-9 h-9 rounded-full bg-white border border-gray-200/90 flex items-center justify-center text-gray-600 hover:text-white hover:bg-[#f0545c] hover:border-[#f0545c] transition-all shadow-xs"
                          aria-label="Next categories"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>

                    <div
                      ref={categoryScrollRef}
                      className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth"
                    >
                      {EVENT_CATEGORIES.map((cat) => {
                        const Icon = CATEGORY_ICON[cat] || Music2;
                        return (
                          <div
                            key={cat}
                            onClick={() => navigate(`/events/category/${encodeURIComponent(cat)}`)}
                            className="flex-shrink-0 w-[130px] flex flex-col items-center gap-3 p-5 rounded-3xl bg-white border border-gray-100 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-[#f0545c]/10 group-hover:bg-[#f0545c] flex items-center justify-center text-[#f0545c] group-hover:text-white transition-all shadow-xs">
                              <Icon size={20} />
                            </div>
                            <span className="text-[13px] font-bold text-gray-800 text-center leading-tight group-hover:text-[#f0545c] transition-colors">
                              {cat}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Trending Events */}
                  <EventRow title="Trending Events" events={trending} seeAllPath="/events/category/Music" />

                  {/* Artists to Watch */}
                  {artists.length > 0 && (
                    <section className="mb-12">
                      <div className="mb-4">
                        <h2 className="text-[20px] font-black text-gray-900 tracking-tight">
                          Featured Artists &amp; Performers
                        </h2>
                        <p className="text-[12.5px] text-gray-400 font-medium mt-0.5">
                          Follow the stars bringing music, comedy, and theater to life
                        </p>
                      </div>

                      <div className="flex gap-5 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
                        {artists.map((a) => (
                          <div
                            key={a._id}
                            onClick={() => navigate(`/artists/${a._id}`)}
                            className="flex-shrink-0 w-[95px] text-center cursor-pointer group card-hover-lift"
                          >
                            <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-2 bg-gray-100 border-2 border-white shadow-md group-hover:border-[#f0545c] transition-all">
                              {a.image ? (
                                <img
                                  src={a.image.startsWith("http") ? a.image : `https://res.cloudinary.com/duhc0vvqz/image/upload${a.image}`}
                                  alt={a.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[22px] font-black text-gray-400 bg-gray-200">
                                  {a.name?.[0]}
                                </div>
                              )}
                            </div>
                            <p className="text-[12px] font-bold text-gray-800 line-clamp-1 group-hover:text-[#f0545c] transition-colors">
                              {a.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* District Row */}
                  {district.id && (
                    <EventRow
                      title={`Happening in ${district.name}`}
                      events={byDistrict}
                      seeAllPath={`/events/district/${district.id}`}
                      emptyText={`No events found in ${district.name} yet.`}
                    />
                  )}

                  {/* Remaining Algorithm Rows */}
                  <EventRow title="Recommended For You" events={recommended} />
                  <EventRow title="Popular Right Now"   events={popular} />
                  <EventRow title="Upcoming Events"     events={upcoming} />
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
