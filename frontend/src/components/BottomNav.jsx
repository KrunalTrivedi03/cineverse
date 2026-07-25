import { useLocation, useNavigate } from "react-router-dom";
import { Film, Bookmark, CalendarDays, PlayCircle } from "lucide-react";

const ACCENT = "#f0545c";

const ITEMS = [
  { key: "movies", label: "Movies", icon: Film, to: "/", match: ["/", "/now-showing", "/coming-soon", "/movie"] },
  { key: "watchlist", label: "Watchlist", icon: Bookmark, to: "/watchlist", match: ["/watchlist"] },
  { key: "events", label: "Events", icon: CalendarDays, to: "/events", match: ["/events", "/event"] },
  { key: "play", label: "Play", icon: PlayCircle, to: "/play", match: ["/play"] },
];

// Height + bottom offset the floating pill occupies on mobile — used to
// reserve space at the bottom of every page (see the injected <style> below)
// so content never sits behind it, without editing each page individually.
const NAV_CLEARANCE_PX = 92;

function isPathActive(pathname, matchList) {
  return matchList.some((p) => (p === "/" ? pathname === "/" : pathname.startsWith(p)));
}

/**
 * Floating bottom navigation — 4 primary destinations only. Profile/account
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

  return (
    <>
      {/* Global clearance so page content never sits behind the bar. */}
      <style>{`
        @media (max-width: 1023px) {
          body { padding-bottom: ${NAV_CLEARANCE_PX}px; }
        }
      `}</style>

      <nav
        className="fixed left-0 right-0 z-40 lg:hidden flex justify-center"
        style={{ bottom: "calc(14px + env(safe-area-inset-bottom))" }}
      >
        <div
          className="flex items-stretch gap-0.5 bg-white/90 rounded-full border border-gray-100 px-2 py-1.5"
          style={{
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 12px 32px -8px rgba(17,17,17,0.18), 0 2px 8px rgba(17,17,17,0.06)",
          }}
        >
          {ITEMS.map((item) => {
            const active = isPathActive(pathname, item.match);

            return (
              <button
                key={item.key}
                onClick={() => navigate(item.to)}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center justify-center gap-0.5 px-3.5 py-1.5 rounded-full group"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <span
                  className="relative flex items-center justify-center rounded-full transition-all duration-200 ease-out group-active:scale-90"
                  style={{
                    width: 36,
                    height: 28,
                    background: active ? "rgba(240,84,92,0.12)" : "transparent",
                  }}
                >
                  <item.icon
                    size={18}
                    strokeWidth={active ? 2.3 : 1.8}
                    style={{ color: active ? ACCENT : "#9ca3af" }}
                    className="transition-colors duration-200"
                  />
                </span>

                <span
                  className="text-[10px] font-semibold leading-none transition-colors duration-200 whitespace-nowrap"
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