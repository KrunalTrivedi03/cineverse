import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, Film, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import api from "../api/axiosInstance";

const IMG = (path) => !path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [posterUrls, setPosterUrls] = useState([]);

  /* Fetch last 3 movie posters dynamically */
  useEffect(() => {
    api.get("/movies").then((res) => {
      const last3 = res.data.slice(-3).map((m) => IMG(m.poster));
      setPosterUrls([...last3, ...last3, ...last3]);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post("/auth/register", form);
      if (res.status === 201) {
        toast.success("Account created successfully 🎉");
        setTimeout(() => navigate(`/verify-otp?email=${form.email}`), 1000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-row-reverse" style={{ fontFamily: "'Outfit', sans-serif" }}>
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

          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#f0545c" }}>
              <Film size={16} color="white" />
            </div>
            <span className="text-[20px] font-extrabold tracking-tight text-gray-900">
              Cine<span style={{ color: "#f0545c" }}>Verse</span>
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-[26px] font-bold text-gray-900 leading-tight">
            Create account
          </h1>
          <p className="text-[14px] text-gray-400 mt-1 mb-8">
            Start your cinema journey with CineVerse
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

          {/* Login CTA */}
          <p className="text-center text-[14px] text-gray-500">
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


