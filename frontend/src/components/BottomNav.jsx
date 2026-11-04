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

const NAV_CLEARANCE_PX = 86;

function isPathActive(pathname, matchList) {
  return matchList.some((p) => (p === "/" ? pathname === "/" : pathname.startsWith(p)));
}

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("accessToken");
  const items = ITEMS.filter((item) => item.key !== "watchlist" || isAuthenticated);

  return (
    <>
      <style>{`
        @media (max-width: 1023px) {
          body { padding-bottom: ${NAV_CLEARANCE_PX}px; }
        }
      `}</style>

      {/* Modern gradient ambient backdrop blur mask */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 lg:hidden pointer-events-none"
        style={{
          height: 110,
          background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0.95) 100%)",
        }}
      />

      <nav
        className="fixed left-0 right-0 z-40 lg:hidden flex justify-center px-4"
        style={{ bottom: "calc(16px + env(safe-area-inset-bottom))" }}
      >
        <div
          className="flex items-center gap-1 rounded-full border border-gray-200/80 px-3 py-1.5 backdrop-blur-2xl bg-white/90 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.16),0_2px_10px_rgba(0,0,0,0.06)]"
        >
          {items.map((item) => {
            const active = isPathActive(pathname, item.match);

            return (
              <button
                key={item.key}
                onClick={() => navigate(item.to)}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-full group transition-transform active:scale-90"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <span
                  className="relative flex items-center justify-center rounded-full transition-all duration-300"
                  style={{
                    width: 38,
                    height: 28,
                    background: active ? "rgba(240,84,92,0.12)" : "transparent",
                  }}
                >
                  <item.icon
                    size={18}
                    strokeWidth={active ? 2.4 : 1.9}
                    style={{ color: active ? ACCENT : "#6b7280" }}
                    className="transition-all duration-200"
                  />
                  {active && (
                    <span
                      className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-[#f0545c]"
                      style={{ boxShadow: "0 0 6px #f0545c" }}
                    />
                  )}
                </span>

                <span
                  className="text-[10px] font-bold leading-none transition-colors duration-200 tracking-tight"
                  style={{ color: active ? ACCENT : "#6b7280" }}
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
