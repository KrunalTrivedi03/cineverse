import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";
import axiosAdmin from "../../api/axiosAdmin";
import { AdminAuthContext } from "../../context/AdminAuthContext";
import {
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Fingerprint,
  MonitorSmartphone,
  Ban,
  Sparkles,
} from "lucide-react";

const TIPS = [
  {
    icon: Fingerprint,
    title: "Use a unique password",
    text: "Don't reuse a password from another site or account.",
  },
  {
    icon: MonitorSmartphone,
    title: "You'll be signed out everywhere",
    text: "All active sessions on every device are revoked immediately after the change.",
  },
  {
    icon: Ban,
    title: "Never share your OTP or password",
    text: "CineVerse staff will never ask for your password or login code.",
  },
];

const RULES = [
  { label: "At least 10 characters", test: (v) => v.length >= 10 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One number", test: (v) => /\d/.test(v) },
  { label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export default function AdminChangePassword() {
  const navigate = useNavigate();
  const { logout } = useContext(AdminAuthContext);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");
  const [done, setDone]                       = useState(false);

  const rulesPassed = RULES.every((r) => r.test(newPassword));
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = currentPassword.length > 0 && rulesPassed && passwordsMatch && !loading;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      await axiosAdmin.put("admin/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setDone(true);
      // Server already revoked the refresh token/cookie — clear local
      // state too and send the admin back to a fresh login.
      setTimeout(() => {
        logout();
        navigate("/admin/login");
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.message || "Could not change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
    <div className="min-h-screen bg-gray-50 p-6 md:p-8" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(240,84,92,0.1)" }}
        >
          <KeyRound size={19} style={{ color: "#f0545c" }} />
        </div>
        <div>
          <h1 className="text-[18px] font-bold text-gray-900">Change Password</h1>
          <p className="text-[12px] text-gray-500">Update your admin account password</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,480px)_1fr] gap-6 items-start">

      {done ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 flex flex-col items-center text-center">
          <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
          <p className="text-[14px] font-semibold text-gray-900">Password changed</p>
          <p className="text-[12px] text-gray-500 mt-1">
            Every existing session has been signed out. Redirecting to login...
          </p>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="rounded-2xl border border-gray-100 p-6 bg-white"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-[13px] font-medium bg-red-50 text-red-600 border border-red-100">
              {error}
            </div>
          )}

          {/* Current password */}
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Current Password
          </label>
          <div className="relative mb-5">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 text-[14px] outline-none focus:border-[#f0545c] transition-colors"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute top-1/2 right-3.5 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* New password */}
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            New Password
          </label>
          <div className="relative mb-3">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 text-[14px] outline-none focus:border-[#f0545c] transition-colors"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute top-1/2 right-3.5 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Rules checklist */}
          <div className="mb-5 flex flex-col gap-1">
            {RULES.map((r) => {
              const pass = r.test(newPassword);
              return (
                <div key={r.label} className="flex items-center gap-2 text-[12px]">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: pass ? "#10b981" : "#d1d5db" }}
                  />
                  <span style={{ color: pass ? "#10b981" : "#9ca3af" }}>{r.label}</span>
                </div>
              );
            })}
          </div>

          {/* Confirm */}
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Confirm New Password
          </label>
          <input
            type={showNew ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border text-[14px] outline-none transition-colors mb-1"
            style={{
              borderColor: confirmPassword && !passwordsMatch ? "#fca5a5" : "#e5e7eb",
            }}
            autoComplete="new-password"
            required
          />
          {confirmPassword && !passwordsMatch && (
            <p className="text-[11px] text-red-500 mb-2">Passwords don't match</p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full mt-5 py-3 rounded-xl text-[14px] font-bold text-white transition-all flex items-center justify-center gap-2"
            style={{
              background: canSubmit ? "#f0545c" : "#e5e7eb",
              color: canSubmit ? "white" : "#9ca3af",
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            <ShieldCheck size={15} />
            {loading ? "Changing..." : "Change Password"}
          </button>

          <p className="text-[11px] text-gray-400 text-center mt-4">
            You'll be signed out of every device after this change.
          </p>
        </form>
      )}

      {/* Right panel — fills the remaining space with context instead of empty gray */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #181816 0%, #2a2622 100%)",
        }}
      >
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
          style={{ background: "rgba(240,84,92,0.15)", filter: "blur(20px)" }}
        />
        <div className="relative flex items-center gap-2 mb-5">
          <Sparkles size={16} style={{ color: "#f0545c" }} />
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Account security
          </span>
        </div>

        <div className="relative flex flex-col gap-5">
          {TIPS.map((tip) => (
            <div key={tip.title} className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <tip.icon size={16} style={{ color: "#f0545c" }} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white">{tip.title}</p>
                <p className="text-[12px] text-gray-400 mt-0.5 leading-relaxed">{tip.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      </div>
    </div>
    </AdminLayout>
  );
}