import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Film, ArrowRight, RotateCcw, CheckCircle, ShieldCheck } from "lucide-react";
import api from "../api/axiosInstance";

const IMG = (path) => `http://localhost:5000${path}`;

export default function OtpVerification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  const [otp, setOtp]         = useState(["", "", "", "", "", ""]);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer]     = useState(120);
  const [verified, setVerified] = useState(false);
  const [posterUrls, setPosterUrls] = useState([]);
  const inputsRef = useRef([]);

  useEffect(() => { if (!email) navigate("/register"); }, [email, navigate]);
  useEffect(() => { inputsRef.current[0]?.focus(); }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  /* Dynamic poster backgrounds */
  useEffect(() => {
    api.get("/movies").then((res) => {
      const last3 = res.data.slice(-3).map((m) => IMG(m.poster));
      setPosterUrls([...last3, ...last3, ...last3]);
    }).catch(() => {});
  }, []);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      inputsRef.current[index - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setOtp(next);
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  const handleSubmit = async () => {
    const code = otp.join("");
    if (code.length !== 6) { setError("Please enter all 6 digits"); return; }
    try {
      setLoading(true);
      setError("");
      await api.post("/auth/verify-otp", { email, otp: code });
      setVerified(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      await api.post("/auth/resend-otp", { email });
      setTimer(120);
      setOtp(["", "", "", "", "", ""]);
      setError("");
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    }
  };

  const isComplete = otp.every((d) => d !== "");
  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + "*".repeat(b.length))
    : "";

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

        @keyframes scrollUp {
          from { transform: translateY(0); }
          to   { transform: translateY(-50%); }
        }
        @keyframes scrollDown {
          from { transform: translateY(-50%); }
          to   { transform: translateY(0); }
        }
        .strip-up   { animation: scrollUp   55s linear infinite; }
        .strip-down { animation: scrollDown 45s linear infinite; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.55s cubic-bezier(.4,0,.2,1) both; }

        @keyframes successPop {
          0%   { transform: scale(0.8); opacity: 0; }
          60%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
        .success-pop { animation: successPop 0.45s cubic-bezier(.4,0,.2,1) both; }

        .otp-input::placeholder { color: #d1d5db; }
      `}</style>

      {/* ── LEFT: poster wall ──────────────────────────── */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden"
        style={{ background: "#0d0d0d" }}
      >
        <div className="absolute inset-0 flex gap-3 px-3">
          {[0, 1, 2].map((col) => (
            <div key={col} className="flex-1 overflow-hidden">
              <div className={col % 2 === 0 ? "strip-up" : "strip-down"}>
                {[...posterUrls, ...posterUrls].map((url, i) => (
                  <img
                    key={i} src={url} alt=""
                    className="w-full rounded-xl mb-3 object-cover"
                    style={{ aspectRatio: "2/3" }}
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Overlays */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, #0d0d0d 0%, transparent 18%, transparent 82%, #0d0d0d 100%)" }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, rgba(13,13,13,0.5) 0%, transparent 70%)" }} />
        <div className="absolute top-0 right-0 bottom-0 w-32 pointer-events-none"
          style={{ background: "linear-gradient(to right, transparent, #f5f5f5)" }} />

        {/* Branding */}
        <div className="absolute bottom-10 left-8 z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#f0545c" }}>
              <Film size={18} color="white" />
            </div>
            <span className="text-white text-[22px] font-extrabold tracking-tight">
              Cine<span style={{ color: "#f0545c" }}>Verse</span>
            </span>
          </div>
          <p className="text-white/40 text-[13px] max-w-xs leading-relaxed">
            One last step — verify your email to unlock the full experience.
          </p>
        </div>
      </div>

      {/* ── RIGHT: OTP form ────────────────────────────── */}
      <div
        className="w-full lg:w-[480px] flex-shrink-0 flex flex-col justify-center px-6 sm:px-10 md:px-14 py-12"
        style={{ background: "#f5f5f5" }}
      >
        <div className="fade-up w-full max-w-[360px] mx-auto">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#f0545c" }}>
              <Film size={16} color="white" />
            </div>
            <span className="text-[20px] font-extrabold tracking-tight text-gray-900">
              Cine<span style={{ color: "#f0545c" }}>Verse</span>
            </span>
          </div>

          {/* ── Success state ── */}
          {verified ? (
            <div className="flex flex-col items-center text-center success-pop">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: "rgba(16,185,129,0.12)" }}
              >
                <CheckCircle size={36} className="text-emerald-500" />
              </div>
              <h2 className="text-[22px] font-bold text-gray-900 mb-2">Email verified!</h2>
              <p className="text-[14px] text-gray-400">Redirecting you to sign in...</p>
              <div className="mt-4 flex gap-1.5">
                {[0,1,2].map((i) => (
                  <span key={i} className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Shield icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: "rgba(240,84,92,0.1)" }}
              >
                <ShieldCheck size={24} style={{ color: "#f0545c" }} />
              </div>

              <h1 className="text-[26px] font-bold text-gray-900 leading-tight">
                Verify your email
              </h1>
              <p className="text-[14px] text-gray-400 mt-1 mb-2">
                We sent a 6-digit code to
              </p>
              <p className="text-[14px] font-semibold text-gray-700 mb-8 truncate">
                {maskedEmail}
              </p>

              {/* OTP inputs */}
              <div className="flex gap-2 mb-2 justify-center" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    ref={(el) => (inputsRef.current[i] = el)}
                    onChange={(e) => handleChange(e.target.value, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    className="otp-input text-center text-[20px] font-bold rounded-xl outline-none transition-all duration-150 bg-white border text-gray-900"
                    style={{
                      width: 52,
                      height: 56,
                      borderColor: digit ? "#f0545c" : "#e5e7eb",
                      boxShadow: digit ? "0 0 0 3px rgba(240,84,92,0.1)" : "none",
                    }}
                    placeholder="·"
                  />
                ))}
              </div>

              {/* Error */}
              {error && (
                <p className="text-[13px] text-red-500 mb-4 mt-1">{error}</p>
              )}

              {/* Timer */}
              <div className="flex items-center justify-between mb-6 mt-3">
                <span className="text-[13px] text-gray-400">
                  {timer > 0 ? (
                    <>Code expires in <span className="font-semibold text-gray-700">{formatTime(timer)}</span></>
                  ) : (
                    <span className="text-orange-500 font-medium">Code expired</span>
                  )}
                </span>

                <button
                  onClick={handleResend}
                  disabled={timer > 0}
                  className="flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
                  style={{ color: timer > 0 ? "#d1d5db" : "#f0545c", cursor: timer > 0 ? "not-allowed" : "pointer" }}
                >
                  <RotateCcw size={13} /> Resend
                </button>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!isComplete || loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[14px] text-white transition-all active:scale-[0.98]"
                style={{
                  background: isComplete && !loading ? "#f0545c" : "#e5e7eb",
                  color: isComplete && !loading ? "white" : "#9ca3af",
                  cursor: isComplete && !loading ? "pointer" : "not-allowed",
                }}
                onMouseEnter={(e) => { if (isComplete && !loading) e.currentTarget.style.background = "#d94048"; }}
                onMouseLeave={(e) => { if (isComplete && !loading) e.currentTarget.style.background = "#f0545c"; }}
              >
                {loading ? (
                  <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Verifying...</>
                ) : (
                  <>Verify Email <ArrowRight size={15} /></>
                )}
              </button>

              <p className="text-center text-[13px] text-gray-400 mt-6">
                Wrong email?{" "}
                <Link to="/register" className="font-semibold hover:underline" style={{ color: "#f0545c" }}>
                  Go back
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}