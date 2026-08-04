import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import {
  Wallet, Ticket, Sparkles, Percent, Gift, Users, ArrowRight,
  ChevronLeft, ChevronRight, Zap, Flame, Tag,
} from "lucide-react";
import { fetchBannerOffers, IMG, themeGradient, formatDiscountLabel } from "../utils/offers";

/* Curated fallback slides — shown only until the Admin Panel has live banner offers. */
const FALLBACK_OFFERS = [
  {
    id: "wallet",
    icon: Wallet,
    badge: "Limited Time",
    badgeIcon: Zap,
    eyebrow: "QuickPay Wallet",
    title: "Add ₹500, get ₹50 extra",
    desc: "Top up your wallet and pay in one tap at checkout.",
    cta: "Add money",
    to: "/settings",
    bg: "linear-gradient(120deg, #f0545c 0%, #ff8a65 60%, #ffb199 100%)",
    accent: "#7a1c22",
  },
  {
    id: "firstbooking",
    icon: Ticket,
    badge: "New Offer",
    badgeIcon: Sparkles,
    eyebrow: "First Booking",
    title: "Flat 20% off, on us",
    desc: "New here? The discount applies automatically at payment.",
    cta: "Explore movies",
    to: "/",
    bg: "linear-gradient(120deg, #14141a 0%, #2b2b35 60%, #43434f 100%)",
    accent: "#0a0a0d",
  },
  {
    id: "events",
    icon: Sparkles,
    badge: "This Weekend",
    badgeIcon: Flame,
    eyebrow: "Live & Trending",
    title: "Events & plays near you",
    desc: "From stand-up specials to theatre, see what's on.",
    cta: "Browse events",
    to: "/events",
    bg: "linear-gradient(120deg, #7c3aed 0%, #a855f7 60%, #c99bff 100%)",
    accent: "#3b1370",
  },
  {
    id: "refer",
    icon: Users,
    badge: "Refer & Earn",
    badgeIcon: Gift,
    eyebrow: "Bring a Friend",
    title: "You invite, you both win",
    desc: "Share your link and unlock bonus wallet credit.",
    cta: "Learn more",
    to: "/settings",
    bg: "linear-gradient(120deg, #059669 0%, #10b981 60%, #6ee7b7 100%)",
    accent: "#023d2c",
  },
];

const PERKS = [
  { icon: Percent, label: "Best price guarantee" },
  { icon: Gift, label: "Exclusive member offers" },
  { icon: Ticket, label: "Instant e-tickets" },
  { icon: Wallet, label: "Secure QuickPay wallet" },
];

/* Normalize a backend Offer document into the same shape FALLBACK_OFFERS use,
   so the render logic below never has to branch on data source. */
function normalizeBackendOffer(offer) {
  return {
    id: offer._id,
    icon: Tag,
    badge: formatDiscountLabel(offer),
    badgeIcon: Zap,
    eyebrow: offer.subtitle || "Offer",
    title: offer.title,
    desc: offer.description || "",
    cta: offer.ctaText || "Explore now",
    to: offer.ctaLink || "/offers",
    bg: themeGradient(offer.theme),
    accent: "#7a1c22",
    image: offer.image ? IMG(offer.image) : null,
  };
}

