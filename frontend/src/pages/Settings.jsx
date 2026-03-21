import { useState, useEffect, useRef } from "react";
import {
  User, CreditCard, Clock, Gift, ChevronRight,
  Edit3, Camera, Check, Ticket, Star, Zap,
  Shield, Bell, HelpCircle, LogOut, MapPin,
  Calendar, IndianRupee, Lock, Phone, Mail,
  Award, Sparkles, ArrowRight, Plus, X, Eye,
  EyeOff, Trash2, AlertCircle, CheckCircle, Loader2,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axiosInstance";

/* ─────────────────────────────────────────────────────────
   Toast
───────────────────────────────────────────────────────── */
function Toast({ toasts, remove }) {
  return (
    <div className="fixed top-5 right-5 z-[999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id}
          className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold animate-slideIn"
          style={{
            background: t.type === "error" ? "#fef2f2" : t.type === "success" ? "#f0fdf4" : "#eff6ff",
            color: t.type === "error" ? "#dc2626" : t.type === "success" ? "#16a34a" : "#2563eb",
            border: `1px solid ${t.type === "error" ? "#fecaca" : t.type === "success" ? "#bbf7d0" : "#bfdbfe"}`,
            minWidth: 260,
          }}>
          {t.type === "error" && <AlertCircle size={15} />}
          {t.type === "success" && <CheckCircle size={15} />}
          {t.type === "info" && <Sparkles size={15} />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)} className="opacity-50 hover:opacity-100"><X size={13} /></button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  };
  const remove = (id) => setToasts((p) => p.filter((t) => t.id !== id));
  return { toasts, toast: add, remove };
}

const IMG = (p) => !p ? null : p.startsWith("http") ? p : `${import.meta.env.VITE_API_URL}${p}`;

