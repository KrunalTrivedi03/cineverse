import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowRight, RotateCcw, CheckCircle, ShieldCheck } from "lucide-react";
import api from "../api/axiosInstance";
import nowLogo from "../assets/now-logo-mark.png";

const IMG = (path) => !path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;

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

  const isLatestMovie = (m) =>
    m.status === "streaming" || (m.status === "released" && m.isInCinemas);

  const getDayOfYear = (date) => {
    const start = new Date(date.getFullYear(), 0, 0);
    return Math.floor((date - start) / (1000 * 60 * 60 * 24));
  };

  const getDailyRotatingSlice = (list, count) => {
    if (list.length === 0) return [];
    const startIdx = getDayOfYear(new Date()) % list.length;
    const result = [];
    for (let i = 0; i < Math.min(count, list.length); i++) {
      result.push(list[(startIdx + i) % list.length]);
    }
    return result;
  };

  useEffect(() => {
    api.get("/movies")
      .then((res) => {
        const eligible = res.data.filter(isLatestMovie);
        const daily = getDailyRotatingSlice(eligible, 3);
        const formattedPosters = daily.map((m) => IMG(m.poster));
        
        setPosterUrls([...formattedPosters, ...formattedPosters, ...formattedPosters]);
      })
      .catch(() => {});
  }, []);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const handleChange = (value, index) => {
    if (index === 0 && /^\d{6}$/.test(value)) {
      setOtp(value.split(""));
      inputsRef.current[5]?.focus();
      return;
    }
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
    <div className="now-auth-page min-h-dvh flex" style={{ fontFamily: "var(--now-ui-font)" }}>
      <style>{`

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

      `}</style>

      {/* ── LEFT: poster wall ──────────────────────────── */}
      <div
        className="now-auth-art hidden lg:flex flex-1 relative overflow-hidden"
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
          style={{ background: "linear-gradient(to right, transparent, #fafafb)" }} />

        {/* Branding */}
        <div className="absolute bottom-10 left-8 z-10">
          <div
            className="inline-flex flex-col items-start gap-1.5 mb-4 px-4 py-3 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
            }}
          >
            <img src={nowLogo} alt="NOW" className="now-brand-mark h-8 w-auto" />
            <p
              style={{
                margin: 0,
                fontFamily: "'Caveat', 'Segoe Script', cursive",
                fontWeight: 700,
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              <span style={{ color: "#ffffff" }}>Your World of </span>
              <span style={{ color: "#106579" }}>Entertainment</span>
            </p>
          </div>
          <p className="text-white/40 text-[13px] max-w-xs leading-relaxed">
            One last step — verify your email to unlock the full experience.
          </p>
        </div>
      </div>

      {/* ── RIGHT: OTP form ────────────────────────────── */}
      <div
        className="now-auth-pane"
      >
        <div className="now-auth-content">

          {/* Mobile logo */}
          <Link to="/" className="now-auth-brand" aria-label="NOW home">
            <img src={nowLogo} alt="NOW" className="now-brand-mark h-7 w-auto" />
          </Link>

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
                style={{ background: "rgba(16,101,121,0.1)" }}
              >
                <ShieldCheck size={24} style={{ color: "#106579" }} />
              </div>

              <h1 className="text-[26px] font-bold text-gray-900 leading-tight">
                Verify your email
              </h1>
              <p className="text-[14px] text-gray-400 mt-1 mb-2">
                We sent a 6-digit code to
              </p>
              <p className="text-sm font-semibold text-gray-700 mb-6 break-all">
                {maskedEmail}
              </p>

              {/* OTP inputs */}
              <div className="now-auth-code" role="group" aria-label="Six-digit verification code" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    aria-label={`Digit ${i + 1} of 6`}
                    maxLength={i === 0 ? 6 : 1}
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    value={digit}
                    ref={(el) => { inputsRef.current[i] = el; }}
                    onChange={(e) => handleChange(e.target.value, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    className="now-auth-digit"
                    data-filled={Boolean(digit)}
                    placeholder="·"
                  />
                ))}
              </div>

              {/* Error */}
              {error && (
                <p className="text-[13px] text-red-700 mb-4 mt-2" role="alert">{error}</p>
              )}

              {/* Timer */}
              <div className="now-auth-resend">
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
                  style={{ color: timer > 0 ? "#d1d5db" : "#106579", cursor: timer > 0 ? "not-allowed" : "pointer" }}
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
                  background: isComplete && !loading ? "#106579" : "#e4e4e7",
                  color: isComplete && !loading ? "white" : "#9ca3af",
                  cursor: isComplete && !loading ? "pointer" : "not-allowed",
                }}
                onMouseEnter={(e) => { if (isComplete && !loading) e.currentTarget.style.background = "#125467"; }}
                onMouseLeave={(e) => { if (isComplete && !loading) e.currentTarget.style.background = "#106579"; }}
              >
                {loading ? (
                  <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Verifying...</>
                ) : (
                  <>Verify Email <ArrowRight size={15} /></>
                )}
              </button>

              <p className="text-center text-[13px] text-gray-400 mt-6">
                Wrong email?{" "}
                <Link to="/register" className="font-semibold hover:underline" style={{ color: "#106579" }}>
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