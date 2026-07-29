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
} from "lucide-react";

const TABS = [
  { key: "all", label: "All Offers", icon: Layers },
  { key: "movies", label: "Movies", icon: Film },
  { key: "events", label: "Events", icon: CalendarDays },
];

function OfferCard({ offer }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (!offer.code) return;
    navigator.clipboard?.writeText(offer.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200 flex flex-col">
      {/* Banner */}
      <div className="relative h-36 sm:h-40 overflow-hidden" style={{ background: themeGradient(offer.theme) }}>
        {offer.image && (
          <img src={IMG(offer.image)} alt={offer.title} className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-overlay" />
        )}
        <Tag size={110} strokeWidth={1} className="absolute -right-4 -bottom-6 hidden sm:block" style={{ color: "rgba(255,255,255,0.16)" }} />
        <div className="relative h-full flex flex-col justify-between p-5">
          <span className="inline-flex items-center gap-1 w-fit text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full bg-white/90" style={{ color: "#c0392b" }}>
            <Percent size={10} /> {formatDiscountLabel(offer)}
          </span>
          <h3 className="text-white font-black text-[18px] sm:text-[20px] leading-tight max-w-[85%]">{offer.title}</h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        {offer.description && <p className="text-[13px] text-gray-500 leading-relaxed">{offer.description}</p>}

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400 font-medium">
          <span className="px-2 py-1 rounded-full bg-gray-50 border border-gray-100 capitalize">
            {offer.applicableTo === "all" ? "Movies & Events" : offer.applicableTo}
          </span>
          <span>{formatValidity(offer)}</span>
        </div>

        {offer.code && (
          <button
            onClick={copyCode}
            className="flex items-center justify-between gap-2 border border-dashed rounded-xl px-3.5 py-2.5 text-[13px] font-bold w-full"
            style={{ borderColor: "#f0545c", color: "#f0545c" }}
          >
            <span className="tracking-widest">{offer.code}</span>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        )}

        {offer.termsAndConditions?.length > 0 && (
          <div className="mt-1">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-[12px] font-semibold text-gray-500 hover:text-gray-800"
            >
              Terms &amp; Conditions
              <ChevronDown size={13} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
            {expanded && (
              <ul className="mt-2 flex flex-col gap-1.5">
                {offer.termsAndConditions.map((t, i) => (
                  <li key={i} className="text-[11.5px] text-gray-400 leading-relaxed flex gap-1.5">
                    <span className="text-gray-300">•</span>
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <Link
          to={offer.applicableTo === "events" ? "/events" : "/"}
          className="mt-auto inline-flex items-center gap-1.5 text-[13px] font-bold pt-2"
          style={{ color: "#f0545c" }}
        >
          {offer.ctaText || "Explore now"} <ArrowRight size={13} />
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
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');`}</style>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "#14141a" }}>
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full pointer-events-none" style={{ background: "rgba(240,84,92,0.16)" }} />
        <div className="relative max-w-4xl mx-auto px-5 md:px-8 pt-14 pb-14 md:pt-18 md:pb-16 text-center">
          <div className="inline-flex items-center gap-1.5 mb-4 px-3 py-1.5 rounded-full" style={{ background: "rgba(240,84,92,0.15)" }}>
            <Sparkles size={12} style={{ color: "#f0545c" }} />
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#f0545c" }}>
              Offers & Deals
            </span>
          </div>
          <h1 className="text-white font-black text-[28px] sm:text-[38px] md:text-[42px] leading-[1.1] tracking-tight">
            Every deal, <span style={{ color: "#f0545c" }}>in one place</span>
          </h1>
          <p className="text-white/60 text-[14px] max-w-lg mx-auto mt-4 leading-relaxed">
            Live offers on movies and events, applied automatically at checkout — no codes to hunt down.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 -mt-7 relative z-10">
        <div className="inline-flex bg-white border border-gray-100 shadow-lg rounded-2xl p-1.5 gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all"
              style={
                tab === key
                  ? { background: "#f0545c", color: "#fff" }
                  : { background: "transparent", color: "#6b7280" }
              }
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl overflow-hidden border border-gray-100">
                <div className="h-40 bg-gray-100 animate-pulse" />
                <div className="p-5 flex flex-col gap-2">
                  <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(240,84,92,0.08)" }}>
              <Tag size={24} style={{ color: "#f0545c" }} />
            </div>
            <p className="text-[15px] font-bold text-gray-700">No live offers right now</p>
            <p className="text-[13px] text-gray-400 mt-1 max-w-xs">
              Check back soon — new deals are added regularly from our team.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
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