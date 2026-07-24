import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
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
  Landmark
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
  { name: "Users",       icon: Users,           path: "/admin/users"       },
  { name: "Roles",       icon: ShieldCheck,     path: "/admin/roles"       },
  { name: "Permissions", icon: KeyRound,        path: "/admin/permissions" },
];

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  let userInfo = {};
  try {
    const stored = localStorage.getItem("adminInfo");
    if (stored && stored !== "undefined") userInfo = JSON.parse(stored);
  } catch { userInfo = {}; }

  const initials = userInfo.username
    ? userInfo.username.slice(0, 2).toUpperCase()
    : "AD";

  const [openGroups, setOpenGroups] = useState(["Booking Management"]);

  const toggleGroup = (name) =>
    setOpenGroups((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    navigate("/admin/login");
  };

  return (
    <aside
      className="w-[240px] h-screen fixed left-0 top-0 flex flex-col bg-white border-r border-gray-100"
      style={{ fontFamily: "'Outfit', sans-serif", boxShadow: "1px 0 0 #f3f4f6" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="px-5 py-5 border-b border-gray-100">
        <Link to="/admin/dashboard" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "#f0545c" }}
          >
            <Film size={16} color="white" />
          </div>
          <div>
            <span className="text-[17px] font-extrabold tracking-tight text-gray-900">
              Cine<span style={{ color: "#f0545c" }}>Verse</span>
            </span>
            <p className="text-[10px] text-gray-400 font-medium -mt-0.5 tracking-wide">
              ADMIN PANEL
            </p>
          </div>
        </Link>
      </div>

      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0"
            style={{ background: "#f0545c" }}
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

      <nav className="flex-1 overflow-y-auto px-3 py-4">
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
                    onClick={() => toggleGroup(item.name)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150"
                    style={{
                      background: anyChildActive ? "rgba(240,84,92,0.08)" : "transparent",
                      color: anyChildActive ? "#f0545c" : "#4b5563",
                    }}
                    onMouseEnter={(e) => {
                      if (!anyChildActive) e.currentTarget.style.background = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      if (!anyChildActive) e.currentTarget.style.background =
                        anyChildActive ? "rgba(240,84,92,0.08)" : "transparent";
                    }}
                  >
                    <Icon
                      size={16}
                      style={{ color: anyChildActive ? "#f0545c" : "#9ca3af" }}
                      className="flex-shrink-0"
                    />
                    <span className="flex-1 text-left">{item.name}</span>
                    <ChevronRight
                      size={13}
                      style={{
                        color: anyChildActive ? "#f0545c" : "#9ca3af",
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
                            to={path}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-[12.5px] font-medium transition-all duration-150"
                            style={{
                              background: active ? "rgba(240,84,92,0.08)" : "transparent",
                              color: active ? "#f0545c" : "#6b7280",
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
                              style={{ color: active ? "#f0545c" : "#9ca3af" }}
                              className="flex-shrink-0"
                            />
                            <span className="flex-1">{name}</span>
                            {active && (
                              <ChevronRight size={12} style={{ color: "#f0545c" }} />
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
                to={path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150"
                style={{
                  background: active ? "rgba(240,84,92,0.08)" : "transparent",
                  color: active ? "#f0545c" : "#4b5563",
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
                    background: active ? "#f0545c" : "transparent",
                    opacity: active ? 1 : 0,
                  }}
                />
                <Icon
                  size={16}
                  style={{ color: active ? "#f0545c" : "#9ca3af" }}
                  className="flex-shrink-0 transition-colors"
                />
                <span className="flex-1">{name}</span>
                {active && (
                  <ChevronRight size={13} style={{ color: "#f0545c" }} className="flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
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
          © CineVerse 2025
        </p>
      </div>
    </aside>
  );
}


