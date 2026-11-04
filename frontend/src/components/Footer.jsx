import { Twitter, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import nowLogo from "../assets/now-logo-mark.png";

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
        color: "#1a1917",
      }}
    >
      {/* Top accent */}
      <div
        style={{
          height: 2,
          background:
            "linear-gradient(90deg, transparent 0%, #f0545c 18%, #f0545c 82%, transparent 100%)",
        }}
      />

      <div
        className="mx-auto px-6 md:px-16"
        style={{
          maxWidth: 1200,
        }}
      >
        {/* Main footer row */}
        <div
          className="flex flex-col md:flex-row md:items-center justify-between gap-8"
          style={{
            padding: "42px 0 34px",
            borderBottom: "1px solid #e5e2de",
          }}
        >
          {/* Brand */}
          <Link
            to="/"
            aria-label="NOW Home"
            style={{
              width: 220,
              flexShrink: 0,
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <img
              src={nowLogo}
              alt="NOW"
              style={{
                display: "block",
                width: 150,
                height: "auto",
                objectFit: "contain",
              }}
            />

            {/* Tagline SVG - kept as one centered lockup */}
            <svg
              viewBox="0 0 260 40"
              width="260"
              height="40"
              role="img"
              aria-label="Your World of Entertainment"
              style={{
                display: "block",
                marginTop: 6,
                overflow: "visible",
              }}
            >
              <text
                x="130"
                y="21"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="17"
                fontWeight="700"
                fontFamily="'Caveat', 'Segoe Script', cursive"
                letterSpacing="0.2px"
              >
                <tspan fill="#1a1917">Your World of </tspan>
                <tspan fill="#f0545c">Entertainment</tspan>
              </text>

              {/* Underline positioned only beneath Entertainment */}
              <path
                d="M140 31 C164 34, 200 34, 236 30"
                fill="none"
                stroke="#f0545c"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </Link>

          {/* Description */}
          <div
            style={{
              maxWidth: 330,
              flex: "1 1 auto",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 13,
                lineHeight: 1.7,
                color: "#918d87",
                letterSpacing: "0.01em",
              }}
            >
              Book tickets, discover showtimes & explore the world of cinema,
              events and plays.
            </p>
          </div>

          {/* Socials */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            {SOCIALS.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#ffffff",
                  border: "1px solid #e1ddd8",
                  color: "#9e9a94",
                  transition:
                    "background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fff0f0";
                  e.currentTarget.style.borderColor = "#f0545c";
                  e.currentTarget.style.color = "#f0545c";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderColor = "#e1ddd8";
                  e.currentTarget.style.color = "#9e9a94";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Icon size={15} strokeWidth={1.8} />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{
            padding: "20px 0 24px",
          }}
        >
          {/* Navigation */}
          <nav
            aria-label="Footer navigation"
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              rowGap: 6,
            }}
          >
            {NAV.map(({ label, to }, i) => (
              <span
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Link
                  to={to}
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#89857f",
                    textDecoration: "none",
                    padding: "4px 9px",
                    borderRadius: 6,
                    transition: "color 0.15s ease",
                    letterSpacing: "0.01em",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#1a1917";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#89857f";
                  }}
                >
                  {label}
                </Link>

                {i < NAV.length - 1 && (
                  <span
                    aria-hidden="true"
                    style={{
                      color: "#d2cec9",
                      fontSize: 11,
                      userSelect: "none",
                    }}
                  >
                    /
                  </span>
                )}
              </span>
            ))}
          </nav>

          {/* Copyright */}
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "#b4b0aa",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
            }}
          >
            © {new Date().getFullYear()} NOW. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}