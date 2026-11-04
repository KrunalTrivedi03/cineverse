import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import {
  MapPin, ChevronLeft, Star, X, Ticket, Calendar,
  Monitor, Loader2, Plus, Minus, RotateCcw, ChevronDown, Check, Globe, Sparkles, Navigation
} from "lucide-react";
import BottomNav from "./BottomNav";

const IMG = (path) => !path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;

/* ── Local date key ─────────────────────────────────── */
const localDateKey = (d) => {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const getDates = () => {
  const days   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      key:   localDateKey(d),
      day:   i === 0 ? "Today" : i === 1 ? "Tomorrow" : days[d.getDay()],
      date:  d.getDate(),
      month: months[d.getMonth()],
    };
  });
};
const DATES = getDates();
const TODAY_KEY = DATES[0].key;

/* ── Format 24h → 12h ── */
const fmt12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
};

/* ── Is a slot in the past? ── */
const isSlotPast = (timeStr, selectedDate) => {
  if (selectedDate !== TODAY_KEY) return false;
  if (!timeStr) return false;
  const now   = new Date();
  const [h, m] = timeStr.split(":").map(Number);
  const show  = new Date();
  show.setHours(h, m, 0, 0);
  return show <= now;
};

/* ── Time bucket ── */
const timeBucket = (t) => {
  const h = parseInt(t);
  if (h >= 0  && h < 12) return "Morning";
  if (h >= 12 && h < 17) return "Afternoon";
  if (h >= 17 && h < 20) return "Evening";
  return "Night";
};

const PRICE_RANGES = [
  { label: "Under ₹200",  fn: (p) => p < 200 },
  { label: "₹200–₹400",  fn: (p) => p >= 200 && p <= 400 },
  { label: "₹400–₹600",  fn: (p) => p >= 400 && p <= 600 },
  { label: "Above ₹600",  fn: (p) => p > 600 },
];

