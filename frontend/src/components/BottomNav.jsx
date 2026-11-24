import { Link, useLocation } from "react-router-dom";
import { Film, Bookmark, CalendarDays, PlayCircle, Tv } from "lucide-react";

const ITEMS = [
  { label: "Movies", icon: Film, to: "/", paths: ["/", "/now-showing", "/coming-soon", "/movie"] },
  { label: "Shows", icon: Tv, to: "/web-shows", paths: ["/web-shows"] },
  { label: "Events", icon: CalendarDays, to: "/events", paths: ["/events", "/event"] },
  { label: "Play", icon: PlayCircle, to: "/play", paths: ["/play"] },
  { label: "Watchlist", icon: Bookmark, to: "/watchlist", paths: ["/watchlist"], requiresAuth: true },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const isAuthenticated = !!localStorage.getItem("accessToken");

  return (
    <nav aria-label="Quick navigation" className="now-mobile-nav fixed inset-x-0 mx-auto z-40 flex lg:hidden">
      {ITEMS.filter((item) => !item.requiresAuth || isAuthenticated).map(({ label, icon, to, paths }) => {
        const Icon = icon;
        const active = paths.some((path) => pathname === path || (path !== "/" && pathname.startsWith(path + "/")));
        return (
          <Link key={to} to={to} aria-current={active ? "page" : undefined}>
            <span className="now-mobile-nav-icon"><Icon size={19} aria-hidden="true" /></span>
            <span className="now-mobile-nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
