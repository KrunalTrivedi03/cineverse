import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { AdminAuthContext } from "../../context/AdminAuthContext";
import nowLogo from "../../assets/now-logo-mark.png";
import {
  LayoutDashboard,
  Film,
  Users,
  ShieldCheck,
  KeyRound,
  LogOut,
  ChevronRight,
  MapPin,
  Building2,
  Clapperboard,
  Ticket,
  CalendarDays,
  Mic2,
  Landmark,
  Tag,
  Lock,
  Tv,
  Dumbbell,
  Grid3x3,
} from "lucide-react";

const MENU = [
  { name: "Dashboard",   icon: LayoutDashboard, path: "/admin/dashboard"   },
  { name: "Movies",      icon: Film,            path: "/admin/movies"      },
  {
    name: "Movie Management",
    icon: Ticket,
    children: [
      { name: "Cities",   icon: MapPin,       path: "/admin/cities"   },
      { name: "Theatres", icon: Building2,    path: "/admin/theatres" },
      { name: "Shows",    icon: Clapperboard, path: "/admin/shows"    },
      // Seat Layout is accessed from Theatres page (requires theatreId + screenId params)
      // navigate(`/admin/theatres/${theatreId}/screens/${screenId}/layout`)
    ],
  },
  {
    name: "Event Management",
    icon: CalendarDays,
    children: [
      { name: "Events", icon: CalendarDays, path: "/admin/events", },
      { name: "Artists", icon: Mic2, path: "/admin/artists", },
      { name: "Venues", icon: Building2, path: "/admin/venues", },
      { name: "Districts", icon: Landmark, path: "/admin/districts", },
      { name: "Schedule Events", icon: CalendarDays, path: "/admin/schedule-events", },
    ],
  },
  {
    name: "Play Management",
    icon: Dumbbell,
    children: [
      { name: "Activities", icon: Dumbbell, path: "/admin/play/activities" },
      { name: "Venues",     icon: Grid3x3,  path: "/admin/play/venues"     },
      { name: "Bookings",   icon: Ticket,   path: "/admin/play/bookings"   },
      // Court management is accessed from the Venues page (requires venueId)
      // navigate(`/admin/play/venues/${venueId}/courts`)
    ],
  },
  { name: "Offers",      icon: Tag,             path: "/admin/offers"      },
  { name: "Web Shows",   icon: Tv,              path: "/admin/web-shows"   },
  { name: "Users",       icon: Users,           path: "/admin/users"       },
  { name: "Roles",       icon: ShieldCheck,     path: "/admin/roles"       },
  { name: "Permissions", icon: KeyRound,        path: "/admin/permissions" },
];

