// src/pages/PlayBookingSuccess.jsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import { CheckCircle2, MapPin, Calendar, Home, Trophy, Clock as ClockIcon } from "lucide-react";
import { fmtDate } from "../utils/eventHelpers";

export default function PlayBookingSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { booking, bookingRef } = state || {};

  useEffect(() => {
    if (!booking) navigate("/play");
  }, []);

  if (!booking) return null;

  const ref = bookingRef || booking.bookingRef || "";
  const total = booking.pricing?.total || 0;
  const sub = booking.pricing?.subtotal || 0;
  const fee = booking.pricing?.convenienceFee || 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>
      <Navbar />
      <BottomNav />

      <div style={{ maxWidth: 420, margin: "0 auto", padding: "16px 16px 32px" }}>

        {/* Success badge */}
        <div style={{ textAlign: "center", padding: "20px 0 16px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(5,150,105,0.1)", marginBottom: 10,
          }}>
            <CheckCircle2 size={24} color="#059669" strokeWidth={2.5} />
          </div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111", letterSpacing: "-.3px" }}>Slot Booked!</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>See you on the court</p>
        </div>

        {/* Booking card */}
        <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden" }}>

          <div style={{ background: "#111827", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(240,84,92,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Trophy size={18} color="#f0545c" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{booking.activityName}</p>
              <p style={{ margin: "3px 0 0", fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{ref}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #f3f4f6" }}>
            {[
              { icon: <Calendar size={10} color="#9ca3af" />, label: "Date", val: fmtDate(booking.date) },
              { icon: <MapPin size={10} color="#9ca3af" />, label: "Venue", val: `${booking.venueName} · ${booking.courtName}` },
            ].map((item, i) => (
              <div key={i} style={{ padding: "10px 12px", borderRight: i < 1 ? "1px solid #f3f4f6" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 3 }}>
                  {item.icon}
                  <span style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>{item.label}</span>
                </div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#111", lineHeight: 1.3 }} className="line-clamp-1">{item.val}</p>
              </div>
            ))}
          </div>

          {/* Dashed divider */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", padding: "0 16px" }}>
            <div style={{ position: "absolute", left: -12, width: 24, height: 24, borderRadius: "50%", background: "#f5f5f7" }} />
            <div style={{ flex: 1, borderTop: "1.5px dashed #e5e7eb" }} />
            <div style={{ position: "absolute", right: -12, width: 24, height: 24, borderRadius: "50%", background: "#f5f5f7" }} />
          </div>

          {/* Slots + pricing */}
          <div style={{ padding: "12px 16px 14px" }}>
            <p style={{ margin: "0 0 8px", fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".1em" }}>
              {booking.slots?.length || 0} Slot{booking.slots?.length !== 1 ? "s" : ""}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {(booking.slots || []).map((s, i) => (
                <div key={i} style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(240,84,92,0.06)", border: "1px solid rgba(240,84,92,0.2)", display: "flex", alignItems: "center", gap: 4 }}>
                  <ClockIcon size={10} color="#f0545c" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#f0545c" }}>{s.startTime}–{s.endTime}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 10, display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>Subtotal</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#4b5563" }}>₹{sub?.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>Convenience fee</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#4b5563" }}>₹{fee}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, borderTop: "1px solid #f3f4f6", marginTop: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#111" }}>Total Paid</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: "#f0545c" }}>₹{total?.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #f3f4f6", padding: "9px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Trophy size={12} color="#f0545c" />
              <span style={{ fontSize: 11, fontWeight: 800, color: "#f0545c" }}>CineVerse Play</span>
            </div>
            <span style={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "monospace" }}>{ref}</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            onClick={() => navigate("/play")}
            style={{
              flex: 1, padding: "12px 0", border: "none", cursor: "pointer",
              borderRadius: 14, background: "#f0545c",
              fontSize: 13, fontWeight: 700, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontFamily: "'Outfit', sans-serif",
            }}>
            <Home size={15} /> Explore Play
          </button>
          <button
            onClick={() => navigate("/play/my-bookings")}
            style={{
              flex: 1, padding: "12px 0", cursor: "pointer",
              borderRadius: 14, background: "#fff",
              border: "1.5px solid #e5e7eb",
              fontSize: 13, fontWeight: 700, color: "#374151",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontFamily: "'Outfit', sans-serif",
            }}>
            <Trophy size={15} /> My Bookings
          </button>
        </div>

      </div>
    </div>
  );
}