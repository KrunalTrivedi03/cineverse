import { Link, useLocation, useNavigationType } from "react-router-dom";
import { Clapperboard, Bookmark, Ticket, Dumbbell, TvMinimalPlay } from "lucide-react";

const ITEMS = [
  { label: "Movies", icon: Clapperboard, to: "/", paths: ["/", "/now-showing", "/coming-soon", "/movie"] },
  { label: "Shows", icon: TvMinimalPlay, to: "/web-shows", paths: ["/web-shows"] },
  { label: "Events", icon: Ticket, to: "/events", paths: ["/events", "/event"] },
  { label: "Play", icon: Dumbbell, to: "/play", paths: ["/play"] },
  { label: "Watchlist", icon: Bookmark, to: "/watchlist", paths: ["/watchlist"], requiresAuth: true },
];

export default function BottomNav() {
  const { pathname, state } = useLocation();
  const navigationType = useNavigationType();
  const isAuthenticated = !!localStorage.getItem("accessToken");
  const items = isAuthenticated ? ITEMS : ITEMS.filter((item) => !item.requiresAuth);
  const activeIndex = items.findIndex(({ paths }) =>
    paths.some((path) => pathname === path || (path !== "/" && pathname.startsWith(path + "/")))
  );

  const fromIndex = navigationType !== "POP" && state?.bottomNavCount === items.length && Number.isInteger(state.bottomNavFrom)
    ? state.bottomNavFrom : activeIndex;

  return (
    <nav aria-label="Quick navigation" className="now-mobile-nav fixed inset-x-0 mx-auto z-40 flex lg:hidden">
      {activeIndex >= 0 && (
        <span className="now-mobile-nav-track" aria-hidden="true" style={{ "--nav-count": items.length, "--nav-index": activeIndex }}>
          <span key={pathname} className="now-mobile-nav-indicator"
            data-slide={fromIndex !== activeIndex || undefined} style={{ "--nav-from": fromIndex }} />
        </span>
      )}
      {items.map(({ label, icon, to }, index) => {
        const Icon = icon;
        return (
          <Link key={to} to={to} aria-current={index === activeIndex ? "page" : undefined}
            state={{ bottomNavFrom: activeIndex >= 0 ? activeIndex : index, bottomNavCount: items.length }}>
            <span className="now-mobile-nav-icon"><Icon size={20} aria-hidden="true" /></span>
            <span className="now-mobile-nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
