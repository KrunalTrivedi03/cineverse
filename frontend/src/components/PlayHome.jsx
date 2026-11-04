import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import api from "../api/axiosInstance";
import { getSelectedDistrict } from "./DistrictSelector";
import { IMG } from "../utils/eventHelpers";
import { ChevronRight, ChevronLeft, MapPin, Dumbbell, Trophy, Sparkles } from "lucide-react";

export default function PlayHome() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const sliderRef = useRef(null);
  const navigate = useNavigate();
  const district = getSelectedDistrict();

  const fetchVenues = useCallback(() => {
    if (!district.id) { setVenues([]); setLoading(false); return; }
    setLoading(true);
    api.get(`/play/venues?district=${district.id}`)
      .then((r) => setVenues((r.data || []).slice(0, 10)))
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  }, [district.id]);

  useEffect(() => { fetchVenues(); }, [fetchVenues]);

  useEffect(() => {
    const handler = () => fetchVenues();
    window.addEventListener("districtChanged", handler);
    return () => window.removeEventListener("districtChanged", handler);
  }, [fetchVenues]);

  const checkScroll = () => {
    const el = sliderRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [venues]);

  const scroll = (dir) =>
    sliderRef.current?.scrollBy({ left: dir === "left" ? -880 : 880, behavior: "smooth" });

  if (loading) {
    return (
      <section className="w-full px-4 sm:px-8 md:px-14 py-10 md:py-14 bg-[#f8fafc] border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <SectionHeader count={0} />
          <div className="flex gap-5 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[210px] sm:w-[230px] animate-pulse">
                <div className="rounded-2xl bg-gray-200" style={{ aspectRatio: "4/3" }} />
                <div className="mt-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (venues.length === 0) return null;

  return (
    <section className="w-full px-4 sm:px-8 md:px-14 py-10 md:py-14 bg-[#f8fafc] border-b border-gray-100">
      <div className="max-w-7xl mx-auto">
        <SectionHeader count={venues.length} onSeeAll={() => navigate("/play")} />

        <div className="relative group/slider">
          {canLeft && <ArrowBtn dir="left" onClick={() => scroll("left")} style={{ left: -18, top: "42%" }} />}
          <div
            ref={sliderRef}
            className="flex gap-5 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth"
          >
            {venues.map((v) => (
              <VenueCard key={v._id} venue={v} onClick={() => navigate(`/play/venues/${v._id}`)} />
            ))}
          </div>
          {canRight && <ArrowBtn dir="right" onClick={() => scroll("right")} style={{ right: -18, top: "42%" }} />}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ count, onSeeAll }) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-extrabold uppercase tracking-widest mb-2 border border-emerald-500/20">
          <Dumbbell size={12} />
          <span>Turfs &amp; Arenas</span>
        </div>
        <h2 className="text-[22px] sm:text-[26px] font-black text-gray-900 tracking-tight">
          Sports &amp; Play Arenas
        </h2>
        {count > 0 && (
          <p className="text-[13px] text-gray-500 mt-1 font-medium">
            {count} court{count !== 1 ? "s" : ""} &amp; recreational venue{count !== 1 ? "s" : ""} ready for booking
          </p>
        )}
      </div>
      {onSeeAll && (
        <button
          className="flex items-center gap-1 text-[#f0545c] hover:text-[#d94048] text-[13.5px] font-bold group transition-all"
          onClick={onSeeAll}
        >
          <span>Explore All Sports</span>
          <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
        </button>
      )}
    </div>
  );
}

function VenueCard({ venue, onClick }) {
  const activities = venue.courtActivities?.length ? venue.courtActivities : (venue.activities || []);
  return (
    <div
      className="flex-shrink-0 w-[220px] sm:w-[240px] cursor-pointer group card-hover-lift"
      onClick={onClick}
    >
      <div
        className="relative rounded-2xl overflow-hidden bg-gray-100 shadow-md group-hover:shadow-2xl transition-all duration-300 border border-gray-100"
        style={{ aspectRatio: "4/3" }}
      >
        {venue.images?.[0] ? (
          <img
            src={IMG(venue.images[0])}
            alt={venue.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-900 to-slate-900">
            <Dumbbell size={28} className="text-white/40" />
          </div>
        )}

        {/* Pricing tag */}
        {venue.startingPrice != null && (
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 px-3 py-2"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)" }}
          >
            <span className="text-white font-black text-[12.5px]">
              ₹{venue.startingPrice} onwards
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 px-1">
        <h3 className="text-[14.5px] font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-[#f0545c] transition-colors">
          {venue.name}
        </h3>
        <p className="text-[12px] font-medium text-gray-400 mt-0.5 flex items-center gap-1 truncate">
          <MapPin size={11} className="flex-shrink-0" /> {venue.district?.name || "Local District"}
        </p>
        {activities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {activities.slice(0, 2).map((a) => {
              const IconComp = a.icon && Icons[a.icon] ? Icons[a.icon] : Trophy;
              return (
                <span
                  key={a._id}
                  className="flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                >
                  <IconComp size={10} /> {a.name}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ArrowBtn({ dir, onClick, style }) {
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      className="absolute z-10 w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-lg flex items-center justify-center text-gray-700 hover:text-white hover:bg-[#f0545c] hover:border-[#f0545c] transition-all transform hover:scale-110 active:scale-95"
      style={{ ...style, transform: "translateY(-50%)" }}
      aria-label={dir === "left" ? "Previous" : "Next"}
    >
      {dir === "left" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  );
}
