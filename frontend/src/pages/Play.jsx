import Dialog from "../components/Dialog";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSportIcon } from "../utils/sportIcons";
import {
  Dumbbell, MapPin, IndianRupee, SlidersHorizontal, X, Building2, Navigation, ChevronDown,
} from "lucide-react";
import api from "../api/axiosInstance";
import Navbar, { getSelectedCity } from "../components/Navbar";
import { IMG, OUTFIT_IMPORT } from "../utils/eventHelpers";

const SORT_OPTIONS = [
  { id: "", label: "Recommended" },
  { id: "price", label: "Price: Low to High" },
  { id: "distance", label: "Nearest" },
];

// Cycled per-card tint for the sport tiles (icon panel background + icon
// color). District has bespoke 3D renders per sport; we don't have those
// image assets, so this approximates the same "labelled card, tinted art
// panel" layout with lucide icons instead.
const TILE_TINTS = [
  { bg: "linear-gradient(160deg,#eafaf0 0%,#d8f3e3 100%)", fg: "#1f9d55" },
  { bg: "linear-gradient(160deg,#eef1fb 0%,#dde2f6 100%)", fg: "#4a55c7" },
  { bg: "linear-gradient(160deg,#fdeeea 0%,#fbdcd4 100%)", fg: "#e0603f" },
  { bg: "linear-gradient(160deg,#fef6e6 0%,#fbebc6 100%)", fg: "#c98a1a" },
  { bg: "linear-gradient(160deg,#eaf6fb 0%,#d6eef8 100%)", fg: "#1c85ab" },
];

const VENUES_PAGE_SIZE = 8;

