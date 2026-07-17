import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { CheckCircle2, MapPin, Calendar, Clock, Home, Ticket } from "lucide-react";

const IMG = (path) => !path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;

const fmt12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ap}`;
};

const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const CAT_COLOR = {
  Recliner: { color: "#7c3aed", bg: "#f3eeff", border: "#c4b5fd" },
  Premium:  { color: "#e11d48", bg: "#fff1f2", border: "#fda4af" },
  Classic:  { color: "#059669", bg: "#ecfdf5", border: "#6ee7b7" },
};

export default function BookingSuccess() {
  const { state }  = useLocation();
  const navigate   = useNavigate();
  const { booking, movie, theatre } = state || {};

  useEffect(() => {
    if (!booking) navigate("/");
  }, []);

  if (!booking) return null;

  const seats  = booking.seats || [];
  const ref    = booking.bookingRef || "";
  const total  = booking.grandTotal || 0;
  const sub    = booking.totalAmount || 0;
  const fee    = booking.convenienceFee || 0;
  const title  = movie?.title || "";
  const poster = movie?.poster || "";
  const venue  = theatre?.name || "";

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>
      <Navbar />

      <div style={{ maxWidth: 420, margin: "0 auto", padding: "16px 16px 32px" }}>

        {/* ── Success badge ── */}
        <div style={{ textAlign: "center", padding: "20px 0 16px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(5,150,105,0.1)", marginBottom: 10,
          }}>
            <CheckCircle2 size={24} color="#059669" strokeWidth={2.5} />
          </div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111", letterSpacing: "-.3px" }}>Booking Confirmed!</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>Check your email for the ticket</p>
        </div>

        {/* ── Ticket card ── */}
        <div style={{
          background: "#fff", borderRadius: 20,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}>

          {/* Movie header */}
          <div style={{
            background: "#111827", padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            {poster && (
              <img src={IMG(poster)} alt={title} style={{
                width: 38, height: 52, objectFit: "cover",
                borderRadius: 8, flexShrink: 0,
                border: "1px solid rgba(255,255,255,0.1)",
              }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{title}</p>
              <p style={{ margin: "3px 0 0", fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{ref}</p>
            </div>
            <div style={{
              flexShrink: 0, padding: "4px 10px", borderRadius: 8,
              background: "rgba(240,84,92,0.15)", border: "1px solid rgba(240,84,92,0.3)",
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#f87171" }}>{booking.screen}</span>
            </div>
          </div>

          {/* Show info row */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            borderBottom: "1px solid #f3f4f6",
          }}>
            {[
              { icon: <Calendar size={10} color="#9ca3af" />, label: "Date", val: fmtDate(booking.showDate) },
              { icon: <Clock    size={10} color="#9ca3af" />, label: "Time", val: fmt12(booking.showTime) },
              { icon: <MapPin   size={10} color="#9ca3af" />, label: "Venue", val: venue },
            ].map((item, i) => (
              <div key={i} style={{
                padding: "10px 12px",
                borderRight: i < 2 ? "1px solid #f3f4f6" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 3 }}>
                  {item.icon}
                  <span style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>{item.label}</span>
                </div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#111", lineHeight: 1.3 }}>{item.val}</p>
              </div>
            ))}
          </div>

          {/* Dashed divider with notches */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", padding: "0 16px" }}>
            <div style={{
              position: "absolute", left: -12, width: 24, height: 24,
              borderRadius: "50%", background: "#f5f5f7",
            }} />
            <div style={{ flex: 1, borderTop: "1.5px dashed #e5e7eb" }} />
            <div style={{
              position: "absolute", right: -12, width: 24, height: 24,
              borderRadius: "50%", background: "#f5f5f7",
            }} />
          </div>

          {/* Seats + pricing */}
          <div style={{ padding: "12px 16px 14px" }}>

            {/* Seats */}
            <p style={{ margin: "0 0 8px", fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".1em" }}>
              {seats.length} Seat{seats.length !== 1 ? "s" : ""}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {seats.map((s) => {
                const c = CAT_COLOR[s.category] || CAT_COLOR.Classic;
                return (
                  <div key={s.seatId} style={{
                    padding: "4px 10px", borderRadius: 8,
                    background: c.bg, border: `1px solid ${c.border}`,
                    display: "flex", flexDirection: "column", alignItems: "center",
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: c.color, fontFamily: "monospace" }}>{s.seatId}</span>
                    <span style={{ fontSize: 7, fontWeight: 600, color: c.color, opacity: .6, textTransform: "uppercase" }}>{s.category}</span>
                  </div>
                );
              })}
            </div>

            {/* Pricing */}
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

          {/* Footer strip */}
          <div style={{
            borderTop: "1px solid #f3f4f6",
            padding: "9px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#fafafa",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Ticket size={12} color="#f0545c" />
              <span style={{ fontSize: 11, fontWeight: 800, color: "#f0545c" }}>Encore</span>
            </div>
            <span style={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "monospace" }}>{ref}</span>
          </div>
        </div>

        {/* ── Buttons ── */}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            onClick={() => navigate("/")}
            style={{
              flex: 1, padding: "12px 0", border: "none", cursor: "pointer",
              borderRadius: 14, background: "#f0545c",
              fontSize: 13, fontWeight: 700, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontFamily: "'Outfit', sans-serif",
            }}>
            <Home size={15} /> Home
          </button>
          <button
            onClick={() => navigate("/settings")}
            style={{
              flex: 1, padding: "12px 0", cursor: "pointer",
              borderRadius: 14, background: "#fff",
              border: "1.5px solid #e5e7eb",
              fontSize: 13, fontWeight: 700, color: "#374151",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontFamily: "'Outfit', sans-serif",
            }}>
            <Ticket size={15} /> My Bookings
          </button>
        </div>

      </div>
    </div>
  );
}