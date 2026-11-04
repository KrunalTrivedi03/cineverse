import React from "react";

/**
 * CinemaIllustrations
 * Vector pastel artwork matching the mockups in Image 1:
 * - HeroBannerArt: Popcorn tub, clapperboard, and film reel composition
 * - MovieDetailArt: Film reel with glowing play ribbon
 * - WatchlistArt: Popcorn bucket with play icon
 */

export function HeroBannerArt({ className = "w-64 h-56" }) {
  return (
    <div className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 280 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.06)]"
      >
        <defs>
          <linearGradient id="reelGrad" x1="40" y1="50" x2="160" y2="170" gradientUnits="userSpaceOnUse">
            <stop stopColor="#818cf8" />
            <stop offset="1" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="clapperGrad" x1="120" y1="20" x2="220" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e293b" />
            <stop offset="1" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="popcornTub" x1="140" y1="100" x2="230" y2="230" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#f8fafc" />
          </linearGradient>
          <linearGradient id="popcornStripe" x1="140" y1="100" x2="230" y2="230" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff4d58" />
            <stop offset="1" stopColor="#e11d48" />
          </linearGradient>
          <linearGradient id="popCornGold" x1="150" y1="80" x2="220" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fef08a" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* 1. Film Reel (Back Left) */}
        <g transform="translate(15, 30)">
          <circle cx="70" cy="80" r="55" fill="url(#reelGrad)" />
          <circle cx="70" cy="80" r="44" stroke="#ffffff" strokeWidth="4" strokeOpacity="0.8" />
          <circle cx="70" cy="80" r="18" fill="#4338ca" />
          <circle cx="70" cy="80" r="8" fill="#ffffff" />
          {/* Spool Holes */}
          <circle cx="70" cy="50" r="9" fill="#4338ca" />
          <circle cx="70" cy="110" r="9" fill="#4338ca" />
          <circle cx="40" cy="80" r="9" fill="#4338ca" />
          <circle cx="100" cy="80" r="9" fill="#4338ca" />
          <circle cx="49" cy="59" r="9" fill="#4338ca" />
          <circle cx="91" cy="101" r="9" fill="#4338ca" />
        </g>

        {/* 2. Clapperboard (Top Center/Right) */}
        <g transform="translate(130, 25) rotate(12)">
          {/* Base Slate */}
          <rect x="0" y="22" width="85" height="60" rx="8" fill="url(#clapperGrad)" />
          {/* Angled Top Striped Arm */}
          <g transform="rotate(-15, 0, 22)">
            <rect x="0" y="0" width="85" height="18" rx="5" fill="#0f172a" />
            {/* White Stripes */}
            <path d="M12 0L24 18H16L4 0H12Z" fill="#ffffff" />
            <path d="M32 0L44 18H36L24 0H32Z" fill="#ffffff" />
            <path d="M52 0L64 18H56L44 0H52Z" fill="#ffffff" />
            <path d="M72 0L84 18H76L64 0H72Z" fill="#ffffff" />
          </g>
          {/* Red Play triangle in center of slate */}
          <polygon points="40,46 40,62 54,54" fill="#ff4d58" />
        </g>

        {/* 3. Striped Popcorn Tub (Front Right) */}
        <g transform="translate(155, 95)">
          {/* Popcorn Puffs */}
          <circle cx="22" cy="12" r="12" fill="url(#popCornGold)" />
          <circle cx="36" cy="6" r="14" fill="url(#popCornGold)" />
          <circle cx="52" cy="10" r="13" fill="url(#popCornGold)" />
          <circle cx="28" cy="22" r="11" fill="#fde047" />
          <circle cx="44" cy="20" r="12" fill="#fde047" />
          <circle cx="60" cy="22" r="10" fill="#fde047" />

          {/* Tub Container Body */}
          <path d="M10 28 L18 100 C18 104 22 108 26 108 H54 C58 108 62 104 62 100 L70 28 Z" fill="url(#popcornTub)" stroke="#e2e8f0" strokeWidth="2" />
          
          {/* Red Stripes on Tub */}
          <path d="M18 28 L23 108 H29 L25 28 Z" fill="url(#popcornStripe)" />
          <path d="M37 28 L37 108 H43 L43 28 Z" fill="url(#popcornStripe)" />
          <path d="M55 28 L51 108 H57 L62 28 Z" fill="url(#popcornStripe)" />

          {/* Floating popped kernels */}
          <circle cx="-14" cy="40" r="6" fill="#facc15" />
          <circle cx="-6" cy="20" r="5" fill="#fef08a" />
          <circle cx="78" cy="50" r="5" fill="#facc15" />
        </g>
      </svg>
    </div>
  );
}

export function MovieDetailArt({ className = "w-44 h-44" }) {
  return (
    <div className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 180 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-[0_10px_20px_rgba(99,102,241,0.12)]"
      >
        <defs>
          <linearGradient id="detailReel" x1="30" y1="20" x2="150" y2="140" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a5b4fc" />
            <stop offset="1" stopColor="#818cf8" />
          </linearGradient>
          <linearGradient id="playRibbon" x1="80" y1="80" x2="160" y2="150" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fda4af" />
            <stop offset="1" stopColor="#f43f5e" />
          </linearGradient>
        </defs>

        {/* Big Reel */}
        <circle cx="110" cy="70" r="52" fill="url(#detailReel)" />
        <circle cx="110" cy="70" r="42" stroke="#ffffff" strokeWidth="4" strokeOpacity="0.9" />
        <circle cx="110" cy="70" r="16" fill="#4f46e5" />
        <circle cx="110" cy="70" r="6" fill="#ffffff" />
        {/* Spools */}
        <circle cx="110" cy="42" r="8" fill="#4f46e5" />
        <circle cx="110" cy="98" r="8" fill="#4f46e5" />
        <circle cx="82" cy="70" r="8" fill="#4f46e5" />
        <circle cx="138" cy="70" r="8" fill="#4f46e5" />

        {/* Film Strip ribbon flowing outward */}
        <path
          d="M60 110 C80 90, 70 120, 30 115 C15 112, 10 125, 20 135"
          stroke="#c7d2fe"
          strokeWidth="18"
          strokeLinecap="round"
          fill="none"
        />

        {/* 3D Play Button Pill */}
        <g transform="translate(75, 80)">
          <rect x="0" y="0" width="64" height="52" rx="16" fill="url(#playRibbon)" />
          <polygon points="26,16 26,36 42,26" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
}

export function WatchlistArt({ className = "w-36 h-36" }) {
  return (
    <div className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-[0_8px_16px_rgba(244,63,94,0.1)]"
      >
        <defs>
          <linearGradient id="popGold" x1="80" y1="20" x2="140" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fef08a" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* Popcorn Tub */}
        <g transform="translate(65, 30)">
          <circle cx="20" cy="15" r="14" fill="url(#popGold)" />
          <circle cx="36" cy="12" r="16" fill="url(#popGold)" />
          <circle cx="50" cy="18" r="13" fill="#fde047" />
          <path d="M12 28 L18 90 H52 L58 28 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
          <path d="M18 28 L23 90 H28 L24 28 Z" fill="#ff4d58" />
          <path d="M34 28 L34 90 H40 L40 28 Z" fill="#ff4d58" />
          <path d="M49 28 L46 90 H51 L55 28 Z" fill="#ff4d58" />
        </g>

        {/* Play Pill Badge */}
        <g transform="translate(25, 75)">
          <rect x="0" y="0" width="56" height="46" rx="14" fill="#818cf8" />
          <polygon points="22,14 22,32 36,23" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
}
