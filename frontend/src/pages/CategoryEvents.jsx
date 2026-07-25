import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, SlidersHorizontal } from "lucide-react";
import api from "../api/axiosInstance";
import Navbar, { getSelectedCity } from "../components/Navbar";
import { getSelectedDistrict } from "../components/DistrictSelector";
import EventCard from "../components/EventCard";
import BottomNav from "../components/BottomNav";

const SORT_OPTIONS = [
  { key: "date",       label: "Date" },
  { key: "price_low",  label: "Price: Low to High" },
  { key: "price_high", label: "Price: High to Low" },
  { key: "rating",     label: "Rating" },
];

export default function CategoryEvents() {
  const { category } = useParams();
  const navigate = useNavigate();

  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy,  setSortBy]  = useState("date");
  const [language, setLanguage] = useState("");

  useEffect(() => {
    const fetchEvents = () => {
      setLoading(true);
      const params = { city: getSelectedCity().id || undefined, district: getSelectedDistrict().id || undefined };
      api.get(`/events/category/${encodeURIComponent(category)}`, { params })
        .then((r) => setEvents(r.data))
        .catch(() => setEvents([]))
        .finally(() => setLoading(false));
    };
    fetchEvents();
    window.addEventListener("cityChanged", fetchEvents);
    window.addEventListener("districtChanged", fetchEvents);
    return () => {
      window.removeEventListener("cityChanged", fetchEvents);
      window.removeEventListener("districtChanged", fetchEvents);
    };
  }, [category]);

  const languages = useMemo(
    () => [...new Set(events.map((e) => e.language).filter(Boolean))],
    [events]
  );

  const sorted = useMemo(() => {
    let list = [...events];
    if (language) list = list.filter((e) => e.language === language);

    switch (sortBy) {
      case "price_low":
        return list.sort((a, b) => (a.nextSchedule?.startingPrice ?? Infinity) - (b.nextSchedule?.startingPrice ?? Infinity));
      case "price_high":
        return list.sort((a, b) => (b.nextSchedule?.startingPrice ?? -1) - (a.nextSchedule?.startingPrice ?? -1));
      case "rating":
        return list.sort((a, b) => (b.ratings?.average || 0) - (a.ratings?.average || 0));
      default:
        return list.sort((a, b) => new Date(a.nextSchedule?.eventDate || 0) - new Date(b.nextSchedule?.eventDate || 0));
    }
  }, [events, sortBy, language]);

  return (
    <div className="min-h-screen" style={{ background: "#f7f7f8", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>
      <Navbar />

      <BottomNav />

      <div className="bg-white border-b border-gray-200 sticky top-[60px] z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0">
            <ChevronLeft size={16} />
          </button>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111" }}>{category}</h1>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 pb-3 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <SlidersHorizontal size={13} className="text-gray-400 flex-shrink-0" />
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => setSortBy(o.key)}
              style={{
                flexShrink: 0, padding: "6px 12px", borderRadius: 20,
                border: `1.5px solid ${sortBy === o.key ? "#f0545c" : "#e5e7eb"}`,
                background: sortBy === o.key ? "rgba(240,84,92,0.08)" : "#fff",
                fontSize: 11, fontWeight: 700,
                color: sortBy === o.key ? "#f0545c" : "#374151", cursor: "pointer",
              }}
            >
              {o.label}
            </button>
          ))}
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage((v) => (v === lang ? "" : lang))}
              style={{
                flexShrink: 0, padding: "6px 12px", borderRadius: 20,
                border: `1.5px solid ${language === lang ? "#f0545c" : "#e5e7eb"}`,
                background: language === lang ? "rgba(240,84,92,0.08)" : "#fff",
                fontSize: 11, fontWeight: 700,
                color: language === lang ? "#f0545c" : "#374151", cursor: "pointer",
              }}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2.5 h-2.5 rounded-full bg-[#f0545c] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-[16px] font-bold text-gray-400">No {category} events right now</p>
            <p className="text-[13px] text-gray-300 mt-1">Check back soon — new events are added regularly.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
            {sorted.map((ev) => <EventCard key={ev._id} event={ev} width="100%" />)}
          </div>
        )}
      </div>
    </div>
  );
}