export default function AdminSidebar({ onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AdminAuthContext);

  let userInfo = {};
  try {
    const stored = localStorage.getItem("adminInfo");
    if (stored && stored !== "undefined") userInfo = JSON.parse(stored);
  } catch { userInfo = {}; }

  const initials = userInfo.username
    ? userInfo.username.slice(0, 2).toUpperCase()
    : "AD";

  const [openGroups, setOpenGroups] = useState(() => MENU.filter((item) => item.children?.some((child) => location.pathname.startsWith(child.path))).map((item) => item.name));

  const toggleGroup = (name) =>
    setOpenGroups((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );

  const handleLogout = () => {
    logout(); // clears adminAccessToken + adminInfo and revokes the server-side session
    onNavigate?.();
    navigate("/admin/login");
  };

  return (
    <aside
      className="admin-sidebar flex flex-col bg-white border-r border-gray-200"
      style={{ fontFamily: "var(--now-ui-font)", boxShadow: "1px 0 0 #f3f4f6" }}
    >
      <div className="px-5 py-4 border-b border-gray-100">
        <Link to="/admin/dashboard" onClick={onNavigate} className="flex flex-col items-center gap-1 max-w-full">
          <img className="now-brand-mark"
            src={nowLogo}
            alt="NOW"
            style={{
              height: 24,
              width: "auto",
              maxWidth: "100%",
              display: "block",
              objectFit: "contain",
            }}
          />
          <p
            style={{
              margin: 0,
              fontFamily: "'Caveat', 'Segoe Script', cursive",
              fontWeight: 700,
              fontSize: 13,
              lineHeight: 1,
              textAlign: "center",
            }}
          >
            <span style={{ color: "#1a1917" }}>Your World of </span>
            <span style={{ color: "#106579" }}>Entertainment</span>
          </p>
          <p className="text-[10px] text-gray-400 font-medium tracking-wide mt-0.5 text-center">
            ADMIN PANEL
          </p>
        </Link>
      </div>

      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0"
            style={{ background: "#106579" }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 capitalize truncate">
              {userInfo.username || "Admin"}
            </p>
            <p className="text-[11px] text-gray-400 truncate">
              {userInfo.email || "Administrator"}
            </p>
          </div>
        </div>
      </div>

      <nav aria-label="Administration" className="flex-1 min-h-0 overflow-y-auto px-3 py-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">
          Main Menu
        </p>

        <div className="flex flex-col gap-0.5">
          {MENU.map((item) => {
            if (item.children) {
              const isOpen = openGroups.includes(item.name);
              const anyChildActive = item.children.some((c) =>
                location.pathname.startsWith(c.path)
              );
              const Icon = item.icon;
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleGroup(item.name)} aria-expanded={isOpen}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150"
                    style={{
                      background: anyChildActive ? "rgba(16,101,121,0.08)" : "transparent",
                      color: anyChildActive ? "#106579" : "#4b5563",
                    }}
                    onMouseEnter={(e) => {
                      if (!anyChildActive) e.currentTarget.style.background = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      if (!anyChildActive) e.currentTarget.style.background =
                        anyChildActive ? "rgba(16,101,121,0.08)" : "transparent";
                    }}
                  >
                    <Icon
                      size={16}
                      style={{ color: anyChildActive ? "#106579" : "#9ca3af" }}
                      className="flex-shrink-0"
                    />
                    <span className="flex-1 text-left">{item.name}</span>
                    <ChevronRight
                      size={13}
                      style={{
                        color: anyChildActive ? "#106579" : "#9ca3af",
                        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div className="ml-3 pl-3 border-l border-gray-100 flex flex-col gap-0.5 mt-0.5 mb-1">
                      {item.children.map(({ name, icon: CIcon, path }) => {
                        const active = location.pathname.startsWith(path);
                        return (
                          <Link
                            key={name}
                            to={path} onClick={onNavigate} aria-current={active ? "page" : undefined}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-[12.5px] font-medium transition-all duration-150"
                            style={{
                              background: active ? "rgba(16,101,121,0.08)" : "transparent",
                              color: active ? "#106579" : "#6b7280",
                            }}
                            onMouseEnter={(e) => {
                              if (!active) e.currentTarget.style.background = "#f9fafb";
                            }}
                            onMouseLeave={(e) => {
                              if (!active) e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <CIcon
                              size={14}
                              style={{ color: active ? "#106579" : "#9ca3af" }}
                              className="flex-shrink-0"
                            />
                            <span className="flex-1">{name}</span>
                            {active && (
                              <ChevronRight size={12} style={{ color: "#106579" }} />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const { name, icon: Icon, path } = item;
            const active = location.pathname.startsWith(path);
            return (
              <Link
                key={name}
                to={path} onClick={onNavigate} aria-current={active ? "page" : undefined}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150"
                style={{
                  background: active ? "rgba(16,101,121,0.08)" : "transparent",
                  color: active ? "#106579" : "#4b5563",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                <span
                  className="absolute left-0 w-0.5 h-5 rounded-r-full transition-all"
                  style={{
                    background: active ? "#106579" : "transparent",
                    opacity: active ? 1 : 0,
                  }}
                />
                <Icon
                  size={16}
                  style={{ color: active ? "#106579" : "#9ca3af" }}
                  className="flex-shrink-0 transition-colors"
                />
                <span className="flex-1">{name}</span>
                {active && (
                  <ChevronRight size={13} style={{ color: "#106579" }} className="flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <Link
          to="/admin/change-password" onClick={onNavigate}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 mb-0.5"
          style={{
            background: location.pathname.startsWith("/admin/change-password") ? "rgba(16,101,121,0.08)" : "transparent",
            color: location.pathname.startsWith("/admin/change-password") ? "#106579" : "#4b5563",
          }}
          onMouseEnter={(e) => {
            if (!location.pathname.startsWith("/admin/change-password")) e.currentTarget.style.background = "#f9fafb";
          }}
          onMouseLeave={(e) => {
            if (!location.pathname.startsWith("/admin/change-password")) e.currentTarget.style.background = "transparent";
          }}
        >
          <Lock size={16} className="flex-shrink-0" style={{ color: location.pathname.startsWith("/admin/change-password") ? "#106579" : "#9ca3af" }} />
          Change Password
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-500 transition-all"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fff1f2";
            e.currentTarget.style.color = "#dc2626";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#6b7280";
          }}
        >
          <LogOut size={16} className="flex-shrink-0 text-gray-400" />
          Logout
        </button>

        <p className="text-[10px] text-gray-300 text-center mt-3 font-medium">
          © NOW 2026
        </p>
      </div>
    </aside>
  );
}