import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { CheckCircle2, MapPin, Calendar, Clock, Monitor, Ticket, Home, Film } from "lucide-react";

const IMG = (path) => !path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;

const fmt12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ap}`;
};

const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

const CAT = {
  Recliner: { color: "#7c3aed", bg: "#f3eeff", border: "#c4b5fd" },
  Premium:  { color: "#e11d48", bg: "#fff1f2", border: "#fda4af" },
  Classic:  { color: "#059669", bg: "#ecfdf5", border: "#6ee7b7" },
};

function MiniQR({ val = "" }) {
  const N = 9;
  const s = val.split("").reduce((a, c) => a + c.charCodeAt(0), 5);
  const cells = Array.from({ length: N * N }, (_, i) => {
    const x = i % N, y = Math.floor(i / N);
    if ((x < 3 && y < 3) || (x >= N - 3 && y < 3) || (x < 3 && y >= N - 3)) {
      const fx = x < 3 ? 1 : N - 2, fy = y < 3 ? 1 : (y >= N - 3 ? N - 2 : -1);
      if (fy < 0) return (((s * (i + 3) * 2654435761) >>> 0) % 3 === 0);
      return Math.abs(x - fx) <= 1 && Math.abs(y - fy) <= 1;
    }
    return (((s * (i + 13) * 2246822519) >>> 0) % 2 === 0);
  });
  return (
    <div style={{
      display: "grid", gridTemplateColumns: `repeat(${N}, 1fr)`,
      gap: "1.5px", padding: "6px", background: "#fff",
      width: "62px", height: "62px", borderRadius: "8px",
      boxShadow: "0 1px 6px rgba(0,0,0,0.1)", flexShrink: 0,
    }}>
      {cells.map((on, i) => (
        <div key={i} style={{ background: on ? "#111827" : "transparent", borderRadius: "0.5px" }} />
      ))}
    </div>
  );
}

function Confetti({ items }) {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999, overflow: "hidden" }}>
      {items.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.x}%`, top: "-10px",
          width: `${p.w}px`, height: `${p.h}px`,
          background: p.color, borderRadius: p.r ? "50%" : "2px",
          animation: `tk-fall ${p.dur}s ease-in ${p.delay}s forwards`,
        }} />
      ))}
    </div>
  );
}

