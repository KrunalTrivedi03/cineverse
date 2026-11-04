import React from "react";
import nowLogo from "../assets/now-logo-mark.png";
import { Film, Ticket, Trophy, Sparkles } from "lucide-react";

/**
 * PageLoader
 * A light-themed, blur-backed loader showcasing movies,
 * sports, and live events, as requested in the user design prompt.
 */
export default function PageLoader({ text = "Loading showtimes & live experiences..." }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/70 backdrop-blur-md selection:bg-[#ff4d58] selection:text-white">
      {/* Subtle ambient light gradient in background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[360px] bg-gradient-to-tr from-rose-100/60 via-pink-100/40 to-amber-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Centered Glassmorphic Loading Card */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full bg-white/95 border border-neutral-100 shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-3xl p-8 text-center">
        
        {/* Brand Logo */}
        <div className="mb-6 relative">
          <img
            src={nowLogo}
            alt="NOW"
            className="h-9 w-auto object-contain mx-auto"
          />
          {/* Subtle pulse ring */}
          <div className="absolute -inset-2 rounded-2xl bg-[#ff4d58]/10 animate-ping pointer-events-none -z-10" />
        </div>

        {/* Animated Icons Triad (Movies, Events, Sports) */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-[#fff0f2] border border-[#ff4d58]/20 flex items-center justify-center text-[#ff4d58] shadow-xs animate-bounce" style={{ animationDelay: "0ms" }}>
            <Film size={20} strokeWidth={2.2} />
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#faf5ff] border border-purple-200/50 flex items-center justify-center text-purple-600 shadow-xs animate-bounce" style={{ animationDelay: "150ms" }}>
            <Ticket size={20} strokeWidth={2.2} />
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#f0fdf4] border border-emerald-200/50 flex items-center justify-center text-emerald-600 shadow-xs animate-bounce" style={{ animationDelay: "300ms" }}>
            <Trophy size={20} strokeWidth={2.2} />
          </div>
        </div>

        {/* Status Text */}
        <h3 className="text-base font-bold text-neutral-900 tracking-tight mb-1">
          Setting the Stage
        </h3>
        <p className="text-xs text-neutral-500 font-medium mb-5 max-w-xs leading-relaxed">
          {text}
        </p>

        {/* Smooth Linear Progress Bar */}
        <div className="w-48 h-1.5 bg-neutral-100 rounded-full overflow-hidden relative">
          <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#ff4d58] via-[#ff6b75] to-[#f59e0b] w-2/5 rounded-full animate-[progress_1.6s_ease-in-out_infinite]" />
        </div>

      </div>
    </div>
  );
}
