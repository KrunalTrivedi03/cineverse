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
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { consumeCityPromptFlag } from "../utils/authSession";

const GENRES = [
  "Action",
  "Comedy",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "Drama",
];

export function getSelectedCity() {
  return {
    id: localStorage.getItem("selectedCityId") || "",
    name: localStorage.getItem("selectedCity") || "",
  };
}

export default function Navbar() {
  const token = localStorage.getItem("accessToken");
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

  // After a session-expiry logout, selectedCity/selectedCityId are cleared
  // and this flag is set — prompt the user to pick their city again before
  // they continue using the app.
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
      <nav className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-[60px] flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <CineVerseLogo size={26} />
            <span className="text-[20px] font-extrabold tracking-tight text-gray-900">
              Cine<span style={{ color: "#f0545c" }}>Verse</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1 text-[14px] font-medium text-gray-700">
            <NavDropdown label="Movies">
              <DropItem icon={<Star size={14} />} label="Top Rated" to="/" />
              <DropItem
                icon={<Film size={14} />}
                label="Now Playing"
                to="/now-showing"
              />
              <DropItem
                icon={<Clock size={14} />}
                label="Coming Soon"
                to="/coming-soon"
              />
            </NavDropdown>
            <NavDropdown label="Shows">
              <DropItem
                icon={<Tv size={14} />}
                label="Trending Series"
                to="/web-shows/trending"
              />
              <DropItem
                icon={<Tv size={14} />}
                label="Web Originals"
                to="/web-shows/web-originals"
              />
            </NavDropdown>
            {token && <NavLink to="/watchlist">Watchlist</NavLink>}
            <NavLink to="/events">Events</NavLink>
            <NavLink to="/play">Play</NavLink>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors rounded-full px-4 py-2 text-[13px] text-gray-500 w-52"
            >
              <Search size={14} className="flex-shrink-0" />
              <span>Search movies, shows...</span>
            </button>

            <button
              onClick={() => setCityModal(true)}
              className="hidden md:flex items-center gap-1 text-[13px] font-medium text-gray-700 hover:text-[#f0545c] transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-50"
            >
              <MapPin
                size={14}
                className="flex-shrink-0"
                style={{ color: selectedCity ? "#f0545c" : undefined }}
              />
              <span>{selectedCity || "Select City"}</span>
              <ChevronDown size={13} />
            </button>

            {/* Mobile utilities: search, city, and profile/sign-in all live
                here now — the bottom nav is content-browsing only. */}
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden p-2 text-gray-700 hover:text-[#f0545c] transition-colors"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            <button
              onClick={() => setCityModal(true)}
              className="md:hidden flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-700 hover:text-[#f0545c] hover:bg-gray-50 transition-colors"
              aria-label="Select city"
            >
              <MapPin
                size={18}
                style={{ color: selectedCity ? "#f0545c" : undefined }}
              />
            </button>

            {!token ? (
              <Link
                to="/login"
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-full text-white flex-shrink-0"
                style={{ background: "#f0545c" }}
                aria-label="Sign in"
              >
                <User size={16} />
              </Link>
            ) : (
              <div className="md:hidden relative" ref={mobileProfileRef}>
                <button
                  onClick={() => setMobileProfileOpen((p) => !p)}
                  className="flex items-center justify-center w-9 h-9 rounded-full text-white text-[12px] font-bold flex-shrink-0"
                  style={{ background: "#f0545c" }}
                  aria-label="Account"
                >
                  {(userInfo.username?.[0] || "U").toUpperCase()}
                </button>

                {mobileProfileOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] bg-white border border-gray-200 rounded-2xl shadow-xl w-52 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-[13px] font-bold text-gray-900 capitalize truncate">
                        {userInfo.username || "User"}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {userInfo.email || ""}
                      </p>
                    </div>
                    <div className="py-1.5 px-1">
                      <ProfileLink to="/watchlist" onClick={() => setMobileProfileOpen(false)}>
                        My Watchlist
                      </ProfileLink>
                      <ProfileLink to="/settings" onClick={() => setMobileProfileOpen(false)}>
                        Profile & Settings
                      </ProfileLink>
                    </div>
                    <div className="border-t border-gray-100 px-1 pb-1.5 pt-1">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors px-3 py-2 rounded-lg"
                      >
                        <LogOut size={14} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!token ? (
              <Link
                to="/login"
                className="hidden md:block text-[13px] font-semibold text-white px-4 py-2 rounded-full transition-colors"
                style={{ background: "#f0545c" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#d94048")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#f0545c")
                }
              >
                Sign In
              </Link>
            ) : (
              <div className="hidden md:block relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((p) => !p)}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors rounded-full pl-2 pr-3 py-1.5"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                    style={{ background: "#f0545c" }}
                  >
                    {(userInfo.username?.[0] || "U").toUpperCase()}
                  </div>
                  <span className="text-[13px] font-medium text-gray-800 capitalize max-w-[80px] truncate">
                    {userInfo.username || "User"}
                  </span>
                  <ChevronDown size={13} className="text-gray-500" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] bg-white border border-gray-200 rounded-2xl shadow-xl w-52 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-[13px] font-bold text-gray-900 capitalize truncate">
                        {userInfo.username || "User"}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {userInfo.email || ""}
                      </p>
                    </div>
                    <div className="py-1.5 px-1">
                      <ProfileLink to="/watchlist">My Watchlist</ProfileLink>
                      <ProfileLink to="/settings">Profile & Settings</ProfileLink>
                    </div>
                    <div className="border-t border-gray-100 px-1 pb-1.5 pt-1">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors px-3 py-2 rounded-lg"
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

      {searchOpen && (
        <div className="fixed inset-0 bg-white z-[999] flex flex-col">
          <div className="border-b border-gray-100 px-5 md:px-10 py-4 flex items-center gap-4">
            <div className="flex-1 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5">
              <Search size={16} className="text-gray-400 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  fetchMovies(e.target.value);
                }}
                className="flex-1 bg-transparent text-[14px] text-gray-900 outline-none placeholder-gray-400"
                placeholder="Search movies, shows, people..."
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                  }}
                >
                  <X size={14} className="text-gray-400 hover:text-gray-700" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setSearchOpen(false);
                setQuery("");
                setResults([]);
              }}
              className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0"
            >
              Cancel
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 md:px-10 py-6">
            {!query && (
              <div>
                <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Browse by genre
                </p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {GENRES.map((g) => (
                    <button
                      key={g}
                      onClick={() => {
                        setQuery(g);
                        fetchMovies(g);
                      }}
                      className="text-[13px] font-semibold px-4 py-2 rounded-full border border-gray-200 text-gray-700 hover:border-[#f0545c] hover:text-[#f0545c] transition-all bg-white"
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Trending searches
                </p>
                <div className="flex flex-col gap-2">
                  {["Dhurandhar", "Pushpa 2", "Singham Again", "Devara"].map(
                    (t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setQuery(t);
                          fetchMovies(t);
                        }}
                        className="flex items-center gap-3 text-[14px] text-gray-700 hover:text-[#f0545c] transition-colors text-left"
                      >
                        <Search
                          size={13}
                          className="text-gray-300 flex-shrink-0"
                        />
                        {t}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
            {loading && (
              <div className="flex items-center gap-2 text-gray-400 text-[14px]">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-gray-200 border-t-[#f0545c] rounded-full" />
                Searching...
              </div>
            )}
            {!loading && results.length > 0 && (
              <div>
                <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Results for "{query}"
                </p>
                <div className="flex flex-col gap-2">
                  {results.map((movie) => (
                    <div
                      key={movie.imdbID}
                      className="flex items-center gap-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl p-3 group"
                    >
                      <img
                        src={
                          movie.Poster !== "N/A"
                            ? movie.Poster
                            : "/no-image.png"
                        }
                        alt={movie.Title}
                        className="w-12 h-[68px] rounded-lg object-cover flex-shrink-0 bg-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-gray-900 line-clamp-1">
                          {movie.Title}
                        </p>
                        <p className="text-[12px] text-gray-400 mt-0.5">
                          {movie.Year} · {movie.Type}
                        </p>
                      </div>
                      {token && (
                        <button
                          onClick={() => handleAddToWatchlist(movie)}
                          className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-all"
                          style={
                            added[movie.imdbID]
                              ? {
                                  background: "rgba(16,185,129,0.1)",
                                  color: "#0a6e4e",
                                  border: "1px solid rgba(16,185,129,0.25)",
                                }
                              : {
                                  background: "rgba(240,84,92,0.08)",
                                  color: "#f0545c",
                                  border: "1px solid rgba(240,84,92,0.2)",
                                }
                          }
                        >
                          {added[movie.imdbID] ? (
                            <>
                              <Check size={13} /> Added
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
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Clapperboard size={40} className="text-gray-200 mb-3" />
                <p className="text-[15px] font-semibold text-gray-400">
                  No results for "{query}"
                </p>
                <p className="text-[13px] text-gray-300 mt-1">
                  Try a different title or keyword
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {cityModal && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => {
            setCityModal(false);
            setCitySearch("");
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="text-[15px] font-bold text-gray-900">
                Select your city
              </p>
              <button
                onClick={() => {
                  setCityModal(false);
                  setCitySearch("");
                }}
              >
                <X
                  size={18}
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                />
              </button>
            </div>

            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <Search size={13} className="text-gray-400 flex-shrink-0" />
                <input
                  ref={cityInputRef}
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Search city…"
                  className="flex-1 bg-transparent text-[13px] text-gray-800 outline-none placeholder-gray-400"
                />
                {citySearch && (
                  <button onClick={() => setCitySearch("")}>
                    <X size={12} className="text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            <div
              className="px-4 pb-4 max-h-72 overflow-y-auto"
              style={{ scrollbarWidth: "thin" }}
            >
              {citiesLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                  <Loader2
                    size={16}
                    className="animate-spin"
                    style={{ color: "#f0545c" }}
                  />
                  <span className="text-[13px]">Loading cities…</span>
                </div>
              ) : filteredCities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[13px] text-gray-400">No cities found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {filteredCities.map((city) => {
                    const active = selectedCity === city.name;
                    return (
                      <button
                        key={city._id}
                        onClick={() => handleCitySelect(city)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all border"
                        style={
                          active
                            ? {
                                background: "rgba(240,84,92,0.08)",
                                color: "#f0545c",
                                borderColor: "rgba(240,84,92,0.3)",
                              }
                            : {
                                background: "white",
                                color: "#374151",
                                borderColor: "#e5e7eb",
                              }
                        }
                        onMouseEnter={(e) => {
                          if (!active)
                            e.currentTarget.style.background = "#f9fafb";
                        }}
                        onMouseLeave={(e) => {
                          if (!active)
                            e.currentTarget.style.background = "white";
                        }}
                      >
                        <MapPin size={12} className="flex-shrink-0" />
                        <span className="truncate">{city.name}</span>
                        {active && (
                          <Check size={12} className="ml-auto flex-shrink-0" />
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

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      className="px-3 py-2 rounded-lg text-gray-700 hover:text-[#f0545c] hover:bg-gray-50 transition-colors text-[14px]"
    >
      {children}
    </Link>
  );
}

function NavDropdown({ label, children }) {
  return (
    <div className="group relative">
      <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:text-[#f0545c] hover:bg-gray-50 transition-colors text-[14px]">
        {label} <ChevronDown size={13} className="mt-0.5" />
      </button>
      <div className="absolute left-0 top-[calc(100%+4px)] bg-white border border-gray-200 rounded-xl shadow-xl w-52 py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
        {children}
      </div>
    </div>
  );
}

function DropItem({ icon, label, to }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-[#f0545c] transition-colors"
    >
      <span className="text-gray-400">{icon}</span>
      {label}
    </Link>
  );
}

function ProfileLink({ to, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-[#f0545c] rounded-lg transition-colors"
    >
      {children}
    </Link>
  );
}

function CineVerseLogo({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="40" cy="40" r="32" fill="#f0545c" />
      <circle
        cx="40"
        cy="40"
        r="32"
        fill="none"
        stroke="#c03040"
        strokeWidth="1"
      />
      <polygon points="33,27 33,53 57,40" fill="#ffffff" />
      <rect
        x="8"
        y="37"
        width="12"
        height="6"
        rx="3"
        fill="#ffffff"
        opacity="0.15"
      />
      <rect
        x="60"
        y="37"
        width="12"
        height="6"
        rx="3"
        fill="#ffffff"
        opacity="0.15"
      />
      <rect
        x="37"
        y="8"
        width="6"
        height="12"
        rx="3"
        fill="#ffffff"
        opacity="0.15"
      />
      <rect
        x="37"
        y="60"
        width="6"
        height="12"
        rx="3"
        fill="#ffffff"
        opacity="0.15"
      />
    </svg>
  );
}