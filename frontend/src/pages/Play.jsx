import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import {
  Dumbbell, MapPin, SlidersHorizontal, X, Building2, Navigation, ChevronDown,
  Sparkles, Trophy,
} from "lucide-react";
import api from "../api/axiosInstance";
import Navbar, { getSelectedCity } from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";
import PageBackgroundWatermark from "../components/PageBackgroundWatermark";
import PageLoader from "../components/PageLoader";
import { IMG } from "../utils/eventHelpers";

const SORT_OPTIONS = [
  { id: "", label: "Recommended" },
  { id: "price", label: "Price: Low to High" },
  { id: "distance", label: "Nearest to Me" },
];

const TILE_TINTS = [
  { bg: "linear-gradient(145deg, #eafaf0 0%, #c9f0d8 100%)", fg: "#15803d" },
  { bg: "linear-gradient(145deg, #eef2ff 0%, #d8e0fe 100%)", fg: "#4338ca" },
  { bg: "linear-gradient(145deg, #fff1f2 0%, #ffe4e6 100%)", fg: "#e11d48" },
  { bg: "linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)", fg: "#b45309" },
  { bg: "linear-gradient(145deg, #f0fdfa 0%, #ccfbf1 100%)", fg: "#0f766e" },
];

const VENUES_PAGE_SIZE = 8;

