import { useLocation, useNavigate } from "react-router-dom";
import { Film, Bookmark, CalendarDays, PlayCircle, Tv } from "lucide-react";

const ACCENT = "#f0545c";

const ITEMS = [
  { key: "movies", label: "Movies", icon: Film, to: "/", match: ["/", "/now-showing", "/coming-soon", "/movie"] },
  { key: "shows", label: "Shows", icon: Tv, to: "/web-shows", match: ["/web-shows"] },
  { key: "watchlist", label: "Watchlist", icon: Bookmark, to: "/watchlist", match: ["/watchlist"] },
  { key: "events", label: "Events", icon: CalendarDays, to: "/events", match: ["/events", "/event"] },
  { key: "play", label: "Play", icon: PlayCircle, to: "/play", match: ["/play"] },
];

// Height + bottom offset the floating pill occupies on mobile — used to
// reserve space at the bottom of every page (see the injected <style> below)
// so content never sits behind it, without editing each page individually.
const NAV_CLEARANCE_PX = 80;

function isPathActive(pathname, matchList) {
  return matchList.some((p) => (p === "/" ? pathname === "/" : pathname.startsWith(p)));
}

/**
 * Floating bottom navigation — 5 primary destinations only. Profile/account
 * access lives in the top Navbar on mobile (see Navbar.jsx), so this bar
 * stays focused on content browsing. Render once, near the root layout
 * (e.g. alongside <Navbar />). Hidden at the `lg` breakpoint and above.
 *
 * Also injects a small global stylesheet that reserves `NAV_CLEARANCE_PX`
 * of bottom padding on <body> under the `lg` breakpoint, so every page
 * automatically clears the floating bar — no per-page padding needed.
 */
export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("accessToken");
  const items = ITEMS.filter((item) => item.key !== "watchlist" || isAuthenticated);

  return (
    <>
      {/* Global clearance so page content never sits behind the bar. */}
      <style>{`
        @media (max-width: 1023px) {
          body { padding-bottom: ${NAV_CLEARANCE_PX}px; }
        }
      `}</style>

      {/* White fade scrim: masks whatever section color/background is
          scrolling underneath, so nothing shows through around the pill. */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 lg:hidden pointer-events-none"
        style={{
          height: 130,
          background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 45%, #ffffff 75%)",
        }}
      />

      <nav
        className="fixed left-0 right-0 z-40 lg:hidden flex justify-center"
        style={{ bottom: "calc(14px + env(safe-area-inset-bottom))" }}
      >
        <div
          className="flex items-center gap-0.5 rounded-full border border-gray-100 px-3 py-1"
          style={{
            background: "#ffffff",
            boxShadow: "0 10px 28px -6px rgba(17,17,17,0.16), 0 2px 6px rgba(17,17,17,0.05)",
          }}
        >
          {items.map((item) => {
            const active = isPathActive(pathname, item.match);

            return (
              <button
                key={item.key}
                onClick={() => navigate(item.to)}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 rounded-full group"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <span
                  className="relative flex items-center justify-center rounded-full transition-all duration-200 ease-out group-active:scale-90"
                  style={{
                    width: 32,
                    height: 24,
                    background: active ? "rgba(240,84,92,0.12)" : "transparent",
                  }}
                >
                  <item.icon
                    size={17}
                    strokeWidth={active ? 2.3 : 1.8}
                    style={{ color: active ? ACCENT : "#9ca3af" }}
                    className="transition-colors duration-200"
                  />
                </span>

                <span
                  className="text-[9.5px] font-semibold leading-none transition-colors duration-200 whitespace-nowrap"
                  style={{ color: active ? ACCENT : "#9ca3af" }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}