import { useState, useContext } from "react";
import axiosAdmin from "../../api/axiosAdmin";
import { AdminAuthContext } from "../../context/AdminAuthContext";
import { Eye, EyeOff, KeyRound, Film, X, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const { login } = useContext(AdminAuthContext);

  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPopup, setShowPopup]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  const submitAdminLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axiosAdmin.post("admin/auth/login", { email, password });
      localStorage.setItem("adminAccessToken", res.data.accessToken);
      login(res.data.admin);
      window.location.href = "/admin/dashboard";
    } catch (err) {
      setError(err.response?.data?.message || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  };

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
          border-color: rgba(240,84,92,0.7);
          background: rgba(255,255,255,0.10);
        }
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

      {/* Credential popup */}
      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-80 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(240,84,92,0.15)" }}
                >
                  <ShieldCheck size={15} style={{ color: "#f0545c" }} />
                </div>
                <p className="text-[14px] font-bold text-white">Demo Credentials</p>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { label: "Email", value: "admin.moviematrix@gmail.com" },
                { label: "Password", value: "Admin@MovieMatrix2025" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="px-4 py-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-[13px] font-medium text-white font-mono">{value}</p>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-gray-600 text-center mt-4">
              For demonstration purposes only
            </p>
          </div>
        </div>
      )}

      {/* Login card */}
      <div className="relative z-10 w-full max-w-[380px] mx-4">
        <form
          onSubmit={submitAdminLogin}
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
              style={{ background: "rgba(240,84,92,0.15)", border: "1px solid rgba(240,84,92,0.25)" }}
            >
              <Film size={26} style={{ color: "#f0545c" }} />
            </div>
            <h1 className="text-[22px] font-bold text-white tracking-tight">CineVerse</h1>
            <p className="text-[12px] text-gray-500 mt-1 font-medium tracking-widest uppercase">
              Admin Portal
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-[13px] font-medium flex items-center gap-2 fade-up"
              style={{ background: "rgba(240,84,92,0.12)", color: "#f87171", border: "1px solid rgba(240,84,92,0.2)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Email */}
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
              required
            />
          </div>

          {/* Password */}
          <div className="mb-6 fade-up fade-up-3">
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-[14px] font-bold text-white transition-all fade-up fade-up-4 flex items-center justify-center gap-2"
            style={{
              background: loading ? "rgba(240,84,92,0.5)" : "#f0545c",
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#d94040"; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#f0545c"; }}
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
                <KeyRound size={15} /> Sign In
              </>
            )}
          </button>

          {/* Demo credentials hint */}
          <div className="mt-5 text-center fade-up fade-up-5">
            <button
              type="button"
              onClick={() => setShowPopup(true)}
              className="text-[12px] text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-2"
            >
              View demo credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}