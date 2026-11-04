import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import {
  Percent, Gift, Ticket, ArrowRight,
  ChevronLeft, ChevronRight, Tag, ShieldCheck,
} from "lucide-react";
import { fetchBannerOffers, IMG, themeGradient, formatDiscountLabel } from "../utils/offers";

const PERKS = [
  { icon: Percent, label: "Price Guarantee", desc: "Standard booking rates" },
  { icon: Gift, label: "Member Rewards", desc: "Exclusive promotional perks" },
  { icon: Ticket, label: "Digital Passes", desc: "Instant mobile entry barcodes" },
  { icon: ShieldCheck, label: "Secure Payments", desc: "PCI-DSS certified gateway" },
];

function normalizeBackendOffer(offer) {
  return {
    id: offer._id,
    icon: Tag,
    badge: formatDiscountLabel(offer),
    eyebrow: offer.subtitle || "Featured Promotion",
    title: offer.title,
    desc: offer.description || "",
    cta: offer.ctaText || "Claim Perk",
    to: offer.ctaLink || "/offers",
    bg: themeGradient(offer.theme),
    accent: "#b91c1c",
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
      .catch(() => {
        if (!cancelled) setOffers([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || offers.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 pt-8 md:pt-10">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Promotions &amp; Benefits
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Special offers and banking discounts applied at checkout
          </p>
        </div>

        {/* Desktop slider navigation arrows */}
        <div className="hidden md:flex items-center gap-1.5">
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            className="w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-black hover:border-neutral-300 transition-colors cursor-pointer"
            aria-label="Previous Offer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => swiperRef.current?.slideNext()}
            className="w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-black hover:border-neutral-300 transition-colors cursor-pointer"
            aria-label="Next Offer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden shadow-sm border border-neutral-100 group">
        <Swiper
          onSwiper={(s) => (swiperRef.current = s)}
          onSlideChange={(s) => setActiveIdx(s.realIndex)}
          modules={[Autoplay, Pagination]}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop
          speed={700}
          className="w-full"
        >
          {offers.map((offer) => (
            <SwiperSlide key={offer.id}>
              <div
                className="relative overflow-hidden"
                style={{ background: offer.bg, minHeight: 130 }}
              >
                {offer.image && (
                  <img
                    src={offer.image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-overlay pointer-events-none"
                  />
                )}

                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 h-full px-6 sm:px-8 py-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/20 text-white backdrop-blur-md">
                        {offer.badge}
                      </span>
                      <span className="text-xs text-white/80 font-medium hidden sm:inline">
                        {offer.eyebrow}
                      </span>
                    </div>

                    <h3 className="text-white font-bold text-lg sm:text-xl leading-tight mb-1 max-w-lg tracking-tight">
                      {offer.title}
                    </h3>
                    <p className="text-white/80 text-xs max-w-md line-clamp-1 hidden sm:block">
                      {offer.desc}
                    </p>
                  </div>

                  <Link
                    to={offer.to}
                    className="inline-flex items-center gap-1.5 flex-shrink-0 text-xs font-semibold px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-50 text-neutral-900 transition-all shadow-xs self-start sm:self-center"
                  >
                    <span>{offer.cta}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Perks Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {PERKS.map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="flex items-center gap-3 bg-white border border-neutral-200/80 rounded-xl p-3 shadow-2xs"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-neutral-100 text-neutral-700">
              <Icon size={15} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-neutral-800 leading-tight block truncate">
                {label}
              </span>
              <span className="text-[11px] text-neutral-400 block truncate">
                {desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
