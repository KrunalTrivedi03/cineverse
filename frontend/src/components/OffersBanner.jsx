import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import {
  Wallet, Ticket, Sparkles, Percent, Gift, Users, ArrowRight,
  ChevronLeft, ChevronRight, Zap, Flame,
} from "lucide-react";

/* Curated promo slides — purely presentational, no backend dependency. */
const OFFERS = [
  {
    id: "wallet",
    icon: Wallet,
    badge: "Limited Time",
    badgeIcon: Zap,
    eyebrow: "QuickPay Wallet",
    title: "Add ₹500, get ₹50 extra",
    desc: "Top up your CineVerse wallet and pay in one tap at checkout — every time.",
    cta: "Add money",
    to: "/settings",
    bg: "linear-gradient(135deg, #f0545c 0%, #ff8a65 55%, #ffb199 100%)",
    accent: "#7a1c22",
  },
  {
    id: "firstbooking",
    icon: Ticket,
    badge: "New Offer",
    badgeIcon: Sparkles,
    eyebrow: "First Booking",
    title: "Flat 20% off, on us",
    desc: "New to CineVerse? The discount applies automatically at payment.",
    cta: "Explore movies",
    to: "/",
    bg: "linear-gradient(135deg, #14141a 0%, #2b2b35 55%, #43434f 100%)",
    accent: "#0a0a0d",
  },
  {
    id: "events",
    icon: Sparkles,
    badge: "This Weekend",
    badgeIcon: Flame,
    eyebrow: "Live & Trending",
    title: "Events & plays near you",
    desc: "From stand-up specials to theatre — see what's happening around you.",
    cta: "Browse events",
    to: "/events",
    bg: "linear-gradient(135deg, #7c3aed 0%, #a855f7 55%, #c99bff 100%)",
    accent: "#3b1370",
  },
  {
    id: "refer",
    icon: Users,
    badge: "Refer & Earn",
    badgeIcon: Gift,
    eyebrow: "Bring a Friend",
    title: "You invite, you both win",
    desc: "Share your CineVerse link and unlock bonus wallet credit instantly.",
    cta: "Learn more",
    to: "/settings",
    bg: "linear-gradient(135deg, #059669 0%, #10b981 55%, #6ee7b7 100%)",
    accent: "#023d2c",
  },
];

const PERKS = [
  { icon: Percent, label: "Best price guarantee" },
  { icon: Gift, label: "Exclusive member offers" },
  { icon: Ticket, label: "Instant e-tickets" },
  { icon: Wallet, label: "Secure QuickPay wallet" },
];

export default function OffersBanner() {
  const swiperRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-10 md:pt-14">
      <div className="flex items-end justify-between mb-4 md:mb-5">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "rgba(240,84,92,0.12)" }}
            >
              <Sparkles size={11} style={{ color: "#f0545c" }} />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#f0545c" }}>
              Offers for you
            </p>
          </div>
          <h2 className="text-[22px] md:text-[26px] font-black text-gray-900 tracking-tight" style={{ letterSpacing: "-0.02em" }}>
            Deals &amp; perks made for you
          </h2>
        </div>

        {/* Desktop arrows */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#f0545c] hover:border-[#f0545c] transition-all"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            onClick={() => swiperRef.current?.slideNext()}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#f0545c] hover:border-[#f0545c] transition-all"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      <div className="relative rounded-[24px] md:rounded-[32px] overflow-hidden shadow-lg group">
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
                  style={{ background: offer.bg, minHeight: 200 }}
                >
                  {/* Decorative pattern layer */}
                  <svg
                    className="absolute inset-0 w-full h-full opacity-[0.10] pointer-events-none"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <defs>
                      <pattern id={`dots-${offer.id}`} width="26" height="26" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="2" fill="white" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#dots-${offer.id})`} />
                  </svg>

                  {/* Decorative blobs */}
                  <div
                    className="absolute -right-10 -top-16 w-56 h-56 rounded-full pointer-events-none"
                    style={{ background: "rgba(255,255,255,0.10)" }}
                  />
                  <div
                    className="absolute right-8 -bottom-16 w-40 h-40 rounded-full pointer-events-none"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  />
                  <div
                    className="absolute left-1/3 -bottom-10 w-24 h-24 rounded-full pointer-events-none hidden sm:block"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  />

                  {/* Large ghost icon, illustration-style */}
                  <Icon
                    size={168}
                    strokeWidth={1}
                    className="absolute -right-6 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:block"
                    style={{ color: "rgba(255,255,255,0.14)" }}
                  />

                  <div className="relative flex flex-col justify-center h-full px-6 sm:px-10 py-8 sm:py-11">
                    {/* Badge row */}
                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full text-white"
                        style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(6px)" }}
                      >
                        <BadgeIcon size={11} />
                        {offer.badge}
                      </span>
                      <span className="text-[11px] font-semibold text-white/70 tracking-wide hidden sm:inline">
                        {offer.eyebrow}
                      </span>
                    </div>

                    <h3 className="text-white font-black text-[24px] sm:text-[32px] leading-[1.1] mb-2 max-w-md" style={{ letterSpacing: "-0.01em" }}>
                      {offer.title}
                    </h3>
                    <p className="text-white/75 text-[13px] sm:text-[14.5px] max-w-sm mb-6 leading-relaxed">
                      {offer.desc}
                    </p>

                    <Link
                      to={offer.to}
                      className="inline-flex items-center gap-2 w-fit text-[13.5px] font-bold px-5 py-2.5 rounded-full bg-white transition-transform active:scale-95 hover:-translate-y-0.5"
                      style={{ color: offer.accent, boxShadow: "0 8px 20px rgba(0,0,0,0.15)" }}
                    >
                      {offer.cta} <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Dots */}
        <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
          {OFFERS.map((_, i) => (
            <button
              key={i}
              onClick={() => swiperRef.current?.slideToLoop(i)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: i === activeIdx ? 20 : 6,
                height: 6,
                background: i === activeIdx ? "#fff" : "rgba(255,255,255,0.45)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Perks strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3 mt-4">
        {PERKS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-xl px-3.5 py-3 hover:border-gray-200 hover:shadow-sm transition-all"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(240,84,92,0.08)" }}
            >
              <Icon size={15} style={{ color: "#f0545c" }} />
            </div>
            <span className="text-[12px] font-semibold text-gray-700 leading-tight">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}