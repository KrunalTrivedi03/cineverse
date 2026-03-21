import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate  = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const timerRef  = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current); navigate("/"); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [navigate]);

  const stop = () => clearInterval(timerRef.current);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f0e6",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 24px",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');

        .nfa-btn-p {
          background: #1a1410; color: #faf7f0; border: none;
          border-radius: 8px; padding: 13px 28px; font-size: 13px;
          font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: background .15s, transform .1s;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .nfa-btn-p:hover  { background: #2e261c; }
        .nfa-btn-p:active { transform: scale(.97); }

        .nfa-btn-s {
          background: transparent; color: #7a6a4a;
          border: 1px solid #c8b98a; border-radius: 8px;
          padding: 12px 24px; font-size: 13px; font-weight: 500;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          transition: border-color .15s, color .15s;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .nfa-btn-s:hover { border-color: #a09060; color: #3d3020; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nfa-fade1 { animation: fadeUp .5s .05s cubic-bezier(.4,0,.2,1) both; }
        .nfa-fade2 { animation: fadeUp .5s .15s cubic-bezier(.4,0,.2,1) both; }
        .nfa-fade3 { animation: fadeUp .5s .25s cubic-bezier(.4,0,.2,1) both; }
        .nfa-fade4 { animation: fadeUp .5s .35s cubic-bezier(.4,0,.2,1) both; }

        @keyframes filmScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .film-track { animation: filmScroll 10s linear infinite; }
      `}</style>

      <div style={{
        position: "fixed", top: 0, left: 0, right: 0,
        height: 22, background: "#1a1410",
        overflow: "hidden", display: "flex", alignItems: "center",
      }}>
        <div className="film-track" style={{ display: "flex", width: "200%" }}>
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <div style={{ width: 12, height: 9, background: "#0a0806", border: "1px solid #2e2010", borderRadius: 2, margin: "0 5px", flexShrink: 0 }} />
              <div style={{ width: 32, height: 20, background: i % 4 === 0 ? "#221a10" : "#1a1410", flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        height: 22, background: "#1a1410",
        overflow: "hidden", display: "flex", alignItems: "center",
      }}>
        <div className="film-track" style={{ display: "flex", width: "200%", animationDirection: "reverse" }}>
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <div style={{ width: 12, height: 9, background: "#0a0806", border: "1px solid #2e2010", borderRadius: 2, margin: "0 5px", flexShrink: 0 }} />
              <div style={{ width: 32, height: 20, background: i % 3 === 0 ? "#221a10" : "#1a1410", flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%, -52%)",
        fontFamily: "'Playfair Display', serif",
        fontSize: "clamp(200px, 40vw, 360px)",
        fontWeight: 900,
        color: "rgba(26,20,16,.05)",
        lineHeight: 1,
        letterSpacing: -8,
        userSelect: "none",
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}>404</div>

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 560, width: "100%" }}>
        <div className="nfa-fade1" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          marginBottom: 20,
        }}>
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#c8a050" strokeWidth="2"/>
            <circle cx="16" cy="16" r="5" fill="none" stroke="#c8a050" strokeWidth="2"/>
            {[0,60,120,180,240,300].map((deg, i) => {
              const r = (deg * Math.PI) / 180;
              return <line key={i} x1={16+6*Math.cos(r)} y1={16+6*Math.sin(r)} x2={16+11*Math.cos(r)} y2={16+11*Math.sin(r)} stroke="#c8a050" strokeWidth="2" strokeLinecap="round"/>;
            })}
          </svg>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: "#b0905a" }}>
            Cineverse · Error
          </span>
        </div>

        <div className="nfa-fade2" style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(96px, 24vw, 160px)",
          fontWeight: 900,
          color: "#1a1410",
          lineHeight: 1,
          letterSpacing: -6,
          marginBottom: 4,
        }}>404</div>

        <div className="nfa-fade2" style={{
          width: 48, height: 2,
          background: "#c8a050",
          margin: "20px auto",
          borderRadius: 1,
        }} />

        <div className="nfa-fade3">
          <h1 style={{ fontSize: "clamp(18px,4vw,22px)", fontWeight: 600, color: "#1a1410", margin: "0 0 10px" }}>
            Scene Not Found
          </h1>
          <p style={{ fontSize: 14, color: "#7a6a4a", lineHeight: 1.75, maxWidth: 380, margin: "0 auto" }}>
            This page was cut from the final edit. The reel you're looking for has gone missing from our archives.
          </p>
        </div>

        <div className="nfa-fade3" style={{
          display: "flex",
          justifyContent: "center",
          gap: "clamp(16px,4vw,40px)",
          margin: "28px 0",
          flexWrap: "wrap",
        }}>
          {[
            { label: "Status",    val: "Reel Missing" },
            { label: "Show Time", val: "–– : ––"      },
            { label: "Seat",      val: "Unknown"      },
            { label: "Ticket No", val: "CVS–0000–404" },
          ].map(({ label, val }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#b0a080", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#3d3020" }}>{val}</div>
            </div>
          ))}
        </div>

        <div className="nfa-fade3" style={{ maxWidth: 300, margin: "0 auto 28px" }}>
          <div style={{ height: 3, background: "#e0d6be", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${countdown * 10}%`,
              background: "linear-gradient(90deg, #c8a050, #e0b860)",
              borderRadius: 2,
              transition: "width 1s linear",
            }} />
          </div>
          <div style={{ fontSize: 11, color: "#b0a080", marginTop: 6 }}>
            Redirecting to homepage in {countdown}s…
          </div>
        </div>

        <div className="nfa-fade4" style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="nfa-btn-p" onClick={() => { stop(); navigate("/"); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Back to homepage
          </button>
          <button className="nfa-btn-s" onClick={() => { stop(); navigate(-1); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Go back
          </button>
        </div>

      </div>
    </div>
  );
}