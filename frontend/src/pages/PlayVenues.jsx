import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft, SlidersHorizontal, X, Building2, Navigation,
} from "lucide-react";
import api from "../api/axiosInstance";
import Navbar, { getSelectedCity } from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import { IMG, OUTFIT_IMPORT } from "../utils/eventHelpers";

const SORT_OPTIONS = [
  { id: "", label: "Recommended" },
  { id: "price", label: "Price: Low to High" },
  { id: "distance", label: "Nearest" },
];

function VenueCard({ venue, navigate }) {
  const tags = venue.courtActivities?.length ? venue.courtActivities : (venue.amenities || []);
  return (
    <button
      onClick={() => navigate(`/play/venues/${venue._id}`)}
      className="text-left w-full bg-white rounded-2xl overflow-hidden border border-gray-100 active:scale-[0.98] transition-transform"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className="w-full aspect-[4/3] overflow-hidden" style={{ background: "#eee" }}>
        {venue.images?.[0] ? (
          <img src={IMG(venue.images[0])} alt={venue.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: "linear-gradient(135deg,#1c1c1c,#2d2d2d)" }} />
        )}
      </div>

      <div className="p-3.5">
        <p className="text-[14.5px] font-bold text-gray-900 truncate">{venue.name}</p>
        <p className="text-[12px] text-gray-400 mt-0.5 truncate">
          {venue.distanceKm != null && `${venue.distanceKm.toFixed(1)} km · `}{venue.district?.name}
        </p>
        {tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {tags.slice(0, 3).map((t, i) => (
              <span key={t._id || t || i} className="text-[10.5px] font-semibold px-2 py-1 rounded-full" style={{ background: "#f3f4f6", color: "#6b7280" }}>
                {t.name || t}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[10.5px] font-semibold px-2 py-1 rounded-full" style={{ background: "#f3f4f6", color: "#9ca3af" }}>+{tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

export default function PlayVenues() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const activityId = params.get("activity");
  const activityName = params.get("activityName") || "Venues";

  const city = getSelectedCity();

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [coords, setCoords] = useState(null);
  const [under5km, setUnder5km] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, // silently ignore — distance sort just won't be available
      { timeout: 4000 }
    );
  }, []);

  useEffect(() => {
    if (!activityId || !city.id) return;
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ city: city.id, activity: activityId });
    if (sort) query.set("sort", sort);
    if (coords) { query.set("lat", coords.lat); query.set("lng", coords.lng); }
    if (under5km) query.set("maxDistanceKm", "5");

    api.get(`/play/venues?${query.toString()}`)
      .then((r) => setVenues(r.data))
      .catch(() => setError("Couldn't load venues. Please try again."))
      .finally(() => setLoading(false));
  }, [activityId, city.id, sort, coords, under5km]);

  const grouped = useMemo(() => venues, [venues]);

  if (!activityId || !city.id) {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f7f8", fontFamily: "'Outfit', sans-serif" }}>

        <Navbar />
        <BottomNav />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <p className="text-[14px] font-semibold text-gray-500 mb-4">Select a city from the navbar and an activity first.</p>
          <button onClick={() => navigate("/play")} className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white" style={{ background: "#106579" }}>
            Go to Play
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f8", fontFamily: "'Outfit', sans-serif" }}>

      <Navbar />
      <BottomNav />

      {/* Header — matches screenshot: back + title, then Filters / Under 5 km chips */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/play")}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0">
            <ChevronLeft size={16} />
          </button>
          <h1 className="text-[20px] sm:text-[22px] font-extrabold tracking-tight text-gray-900 truncate">
            {activityName} Courts in {city.name}
          </h1>
        </div>

        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
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
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 pb-6">
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-2xl bg-gray-100 animate-pulse" style={{ aspectRatio: "4/3.6" }} />)}
          </div>
        ) : error ? (
          <p className="text-center text-[13px] text-red-500 py-10">{error}</p>
        ) : grouped.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white flex flex-col items-center text-center px-6 py-14">
            <Building2 size={28} style={{ color: "#d1d5db" }} className="mb-3" />
            <p className="text-[14px] font-semibold text-gray-500">No venues found nearby</p>
            <p className="text-[12px] text-gray-400 mt-1">Try a different district or check back soon.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {grouped.map((v) => <VenueCard key={v._id} venue={v} navigate={navigate} />)}
          </div>
        )}
      </div>

      {/* Sort modal (mobile-friendly bottom sheet) */}
      {showFilters && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setShowFilters(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[15px] font-bold text-gray-900">Sort by</p>
              <button onClick={() => setShowFilters(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="flex flex-col gap-1">
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => { setSort(o.id); setShowFilters(false); }}
                  disabled={o.id === "distance" && !coords}
                  className="flex items-center justify-between px-3 py-3 rounded-xl text-[13.5px] font-medium disabled:opacity-40"
                  style={{ background: sort === o.id ? "rgba(16,101,121,0.06)" : "transparent", color: sort === o.id ? "#106579" : "#374151" }}
                >
                  {o.label}
                  {o.id === "distance" && <Navigation size={13} className="text-gray-300" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}