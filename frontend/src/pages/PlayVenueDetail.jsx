import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import {
  ArrowLeft, MapPin, Phone, ExternalLink, Dumbbell, ChevronRight,
  LayoutGrid, X, ChevronLeft,
} from "lucide-react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
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

export default function PlayVenueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [venue, setVenue] = useState(null);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showGallery, setShowGallery] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const openGallery = (i = 0) => { setLightboxIndex(i); setShowGallery(true); };

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
      <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
        <Navbar /><BottomNav />
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="h-56 rounded-2xl bg-gray-100 animate-pulse mb-4" />
          <div className="h-5 w-2/3 bg-gray-100 rounded animate-pulse mb-2" />
          <div className="h-4 w-1/3 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f7", fontFamily: "'Outfit', sans-serif" }}>
        <Navbar /><BottomNav />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <p className="text-[14px] font-semibold text-gray-500 mb-4">{error || "Venue not found"}</p>
          <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white" style={{ background: "#f0545c" }}>Go back</button>
        </div>
      </div>
    );
  }

  const images = venue.images?.length ? venue.images : [];
  const uniqueActivities = [...new Map(courts.map((c) => [c.activity?._id, c.activity])).values()].filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7", fontFamily: "'Outfit', sans-serif" }}>
      <style>{OUTFIT_IMPORT}</style>
      <Navbar />
      <BottomNav />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 0 110px" }}>
        {/* Photo gallery — one large image + up to two smaller ones on
            larger screens, collapsing to a single full-width image on
            mobile (the smaller two are simply hidden there, not squeezed). */}
        <div className="relative px-3 pt-3 sm:px-4 sm:pt-4">
          <div
            className="relative grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] sm:grid-rows-2 gap-1.5 sm:gap-2 rounded-2xl overflow-hidden"
            style={{ height: 260 }}
          >
            <button
              onClick={() => navigate(-1)}
              className="absolute top-3 left-3 z-20 w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-gray-200 shadow-sm"
            >
              <ArrowLeft size={16} className="text-gray-700" />
            </button>

            {images.length === 0 ? (
              <div className="w-full h-full sm:row-span-2" style={{ background: "linear-gradient(135deg,#1c1c1c,#2d2d2d)" }} />
            ) : (
              <>
                <button type="button" onClick={() => openGallery(0)} className="relative w-full h-full sm:row-span-2 overflow-hidden">
                  <img src={IMG(images[0])} alt={venue.name} className="w-full h-full object-cover" />
                </button>
                {images[1] && (
                  <button type="button" onClick={() => openGallery(1)} className="relative w-full h-full hidden sm:block overflow-hidden">
                    <img src={IMG(images[1])} alt="" className="w-full h-full object-cover" />
                  </button>
                )}
                {images[2] && (
                  <button type="button" onClick={() => openGallery(2)} className="relative w-full h-full hidden sm:block overflow-hidden">
                    <img src={IMG(images[2])} alt="" className="w-full h-full object-cover" />
                    {images.length > 3 && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
                        <span className="text-white text-[13px] font-bold">+{images.length - 3} more</span>
                      </div>
                    )}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Sits outside the overflow-hidden grid (not clipped by it) and
              is anchored with fixed pixel offsets so it stays fully visible
              at every breakpoint instead of getting cut off by the image
              edge or the rounded corner. */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={() => openGallery(0)}
              className="absolute z-20 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold text-white"
              style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", bottom: 14, right: 14 }}
            >
              <LayoutGrid size={13} /> Show all photos
            </button>
          )}
        </div>

        <div className="px-4 pt-4">
          <h1 className="text-[19px] font-extrabold text-gray-900 tracking-tight">{venue.name}</h1>
          <p className="text-[12.5px] text-gray-400 mt-1 flex items-center gap-1">
            <MapPin size={12} /> {venue.address || venue.district?.name}
          </p>

          <div className="flex items-center gap-2 mt-3">
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

          {venue.description && <p className="text-[13px] text-gray-500 mt-3 leading-relaxed">{venue.description}</p>}

          {/* Activities offered */}
          {uniqueActivities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {uniqueActivities.map((a) => {
                const IconComp = a.icon && Icons[a.icon] ? Icons[a.icon] : Dumbbell;
                return (
                  <span key={a._id} className="flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1.5 rounded-full" style={{ background: "rgba(240,84,92,0.06)", color: "#f0545c" }}>
                    <IconComp size={12} /> {a.name}
                  </span>
                );
              })}
            </div>
          )}

          {/* Amenities */}
          {venue.amenities?.length > 0 && (
            <div className="mt-5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {venue.amenities.map((a) => (
                  <span key={a} className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-white border border-gray-100 text-gray-600">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Courts list */}
          <div className="mt-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Courts</p>
            <div className="flex flex-col gap-2">
              {courts.map((c) => {
                const prices = c.pricingRules.map((r) => r.price);
                const min = Math.min(...prices), max = Math.max(...prices);
                return (
                  <div key={c._id} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-3.5 py-3">
                    <div>
                      <p className="text-[13px] font-bold text-gray-900">{c.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{c.activity?.name} · {c.indoor ? "Indoor" : "Outdoor"}{c.surfaceType ? ` · ${c.surfaceType}` : ""}</p>
                    </div>
                    <span className="text-[12.5px] font-bold text-gray-700">{min === max ? `₹${min}` : `₹${min}–${max}`}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date picker */}
          <div className="mt-6">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Select a date</p>
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
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="max-w-lg mx-auto px-4 pb-4">
          <button
            onClick={goToSlots}
            className="w-full py-3.5 rounded-2xl text-[14px] font-bold text-white flex items-center justify-center gap-2"
            style={{ background: "#f0545c", boxShadow: "0 8px 24px -6px rgba(240,84,92,0.5)" }}
          >
            View Available Slots <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Full-screen gallery lightbox */}
      {showGallery && images.length > 0 && (
        <div className="fixed inset-0 z-[999] flex flex-col" style={{ background: "rgba(0,0,0,0.96)" }}>
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
            <p className="text-[13px] font-semibold text-white">{lightboxIndex + 1} / {images.length}</p>
            <button onClick={() => setShowGallery(false)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
              <X size={18} className="text-white" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative px-3 min-h-0">
            {images.length > 1 && (
              <button
                onClick={() => setLightboxIndex((i) => (i - 1 + images.length) % images.length)}
                className="absolute left-2 sm:left-6 w-10 h-10 rounded-full flex items-center justify-center z-10"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                <ChevronLeft size={20} className="text-white" />
              </button>
            )}
            <img src={IMG(images[lightboxIndex])} alt="" className="max-h-full max-w-full object-contain rounded-lg" />
            {images.length > 1 && (
              <button
                onClick={() => setLightboxIndex((i) => (i + 1) % images.length)}
                className="absolute right-2 sm:right-6 w-10 h-10 rounded-full flex items-center justify-center z-10"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                <ChevronRight size={20} className="text-white" />
              </button>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-4 py-3 flex-shrink-0" style={{ scrollbarWidth: "none" }}>
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className="flex-shrink-0 rounded-lg overflow-hidden"
                  style={{ width: 56, height: 56, border: i === lightboxIndex ? "2px solid #f0545c" : "2px solid transparent" }}
                >
                  <img src={IMG(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}