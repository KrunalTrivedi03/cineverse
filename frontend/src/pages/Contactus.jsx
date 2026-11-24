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
} from "lucide-react";

const CONTACT_INFO = [
  {
    icon: MapPin,
    label: "Our Office",
    lines: ["NOW HQ, 4th Floor, Prahlad Nagar", "Ahmedabad, Gujarat 380015, India"],
  },
  {
    icon: Phone,
    label: "Call Us",
    lines: ["+91 79 4000 1234", "Mon–Sat, 10 AM – 7 PM"],
  },
  {
    icon: Mail,
    label: "Email Us",
    href: "mailto:support@cineversecv.vercel.app",
    lines: ["We reply within 24 hours"],
  },
  {
    icon: Clock,
    label: "Business Hours",
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
      showToast.success("Message sent! Our team will get back to you shortly.");
      setForm(initialForm);
    } catch (err) {
      showToast.error(err.response?.data?.message || "Couldn't send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full px-4 py-3 rounded-xl border text-[13.5px] text-gray-800 placeholder-gray-400 outline-none transition-all bg-gray-50 focus:bg-white";

  const borderFor = (field) =>
    errors[field] ? { borderColor: "#106579" } : { borderColor: "#e4e4e7" };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--now-ui-font)" }}>
      <Navbar />

      {/* Hero */}
      <section className="now-light-banner relative overflow-hidden">
        <div
          className="absolute -right-20 -top-20 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "rgba(16,101,121,0.16)" }}
        />
        <div className="relative max-w-4xl mx-auto px-5 md:px-8 pt-14 pb-16 md:pt-20 md:pb-20 text-center">
          <div className="inline-flex items-center gap-1.5 mb-4 px-3 py-1.5 rounded-full" style={{ background: "rgba(16,101,121,0.15)" }}>
            <MessageCircle size={12} style={{ color: "#106579" }} />
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#106579" }}>
              Get in touch
            </span>
          </div>
          <h1 className="text-gray-900 font-black text-[30px] sm:text-[40px] md:text-[46px] leading-[1.1] tracking-tight">
            We'd love to <span style={{ color: "#106579" }}>hear from you</span>
          </h1>
          <p className="text-gray-600 text-[14px] sm:text-[15px] max-w-lg mx-auto mt-4 leading-relaxed">
            Questions about a booking, a partnership idea, or just feedback? Drop us a message and
            our team will get back to you soon.
          </p>
        </div>
      </section>

      {/* Contact info cards */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 -mt-10 md:-mt-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {CONTACT_INFO.map(({ icon: Icon, label, lines, href }) => (
            <div key={label} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(16,101,121,0.08)" }}>
                <Icon size={16} style={{ color: "#106579" }} />
              </div>
              {href ? (
                <a href={href} className="mb-1 inline-block text-[13px] font-bold text-now-accent hover:underline">{label}</a>
              ) : <p className="text-[13px] font-bold text-gray-900 mb-1">{label}</p>}
              {lines.map((l) => (
                <p key={l} className="text-[11.5px] text-gray-500 leading-snug">
                  {l}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Form + Map */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-14 md:py-20">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 md:gap-10">
          {/* Form */}
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 md:p-9">
            <h2 className="text-[20px] md:text-[24px] font-black text-gray-900 tracking-tight mb-1.5">
              Send us a message
            </h2>
            <p className="text-[13px] text-gray-500 mb-7">Fill in the form below and we'll respond within 24 hours.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Your full name"
                    className={inputCls}
                    style={borderFor("name")}
                  />
                  {errors.name && <p className="text-[11px] mt-1 font-medium" style={{ color: "#106579" }}>{errors.name}</p>}
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@example.com"
                    className={inputCls}
                    style={borderFor("email")}
                  />
                  {errors.email && <p className="text-[11px] mt-1 font-medium" style={{ color: "#106579" }}>{errors.email}</p>}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">Phone (optional)</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className={inputCls}
                    style={borderFor("phone")}
                  />
                  {errors.phone && <p className="text-[11px] mt-1 font-medium" style={{ color: "#106579" }}>{errors.phone}</p>}
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">Subject</label>
                  <select
                    value={form.subject}
                    onChange={(e) => set("subject", e.target.value)}
                    className={inputCls}
                    style={borderFor("subject")}
                  >
                    <option value="">Select a subject</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.subject && <p className="text-[11px] mt-1 font-medium" style={{ color: "#106579" }}>{errors.subject}</p>}
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  placeholder="Tell us a bit more..."
                  rows={5}
                  className={`${inputCls} resize-none`}
                  style={borderFor("message")}
                />
                {errors.message && <p className="text-[11px] mt-1 font-medium" style={{ color: "#106579" }}>{errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 inline-flex items-center justify-center gap-2 text-white font-bold text-[14px] px-6 py-3.5 rounded-xl transition-transform active:scale-[0.98] disabled:opacity-60"
                style={{ background: "#106579" }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                {submitting ? "Sending..." : "Send message"}
              </button>
            </form>
          </div>

          {/* Map + socials */}
          <div className="flex flex-col gap-5">
            <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm flex-1 min-h-[280px]">
              <iframe
                title="NOW location map"
                src="https://www.google.com/maps?q=Prahlad+Nagar,+Ahmedabad,+Gujarat&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: 280 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
              <p className="text-[13px] font-bold text-gray-900 mb-3">Follow us</p>
              <div className="flex gap-2.5">
                {[Twitter, Instagram, Youtube].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    aria-label="Social link"
                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-white hover:bg-now-accent hover:border-now-accent transition-all"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}