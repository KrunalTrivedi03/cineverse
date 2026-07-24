import { Film, Twitter, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const NAV = [
  { label: "Movies", to: "/movies" },
  { label: "Cinemas", to: "/cinemas" },
  { label: "Offers", to: "/offers" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const SOCIALS = [
  { Icon: Twitter, href: "#", label: "Twitter" },
  { Icon: Instagram, href: "#", label: "Instagram" },
  { Icon: Youtube, href: "#", label: "YouTube" },
];

export default function Footer() {
  return (
    <footer
      style={{
        fontFamily: "'Outfit', sans-serif",
        background: "#f7f6f4",
      }}
    >
      <div
        style={{
          height: 2,
          background:
            "linear-gradient(90deg, transparent, #f0545c 25%, #f0545c 75%, transparent)",
        }}
      />

      <div className="mx-auto px-6 md:px-16" style={{ maxWidth: 1200 }}>
        <div
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          style={{ padding: "40px 0 28px", borderBottom: "1px solid #e8e5e1" }}
        >
          <Link
            to="/"
            className="flex items-center gap-2.5"
            style={{ textDecoration: "none" }}
          >
            <CineVerseLogo size={26} />
            <span
              style={{
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: "-0.5px",
                color: "#1a1917",
              }}
            >
              Cine<span style={{ color: "#f0545c" }}>Verse</span>
            </span>
          </Link>

          <p
            style={{
              fontSize: 13,
              color: "#9c9890",
              letterSpacing: "0.02em",
              maxWidth: 300,
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            Book tickets, discover showtimes & explore the world of cinema,
            events and plays.
          </p>

          <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
            {SOCIALS.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                style={{
                  width: 33,
                  height: 33,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#fff",
                  border: "1px solid #e2deda",
                  color: "#b0ada8",
                  transition: "all 0.15s ease",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fff0f0";
                  e.currentTarget.style.borderColor = "#f0545c";
                  e.currentTarget.style.color = "#f0545c";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.borderColor = "#e2deda";
                  e.currentTarget.style.color = "#b0ada8";
                }}
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>

        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ padding: "18px 0 22px" }}
        >
          <nav
            style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}
          >
            {NAV.map(({ label, to }, i) => (
              <span
                key={label}
                style={{ display: "flex", alignItems: "center" }}
              >
                <Link
                  to={to}
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#9c9890",
                    textDecoration: "none",
                    padding: "4px 10px",
                    borderRadius: 6,
                    transition: "color 0.15s ease",
                    letterSpacing: "0.01em",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#1a1917")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#9c9890")
                  }
                >
                  {label}
                </Link>
                {i < NAV.length - 1 && (
                  <span
                    style={{
                      color: "#d4d0cb",
                      fontSize: 10,
                      userSelect: "none",
                    }}
                  >
                    /
                  </span>
                )}
              </span>
            ))}
          </nav>

          <p
            style={{
              fontSize: 12,
              color: "#c4c0bb",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
              margin: 0,
            }}
          >
            © {new Date().getFullYear()} CineVerse. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function CineVerseLogo({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="40" cy="40" r="32" fill="#f0545c" />
      <circle
        cx="40"
        cy="40"
        r="32"
        fill="none"
        stroke="#c03040"
        strokeWidth="1"
      />
      <polygon points="33,27 33,53 57,40" fill="#ffffff" />
      <rect
        x="8"
        y="37"
        width="12"
        height="6"
        rx="3"
        fill="#ffffff"
        opacity="0.15"
      />
      <rect
        x="60"
        y="37"
        width="12"
        height="6"
        rx="3"
        fill="#ffffff"
        opacity="0.15"
      />
      <rect
        x="37"
        y="8"
        width="6"
        height="12"
        rx="3"
        fill="#ffffff"
        opacity="0.15"
      />
      <rect
        x="37"
        y="60"
        width="6"
        height="12"
        rx="3"
        fill="#ffffff"
        opacity="0.15"
      />
    </svg>
  );
}
