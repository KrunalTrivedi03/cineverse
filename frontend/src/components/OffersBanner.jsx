import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import {
  Wallet, Ticket, Sparkles, Percent, Gift, ArrowRight,
  ChevronLeft, ChevronRight, Zap, Tag, ShieldCheck,
} from "lucide-react";
import { fetchBannerOffers, IMG, themeGradient, formatDiscountLabel } from "../utils/offers";

const PERKS = [
  { icon: Percent, label: "Best price guarantee", desc: "No hidden booking fees" },
  { icon: Gift, label: "Exclusive member perks", desc: "Unlock rewards & coupons" },
  { icon: Ticket, label: "Instant m-tickets", desc: "Direct barcode access" },
  { icon: ShieldCheck, label: "100% secure checkout", desc: "Encrypted transactions" },
];

function normalizeBackendOffer(offer) {
  return {
    id: offer._id,
    icon: Tag,
    badge: formatDiscountLabel(offer),
    badgeIcon: Zap,
    eyebrow: offer.subtitle || "Exclusive Deal",
    title: offer.title,
    desc: offer.description || "",
    cta: offer.ctaText || "Claim Offer",
    to: offer.ctaLink || "/offers",
    bg: themeGradient(offer.theme),
    accent: "#7a1c22",
    image: offer.image ? IMG(offer.image) : null,
  };
}

export default function OffersBanner() {
  const swiperRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [offers, setOffers] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchBannerOffers()
      .then((data) => {
        if (cancelled) return;
        setOffers(data && data.length > 0 ? data.map(normalizeBackendOffer) : []);
      })
      .catch(() => { if (!cancelled) setOffers([]); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  if (!loaded || offers.length === 0) return null;

  const OFFERS = offers;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 md:px-14 pt-8 md:pt-12">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0545c]/10 text-[#f0545c] text-[11px] font-extrabold uppercase tracking-widest mb-1.5 border border-[#f0545c]/20">
            <Sparkles size={11} />
            <span>Special Promotions</span>
          </div>
          <h2 className="text-[20px] sm:text-[24px] font-black text-gray-900 tracking-tight">
            Deals &amp; Exclusive Perks
          </h2>
        </div>

        {/* Desktop slider navigation arrows */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            className="w-9 h-9 rounded-full bg-white border border-gray-200/90 flex items-center justify-center text-gray-600 hover:text-white hover:bg-[#f0545c] hover:border-[#f0545c] transition-all shadow-xs active:scale-95"
            aria-label="Previous Offer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => swiperRef.current?.slideNext()}
            className="w-9 h-9 rounded-full bg-white border border-gray-200/90 flex items-center justify-center text-gray-600 hover:text-white hover:bg-[#f0545c] hover:border-[#f0545c] transition-all shadow-xs active:scale-95"
            aria-label="Next Offer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-white/20 group">
        <Swiper
          onSwiper={(s) => (swiperRef.current = s)}
          onSlideChange={(s) => setActiveIdx(s.realIndex)}
          modules={[Autoplay, Pagination]}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop
          speed={800}
          className="w-full"
        >
          {OFFERS.map((offer) => {
            const Icon = offer.icon;
            const BadgeIcon = offer.badgeIcon;
            return (
              <SwiperSlide key={offer.id}>
                <div
                  className="relative overflow-hidden"
                  style={{ background: offer.bg, minHeight: 145 }}
                >
                  {offer.image && (
                    <img
                      src={offer.image}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay pointer-events-none"
                    />
                  )}

                  {/* Shimmer Ambient Glow */}
                  <div
                    className="absolute -right-10 -top-16 w-56 h-56 rounded-full pointer-events-none opacity-40"
                    style={{ background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)" }}
                  />

                  {/* Decorative Ghost Icon */}
                  <Icon
                    size={130}
                    strokeWidth={0.8}
                    className="absolute -right-4 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:block text-white/10"
                  />

                  <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 h-full px-6 sm:px-10 py-6">
                    <div className="min-w-0">
                      {/* Badge Pill */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="inline-flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider px-3 py-1 rounded-full text-white backdrop-blur-md shadow-sm border border-white/25"
                          style={{ background: "rgba(255,255,255,0.22)" }}
                        >
                          <BadgeIcon size={12} />
                          <span>{offer.badge}</span>
                        </span>
                        <span className="text-[11.5px] font-bold text-white/80 tracking-wide hidden sm:inline">
                          {offer.eyebrow}
                        </span>
                      </div>

                      <h3 className="text-white font-black text-[20px] sm:text-[26px] leading-tight mb-1 max-w-lg tracking-tight drop-shadow-sm">
                        {offer.title}
                      </h3>
                      <p className="text-white/85 text-[13px] sm:text-[14px] max-w-sm sm:max-w-md leading-relaxed hidden sm:block">
                        {offer.desc}
                      </p>
                    </div>

                    <Link
                      to={offer.to}
                      className="inline-flex items-center gap-2 flex-shrink-0 text-[13px] font-extrabold px-6 py-3 rounded-2xl bg-white hover:bg-white/90 transition-all duration-200 active:scale-95 hover:shadow-lg whitespace-nowrap self-start sm:self-center"
                      style={{ color: offer.accent || "#b91c1c", boxShadow: "0 8px 24px rgba(0,0,0,0.18)" }}
                    >
                      <span>{offer.cta}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Slide Progress Dots */}
        <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {OFFERS.map((_, i) => (
            <button
              key={i}
              onClick={() => swiperRef.current?.slideToLoop(i)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: i === activeIdx ? 20 : 6,
                height: 6,
                background: i === activeIdx ? "#fff" : "rgba(255,255,255,0.4)",
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Perks Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {PERKS.map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-3.5 hover:border-gray-200 hover:shadow-md transition-all shadow-2xs group"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#f0545c]/10 text-[#f0545c] group-hover:scale-110 transition-transform"
            >
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-[12.5px] font-bold text-gray-800 leading-tight block truncate">
                {label}
              </span>
              <span className="text-[11px] font-medium text-gray-400 block truncate">
                {desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