export default function Play() {
  const navigate = useNavigate();
  const [city, setCity] = useState(getSelectedCity());

  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const [venues, setVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [venueError, setVenueError] = useState("");
  const [venuesShown, setVenuesShown] = useState(VENUES_PAGE_SIZE);
  const [activeSportIds, setActiveSportIds] = useState([]);
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
      () => {},
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
      .catch(() => setVenueError("Couldn't load sports venues. Please try again."))
      .finally(() => setLoadingVenues(false));
  }, [city.id, activeSportIds, sort, coords, under5km]);

  const visibleVenues = useMemo(() => venues.slice(0, venuesShown), [venues, venuesShown]);

  const goToSportVenues = (activity) => {
    navigate(`/play/venues?activity=${activity._id}&activityName=${encodeURIComponent(activity.name)}`);
  };

  const toggleSport = (id) => {
    setActiveSportIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-neutral-900 flex flex-col justify-between relative">
      <PageBackgroundWatermark variant="play" />
      {(loadingActivities && loadingVenues) && <PageLoader />}

      <div className="relative z-10">
        <Navbar />
        <BottomNav />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-24">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-extrabold uppercase tracking-widest mb-2 border border-emerald-500/20">
              <Dumbbell size={11} />
              <span>Court &amp; Turf Reservations</span>
            </div>
            <h1 className="text-[26px] sm:text-[34px] font-black tracking-tight text-gray-900 leading-tight">
              Play &amp; Sports Arenas
            </h1>
            <p className="text-[13.5px] text-gray-500 mt-1 font-medium">
              Book football turfs, badminton courts, cricket nets &amp; swimming slots in <span className="font-bold text-gray-800">{city.name || "your city"}</span>
            </p>
          </div>

          {!city.id ? (
            <div className="rounded-3xl border border-gray-100 bg-white flex flex-col items-center text-center px-6 py-16 shadow-2xs">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-red-50 text-[#f0545c]">
                <MapPin size={28} />
              </div>
              <p className="text-[17px] font-black text-gray-900 mb-1">Select a City to View Arenas</p>
              <p className="text-[13px] text-gray-400 max-w-sm">
                Choose your city from the location dropdown in the navigation bar to discover venues near you.
              </p>
            </div>
          ) : (
            <>
              {/* Explore Sports */}
              <div className="mb-10">
                <h2 className="text-[18px] sm:text-[20px] font-black tracking-tight text-gray-900 mb-4">
                  Explore by Sport
                </h2>

                {loadingActivities ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="rounded-2xl bg-gray-200 animate-pulse aspect-[0.9/1]" />
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <div className="rounded-3xl border border-gray-100 bg-white flex flex-col items-center text-center px-6 py-12 shadow-2xs">
                    <Dumbbell size={28} className="text-gray-300 mb-3" />
                    <p className="text-[14px] font-bold text-gray-500">No activities listed currently</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3.5">
                    {activities.map((a, i) => {
                      const IconComp = a.icon && Icons[a.icon] ? Icons[a.icon] : Dumbbell;
                      const tint = TILE_TINTS[i % TILE_TINTS.length];
                      return (
                        <button
                          key={a._id}
                          onClick={() => goToSportVenues(a)}
                          className="flex flex-col text-left bg-white rounded-2xl overflow-hidden active:scale-95 transition-all border border-gray-100 shadow-2xs hover:shadow-xl hover:-translate-y-1 group"
                          style={{ aspectRatio: "0.88/1" }}
                        >
                          <p className="text-[13px] font-black text-gray-900 leading-tight px-3.5 pt-3 pb-1 truncate">
                            {a.name}
                          </p>
                          <div className="flex-1 flex items-center justify-center p-3" style={{ background: tint.bg }}>
                            {a.image ? (
                              <img src={IMG(a.image)} alt={a.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <IconComp size={36} strokeWidth={1.8} style={{ color: tint.fg }} className="group-hover:scale-110 transition-transform" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* All Sports Venues */}
              <div id="all-sports-venues" className="mt-12 scroll-mt-24">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[18px] sm:text-[20px] font-black tracking-tight text-gray-900">
                    All Available Arenas &amp; Turfs
                  </h2>
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => setShowFilters(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200/90 text-[12.5px] font-bold flex-shrink-0 bg-white hover:bg-gray-50 shadow-2xs"
                  >
                    <SlidersHorizontal size={13} className="text-[#f0545c]" />
                    <span>Filter &amp; Sort</span>
                  </button>

                  <button
                    onClick={() => setUnder5km((v) => !v)}
                    disabled={!coords}
                    className={`px-4 py-2 rounded-full border text-[12.5px] font-bold flex-shrink-0 whitespace-nowrap transition-all shadow-2xs ${
                      under5km
                        ? "bg-[#f0545c] text-white border-[#f0545c]"
                        : "bg-white text-gray-700 border-gray-200/90 hover:border-gray-300"
                    } disabled:opacity-40`}
                  >
                    Under 5 km
                  </button>

                  {activities.slice(0, 6).map((a) => {
                    const active = activeSportIds.includes(a._id);
                    return (
                      <button
                        key={a._id}
                        onClick={() => toggleSport(a._id)}
                        className={`px-4 py-2 rounded-full border text-[12.5px] font-bold flex-shrink-0 whitespace-nowrap transition-all shadow-2xs ${
                          active
                            ? "bg-[#f0545c] text-white border-[#f0545c]"
                            : "bg-white text-gray-700 border-gray-200/90 hover:border-gray-300"
                        }`}
                      >
                        {a.name}
                      </button>
                    );
                  })}
                </div>

                {loadingVenues ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-5">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-56 rounded-3xl bg-gray-200 animate-pulse" />
                    ))}
                  </div>
                ) : venueError ? (
                  <p className="text-center text-[14px] font-bold text-red-500 py-10">{venueError}</p>
                ) : venues.length === 0 ? (
                  <div className="rounded-3xl border border-gray-100 bg-white flex flex-col items-center text-center px-6 py-16 shadow-2xs">
                    <Building2 size={32} className="text-gray-300 mb-3" />
                    <p className="text-[15px] font-black text-gray-700">No venues match your criteria</p>
                    <p className="text-[13px] text-gray-400 mt-1">Try resetting sport filters or changing district.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-5">
                      {visibleVenues.map((v) => (
                        <button
                          key={v._id}
                          onClick={() => navigate(`/play/venues/${v._id}`)}
                          className="flex flex-col text-left bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all group"
                        >
                          <div
                            className="w-full aspect-[4/3] relative overflow-hidden bg-gray-100"
                          >
                            <img
                              src={v.images?.[0] ? IMG(v.images[0]) : "/no-image.png"}
                              alt={v.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {v.startingPrice != null && (
                              <div
                                className="absolute bottom-0 left-0 right-0 px-3 py-1.5"
                                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)" }}
                              >
                                <span className="text-white font-black text-[11.5px]">₹{v.startingPrice} onwards</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="p-3.5">
                            <p className="text-[14px] font-black text-gray-900 truncate group-hover:text-[#f0545c] transition-colors">{v.name}</p>
                            <p className="text-[11.5px] font-medium text-gray-400 mt-0.5 truncate flex items-center gap-1">
                              <MapPin size={11} className="flex-shrink-0" />
                              {v.distanceKm != null && `${v.distanceKm.toFixed(1)} km · `}{v.district?.name || "Local Zone"}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2.5">
                              {(v.courtActivities?.length ? v.courtActivities : []).slice(0, 2).map((a) => (
                                <span
                                  key={a._id}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                                >
                                  {a.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {venuesShown < venues.length && (
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={() => setVenuesShown((n) => n + VENUES_PAGE_SIZE)}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-200/90 text-[13px] font-bold text-gray-700 bg-white hover:bg-gray-50 shadow-2xs hover:shadow-md transition-all active:scale-95"
                        >
                          <span>Load More Venues</span>
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div
          className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowFilters(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-6 max-h-[85vh] overflow-y-auto shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <p className="text-[17px] font-black text-gray-900">Filters &amp; Sort</p>
              <button
                onClick={() => setShowFilters(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">Order By</p>
            <div className="flex flex-col gap-1 mb-5">
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSort(o.id)}
                  disabled={o.id === "distance" && !coords}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-bold transition-all ${
                    sort === o.id
                      ? "bg-[#f0545c]/10 text-[#f0545c]"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{o.label}</span>
                  {o.id === "distance" && <Navigation size={13} className="text-gray-400" />}
                </button>
              ))}
            </div>

            <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">Sport Activities</p>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {activities.map((a) => {
                const active = activeSportIds.includes(a._id);
                return (
                  <button
                    key={a._id}
                    onClick={() => toggleSport(a._id)}
                    className={`px-3 py-1.5 rounded-full border text-[12px] font-bold transition-all ${
                      active
                        ? "bg-[#f0545c] text-white border-[#f0545c]"
                        : "bg-white text-gray-700 border-gray-200/90"
                    }`}
                  >
                    {a.name}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowFilters(false)}
              className="w-full py-3.5 rounded-2xl text-[14px] font-black text-white shadow-md shadow-[#f0545c]/30 hover:bg-[#d94048] transition-all"
              style={{ background: "#f0545c" }}
            >
              Apply ({venues.length} Arenas)
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
