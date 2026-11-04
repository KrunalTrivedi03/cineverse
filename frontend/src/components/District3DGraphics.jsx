import React from "react";

/**
 * High-fidelity 3D vector illustrations & ambient lighting layers
 * designed in the signature District by Zomato entertainment style.
 */

export function AmbientDistrictBackground({ children, className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Ambient Mesh Auroras */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_top,_rgba(240,84,92,0.18)_0%,_transparent_70%)] pointer-events-none blur-2xl" />
      <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.14)_0%,_transparent_70%)] pointer-events-none blur-3xl" />
      <div className="absolute -bottom-20 left-1/3 w-[550px] h-[350px] bg-[radial-gradient(circle,_rgba(245,158,11,0.08)_0%,_transparent_70%)] pointer-events-none blur-2xl" />

      {/* Floating 3D Background Decorative Illustrations */}
      <div className="absolute top-12 left-6 lg:left-16 pointer-events-none select-none opacity-80 animate-float-slow z-0">
        <Ticket3DIllustration size={110} />
      </div>

      <div className="absolute top-28 right-8 lg:right-24 pointer-events-none select-none opacity-75 animate-float-reverse z-0">
        <Clapper3DIllustration size={100} />
      </div>

      <div className="absolute -bottom-8 right-1/4 pointer-events-none select-none opacity-60 animate-float-slow z-0 hidden sm:block">
        <GlassSphere3D size={80} color="coral" />
      </div>

      <div className="absolute top-1/2 left-8 pointer-events-none select-none opacity-50 animate-float-reverse z-0 hidden md:block">
        <GlassSphere3D size={64} color="purple" />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * 3D Holographic Cinema Ticket Pass
 */
export function Ticket3DIllustration({ size = 120, className = "" }) {
  return (
    <svg
      width={size}
      height={size * 0.85}
      viewBox="0 0 140 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`filter drop-shadow-[0_16px_28px_rgba(240,84,92,0.35)] ${className}`}
    >
      <defs>
        <linearGradient id="ticketBodyGrad" x1="10" y1="15" x2="125" y2="105" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff5c65" />
          <stop offset="0.45" stopColor="#e03640" />
          <stop offset="1" stopColor="#8b141d" />
        </linearGradient>
        <linearGradient id="ticketSheen" x1="15" y1="15" x2="125" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="goldHolo" x1="30" y1="35" x2="60" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef08a" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <filter id="shadowTicket" x="-10" y="0" width="160" height="140" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#f0545c" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* 3D Drop Extrusion */}
      <path
        d="M24 24C24 20.6863 26.6863 18 30 18H114C117.314 18 120 20.6863 120 24V50C116 50 112 53 112 58C112 63 116 66 120 66V92C120 95.3137 117.314 98 114 98H30C26.6863 98 24 95.3137 24 92V66C28 66 32 63 32 58C32 53 28 50 24 50V24Z"
        fill="#5a0b12"
        transform="translate(4, 6)"
      />

      {/* Ticket Main Card with Notch Cutouts */}
      <path
        d="M20 20C20 16.6863 22.6863 14 26 14H110C113.314 14 116 16.6863 116 20V46C111.5 46 108 49.5 108 54C108 58.5 111.5 62 116 62V88C116 91.3137 113.314 94 110 94H26C22.6863 94 20 91.3137 20 88V62C24.5 62 28 58.5 28 54C28 49.5 24.5 46 20 46V20Z"
        fill="url(#ticketBodyGrad)"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1.2"
      />

      {/* Specular Lighting Glass Sheen */}
      <path
        d="M21 16H114L102 48H21V16Z"
        fill="url(#ticketSheen)"
      />

      {/* Perforation dashed line */}
      <line x1="88" y1="16" x2="88" y2="92" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* 3D Holographic Golden Star Seal */}
      <circle cx="52" cy="54" r="18" fill="url(#goldHolo)" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.3))" />
      <polygon
        points="52,42 56,50 64,51 58,57 60,65 52,61 44,65 46,57 40,51 48,50"
        fill="#ffffff"
        opacity="0.95"
      />

      {/* Digital Barcode Lines */}
      <rect x="94" y="32" width="2" height="42" fill="rgba(255,255,255,0.85)" rx="1" />
      <rect x="98" y="32" width="4" height="42" fill="rgba(255,255,255,0.9)" rx="1" />
      <rect x="104" y="32" width="1.5" height="42" fill="rgba(255,255,255,0.7)" rx="0.5" />
      <rect x="108" y="32" width="3" height="42" fill="rgba(255,255,255,0.85)" rx="1" />
    </svg>
  );
}

/**
 * 3D Glossy Cinema Clapperboard
 */