export default function OffersBanner() {
  const swiperRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [offers, setOffers] = useState(FALLBACK_OFFERS);

  useEffect(() => {
    let cancelled = false;
    fetchBannerOffers()
      .then((data) => {
        if (cancelled) return;
        if (data && data.length > 0) {
          setOffers(data.map(normalizeBackendOffer));
        }
      })
      .catch(() => {
        /* keep fallback slides on failure */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const OFFERS = offers;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-10">
      <div className="flex items-end justify-between mb-3 md:mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="w-4.5 h-4.5 rounded-full flex items-center justify-center"
              style={{ background: "rgba(240,84,92,0.12)" }}
            >
              <Sparkles size={10} style={{ color: "#f0545c" }} />
            </span>
            <p className="text-[10.5px] font-bold uppercase tracking-widest" style={{ color: "#f0545c" }}>
              Offers for you
            </p>
          </div>
          <h2 className="text-[19px] md:text-[22px] font-black text-gray-900 tracking-tight" style={{ letterSpacing: "-0.02em" }}>
            Deals &amp; perks made for you
          </h2>
        </div>

        {/* Desktop arrows */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#f0545c] hover:border-[#f0545c] transition-all"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => swiperRef.current?.slideNext()}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#f0545c] hover:border-[#f0545c] transition-all"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="relative rounded-[20px] md:rounded-[24px] overflow-hidden shadow-md group">
        <Swiper
          onSwiper={(s) => (swiperRef.current = s)}
          onSlideChange={(s) => setActiveIdx(s.realIndex)}
          modules={[Autoplay, Pagination]}
          autoplay={{ delay: 4800, disableOnInteraction: false }}
          loop
          speed={750}
          className="w-full"
        >
          {OFFERS.map((offer) => {
            const Icon = offer.icon;
            const BadgeIcon = offer.badgeIcon;
            return (
              <SwiperSlide key={offer.id}>
                <div
                  className="relative overflow-hidden"
                  style={{ background: offer.bg, minHeight: 132 }}
                >
                  {offer.image && (
                    <img
                      src={offer.image}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay pointer-events-none"
                    />
                  )}

                  {/* Decorative blobs — smaller, quieter */}
                  <div
                    className="absolute -right-8 -top-12 w-40 h-40 rounded-full pointer-events-none"
                    style={{ background: "rgba(255,255,255,0.09)" }}
                  />
                  <div
                    className="absolute right-4 -bottom-12 w-28 h-28 rounded-full pointer-events-none"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                  />

                  {/* Ghost icon, restrained */}
                  <Icon
                    size={104}
                    strokeWidth={1}
                    className="absolute -right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:block"
                    style={{ color: "rgba(255,255,255,0.14)" }}
                  />

                  <div className="relative flex items-center justify-between gap-4 h-full px-5 sm:px-8 py-5 sm:py-6">
                    <div className="min-w-0">
                      {/* Badge row */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="inline-flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
                          style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(6px)" }}
                        >
                          <BadgeIcon size={10} />
                          {offer.badge}
                        </span>
                        <span className="text-[10.5px] font-semibold text-white/70 tracking-wide hidden sm:inline">
                          {offer.eyebrow}
                        </span>
                      </div>

                      <h3 className="text-white font-black text-[19px] sm:text-[24px] leading-[1.15] mb-1 max-w-md" style={{ letterSpacing: "-0.01em" }}>
                        {offer.title}
                      </h3>
                      <p className="text-white/75 text-[12px] sm:text-[13px] max-w-xs sm:max-w-sm leading-snug hidden sm:block">
                        {offer.desc}
                      </p>
                    </div>

                    <Link
                      to={offer.to}
                      className="inline-flex items-center gap-1.5 flex-shrink-0 text-[12.5px] font-bold px-4 py-2.5 rounded-full bg-white transition-transform active:scale-95 hover:-translate-y-0.5 whitespace-nowrap"
                      style={{ color: offer.accent, boxShadow: "0 6px 16px rgba(0,0,0,0.15)" }}
                    >
                      {offer.cta} <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Dots */}
        <div className="absolute bottom-3 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
          {OFFERS.map((_, i) => (
            <button
              key={i}
              onClick={() => swiperRef.current?.slideToLoop(i)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: i === activeIdx ? 16 : 5,
                height: 5,
                background: i === activeIdx ? "#fff" : "rgba(255,255,255,0.45)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Perks strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-2.5 mt-3.5">
        {PERKS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2.5 hover:border-gray-200 hover:shadow-sm transition-all"
          >
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(240,84,92,0.08)" }}
            >
              <Icon size={13} style={{ color: "#f0545c" }} />
            </div>
            <span className="text-[11.5px] font-semibold text-gray-700 leading-tight">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}