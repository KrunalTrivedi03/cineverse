import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BottomNav from "../components/BottomNav";
import {
  Sparkles,
  Target,
  Eye,
  Users,
  Film,
  CalendarDays,
  Ticket,
  ShieldCheck,
  Wallet,
  Globe,
  ArrowRight,
  Heart,
} from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: Film,
    title: "Movies, Events & Plays",
    desc: "One platform for everything worth experiencing — from the latest blockbuster releases to live concerts and theatre.",
  },
  {
    icon: Ticket,
    title: "Instant Digital Tickets",
    desc: "Book in seconds and receive your digital m-tickets delivered directly with seamless cinema barcode entry.",
  },
  {
    icon: Wallet,
    title: "QuickPay Wallet",
    desc: "A secure, instant built-in wallet that makes checkout effortless — top up once, pay everywhere.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Reliable Locking",
    desc: "Every booking is protected end-to-end, with real-time seat locking so you never lose your spot during checkout.",
  },
  {
    icon: Globe,
    title: "Growing Every City",
    desc: "Expanding across metropolitan hubs and tier-1 zones, bringing the full NOW cinema & sports experience closer.",
  },
  {
    icon: Heart,
    title: "Engineered for Fans",
    desc: "Curated recommendations, personal watchlists, and member-exclusive offers made around what you love.",
  },
];

const STATS = [
  { value: "50K+", label: "Tickets Booked" },
  { value: "120+", label: "Premieres & Events" },
  { value: "15+", label: "Metropolitan Cities" },
  { value: "4.8★", label: "User Satisfaction" },
];

