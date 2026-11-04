import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BottomNav from "../components/BottomNav";
import api from "../api/axiosInstance";
import { showToast } from "../utils/toast.jsx";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Loader2,
  MessageCircle,
  Twitter,
  Instagram,
  Youtube,
  Sparkles,
} from "lucide-react";

const CONTACT_INFO = [
  {
    icon: MapPin,
    label: "Headquarters",
    lines: ["NOW HQ, 4th Floor, Prahlad Nagar", "Ahmedabad, Gujarat 380015, India"],
  },
  {
    icon: Phone,
    label: "Support Helpline",
    lines: ["+91 79 4000 1234", "Mon–Sat, 10 AM – 7 PM IST"],
  },
  {
    icon: Mail,
    label: "Support Desk",
    lines: ["support@cineversecv.vercel.app", "Response within 24 hours"],
  },
  {
    icon: Clock,
    label: "Customer Support Hours",
    lines: ["Mon – Sat: 10:00 AM – 7:00 PM", "Sunday: 11:00 AM – 4:00 PM"],
  },
];

const SUBJECTS = ["General Enquiry", "Booking Issue", "Refund & Payment", "Partnership", "Feedback", "Other"];

const initialForm = { name: "", email: "", phone: "", subject: "", message: "" };

export default function ContactUs() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (field, val) => {
    setForm((p) => ({ ...p, [field]: val }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Please enter your name";
    if (!form.email.trim()) e.email = "Please enter your email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (form.phone && !/^[0-9+\-\s]{7,15}$/.test(form.phone)) e.phone = "Enter a valid phone number";
    if (!form.subject) e.subject = "Please select a subject";
    if (!form.message.trim()) e.message = "Please write a message";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post("/contact", form);
      showToast.success("Message sent! Our support team will get back to you shortly.");
      setForm(initialForm);
    } catch (err) {
      showToast.error(err.response?.data?.message || "Couldn't send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full px-4 py-3.5 rounded-2xl border text-[14px] text-gray-800 placeholder-gray-400 outline-none transition-all bg-gray-50/70 focus:bg-white focus:border-[#f0545c] focus:ring-4 focus:ring-[#f0545c]/10 shadow-2xs";

  const borderFor = (field) =>
    errors[field] ? { borderColor: "#f0545c" } : { borderColor: "#e5e7eb" };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex flex-col justify-between" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div>
        <Navbar />
        <BottomNav />

        {/* ══ HERO BANNER ═══════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#0c0d12]">
          <div
            className="absolute -right-20 -top-20 w-72 h-72 rounded-full pointer-events-none opacity-20"
            style={{ background: "radial-gradient(circle, #f0545c 0%, transparent 70%)" }}
          />
          <div className="relative max-w-4xl mx-auto px-6 md:px-8 pt-16 pb-20 md:pt-20 md:pb-24 text-center z-10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#f0545c] mb-3">
              Contact Support &amp; Concierge
            </p>
            <h1 className="text-white font-black text-[32px] sm:text-[42px] md:text-[50px] leading-[1.1] tracking-tight">
              We're Here to <span className="text-[#f0545c]">Help You</span>
            </h1>
            <p className="text-white/60 text-[14.5px] sm:text-[16px] max-w-lg mx-auto mt-4 leading-relaxed font-medium">
              Have questions about booking confirmation, refunds, or venue partnerships? Send us a note and we'll reply right away.
            </p>
          </div>
        </section>

        {/* ══ CONTACT INFO CARDS ════════════════════════════ */}
        <section className="max-w-6xl mx-auto px-6 md:px-8 -mt-10 md:-mt-12 relative z-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CONTACT_INFO.map(({ icon: Icon, label, lines }) => (
              <div key={label} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 card-hover-lift">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 bg-[#f0545c]/10 text-[#f0545c]">
                  <Icon size={18} />
                </div>
                <p className="text-[14px] font-black text-gray-900 mb-1.5">{label}</p>
                {lines.map((l) => (
                  <p key={l} className="text-[12px] text-gray-500 leading-snug">
                    {l}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ══ FORM + MAP ════════════════════════════════════ */}
        <section className="max-w-6xl mx-auto px-6 md:px-8 py-14 md:py-20 pb-24 md:pb-20">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 md:gap-10 items-start">
            
            {/* Form Container */}
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-10">
              <h2 className="text-[22px] sm:text-[26px] font-black text-gray-900 tracking-tight mb-1.5">
                Send Us a Message
              </h2>
              <p className="text-[13.5px] text-gray-500 mb-7">
                Leave your query and our team will get back to you within 24 hours.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 block">Full Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Your full name"
                      className={inputCls}
                      style={borderFor("name")}
                    />
                    {errors.name && <p className="text-[11px] mt-1 font-bold text-red-500">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 block">Email Address</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="you@domain.com"
                      className={inputCls}
                      style={borderFor("email")}
                    />
                    {errors.email && <p className="text-[11px] mt-1 font-bold text-red-500">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 block">Phone (Optional)</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="+91 98765 43210"
                      className={inputCls}
                      style={borderFor("phone")}
                    />
                    {errors.phone && <p className="text-[11px] mt-1 font-bold text-red-500">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 block">Enquiry Type</label>
                    <select
                      value={form.subject}
                      onChange={(e) => set("subject", e.target.value)}
                      className={inputCls}
                      style={borderFor("subject")}
                    >
                      <option value="">Select subject category</option>
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {errors.subject && <p className="text-[11px] mt-1 font-bold text-red-500">{errors.subject}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 block">Your Message</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                    placeholder="Describe your inquiry in detail..."
                    rows={4}
                    className={`${inputCls} resize-none`}
                    style={borderFor("message")}
                  />
                  {errors.message && <p className="text-[11px] mt-1 font-bold text-red-500">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 inline-flex items-center justify-center gap-2 text-white font-bold text-[14.5px] px-8 py-3.5 rounded-2xl transition-all bg-[#f0545c] hover:bg-[#e03a43] shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                  <span>{submitting ? "Sending Query..." : "Send Message"}</span>
                </button>
              </form>
            </div>

            {/* Map & Socials */}
            <div className="flex flex-col gap-6">
              <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-md flex-1 min-h-[300px]">
                <iframe
                  title="NOW location map"
                  src="https://www.google.com/maps?q=Prahlad+Nagar,+Ahmedabad,+Gujarat&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: 300 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-2xs">
                <p className="text-[14px] font-black text-gray-900 mb-3">Connect With Us Online</p>
                <div className="flex gap-2.5">
                  {[Twitter, Instagram, Youtube].map((Icon, i) => (
                    <a
                      key={i}
                      href="#"
                      aria-label="Social link"
                      className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-center text-gray-600 hover:text-white hover:bg-[#f0545c] hover:border-[#f0545c] transition-all transform hover:-translate-y-0.5"
                    >
                      <Icon size={16} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
