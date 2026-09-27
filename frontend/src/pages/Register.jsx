import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { showToast } from "../utils/toast";
import nowLogo from "../assets/now-logo-mark.png";

import api from "../api/axiosInstance";

const IMG = (path) => !path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [posterUrls, setPosterUrls] = useState([]);

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
      const res = await api.post("/auth/register", form);
      if (res.status === 201) {
        showToast.success("Account created successfully");
        setTimeout(() => navigate(`/verify-otp?email=${form.email}`), 1000);
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-row-reverse" style={{ fontFamily: "'Outfit', sans-serif" }}>
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

      {/* ── RIGHT: Cinematic poster wall ─────────────────── */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden"
        style={{ background: "#0d0d0d" }}
      >
        {/* Scrolling strips */}
        <div className="absolute inset-0 flex gap-3 px-3">
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

        {/* Gradient overlays */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, #0d0d0d 0%, transparent 18%, transparent 82%, #0d0d0d 100%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(13,13,13,0.5) 0%, transparent 70%)",
          }}
        />
        {/* Left fade into light form panel */}
        <div
          className="absolute top-0 left-0 bottom-0 w-32 pointer-events-none"
          style={{ background: "linear-gradient(to left, transparent, #f5f5f5)" }}
        />

        {/* Branding bottom-right */}
        <div className="absolute bottom-10 right-8 left-8 z-10 text-right">
          <div
            className="inline-flex flex-col items-end gap-1.5 mb-4 px-4 py-3 rounded-2xl ml-auto"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
            }}
          >
            <img src={nowLogo} alt="NOW" className="h-9 w-auto" />
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
              <span style={{ color: "#f0545c" }}>Entertainment</span>
            </p>
          </div>
          <p className="text-white/40 text-[13px] leading-relaxed max-w-xs ml-auto">
            Discover, watch, and book movies you love — all in one place.
          </p>
        </div>
      </div>

      {/* ── LEFT: Register form (LIGHT) ─────────────────── */}
      <div
        className="w-full lg:w-[440px] flex-shrink-0 flex flex-col justify-center px-8 md:px-12 py-12"
        style={{ background: "#f5f5f5" }}
      >
        <div className="fade-up w-full max-w-sm mx-auto">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <img src={nowLogo} alt="NOW" className="h-8 w-auto" />
          </div>

          {/* Heading */}
          <h1 className="text-[26px] font-bold text-gray-900 leading-tight">
            Create account
          </h1>
          <p className="text-[14px] text-gray-400 mt-1 mb-8">
            Start your cinema journey with NOW
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Username */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                Full Name
              </label>
              <div
                className="flex items-center gap-3 bg-white border rounded-xl px-4 py-3 transition-all focus-within:border-[#f0545c]"
                style={{ borderColor: "#e5e7eb" }}
              >
                <User size={15} className="text-gray-300 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Your name"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="flex-1 text-[14px] text-gray-900 outline-none bg-transparent placeholder-gray-300"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                Email
              </label>
              <div
                className="flex items-center gap-3 bg-white border rounded-xl px-4 py-3 transition-all focus-within:border-[#f0545c]"
                style={{ borderColor: "#e5e7eb" }}
              >
                <Mail size={15} className="text-gray-300 flex-shrink-0" />
                <input
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
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div
                className="flex items-center gap-3 bg-white border rounded-xl px-4 py-3 transition-all focus-within:border-[#f0545c]"
                style={{ borderColor: "#e5e7eb" }}
              >
                <Lock size={15} className="text-gray-300 flex-shrink-0" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Create a strong password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="flex-1 text-[14px] text-gray-900 outline-none bg-transparent placeholder-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.password.length > 0 && form.password.length < 8 && (
                <p className="text-[11px] text-orange-400 mt-1.5">Use at least 8 characters</p>
              )}
            </div>

            {/* Terms note */}
            <p className="text-[12px] text-gray-400 leading-relaxed">
              By creating an account you agree to our{" "}
              <span className="font-medium cursor-pointer" style={{ color: "#f0545c" }}>Terms of Service</span>{" "}
              and{" "}
              <span className="font-medium cursor-pointer" style={{ color: "#f0545c" }}>Privacy Policy</span>.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[14px] text-white transition-all active:scale-[0.98]"
              style={{ background: loading ? "#ccc" : "#f0545c", cursor: loading ? "not-allowed" : "pointer" }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#d94048"; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#f0545c"; }}
            >
              {loading ? (
                <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Creating account...</>
              ) : (
                <>Continue to Verification <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[12px] text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[14px] text-gray-700 bg-white border transition-all active:scale-[0.98] hover:bg-gray-50"
            style={{ borderColor: "#e5e7eb" }}
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
            Already have an account?{" "}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: "#f0545c" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}