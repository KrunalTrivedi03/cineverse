import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, X, Clapperboard } from "lucide-react";
import { showToast } from "../utils/toast";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { consumeOAuthRedirect } from "../utils/authSession";

const REDIRECT_MS = 1800;
const ACCENT = "#f0545c";

/* phase: "verifying" -> "success" | "error" */
export default function OAuthSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const hasRun = useRef(false);

  const [phase, setPhase] = useState("verifying");
  const [username, setUsername] = useState("");
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const accessToken = params.get("accessToken");

    if (!accessToken) {
      setPhase("error");
      setTimeout(() => exitTo("/login?error=google_auth_failed"), 1400);
      return;
    }

    localStorage.setItem("accessToken", accessToken);

    api
      .get("/users/me")
      .then((res) => {
        login(accessToken, res.data);
        setUsername(res.data?.username || res.data?.name || "");
        setPhase("success");
        showToast.success("Welcome! Enjoy your show.");
        const target = consumeOAuthRedirect();
        setTimeout(() => exitTo(target), REDIRECT_MS);
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        setPhase("error");
        setTimeout(() => exitTo("/login?error=google_auth_failed"), 1400);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exitTo = (path) => {
    setLeaving(true);
    setTimeout(() => navigate(path), 220);
  };

  // Drive the progress bar for the "success -> redirecting" state.
  useEffect(() => {
    if (phase !== "success") return;
    const start = Date.now();
    let raf;
    const tick = () => {
      const pct = Math.min(100, ((Date.now() - start) / REDIRECT_MS) * 100);
      setProgress(pct);
      if (pct < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-10 relative overflow-hidden"
      style={{
        fontFamily: "'Outfit', sans-serif",
        background:
          "radial-gradient(120% 90% at 15% 0%, #fff5f5 0%, #ffffff 48%, #fff8f6 100%)",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

        @keyframes osFadeUp    { from { opacity:0; transform:translateY(18px) scale(0.985); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes osFadeOut   { from { opacity:1; transform:translateY(0) scale(1); } to { opacity:0; transform:translateY(-8px) scale(0.98); } }
        @keyframes osPop       { 0% { opacity:0; transform:scale(0.55); } 55% { opacity:1; transform:scale(1.1); } 100% { transform:scale(1); } }
        @keyframes osRingExpand{ from { opacity:0.55; transform:scale(0.75); } to { opacity:0; transform:scale(1.7); } }
        @keyframes osCheckDraw { from { stroke-dashoffset: 32; } to { stroke-dashoffset: 0; } }
        @keyframes osFloat     { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-7px) rotate(-3deg); } }
        @keyframes osShake     { 10%,90% { transform: translateX(-1px); } 20%,80% { transform: translateX(2px); } 30%,50%,70% { transform: translateX(-4px); } 40%,60% { transform: translateX(4px); } }
        @keyframes osSpin      { to { transform: rotate(360deg); } }
        @keyframes osBlob      { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-8px, 10px) scale(1.05); } }
        @keyframes osReveal    { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }

        .os-card       { animation: osFadeUp 0.45s cubic-bezier(.4,0,.2,1) both; }
        .os-card.leave { animation: osFadeOut 0.2s cubic-bezier(.4,0,.2,1) both; }
        .os-badge      { animation: osPop 0.55s cubic-bezier(.34,1.56,.64,1) both; }
        .os-ring       { animation: osRingExpand 1.5s cubic-bezier(.4,0,.2,1) infinite; }
        .os-check-path { stroke-dasharray: 32; animation: osCheckDraw 0.5s 0.3s cubic-bezier(.4,0,.2,1) both; }
        .os-logo       { animation: osFloat 3.2s ease-in-out infinite; }
        .os-error-badge{ animation: osShake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        .os-blob        { animation: osBlob 9s ease-in-out infinite; }
        .os-blob-2      { animation: osBlob 11s ease-in-out infinite reverse; }
        .os-line        { animation: osReveal 0.45s cubic-bezier(.4,0,.2,1) both; }

        @media (prefers-reduced-motion: reduce) {
          .os-card, .os-card.leave, .os-badge, .os-ring, .os-check-path,
          .os-logo, .os-error-badge, .os-blob, .os-blob-2, .os-line {
            animation: none !important;
          }
        }
      `}</style>

      {/* Decorative background blobs */}
      <div
        className="os-blob absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(240,84,92,0.10) 0%, transparent 70%)" }}
      />
      <div
        className="os-blob-2 absolute -bottom-32 -left-20 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(240,84,92,0.08) 0%, transparent 70%)" }}
      />

      <div
        className={`os-card ${leaving ? "leave" : ""} relative w-full max-w-sm bg-white rounded-[28px] border border-gray-100 shadow-xl px-8 py-11 flex flex-col items-center text-center`}
        style={{ boxShadow: "0 24px 60px -20px rgba(17,17,17,0.16), 0 2px 10px rgba(17,17,17,0.04)" }}
      >
        <div className="os-logo flex items-center gap-1.5 mb-9">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: ACCENT }}
          >
            <Clapperboard size={13} className="text-white" />
          </div>
          <span className="text-[15px] font-extrabold tracking-tight text-gray-900">
            Cine<span style={{ color: ACCENT }}>Verse</span>
          </span>
        </div>

        {/* ── Verifying ───────────────────────────────── */}
        {phase === "verifying" && (
          <>
            <div className="relative w-20 h-20 flex items-center justify-center mb-7">
              <span className="absolute inset-0 rounded-full border-[3px] border-gray-100" />
              <span
                className="absolute inset-0 rounded-full border-[3px] border-transparent"
                style={{ borderTopColor: ACCENT, animation: "osSpin 0.9s linear infinite" }}
              />
              <Check size={26} style={{ color: ACCENT, opacity: 0.25 }} />
            </div>
            <h1 className="os-line text-[20px] font-black text-gray-900 mb-2 tracking-tight">
              Signing you in
            </h1>
            <p className="os-line text-[13.5px] text-gray-400 leading-relaxed">
              Verifying your Google account…
            </p>
          </>
        )}

        {/* ── Success ─────────────────────────────────── */}
        {phase === "success" && (
          <>
            <div className="relative w-20 h-20 flex items-center justify-center mb-7">
              <span
                className="os-ring absolute inset-0 rounded-full border-2"
                style={{ borderColor: "#16a34a" }}
              />
              <div
                className="os-badge relative w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  boxShadow: "0 8px 20px -6px rgba(22,163,74,0.5)",
                }}
              >
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                  <path
                    className="os-check-path"
                    d="M5 13l4 4L19 7"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-[21px] font-black text-gray-900 mb-2 tracking-tight leading-tight">
              You're in{username ? `, ${username}` : ""}!
            </h1>
            <p className="text-[13.5px] text-gray-400 leading-relaxed mb-8 max-w-[240px]">
              Signed in with Google successfully. Taking you to CineVerse…
            </p>

            <div className="w-full">
              <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${ACCENT}, #ff8a65)`,
                    transition: "width 0.05s linear",
                  }}
                />
              </div>
              <p className="text-[11px] text-gray-300 font-medium mt-2.5">
                Redirecting to your home screen
              </p>
            </div>
          </>
        )}

        {/* ── Error ───────────────────────────────────── */}
        {phase === "error" && (
          <>
            <div className="os-error-badge relative w-20 h-20 flex items-center justify-center mb-7">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "#fef2f2", border: "2px solid #fecaca" }}
              >
                <X size={28} style={{ color: "#dc2626" }} />
              </div>
            </div>
            <h1 className="text-[20px] font-black text-gray-900 mb-2 tracking-tight">
              Sign-in didn't go through
            </h1>
            <p className="text-[13.5px] text-gray-400 leading-relaxed">
              Redirecting you back to login…
            </p>
          </>
        )}
      </div>
    </div>
  );
}