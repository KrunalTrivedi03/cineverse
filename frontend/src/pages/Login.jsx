import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { showToast } from "../utils/toast";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { saveOAuthRedirect, consumeSessionExpiredRedirect } from "../utils/authSession";
import nowLogo from "../assets/now-logo-mark.png";

const IMG = (path) => !path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;

export default function Login() {
  const [form, setForm]         = useState({ email: "", password: "" });
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [posterUrls, setPosterUrls] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Where to send the user after a successful sign-in — set by
  // ProtectedRoute / AuthContext's in-SPA logout (location.state?.from),
  // or — when the logout instead happened via a hard `window.location.href`
  // redirect (axios refresh-token failure, which can't carry React Router
  // state) — the path stashed just before that redirect. Read once so the
  // one-time sessionStorage consume below doesn't repeat on every render.
  const [redirectTo] = useState(() => location.state?.from || consumeSessionExpiredRedirect() || "/");
  const sessionExpiredViaQuery = new URLSearchParams(location.search).get("sessionExpired") === "1";

  useEffect(() => {
    if (location.state?.sessionExpired || sessionExpiredViaQuery) {
      showToast.info("You were signed out due to inactivity. Please log in again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post("/auth/login", form);
      login(res.data.accessToken, res.data.user);
      showToast.success("Welcome! Enjoy your show.");
      setTimeout(() => navigate(redirectTo, { replace: true }), 1000);
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresOTP) {
        showToast.info("Please verify your ticket first.");
        navigate(`/verify-otp?email=${form.email}`);
        return;
      }
      showToast.error(data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Caveat:wght@600;700&display=swap');

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
      `}</style>

      {/* ── LEFT: Cinematic poster wall ─────────────────── */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden"
        style={{ background: "#0d0d0d" }}
      >
        {/* Scrolling poster strips */}
        <div className="absolute inset-0 flex gap-3 px-3 py-0">
          {[0, 1, 2].map((col) => (
            <div key={col} className="flex-1 overflow-hidden">
              <div className={col % 2 === 0 ? "strip-up" : "strip-down"}>
                {[...posterUrls, ...posterUrls].map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-full rounded-xl mb-3 object-cover"
                    style={{ aspectRatio: "2/3" }}
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Dark gradient overlays — top/bottom fade */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, #0d0d0d 0%, transparent 18%, transparent 82%, #0d0d0d 100%)",
          }}
        />
        {/* Center vignette for text readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(13,13,13,0.55) 0%, transparent 70%)",
          }}
        />
        {/* Right fade into form panel */}
        <div
          className="absolute top-0 right-0 bottom-0 w-32 pointer-events-none"
          style={{ background: "linear-gradient(to right, transparent, #21182d)" }}
        />

        {/* Branding overlay */}
        <div className="absolute bottom-10 left-8 right-8 z-10">
          <div
            className="inline-flex flex-col items-start gap-1.5 mb-4 px-4 py-3 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
            }}
          >
            <img src={nowLogo} alt="NOW" className="now-brand-mark h-9 w-auto" />
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
              <span style={{ color: "#ffd5df" }}>Entertainment</span>
            </p>
          </div>
          <p className="text-white/50 text-[14px] leading-relaxed max-w-xs">
            Your gateway to movies, shows, trailers, and bookings — all in one place.
          </p>
        </div>
      </div>

      {/* ── RIGHT: Login form ────────────────────────────── */}
      <div
        className="w-full lg:w-[min(50%,35rem)] shrink-0 flex flex-col justify-center px-4 py-6 sm:px-8 md:px-10"
        style={{ background: "#fafafb" }}
      >
        <div className="fade-up mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-8">

          <Link to="/" className="mb-6 inline-flex min-h-11 items-center" aria-label="NOW home">
            <img src={nowLogo} alt="NOW" className="now-brand-mark h-7 w-auto" />
          </Link>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-gray-900 leading-tight sm:text-4xl">
            Welcome back
          </h1>
          <p className="text-[14px] text-gray-400 mt-1 mb-8">
            Sign in to continue your experience
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-[12px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                Email
              </label>
              <div
                className="flex items-center gap-3 bg-white border rounded-xl px-4 py-3 transition-all focus-within:border-now-accent"
                style={{ borderColor: "#e4e4e7" }}
              >
                <Mail size={15} className="text-gray-300 flex-shrink-0" />
                <input
                  id="login-email" autoComplete="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="flex-1 text-[14px] text-gray-900 outline-none bg-transparent placeholder-gray-300"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-[12px] font-semibold text-gray-500 uppercase tracking-widest">
                  Password
                </label>
                <button
                  type="button"
                  className="text-[12px] font-medium hover:underline"
                  style={{ color: "#106579" }}
                >
                  Forgot password?
                </button>
              </div>
              <div
                className="flex items-center gap-3 bg-white border rounded-xl px-4 py-3 transition-all focus-within:border-now-accent"
                style={{ borderColor: "#e4e4e7" }}
              >
                <Lock size={15} className="text-gray-300 flex-shrink-0" />
                <input
                  id="login-password" autoComplete="current-password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="flex-1 text-[14px] text-gray-900 outline-none bg-transparent placeholder-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)} aria-label={showPass ? "Hide password" : "Show password"}
                  className="text-gray-300 hover:text-gray-500 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[14px] text-white transition-all active:scale-[0.98]"
              style={{
                background: loading ? "#ccc" : "#106579",
                cursor: loading ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#125467"; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#106579"; }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[12px] text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={() => {
              saveOAuthRedirect(redirectTo);
              window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`;
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[14px] text-gray-700 bg-white border transition-all active:scale-[0.98] hover:bg-gray-50"
            style={{ borderColor: "#e4e4e7" }}
          >
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.7 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.6 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.5C29.5 34.9 26.9 36 24 36c-5.4 0-9.9-3.3-11.4-7.9l-6.6 5.1C9.6 39.6 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-3.1 5.3-5.8 6.9l6.5 5.5C39.9 37.3 44 31.4 44 24c0-1.3-.1-2.7-.4-3.5z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-[14px] text-gray-500 mt-4">
            New to NOW?{" "}
            <Link
              to="/register"
              className="font-semibold hover:underline"
              style={{ color: "#106579" }}
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}