export default function Play() {
  const navigate = useNavigate();
  const [city, setCity] = useState(getSelectedCity());

  /* ── Explore Sports ── */
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  /* ── All Sports Venues ── */
  const [venues, setVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [venueError, setVenueError] = useState("");
  const [venuesShown, setVenuesShown] = useState(VENUES_PAGE_SIZE);
  const [activeSportIds, setActiveSportIds] = useState([]); // multi-select chip filter
  const [under5km, setUnder5km] = useState(false);
  const [sort, setSort] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    const onChange = () => setCity(getSelectedCity());
    window.addEventListener("cityChanged", onChange);
    return () => window.removeEventListener("cityChanged", onChange);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, // silently ignore — distance sort/filter just won't be available
      { timeout: 4000 }
    );
  }, []);

  useEffect(() => {
    setLoadingActivities(true);
    api.get("/play/activities")
      .then((r) => setActivities(r.data))
      .catch(() => setActivities([]))
      .finally(() => setLoadingActivities(false));
  }, []);

  useEffect(() => {
    if (!city.id) return;
    setLoadingVenues(true);
    setVenueError("");
    setVenuesShown(VENUES_PAGE_SIZE);
    const query = new URLSearchParams({ city: city.id });
    if (activeSportIds.length) query.set("activities", activeSportIds.join(","));
    if (sort) query.set("sort", sort);
    if (coords) { query.set("lat", coords.lat); query.set("lng", coords.lng); }
    if (under5km) query.set("maxDistanceKm", "5");

    api.get(`/play/venues?${query.toString()}`)
      .then((r) => setVenues(r.data))
      .catch(() => setVenueError("Couldn't load venues. Please try again."))
      .finally(() => setLoadingVenues(false));
  }, [city.id, activeSportIds, sort, coords, under5km]);

  const visibleVenues = useMemo(() => venues.slice(0, venuesShown), [venues, venuesShown]);

  const goToSportVenues = (activity) => {
    navigate(`/play/venues?activity=${activity._id}&activityName=${encodeURIComponent(activity.name)}`);
  };

  // Filters the "All Sports Venues" list below — separate from the Explore
  // Sports tiles above, which now navigate to a dedicated venues page instead.
  const toggleSport = (id) => {
    setActiveSportIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fafafb", fontFamily: "var(--now-ui-font)" }}>

      <Navbar />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 16px 40px" }}>
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900">Play</h1>
          <p className="text-[12.5px] text-gray-400 mt-0.5">Book courts &amp; turfs near you</p>
        </div>

        {!city.id ? (
          /* ── No city selected in the navbar yet ── */
          <div className="rounded-2xl border border-gray-100 bg-white flex flex-col items-center text-center px-6 py-14" style={{ borderRadius: 20 }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(16,101,121,0.08)" }}>
              <MapPin size={24} style={{ color: "#106579" }} />
            </div>
            <p className="text-[15px] font-bold text-gray-900 mb-1">Select a city to get started</p>
            <p className="text-[13px] text-gray-400 max-w-[260px]">
              Pick your city from the top of the page and we'll show you badminton courts, turfs, and more near you.
            </p>
          </div>
        ) : (
          <>
            {/* ══ Explore Sports ══ */}
            <h2 className="text-[17px] font-extrabold tracking-tight text-gray-900 mb-3">Explore Sports</h2>

            {loadingActivities ? (
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-gray-100 animate-pulse" style={{ aspectRatio: "0.82/1" }} />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white flex flex-col items-center text-center px-6 py-14" style={{ borderRadius: 20 }}>
                <Dumbbell size={28} style={{ color: "#d1d5db" }} className="mb-3" />
                <p className="text-[14px] font-semibold text-gray-400">No activities available yet</p>
                <p className="text-[12px] text-gray-400 mt-1">Check back soon — we're adding venues.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))" }}>
                  {activities.map((a, i) => {
                    const IconComp = getSportIcon(a.icon);
                    const tint = TILE_TINTS[i % TILE_TINTS.length];
                    return (
                      <button
                        key={a._id}
                        onClick={() => goToSportVenues(a)}
                        className="flex flex-col text-left bg-white rounded-2xl overflow-hidden active:scale-[0.96] transition-transform"
                        style={{
                          borderRadius: 18,
                          aspectRatio: "0.86/1",
                          border: "1px solid #ececef",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        }}
                      >
                        <p className="text-[13px] font-extrabold text-gray-900 leading-[1.15] px-3 pt-3 pb-1.5">
                          {a.name}
                        </p>
                        <div className="flex-1 flex items-center justify-center" style={{ background: tint.bg }}>
                          {a.image ? (
                            <img src={IMG(a.image)} alt={a.name} className="w-full h-full object-cover" />
                          ) : (
                            <IconComp size={38} strokeWidth={1.5} style={{ color: tint.fg }} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* ══ All Sports Venues ══ */}
            <h2 id="all-sports-venues" className="text-[17px] font-extrabold tracking-tight text-gray-900 mt-9 mb-3 scroll-mt-20">
              All Sports Venues
            </h2>

            {/* Filter chips */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[12.5px] font-semibold flex-shrink-0 bg-white"
                style={{ borderColor: "#e4e4e7", color: "#374151" }}
              >
                <SlidersHorizontal size={13} /> Filters
              </button>
              <button
                onClick={() => setUnder5km((v) => !v)}
                disabled={!coords}
                className="px-3.5 py-2 rounded-full border text-[12.5px] font-semibold flex-shrink-0 whitespace-nowrap disabled:opacity-40"
                style={under5km
                  ? { background: "rgba(16,101,121,0.08)", color: "#106579", borderColor: "rgba(16,101,121,0.3)" }
                  : { background: "#fff", color: "#6b7280", borderColor: "#e4e4e7" }}
              >
                Under 5 km
              </button>
              {activities.slice(0, 6).map((a) => {
                const active = activeSportIds.includes(a._id);
                return (
                  <button
                    key={a._id}
                    onClick={() => toggleSport(a._id)}
                    className="px-3.5 py-2 rounded-full border text-[12.5px] font-semibold flex-shrink-0 whitespace-nowrap"
                    style={active
                      ? { background: "rgba(16,101,121,0.08)", color: "#106579", borderColor: "rgba(16,101,121,0.3)" }
                      : { background: "#fff", color: "#6b7280", borderColor: "#e4e4e7" }}
                  >
                    {a.name}
                  </button>
                );
              })}
            </div>

            {loadingVenues ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-52 rounded-2xl bg-gray-100 animate-pulse" />)}
              </div>
            ) : venueError ? (
              <p className="text-center text-[13px] text-red-500 py-10">{venueError}</p>
            ) : venues.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white flex flex-col items-center text-center px-6 py-14">
                <Building2 size={28} style={{ color: "#d1d5db" }} className="mb-3" />
                <p className="text-[14px] font-semibold text-gray-500">No venues found</p>
                <p className="text-[12px] text-gray-400 mt-1">Try clearing a filter or a different district.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {visibleVenues.map((v) => (
                    <button
                      key={v._id}
                      onClick={() => navigate(`/play/venues/${v._id}`)}
                      className="flex flex-col text-left bg-white rounded-2xl overflow-hidden border border-gray-100 active:scale-[0.98] transition-transform"
                      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                    >
                      <div
                        className="w-full aspect-[4/3]"
                        style={{ background: v.images?.[0] ? `url(${IMG(v.images[0])}) center/cover` : "linear-gradient(135deg,#1c1c1c,#2d2d2d)" }}
                      />
                      <div className="p-3">
                        <p className="text-[13.5px] font-bold text-gray-900 truncate">{v.name}</p>
                        <p className="text-[11.5px] text-gray-400 mt-0.5 truncate flex items-center gap-1">
                          {v.distanceKm != null && `${v.distanceKm.toFixed(1)} km · `}{v.district?.name}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(v.courtActivities?.length ? v.courtActivities : []).slice(0, 2).map((a) => (
                            <span key={a._id} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#f3f4f6", color: "#6b7280" }}>
                              {a.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {venuesShown < venues.length && (
                  <div className="flex justify-center mt-5">
                    <button
                      onClick={() => setVenuesShown((n) => n + VENUES_PAGE_SIZE)}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border text-[13px] font-bold text-gray-700 bg-white active:scale-[0.97] transition-transform"
                      style={{ borderColor: "#e4e4e7" }}
                    >
                      Load more <ChevronDown size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Filters sheet: sort + full sport list + distance */}
      {showFilters && (
        <Dialog variant="sheet" label="Filter play venues" onDismiss={() => setShowFilters(false)}>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[15px] font-bold text-gray-900">Filters</p>
              <button aria-label="Close filters" className="grid size-10 place-items-center rounded-lg hover:bg-gray-50" onClick={() => setShowFilters(false)}><X size={18} className="text-gray-400" /></button>
            </div>

            <p className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wide mb-2">Sort by</p>
            <div className="flex flex-col gap-1 mb-4">
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSort(o.id)}
                  disabled={o.id === "distance" && !coords}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-[13.5px] font-medium disabled:opacity-40"
                  style={{ background: sort === o.id ? "rgba(16,101,121,0.06)" : "transparent", color: sort === o.id ? "#106579" : "#374151" }}
                >
                  {o.label}
                  {o.id === "distance" && <Navigation size={13} className="text-gray-300" />}
                </button>
              ))}
            </div>

            <p className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wide mb-2">Sport</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {activities.map((a) => {
                const active = activeSportIds.includes(a._id);
                return (
                  <button
                    key={a._id}
                    onClick={() => toggleSport(a._id)}
                    className="px-3 py-1.5 rounded-full border text-[12.5px] font-semibold"
                    style={active
                      ? { background: "rgba(16,101,121,0.08)", color: "#106579", borderColor: "rgba(16,101,121,0.3)" }
                      : { background: "#fff", color: "#6b7280", borderColor: "#e4e4e7" }}
                  >
                    {a.name}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowFilters(false)}
              className="w-full py-3 rounded-xl text-[13.5px] font-bold text-white"
              style={{ background: "#106579" }}
            >
              Show {venues.length} venue{venues.length === 1 ? "" : "s"}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}