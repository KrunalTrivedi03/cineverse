import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import {
  MapPin, ChevronLeft, Star, X, Ticket, Calendar,
  Building2, Monitor, Loader2, IndianRupee, ExternalLink,
  Plus, Minus, RotateCcw, ChevronDown, Clock,
} from "lucide-react";

const IMG = (path) => `http://localhost:5000${path}`;

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

/* ── Is a slot in the past? ──
   Only applies when selectedDate === today.
   A show is considered "past" if its start time has already passed.
   We add a small buffer (0 min) — adjust if you want "no booking within 30 min". */
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

  /* ── Live clock: re-render every minute so "past" state stays accurate ── */
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  /* ── Data fetching ── */
  useEffect(() => { api.get(`/movies/${id}`).then((r) => setMovie(r.data)); }, [id]);

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

  useEffect(() => {
    if (!cityId || !id) return;
    setLoadingShows(true);
    api.get(`/shows/city/${cityId}/movie/${id}`)
      .then((r) => setShows(r.data))
      .catch(() => setShows([]))
      .finally(() => setLoadingShows(false));
  }, [cityId, id]);

  useEffect(() => {
    const h = () => {
      const nid  = localStorage.getItem("selectedCityId") || "";
      const nnam = localStorage.getItem("selectedCity")   || "";
      if (!nid && nnam) {
        api.get("/cities").then((r) => {
          const m = r.data.find((c) => c.name.toLowerCase() === nnam.toLowerCase());
          if (m) { localStorage.setItem("selectedCityId", m._id); setCityId(m._id); setCityName(m.name); }
        }).catch(() => {});
      } else { setCityId(nid); setCityName(nnam); }
    };
    window.addEventListener("cityChanged", h);
    return () => window.removeEventListener("cityChanged", h);
  }, []);

  /* ── Group shows → theatreGroups ── */
  const theatreGroups = useMemo(() => {
    const dateShows = shows.filter((s) => localDateKey(new Date(s.showDate)) === selectedDate);
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
      }));
    });
    const groups = [...map.values()];
    groups.forEach((g) => g.slots.sort((a, b) => a.time.localeCompare(b.time)));
    return groups;
  }, [shows, selectedDate]);

  /* ── Apply filters + past-show removal ── */
  const filteredGroups = useMemo(() => {
    return theatreGroups
      .filter((g) => !searchCinema || g.name.toLowerCase().includes(searchCinema.toLowerCase()))
      .map((g) => ({
        ...g,
        slots: g.slots.filter((sl) => {
          // Remove (not just disable) past slots entirely
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
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="flex gap-2">
        {[0,1,2].map((i) => (
          <span key={i} className="w-2.5 h-2.5 rounded-full bg-[#f0545c] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f5", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
      `}</style>
      <Navbar />

      {/* ── Movie info bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-[60px] z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all flex-shrink-0">
            <ChevronLeft size={16} />
          </button>
          {movie.poster && (
            <img src={IMG(movie.poster)} alt={movie.title}
              className="w-9 h-[52px] object-cover rounded-lg flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-bold text-gray-900 truncate">{movie.title}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {movie.rating && <>
                <Star size={11} fill="#f0545c" className="text-[#f0545c]" />
                <span className="text-[12px] font-semibold text-gray-600">{movie.rating}/10</span>
              </>}
              {movie.certificate && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 text-gray-500">
                  {movie.certificate}
                </span>
              )}
              {movie.genre    && <span className="text-[12px] text-gray-400">{movie.genre}</span>}
              {movie.duration && <span className="text-[12px] text-gray-400">{movie.duration} min</span>}
            </div>
          </div>
          {cityName && (
            <div className="hidden md:flex items-center gap-1 text-[13px] font-medium text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg flex-shrink-0">
              <MapPin size={13} className="text-[#f0545c]" />
              {cityName}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-5">

        {/* ── Date strip ── */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <Calendar size={15} className="text-gray-400 flex-shrink-0" />
          {DATES.map((d) => {
            const active = selectedDate === d.key;
            return (
              <button key={d.key} onClick={() => setSelectedDate(d.key)}
                className="flex-shrink-0 flex flex-col items-center py-2 px-3 rounded-lg border text-center transition-all min-w-[64px]"
                style={active
                  ? { background: "#f0545c", borderColor: "#f0545c", color: "#fff" }
                  : { background: "white", borderColor: "#e5e7eb", color: "#374151" }}>
                <span className="text-[9px] font-semibold uppercase tracking-wide opacity-80">{d.day}</span>
                <span className="text-[18px] font-bold leading-none my-0.5">{d.date}</span>
                <span className="text-[9px] font-medium opacity-75">{d.month}</span>
              </button>
            );
          })}
        </div>

        {/* ── Filter toolbar ── */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 flex-1 min-w-[160px] max-w-[260px]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" placeholder="Search for cinema"
                value={searchCinema} onChange={(e) => setSearchCinema(e.target.value)}
                className="flex-1 text-[13px] text-gray-700 bg-transparent outline-none placeholder-gray-400" />
              {searchCinema && <button onClick={() => setSearchCinema("")}><X size={12} className="text-gray-400" /></button>}
            </div>

            <FilterDropdown label="Show Timing" value={filterTime}
              options={["Morning", "Afternoon", "Evening", "Night"]} onChange={setFilterTime} />

            <FilterDropdown label="Price Range" value={filterPrice}
              options={PRICE_RANGES.map((r) => r.label)} onChange={setFilterPrice} />

            {/* Legend */}
            <div className="hidden md:flex items-center gap-4 ml-auto text-[11px] font-semibold">
              <LegendDot color="#16a34a" bg="#f0fdf4" label="Available" />
              <LegendDot color="#d97706" bg="#fffbeb" label="Filling Fast" />
              <LegendDot color="#dc2626" bg="#fef2f2" label="Sold Out" />
            </div>

            {hasActiveFilters && (
              <button onClick={resetFilters}
                className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-red-500 transition-all ml-auto md:ml-0">
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* ── No city ── */}
        {!cityId && (
          <EmptyState icon={<MapPin size={26} style={{ color: "#f0545c", opacity: 0.5 }} />}
            title="Select a city" sub="Choose your city from the top bar to see available shows" />
        )}

        {/* ── Loading ── */}
        {cityId && loadingShows && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin" style={{ color: "#f0545c" }} />
            <span className="text-[14px] font-medium">Loading shows…</span>
          </div>
        )}

        {/* ── Results ── */}
        {cityId && !loadingShows && (
          filteredGroups.length === 0 ? (
            <EmptyState icon={<Ticket size={26} style={{ color: "#f0545c", opacity: 0.4 }} />}
              title="No shows available"
              sub={hasActiveFilters
                ? "Try adjusting your filters"
                : selectedDate === TODAY_KEY
                  ? `All shows for today have ended in ${cityName}`
                  : `No shows scheduled for this date in ${cityName}`}
              action={hasActiveFilters && (
                <button onClick={resetFilters}
                  className="mt-4 px-5 py-2 rounded-lg text-[13px] font-semibold text-white"
                  style={{ background: "#f0545c" }}>
                  Reset Filters
                </button>
              )}
            />
          ) : (
            <div className="space-y-2">
              {filteredGroups.map((group) => (
                <TheatreCard
                  key={group.theatreId}
                  group={group}
                  movie={movie}
                  selectedDate={selectedDate}
                />
              ))}
            </div>
          )
        )}
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
        className="appearance-none pl-3 pr-8 py-2 text-[13px] font-semibold border rounded-lg outline-none cursor-pointer transition-all"
        style={{
          borderColor: value ? "rgba(240,84,92,0.5)" : "#e5e7eb",
          color:       value ? "#f0545c" : "#374151",
          background:  value ? "rgba(240,84,92,0.04)" : "white",
        }}>
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
        className="w-6 h-2 rounded-full flex-shrink-0"
        style={{ background: bg, border: `1.5px solid ${color}` }}
      />
      {label}
    </span>
  );
}

function TheatreCard({ group, movie, selectedDate }) {
  const navigate   = useNavigate();
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
      },
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] font-bold text-gray-900">{group.name}</h3>
            {group.locationLink && (
              <a href={group.locationLink} target="_blank" rel="noreferrer"
                className="flex items-center gap-0.5 text-[11px] font-semibold text-[#f0545c] hover:underline"
                onClick={(e) => e.stopPropagation()}>
                <MapPin size={11} /> Directions
              </a>
            )}
          </div>
          <p className="text-[12px] text-gray-400 mt-0.5 truncate max-w-[560px]">{group.address}</p>
          <p className="text-[11px] font-semibold mt-1" style={{ color: "#059669" }}>
            ₹{minPrice}{minPrice !== maxPrice ? ` – ₹${maxPrice}` : ""}
          </p>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-all flex-shrink-0 ml-4">
          {expanded ? <Minus size={14} /> : <Plus size={14} />}
        </button>
      </div>

      {/* Slots */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-5">
          {byScreen.map(([screenName, slots]) => (
            <div key={screenName}>
              <div className="flex items-center gap-2 mb-3">
                <Monitor size={11} className="text-gray-300" />
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                  {screenName}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <SlotButton
                    key={slot.slotId}
                    slot={slot}
                    selectedDate={selectedDate}
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

function SlotButton({ slot, selectedDate, onClick }) {
  const [hov, setHov] = useState(false);

  const availability = "available";
  const isSoldOut    = availability === "sold_out";
  const isFast       = availability === "filling_fast";

  const time12           = fmt12(slot.time);
  const [timePart, ampm] = time12.split(" ");

  const scheme = {
    available: {
      border:    hov ? "#f0545c" : "#adafb1",
      bg:        hov ? "#fff8f8" : "#fff",
      timeColor: hov ? "#f0545c" : "#111",
      ampmColor: hov ? "#f0545c" : "#9ca3af",
      subColor:  hov ? "#f0545c" : "#d1d5db",
    },
    filling_fast: {
      border:    hov ? "#b45309" : "#fde68a",
      bg:        hov ? "#fffbeb" : "#fffdf5",
      timeColor: "#92400e",
      ampmColor: "#d97706",
      subColor:  "#d97706",
      shadow:    "none",
    },
    sold_out: {
      border:    "#fecaca",
      bg:        "#fef2f2",
      timeColor: "#fca5a5",
      ampmColor: "#fca5a5",
      subColor:  "#fca5a5",
      shadow:    "none",
    },
  }[availability];

  return (
    <button
      onClick={isSoldOut ? undefined : onClick}
      onMouseEnter={() => !isSoldOut && setHov(true)}
      onMouseLeave={() => setHov(false)}
      disabled={isSoldOut}
      title={isSoldOut ? "Sold Out" : slot.time}
      style={{
        display:        "inline-flex",
        flexDirection:  "column",
        alignItems:     "flex-start",
        padding:        "7px 15px",
        borderRadius:    5,
        border:         `1px solid ${scheme.border}`,
        background:      scheme.bg,
        cursor:          isSoldOut ? "not-allowed" : "pointer",
        transition:      "all 0.12s ease",
        opacity:         isSoldOut ? 0.6 : 1,
        transform:       hov && !isSoldOut ? "translateY(-1px)" : "none",
        boxShadow:       scheme.shadow,
        flexShrink:      0,
        gap:             3,
      }}
    >
      {/* Time + AM/PM inline */}
      <span style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span style={{
          fontSize:      15,
          fontWeight:    700,
          color:         scheme.timeColor,
          letterSpacing: "-0.3px",
          lineHeight:    1,
        }}>
          {timePart}
        </span>
        <span style={{
          fontSize:      9,
          fontWeight:    700,
          color:         scheme.ampmColor,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}>
          {ampm}
        </span>
      </span>

      {/* Screen / status */}
      <span style={{
        fontSize:      9,
        fontWeight:    600,
        color:         isSoldOut ? "#fca5a5" : isFast ? "#d97706" : scheme.subColor,
        letterSpacing: "0.03em",
        maxWidth:       90,
        overflow:       "hidden",
        textOverflow:   "ellipsis",
        whiteSpace:     "nowrap",
      }}>
        {isSoldOut ? "Sold Out" : isFast ? "Filling Fast" : slot.screen}
      </span>
    </button>
  );
}

function EmptyState({ icon, title, sub, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "rgba(240,84,92,0.07)" }}>
        {icon}
      </div>
      <p className="text-[16px] font-bold text-gray-400">{title}</p>
      <p className="text-[13px] text-gray-300 mt-1 max-w-xs">{sub}</p>
      {action}
    </div>
  );
}