export default function BookTickets() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [movie,        setMovie]        = useState(null);
  const [shows,        setShows]        = useState([]);
  const [cityId,       setCityId]       = useState(() => localStorage.getItem("selectedCityId") || "");
  const [cityName,     setCityName]     = useState(() => localStorage.getItem("selectedCity")   || "");
  const [loadingShows, setLoadingShows] = useState(false);

  const [selectedDate, setSelectedDate] = useState(DATES[0].key);
  const [filterTime,   setFilterTime]   = useState("");
  const [filterPrice,  setFilterPrice]  = useState("");
  const [searchCinema, setSearchCinema] = useState("");
  
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [languageConfirmed, setLanguageConfirmed] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  /* Reset language selection when switching movie params */
  const prevIdRef = useRef(id);
  useEffect(() => {
    if (prevIdRef.current !== id) {
      prevIdRef.current = id;
      setSelectedLanguage("");
      setLanguageConfirmed(false);
      setShowLanguageModal(false);
    }
  }, [id]);

  /* ── Live clock tick ── */
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  /* ── Fetch Movie ── */
  useEffect(() => { 
    api.get(`/movies/${id}`).then((r) => setMovie(r.data)).catch(() => {}); 
  }, [id]);

  /* ── Fetch City Info ── */
  useEffect(() => {
    const sid  = localStorage.getItem("selectedCityId");
    const snam = localStorage.getItem("selectedCity");
    if (sid) { setCityId(sid); setCityName(snam || ""); return; }
    if (!snam) return;
    api.get("/cities").then((r) => {
      const m = r.data.find((c) => c.name.toLowerCase() === snam.toLowerCase());
      if (m) { localStorage.setItem("selectedCityId", m._id); setCityId(m._id); setCityName(m.name); }
    }).catch(() => {});
  }, []);

  /* ── Fetch Shows ── */
  useEffect(() => {
    if (!cityId || !id) return;
    setLoadingShows(true);
    api.get(`/shows/city/${cityId}/movie/${id}`)
      .then((r) => setShows(r.data))
      .catch(() => setShows([]))
      .finally(() => setLoadingShows(false));
  }, [cityId, id]);

  useEffect(() => {
    const handleCityChange = () => {
      const nid  = localStorage.getItem("selectedCityId") || "";
      const nnam = localStorage.getItem("selectedCity")   || "";
      if (!nid && nnam) {
        api.get("/cities").then((r) => {
          const m = r.data.find((c) => c.name.toLowerCase() === nnam.toLowerCase());
          if (m) { localStorage.setItem("selectedCityId", m._id); setCityId(m._id); setCityName(m.name); }
        }).catch(() => {});
      } else { setCityId(nid); setCityName(nnam); }
    };
    window.addEventListener("cityChanged", handleCityChange);
    return () => window.removeEventListener("cityChanged", handleCityChange);
  }, []);

  /* ── Direct Frontend Parsing for Languages ── */
  const availableLanguages = useMemo(() => {
    if (!movie) return [];

    let rawString = "";

    if (Array.isArray(movie.languages) && movie.languages.length > 0) {
      rawString = movie.languages.join(", ");
    } else if (typeof movie.language === "string") {
      rawString = movie.language;
    }

    if (!rawString) {
      return [...new Set(shows.map((s) => s.language).filter(Boolean))];
    }

    return rawString
      .replace(/\band\b/gi, ",")
      .split(",")
      .map((lang) => lang.trim())
      .filter(Boolean);
  }, [movie, shows]);

  useEffect(() => {
    if (!availableLanguages.length) return;
    if (languageConfirmed && availableLanguages.includes(selectedLanguage)) return;

    if (availableLanguages.length === 1) {
      setSelectedLanguage(availableLanguages[0]);
      setLanguageConfirmed(true);
      setShowLanguageModal(false);
      return;
    }
    setShowLanguageModal(true);
  }, [availableLanguages, languageConfirmed, selectedLanguage]);

  const handlePickLanguage = (lang) => {
    setSelectedLanguage(lang);
    setLanguageConfirmed(true);
    setShowLanguageModal(false);
  };

  /* ── Group shows → theatreGroups ── */
  const theatreGroups = useMemo(() => {
    const dateShows = shows.filter((s) => {
      if (localDateKey(new Date(s.showDate)) !== selectedDate) return false;
      if (selectedLanguage && s.language) {
        return s.language.toLowerCase() === selectedLanguage.toLowerCase();
      }
      return true;
    });

    const map = new Map();
    dateShows.forEach((show) => {
      const tId = show.theatre?._id;
      if (!map.has(tId)) {
        map.set(tId, {
          theatreId:    tId,
          name:         show.theatre?.name         || "Unknown Theatre",
          address:      show.theatre?.address      || "",
          locationLink: show.theatre?.locationLink || "",
          slots: [],
        });
      }
      const times = show.showTimes?.length
        ? show.showTimes
        : show.showTime ? [{ time: show.showTime, price: show.price, _id: show._id }] : [];
      times.forEach((slot) => map.get(tId).slots.push({
        showId: show._id, screen: show.screen,
        time: slot.time, price: slot.price, slotId: slot._id,
        language: show.language || "",
      }));
    });
    const groups = [...map.values()];
    groups.forEach((g) => g.slots.sort((a, b) => a.time.localeCompare(b.time)));
    return groups;
  }, [shows, selectedDate, selectedLanguage]);

  /* ── Apply filters & remove past showtimes ── */
  const filteredGroups = useMemo(() => {
    return theatreGroups
      .filter((g) => !searchCinema || g.name.toLowerCase().includes(searchCinema.toLowerCase()))
      .map((g) => ({
        ...g,
        slots: g.slots.filter((sl) => {
          if (isSlotPast(sl.time, selectedDate)) return false;
          const timeOk  = !filterTime  || timeBucket(sl.time) === filterTime;
          const priceOk = !filterPrice || (PRICE_RANGES.find((r) => r.label === filterPrice)?.fn(sl.price) ?? true);
          return timeOk && priceOk;
        }),
      }))
      .filter((g) => g.slots.length > 0);
  }, [theatreGroups, filterTime, filterPrice, searchCinema, selectedDate]);

  const hasActiveFilters = filterTime || filterPrice || searchCinema;
  const resetFilters = () => { setFilterTime(""); setFilterPrice(""); setSearchCinema(""); };

  if (!movie) return (
    <div className="flex items-center justify-center h-screen bg-[#f8fafc]">
      <div className="flex items-center gap-2">
        {[0,1,2].map((i) => (
          <span key={i} className="w-3 h-3 rounded-full bg-[#f0545c] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Navbar />
      <BottomNav />

      {/* ── Language Pick Modal ── */}
      {showLanguageModal && (
        <LanguageModal
          movie={movie}
          languages={availableLanguages}
          selectedLanguage={selectedLanguage}
          dismissible={languageConfirmed}
          onPick={handlePickLanguage}
          onClose={() => setShowLanguageModal(false)}
        />
      )}

      {/* ── Movie Info Bar (Frosted Glass Sticky Header) ── */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-[60px] z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all flex-shrink-0 active:scale-95"
          >
            <ChevronLeft size={18} />
          </button>
          
          {movie.poster && (
            <img
              src={IMG(movie.poster)}
              alt={movie.title}
              className="w-10 h-14 object-cover rounded-xl flex-shrink-0 shadow-sm border border-gray-200"
            />
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-[16px] sm:text-[18px] font-black text-gray-900 truncate tracking-tight">
              {movie.title}
            </h1>
            <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
              {movie.rating && (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#f0545c] bg-red-50 px-2 py-0.5 rounded-md">
                  <Star size={11} fill="#f0545c" />
                  <span>{movie.rating}/10</span>
                </span>
              )}
              {movie.certificate && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-gray-200 text-gray-600 bg-gray-50">
                  {movie.certificate}
                </span>
              )}
              {movie.genre && <span className="text-[12px] text-gray-500 font-medium">{movie.genre}</span>}
              {movie.duration && (
                <span className="text-[12px] text-gray-400 font-medium">· {movie.duration}m</span>
              )}
            </div>
          </div>

          {cityName && (
            <div className="hidden md:flex items-center gap-1.5 text-[12px] font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-xl flex-shrink-0 shadow-2xs">
              <MapPin size={13} className="text-[#f0545c]" />
              <span>{cityName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">

        {/* ── Dates Horizontal Bar ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {DATES.map((d) => {
              const active = selectedDate === d.key;
              return (
                <button
                  key={d.key}
                  onClick={() => setSelectedDate(d.key)}
                  className={`flex-shrink-0 flex flex-col items-center py-2.5 px-4 rounded-2xl border text-center transition-all duration-200 min-w-[70px] cursor-pointer ${
                    active
                      ? "bg-[#f0545c] border-[#f0545c] text-white shadow-lg shadow-[#f0545c]/30 scale-[1.02]"
                      : "bg-white border-gray-200/80 text-gray-700 hover:border-gray-300 hover:bg-gray-50/80 shadow-2xs"
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? "text-white/80" : "text-gray-400"}`}>
                    {d.day}
                  </span>
                  <span className="text-[20px] font-black leading-tight my-0.5">
                    {d.date}
                  </span>
                  <span className={`text-[10px] font-bold uppercase ${active ? "text-white/90" : "text-gray-500"}`}>
                    {d.month}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Filter Toolbar ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 mb-6 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Cinema input */}
            <div className="flex items-center gap-2.5 border border-gray-200 rounded-xl px-3.5 py-2 bg-gray-50/70 flex-1 min-w-[180px] max-w-[260px] focus-within:border-[#f0545c] focus-within:bg-white transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search cinema or theatre..."
                value={searchCinema}
                onChange={(e) => setSearchCinema(e.target.value)}
                className="flex-1 text-[13px] text-gray-800 bg-transparent outline-none placeholder-gray-400 font-medium"
              />
              {searchCinema && (
                <button onClick={() => setSearchCinema("")} className="text-gray-400 hover:text-gray-600">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Language Filter Button */}
            <button
              onClick={() => setShowLanguageModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-[13px] font-bold rounded-xl border transition-all active:scale-[0.98] cursor-pointer"
              style={{
                borderColor: selectedLanguage ? "#f0545c" : "#e5e7eb",
                background: selectedLanguage ? "rgba(240, 84, 92, 0.08)" : "#ffffff",
                color: selectedLanguage ? "#f0545c" : "#374151",
              }}
            >
              <Globe size={14} className={selectedLanguage ? "text-[#f0545c]" : "text-gray-400"} />
              <span>{selectedLanguage || "Language"}</span>
              <ChevronDown size={14} className={selectedLanguage ? "text-[#f0545c]" : "text-gray-400"} />
            </button>

            <FilterDropdown
              label="Show Timing"
              value={filterTime}
              options={["Morning", "Afternoon", "Evening", "Night"]}
              onChange={setFilterTime}
            />

            <FilterDropdown
              label="Price Range"
              value={filterPrice}
              options={PRICE_RANGES.map((r) => r.label)}
              onChange={setFilterPrice}
            />

            {/* Availability Legend */}
            <div className="hidden lg:flex items-center gap-5 ml-auto text-[11px] font-bold">
              <LegendDot color="#16a34a" bg="#f0fdf4" label="Available" />
              <LegendDot color="#d97706" bg="#fffbeb" label="Filling Fast" />
              <LegendDot color="#dc2626" bg="#fef2f2" label="Sold Out" />
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-[12px] font-bold px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-[#f0545c] transition-all ml-auto lg:ml-0"
              >
                <RotateCcw size={13} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* State Displays */}
        {!cityId && (
          <EmptyState
            icon={<MapPin size={28} className="text-[#f0545c]" />}
            title="Select your city"
            sub="Choose your city from the top bar to view cinemas and showtimes near you."
          />
        )}

        {cityId && loadingShows && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
            <Loader2 size={24} className="animate-spin text-[#f0545c]" />
            <span className="text-[14px] font-bold text-gray-600">Discovering showtimes near you…</span>
          </div>
        )}

        {cityId && !loadingShows && (
          filteredGroups.length === 0 ? (
            <EmptyState
              icon={<Ticket size={28} className="text-[#f0545c]" />}
              title="No shows scheduled"
              sub={hasActiveFilters
                ? "No showtimes match your current filters. Try resetting or selecting another time slot."
                : selectedDate === TODAY_KEY
                  ? `All${selectedLanguage ? ` ${selectedLanguage}` : ""} shows for today have concluded in ${cityName}. Check upcoming dates.`
                  : `No${selectedLanguage ? ` ${selectedLanguage}` : ""} shows currently scheduled for this date in ${cityName}.`}
              action={hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="mt-5 px-6 py-2.5 rounded-xl text-[13px] font-bold text-white shadow-md shadow-[#f0545c]/25 transition-transform active:scale-95 cursor-pointer"
                  style={{ background: "#f0545c" }}
                >
                  Clear Filters
                </button>
              )}
            />
          ) : (
            <div className="space-y-3.5">
              {filteredGroups.map((group) => (
                <TheatreCard
                  key={group.theatreId}
                  group={group}
                  movie={movie}
                  selectedDate={selectedDate}
                  selectedLanguage={selectedLanguage}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ── Modal for language preference selection ── */
function LanguageModal({ movie, languages, selectedLanguage, dismissible, onPick, onClose }) {
  const [selected, setSelected] = useState(selectedLanguage || languages[0] || "");

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center px-4"
      style={{ background: "rgba(0, 0, 0, 0.55)", backdropFilter: "blur(8px)" }}
    >
      <div className="bg-white rounded-3xl w-full max-w-[420px] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
        {dismissible && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <X size={16} />
          </button>
        )}

        <div className="px-6 pt-6 pb-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#f0545c] bg-red-50 px-2.5 py-1 rounded-md">
            <Globe size={11} /> Audio Format
          </span>
          <h2 className="text-[19px] font-black text-gray-900 leading-tight mt-2.5">
            {movie?.title || "Select Language"}
          </h2>
          <p className="text-[13px] text-gray-500 mt-0.5">Select your preferred audio &amp; subtitle experience</p>
        </div>

        <div className="px-6 py-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 overflow-hidden divide-y divide-gray-100 max-h-[280px] overflow-y-auto">
            {languages.map((lang, index) => {
              const active = selected === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelected(lang)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-all cursor-pointer ${
                    active ? "bg-red-50/70" : "hover:bg-gray-100/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span 
                      className={`w-6 h-6 rounded-full font-bold text-[12px] flex items-center justify-center flex-shrink-0 transition-all ${
                        active ? "bg-[#f0545c] text-white" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="text-[14px] font-bold text-gray-900">{lang}</span>
                  </div>

                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      active ? "border-[#f0545c]" : "border-gray-300"
                    }`}
                  >
                    {active && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f0545c]" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 pb-6 pt-1">
          <button
            type="button"
            onClick={() => selected && onPick(selected)}
            disabled={!selected}
            className="w-full py-3.5 rounded-2xl text-[14px] font-bold text-white shadow-lg shadow-[#f0545c]/25 hover:bg-[#e0454d] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            style={{ background: "#f0545c" }}
          >
            Confirm &amp; View Shows
          </button>
          {!dismissible && (
            <p className="text-[11px] text-gray-400 text-center mt-2.5">
              You can switch languages anytime using the filter bar above.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterDropdown({ label, value, options, onChange }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3.5 pr-8 py-2 text-[13px] font-bold border rounded-xl outline-none cursor-pointer transition-all"
        style={{
          borderColor: value ? "rgba(240,84,92,0.5)" : "#e5e7eb",
          color:       value ? "#f0545c" : "#374151",
          background:  value ? "rgba(240,84,92,0.06)" : "#ffffff",
        }}
      >
        <option value="">{label}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: value ? "#f0545c" : "#9ca3af" }} />
    </div>
  );
}

function LegendDot({ color, bg, label }) {
  return (
    <span className="flex items-center gap-1.5 text-gray-500">
      <span
        className="w-4 h-2 rounded-full flex-shrink-0"
        style={{ background: bg, border: `1.5px solid ${color}` }}
      />
      <span>{label}</span>
    </span>
  );
}

function TheatreCard({ group, movie, selectedDate, selectedLanguage }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);

  const byScreen = useMemo(() => {
    const map = new Map();
    group.slots.forEach((slot) => {
      if (!map.has(slot.screen)) map.set(slot.screen, []);
      map.get(slot.screen).push(slot);
    });
    return [...map.entries()];
  }, [group.slots]);

  const prices   = group.slots.map((s) => s.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const handleSlotClick = (slot) => {
    navigate(`/movie/${movie._id}/seats`, {
      state: {
        movie,
        showId:  slot.showId, slotId: slot.slotId,
        screen:  slot.screen, time:   slot.time,
        price:   slot.price,
        theatre: { id: group.theatreId, name: group.name, address: group.address },
        date:    selectedDate,
        language: slot.language || selectedLanguage || "",
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between px-5 py-4 cursor-pointer select-none" onClick={() => setExpanded((v) => !v)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-[16px] font-black text-gray-900 tracking-tight">{group.name}</h3>
            {group.locationLink && (
              <a
                href={group.locationLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#f0545c] hover:underline bg-red-50/70 px-2.5 py-0.5 rounded-full"
                onClick={(e) => e.stopPropagation()}
              >
                <Navigation size={10} /> Map &amp; Directions
              </a>
            )}
          </div>
          <p className="text-[12px] text-gray-400 mt-0.5 truncate max-w-[560px]">{group.address}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              ₹{minPrice}{minPrice !== maxPrice ? ` – ₹${maxPrice}` : ""}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">
              · {group.slots.length} showtime{group.slots.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-all flex-shrink-0 ml-4 cursor-pointer"
        >
          {expanded ? <Minus size={15} /> : <Plus size={15} />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-gray-50/30">
          {byScreen.map(([screenName, slots]) => (
            <div key={screenName}>
              <div className="flex items-center gap-2 mb-2.5">
                <Monitor size={12} className="text-gray-400" />
                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
                  {screenName}
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {slots.map((slot) => (
                  <SlotButton
                    key={slot.slotId}
                    slot={slot}
                    onClick={() => handleSlotClick(slot)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SlotButton({ slot, onClick }) {
  const [hov, setHov] = useState(false);

  const availability = "available";
  const isSoldOut    = availability === "sold_out";
  const isFast       = availability === "filling_fast";

  const time12           = fmt12(slot.time);
  const [timePart, ampm] = time12.split(" ");

  return (
    <button
      onClick={isSoldOut ? undefined : onClick}
      onMouseEnter={() => !isSoldOut && setHov(true)}
      onMouseLeave={() => setHov(false)}
      disabled={isSoldOut}
      title={isSoldOut ? "Sold Out" : `${slot.time} - ₹${slot.price}`}
      className={`inline-flex flex-col items-start px-3.5 py-2 rounded-xl border transition-all duration-150 flex-shrink-0 gap-0.5 cursor-pointer select-none ${
        isSoldOut
          ? "border-red-100 bg-red-50/50 opacity-60 cursor-not-allowed"
          : hov
          ? "border-[#f0545c] bg-white text-[#f0545c] shadow-md shadow-[#f0545c]/10 -translate-y-0.5"
          : "border-gray-200 bg-white hover:border-gray-300 text-gray-800"
      }`}
    >
      <span className="flex items-baseline gap-1">
        <span className={`text-[15px] font-extrabold leading-none ${hov ? "text-[#f0545c]" : "text-gray-900"}`}>
          {timePart}
        </span>
        <span className={`text-[9px] font-extrabold uppercase tracking-wider ${hov ? "text-[#f0545c]" : "text-gray-400"}`}>
          {ampm}
        </span>
      </span>

      <span className="text-[10px] font-bold text-gray-400 truncate max-w-[100px]">
        {isSoldOut ? "Sold Out" : isFast ? "Filling Fast" : `₹${slot.price}`}
      </span>
    </button>
  );
}

function EmptyState({ icon, title, sub, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-gray-100 p-8 shadow-xs">
      <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 bg-red-50 text-[#f0545c]">
        {icon}
      </div>
      <p className="text-[17px] font-black text-gray-900 tracking-tight">{title}</p>
      <p className="text-[13px] text-gray-500 mt-1 max-w-sm leading-relaxed">{sub}</p>
      {action}
    </div>
  );
}