/* ═══════════════════════════════════════════════════════
   SETTINGS PAGE
═══════════════════════════════════════════════════════ */
export default function Settings() {
  const navigate = useNavigate();
  const { toasts, toast, remove } = useToast();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeSection, setActiveSection] = useState("profile");
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    api.get("/users/me")
      .then((r) => { setProfile(r.data); localStorage.setItem("userInfo", JSON.stringify(r.data)); })
      .catch(() => {
        try {
          const stored = localStorage.getItem("userInfo");
          if (stored && stored !== "undefined") setProfile(JSON.parse(stored));
        } catch { }
      })
      .finally(() => setLoadingProfile(false));
  }, []);

  useEffect(() => {
    if (activeSection !== "bookings") return;
    setLoadingBookings(true);
    api.get("/users/me/bookings")
      .then((r) => setBookings(r.data))
      .catch(() => setBookings([]))
      .finally(() => setLoadingBookings(false));
  }, [activeSection]);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  const NAV = [
    { id: "profile",  icon: User,       label: "Profile"  },
    { id: "quickpay", icon: CreditCard,  label: "QuickPay" },
    { id: "bookings", icon: Clock,       label: "Bookings" },
    { id: "rewards",  icon: Gift,        label: "Rewards"  },
  ];

  const sidebarAvatar = profile?.avatar ? (
    <img src={IMG(profile.avatar)} alt="avatar" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
  ) : (
    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-[16px] flex-shrink-0"
      style={{ background: "linear-gradient(135deg, #f0545c 0%, #ff8a65 100%)" }}>
      {(profile?.username?.[0] || "U").toUpperCase()}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f5", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        .fade-in { animation: fadeUp 0.28s cubic-bezier(.4,0,.2,1) both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .nav-item { transition: all 0.15s; }
        .nav-item:hover { background: #fff5f5; }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        .animate-slideIn { animation: slideIn 0.2s ease both; }
      `}</style>

      <Navbar />
      <Toast toasts={toasts} remove={remove} />

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-7">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#f0545c" }}>Account</p>
          <h1 className="text-[28px] font-black tracking-tight text-gray-900" style={{ letterSpacing: "-0.02em" }}>Settings</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-5">
          {/* ── Sidebar ── */}
          <aside className="w-full md:w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-3 flex items-center gap-3">
              {loadingProfile
                ? <div className="w-11 h-11 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                : sidebarAvatar}
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-gray-900 capitalize truncate">{profile?.username || "User"}</p>
                <p className="text-[11px] text-gray-400 truncate">{profile?.email || ""}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
              {NAV.map(({ id, icon: Icon, label }) => {
                const active = activeSection === id;
                return (
                  <button key={id} onClick={() => setActiveSection(id)}
                    className="nav-item w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 last:border-0"
                    style={active
                      ? { background: "rgba(240,84,92,0.07)", borderLeft: "3px solid #f0545c" }
                      : { borderLeft: "3px solid transparent" }}>
                    <Icon size={15} style={{ color: active ? "#f0545c" : "#9ca3af", flexShrink: 0 }} />
                    <span className="text-[13px] font-semibold" style={{ color: active ? "#f0545c" : "#374151" }}>{label}</span>
                    {id === "rewards" && (
                      <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#fef3c7", color: "#d97706" }}>NEW</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {[
                { icon: Bell,        label: "Notifications" },
                { icon: Shield,      label: "Privacy"       },
                { icon: HelpCircle,  label: "Help & Support"},
              ].map(({ icon: Icon, label }) => (
                <button key={label} className="nav-item w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 last:border-0">
                  <Icon size={15} className="text-gray-400 flex-shrink-0" />
                  <span className="text-[13px] font-medium text-gray-600">{label}</span>
                  <ChevronRight size={13} className="ml-auto text-gray-300" />
                </button>
              ))}
              <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 transition-colors">
                <LogOut size={15} className="text-red-400 flex-shrink-0" />
                <span className="text-[13px] font-semibold text-red-400">Logout</span>
              </button>
            </div>
          </aside>

          {/* ── Main ── */}
          <main className="flex-1 min-w-0">
            {loadingProfile ? (
              <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center py-24">
                <Loader2 size={24} className="animate-spin text-[#f0545c]" />
              </div>
            ) : (
              <>
                {activeSection === "profile"  && <ProfileSection  profile={profile} setProfile={setProfile} toast={toast} />}
                {activeSection === "quickpay" && <QuickPaySection  toast={toast} />}
                {activeSection === "bookings" && <BookingsSection  bookings={bookings} loading={loadingBookings} toast={toast} />}
                {activeSection === "rewards"  && <RewardsSection />}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PROFILE SECTION
═══════════════════════════════════════════════ */
function ProfileSection({ profile, setProfile, toast }) {
  const [editing,     setEditing]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [form,        setForm]        = useState({ username: profile?.username || "", phone: profile?.phone || "", city: profile?.city || "" });
  const [pwdModal,    setPwdModal]    = useState(false);
  const [pwdForm,     setPwdForm]     = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwdSaving,   setPwdSaving]   = useState(false);
  const [showPwd,     setShowPwd]     = useState({ current: false, new: false, confirm: false });
  const [avatarLoading, setAvatarLoading] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (profile) setForm({ username: profile.username || "", phone: profile.phone || "", city: profile.city || "" });
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/users/me", form);
      const updated = { ...profile, ...data };
      setProfile(updated);
      localStorage.setItem("userInfo", JSON.stringify(updated));
      setEditing(false);
      toast("Profile updated successfully", "success");
    } catch (err) {
      toast(err.response?.data?.message || "Failed to update profile", "error");
    } finally { setSaving(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast("Image must be under 2 MB", "error"); return; }
    const formData = new FormData();
    formData.append("avatar", file);
    setAvatarLoading(true);
    try {
      const { data } = await api.post("/users/me/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const updated = { ...profile, avatar: data.avatar };
      setProfile(updated);
      localStorage.setItem("userInfo", JSON.stringify(updated));
      toast("Profile photo updated!", "success");
    } catch (err) {
      toast(err.response?.data?.message || "Upload failed", "error");
    } finally { setAvatarLoading(false); e.target.value = ""; }
  };

  const handleRemoveAvatar = async () => {
    setAvatarLoading(true);
    try {
      await api.delete("/users/me/avatar");
      const updated = { ...profile, avatar: null };
      setProfile(updated);
      localStorage.setItem("userInfo", JSON.stringify(updated));
      toast("Profile photo removed", "success");
    } catch { toast("Failed to remove photo", "error"); }
    finally { setAvatarLoading(false); }
  };

  const handleChangePassword = async () => {
    if (pwdForm.newPassword !== pwdForm.confirm) { toast("New passwords do not match", "error"); return; }
    if (pwdForm.newPassword.length < 8) { toast("Password must be at least 8 characters", "error"); return; }
    setPwdSaving(true);
    try {
      await api.put("/users/me/password", { currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      toast("Password changed! Please log in again.", "success");
      setPwdModal(false);
      setPwdForm({ currentPassword: "", newPassword: "", confirm: "" });
      setTimeout(() => { localStorage.removeItem("accessToken"); localStorage.removeItem("userInfo"); window.location.href = "/login"; }, 2000);
    } catch (err) {
      toast(err.response?.data?.message || "Failed to change password", "error");
    } finally { setPwdSaving(false); }
  };

  const avatarSrc = IMG(profile?.avatar);

  return (
    <div className="fade-in">
      {/* Avatar + name card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 mb-4 flex items-center gap-5">
        <div className="relative flex-shrink-0">
          {avatarLoading ? (
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-[#f0545c]" />
            </div>
          ) : avatarSrc ? (
            <img src={avatarSrc} alt="avatar" className="w-20 h-20 rounded-2xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-[28px]"
              style={{ background: "linear-gradient(135deg, #f0545c 0%, #ff8a65 100%)" }}>
              {(profile?.username?.[0] || "U").toUpperCase()}
            </div>
          )}
          <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={avatarLoading}
            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm border-2 border-white hover:bg-gray-50 transition-colors"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
            <Camera size={13} style={{ color: "#f0545c" }} />
          </button>
          <input ref={avatarInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[18px] font-black text-gray-900 capitalize tracking-tight truncate">{profile?.username || "User"}</p>
          <p className="text-[13px] text-gray-400 mt-0.5 truncate">{profile?.email || "No email set"}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide" style={{ background: "rgba(240,84,92,0.09)", color: "#f0545c" }}>
              {profile?.role || "Member"}
            </span>
            {profile?.avatar && (
              <button type="button" onClick={handleRemoveAvatar} disabled={avatarLoading}
                className="text-[10px] font-semibold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
                <Trash2 size={10} /> Remove photo
              </button>
            )}
          </div>
        </div>
        <button type="button" onClick={() => setEditing((v) => !v)}
          className="flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-xl border transition-all flex-shrink-0"
          style={editing
            ? { background: "#f0545c", color: "#fff", borderColor: "#f0545c" }
            : { background: "white", color: "#374151", borderColor: "#e5e7eb" }}>
          <Edit3 size={12} /> {editing ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      {/* Personal info */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
        <div className="px-6 py-4 border-b border-gray-50">
          <p className="text-[13px] font-bold text-gray-900">Personal Information</p>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { key: "username", label: "Full Name",      icon: User,  type: "text",  placeholder: "Your name",           editable: true  },
            { key: "email",    label: "Email Address",  icon: Mail,  type: "email", placeholder: "you@email.com",        editable: false },
            { key: "phone",    label: "Phone Number",   icon: Phone, type: "tel",   placeholder: "+91 00000 00000",      editable: true  },
            { key: "city",     label: "City",           icon: MapPin,type: "text",  placeholder: "Your city",            editable: true  },
          ].map(({ key, label, icon: Icon, type, placeholder, editable }) => {
            const isEditable = editing && editable;
            const value      = key === "email" ? (profile?.email || "") : form[key];
            return (
              <div key={key}>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                <div className="flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all"
                  style={{ borderColor: isEditable ? "#f0545c" : "#e5e7eb", background: isEditable ? "#fff" : "#f9fafb" }}>
                  <Icon size={14} style={{ color: isEditable ? "#f0545c" : "#9ca3af", flexShrink: 0 }} />
                  <input type={type} value={value}
                    onChange={(e) => editable && setForm((f) => ({ ...f, [key]: e.target.value }))}
                    disabled={!isEditable} placeholder={placeholder}
                    className="flex-1 bg-transparent text-[13px] text-gray-800 outline-none placeholder-gray-300 disabled:cursor-default" />
                  {key === "email" && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                      {profile?.isEmailVerified ? "Verified" : "Unverified"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {editing && (
          <div className="px-6 pb-5 flex items-center gap-3">
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 text-[13px] font-bold text-white px-6 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-60"
              style={{ background: "#f0545c" }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button type="button"
              onClick={() => { setEditing(false); setForm({ username: profile?.username || "", phone: profile?.phone || "", city: profile?.city || "" }); }}
              className="text-[13px] font-semibold text-gray-400 hover:text-gray-700 transition-colors">
              Discard
            </button>
          </div>
        )}
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50"><p className="text-[13px] font-bold text-gray-900">Security</p></div>
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
              <Lock size={15} className="text-gray-400" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-gray-800">Password</p>
              <p className="text-[11px] text-gray-400">Keep your account secure</p>
            </div>
          </div>
          <button type="button" onClick={() => setPwdModal(true)} className="text-[12px] font-semibold hover:underline" style={{ color: "#f0545c" }}>Change</button>
        </div>
      </div>

      {/* Change password modal */}
      {pwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 fade-in">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[16px] font-black text-gray-900">Change Password</p>
              <button type="button" onClick={() => { setPwdModal(false); setPwdForm({ currentPassword: "", newPassword: "", confirm: "" }); }}
                className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { key: "currentPassword", label: "Current Password", show: "current" },
                { key: "newPassword",     label: "New Password",     show: "new"     },
                { key: "confirm",         label: "Confirm Password", show: "confirm" },
              ].map(({ key, label, show }) => (
                <div key={key}>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5 focus-within:border-[#f0545c] transition-colors">
                    <Lock size={14} className="text-gray-400 flex-shrink-0" />
                    <input type={showPwd[show] ? "text" : "password"} value={pwdForm[key]}
                      onChange={(e) => setPwdForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder="••••••••" className="flex-1 bg-transparent text-[13px] text-gray-800 outline-none" />
                    <button type="button" onClick={() => setShowPwd((s) => ({ ...s, [show]: !s[show] }))}>
                      {showPwd[show] ? <EyeOff size={14} className="text-gray-400" /> : <Eye size={14} className="text-gray-400" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button type="button" onClick={handleChangePassword}
                disabled={pwdSaving || !pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirm}
                className="flex-1 flex items-center justify-center gap-2 text-[13px] font-bold text-white py-2.5 rounded-xl transition-all disabled:opacity-50"
                style={{ background: "#f0545c" }}>
                {pwdSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {pwdSaving ? "Changing..." : "Change Password"}
              </button>
              <button type="button" onClick={() => { setPwdModal(false); setPwdForm({ currentPassword: "", newPassword: "", confirm: "" }); }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   QUICKPAY SECTION
═══════════════════════════════════════════════ */
function QuickPaySection({ toast }) {
  const [qpData,         setQpData]         = useState(null);
  const [loading,        setLoading]         = useState(true);
  const [moneyAmt,       setMoneyAmt]        = useState("");
  const [showMoneyInput, setShowMoneyInput]  = useState(false);
  const [addingMoney,    setAddingMoney]     = useState(false);

  const [cardModal,  setCardModal]  = useState(false);
  const [cardForm,   setCardForm]   = useState({ cardholderName: "", last4: "", expiry: "", network: "Visa" });
  const [cardSaving, setCardSaving] = useState(false);

  const [upiModal,  setUpiModal]  = useState(false);
  const [upiInput,  setUpiInput]  = useState("");
  const [upiSaving, setUpiSaving] = useState(false);

  const moneyInputRef = useRef(null);

  const fetchQP = () => {
    setLoading(true);
    api.get("/quickpay")
      .then((r) => setQpData(r.data))
      .catch(() => setQpData({ walletBalance: 0, cards: [], upiIds: [] }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchQP(); }, []);
  useEffect(() => { if (showMoneyInput) setTimeout(() => moneyInputRef.current?.focus(), 50); }, [showMoneyInput]);

  const handleAddMoney = async () => {
    const amt = parseFloat(moneyAmt);
    if (isNaN(amt) || amt < 1)  { toast("Enter a valid amount (min ₹1)", "error"); return; }
    if (amt > 10000)             { toast("Maximum ₹10,000 per top-up",    "error"); return; }
    setAddingMoney(true);
    try {
      const { data } = await api.post("/quickpay/wallet/add", { amount: amt });
      setQpData((p) => ({ ...p, walletBalance: data.walletBalance }));
      setMoneyAmt(""); setShowMoneyInput(false);
      toast(`₹${amt.toLocaleString("en-IN")} added to wallet!`, "success");
    } catch (err) {
      toast(err.response?.data?.message || "Failed to add money", "error");
    } finally { setAddingMoney(false); }
  };

  const handleAddCard = async () => {
    if (!cardForm.last4 || cardForm.last4.length !== 4 || !/^\d{4}$/.test(cardForm.last4)) { toast("Enter valid 4-digit last 4 digits", "error"); return; }
    if (!cardForm.expiry || !/^\d{2}\/\d{2}$/.test(cardForm.expiry))                       { toast("Expiry must be MM/YY format",        "error"); return; }
    setCardSaving(true);
    try {
      const { data } = await api.post("/quickpay/cards", cardForm);
      setQpData((p) => ({ ...p, cards: data.cards }));
      setCardModal(false);
      setCardForm({ cardholderName: "", last4: "", expiry: "", network: "Visa" });
      toast("Card added successfully", "success");
    } catch (err) {
      toast(err.response?.data?.message || "Failed to add card", "error");
    } finally { setCardSaving(false); }
  };

  const handleRemoveCard = async (cardId) => {
    try {
      const { data } = await api.delete(`/quickpay/cards/${cardId}`);
      setQpData((p) => ({ ...p, cards: data.cards }));
      toast("Card removed", "success");
    } catch { toast("Failed to remove card", "error"); }
  };

  const handleSetPrimary = async (cardId) => {
    try {
      const { data } = await api.put(`/quickpay/cards/${cardId}/primary`);
      setQpData((p) => ({ ...p, cards: data.cards }));
      toast("Primary card updated", "success");
    } catch { toast("Failed to update primary card", "error"); }
  };

  const handleAddUPI = async () => {
    if (!upiInput.includes("@")) { toast("Enter a valid UPI ID", "error"); return; }
    setUpiSaving(true);
    try {
      const { data } = await api.post("/quickpay/upi", { upiId: upiInput });
      setQpData((p) => ({ ...p, upiIds: data.upiIds }));
      setUpiModal(false); setUpiInput("");
      toast("UPI ID added", "success");
    } catch (err) {
      toast(err.response?.data?.message || "Failed to add UPI ID", "error");
    } finally { setUpiSaving(false); }
  };

  const handleRemoveUPI = async (docId) => {
    try {
      const { data } = await api.delete(`/quickpay/upi/${docId}`);
      setQpData((p) => ({ ...p, upiIds: data.upiIds }));
      toast("UPI ID removed", "success");
    } catch { toast("Failed to remove UPI ID", "error"); }
  };

  const networkColor = { Visa: "#1a1f71", Mastercard: "#eb001b", RuPay: "#138808", Amex: "#007bc7", Diners: "#004b87" };

  if (loading) {
    return (
      <div className="fade-in bg-white rounded-2xl border border-gray-100 flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-[#f0545c]" />
      </div>
    );
  }

  return (
    <div className="fade-in space-y-4">

      {/* Wallet card */}
      <div className="rounded-2xl p-6 text-white"
        style={{ background: "linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%)", position: "relative" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(240,84,92,0.15)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -20, right: 60, width: 80, height: 80, borderRadius: "50%", background: "rgba(240,84,92,0.08)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-1">CineVerse Wallet</p>
          <p className="text-[36px] font-black tracking-tight" style={{ lineHeight: 1 }}>
            ₹{Math.floor(qpData?.walletBalance || 0).toLocaleString("en-IN")}.
            <span className="text-[24px]">{String(((qpData?.walletBalance || 0) % 1).toFixed(2)).slice(2)}</span>
          </p>
          <p className="text-[12px] text-white/40 mt-1">Available balance</p>
          {showMoneyInput ? (
            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 flex-1">
                <span className="text-white/60 text-[13px]">₹</span>
                <input ref={moneyInputRef} type="number" value={moneyAmt}
                  onChange={(e) => setMoneyAmt(e.target.value)}
                  placeholder="Enter amount" min="1" max="10000" step="1"
                  className="bg-transparent text-white text-[13px] font-semibold outline-none w-full placeholder-white/40"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddMoney(); } }} />
              </div>
              <button type="button" onClick={handleAddMoney} disabled={addingMoney}
                className="px-4 py-2 rounded-xl text-[12px] font-bold transition-all disabled:opacity-60 flex items-center justify-center min-w-[48px]"
                style={{ background: "#f0545c", color: "#fff" }}>
                {addingMoney ? <Loader2 size={13} className="animate-spin" /> : "Add"}
              </button>
              <button type="button" onClick={() => { setShowMoneyInput(false); setMoneyAmt(""); }}
                className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <X size={13} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowMoneyInput(true)}
              className="mt-4 flex items-center gap-2 text-[12px] font-bold px-4 py-2 rounded-xl"
              style={{ background: "rgba(240,84,92,0.9)", color: "#fff" }}>
              <Plus size={13} /> Add Money
            </button>
          )}
        </div>
      </div>

      {/* Saved Cards */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <p className="text-[13px] font-bold text-gray-900">Saved Cards</p>
          <button type="button" onClick={() => setCardModal(true)} className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: "#f0545c" }}>
            <Plus size={13} /> Add Card
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {!qpData?.cards?.length ? (
            <p className="px-6 py-5 text-[13px] text-gray-400 text-center">No saved cards yet</p>
          ) : qpData.cards.map((card) => (
            <div key={card._id} className="px-6 py-4 flex items-center gap-4">
              <div className="w-12 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-[9px] font-black"
                style={{ background: networkColor[card.network] || "#374151" }}>
                {card.network.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-800">•••• •••• •••• {card.last4}</p>
                <p className="text-[11px] text-gray-400">{card.cardholderName ? `${card.cardholderName} · ` : ""}Expires {card.expiry}</p>
              </div>
              {card.isPrimary ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(240,84,92,0.09)", color: "#f0545c" }}>Primary</span>
              ) : (
                <button type="button" onClick={() => handleSetPrimary(card._id)} className="text-[10px] font-semibold text-gray-400 hover:text-[#f0545c] transition-colors flex-shrink-0">Set Primary</button>
              )}
              <button type="button" onClick={() => handleRemoveCard(card._id)} className="text-gray-400 hover:text-red-500 transition-colors ml-1 flex-shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* UPI IDs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <p className="text-[13px] font-bold text-gray-900">UPI IDs</p>
          <button type="button" onClick={() => setUpiModal(true)} className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: "#f0545c" }}>
            <Plus size={13} /> Add UPI
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {!qpData?.upiIds?.length ? (
            <p className="px-6 py-5 text-[13px] text-gray-400 text-center">No UPI IDs added yet</p>
          ) : qpData.upiIds.map((u) => (
            <div key={u._id} className="px-6 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <Zap size={14} style={{ color: "#16a34a" }} />
              </div>
              <p className="flex-1 text-[13px] font-semibold text-gray-800">{u.id}</p>
              <button type="button" onClick={() => handleRemoveUPI(u._id)} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <Link to="/transactions" className="rounded-2xl border border-gray-100 bg-white px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
            <IndianRupee size={14} className="text-gray-400" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-800">Transaction History</p>
            <p className="text-[11px] text-gray-400">View all payments</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-300" />
      </Link>

      {/* Add Card Modal */}
      {cardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 fade-in">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[16px] font-black text-gray-900">Add Card</p>
              <button type="button" onClick={() => setCardModal(false)} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X size={14} /></button>
            </div>
            <p className="text-[11px] text-gray-400 mb-4 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
              We store only the last 4 digits and expiry for security. Full card numbers are never saved.
            </p>
            <div className="space-y-4">
              {[
                { key: "cardholderName", label: "Cardholder Name",  placeholder: "Name on card", type: "text"              },
                { key: "last4",          label: "Last 4 Digits",    placeholder: "4242",          type: "text", maxLength: 4 },
                { key: "expiry",         label: "Expiry (MM/YY)",   placeholder: "08/26",         type: "text", maxLength: 5 },
              ].map(({ key, label, placeholder, type, maxLength }) => (
                <div key={key}>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                  <input type={type} value={cardForm[key]} maxLength={maxLength}
                    onChange={(e) => setCardForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] text-gray-800 outline-none focus:border-[#f0545c] transition-colors" />
                </div>
              ))}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Network</label>
                <select value={cardForm.network} onChange={(e) => setCardForm((f) => ({ ...f, network: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] text-gray-800 outline-none focus:border-[#f0545c]">
                  {["Visa", "Mastercard", "RuPay", "Amex", "Diners"].map((n) => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={handleAddCard} disabled={cardSaving}
                className="flex-1 flex items-center justify-center gap-2 text-[13px] font-bold text-white py-2.5 rounded-xl disabled:opacity-60"
                style={{ background: "#f0545c" }}>
                {cardSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {cardSaving ? "Adding..." : "Add Card"}
              </button>
              <button type="button" onClick={() => setCardModal(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add UPI Modal */}
      {upiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 fade-in">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[16px] font-black text-gray-900">Add UPI ID</p>
              <button type="button" onClick={() => setUpiModal(false)} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X size={14} /></button>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5 focus-within:border-[#f0545c] transition-colors mb-5">
              <Zap size={14} style={{ color: "#16a34a" }} />
              <input type="text" value={upiInput} onChange={(e) => setUpiInput(e.target.value)}
                placeholder="yourname@okaxis"
                className="flex-1 bg-transparent text-[13px] text-gray-800 outline-none"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddUPI(); } }} />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={handleAddUPI} disabled={upiSaving}
                className="flex-1 flex items-center justify-center gap-2 text-[13px] font-bold text-white py-2.5 rounded-xl disabled:opacity-60"
                style={{ background: "#f0545c" }}>
                {upiSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {upiSaving ? "Adding..." : "Add UPI ID"}
              </button>
              <button type="button" onClick={() => setUpiModal(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingsSection({ bookings, loading, toast }) {
  const [resendState, setResendState] = useState({});

  const handleResend = async (bookingId) => {
    setResendState((s) => ({ ...s, [bookingId]: "sending" }));
    try {
      await api.post("/payment/resend-confirmation", { bookingId });
      setResendState((s) => ({ ...s, [bookingId]: "sent" }));
      toast("Confirmation email resent!", "success");
      setTimeout(() => setResendState((s) => ({ ...s, [bookingId]: "idle" })), 3000);
    } catch (err) {
      setResendState((s) => ({ ...s, [bookingId]: "idle" }));
      toast(err.response?.data?.message || "Failed to resend email", "error");
    }
  };

  if (loading) {
    return (
      <div className="fade-in bg-white rounded-2xl border border-gray-100 flex items-center justify-center py-24">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-2.5 h-2.5 rounded-full bg-[#f0545c] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!bookings.length) {
    return (
      <div className="fade-in bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(240,84,92,0.07)" }}>
          <Ticket size={28} style={{ color: "#f0545c", opacity: 0.5 }} />
        </div>
        <p className="text-[16px] font-bold text-gray-700 mb-1">No bookings yet</p>
        <p className="text-[13px] text-gray-400">Your movie tickets will appear here</p>
        <Link to="/" className="mt-5 flex items-center gap-2 text-[13px] font-bold text-white px-6 py-2.5 rounded-xl" style={{ background: "#f0545c" }}>
          Browse Movies <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const fmt12 = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    return `${((h % 12) || 12).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ap}`;
  };

  const isShowPast = (showDate, showTime) => {
    try {
      const base = new Date(showDate);
      if (showTime) {
        const [h, m] = showTime.split(":").map(Number);
        base.setHours(h, m, 0, 0);
      }
      return base < new Date();
    } catch {
      return false;
    }
  };

  const ResendButton = ({ bookingId }) => {
    const state = resendState[bookingId] || "idle";
    if (state === "sending") return (
      <button disabled
        className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed">
        <Loader2 size={11} className="animate-spin" /> Sending…
      </button>
    );
    if (state === "sent") return (
      <button disabled
        className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border text-green-600 bg-green-50 cursor-default"
        style={{ borderColor: "#bbf7d0" }}>
        <CheckCircle size={11} /> Sent!
      </button>
    );
    return (
      <button type="button" onClick={() => handleResend(bookingId)}
        className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-red-50 hover:border-[#f0545c] hover:text-[#f0545c] transition-all">
        <Mail size={11} /> Resend Confirmation
      </button>
    );
  };

  return (
    <div className="fade-in space-y-3">
      <p className="text-[13px] font-bold text-gray-500 mb-1">{bookings.length} booking{bookings.length !== 1 ? "s" : ""}</p>
      {bookings.map((b) => (
        <div key={b._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors">
          <div className="flex items-stretch">
            {/* Poster */}
            <div className="w-16 md:w-20 flex-shrink-0 min-h-[100px]"
              style={{ background: b.movie?.poster ? `url(${IMG(b.movie.poster)}) center/cover` : "linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%)" }}>
              {!b.movie?.poster && (
                <div className="w-full h-full flex items-center justify-center">
                  <Ticket size={20} style={{ color: "rgba(255,255,255,0.2)" }} />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-gray-900 truncate leading-tight">{b.movie?.title || "Movie"}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">{b.theatre?.name}</p>
                </div>
                <span className="flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide"
                  style={b.status === "confirmed"
                    ? { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }
                    : { background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                  {b.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
                  <Calendar size={11} className="text-gray-300" /> {fmt(b.showDate)}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
                  <Clock size={11} className="text-gray-300" /> {fmt12(b.showTime)} · {b.screen}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
                  <Ticket size={11} className="text-gray-300" />
                  {Array.isArray(b.seats) ? b.seats.join(", ") : b.seats}
                </span>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <p className="text-[14px] font-black text-gray-900">₹{b.totalAmount?.toLocaleString("en-IN")}</p>
                {/* Only confirmed, upcoming bookings get the resend button */}
                {b.status === "confirmed" && !isShowPast(b.showDate, b.showTime)
                  ? <ResendButton bookingId={b._id} />
                  : <span className="text-[11px] text-gray-300 font-medium">—</span>
                }
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RewardsSection() {
  const tiers = [
    { name: "Silver",   points: 0,    color: "#9ca3af", bg: "#f9fafb", border: "#e5e7eb" },
    { name: "Gold",     points: 500,  color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
    { name: "Platinum", points: 1500, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  ];
  const currentPoints = 0;
  const currentTier   = tiers[0];
  const nextTier      = tiers[1];
  const progress      = Math.min((currentPoints / nextTier.points) * 100, 100);

  return (
    <div className="fade-in space-y-4">
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%)" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(240,84,92,0.12)", pointerEvents: "none" }} />
        <div className="flex items-start gap-4 relative">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(240,84,92,0.2)", border: "1px solid rgba(240,84,92,0.3)" }}>
            <Sparkles size={22} style={{ color: "#f0545c" }} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[16px] font-black text-white">CineVerse Rewards</p>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase" style={{ background: "#f0545c", color: "#fff" }}>Coming Soon</span>
            </div>
            <p className="text-[13px] text-white/50 max-w-sm">Earn points on every booking, unlock exclusive discounts, and get early access to blockbuster premieres.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Your Points</p>
            <p className="text-[32px] font-black text-gray-200 tracking-tight">{currentPoints.toLocaleString()}<span className="text-[16px] font-bold text-gray-300 ml-1">pts</span></p>
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: currentTier.bg, border: `1px solid ${currentTier.border}` }}>
            <Award size={24} style={{ color: currentTier.color }} />
          </div>
        </div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-gray-400">{currentTier.name}</span>
          <span className="text-[11px] font-semibold text-gray-400">{nextTier.name} ({nextTier.points} pts)</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "#f0545c" }} />
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5">{nextTier.points - currentPoints} more points to reach {nextTier.name}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50"><p className="text-[13px] font-bold text-gray-900">Membership Tiers</p></div>
        <div className="divide-y divide-gray-50">
          {tiers.map((tier) => (
            <div key={tier.name} className="px-6 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tier.bg, border: `1px solid ${tier.border}` }}>
                <Star size={15} style={{ color: tier.color, fill: tier.color }} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-gray-800">{tier.name}</p>
                <p className="text-[11px] text-gray-400">{tier.points.toLocaleString()}+ points</p>
              </div>
              <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wide">Locked</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50"><p className="text-[13px] font-bold text-gray-900">How to earn points</p></div>
        <div className="divide-y divide-gray-50">
          {[
            { icon: Ticket,   label: "Book a ticket",          pts: "+10 pts per ticket", color: "#f0545c" },
            { icon: Star,     label: "Rate a movie",           pts: "+5 pts",             color: "#d97706" },
            { icon: User,     label: "Refer a friend",         pts: "+50 pts",            color: "#7c3aed" },
            { icon: Calendar, label: "First booking/month",    pts: "+25 pts",            color: "#059669" },
          ].map(({ icon: Icon, label, pts, color }) => (
            <div key={label} className="px-6 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                <Icon size={14} style={{ color }} />
              </div>
              <p className="flex-1 text-[13px] font-medium text-gray-700">{label}</p>
              <span className="text-[12px] font-bold" style={{ color }}>{pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
