import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BottomNav from "../components/BottomNav";
import { fetchActiveOffers, IMG, formatDiscountLabel, formatValidity, themeGradient } from "../utils/offers";
import {
  Tag,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  Film,
  CalendarDays,
  Layers,
  Percent,
  ArrowRight,
  Flame,
  ShieldCheck,
  Zap,
} from "lucide-react";

const TABS = [
  { key: "all", label: "All Offers", icon: Layers },
  { key: "movies", label: "Movies Only", icon: Film },
  { key: "events", label: "Live Events", icon: CalendarDays },
];

function OfferCard({ offer }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (!offer.code) return;
    navigator.clipboard?.writeText(offer.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden card-hover-lift">
      {/* Banner / Poster Header */}
      <div
        className="relative h-44 sm:h-48 overflow-hidden flex flex-col justify-between p-6"
        style={{ background: themeGradient(offer.theme) }}
      >
        {offer.image && (
          <img
            src={IMG(offer.image)}
            alt={offer.title}
            className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay transition-transform duration-700 group-hover:scale-105"
          />
        )}
        
        {/* Subtle decorative background watermarks */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <Tag
          size={110}
          strokeWidth={1}
          className="absolute -right-4 -bottom-6 text-white/10 hidden sm:block pointer-events-none select-none transition-transform duration-500 group-hover:scale-110"
        />

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-[#f0545c] shadow-sm">
            <Percent size={11} className="stroke-[3]" /> {formatDiscountLabel(offer)}
          </span>

          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md text-white/90 border border-white/20">
            <Flame size={11} className="text-amber-300" />
            {offer.applicableTo === "all" ? "All Access" : offer.applicableTo}
          </span>
        </div>

        {/* Title */}
        <div className="relative z-10">
          <h3 className="text-white font-black text-[20px] sm:text-[22px] leading-tight tracking-tight drop-shadow-sm line-clamp-2">
            {offer.title}
          </h3>
          <p className="text-white/80 text-[12px] font-medium mt-1 flex items-center gap-1">
            <Zap size={11} className="text-yellow-300" /> Auto-applies or copy code
          </p>
        </div>
      </div>

      {/* Ticket Tear Perforation Strip */}
      <div className="relative flex items-center justify-between px-4 py-0 bg-white">
        <div className="w-5 h-5 -ml-6.5 rounded-full bg-[#f8fafc] border-r border-gray-100 shadow-inner" />
        <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-2" />
        <div className="w-5 h-5 -mr-6.5 rounded-full bg-[#f8fafc] border-l border-gray-100 shadow-inner" />
      </div>

      {/* Card Content Body */}
      <div className="p-6 flex flex-col gap-4 flex-1 bg-white">
        {offer.description && (
          <p className="text-[13px] text-gray-600 leading-relaxed font-normal">
            {offer.description}
          </p>
        )}

        {/* Validity */}
        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
          <span className="px-2.5 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-gray-500 font-semibold">
            {formatValidity(offer)}
          </span>
        </div>

        {/* Coupon Code Pill */}
        {offer.code && (
          <button
            type="button"
            onClick={copyCode}
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border-2 border-dashed transition-all duration-200 group/btn"
            style={{
              borderColor: copied ? "#10b981" : "rgba(240, 84, 92, 0.4)",
              background: copied ? "rgba(16, 185, 129, 0.05)" : "rgba(240, 84, 92, 0.03)",
            }}
          >
            <div className="text-left">
              <span className="block text-[9px] font-extrabold uppercase tracking-widest text-gray-400">
                Promo Code
              </span>
              <span
                className="text-[14px] font-black tracking-widest"
                style={{ color: copied ? "#10b981" : "#f0545c" }}
              >
                {offer.code}
              </span>
            </div>

            <span
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
              style={{
                background: copied ? "#10b981" : "#f0545c",
                color: "#ffffff",
              }}
            >
              {copied ? (
                <>
                  <Check size={13} className="stroke-[3]" /> Copied!
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy
                </>
              )}
            </span>
          </button>
        )}

        {/* Collapsible Terms */}
        {offer.termsAndConditions?.length > 0 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-[12px] font-bold text-gray-400 hover:text-gray-700 transition-colors"
            >
              <span>Terms &amp; conditions</span>
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              />
            </button>
            {expanded && (
              <ul className="mt-2.5 space-y-1.5 pl-1 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                {offer.termsAndConditions.map((t, i) => (
                  <li key={i} className="text-[11.5px] text-gray-500 leading-relaxed flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f0545c] mt-1.5 flex-shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* CTA Link */}
        <Link
          to={offer.applicableTo === "events" ? "/events" : "/"}
          className="mt-auto inline-flex items-center justify-between w-full pt-3 border-t border-gray-100 text-[13px] font-bold group-hover:text-[#f0545c] text-gray-700 transition-colors"
        >
          <span>{offer.ctaText || "Explore shows"}</span>
          <span className="w-7 h-7 rounded-full bg-red-50 text-[#f0545c] flex items-center justify-center transition-transform group-hover:translate-x-1">
            <ArrowRight size={13} />
          </span>
        </Link>
      </div>
    </div>
  );
}

export default function Offers() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    setLoading(true);
    fetchActiveOffers()
      .then(setOffers)
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (tab === "all") return offers;
    return offers.filter((o) => o.applicableTo === tab || o.applicableTo === "all");
  }, [offers, tab]);

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Navbar />

      {/* Cinematic Hero Section */}
      <section className="relative overflow-hidden bg-[#0c0d12] text-white pt-20 pb-24 md:pt-24 md:pb-28">
        {/* Ambient radial lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[radial-gradient(ellipse_at_top,_rgba(240,84,92,0.22)_0%,_transparent_70%)] pointer-events-none" />
        <div className="absolute -left-20 top-20 w-80 h-80 rounded-full bg-[#f0545c]/10 blur-3xl pointer-events-none" />
        <div className="absolute -right-20 top-10 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-5 md:px-8 text-center">
          <p className="text-[11px] font-bold text-[#f0545c] uppercase tracking-wider mb-3">
            Special Offers &amp; Perks
          </p>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-white">
            Unlock exclusive <br className="hidden sm:inline" />
            <span>entertainment savings</span>
          </h1>

          <p className="text-white/60 text-[14px] sm:text-[16px] max-w-xl mx-auto mt-4 leading-relaxed font-normal">
            Enjoy instant discounts on blockbuster movies, stadium concerts, and sports arenas. Apply promo codes at checkout in one tap.
          </p>

          {/* Quick Perks Strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-8 pt-6 border-t border-white/10 text-[12px] sm:text-[13px] text-white/70 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Verified Valid Offers</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-amber-400" />
              <span>Instant Checkout Application</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-[#f0545c]" />
              <span>No Hidden Charges</span>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Filter Tabs */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 -mt-8 relative z-20">
        <div className="inline-flex p-1.5 rounded-2xl bg-white shadow-xl shadow-gray-200/50 border border-gray-100 gap-1.5">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-extrabold transition-all duration-200 ${
                  active
                    ? "bg-[#f0545c] text-white shadow-md shadow-[#f0545c]/30"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Offers Grid */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-16 pb-24">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl overflow-hidden bg-white border border-gray-100 p-0 shadow-sm"
              >
                <div className="h-44 bg-gray-100 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-4 w-3/4 bg-gray-100 rounded-md animate-pulse" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded-md animate-pulse" />
                  <div className="h-10 w-full bg-gray-100 rounded-xl animate-pulse mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 bg-red-50 text-[#f0545c]">
              <Tag size={28} />
            </div>
            <p className="text-[17px] font-extrabold text-gray-800">No active offers for this category</p>
            <p className="text-[13px] text-gray-400 mt-1 max-w-sm">
              We update our promotional perks weekly. Switch to "All Offers" to browse all current deals.
            </p>
            <button
              onClick={() => setTab("all")}
              className="mt-5 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-[13px] font-bold hover:bg-black transition-colors"
            >
              Show All Offers
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((offer) => (
              <OfferCard key={offer._id} offer={offer} />
            ))}
          </div>
        )}
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}
