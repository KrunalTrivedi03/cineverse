import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getSportIcon } from "../utils/sportIcons";
import api from "../api/axiosInstance";
import { getSelectedDistrict } from "./DistrictSelector";
import { IMG } from "../utils/eventHelpers";
import { ChevronRight, ChevronLeft, MapPin, Dumbbell, Trophy } from "lucide-react";

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
      <section className="w-full px-6 md:px-14 py-10 bg-white border-t border-gray-100">
        <SectionHeader count={0} />
        <div className="flex gap-4 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[220px] animate-pulse">
              <div className="rounded-2xl bg-gray-100" style={{ aspectRatio: "4/3" }} />
              <div className="mt-2.5 space-y-2">
                <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // No district selected, or nothing to show for it — no static filler.
  if (venues.length === 0) return null;

  return (
    <section className="w-full px-6 md:px-14 py-10 bg-white border-t border-gray-100">
      <SectionHeader count={venues.length} onSeeAll={() => navigate("/play")} />

      <div className="relative">
        {canLeft && <ArrowBtn dir="left" onClick={() => scroll("left")} style={{ left: -16, top: "38%" }} />}
        <div
          ref={sliderRef}
          className="flex gap-4 overflow-x-auto pb-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {venues.map((v) => (
            <VenueCard key={v._id} venue={v} onClick={() => navigate(`/play/venues/${v._id}`)} />
          ))}
        </div>
        {canRight && <ArrowBtn dir="right" onClick={() => scroll("right")} style={{ right: -16, top: "38%" }} />}
      </div>
    </section>
  );
}

function SectionHeader({ count, onSeeAll }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-4.5 h-4.5 rounded-full flex items-center justify-center" style={{ background: "rgba(240,84,92,0.12)" }}>
            <Dumbbell size={10} style={{ color: "#f0545c" }} />
          </span>
          <p className="text-[10.5px] font-bold uppercase tracking-widest" style={{ color: "#f0545c" }}>
            Get moving
          </p>
        </div>
        <h2 className="text-[20px] md:text-[22px] font-black text-gray-900 tracking-tight" style={{ letterSpacing: "-0.02em" }}>
          Upcoming Plays
        </h2>
        {count > 0 && <p className="text-[13px] text-gray-400 mt-0.5">{count} venue{count !== 1 ? "s" : ""} near you</p>}
      </div>
      {onSeeAll && (
        <button
          className="flex items-center gap-0.5 text-[#f0545c] text-[13px] font-semibold hover:underline transition-all flex-shrink-0"
          onClick={onSeeAll}
        >
          See All <ChevronRight size={15} />
        </button>
      )}
    </div>
  );
}

function VenueCard({ venue, onClick }) {
  const activities = venue.courtActivities?.length ? venue.courtActivities : (venue.activities || []);
  return (
    <div className="flex-shrink-0 w-[220px] cursor-pointer group snap-start" onClick={onClick}>
      <div className="relative rounded-2xl overflow-hidden bg-gray-100 shadow-sm transition-shadow group-hover:shadow-lg" style={{ aspectRatio: "4/3" }}>
        {venue.images?.[0] ? (
          <img
            src={IMG(venue.images[0])}
            alt={venue.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1c1c1c,#2d2d2d)" }}>
            <Dumbbell size={26} className="text-white/30" />
          </div>
        )}

        {venue.startingPrice != null && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 px-3 py-2"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)" }}>
            <span className="text-white font-bold text-[12px]">₹{venue.startingPrice} onwards</span>
          </div>
        )}
      </div>

      <div className="mt-2.5 px-0.5">
        <h3 className="text-[14px] font-bold text-gray-900 leading-tight line-clamp-1 group-hover:text-[#f0545c] transition-colors">
          {venue.name}
        </h3>
        <p className="text-[11.5px] text-gray-400 mt-0.5 flex items-center gap-1 truncate">
          <MapPin size={10} className="flex-shrink-0" /> {venue.district?.name}
        </p>
        {activities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {activities.slice(0, 2).map((a) => {
              const IconComp = getSportIcon(a.icon);
              return (
                <span key={a._id} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(240,84,92,0.08)", color: "#c0353b" }}>
                  <IconComp size={9} /> {a.name}
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
      className="absolute z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:border-gray-400 hover:shadow-lg transition-all"
      style={{ ...style, transform: "translateY(-50%)" }}
    >
      {dir === "left" ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
    </button>
  );
}
