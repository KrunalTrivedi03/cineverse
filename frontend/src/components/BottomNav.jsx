import { useLocation, useNavigate } from "react-router-dom";
import { Film, Bookmark, CalendarDays, PlayCircle, Tv } from "lucide-react";

const ACCENT = "#f0545c";

const NAV_ITEMS = [
  { key: "movies", label: "Movies", icon: Film, to: "/" },
  { key: "shows", label: "Shows", icon: Tv, to: "/web-shows" },
  { key: "watchlist", label: "Watchlist", icon: Bookmark, to: "/watchlist" },
  { key: "events", label: "Events", icon: CalendarDays, to: "/events" },
  { key: "play", label: "Play", icon: PlayCircle, to: "/play" },
];

/**
 * Pages where BottomNav MUST NEVER be shown because they either:
 *  1. Have their own sticky checkout/booking bars (e.g. MovieDetail, SeatSelection, BookingReview, BookTickets)
 *  2. Are dedicated fullscreen flows (Login, Register, Success, Verify)
 *  3. Cause layout/footer obstruction
 */
const HIDDEN_PREFIXES = [
  "/movie/",
  "/events/",
  "/play/venues/",
  "/play/venues",
  "/web-shows/",
  "/booking",
  "/seats",
  "/login",
  "/register",
  "/oauth-success",
  "/verify-",
  "/about",
  "/contact",
  "/offers",
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("accessToken");

  // Determine if this route should hide the bottom navigation
  const shouldHide =
    HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    pathname.includes("/book") ||
    pathname.includes("/slots") ||
    pathname.includes("/seats");

  if (shouldHide) return null;

  const items = NAV_ITEMS.filter((item) => item.key !== "watchlist" || isAuthenticated);

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex justify-center pointer-events-none pb-3 px-4"
      style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-auto flex items-center justify-around gap-1 w-full max-w-sm rounded-2xl bg-white/95 backdrop-blur-2xl border border-neutral-200/80 p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.12)]">
        {items.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);

          return (
            <button
              key={item.key}
              onClick={() => navigate(item.to)}
              className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 cursor-pointer flex-1 ${
                active
                  ? "text-[#ff4d58] bg-[#fff0f2] shadow-2xs font-bold"
                  : "text-neutral-500 hover:text-neutral-800 font-medium"
              }`}
            >
              <item.icon
                size={18}
                strokeWidth={active ? 2.4 : 1.8}
                className={`transition-transform duration-200 ${active ? "scale-105" : ""}`}
              />
              <span className={`text-[10px] tracking-tight mt-1 transition-all ${
                active ? "font-bold text-[#ff4d58]" : "font-medium text-neutral-500"
              }`}>
                {item.label}
              </span>
              {active && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d58] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
