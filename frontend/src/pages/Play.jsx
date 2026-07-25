import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  Clapperboard,
  Radio,
  Download,
  Users,
  MonitorPlay,
  Bell,
  BellRing,
  Sparkles,
  CheckCircle2,
  Wrench,
} from "lucide-react";
import BottomNav from "../components/BottomNav";

/* ─── Config ──────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Clapperboard,
    title: "Originals & Exclusives",
    desc: "Stream CineVerse-original series and films you won't find anywhere else.",
  },
  {
    icon: Radio,
    title: "Live Watch Parties",
    desc: "Watch premieres in sync with friends, with live chat right alongside the player.",
  },
  {
    icon: Download,
    title: "Offline Downloads",
    desc: "Save titles to your device and watch on the go, no connection required.",
  },
  {
    icon: Users,
    title: "Multiple Profiles",
    desc: "Separate watchlists, recommendations, and continue-watching for everyone at home.",
  },
];

const MILESTONES = [
  { label: "Player & streaming infra",  done: true },
  { label: "Content licensing",         done: true },
  { label: "Originals in production",   done: false },
  { label: "Public beta",               done: false },
];

const NOTIFY_KEY = "cv_play_notify_email";

/* ─── Page ────────────────────────────────────────────── */
export default function Play() {
  const [email, setEmail]         = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    if (localStorage.getItem(NOTIFY_KEY)) setSubmitted(true);
  }, []);

  const handleNotify = (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address");
      return;
    }
    setError("");
    localStorage.setItem(NOTIFY_KEY, trimmed);
    setSubmitted(true);
  };

  const doneCount = MILESTONES.filter((m) => m.done).length;
  const progressPct = Math.round((doneCount / MILESTONES.length) * 100);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

        @keyframes cvFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        .cv-float { animation: cvFloat 4.5s ease-in-out infinite; }
        .cv-float-delay { animation: cvFloat 4.5s ease-in-out infinite 1.2s; }

        @keyframes cvPulseRing {
          0%   { box-shadow: 0 0 0 0 rgba(240,84,92,0.35); }
          70%  { box-shadow: 0 0 0 14px rgba(240,84,92,0); }
          100% { box-shadow: 0 0 0 0 rgba(240,84,92,0); }
        }
        .cv-pulse { animation: cvPulseRing 2.2s ease-out infinite; }

        @keyframes cvFilmScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .cv-film-track { animation: cvFilmScroll 14s linear infinite; }
      `}</style>

      <Navbar />
      <BottomNav />

      {/* ══ HERO ══════════════════════════════════════════ */}
      <div className="relative overflow-hidden" style={{ background: "#111" }}>
        {/* Film strip top border */}
        <div
          style={{
            height: 14, fontSize: 0, lineHeight: 0,
            background: "repeating-linear-gradient(90deg, #111 0px, #111 10px, #1e1e1e 10px, #1e1e1e 20px)",
          }}
        />

        {/* Ambient glow */}
        <div
          className="absolute"
          style={{
            top: "-20%", left: "50%", transform: "translateX(-50%)",
            width: 700, height: 700, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(240,84,92,0.16) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-10 py-20 md:py-28 text-center">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-7"
            style={{ background: "rgba(240,84,92,0.14)", border: "1px solid rgba(240,84,92,0.3)" }}
          >
            <Sparkles size={13} color="#f0545c" />
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#f0545c" }}>
              CineVerse Play &middot; In the works
            </span>
          </div>

          <div className="flex items-center justify-center gap-4 mb-5">
            <div
              className="cv-float w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #f0545c, #d94048)" }}
            >
              <MonitorPlay size={32} color="#fff" />
            </div>
          </div>

          <h1
            className="font-black text-white leading-none tracking-tight mb-4"
            style={{ fontSize: "clamp(32px, 6vw, 56px)" }}
          >
            Play is Coming Soon
          </h1>

          <p
            className="text-white/55 leading-relaxed mx-auto mb-9"
            style={{ maxWidth: 480, fontSize: 15 }}
          >
            We're building a streaming experience for CineVerse — originals, exclusives,
            and live watch parties — right alongside your movie and event bookings.
          </p>

          {/* Notify form */}
          {submitted ? (
            <div
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl"
              style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)" }}
            >
              <CheckCircle2 size={17} color="#4ade80" />
              <span className="text-[13px] font-semibold text-white">
                You're on the list — we'll email you the moment Play launches.
              </span>
            </div>
          ) : (
            <form
              onSubmit={handleNotify}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-md mx-auto"
            >
              <div className="flex-1 min-w-0">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-xl text-[13.5px] text-white placeholder-white/35 outline-none"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: `1px solid ${error ? "rgba(240,84,92,0.6)" : "rgba(255,255,255,0.14)"}`,
                  }}
                />
                {error && (
                  <p className="text-left text-[11px] mt-1.5" style={{ color: "#f87171" }}>{error}</p>
                )}
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-xl text-[13.5px] text-white transition-all active:scale-95 flex-shrink-0"
                style={{ background: "#f0545c" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#d94048")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#f0545c")}
              >
                <Bell size={14} /> Notify Me
              </button>
            </form>
          )}
        </div>

        {/* Bottom fade into page */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{ height: 70, background: "linear-gradient(to bottom, transparent, #fff)" }}
        />
      </div>

      {/* ══ FEATURE PREVIEW ══════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 md:px-10 py-16">
        <div className="text-center mb-10">
          <p
            className="text-[11px] font-bold tracking-widest uppercase mb-2"
            style={{ color: "#f0545c" }}
          >
            What to expect
          </p>
          <h2 className="text-[24px] md:text-[28px] font-black text-gray-900 tracking-tight">
            A first look at Play
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-4 p-5 transition-all"
                style={{
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: 14,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(240,84,92,0.3)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#eee";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(240,84,92,0.09)" }}
                >
                  <Icon size={20} color="#f0545c" />
                </div>
                <div>
                  <h3 className="text-[14.5px] font-bold text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══ BUILD PROGRESS ═══════════════════════════════ */}
      <section className="w-full" style={{ background: "#faf8f6", borderTop: "1px solid #eee", borderBottom: "1px solid #eee" }}>
        <div className="max-w-3xl mx-auto px-6 md:px-10 py-14">
          <div className="flex items-center gap-2.5 justify-center mb-2">
            <Wrench size={16} color="#f0545c" />
            <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#f0545c" }}>
              Behind the scenes
            </p>
          </div>
          <h2 className="text-[20px] font-black text-gray-900 text-center mb-8">
            Here's where we're at
          </h2>

          {/* progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-semibold text-gray-500">Overall progress</span>
              <span className="text-[12px] font-bold" style={{ color: "#f0545c" }}>{progressPct}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#eee" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #f0545c, #fb923c)" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MILESTONES.map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: "#fff",
                  border: `1px solid ${m.done ? "rgba(34,197,94,0.25)" : "#eee"}`,
                }}
              >
                {m.done ? (
                  <CheckCircle2 size={17} color="#22c55e" className="flex-shrink-0" />
                ) : (
                  <div className="relative flex-shrink-0">
                    <div className="cv-pulse w-4 h-4 rounded-full" style={{ background: "rgba(240,84,92,0.9)" }} />
                  </div>
                )}
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: m.done ? "#111" : "#6b7280" }}
                >
                  {m.label}
                </span>
                {!m.done && (
                  <span
                    className="ml-auto text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: "rgba(240,84,92,0.08)", color: "#f0545c" }}
                  >
                    In progress
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CLOSING CTA ══════════════════════════════════ */}
      <section className="max-w-3xl mx-auto px-6 md:px-10 py-14 text-center">
        <BellRing size={26} className="mx-auto mb-3" color="#f0545c" />
        <h2 className="text-[19px] font-bold text-gray-900 mb-2">
          Nothing to book here — yet.
        </h2>
        <p className="text-[13.5px] text-gray-500 max-w-md mx-auto leading-relaxed">
          While Play is in the oven, keep exploring live movies and events already on CineVerse.
        </p>
      </section>

      <Footer />
    </div>
  );
}