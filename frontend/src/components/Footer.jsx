import { Twitter, Instagram, Youtube, Heart, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import nowLogo from "../assets/now-logo-mark.png";

const NAV = [
  { label: "Movies", to: "/now-showing" },
  { label: "Shows", to: "/web-shows" },
  { label: "Events", to: "/events" },
  { label: "Play Arenas", to: "/play" },
  { label: "Offers", to: "/offers" },
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const SOCIALS = [
  { Icon: Twitter, href: "#", label: "Twitter" },
  { Icon: Instagram, href: "#", label: "Instagram" },
  { Icon: Youtube, href: "#", label: "YouTube" },
];

export default function Footer() {
  return (
    <footer
      className="relative overflow-hidden bg-[#0c0d12] text-white border-t border-white/10"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Top Accent Gradient Line */}
      <div
        className="h-[2px] w-full"
        style={{
          background: "linear-gradient(90deg, transparent 0%, #f0545c 20%, #f0545c 80%, transparent 100%)",
        }}
      />

      {/* Ambient background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[180px] pointer-events-none opacity-20"
        style={{
          background: "radial-gradient(circle, #f0545c 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-14 relative z-10">
        
        {/* Main Footer Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 py-10 md:py-12 border-b border-white/10">
          
          {/* Brand & Tagline */}
          <div className="flex flex-col items-start gap-3">
            <Link to="/" aria-label="NOW Home" className="flex items-center gap-3 group">
              <img
                src={nowLogo}
                alt="NOW"
                className="h-[36px] w-auto object-contain brightness-110 transition-transform duration-200 group-hover:scale-105"
              />
            </Link>

            <p className="text-[13px] text-gray-400 max-w-sm leading-relaxed">
              Your premier destination for movie ticket reservations, live concerts, stage plays, and sports venue bookings across top cities.
            </p>
          </div>

          {/* Social Links & Trust Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex items-center gap-2">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-[#f0545c] hover:border-[#f0545c] transition-all transform hover:-translate-y-1 shadow-sm"
                >
                  <Icon size={16} strokeWidth={2} />
                </a>
              ))}
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-[12px] font-semibold">
              <ShieldCheck size={16} className="text-[#f0545c]" />
              <span>Certified Booking Partner</span>
            </div>
          </div>
        </div>

        {/* Footer Navigation & Copyright */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 py-7 text-[13px]">
          {/* Navigation Links */}
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-y-2 gap-x-1">
            {NAV.map(({ label, to }, i) => (
              <span key={label} className="flex items-center">
                <Link
                  to={to}
                  className="font-medium text-gray-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {label}
                </Link>
                {i < NAV.length - 1 && (
                  <span className="text-white/20 select-none">•</span>
                )}
              </span>
            ))}
          </nav>

          {/* Copyright & Disclaimer */}
          <div className="flex items-center gap-1.5 text-gray-500 text-[12.5px]">
            <span>© {new Date().getFullYear()} NOW Entertainment Ltd.</span>
            <span>Made with passion for cinema fans</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
