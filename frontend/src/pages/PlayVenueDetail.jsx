import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import {
  ChevronLeft, MapPin, Phone, ExternalLink, Trophy, ChevronRight, Grid2x2, X,
} from "lucide-react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import { IMG, OUTFIT_IMPORT } from "../utils/eventHelpers";

const DAYS_AHEAD = 14; // matches the backend's rolling slot-generation window

function buildDateStrip() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

const dateKey = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

function DateStrip({ dateStrip, selectedDate, setSelectedDate }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      {dateStrip.map((d) => {
        const active = dateKey(d) === dateKey(selectedDate);
        return (
          <button
            key={dateKey(d)}
            onClick={() => setSelectedDate(d)}
            className="flex flex-col items-center justify-center flex-shrink-0 rounded-xl"
            style={{
              width: 52, height: 62,
              background: active ? "#f0545c" : "#fff",
              border: active ? "none" : "1px solid #e5e7eb",
            }}
          >
            <span className="text-[10px] font-semibold" style={{ color: active ? "rgba(255,255,255,0.8)" : "#9ca3af" }}>
              {d.toLocaleDateString("en-IN", { weekday: "short" })}
            </span>
            <span className="text-[16px] font-extrabold mt-0.5" style={{ color: active ? "#fff" : "#111827" }}>
              {d.getDate()}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function PlayVenueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const [venue, setVenue] = useState(null);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showGallery, setShowGallery] = useState(false);

  const dateStrip = buildDateStrip();
  const [selectedDate, setSelectedDate] = useState(dateStrip[0]);

  useEffect(() => {
    setLoading(true);
    api.get(`/play/venues/${id}`)
      .then((r) => { setVenue(r.data.venue); setCourts(r.data.courts); })
      .catch(() => setError("Couldn't load this venue."))
      .finally(() => setLoading(false));
  }, [id]);

  const goToSlots = () => {
    navigate(`/play/venues/${id}/slots?date=${dateKey(selectedDate)}`);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f7f8" }}>
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
          <div className="h-64 rounded-2xl bg-gray-100 animate-pulse mb-4" />
          <div className="h-5 w-2/3 bg-gray-100 rounded animate-pulse mb-2" />
          <div className="h-4 w-1/3 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f7f8", fontFamily: "'Outfit', sans-serif" }}>
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <p className="text-[14px] font-semibold text-gray-500 mb-4">{error || "Venue not found"}</p>
          <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white" style={{ background: "#f0545c" }}>Go back</button>
        </div>
      </div>
    );
  }

  const images = venue.images?.length ? venue.images : [];
  const uniqueActivities = [...new Map(courts.map((c) => [c.activity?._id, c.activity])).values()].filter(Boolean);

  const locationCard = (
    <a
      href={venue.locationLink || "#"}
      target={venue.locationLink ? "_blank" : undefined}
      rel="noreferrer"
      className="flex items-start gap-3 bg-white rounded-2xl border border-gray-100 p-4"
      style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
    >
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#f3f4f6" }}>
        <MapPin size={15} className="text-gray-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold text-gray-900 leading-snug truncate">{venue.name}, {venue.district?.name}</p>
        <p className="text-[11.5px] text-gray-400 mt-1 leading-relaxed">
          {venue.address}
          {venue.distanceKm != null && <> · {venue.distanceKm.toFixed(1)} km away</>}
        </p>
      </div>
      <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1" />
    </a>
  );

  const bookingCard = (
    <>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Select a date</p>
      <DateStrip dateStrip={dateStrip} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
      <button
        onClick={goToSlots}
        className="w-full mt-5 py-3.5 rounded-2xl text-[14px] font-bold text-white flex items-center justify-center gap-2"
        style={{ background: "#F0545C" }}
      >
        Book slots <ChevronRight size={16} />
      </button>
      {venue.contactPhone && (
        <a href={`tel:${venue.contactPhone}`} className="flex items-center justify-center gap-1.5 mt-3 text-[12px] font-semibold text-gray-500">
          <Phone size={12} /> {venue.contactPhone}
        </a>
      )}
    </>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f8", fontFamily: "'Outfit', sans-serif" }}>
      <style>{OUTFIT_IMPORT}</style>
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-4">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 mb-3">
          <ChevronLeft size={16} />
        </button>

        {/* Gallery — district.in style: one big hero + up to 4 thumbs + "Show all photos" */}
        {images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-[1.6fr_1fr] gap-2 rounded-2xl overflow-hidden" style={{ height: 320 }}>
            <div className="h-full">
              <img src={IMG(images[0])} alt={venue.name} className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:grid grid-rows-2 gap-2 h-full">
              {images.slice(1, 3).map((img, i) => (
                <div key={i} className="relative overflow-hidden">
                  <img src={IMG(img)} alt="" className="w-full h-full object-cover" />
                  {i === 1 && images.length > 3 && (
                    <button
                      onClick={() => setShowGallery(true)}
                      className="absolute inset-0 flex items-center justify-center gap-1.5 text-white text-[12px] font-bold"
                      style={{ background: "rgba(0,0,0,0.45)" }}
                    >
                      <Grid2x2 size={13} /> Show all photos
                    </button>
                  )}
                </div>
              ))}
              {images.length === 2 && <div className="bg-gray-100" />}
            </div>
          </div>
        ) : (
          <div className="w-full rounded-2xl" style={{ height: 220, background: "linear-gradient(135deg,#1c1c1c,#2d2d2d)" }} />
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 md:gap-8">
        {/* Left column */}
        <div className="pb-28 md:pb-0">
          <h1 className="text-[20px] sm:text-[24px] font-extrabold text-gray-900 tracking-tight">{venue.name}</h1>
          <p className="text-[12.5px] text-gray-400 mt-1 flex items-center gap-1">
            <MapPin size={12} /> {venue.address || venue.district?.name}, {venue.district?.name}
          </p>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {venue.locationLink && (
              <a href={venue.locationLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-[11.5px] font-semibold text-gray-600">
                <ExternalLink size={11} /> Directions
              </a>
            )}
            {venue.contactPhone && (
              <a href={`tel:${venue.contactPhone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-[11.5px] font-semibold text-gray-600">
                <Phone size={11} /> Call
              </a>
            )}
          </div>

          {/* About */}
          {venue.description && (
            <div className="mt-5">
              <h2 className="text-[15px] font-extrabold text-gray-900 mb-2">About</h2>
              <p className="text-[13px] text-gray-500 leading-relaxed">{venue.description}</p>
            </div>
          )}

          {/* Sports available */}
          {uniqueActivities.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <h2 className="text-[15px] font-extrabold text-gray-900">{uniqueActivities.length} sport{uniqueActivities.length !== 1 ? "s" : ""} available</h2>
                <button
                  onClick={goToSlots}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-[12.5px] font-bold text-white flex-shrink-0"
                  style={{ background: "#F0545C" }}
                >
                  Book slots
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {uniqueActivities.map((a) => {
                  const IconComp = a.icon && Icons[a.icon] ? Icons[a.icon] : Trophy;
                  return (
                    <span key={a._id} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700">
                      {a.image ? (
                        <img src={IMG(a.image)} alt="" className="w-4 h-4 rounded object-cover" />
                      ) : (
                        <IconComp size={13} style={{ color: "#f0545c" }} />
                      )}
                      {a.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Location — desktop shows this in the sticky sidebar */}
          <div className="mt-6 md:hidden">
            {locationCard}
          </div>

          {/* Things to know — amenities as an icon list, matching the district.in reference */}
          {venue.amenities?.length > 0 && (
            <div className="mt-6">
              <h2 className="text-[15px] font-extrabold text-gray-900 mb-2.5">Things to know</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                {venue.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2 text-[13px] text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#f0545c" }} />
                    {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Courts */}
          <div className="mt-6">
            <h2 className="text-[15px] font-extrabold text-gray-900 mb-2.5">Courts &amp; Pricing</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
              {courts.map((c) => {
                const prices = c.pricingRules.map((r) => r.price);
                const min = Math.min(...prices), max = Math.max(...prices);
                return (
                  <div key={c._id} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-gray-900 truncate">{c.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">{c.activity?.name} · {c.indoor ? "Indoor" : "Outdoor"}{c.surfaceType ? ` · ${c.surfaceType}` : ""}</p>
                    </div>
                    <span className="text-[12.5px] font-bold text-gray-700 flex-shrink-0 ml-2">{min === max ? `₹${min}` : `₹${min}–${max}`}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: sticky booking card — desktop only */}
        <div className="hidden md:flex md:flex-col md:gap-4">
          <div style={{
            position: "sticky", top: 90, background: "#fff", borderRadius: 18,
            border: "1px solid #eee", padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          }}>
            {bookingCard}
          </div>
          <div style={{ position: "sticky", top: 340 }}>
            {locationCard}
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div
        className="md:hidden fixed left-4 right-4 z-40 bg-white px-4 py-3 rounded-3xl border border-gray-100"
        style={{ bottom: "calc(16px + env(safe-area-inset-bottom, 0px))", boxShadow: "0 10px 30px rgba(0,0,0,0.14)" }}
      >
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Select a date</p>
        <DateStrip dateStrip={dateStrip} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        <button
          onClick={goToSlots}
          className="w-full mt-3 py-3 rounded-2xl text-[13.5px] font-bold text-white flex items-center justify-center gap-2"
          style={{ background: "#F0545C" }}
        >
          Book slots <ChevronRight size={15} />
        </button>
      </div>

      {/* Full gallery overlay */}
      {showGallery && (
        <div className="fixed inset-0 z-[999] bg-white overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[15px] font-bold text-gray-900">{venue.name} — Photos</p>
              <button onClick={() => setShowGallery(false)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
              {images.map((img, i) => (
                <img key={i} src={IMG(img)} alt="" className="w-full rounded-xl object-cover" style={{ aspectRatio: "4/3" }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}