export default function BookingSuccess() {
  const { state }  = useLocation();
  const navigate   = useNavigate();
  const { booking, movie, theatre } = state || {};

  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    if (!booking) { navigate("/"); return; }
    setConfetti(Array.from({ length: 40 }, (_, i) => ({
      id: i, x: Math.random() * 100,
      w: 5 + Math.random() * 6, h: 5 + Math.random() * 8,
      delay: Math.random() * 1.8, dur: 2.5 + Math.random() * 2,
      r: Math.random() > 0.5,
      color: ["#f0545c","#7c3aed","#059669","#f59e0b","#3b82f6","#ec4899"][i % 6],
    })));
  }, []);

  if (!booking) return null;

  const seats     = booking.seats || [];
  const ref       = booking.bookingRef || "";
  const total     = booking.grandTotal || 0;
  const sub       = booking.totalAmount || 0;
  const fee       = booking.convenienceFee || 0;
  const date      = booking.showDate;
  const time      = booking.showTime;
  const screen    = booking.screen;
  const venue     = theatre?.name || "";
  const title     = movie?.title  || "";
  const poster    = movie?.poster || "";
  const R         = 16;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f0f0f3", fontFamily: "'Outfit', sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');

        @keyframes tk-fall { to { transform:translateY(110vh) rotate(540deg); opacity:0; } }
        @keyframes tk-check {
          0%  { transform:scale(0) rotate(-20deg); opacity:0; }
          65% { transform:scale(1.18) rotate(5deg); }
          85% { transform:scale(0.94) rotate(-2deg); }
          100%{ transform:scale(1) rotate(0); opacity:1; }
        }
        @keyframes tk-up   { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes tk-rise { from{transform:translateY(40px) scale(.96);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
        @keyframes tk-scan {
          0%,100%{top:6px;opacity:.5}
          50%{top:50px;opacity:1}
        }
        @keyframes tk-shine {
          0%  {left:-120%}
          100%{left:200%}
        }

        .tk-check  { animation: tk-check .55s cubic-bezier(.34,1.56,.64,1) .1s both; }
        .tk-h1     { animation: tk-up .4s ease .5s both; }
        .tk-p      { animation: tk-up .4s ease .62s both; }
        .tk-card   { animation: tk-rise .55s cubic-bezier(.34,1.56,.64,1) .75s both; }
        .tk-btns   { animation: tk-up .4s ease 1.3s both; }

        .tk-scan {
          position:absolute; left:6px; right:6px; height:2px;
          background:linear-gradient(90deg,transparent,rgba(240,84,92,.8),transparent);
          border-radius:2px;
          animation: tk-scan 2.4s ease-in-out 1.6s infinite;
        }
        .tk-shine-over {
          position:absolute; inset:0; pointer-events:none; overflow:hidden;
        }
        .tk-shine-over::after {
          content:''; position:absolute; top:0; width:35%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);
          animation: tk-shine 4s ease 1s infinite;
        }
        .tk-seat { transition:transform .15s ease; cursor:default; }
        .tk-seat:hover { transform:translateY(-2px) scale(1.07); }
        .tk-btnA { transition:all .15s ease; }
        .tk-btnA:hover { filter:brightness(.9); transform:translateY(-1px); }
        .tk-btnB { transition:all .15s ease; }
        .tk-btnB:hover { background:#e8e8ec !important; }
      `}</style>

      <Confetti items={confetti} />
      <Navbar />

      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "12px 16px", minHeight: 0,
      }}>
        <div style={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "12px" }}>

          <div style={{ textAlign: "center" }}>
            <div className="tk-check" style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "52px", height: "52px", borderRadius: "50%",
              background: "rgba(5,150,105,0.1)", border: "2px solid rgba(5,150,105,0.28)",
              marginBottom: "8px",
            }}>
              <CheckCircle2 size={26} color="#059669" strokeWidth={2.5} />
            </div>
            <h1 className="tk-h1" style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "#111", letterSpacing: "-.3px" }}>
              Booking Confirmed!
            </h1>
            <p className="tk-p" style={{ margin: "3px 0 0", fontSize: "12px", color: "#9ca3af" }}>
              Your tickets are ready • Enjoy the show 🎬
            </p>
          </div>

          <div className="tk-card" style={{ position: "relative", filter: "drop-shadow(0 10px 32px rgba(0,0,0,0.13))" }}>
            <div style={{
              borderRadius: "20px 20px 0 0", overflow: "hidden", position: "relative",
              background: "linear-gradient(140deg,#1b1835 0%,#2c1e50 50%,#192340 100%)",
            }}>
              {poster && (
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundImage: `url(${IMG(poster)})`,
                  backgroundSize: "cover", backgroundPosition: "center",
                  opacity: .13, filter: "blur(16px)", transform: "scale(1.1)", pointerEvents: "none",
                }} />
              )}
              <div className="tk-shine-over" />
              <div style={{ padding: "14px 16px 12px", display: "flex", gap: "12px", alignItems: "center", position: "relative" }}>
                {poster ? (
                  <img src={IMG(poster)} alt={title} style={{
                    width: "46px", height: "64px", objectFit: "cover", flexShrink: 0,
                    borderRadius: "9px", boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
                    border: "1.5px solid rgba(255,255,255,0.1)",
                  }} />
                ) : (
                  <div style={{
                    width: "46px", height: "64px", borderRadius: "9px", flexShrink: 0,
                    background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Film size={20} color="rgba(255,255,255,.3)" />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "8px", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#f87171" }}>
                    ● Now Showing
                  </span>
                  <h2 style={{ margin: "3px 0 6px", fontSize: "16px", fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-.2px" }}>
                    {title}
                  </h2>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "4px",
                    fontSize: "9px", fontWeight: 700, padding: "2px 8px",
                    borderRadius: "6px", background: "rgba(240,84,92,.18)",
                    color: "#fca5a5", border: "1px solid rgba(240,84,92,.25)",
                  }}>
                    <Monitor size={8} />{screen}
                  </span>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: "7px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.35)" }}>REF</p>
                  <p style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: "#f0545c", fontFamily: "'DM Mono',monospace", letterSpacing: ".02em" }}>{ref}</p>
                </div>
              </div>

              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr",
                borderTop: "1px solid rgba(255,255,255,.07)",
              }}>
                {[
                  { icon: <Calendar size={9} />, label: "Date",  val: fmtDate(date), mono: false },
                  { icon: <Clock    size={9} />, label: "Time",  val: fmt12(time),   mono: true  },
                  { icon: <MapPin   size={9} />, label: "Venue", val: venue,         mono: false },
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: "10px 12px",
                    borderRight: i < 2 ? "1px solid rgba(255,255,255,.07)" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "3px", color: "rgba(255,255,255,.38)", marginBottom: "3px" }}>
                      {item.icon}
                      <span style={{ fontSize: "7px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>{item.label}</span>
                    </div>
                    <p style={{
                      margin: 0, fontSize: i === 1 ? "15px" : "10px", fontWeight: 800,
                      color: "#fff", lineHeight: 1.2,
                      fontFamily: item.mono ? "'DM Mono',monospace" : "inherit",
                    }}>{item.val}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ position: "relative", height: 0, zIndex: 2 }}>
              <div style={{
                position: "absolute", left: -R, top: -R,
                width: R * 2, height: R * 2, borderRadius: "50%",
                background: "#f0f0f3", boxShadow: "inset 0 2px 5px rgba(0,0,0,0.07)",
              }} />
              <div style={{
                position: "absolute", right: -R, top: -R,
                width: R * 2, height: R * 2, borderRadius: "50%",
                background: "#f0f0f3", boxShadow: "inset 0 2px 5px rgba(0,0,0,0.07)",
              }} />
              <div style={{
                position: "absolute",
                left: R + 8, right: R + 8, top: 0,
                borderTop: "2px dashed rgba(200,200,215,0.65)",
              }} />
            </div>

            <div style={{ background: "#fff", borderRadius: "0 0 20px 20px", padding: "18px 16px 14px" }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 7px", fontSize: "8px", fontWeight: 800, letterSpacing: ".13em", textTransform: "uppercase", color: "#9ca3af" }}>
                    Seats · {seats.length} Ticket{seats.length !== 1 ? "s" : ""}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                    {seats.map((s) => {
                      const c = CAT[s.category] || CAT.Classic;
                      return (
                        <div key={s.seatId} className="tk-seat" style={{
                          padding: "5px 10px", borderRadius: "9px",
                          background: c.bg, border: `1.5px solid ${c.border}`,
                          display: "flex", flexDirection: "column", alignItems: "center",
                        }}>
                          <span style={{ fontSize: "13px", fontWeight: 900, color: c.color, fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{s.seatId}</span>
                          <span style={{ fontSize: "7px", fontWeight: 700, color: c.color, opacity: .6, textTransform: "uppercase", letterSpacing: ".07em", marginTop: "2px" }}>{s.category}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ borderTop: "1px dashed #e5e7eb", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "10px", color: "#9ca3af" }}>Subtotal</span>
                      <span style={{ fontSize: "10px", fontWeight: 600, color: "#4b5563" }}>₹{sub?.toLocaleString("en-IN")}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "10px", color: "#9ca3af" }}>Conv. fee</span>
                      <span style={{ fontSize: "10px", fontWeight: 600, color: "#4b5563" }}>₹{fee}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "6px", borderTop: "1px solid #f3f4f6" }}>
                      <span style={{ fontSize: "12px", fontWeight: 800, color: "#111" }}>Total Paid</span>
                      <span style={{ fontSize: "14px", fontWeight: 900, color: "#f0545c" }}>₹{total?.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <div style={{ position: "relative" }}>
                    <MiniQR val={ref} />
                    <div className="tk-scan" />
                  </div>
                  <p style={{ margin: 0, fontSize: "7px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#9ca3af", textAlign: "center" }}>
                    Scan at Entry
                  </p>
                </div>
              </div>

              <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1.5px dashed #e5e7eb" }}>
                <svg width="100%" height="32" viewBox="0 0 360 32" preserveAspectRatio="none" style={{ display: "block" }}>
                  {Array.from({ length: 72 }, (_, i) => {
                    const seed = (ref.charCodeAt(i % Math.max(ref.length, 1)) || 42) * (i + 1);
                    const w    = ((seed * 2246822519) >>> 0) % 5 === 0 ? 2 : 1;
                    const x    = i * 5;
                    const h    = 20 + (((seed * 1234567) >>> 0) % 10);
                    return <rect key={i} x={x} y={(32 - h) / 2} width={w} height={h} fill="#1a1a2e" rx="0.3" />;
                  })}
                </svg>
                <p style={{
                  textAlign: "center", fontSize: "8px", fontWeight: 600,
                  letterSpacing: ".18em", color: "#9ca3af", margin: "3px 0 0",
                  fontFamily: "'DM Mono',monospace",
                }}>{ref}</p>
              </div>
            </div>

            <div style={{
              padding: "8px 16px",
              background: "linear-gradient(90deg,rgba(240,84,92,.06),rgba(124,58,237,.06))",
              borderTop: "1px solid rgba(240,84,92,.1)",
              borderRadius: "0 0 20px 20px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Ticket size={12} color="#f0545c" />
                <span style={{ fontSize: "11px", fontWeight: 900, color: "#f0545c", letterSpacing: ".05em" }}>CineVerse</span>
              </div>
              <span style={{ fontSize: "7.5px", fontWeight: 700, letterSpacing: ".1em", color: "#9ca3af", textTransform: "uppercase" }}>
                Show Valid ID at Entry
              </span>
            </div>
          </div>

          <div className="tk-btns" style={{ display: "flex", gap: "10px" }}>
            <button className="tk-btnA"
              onClick={() => navigate("/")}
              style={{
                flex: 1, padding: "12px 0", border: "none", cursor: "pointer",
                borderRadius: "14px", background: "#f0545c",
                boxShadow: "0 4px 16px rgba(240,84,92,.28)",
                fontSize: "13px", fontWeight: 800, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                fontFamily: "'Outfit',sans-serif",
              }}>
              <Home size={15} /> Home
            </button>
            <button className="tk-btnB"
              onClick={() => navigate("/settings")}
              style={{
                flex: 1, padding: "12px 0", cursor: "pointer",
                borderRadius: "14px", background: "#fff",
                border: "1.5px solid #e5e7eb",
                fontSize: "13px", fontWeight: 700, color: "#374151",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                fontFamily: "'Outfit',sans-serif",
              }}>
              <Ticket size={15} /> My Bookings
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}


