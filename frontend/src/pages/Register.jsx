import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
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
    <div className="min-h-screen flex flex-row-reverse bg-[#0f1015]" style={{ fontFamily: "'Outfit', sans-serif" }}>
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
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      {/* ── RIGHT: Cinematic poster wall ─────────────────── */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden bg-[#0c0d12]"
      >
        {/* Scrolling strips */}
        <div className="absolute inset-0 flex gap-4 px-4 opacity-45">
          {[0, 1, 2].map((col) => (
            <div key={col} className="flex-1 overflow-hidden">
              <div className={col % 2 === 0 ? "strip-up" : "strip-down"}>
                {[...posterUrls, ...posterUrls].map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-full rounded-2xl mb-4 object-cover shadow-2xl border border-white/5"
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
            background: "linear-gradient(to bottom, #0c0d12 0%, transparent 15%, transparent 85%, #0c0d12 100%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at center, rgba(12,13,18,0.4) 0%, rgba(12,13,18,0.95) 100%)",
          }}
        />
        <div
          className="absolute top-0 left-0 bottom-0 w-36 pointer-events-none"
          style={{ background: "linear-gradient(to left, transparent, #f8fafc)" }}
        />

        {/* Branding bottom */}
        <div className="absolute bottom-12 right-10 left-10 z-10 text-right">
          <div
            className="inline-flex flex-col items-end gap-2 mb-4 px-5 py-4 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl ml-auto"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <img src={nowLogo} alt="NOW" className="h-9 w-auto brightness-110" />
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#f0545c]">
              <span>Join The Entertainment Experience</span>
            </div>
          </div>
          <p className="text-white/60 text-[14px] leading-relaxed max-w-sm ml-auto font-medium">
            Unlock seamless booking across 15+ cities, save your favorite movies, and enjoy member-exclusive discounts.
          </p>
        </div>
      </div>

      {/* ── LEFT: Modern Register Form ─────────────────── */}
      <div
        className="w-full lg:w-[480px] flex-shrink-0 flex flex-col justify-center px-6 sm:px-12 py-12 bg-[#f8fafc]"
      >
        <div className="fade-up w-full max-w-sm mx-auto">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <img src={nowLogo} alt="NOW" className="h-8 w-auto" />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-[28px] font-black text-gray-900 tracking-tight leading-tight">
              Create Account
            </h1>
            <p className="text-[14px] text-gray-500 mt-1 font-medium">
              Start your cinema &amp; events journey today
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Username */}
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div
                className="flex items-center gap-3 bg-white border border-gray-200/90 rounded-2xl px-4 py-3 transition-all focus-within:border-[#f0545c] focus-within:ring-4 focus-within:ring-[#f0545c]/10 shadow-2xs"
              >
                <User size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Your full name"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="flex-1 text-[14px] font-medium text-gray-900 outline-none bg-transparent placeholder-gray-400"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div
                className="flex items-center gap-3 bg-white border border-gray-200/90 rounded-2xl px-4 py-3 transition-all focus-within:border-[#f0545c] focus-within:ring-4 focus-within:ring-[#f0545c]/10 shadow-2xs"
              >
                <Mail size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type="email"
                  placeholder="you@domain.com"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="flex-1 text-[14px] font-medium text-gray-900 outline-none bg-transparent placeholder-gray-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div
                className="flex items-center gap-3 bg-white border border-gray-200/90 rounded-2xl px-4 py-3 transition-all focus-within:border-[#f0545c] focus-within:ring-4 focus-within:ring-[#f0545c]/10 shadow-2xs"
              >
                <Lock size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Create a strong password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="flex-1 text-[14px] font-medium text-gray-900 outline-none bg-transparent placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password.length > 0 && form.password.length < 8 && (
                <p className="text-[11px] font-semibold text-orange-500 mt-1">Use at least 8 characters</p>
              )}
            </div>

            {/* Terms note */}
            <p className="text-[12px] text-gray-400 leading-relaxed">
              By creating an account, you agree to our{" "}
              <span className="font-bold text-[#f0545c] cursor-pointer hover:underline">Terms</span> and{" "}
              <span className="font-bold text-[#f0545c] cursor-pointer hover:underline">Privacy Policy</span>.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-[14.5px] text-white transition-all shadow-sm hover:shadow active:scale-[0.98]"
              style={{
                background: loading ? "#9ca3af" : "#f0545c",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl font-bold text-[13.5px] text-gray-700 bg-white border border-gray-200/90 shadow-2xs hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
          >
            <svg width="17" height="17" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.7 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.6 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.5C29.5 34.9 26.9 36 24 36c-5.4 0-9.9-3.3-11.4-7.9l-6.6 5.1C9.6 39.6 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-3.1 5.3-5.8 6.9l6.5 5.5C39.9 37.3 44 31.4 44 24c0-1.3-.1-2.7-.4-3.5z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <p className="text-center text-[13.5px] text-gray-500 font-medium mt-6">
            Already registered?{" "}
            <Link to="/login" className="font-bold text-[#f0545c] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
