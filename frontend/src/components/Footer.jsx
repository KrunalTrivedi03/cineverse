import { Twitter, Instagram, Youtube, ShieldCheck } from "lucide-react";
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
      className="relative overflow-hidden bg-white text-neutral-700 border-t border-neutral-150"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Main Footer Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-10 md:py-12 border-b border-neutral-100">
          
          {/* Brand & Tagline */}
          <div className="flex flex-col items-start gap-2.5">
            <Link to="/" aria-label="NOW Home" className="flex items-center gap-3">
              <img
                src={nowLogo}
                alt="NOW"
                className="h-[30px] w-auto object-contain"
              />
            </Link>

            <p className="text-xs sm:text-sm text-neutral-500 max-w-sm leading-relaxed">
              Ticket reservations for movies, live concerts, stage performances, and sports turfs across premier venues.
            </p>
          </div>

          {/* Social Links & Trust Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-neutral-100 border border-neutral-200 text-neutral-600 hover:text-white hover:bg-[#ff4d58] hover:border-[#ff4d58] transition-all shadow-2xs"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-100/80 border border-neutral-200/80 text-neutral-700 text-xs font-semibold shadow-2xs">
              <ShieldCheck size={14} className="text-[#ff4d58]" />
              <span>Official Ticket Partner</span>
            </div>
          </div>
        </div>

        {/* Footer Navigation & Copyright (with safe pb-28 on mobile for bottom navigation) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6 pb-28 md:pb-6 text-xs text-neutral-500">
          {/* Navigation Links */}
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-y-2 gap-x-1">
            {NAV.map(({ label, to }, i) => (
              <span key={label} className="flex items-center">
                <Link
                  to={to}
                  className="text-neutral-500 hover:text-neutral-900 px-2 py-1 transition-colors font-medium"
                >
                  {label}
                </Link>
                {i < NAV.length - 1 && (
                  <span className="text-neutral-300 select-none">•</span>
                )}
              </span>
            ))}
          </nav>

          {/* Copyright */}
          <div>
            <span>© {new Date().getFullYear()} NOW Entertainment. All rights reserved.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
