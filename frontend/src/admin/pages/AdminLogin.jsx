import { useState, useRef, useEffect, useContext } from "react";
import axiosAdmin from "../../api/axiosAdmin";
import { AdminAuthContext } from "../../context/AdminAuthContext";
import {
  Eye, EyeOff, KeyRound, Film, ShieldCheck, RotateCcw, ArrowLeft,
  Mail, CheckCircle2, Lock,
} from "lucide-react";

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 120; // mirrors OTP_TTL_MS on the backend

const RULES = [
  { label: "At least 10 characters", test: (v) => v.length >= 10 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One number", test: (v) => /\d/.test(v) },
  { label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

// step:
//   "credentials"  → email + password
//   "otp"          → login 2FA code
//   "forgot-email" → enter email to request a reset code
//   "forgot-otp"   → enter the reset code
//   "forgot-reset" → set a new password
//   "forgot-done"  → confirmation, then back to "credentials"
export default function AdminLogin() {
  const { login } = useContext(AdminAuthContext);

  const [step, setStep] = useState("credentials");
  const [error, setError] = useState("");

  // ── Login: credentials ──────────────────────────────────────────────────
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);

  // ── Login: OTP ───────────────────────────────────────────────────────────
  const [tempToken, setTempToken]     = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp]                 = useState(Array(OTP_LENGTH).fill(""));
  const [timer, setTimer]             = useState(OTP_TTL_SECONDS);
  const [otpLoading, setOtpLoading]   = useState(false);
  const [resending, setResending]     = useState(false);
  const otpInputsRef = useRef([]);

  // ── Forgot password ─────────────────────────────────────────────────────
  const [forgotEmail, setForgotEmail]   = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetOtp, setResetOtp]         = useState(Array(OTP_LENGTH).fill(""));
  const [resetTimer, setResetTimer]     = useState(OTP_TTL_SECONDS);
  const [resetToken, setResetToken]     = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword]   = useState(false);
  const resetOtpInputsRef = useRef([]);

  useEffect(() => {
    if (step !== "otp" || timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [step, timer]);

  useEffect(() => {
    if (step !== "forgot-otp" || resetTimer <= 0) return;
    const id = setInterval(() => setResetTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [step, resetTimer]);

  useEffect(() => {
    if (step === "otp") otpInputsRef.current[0]?.focus();
    if (step === "forgot-otp") resetOtpInputsRef.current[0]?.focus();
  }, [step]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Login: credentials submit ───────────────────────────────────────────
  const submitCredentials = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axiosAdmin.post("admin/auth/login", { email, password });
      if (res.data.requires2FA) {
        setTempToken(res.data.tempToken);
        setMaskedEmail(res.data.maskedEmail || "");
        setOtp(Array(OTP_LENGTH).fill(""));
        setTimer(OTP_TTL_SECONDS);
        setStep("otp");
      } else {
        localStorage.setItem("adminAccessToken", res.data.accessToken);
        login(res.data.admin);
        window.location.href = "/admin/dashboard";
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  };

  // ── Generic OTP box handlers (shared shape for login OTP + reset OTP) ──
  const makeOtpHandlers = (value, setValue, refs) => ({
    onChange: (v, index) => {
      if (!/^\d?$/.test(v)) return;
      const next = [...value];
      next[index] = v;
      setValue(next);
      if (v && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
    },
    onKeyDown: (e, index) => {
      if (e.key === "Backspace" && !value[index] && index > 0) refs.current[index - 1]?.focus();
    },
    onPaste: (e) => {
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
      if (!pasted) return;
      const next = [...value];
      pasted.split("").forEach((d, i) => { next[i] = d; });
      setValue(next);
      refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
      e.preventDefault();
    },
  });

  const loginOtpHandlers = makeOtpHandlers(otp, setOtp, otpInputsRef);
  const resetOtpHandlers = makeOtpHandlers(resetOtp, setResetOtp, resetOtpInputsRef);

  const submitOtp = async () => {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) return setError("Please enter all 6 digits");
    setError("");
    setOtpLoading(true);
    try {
      const res = await axiosAdmin.post("admin/auth/verify-otp", { tempToken, otp: code });
      localStorage.setItem("adminAccessToken", res.data.accessToken);
      login(res.data.admin);
      window.location.href = "/admin/dashboard";
    } catch (err) {
      setError(err.response?.data?.message || "Incorrect code");
      setOtp(Array(OTP_LENGTH).fill(""));
      otpInputsRef.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  const resendOtp = async () => {
    if (timer > 0 || resending) return;
    setError("");
    setResending(true);
    try {
      await axiosAdmin.post("admin/auth/resend-otp", { tempToken });
      setTimer(OTP_TTL_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(""));
      otpInputsRef.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  const backToCredentials = () => {
    setStep("credentials");
    setError("");
    setPassword("");
    setTempToken("");
    setOtp(Array(OTP_LENGTH).fill(""));
  };

  // ── Forgot password: step 1 — request code ──────────────────────────────
  const openForgotPassword = () => {
    setError("");
    setForgotEmail(email);
    setStep("forgot-email");
  };

  const requestResetCode = async (e) => {
    e.preventDefault();
    setError("");
    setForgotLoading(true);
    try {
      await axiosAdmin.post("admin/auth/forgot-password", { email: forgotEmail });
      setResetOtp(Array(OTP_LENGTH).fill(""));
      setResetTimer(OTP_TTL_SECONDS);
      setStep("forgot-otp");
    } catch (err) {
      // Backend always replies 200 with a generic message for this endpoint,
      // so an error here means something else went wrong (network, rate limit).
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const resendResetCode = async () => {
    if (resetTimer > 0 || forgotLoading) return;
    setError("");
    setForgotLoading(true);
    try {
      await axiosAdmin.post("admin/auth/forgot-password", { email: forgotEmail });
      setResetTimer(OTP_TTL_SECONDS);
      setResetOtp(Array(OTP_LENGTH).fill(""));
      resetOtpInputsRef.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code");
    } finally {
      setForgotLoading(false);
    }
  };

  // ── Forgot password: step 2 — verify code ───────────────────────────────
  const submitResetOtp = async () => {
    const code = resetOtp.join("");
    if (code.length !== OTP_LENGTH) return setError("Please enter all 6 digits");
    setError("");
    setForgotLoading(true);
    try {
      const res = await axiosAdmin.post("admin/auth/reset-password/verify-otp", {
        email: forgotEmail,
        otp: code,
      });
      setResetToken(res.data.resetToken);
      setNewPassword("");
      setConfirmPassword("");
      setStep("forgot-reset");
    } catch (err) {
      setError(err.response?.data?.message || "Incorrect code");
      setResetOtp(Array(OTP_LENGTH).fill(""));
      resetOtpInputsRef.current[0]?.focus();
    } finally {
      setForgotLoading(false);
    }
  };

  // ── Forgot password: step 3 — set new password ──────────────────────────
  const rulesPassed = RULES.every((r) => r.test(newPassword));
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const submitNewPassword = async (e) => {
    e.preventDefault();
    if (!rulesPassed || !passwordsMatch) return;
    setError("");
    setForgotLoading(true);
    try {
      await axiosAdmin.post("admin/auth/reset-password", { resetToken, newPassword });
      setStep("forgot-done");
      setTimeout(() => {
        setStep("credentials");
        setPassword("");
        setResetToken("");
      }, 2200);
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset password. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const isOtpComplete = otp.every((d) => d !== "");
  const isResetOtpComplete = resetOtp.every((d) => d !== "");

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        .input-field {
          width: 100%;
          padding: 11px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.07);
          color: #fff;
          font-size: 14px;
          font-family: 'Outfit', sans-serif;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .input-field::placeholder { color: rgba(255,255,255,0.4); }
        .input-field:focus {
          border-color: rgba(16,101,121,0.7);
          background: rgba(255,255,255,0.10);
        }
        .otp-input::placeholder { color: rgba(255,255,255,0.25); }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.12s; }
        .fade-up-3 { animation-delay: 0.19s; }
        .fade-up-4 { animation-delay: 0.26s; }
        .fade-up-5 { animation-delay: 0.33s; }
      `}</style>

      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?q=80&w=1920')",
        }}
      />
      <div className="absolute inset-0 bg-black/75" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[380px] mx-4">
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(10,10,10,0.75)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Logo area */}
          <div className="flex flex-col items-center mb-8 fade-up fade-up-1">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              style={{ background: "rgba(16,101,121,0.15)", border: "1px solid rgba(16,101,121,0.25)" }}
            >
              <Film size={26} style={{ color: "#106579" }} />
            </div>
            <h1 className="text-[22px] font-bold text-white tracking-tight">NOW</h1>
            <p className="text-[12px] text-gray-500 mt-1 font-medium tracking-widest uppercase">
              Admin Portal
            </p>
          </div>

          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-[13px] font-medium flex items-center gap-2 fade-up"
              style={{ background: "rgba(16,101,121,0.12)", color: "#f87171", border: "1px solid rgba(16,101,121,0.2)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* ── Step: credentials ───────────────────────────────────────── */}
          {step === "credentials" && (
            <form onSubmit={submitCredentials}>
              <div className="mb-4 fade-up fade-up-2">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="mb-2 fade-up fade-up-3">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    style={{ paddingRight: "44px" }}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3.5 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end mb-6 fade-up fade-up-3">
                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="text-[12px] font-semibold transition-colors"
                  style={{ color: "#9ca3af" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#106579")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-[14px] font-bold text-white transition-all fade-up fade-up-4 flex items-center justify-center gap-2"
                style={{
                  background: loading ? "rgba(16,101,121,0.5)" : "#106579",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#d94040"; }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#106579"; }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <KeyRound size={15} /> Continue
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── Step: login OTP ─────────────────────────────────────────── */}
          {step === "otp" && (
            <div>
              <div className="flex flex-col items-center text-center mb-6 fade-up fade-up-1">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(16,101,121,0.15)", border: "1px solid rgba(16,101,121,0.25)" }}
                >
                  <ShieldCheck size={22} style={{ color: "#106579" }} />
                </div>
                <p className="text-[14px] font-semibold text-white">Verify it's you</p>
                <p className="text-[12px] text-gray-500 mt-1">
                  We sent a code to <span className="text-gray-300 font-medium">{maskedEmail}</span>
                </p>
              </div>

              <div className="flex gap-2 mb-3 justify-center fade-up fade-up-2" onPaste={loginOtpHandlers.onPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    ref={(el) => (otpInputsRef.current[i] = el)}
                    onChange={(e) => loginOtpHandlers.onChange(e.target.value, i)}
                    onKeyDown={(e) => loginOtpHandlers.onKeyDown(e, i)}
                    className="otp-input input-field text-center text-[18px] font-bold"
                    style={{ width: 44, height: 52, padding: 0, borderColor: digit ? "rgba(16,101,121,0.7)" : "rgba(255,255,255,0.15)" }}
                    placeholder="·"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between mb-6 fade-up fade-up-3">
                <span className="text-[12px] text-gray-500">
                  {timer > 0 ? (
                    <>Expires in <span className="font-semibold text-gray-300">{formatTime(timer)}</span></>
                  ) : (
                    <span className="text-orange-400 font-medium">Code expired</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={timer > 0 || resending}
                  className="flex items-center gap-1.5 text-[12px] font-semibold transition-colors"
                  style={{ color: timer > 0 || resending ? "rgba(255,255,255,0.25)" : "#106579", cursor: timer > 0 || resending ? "not-allowed" : "pointer" }}
                >
                  <RotateCcw size={12} /> {resending ? "Sending..." : "Resend"}
                </button>
              </div>

              <button
                type="button"
                onClick={submitOtp}
                disabled={!isOtpComplete || otpLoading}
                className="w-full py-3 rounded-xl text-[14px] font-bold text-white transition-all fade-up fade-up-4 flex items-center justify-center gap-2"
                style={{ background: isOtpComplete && !otpLoading ? "#106579" : "rgba(16,101,121,0.35)", cursor: isOtpComplete && !otpLoading ? "pointer" : "not-allowed" }}
              >
                {otpLoading ? "Verifying..." : (<><ShieldCheck size={15} /> Verify & Sign In</>)}
              </button>

              <button
                type="button"
                onClick={backToCredentials}
                className="w-full flex items-center justify-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-300 transition-colors mt-5 fade-up fade-up-5"
              >
                <ArrowLeft size={12} /> Back to login
              </button>
            </div>
          )}

          {/* ── Step: forgot password — email ───────────────────────────── */}
          {step === "forgot-email" && (
            <form onSubmit={requestResetCode}>
              <div className="flex flex-col items-center text-center mb-6 fade-up fade-up-1">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(16,101,121,0.15)", border: "1px solid rgba(16,101,121,0.25)" }}
                >
                  <Mail size={20} style={{ color: "#106579" }} />
                </div>
                <p className="text-[14px] font-semibold text-white">Reset your password</p>
                <p className="text-[12px] text-gray-500 mt-1">
                  Enter your admin email and we'll send you a code
                </p>
              </div>

              <div className="mb-6 fade-up fade-up-2">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="input-field"
                  autoComplete="username"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full py-3 rounded-xl text-[14px] font-bold text-white transition-all fade-up fade-up-3 flex items-center justify-center gap-2"
                style={{ background: forgotLoading ? "rgba(16,101,121,0.5)" : "#106579", cursor: forgotLoading ? "not-allowed" : "pointer" }}
              >
                {forgotLoading ? "Sending..." : (<><Mail size={15} /> Send Reset Code</>)}
              </button>

              <button
                type="button"
                onClick={backToCredentials}
                className="w-full flex items-center justify-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-300 transition-colors mt-5 fade-up fade-up-4"
              >
                <ArrowLeft size={12} /> Back to login
              </button>
            </form>
          )}

          {/* ── Step: forgot password — verify code ─────────────────────── */}
          {step === "forgot-otp" && (
            <div>
              <div className="flex flex-col items-center text-center mb-6 fade-up fade-up-1">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(16,101,121,0.15)", border: "1px solid rgba(16,101,121,0.25)" }}
                >
                  <ShieldCheck size={22} style={{ color: "#106579" }} />
                </div>
                <p className="text-[14px] font-semibold text-white">Enter reset code</p>
                <p className="text-[12px] text-gray-500 mt-1">
                  If that email has admin access, a code was sent to it
                </p>
              </div>

              <div className="flex gap-2 mb-3 justify-center fade-up fade-up-2" onPaste={resetOtpHandlers.onPaste}>
                {resetOtp.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    ref={(el) => (resetOtpInputsRef.current[i] = el)}
                    onChange={(e) => resetOtpHandlers.onChange(e.target.value, i)}
                    onKeyDown={(e) => resetOtpHandlers.onKeyDown(e, i)}
                    className="otp-input input-field text-center text-[18px] font-bold"
                    style={{ width: 44, height: 52, padding: 0, borderColor: digit ? "rgba(16,101,121,0.7)" : "rgba(255,255,255,0.15)" }}
                    placeholder="·"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between mb-6 fade-up fade-up-3">
                <span className="text-[12px] text-gray-500">
                  {resetTimer > 0 ? (
                    <>Expires in <span className="font-semibold text-gray-300">{formatTime(resetTimer)}</span></>
                  ) : (
                    <span className="text-orange-400 font-medium">Code expired</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={resendResetCode}
                  disabled={resetTimer > 0 || forgotLoading}
                  className="flex items-center gap-1.5 text-[12px] font-semibold transition-colors"
                  style={{ color: resetTimer > 0 || forgotLoading ? "rgba(255,255,255,0.25)" : "#106579", cursor: resetTimer > 0 || forgotLoading ? "not-allowed" : "pointer" }}
                >
                  <RotateCcw size={12} /> {forgotLoading ? "Sending..." : "Resend"}
                </button>
              </div>

              <button
                type="button"
                onClick={submitResetOtp}
                disabled={!isResetOtpComplete || forgotLoading}
                className="w-full py-3 rounded-xl text-[14px] font-bold text-white transition-all fade-up fade-up-4 flex items-center justify-center gap-2"
                style={{ background: isResetOtpComplete && !forgotLoading ? "#106579" : "rgba(16,101,121,0.35)", cursor: isResetOtpComplete && !forgotLoading ? "pointer" : "not-allowed" }}
              >
                {forgotLoading ? "Verifying..." : (<><ShieldCheck size={15} /> Verify Code</>)}
              </button>

              <button
                type="button"
                onClick={backToCredentials}
                className="w-full flex items-center justify-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-300 transition-colors mt-5 fade-up fade-up-5"
              >
                <ArrowLeft size={12} /> Back to login
              </button>
            </div>
          )}

          {/* ── Step: forgot password — set new password ────────────────── */}
          {step === "forgot-reset" && (
            <form onSubmit={submitNewPassword}>
              <div className="flex flex-col items-center text-center mb-6 fade-up fade-up-1">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(16,101,121,0.15)", border: "1px solid rgba(16,101,121,0.25)" }}
                >
                  <Lock size={20} style={{ color: "#106579" }} />
                </div>
                <p className="text-[14px] font-semibold text-white">Set a new password</p>
                <p className="text-[12px] text-gray-500 mt-1">
                  You'll be signed out of every device after this
                </p>
              </div>

              <div className="mb-3 fade-up fade-up-2">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field"
                    style={{ paddingRight: "44px" }}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute top-1/2 right-3.5 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="mb-4 flex flex-col gap-1 fade-up fade-up-2">
                {RULES.map((r) => {
                  const pass = r.test(newPassword);
                  return (
                    <div key={r.label} className="flex items-center gap-2 text-[11.5px]">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: pass ? "#4ade80" : "rgba(255,255,255,0.2)" }} />
                      <span style={{ color: pass ? "#4ade80" : "rgba(255,255,255,0.4)" }}>{r.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mb-1 fade-up fade-up-3">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  style={{ borderColor: confirmPassword && !passwordsMatch ? "rgba(248,113,113,0.6)" : undefined }}
                  autoComplete="new-password"
                  required
                />
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-[11px] text-red-400 mb-2">Passwords don't match</p>
              )}

              <button
                type="submit"
                disabled={!rulesPassed || !passwordsMatch || forgotLoading}
                className="w-full mt-5 py-3 rounded-xl text-[14px] font-bold text-white transition-all fade-up fade-up-4 flex items-center justify-center gap-2"
                style={{
                  background: rulesPassed && passwordsMatch && !forgotLoading ? "#106579" : "rgba(16,101,121,0.35)",
                  cursor: rulesPassed && passwordsMatch && !forgotLoading ? "pointer" : "not-allowed",
                }}
              >
                {forgotLoading ? "Saving..." : (<><ShieldCheck size={15} /> Reset Password</>)}
              </button>
            </form>
          )}

          {/* ── Step: forgot password — done ─────────────────────────────── */}
          {step === "forgot-done" && (
            <div className="flex flex-col items-center text-center py-4 fade-up fade-up-1">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)" }}
              >
                <CheckCircle2 size={26} style={{ color: "#4ade80" }} />
              </div>
              <p className="text-[14px] font-semibold text-white">Password reset</p>
              <p className="text-[12px] text-gray-500 mt-1">Taking you back to login...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}