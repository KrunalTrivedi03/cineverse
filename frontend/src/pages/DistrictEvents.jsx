// src/pages/DistrictEvents.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin } from "lucide-react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import EventCard from "../components/EventCard";

export default function DistrictEvents() {
  const { districtId } = useParams();
  const navigate = useNavigate();

  const [events,   setEvents]   = useState([]);
  const [district, setDistrict] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/events/district/${districtId}`),
      api.get("/districts").then((r) => r.data.find((d) => d._id === districtId)),
    ])
      .then(([evRes, dist]) => {
        setEvents(evRes.data);
        setDistrict(dist || null);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [districtId]);

  return (
    <div className="min-h-screen" style={{ background: "#f7f7f8", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>
      <Navbar />

      <div className="bg-white border-b border-gray-200 sticky top-[60px] z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0">
            <ChevronLeft size={16} />
          </button>
          <MapPin size={16} color="#f0545c" />
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111" }}>
            Events in {district?.name || "…"}
          </h1>
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
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-[16px] font-bold text-gray-400">No events found here yet</p>
            <p className="text-[13px] text-gray-300 mt-1">Try browsing all events or a different district.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
            {events.map((ev) => <EventCard key={ev._id} event={ev} width="100%" />)}
          </div>
        )}
      </div>
    </div>
  );
}