import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { getSelectedDistrict } from "./DistrictSelector";
import { IMG } from "../utils/eventHelpers";
import { ChevronRight, ChevronLeft, MapPin } from "lucide-react";

export default function PlayHome() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const sliderRef = useRef(null);
  const navigate = useNavigate();
  const district = getSelectedDistrict();

  const fetchVenues = useCallback(() => {
    if (!district.id) {
      setVenues([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get(`/play/venues?district=${district.id}`)
      .then((r) => setVenues((r.data || []).slice(0, 10)))
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  }, [district.id]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  useEffect(() => {
    const handler = () => fetchVenues();
    window.addEventListener("districtChanged", handler);
    return () => window.removeEventListener("districtChanged", handler);
  }, [fetchVenues]);

  const checkScroll = () => {
    const el = sliderRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 6);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
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
    sliderRef.current?.scrollBy({
      left: dir === "left" ? -720 : 720,
      behavior: "smooth",
    });

  if (loading) {
    return (
      <section className="w-full px-4 sm:px-8 md:px-12 py-8 md:py-10 bg-transparent">
        <div className="max-w-7xl mx-auto">
          <SectionHeader count={0} />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[200px] sm:w-[220px] animate-pulse">
                <div className="rounded-2xl bg-neutral-200 aspect-[4/3]" />
                <div className="mt-2.5 space-y-1.5">
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 rounded w-1/2" />
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
    <section className="w-full px-4 sm:px-8 md:px-12 py-8 md:py-10 bg-transparent relative">
      <div className="max-w-7xl mx-auto">
        <SectionHeader count={venues.length} onSeeAll={() => navigate("/play")} />

        <div className="relative group/slider">
          {canLeft && (
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="absolute -left-3 top-1/2 -translate-y-8 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-neutral-100 flex items-center justify-center text-neutral-700 hover:text-black hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          <div
            ref={sliderRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth"
          >
            {venues.map((v) => (
              <VenueCard
                key={v._id}
                venue={v}
                onClick={() => navigate(`/play/venues/${v._id}`)}
              />
            ))}
          </div>

          {canRight && (
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="absolute -right-3 top-1/2 -translate-y-8 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-neutral-100 flex items-center justify-center text-neutral-700 hover:text-black hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ count, onSeeAll }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
          Sports &amp; Play Arenas
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
          Courts and turfs available for instant slot booking
        </p>
      </div>
      {onSeeAll && (
        <button
          className="flex items-center gap-1 text-sm font-bold text-[#ff4d58] hover:text-[#e03d47] transition-colors group cursor-pointer"
          onClick={onSeeAll}
        >
          <span>See All</span>
          <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  );
}

function VenueCard({ venue, onClick }) {
  const activities = venue.courtActivities?.length
    ? venue.courtActivities
    : venue.activities || [];

  return (
    <div
      className="flex-shrink-0 w-[200px] sm:w-[220px] md:w-[240px] cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-xs transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1.5">
        {venue.images?.[0] ? (
          <img
            src={IMG(venue.images[0])}
            alt={venue.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400 text-xs font-semibold">
            {venue.name}
          </div>
        )}

        {venue.startingPrice != null && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2.5 pt-6 flex items-end">
            <span className="text-xs font-bold text-white">
              ₹{venue.startingPrice} <span className="font-normal text-[10px] text-white/80">onwards</span>
            </span>
          </div>
        )}
      </div>

      <div className="mt-2.5 px-0.5">
        <h3 className="text-sm font-bold text-neutral-900 truncate group-hover:text-[#ff4d58] transition-colors">
          {venue.name}
        </h3>
        <p className="text-xs text-neutral-500 mt-0.5 truncate flex items-center gap-1.5">
          <MapPin size={11} className="flex-shrink-0 text-neutral-400" />
          <span>{venue.district?.name || "Local District"}</span>
        </p>

        {activities.length > 0 && (
          <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
            {activities.map((a) => a.name).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}
