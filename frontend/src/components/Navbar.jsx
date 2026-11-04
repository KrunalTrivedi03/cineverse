import { useState, useEffect, useRef } from "react";
import {
  Search,
  User,
  LogOut,
  ChevronDown,
  X,
  MapPin,
  Film,
  Star,
  Tv,
  Plus,
  Clapperboard,
  Clock,
  Check,
  Loader2,
  Sparkles,
  Bookmark,
  Calendar,
  Ticket,
  Flame,
  ArrowRight,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { consumeCityPromptFlag } from "../utils/authSession";
import nowLogo from "../assets/now-logo-mark.png";

const GENRES = [
  "Action",
  "Comedy",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "Drama",
  "Adventure",
  "Animation",
];

const POPULAR_CITIES = [
  "Mumbai",
  "Delhi-NCR",
  "Bengaluru",
  "Hyderabad",
  "Ahmedabad",
  "Chandigarh",
  "Chennai",
  "Pune",
  "Kolkata",
  "Kochi",
];

export function getSelectedCity() {
  return {
    id: localStorage.getItem("selectedCityId") || "",
    name: localStorage.getItem("selectedCity") || "",
  };
}

export default function Navbar() {
  const token = localStorage.getItem("accessToken");
  const location = useLocation();
  let userInfo = {};
  try {
    const stored = localStorage.getItem("userInfo");
    if (stored && stored !== "undefined") userInfo = JSON.parse(stored);
  } catch {
    userInfo = {};
  }

  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const logout = () => {
    setProfileOpen(false);
    setMobileProfileOpen(false);
    authLogout();
  };

  const [cityModal, setCityModal] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [selectedCity, setSelectedCity] = useState(
    () => localStorage.getItem("selectedCity") || "",
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState({});

  const searchInputRef = useRef(null);
  const profileRef = useRef(null);
  const mobileProfileRef = useRef(null);
  const cityInputRef = useRef(null);

  useEffect(() => {
    setCitiesLoading(true);
    api
      .get("/cities")
      .then((res) => setCities(res.data))
      .catch(() => setCities([]))
      .finally(() => setCitiesLoading(false));
  }, []);

  useEffect(() => {
    if (consumeCityPromptFlag()) {
      setSelectedCity("");
      setCityModal(true);
    }
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 80);
  }, [searchOpen]);

  useEffect(() => {
    if (cityModal) {
      setCitySearch("");
      setTimeout(() => cityInputRef.current?.focus(), 80);
    }
  }, [cityModal]);

  useEffect(() => {
    const fn = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
      if (mobileProfileRef.current && !mobileProfileRef.current.contains(e.target))
        setMobileProfileOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setCityModal(false);
        setMobileProfileOpen(false);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const fetchMovies = async (text) => {
    if (!text.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://www.omdbapi.com/?apikey=${import.meta.env.VITE_OMDB_API_KEY}&s=${text}`,
      );
      const data = await res.json();
      setResults(data.Search || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const handleAddToWatchlist = (movie) => {
    let list = JSON.parse(localStorage.getItem("watchlist") || "[]");
    if (!list.find((m) => m.imdbID === movie.imdbID)) {
      list.push(movie);
      localStorage.setItem("watchlist", JSON.stringify(list));
    }
    setAdded((p) => ({ ...p, [movie.imdbID]: true }));
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city.name);
    localStorage.setItem("selectedCity", city.name);
    localStorage.setItem("selectedCityId", city._id);
    setCityModal(false);
    setCitySearch("");
    window.dispatchEvent(new Event("cityChanged"));
  };

  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(citySearch.toLowerCase()),
  );

  return (
    <>
      <nav className="w-full sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-gray-100/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[64px] flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="relative flex items-center">
              <img
                src={nowLogo}
                alt="NOW"
                className="h-[28px] md:h-[32px] w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#f0545c]/10 text-[#f0545c] rounded-md border border-[#f0545c]/20">
                LIVE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1.5 text-[14px] font-semibold text-gray-700">
            <NavDropdown label="Movies" activePaths={["/", "/now-showing", "/coming-soon", "/movie"]}>
              <DropItem icon={<Star size={15} />} label="Top Rated" desc="Critic & user favorites" to="/" />
              <DropItem
                icon={<Film size={15} />}
                label="Now Playing"
                desc="Running in cinemas"
                to="/now-showing"
              />
              <DropItem
                icon={<Clock size={15} />}
                label="Coming Soon"
                desc="Upcoming premieres"
                to="/coming-soon"
              />
            </NavDropdown>

            <NavDropdown label="Shows" activePaths={["/web-shows"]}>
              <DropItem
                icon={<Tv size={15} />}
                label="All Shows"
                desc="Browse catalog"
                to="/web-shows"
              />
              <DropItem
                icon={<Flame size={15} />}
                label="Trending Series"
                desc="Hot & binge-worthy"
                to="/web-shows/trending"
              />
              <DropItem
                icon={<Sparkles size={15} />}
                label="Web Originals"
                desc="Exclusive productions"
                to="/web-shows/web-originals"
              />
            </NavDropdown>

            {token && (
              <NavLink to="/watchlist" active={location.pathname === "/watchlist"}>
                <Bookmark size={15} className="inline mr-1 text-gray-400 group-hover:text-[#f0545c]" />
                Watchlist
              </NavLink>
            )}

            <NavLink to="/events" active={location.pathname.startsWith("/events")}>
              <Calendar size={15} className="inline mr-1 text-gray-400 group-hover:text-[#f0545c]" />
              Events
            </NavLink>

            <NavLink to="/play" active={location.pathname.startsWith("/play")}>
              <Ticket size={15} className="inline mr-1 text-gray-400 group-hover:text-[#f0545c]" />
              Play
            </NavLink>

            <NavLink to="/offers" active={location.pathname === "/offers"}>
              <span className="relative flex items-center">
                Offers
                <span className="ml-1.5 flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f0545c] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f0545c]"></span>
                </span>
              </span>
            </NavLink>
          </div>

          {/* Right Action Utilities */}
          <div className="flex items-center gap-2.5 md:gap-3.5">
            {/* Search Pill */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center justify-between gap-3 border border-gray-200/90 bg-gray-50/80 hover:bg-white hover:border-[#f0545c]/30 hover:shadow-sm transition-all rounded-full px-3.5 py-1.5 text-[13px] text-gray-500 w-56 lg:w-64 group"
            >
              <div className="flex items-center gap-2 truncate">
                <Search size={14} className="text-gray-400 group-hover:text-[#f0545c] transition-colors flex-shrink-0" />
                <span className="truncate">Search movies, shows...</span>
              </div>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-200/60 group-hover:bg-gray-200 px-1.5 py-0.5 rounded border border-gray-300/40">
                /
              </span>
            </button>

            {/* City Selector Pill */}
            <button
              onClick={() => setCityModal(true)}
              className="hidden md:flex items-center gap-1.5 text-[13px] font-semibold text-gray-700 hover:text-[#f0545c] transition-all px-3 py-1.5 rounded-full border border-gray-200/80 hover:border-[#f0545c]/30 bg-white hover:bg-[#f0545c]/5 shadow-2xs"
            >
              <MapPin
                size={14}
                className="flex-shrink-0"
                style={{ color: selectedCity ? "#f0545c" : "#9ca3af" }}
              />
              <span className="truncate max-w-[100px]">{selectedCity || "Select City"}</span>
              <ChevronDown size={13} className="text-gray-400" />
            </button>

            {/* Mobile search & city icons */}
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:text-[#f0545c] hover:bg-gray-200 transition-colors"
              aria-label="Search"
            >
              <Search size={16} />
            </button>

            <button
              onClick={() => setCityModal(true)}
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gray-100 text-gray-700 text-[12px] font-bold hover:text-[#f0545c] transition-colors"
              aria-label="Select city"
            >
              <MapPin
                size={14}
                style={{ color: selectedCity ? "#f0545c" : undefined }}
              />
              <span className="max-w-[70px] truncate">{selectedCity || "City"}</span>
            </button>

            {/* Mobile Auth button / Avatar */}
            {!token ? (
              <Link
                to="/login"
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-full text-white flex-shrink-0 shadow-md shadow-[#f0545c]/25 active:scale-95 transition-transform"
                style={{ background: "linear-gradient(135deg, #f0545c 0%, #e03a43 100%)" }}
                aria-label="Sign in"
              >
                <User size={15} />
              </Link>
            ) : (
              <div className="md:hidden relative" ref={mobileProfileRef}>
                <button
                  onClick={() => setMobileProfileOpen((p) => !p)}
                  className="flex items-center justify-center w-9 h-9 rounded-full text-white text-[12px] font-bold flex-shrink-0 ring-2 ring-[#f0545c]/30 shadow-md shadow-[#f0545c]/20"
                  style={{ background: "linear-gradient(135deg, #f0545c 0%, #d94048 100%)" }}
                  aria-label="Account"
                >
                  {(userInfo.username?.[0] || "U").toUpperCase()}
                </button>

                {mobileProfileOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl w-56 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3.5 border-b border-gray-100 bg-gray-50/80">
                      <p className="text-[14px] font-bold text-gray-900 capitalize truncate">
                        {userInfo.username || "User"}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {userInfo.email || ""}
                      </p>
                    </div>
                    <div className="py-2 px-1.5 space-y-0.5">
                      <ProfileLink to="/dashboard" onClick={() => setMobileProfileOpen(false)}>
                        Dashboard & Stats
                      </ProfileLink>
                      <ProfileLink to="/watchlist" onClick={() => setMobileProfileOpen(false)}>
                        My Watchlist
                      </ProfileLink>
                      <ProfileLink to="/my-event-bookings" onClick={() => setMobileProfileOpen(false)}>
                        Event Bookings
                      </ProfileLink>
                      <ProfileLink to="/play/my-bookings" onClick={() => setMobileProfileOpen(false)}>
                        Play Bookings
                      </ProfileLink>
                      <ProfileLink to="/settings" onClick={() => setMobileProfileOpen(false)}>
                        Account & Settings
                      </ProfileLink>
                    </div>
                    <div className="border-t border-gray-100 px-1.5 py-1.5 bg-red-50/30">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors px-3 py-2 rounded-xl"
                      >
                        <LogOut size={14} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Desktop Auth Button / Avatar */}
            {!token ? (
              <Link
                to="/login"
                className="hidden md:inline-flex items-center gap-2 text-[13px] font-bold text-white px-5 py-2 rounded-full transition-all duration-200 shadow-md shadow-[#f0545c]/25 hover:shadow-lg hover:shadow-[#f0545c]/40 hover:-translate-y-0.5 active:translate-y-0"
                style={{ background: "linear-gradient(135deg, #f0545c 0%, #e03a43 100%)" }}
              >
                <span>Sign In</span>
                <ArrowRight size={13} />
              </Link>
            ) : (
              <div className="hidden md:block relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((p) => !p)}
                  className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200/90 transition-all rounded-full pl-1.5 pr-3 py-1 shadow-2xs hover:border-[#f0545c]/30"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[12px] font-extrabold flex-shrink-0 shadow-sm"
                    style={{ background: "linear-gradient(135deg, #f0545c 0%, #d94048 100%)" }}
                  >
                    {(userInfo.username?.[0] || "U").toUpperCase()}
                  </div>
                  <span className="text-[13px] font-semibold text-gray-800 capitalize max-w-[90px] truncate">
                    {userInfo.username || "Account"}
                  </span>
                  <ChevronDown size={13} className="text-gray-400" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl w-56 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3.5 border-b border-gray-100 bg-gray-50/70">
                      <p className="text-[14px] font-bold text-gray-900 capitalize truncate">
                        {userInfo.username || "User"}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {userInfo.email || ""}
                      </p>
                    </div>
                    <div className="py-2 px-1.5 space-y-0.5">
                      <ProfileLink to="/dashboard" onClick={() => setProfileOpen(false)}>
                        Dashboard & Stats
                      </ProfileLink>
                      <ProfileLink to="/watchlist" onClick={() => setProfileOpen(false)}>
                        My Watchlist
                      </ProfileLink>
                      <ProfileLink to="/my-event-bookings" onClick={() => setProfileOpen(false)}>
                        Event Bookings
                      </ProfileLink>
                      <ProfileLink to="/play/my-bookings" onClick={() => setProfileOpen(false)}>
                        Play Bookings
                      </ProfileLink>
                      <ProfileLink to="/settings" onClick={() => setProfileOpen(false)}>
                        Account & Settings
                      </ProfileLink>
                    </div>
                    <div className="border-t border-gray-100 px-1.5 py-1.5 bg-red-50/30">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors px-3 py-2 rounded-xl"
                      >
                        <LogOut size={14} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Modern Spotlight Search Overlay Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[999] flex flex-col justify-start bg-black/60 backdrop-blur-md transition-opacity"
          onClick={() => {
            setSearchOpen(false);
            setQuery("");
            setResults([]);
          }}
        >
          <div
            className="w-full max-w-3xl mx-auto mt-4 sm:mt-12 bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Search Input Box */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <Search size={18} className="text-[#f0545c] flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  fetchMovies(e.target.value);
                }}
                className="flex-1 bg-transparent text-[15px] font-medium text-gray-900 outline-none placeholder-gray-400"
                placeholder="Search movies, shows, genres, actors..."
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                  }}
                  className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors"
                >
                  <X size={12} />
                </button>
              )}
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                  setResults([]);
                }}
                className="text-[13px] font-semibold text-gray-500 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-gray-200/50 transition-colors"
              >
                Esc
              </button>
            </div>

            {/* Modal Body / Results */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 custom-scrollbar">
              {!query && (
                <div>
                  <div className="mb-6">
                    <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">
                      Popular Categories
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {GENRES.map((g) => (
                        <button
                          key={g}
                          onClick={() => {
                            setQuery(g);
                            fetchMovies(g);
                          }}
                          className="text-[12.5px] font-semibold px-3.5 py-1.5 rounded-full border border-gray-200 text-gray-700 hover:border-[#f0545c] hover:bg-[#f0545c]/5 hover:text-[#f0545c] transition-all bg-white shadow-2xs"
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">
                      Trending Searches
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {["Dhurandhar", "Pushpa 2", "Singham Again", "Devara", "Stranger Things", "Deadpool"].map(
                        (t) => (
                          <button
                            key={t}
                            onClick={() => {
                              setQuery(t);
                              fetchMovies(t);
                            }}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 text-[13px] font-medium text-gray-700 hover:text-[#f0545c] transition-all text-left group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-[#f0545c]/10 flex items-center justify-center text-gray-400 group-hover:text-[#f0545c] transition-colors">
                              <Search size={13} />
                            </div>
                            <span className="truncate">{t}</span>
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400 text-[14px]">
                  <Loader2 size={24} className="animate-spin text-[#f0545c]" />
                  <span>Searching entertainment catalog...</span>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div>
                  <p className="text-[12px] font-extrabold text-gray-400 uppercase tracking-wider mb-3">
                    Search Results ({results.length})
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {results.map((movie) => (
                      <div
                        key={movie.imdbID}
                        className="flex items-center gap-3.5 p-3 rounded-2xl bg-white hover:bg-gray-50/90 border border-gray-100 hover:border-gray-200 transition-all shadow-2xs hover:shadow-md group"
                      >
                        <img
                          src={
                            movie.Poster !== "N/A"
                              ? movie.Poster
                              : "/no-image.png"
                          }
                          alt={movie.Title}
                          className="w-12 h-16 rounded-xl object-cover flex-shrink-0 bg-gray-100 shadow-xs"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-gray-900 group-hover:text-[#f0545c] transition-colors line-clamp-1">
                            {movie.Title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 capitalize">
                              {movie.Type}
                            </span>
                            <span className="text-[12px] text-gray-400">
                              {movie.Year}
                            </span>
                          </div>
                        </div>

                        {token && (
                          <button
                            onClick={() => handleAddToWatchlist(movie)}
                            className="flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-xl flex-shrink-0 transition-all border"
                            style={
                              added[movie.imdbID]
                                ? {
                                    background: "rgba(16,185,129,0.1)",
                                    color: "#059669",
                                    borderColor: "rgba(16,185,129,0.25)",
                                  }
                                : {
                                    background: "rgba(240,84,92,0.06)",
                                    color: "#f0545c",
                                    borderColor: "rgba(240,84,92,0.2)",
                                  }
                            }
                          >
                            {added[movie.imdbID] ? (
                              <>
                                <Check size={13} /> Saved
                              </>
                            ) : (
                              <>
                                <Plus size={13} /> Watchlist
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!loading && query && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                    <Clapperboard size={26} />
                  </div>
                  <p className="text-[16px] font-bold text-gray-800">
                    No results found for "{query}"
                  </p>
                  <p className="text-[13px] text-gray-400 mt-1 max-w-xs">
                    Try searching with another title, franchise, or explore our top genres above.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modern City Selection Modal */}
      {cityModal && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => {
            setCityModal(false);
            setCitySearch("");
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100 bg-gray-50/50">
              <div>
                <p className="text-[16px] font-extrabold text-gray-900">
                  Select Location
                </p>
                <p className="text-[12px] text-gray-500">
                  Discover events and cinemas around you
                </p>
              </div>
              <button
                onClick={() => {
                  setCityModal(false);
                  setCitySearch("");
                }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* City search input */}
            <div className="px-6 pt-4 pb-2">
              <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200/90 rounded-2xl px-3.5 py-2.5 focus-within:border-[#f0545c] focus-within:bg-white transition-all shadow-2xs">
                <Search size={15} className="text-gray-400 flex-shrink-0" />
                <input
                  ref={cityInputRef}
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Type city name..."
                  className="flex-1 bg-transparent text-[13.5px] font-medium text-gray-800 outline-none placeholder-gray-400"
                />
                {citySearch && (
                  <button onClick={() => setCitySearch("")}>
                    <X size={13} className="text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Popular Cities */}
            {!citySearch && (
              <div className="px-6 py-2">
                <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                  Popular Hubs
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_CITIES.map((name) => {
                    const matched = cities.find((c) => c.name.toLowerCase() === name.toLowerCase());
                    const active = selectedCity.toLowerCase() === name.toLowerCase();
                    return (
                      <button
                        key={name}
                        onClick={() => {
                          if (matched) handleCitySelect(matched);
                          else {
                            setSelectedCity(name);
                            localStorage.setItem("selectedCity", name);
                            setCityModal(false);
                            window.dispatchEvent(new Event("cityChanged"));
                          }
                        }}
                        className={`text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-all ${
                          active
                            ? "bg-[#f0545c] text-white border-[#f0545c] shadow-xs"
                            : "bg-gray-50 text-gray-700 border-gray-200/80 hover:border-[#f0545c]/40 hover:bg-[#f0545c]/5"
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Filtered Cities */}
            <div
              className="px-6 py-3 max-h-72 overflow-y-auto custom-scrollbar"
            >
              {citiesLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                  <Loader2 size={16} className="animate-spin text-[#f0545c]" />
                  <span className="text-[13px] font-medium">Loading cities...</span>
                </div>
              ) : filteredCities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[13px] font-medium text-gray-400">No cities found matching "{citySearch}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filteredCities.map((city) => {
                    const active = selectedCity === city.name;
                    return (
                      <button
                        key={city._id}
                        onClick={() => handleCitySelect(city)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all border text-left ${
                          active
                            ? "bg-[#f0545c]/10 text-[#f0545c] border-[#f0545c]/30 shadow-2xs"
                            : "bg-white text-gray-700 border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <MapPin size={13} className={active ? "text-[#f0545c]" : "text-gray-400"} />
                        <span className="truncate flex-1">{city.name}</span>
                        {active && (
                          <Check size={13} className="text-[#f0545c] flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NavLink({ to, children, active }) {
  return (
    <Link
      to={to}
      className={`group relative px-3 py-1.5 rounded-xl text-[14px] font-semibold transition-all ${
        active
          ? "text-[#f0545c] bg-[#f0545c]/8"
          : "text-gray-700 hover:text-[#f0545c] hover:bg-gray-100/70"
      }`}
    >
      {children}
    </Link>
  );
}

function NavDropdown({ label, children, activePaths = [] }) {
  const location = useLocation();
  const isActive = activePaths.some((p) => p === "/" ? location.pathname === "/" : location.pathname.startsWith(p));

  return (
    <div className="group relative">
      <button
        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[14px] font-semibold transition-all ${
          isActive
            ? "text-[#f0545c] bg-[#f0545c]/8"
            : "text-gray-700 hover:text-[#f0545c] hover:bg-gray-100/70"
        }`}
      >
        <span>{label}</span>
        <ChevronDown size={13} className="transition-transform duration-200 group-hover:rotate-180" />
      </button>

      {/* Floating Dropdown Card */}
      <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 z-50">
        <div className="bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-xl w-60 p-2 space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
}

function DropItem({ icon, label, desc, to }) {
  return (
    <Link
      to={to}
      className="flex items-start gap-3 p-2.5 rounded-xl text-gray-700 hover:bg-[#f0545c]/5 hover:text-[#f0545c] transition-all group/item"
    >
      <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover/item:bg-[#f0545c]/10 text-gray-500 group-hover/item:text-[#f0545c] flex items-center justify-center flex-shrink-0 transition-colors mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-gray-900 group-hover/item:text-[#f0545c] leading-tight transition-colors">
          {label}
        </p>
        {desc && (
          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
            {desc}
          </p>
        )}
      </div>
    </Link>
  );
}

function ProfileLink({ to, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center px-3 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-100/80 hover:text-[#f0545c] rounded-xl transition-all"
    >
      {children}
    </Link>
  );
}