export default function Aboutus() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex flex-col justify-between" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div>
        <Navbar />
        <BottomNav />

        {/* ══ HERO BANNER ═══════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#0c0d12]">
          <div
            className="absolute -right-24 -top-24 w-80 h-80 rounded-full pointer-events-none opacity-20"
            style={{ background: "radial-gradient(circle, #f0545c 0%, transparent 70%)" }}
          />
          <div
            className="absolute -left-20 bottom-0 w-72 h-72 rounded-full pointer-events-none opacity-15"
            style={{ background: "radial-gradient(circle, #f0545c 0%, transparent 70%)" }}
          />
          <div className="relative max-w-5xl mx-auto px-6 md:px-8 pt-16 pb-20 md:pt-24 md:pb-28 text-center z-10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#f0545c] mb-3">
              About NOW Entertainment
            </p>
            <h1 className="text-white font-black text-[34px] sm:text-[46px] md:text-[56px] leading-[1.08] tracking-tight max-w-3xl mx-auto">
              One Unified Hub, <span className="text-[#f0545c]">Every Experience</span>
            </h1>
            <p className="text-white/60 text-[15px] sm:text-[17px] max-w-xl mx-auto mt-5 leading-relaxed font-medium">
              NOW brings movies, live concerts, stage plays and sports court bookings together in an ultra-modern, frictionless experience.
            </p>
          </div>
        </section>

        {/* ══ STATS STRIP ═══════════════════════════════════ */}
        <section className="max-w-6xl mx-auto px-6 md:px-8 -mt-10 md:-mt-12 relative z-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[28px] md:text-[34px] font-black text-[#f0545c] leading-none">
                  {s.value}
                </p>
                <p className="text-[12.5px] text-gray-500 font-bold mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ OVERVIEW ═════════════════════════════════════ */}
        <section className="max-w-6xl mx-auto px-6 md:px-8 pt-16 md:pt-24 pb-8">
          <div className="grid md:grid-cols-[1fr_1.1fr] gap-10 md:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0545c]/10 text-[#f0545c] text-[11px] font-extrabold uppercase tracking-widest mb-3 border border-[#f0545c]/20">
                <span>Our Heritage</span>
              </div>
              <h2 className="text-[26px] md:text-[34px] font-black text-gray-900 tracking-tight leading-tight mb-4">
                Redefining How India Goes Out
              </h2>
              <p className="text-[14.5px] text-gray-600 leading-relaxed mb-4">
                NOW started with a simple belief: finding a cinema seat, a concert pass or a badminton turf shouldn't require juggling multiple confusing portals. We built a unified experience with real-time seat locking, instant digital barcodes, and high-speed checkout.
              </p>
              <p className="text-[14.5px] text-gray-600 leading-relaxed">
                Today, NOW serves movie lovers and event attendees across 15+ cities with newly updated schedules, verified reviews, and personalized watchlists.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl overflow-hidden aspect-[3/4] bg-gray-100 shadow-md border border-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=60"
                  alt="Cinema hall"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="rounded-3xl overflow-hidden aspect-[3/4] bg-gray-100 shadow-md border border-gray-100 mt-8">
                <img
                  src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&q=60"
                  alt="Live concert crowd"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ══ MISSION & VISION ══════════════════════════════ */}
        <section className="max-w-6xl mx-auto px-6 md:px-8 py-14 md:py-20">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-3xl p-8 md:p-10 bg-white border border-red-100/70 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-[#f0545c]/10 text-[#f0545c]">
                <Target size={22} />
              </div>
              <h3 className="text-[20px] font-black text-gray-900 mb-2">Our Mission</h3>
              <p className="text-[14px] text-gray-600 leading-relaxed">
                To deliver the most intuitive, beautiful entertainment booking experience in the country — connecting millions of users seamlessly from discovery to their seats with zero friction.
              </p>
            </div>

            <div className="rounded-3xl p-8 md:p-10 bg-white border border-purple-100/70 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-purple-500/10 text-purple-600">
                <Eye size={22} />
              </div>
              <h3 className="text-[20px] font-black text-gray-900 mb-2">Our Vision</h3>
              <p className="text-[14px] text-gray-600 leading-relaxed">
                To establish NOW as the premier entertainment companion for every outing — the first and only destination opened when planning a weekend night out or booking weekend sports slots.
              </p>
            </div>
          </div>
        </section>

        {/* ══ HIGHLIGHTS ════════════════════════════════════ */}
        <section className="max-w-6xl mx-auto px-6 md:px-8 pb-16 md:pb-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0545c]/10 text-[#f0545c] text-[11px] font-extrabold uppercase tracking-widest mb-2 border border-[#f0545c]/20">
              <span>Why Choose Us</span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-black text-gray-900 tracking-tight">
              Engineered For The Modern Cinema Goer
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white border border-gray-100 rounded-3xl p-7 shadow-2xs card-hover-lift"
              >
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 bg-[#f0545c]/10 text-[#f0545c]">
                  <Icon size={20} />
                </div>
                <h3 className="text-[16px] font-black text-gray-900 mb-1.5">{title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ BANNER CTA ════════════════════════════════════ */}
        <section className="max-w-6xl mx-auto px-6 md:px-8 pb-20 md:pb-28">
          <div
            className="relative overflow-hidden rounded-3xl px-8 md:px-14 py-14 text-center shadow-2xl"
            style={{ background: "linear-gradient(135deg, #111422 0%, #1f2338 60%, #2a2238 100%)" }}
          >
            <div
              className="absolute -right-16 -top-16 w-64 h-64 rounded-full pointer-events-none opacity-25"
              style={{ background: "radial-gradient(circle, #f0545c 0%, transparent 70%)" }}
            />

            <h2 className="relative z-10 text-white font-black text-[26px] md:text-[36px] tracking-tight mb-3">
              Ready to Explore What's Playing?
            </h2>
            <p className="relative z-10 text-white/70 text-[14.5px] max-w-md mx-auto mb-8 font-medium">
              Discover blockbusters, comedy nights, turf games, and theatrical performances in your city.
            </p>
            <Link
              to="/"
              className="relative z-10 inline-flex items-center gap-2 font-bold text-[14px] px-8 py-3.5 rounded-2xl text-white bg-[#f0545c] hover:bg-[#e03a43] shadow-md hover:shadow-lg active:scale-95 transition-all"
            >
              <span>Explore Top Shows</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
