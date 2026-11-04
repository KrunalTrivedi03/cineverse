import React from "react";

/**
 * PageBackgroundWatermark
 * Renders subtle, elegant vector watermarks on light backgrounds
 * matching the user's reference mockup (curved filmstrip ribbon with sprocket
 * holes, stage ribbons, or turf lines).
 */
export default function PageBackgroundWatermark({ variant = "movies", className = "" }) {
  if (variant === "events") {
    return (
      <div
        className={`pointer-events-none select-none absolute inset-0 overflow-hidden z-0 ${className}`}
        aria-hidden="true"
      >
        <svg
          className="absolute -top-10 left-0 w-full h-[700px] opacity-[0.065]"
          viewBox="0 0 1440 700"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Soundwave / stage ribbon wave */}
          <path
            d="M-50 200 C300 50, 600 450, 950 180 C1200 0, 1400 350, 1550 220"
            stroke="#ff4d58"
            strokeWidth="38"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M-50 280 C320 120, 620 520, 970 260 C1220 80, 1420 420, 1550 300"
            stroke="#111827"
            strokeWidth="12"
            strokeDasharray="20 14"
            fill="none"
          />
          {/* Concentric ripples */}
          <circle cx="1200" cy="180" r="160" stroke="#ff4d58" strokeWidth="2" strokeDasharray="8 8" />
          <circle cx="1200" cy="180" r="240" stroke="#111827" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  if (variant === "play") {
    return (
      <div
        className={`pointer-events-none select-none absolute inset-0 overflow-hidden z-0 ${className}`}
        aria-hidden="true"
      >
        <svg
          className="absolute -top-10 left-0 w-full h-[700px] opacity-[0.06]"
          viewBox="0 0 1440 700"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Sports turf / track lines */}
          <path
            d="M-100 150 C250 350, 700 50, 1150 300 C1350 420, 1500 200, 1600 250"
            stroke="#10b981"
            strokeWidth="48"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M-100 150 C250 350, 700 50, 1150 300 C1350 420, 1500 200, 1600 250"
            stroke="#ffffff"
            strokeWidth="4"
            strokeDasharray="16 16"
            fill="none"
          />
          <circle cx="280" cy="300" r="180" stroke="#111827" strokeWidth="3" />
        </svg>
      </div>
    );
  }

  if (variant === "settings") {
    return (
      <div
        className={`pointer-events-none select-none absolute inset-0 overflow-hidden z-0 ${className}`}
        aria-hidden="true"
      >
        <svg
          className="absolute -top-12 left-0 w-full h-[750px] opacity-[0.05]"
          viewBox="0 0 1440 750"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle geometric contour curves for settings */}
          <path
            d="M-50 250 C250 100, 600 380, 1000 150 C1250 10, 1450 300, 1600 220"
            stroke="#ff4d58"
            strokeWidth="42"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M-80 320 C220 170, 570 450, 970 220 C1220 80, 1420 370, 1570 290"
            stroke="#111827"
            strokeWidth="10"
            strokeDasharray="16 12"
            fill="none"
          />
          <circle cx="1300" cy="240" r="140" stroke="#ff4d58" strokeWidth="2" strokeDasharray="10 10" />
        </svg>
      </div>
    );
  }

  // Default: "movies" (The curved filmstrip ribbon circled in Mockup Image 2)
  return (
    <div
      className={`pointer-events-none select-none absolute inset-0 overflow-hidden z-0 ${className}`}
      aria-hidden="true"
    >
      <svg
        className="absolute -top-6 left-0 w-full h-[850px] opacity-[0.075]"
        viewBox="0 0 1440 850"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="filmstripBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.8" />
            <stop offset="45%" stopColor="#ff4d58" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="filmstripGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff4d58" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* Outer Ribbon Shadow / Glow */}
        <path
          d="M-80 340 C180 80, 520 480, 880 200 C1180 -30, 1400 380, 1620 180"
          stroke="url(#filmstripGlow)"
          strokeWidth="110"
          strokeLinecap="round"
          fill="none"
        />

        {/* Outer Filmstrip Body Track Ribbon */}
        <path
          d="M-80 340 C180 80, 520 480, 880 200 C1180 -30, 1400 380, 1620 180"
          stroke="url(#filmstripBg)"
          strokeWidth="78"
          strokeLinecap="round"
          fill="none"
        />

        {/* Center Film Frame Clear Body Track */}
        <path
          d="M-80 340 C180 80, 520 480, 880 200 C1180 -30, 1400 380, 1620 180"
          stroke="#f8f9fa"
          strokeWidth="44"
          fill="none"
        />

        {/* Film Frame Divider Bars across center track */}
        <path
          d="M-80 340 C180 80, 520 480, 880 200 C1180 -30, 1400 380, 1620 180"
          stroke="#0f172a"
          strokeWidth="44"
          strokeDasharray="4 64"
          fill="none"
        />

        {/* Sprocket Holes / Perforations Upper Edge (Rectangular dashed dashes) */}
        <path
          d="M-80 310 C180 50, 520 450, 880 170 C1180 -60, 1400 350, 1620 150"
          stroke="#ffffff"
          strokeWidth="9"
          strokeDasharray="12 14"
          strokeLinecap="square"
          fill="none"
        />

        {/* Sprocket Holes / Perforations Lower Edge (Rectangular dashed dashes) */}
        <path
          d="M-80 370 C180 110, 520 510, 880 230 C1180 0, 1400 410, 1620 210"
          stroke="#ffffff"
          strokeWidth="9"
          strokeDasharray="12 14"
          strokeLinecap="square"
          fill="none"
        />

        {/* Secondary Graceful Wave Filmstrip along bottom */}
        <path
          d="M60 740 C380 560, 720 780, 1080 610 C1280 510, 1480 640, 1600 580"
          stroke="#0f172a"
          strokeWidth="42"
          strokeLinecap="round"
          strokeDasharray="6 38"
          fill="none"
        />
        <path
          d="M60 740 C380 560, 720 780, 1080 610 C1280 510, 1480 640, 1600 580"
          stroke="#ff4d58"
          strokeWidth="2"
          fill="none"
        />

        {/* Subtle vintage film reel spokes watermark on right */}
        <g opacity="0.8">
          <circle cx="1300" cy="230" r="96" stroke="#0f172a" strokeWidth="5" />
          <circle cx="1300" cy="230" r="32" stroke="#ff4d58" strokeWidth="4" />
          <circle cx="1300" cy="230" r="14" fill="#0f172a" />
          <line x1="1300" y1="134" x2="1300" y2="326" stroke="#0f172a" strokeWidth="3" />
          <line x1="1204" y1="230" x2="1396" y2="230" stroke="#0f172a" strokeWidth="3" />
          <line x1="1232" y1="162" x2="1368" y2="298" stroke="#0f172a" strokeWidth="2.5" />
          <line x1="1232" y1="298" x2="1368" y2="162" stroke="#0f172a" strokeWidth="2.5" />
        </g>
      </svg>
    </div>
  );
}