export function Clapper3DIllustration({ size = 110, className = "" }) {
  return (
    <svg
      width={size}
      height={size * 0.9}
      viewBox="0 0 130 115"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`filter drop-shadow-[0_16px_28px_rgba(139,92,246,0.35)] ${className}`}
    >
      <defs>
        <linearGradient id="clapperBody" x1="15" y1="35" x2="115" y2="105" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e202e" />
          <stop offset="1" stopColor="#0d0e15" />
        </linearGradient>
        <linearGradient id="clapperBar" x1="10" y1="10" x2="120" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b3d54" />
          <stop offset="1" stopColor="#181924" />
        </linearGradient>
        <linearGradient id="clapperStripe" x1="0" y1="0" x2="10" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f0545c" />
          <stop offset="1" stopColor="#ff7880" />
        </linearGradient>
      </defs>

      {/* Shadow Extrusion */}
      <rect x="18" y="38" width="94" height="66" rx="14" fill="#06070a" />

      {/* Main Base Slate */}
      <rect x="15" y="34" width="94" height="66" rx="14" fill="url(#clapperBody)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />

      {/* Slate lines / Typography markings */}
      <rect x="26" y="50" width="36" height="5" rx="2.5" fill="rgba(255,255,255,0.2)" />
      <rect x="26" y="62" width="22" height="4" rx="2" fill="rgba(255,255,255,0.15)" />
      <rect x="68" y="50" width="30" height="22" rx="6" fill="#f0545c" fillOpacity="0.15" stroke="#f0545c" strokeWidth="1" />
      <polygon points="80,56 88,61 80,66" fill="#f0545c" />

      {/* Angled Clapper Top Arm */}
      <g transform="rotate(-12 18 30)">
        <rect x="10" y="14" width="102" height="20" rx="6" fill="url(#clapperBar)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
        {/* Striped Chevron Markers */}
        <polygon points="26,14 36,14 26,34 16,34" fill="url(#clapperStripe)" />
        <polygon points="46,14 56,14 46,34 36,34" fill="url(#clapperStripe)" />
        <polygon points="66,14 76,14 66,34 56,34" fill="url(#clapperStripe)" />
        <polygon points="86,14 96,14 86,34 76,34" fill="url(#clapperStripe)" />
      </g>

      {/* Hinge Pin */}
      <circle cx="16" cy="34" r="5" fill="#f0545c" stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * 3D Iridescent Glass Sphere with Specular Highlight
 */
export function GlassSphere3D({ size = 80, color = "coral", className = "" }) {
  const isPurple = color === "purple";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)] ${className}`}
    >
      <defs>
        <radialGradient id={`sphereGrad_${color}`} cx="38" cy="35" r="50" gradientUnits="userSpaceOnUse">
          <stop stopColor={isPurple ? "#c084fc" : "#ff7e86"} />
          <stop offset="0.45" stopColor={isPurple ? "#7e22ce" : "#e03a43"} />
          <stop offset="0.85" stopColor={isPurple ? "#3b0764" : "#680a10"} />
          <stop offset="1" stopColor="#080205" />
        </radialGradient>
        <radialGradient id="specularHighlight" cx="30" cy="28" r="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Main Glass Sphere Body */}
      <circle cx="50" cy="50" r="46" fill={`url(#sphereGrad_${color})`} />

      {/* Specular White Glint Reflection */}
      <ellipse cx="34" cy="30" rx="14" ry="9" fill="url(#specularHighlight)" transform="rotate(-25 34 30)" />

      {/* Secondary Bottom Rim Light */}
      <ellipse cx="62" cy="74" rx="20" ry="7" fill="rgba(255,255,255,0.18)" transform="rotate(15 62 74)" />
    </svg>
  );
}

/**
 * 3D Disco / Music Hologram Sphere for Live Events
 */
export function Disco3DIllustration({ size = 100, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 110 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`filter drop-shadow-[0_14px_28px_rgba(168,85,247,0.4)] ${className}`}
    >
      <defs>
        <radialGradient id="discoBody" cx="42" cy="40" r="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e9d5ff" />
          <stop offset="0.35" stopColor="#a855f7" />
          <stop offset="0.75" stopColor="#581c87" />
          <stop offset="1" stopColor="#1e0538" />
        </radialGradient>
      </defs>

      <circle cx="55" cy="55" r="45" fill="url(#discoBody)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      
      {/* Facet grids */}
      <ellipse cx="55" cy="55" rx="45" ry="16" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="3 3" />
      <ellipse cx="55" cy="55" rx="45" ry="32" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="55" y1="10" x2="55" y2="100" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="30" y1="18" x2="30" y2="92" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="80" y1="18" x2="80" y2="92" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3 3" />

      {/* Sparkle Glint */}
      <circle cx="38" cy="34" r="6" fill="#ffffff" filter="drop-shadow(0 0 8px #ffffff)" />
    </svg>
  );
}
