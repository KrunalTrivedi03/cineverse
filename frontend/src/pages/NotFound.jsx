import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Film, Home, ArrowLeft, Compass, Sparkles } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          navigate("/");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [navigate]);

  return (
    <div
      className="min-h-screen bg-[#0c0d12] text-white flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Ambient Radial Lights */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,_rgba(240,84,92,0.18)_0%,_transparent_70%)] pointer-events-none" />
      <div className="absolute -left-20 bottom-10 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -right-20 top-10 w-80 h-80 rounded-full bg-[#f0545c]/10 blur-3xl pointer-events-none" />

      {/* Decorative Floating Film Strip Track at Top */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#f0545c] via-purple-500 to-[#f0545c]" />

      <div className="relative z-10 max-w-lg w-full text-center flex flex-col items-center">
        {/* Glow Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-extrabold uppercase tracking-widest text-[#f0545c] mb-6">
          <Film size={13} className="animate-spin-slow" />
          <span>Scene Not Found</span>
        </div>

        {/* 404 Display */}
        <div className="relative mb-2">
          <h1 className="text-8xl sm:text-9xl font-black tracking-tighter bg-gradient-to-b from-white via-white/80 to-white/20 bg-clip-text text-transparent select-none drop-shadow-2xl">
            404
          </h1>
          <div className="absolute -top-3 -right-2 w-8 h-8 rounded-full bg-[#f0545c] text-white flex items-center justify-center shadow-lg shadow-[#f0545c]/50">
            <Sparkles size={16} />
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-2">
          Cut! That scene was left on the cutting room floor.
        </h2>

        <p className="text-white/60 text-[14px] sm:text-[15px] mt-3 max-w-md mx-auto leading-relaxed">
          The page or premiere you are looking for has been moved, rescheduled, or does not exist in our lineup.
        </p>

        {/* Countdown Indicator */}
        <div className="mt-6 px-4 py-2 rounded-xl bg-white/5 border border-white/10 inline-flex items-center gap-2 text-[12px] text-white/70">
          <span>Redirecting to the box office in</span>
          <span className="font-mono font-bold text-[#f0545c] px-1.5 py-0.5 rounded bg-[#f0545c]/10">
            {countdown}s
          </span>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full mt-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#f0545c] text-white font-extrabold text-[14px] shadow-lg shadow-[#f0545c]/30 hover:bg-[#e0454d] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Home size={16} />
            <span>Back to Home</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-[14px] backdrop-blur-md transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <ArrowLeft size={16} />
            <span>Previous Page</span>
          </button>
        </div>
      </div>
    </div>
  );
}
