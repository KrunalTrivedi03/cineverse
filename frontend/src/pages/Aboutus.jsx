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
    desc: "One platform for everything worth experiencing — from the latest releases to live shows and theatre.",
  },
  {
    icon: Ticket,
    title: "Instant E-Tickets",
    desc: "Book in seconds and get your tickets delivered straight to your inbox, no queues involved.",
  },
  {
    icon: Wallet,
    title: "QuickPay Wallet",
    desc: "A secure, built-in wallet that makes checkout effortless — top up once, pay everywhere.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Reliable",
    desc: "Every booking is protected end-to-end, with real-time seat locking so you never lose your spot.",
  },
  {
    icon: Globe,
    title: "Growing Every City",
    desc: "We're expanding city by city, bringing the full CineVerse experience closer to you.",
  },
  {
    icon: Heart,
    title: "Built for Fans",
    desc: "Curated recommendations, watchlists and personalised offers — made around what you love.",
  },
];

const STATS = [
  { value: "50K+", label: "Tickets booked" },
  { value: "120+", label: "Movies & events" },
  { value: "15+", label: "Cities & counting" },
  { value: "4.7★", label: "Average rating" },
];

export default function Aboutus() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');`}</style>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "#14141a" }}>
        <div
          className="absolute -right-24 -top-24 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "rgba(240,84,92,0.18)" }}
        />
        <div
          className="absolute -left-16 bottom-0 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: "rgba(240,84,92,0.10)" }}
        />
        <div className="relative max-w-5xl mx-auto px-5 md:px-8 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
          <div className="inline-flex items-center gap-1.5 mb-5 px-3 py-1.5 rounded-full" style={{ background: "rgba(240,84,92,0.15)" }}>
            <Sparkles size={12} style={{ color: "#f0545c" }} />
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#f0545c" }}>
              About CineVerse
            </span>
          </div>
          <h1 className="text-white font-black text-[32px] sm:text-[44px] md:text-[52px] leading-[1.1] tracking-tight max-w-3xl mx-auto" style={{ letterSpacing: "-0.02em" }}>
            One Platform, <span style={{ color: "#f0545c" }}>Every Experience</span>
          </h1>
          <p className="text-white/60 text-[14px] sm:text-[16px] max-w-xl mx-auto mt-5 leading-relaxed">
            CineVerse brings movies, live events and plays together in a single, seamless booking
            experience — designed for people who love to go out and be entertained.
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 -mt-10 md:-mt-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 md:p-7">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-[24px] md:text-[30px] font-black" style={{ color: "#f0545c", letterSpacing: "-0.02em" }}>
                {s.value}
              </p>
              <p className="text-[12px] md:text-[13px] text-gray-500 font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Overview */}
      <section className="max-w-5xl mx-auto px-5 md:px-8 pt-16 md:pt-20 pb-4">
        <div className="grid md:grid-cols-[1fr_1.1fr] gap-8 md:gap-14 items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#f0545c" }}>
              Who we are
            </p>
            <h2 className="text-[24px] md:text-[30px] font-black text-gray-900 tracking-tight leading-tight mb-4">
              A single home for everything you want to experience
            </h2>
            <p className="text-[14px] text-gray-500 leading-relaxed mb-4">
              CineVerse started with a simple idea: booking a movie ticket, a concert pass or a play
              shouldn't mean juggling five different apps. We built one platform that brings it all
              together — discovery, booking, payments and reminders — in a fast, modern experience.
            </p>
            <p className="text-[14px] text-gray-500 leading-relaxed">
              Today, CineVerse is a fast-growing entertainment platform covering movies, live events
              and theatre, with new cities, venues and experiences added every week.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="rounded-2xl overflow-hidden aspect-[3/4] bg-gray-100">
              <img
                src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=60"
                alt="Cinema hall"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden aspect-[3/4] bg-gray-100 mt-6">
              <img
                src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&q=60"
                alt="Live concert crowd"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-5 md:gap-6">
          <div className="rounded-3xl p-7 md:p-9" style={{ background: "#fff5f5" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: "rgba(240,84,92,0.12)" }}>
              <Target size={20} style={{ color: "#f0545c" }} />
            </div>
            <h3 className="text-[19px] font-extrabold text-gray-900 mb-2.5">Our Mission</h3>
            <p className="text-[14px] text-gray-500 leading-relaxed">
              To make discovering and booking entertainment effortless — connecting people to the
              movies, events and plays they'll love, with zero friction from search to seat.
            </p>
          </div>
          <div className="rounded-3xl p-7 md:p-9" style={{ background: "#f5f4ff" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: "rgba(124,58,237,0.12)" }}>
              <Eye size={20} style={{ color: "#7c3aed" }} />
            </div>
            <h3 className="text-[19px] font-extrabold text-gray-900 mb-2.5">Our Vision</h3>
            <p className="text-[14px] text-gray-500 leading-relaxed">
              To become the most trusted entertainment companion in every city we serve — the first
              place people open when they want to go out and experience something great.
            </p>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-16 md:pb-20">
        <div className="text-center mb-10 md:mb-12">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#f0545c" }}>
            Why CineVerse
          </p>
          <h2 className="text-[24px] md:text-[30px] font-black text-gray-900 tracking-tight">
            Built for a better night out
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(240,84,92,0.08)" }}>
                <Icon size={18} style={{ color: "#f0545c" }} />
              </div>
              <h3 className="text-[15px] font-bold text-gray-900 mb-1.5">{title}</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-20 md:pb-28">
        <div
          className="relative overflow-hidden rounded-3xl px-6 md:px-14 py-12 md:py-16 text-center"
          style={{ background: "linear-gradient(135deg, #f0545c 0%, #ff8a65 100%)" }}
        >
          <Users size={140} strokeWidth={1} className="absolute -right-6 -bottom-10 hidden md:block" style={{ color: "rgba(255,255,255,0.15)" }} />
          <CalendarDays size={110} strokeWidth={1} className="absolute -left-4 -top-8 hidden md:block" style={{ color: "rgba(255,255,255,0.12)" }} />
          <h2 className="relative text-white font-black text-[24px] md:text-[32px] tracking-tight mb-3">
            Ready to explore what's on?
          </h2>
          <p className="relative text-white/80 text-[14px] max-w-md mx-auto mb-7">
            Discover movies, events and plays happening near you, and book in just a few taps.
          </p>
          <Link
            to="/"
            className="relative inline-flex items-center gap-2 bg-white font-bold text-[14px] px-6 py-3 rounded-full hover:-translate-y-0.5 transition-transform"
            style={{ color: "#c0392b" }}
          >
            Start exploring <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}