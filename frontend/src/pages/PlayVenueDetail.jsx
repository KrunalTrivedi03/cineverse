import Dialog from "../components/Dialog";
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  MapPin,
  Phone,
  Compass,
  ChevronRight,
  Grid2x2,
  X,
  Clock,
  CircleAlert,
} from "lucide-react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import { IMG } from "../utils/eventHelpers";
import { getSportIcon } from "../utils/sportIcons";

const DAYS_AHEAD = 14;

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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const DEFAULT_AMENITIES = [
  "Duration 1 Hour",
  "Flood lights",
  "Washroom Available",
  "Parking",
  "Seating Lounge",
];

const DEFAULT_ABOUT =
  "Welcome to our sports facility, a space designed to bring players together and create an enjoyable, high-quality sporting experience. We provide a well-maintained environment suitable for casual play and friendly matches. Whether you're visiting to stay active, improve your skills, or simply have a good time with friends, our facility is built to offer a smooth, comfortable, and engaging experience for everyone.";

function DateStrip({ dateStrip, selectedDate, setSelectedDate }) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {dateStrip.map((d) => {
        const active = dateKey(d) === dateKey(selectedDate);
        return (
          <button
            key={dateKey(d)}
            onClick={() => setSelectedDate(d)}
            type="button"
            className={`flex flex-col items-center justify-center flex-shrink-0 rounded-2xl transition-all duration-150 ${
              active
                ? "bg-now-accent text-white shadow-sm ring-2 ring-now-accent/20 scale-[1.02]"
                : "bg-white text-gray-800 border border-gray-200/90 hover:border-gray-300"
            }`}
            style={{ width: 56, height: 68 }}
          >
            <span
              className={`text-[11px] font-semibold tracking-tight ${
                active ? "text-white/90" : "text-gray-400"
              }`}
            >
              {d.toLocaleDateString("en-IN", { weekday: "short" })}
            </span>
            <span
              className={`text-[18px] font-black leading-tight mt-0.5 ${
                active ? "text-white" : "text-gray-900"
              }`}
            >
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [venue, setVenue] = useState(null);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showGallery, setShowGallery] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const dateStrip = useMemo(buildDateStrip, []);
  const [selectedDate, setSelectedDate] = useState(dateStrip[0]);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/play/venues/${id}`)
      .then((r) => {
        setVenue(r.data.venue);
        setCourts(r.data.courts || []);
      })
      .catch(() => setError("Couldn't load this venue."))
      .finally(() => setLoading(false));
  }, [id]);



  const goToSlots = () => {
    navigate(`/play/venues/${id}/slots?date=${dateKey(selectedDate)}`);
  };

  const images = venue?.images?.length ? venue.images : [];
  const uniqueActivities = useMemo(() => {
    if (!courts.length) return [];
    return [
      ...new Map(courts.map((c) => [c.activity?._id, c.activity])).values(),
    ].filter(Boolean);
  }, [courts]);

  const amenities = useMemo(() => {
    if (venue?.amenities && venue.amenities.length > 0) {
      return venue.amenities;
    }
    return DEFAULT_AMENITIES;
  }, [venue]);

  // Price range summary across all courts
  const priceSummary = useMemo(() => {
    if (!courts.length) return null;
    const allPrices = courts.flatMap((c) =>
      (c.pricingRules || []).map((r) => r.price)
    );
    if (!allPrices.length) return null;
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    return min === max ? `₹${min}` : `₹${min} - ₹${max}`;
  }, [courts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-now-canvas">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          <div className="h-72 md:h-80 rounded-3xl bg-gray-200/70 animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-8">
            <div className="space-y-4">
              <div className="h-8 w-2/3 bg-gray-200/70 rounded-xl animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-200/70 rounded-lg animate-pulse" />
              <div className="h-24 bg-gray-200/70 rounded-2xl animate-pulse mt-6" />
            </div>
            <div className="hidden md:block h-64 bg-gray-200/70 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-now-canvas">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center text-now-accent mb-4">
            <CircleAlert size={28} />
          </div>
          <p className="text-[16px] font-bold text-gray-900 mb-2">
            {error || "Venue not found"}
          </p>
          <p className="text-[13px] text-gray-500 mb-6">
            The facility you are looking for might have been moved or removed.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-full text-[13px] font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: "#106579" }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Location Card shared between mobile and desktop sticky
  const locationCard = (
    <a
      href={
        venue.locationLink ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${venue.name} ${venue.address || ""}`
        )}`
      }
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3.5 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 group"
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 group-hover:bg-now-accent/10 transition-colors">
        <MapPin
          size={18}
          className="text-gray-500 group-hover:text-now-accent transition-colors"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold text-gray-900 leading-snug truncate uppercase">
          {venue.name}
          {venue.district?.name ? `, ${venue.district.name}` : ""}
        </p>
        <p className="text-[11.5px] text-gray-400 mt-0.5 leading-relaxed line-clamp-2">
          {venue.address}
          {venue.distanceKm != null && (
            <> · {venue.distanceKm.toFixed(1)} km away</>
          )}
        </p>
      </div>
      <ChevronRight
        size={18}
        className="text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all flex-shrink-0"
      />
    </a>
  );

  // Booking Card with date strip and Book slots CTA
  const bookingCard = (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
          SELECT A DATE
        </p>
        {priceSummary && (
          <span className="text-[12px] font-bold text-now-accent">
            {priceSummary}
          </span>
        )}
      </div>

      <DateStrip
        dateStrip={dateStrip}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />

      <button
        onClick={goToSlots}
        type="button"
        className="w-full mt-4 py-3.5 rounded-2xl text-[14.5px] font-bold text-white flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.99] transition-all"
        style={{ background: "#106579" }}
      >
        Book slots <ChevronRight size={17} strokeWidth={2.5} />
      </button>

      <div className="flex items-center justify-center gap-1.5 mt-3 text-[12px] font-medium text-gray-400">
        <Clock size={13} className="text-gray-400" />
        <span>Slots available for {selectedDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-now-canvas text-gray-900 pb-20 md:pb-12">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-4">
        {/* Back navigation button */}
        <div className="mb-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="w-8 h-8 rounded-xl flex items-center justify-center border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-2xs"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* Hero Gallery Section (Matches attached image desktop banner & "Show all photos" chip) */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm bg-gray-900 mb-6">
          {images.length > 0 ? (
            <div className="relative w-full h-[220px] sm:h-[300px] md:h-[340px]">
              <img
                src={IMG(images[0])}
                alt={venue.name}
                loading="eager"
                className="w-full h-full object-cover"
              />
              {/* Subtle top/bottom gradient overlay for contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

              {/* Show all photos floating button in bottom right corner */}
              <button
                onClick={() => setShowGallery(true)}
                type="button"
                className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-white text-[12px] sm:text-[13px] font-bold bg-black/60 hover:bg-black/80 backdrop-blur-md transition-all shadow-md active:scale-95"
              >
                <Grid2x2 size={14} />
                <span>Show all photos</span>
                {images.length > 1 && (
                  <span className="text-[11px] opacity-80">({images.length})</span>
                )}
              </button>
            </div>
          ) : (
            <div className="w-full h-[220px] sm:h-[280px] bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center text-white/40">
              <span className="text-[14px] font-semibold">No photos available</span>
            </div>
          )}
        </div>

        {/* Content Layout: 2 Columns on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_330px] lg:grid-cols-[1fr_360px] gap-6 md:gap-8 items-start">
          {/* Left Column: Venue Details */}
          <div className="space-y-6">
            {/* Title & Location Header */}
            <div>
              <h1 className="text-[22px] sm:text-[26px] md:text-[28px] font-black uppercase text-gray-900 tracking-tight leading-tight">
                {venue.name}
              </h1>
              <p className="text-[13px] sm:text-[13.5px] text-gray-500 mt-1 leading-relaxed">
                {venue.address || venue.district?.name}
                {venue.district?.name && !venue.address?.includes(venue.district.name)
                  ? `, ${venue.district.name}`
                  : ""}
              </p>

              {/* Action Buttons: Directions & Call */}
              <div className="flex items-center gap-2.5 mt-3.5 flex-wrap">
                <a
                  href={
                    venue.locationLink ||
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${venue.name} ${venue.address || ""}`
                    )}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-gray-200 bg-white text-[12px] font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-2xs"
                >
                  <Compass size={13} className="text-gray-500" />
                  <span>Directions</span>
                </a>

                {venue.contactPhone ? (
                  <a
                    href={`tel:${venue.contactPhone}`}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-gray-200 bg-white text-[12px] font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-2xs"
                  >
                    <Phone size={13} className="text-gray-500" />
                    <span>Call</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowContact(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-gray-200 bg-white text-[12px] font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-2xs"
                  >
                    <Phone size={13} className="text-gray-500" />
                    <span>Contact info</span>
                  </button>
                )}
              </div>
            </div>

            {/* About Section */}
            <div className="pt-2">
              <h2 className="text-[16px] font-extrabold text-gray-900 mb-2">
                About
              </h2>
              <p className="text-[13.5px] text-gray-600 leading-relaxed font-normal">
                {venue.description || DEFAULT_ABOUT}
              </p>
            </div>

            {/* Sports Available Section */}
            <div className="pt-2">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-[16px] font-extrabold text-gray-900">
                  {uniqueActivities.length > 0
                    ? `${uniqueActivities.length} sport${
                        uniqueActivities.length !== 1 ? "s" : ""
                      } available`
                    : "1 sport available"}
                </h2>

                {/* Desktop Book slots button matching attached screenshot */}
                <button
                  onClick={goToSlots}
                  type="button"
                  className="hidden sm:inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[12.5px] font-bold text-white hover:opacity-95 transition-all shadow-xs"
                  style={{ background: "#106579" }}
                >
                  Book slots
                </button>
              </div>

              {/* Sports chips */}
              <div className="flex flex-wrap gap-2">
                {uniqueActivities.length > 0 ? (
                  uniqueActivities.map((a) => {
                    const IconComp = getSportIcon(a.icon || a.name);
                    return (
                      <span
                        key={a._id || a.name}
                        className="inline-flex items-center gap-2 text-[12.5px] font-semibold px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-gray-800 shadow-2xs"
                      >
                        {a.image ? (
                          <img
                            src={IMG(a.image)}
                            alt=""
                            loading="lazy"
                            className="w-4 h-4 rounded object-cover"
                          />
                        ) : (
                          <IconComp
                            size={14}
                            className="text-now-accent"
                            strokeWidth={2}
                          />
                        )}
                        <span>{a.name}</span>
                      </span>
                    );
                  })
                ) : (
                  <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-gray-800 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-now-accent" />
                    <span>Cricket</span>
                  </span>
                )}
              </div>
            </div>

            {/* Mobile Location Card (Appears after sports available as shown in mobile mockup) */}
            <div className="md:hidden pt-2">
              {locationCard}
            </div>

            {/* Things to know Section (Amenities with red bullets matching screenshot) */}
            <div className="pt-2">
              <h2 className="text-[16px] font-extrabold text-gray-900 mb-3">
                Things to know
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4">
                {amenities.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2.5 text-[13px] text-gray-700"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: "#106579" }}
                    />
                    <span className="leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Courts & Pricing Section */}
            <div className="pt-2">
              <h2 className="text-[16px] font-extrabold text-gray-900 mb-3">
                Courts &amp; Pricing
              </h2>

              {/* On mobile, embed date selector and CTA under Courts & Pricing as depicted in mobile mockup */}
              <div className="md:hidden mb-4">
                {bookingCard}
              </div>

              {/* Courts list */}
              {courts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {courts.map((court) => {
                    const prices = (court.pricingRules || []).map((r) => r.price);
                    const min = prices.length ? Math.min(...prices) : null;
                    const max = prices.length ? Math.max(...prices) : null;

                    return (
                      <div
                        key={court._id}
                        className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs hover:border-gray-200 transition-colors"
                      >
                        <div className="min-w-0 pr-3">
                          <p className="text-[13.5px] font-bold text-gray-900 truncate">
                            {court.name}
                          </p>
                          <p className="text-[11.5px] text-gray-400 mt-0.5 truncate">
                            {court.activity?.name || "Cricket"} ·{" "}
                            {court.indoor ? "Indoor" : "Outdoor"}
                            {court.surfaceType ? ` · ${court.surfaceType}` : ""}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className="text-[13px] font-extrabold text-gray-800">
                            {min != null
                              ? min === max
                                ? `₹${min}`
                                : `₹${min}–${max}`
                              : "Standard"}
                          </span>
                          <span className="block text-[10px] text-gray-400 font-medium">
                            per hour
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center text-gray-400 text-[13px]">
                  Courts available for booking. Select a date above to view slots.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Desktop Sticky Cards (Date Selection & Location) */}
          <div className="hidden md:flex flex-col gap-4 sticky top-20">
            {bookingCard}
            {locationCard}
          </div>
        </div>
      </main>

      {/* Slim Mobile Floating Bottom Bar for Instant Booking when scrolled */}
      <div
        className="md:hidden fixed left-3 right-3 z-40 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-gray-200/80 shadow-lg flex items-center justify-between gap-3"
        style={{
          bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-400">
            Selected Date
          </p>
          <p className="text-[13.5px] font-bold text-gray-900 truncate">
            {selectedDate.toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>

        <button
          onClick={goToSlots}
          type="button"
          className="px-5 py-2.5 rounded-xl text-[13.5px] font-bold text-white flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform flex-shrink-0"
          style={{ background: "#106579" }}
        >
          <span>Book slots</span>
          <ChevronRight size={15} />
        </button>
      </div>

      {showContact && (
        <Dialog label="Venue contact information" onDismiss={() => setShowContact(false)}>
          <div className="p-5 sm:p-7">
            <h2 className="text-xl font-bold">Venue contact information</h2>
            <p className="mt-2 text-sm text-gray-500">Unicorn Cricket Club, {venue.district?.name || "Ahmedabad"}</p>
            <button type="button" className="now-primary mt-5" onClick={() => setShowContact(false)}>Done</button>
          </div>
        </Dialog>
      )}

      {/* Full Photo Gallery Lightbox */}
      {showGallery && (
        <Dialog variant="gallery" label={venue.name + " photos"} onDismiss={() => setShowGallery(false)}>
          <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <h3 className="text-[16px] font-bold text-gray-900">
                  {venue.name}
                </h3>
                <p className="text-[12px] text-gray-400">
                  Photos &amp; Facilities ({images.length})
                </p>
              </div>
              <button
                onClick={() => setShowGallery(false)}
                type="button"
                aria-label="Close photos"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden bg-gray-100 aspect-4/3 shadow-sm"
                >
                  <img
                    src={IMG(img)}
                    alt={`${venue.name} photo ${i + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
