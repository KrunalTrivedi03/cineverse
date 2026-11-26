import { useState, useEffect, useRef, useCallback } from "react";
import {
  User,
  LogOut,
  ChevronDown,
  MapPin,
  Film,
  Star,
  Tv,
  Clock,
} from "lucide-react";
import { Link, NavLink as RouterNavLink, useLocation } from "react-router-dom";
import CityPicker from "./CityPicker";
import EntertainmentSearch from "./EntertainmentSearch";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { consumeCityPromptFlag } from "../utils/authSession";
import nowLogo from "../assets/now-logo-mark.png";

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

  const { pathname } = useLocation();
  const { logout: authLogout } = useAuth();
  const logout = () => {
    setProfileOpen(false);
    authLogout();
  };

  const [cityModal, setCityModal] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState(false);
  const [selectedCity, setSelectedCity] = useState(
    () => localStorage.getItem("selectedCity") || "",
  );

  const profileRef = useRef(null);

  const fetchCities = useCallback(() => {
    setCitiesLoading(true);
    setCitiesError(false);
    api.get("/cities")
      .then((res) => setCities(res.data))
      .catch(() => setCitiesError(true))
      .finally(() => setCitiesLoading(false));
  }, []);

  useEffect(() => { fetchCities(); }, [fetchCities]);

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
    const fn = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") setProfileOpen(false);

    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleCitySelect = (city) => {
    setSelectedCity(city.name);
    localStorage.setItem("selectedCity", city.name);
    localStorage.setItem("selectedCityId", city._id);
    setCityModal(false);
    window.dispatchEvent(new Event("cityChanged"));
  };

  return (
    <>
      <nav aria-label="Main navigation" className="now-header sticky top-0 z-50">
        <div className="now-header-inner flex items-center justify-between gap-2 xl:gap-4">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src={nowLogo} alt="NOW" className="now-brand-mark h-[26px] w-auto" />
          </Link>

          <div className="now-main-links items-center gap-1 text-[14px] font-medium text-gray-700">
            <NavDropdown label="Movies" active={["/", "/now-showing", "/coming-soon"].includes(pathname) || pathname.startsWith("/movie/")}>
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
            <NavDropdown label="Shows" active={pathname.startsWith("/web-shows")}>
              <DropItem
                icon={<Tv size={14} />}
                label="All Shows"
                to="/web-shows"
              />
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

          <div className="now-header-search"><EntertainmentSearch source="header" /></div>
          <div className="now-header-actions">
            <button type="button" className="now-nav-action now-nav-location" onClick={() => setCityModal(true)} aria-label={selectedCity ? "Change city: " + selectedCity : "Select city"} aria-haspopup="dialog">
              <MapPin size={18} aria-hidden="true" /><span className="now-nav-label" title={selectedCity || undefined}>{selectedCity || "Select city"}</span><ChevronDown size={13} aria-hidden="true" />
            </button>
            {!token ? (
              <Link to="/login" className="now-nav-action now-nav-signin" aria-label="Sign in"><User size={17} aria-hidden="true" /><span>Sign in</span></Link>
            ) : (
              <div className="relative" ref={profileRef}>
                <button type="button" onClick={() => setProfileOpen((open) => !open)} aria-label={`Account: ${userInfo.username || "User"}`} aria-expanded={profileOpen} className="now-nav-action now-nav-account">
                  <span className="now-nav-initial">{(userInfo.username?.[0] || "U").toUpperCase()}</span>
                  <span className="now-nav-label" title={userInfo.username}>{userInfo.username || "User"}</span>
                </button>
                {profileOpen && (
                  <div className="now-account-menu">
                    <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="break-words font-semibold">{userInfo.username || "User"}</p>
                      <p className="truncate text-xs text-gray-500">{userInfo.email || ""}</p>
                    </div>
                    <div className="p-1.5">
                      <ProfileLink to="/watchlist" onClick={() => setProfileOpen(false)}>My Watchlist</ProfileLink>
                      <ProfileLink to="/settings" onClick={() => setProfileOpen(false)}>Profile &amp; Settings</ProfileLink>
                      <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 text-sm font-semibold text-red-700 hover:bg-red-50"><LogOut size={15} /> Logout</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {cityModal && (
        <CityPicker cities={cities} selectedCity={selectedCity} loading={citiesLoading} error={citiesError}
          onRetry={fetchCities} onSelect={handleCitySelect} onClose={() => setCityModal(false)} />
      )}
    </>
  );
}

function NavLink({ to, children }) {
  return (
    <RouterNavLink to={to} className="inline-flex items-center px-3 rounded-lg font-semibold hover:bg-gray-50">
      {children}
    </RouterNavLink>
  );
}

function NavDropdown({ label, active, children }) {
  const ref = useRef(null);

  return (
    <details
      ref={ref}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) ref.current.open = false;
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          ref.current.open = false;
          ref.current.querySelector("summary").focus();
        }
      }}
    >
      <summary data-active={active || undefined} className="list-none flex items-center gap-1 px-3 rounded-lg font-semibold hover:bg-gray-50">
        {label} <ChevronDown size={13} aria-hidden="true" />
      </summary>
      <div className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl w-52 py-1.5 z-50" onClick={() => { ref.current.open = false; }}>
        {children}
      </div>
    </details>
  );
}

function DropItem({ icon, label, to }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-now-accent transition-colors"
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
      className="flex items-center px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-now-accent rounded-lg transition-colors"
    >
      {children}
    </Link>
  );
}