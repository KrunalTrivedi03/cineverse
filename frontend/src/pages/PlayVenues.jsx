import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft, MapPin, IndianRupee, SlidersHorizontal, X, Building2, Navigation,
} from "lucide-react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import { getSelectedDistrict } from "../components/DistrictSelector";
import { IMG, OUTFIT_IMPORT } from "../utils/eventHelpers";

const SORT_OPTIONS = [
  { id: "", label: "Recommended" },
  { id: "price", label: "Price: Low to High" },
  { id: "distance", label: "Nearest" },
];

function VenueCard({ venue, navigate }) {
  return (
    <div
      onClick={() => navigate(`/play/venues/${venue._id}`)}
      className="cursor-pointer group bg-white rounded-2xl overflow-hidden border border-gray-100"
      style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/10", overflow: "hidden", background: "#eee" }}>
        {venue.images?.[0] ? (
          <img
            src={IMG(venue.images[0])}
            alt={venue.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full" style={{ background: "linear-gradient(135deg,#1c1c1c,#2d2d2d)" }} />
        )}

        {venue.distanceKm != null && (
          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
            <Navigation size={9} color="#fff" />
            <span className="text-[10px] font-bold text-white">{venue.distanceKm.toFixed(1)} km</span>
          </div>
        )}

        {venue.startingPrice != null && (
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.75))" }}>
            <span className="flex items-center text-[12.5px] font-extrabold text-white">
              <IndianRupee size={11} />{venue.startingPrice} <span className="ml-1 text-[10.5px] font-medium text-white/75">onwards</span>
            </span>
          </div>
        )}
      </div>

      <div className="p-3.5">
        <p className="text-[14px] font-bold text-gray-900 truncate">{venue.name}</p>
        <p className="text-[11.5px] text-gray-400 mt-1 flex items-center gap-1 truncate">
          <MapPin size={11} className="flex-shrink-0" /> {venue.address ? `${venue.address}, ` : ""}{venue.district?.name}
        </p>
        {venue.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {venue.amenities.slice(0, 3).map((a) => (
              <span key={a} className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: "#f3f4f6", color: "#6b7280" }}>{a}</span>
            ))}
            {venue.amenities.length > 3 && (
              <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: "#f3f4f6", color: "#9ca3af" }}>+{venue.amenities.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlayVenues() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const activityId = params.get("activity");
  const activityName = params.get("activityName") || "Venues";

  const district = getSelectedDistrict();

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, // silently ignore — distance sort just won't be available
      { timeout: 4000 }
    );
  }, []);

  useEffect(() => {
    if (!activityId || !district.id) return;
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ district: district.id, activity: activityId });
    if (sort) query.set("sort", sort);
    if (coords) { query.set("lat", coords.lat); query.set("lng", coords.lng); }

    api.get(`/play/venues?${query.toString()}`)
      .then((r) => setVenues(r.data))
      .catch(() => setError("Couldn't load venues. Please try again."))
      .finally(() => setLoading(false));
  }, [activityId, district.id, sort, coords]);

  const grouped = useMemo(() => venues, [venues]);

  if (!activityId || !district.id) {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f7f8", fontFamily: "'Outfit', sans-serif" }}>
        <style>{OUTFIT_IMPORT}</style>
        <Navbar />
        <BottomNav />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <p className="text-[14px] font-semibold text-gray-500 mb-4">Select a district and activity first.</p>
          <button onClick={() => navigate("/play")} className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white" style={{ background: "#f0545c" }}>
            Go to Play
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f8", fontFamily: "'Outfit', sans-serif" }}>
      <style>{OUTFIT_IMPORT}</style>
      <Navbar />
      <BottomNav />

      {/* Sticky header, matches DistrictEvents pattern */}
      <div className="bg-white border-b border-gray-200 sticky top-[60px] z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/play")}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0">
            <ChevronLeft size={16} />
          </button>
          <div className="min-w-0">
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111" }} className="truncate">{activityName}</h1>
            <p className="text-[11.5px] text-gray-400 flex items-center gap-1"><MapPin size={11} /> {district.name}</p>
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="ml-auto flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[12.5px] font-semibold flex-shrink-0"
            style={{ borderColor: "#e5e7eb", color: "#374151", background: "#fff" }}
          >
            <SlidersHorizontal size={13} /> Sort
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        {/* Sort chips */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {SORT_OPTIONS.filter((o) => o.id).map((o) => (
            <button
              key={o.id}
              onClick={() => setSort(sort === o.id ? "" : o.id)}
              disabled={o.id === "distance" && !coords}
              className="px-3.5 py-2 rounded-full border text-[12.5px] font-semibold flex-shrink-0 whitespace-nowrap disabled:opacity-40"
              style={sort === o.id
                ? { background: "rgba(240,84,92,0.08)", color: "#f0545c", borderColor: "rgba(240,84,92,0.3)" }
                : { background: "#fff", color: "#6b7280", borderColor: "#e5e7eb" }}
            >
              {o.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-2xl bg-gray-100 animate-pulse" style={{ aspectRatio: "16/13" }} />)}
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
                  style={{ background: sort === o.id ? "rgba(240,84,92,0.06)" : "transparent", color: sort === o.id ? "#f0545c" : "#374151" }}
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