import { useEffect, useState } from "react";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  ShieldCheck,
  Edit,
  Trash2,
  Search,
  Plus,
  KeyRound,
  SlidersHorizontal,
} from "lucide-react";

/* Role icon color — cycles by index */
const ROLE_COLORS = [
  { bg: "rgba(99,102,241,0.1)",  text: "#6366f1" },
  { bg: "rgba(240,84,92,0.1)",   text: "#f0545c" },
  { bg: "rgba(16,185,129,0.1)",  text: "#10b981" },
  { bg: "rgba(245,158,11,0.1)",  text: "#f59e0b" },
  { bg: "rgba(139,92,246,0.1)",  text: "#8b5cf6" },
];

/* Action button */
const BTN = {
  blue: { bg: "#eff6ff", text: "#2563eb", hover: "#dbeafe" },
  red:  { bg: "#fff1f2", text: "#dc2626", hover: "#fee2e2" },
};
function ActionBtn({ color, title, onClick, children }) {
  const c = BTN[color];
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
      style={{ background: c.bg, color: c.text }}
      onMouseEnter={(e) => (e.currentTarget.style.background = c.hover)}
      onMouseLeave={(e) => (e.currentTarget.style.background = c.bg)}
    >
      {children}
    </button>
  );
}

export default function Roles() {
  const [roles, setRoles]     = useState([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy]   = useState("name");

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await axiosAdmin.get("/roles");
      setRoles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const filtered = roles
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name")        return a.name.localeCompare(b.name);
      if (sortBy === "permissions") return (b.permissions?.length || 0) - (a.permissions?.length || 0);
      return 0;
    });

  const totalPermissions = roles.reduce((s, r) => s + (r.permissions?.length || 0), 0);
  const maxPerms = Math.max(...roles.map((r) => r.permissions?.length || 0), 1);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-8" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

        {/* ── Header ──────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Roles</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Manage access control roles</p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all active:scale-[0.98] self-start sm:self-auto"
            style={{ background: "#f0545c" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#d94048")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f0545c")}
          >
            <Plus size={15} /> Add Role
          </button>
        </div>

        {/* ── Stat cards ──────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {[
            { label: "Total Roles",        value: roles.length,    icon: ShieldCheck, color: "#6366f1", bg: "rgba(99,102,241,0.08)"  },
            { label: "Total Permissions",  value: totalPermissions, icon: KeyRound,   color: "#f59e0b", bg: "rgba(245,158,11,0.08)"  },
            { label: "Avg Permissions",
              value: roles.length ? (totalPermissions / roles.length).toFixed(1) : "—",
              icon: ShieldCheck, color: "#10b981", bg: "rgba(16,185,129,0.08)" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                  <Icon size={15} style={{ color }} />
                </div>
              </div>
              <p className="text-[28px] font-bold text-gray-900 leading-none">{loading ? "—" : value}</p>
            </div>
          ))}
        </div>

        {/* ── Toolbar ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex-1 min-w-0">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-[13px] text-gray-900 outline-none bg-transparent placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500 text-[11px] font-medium">
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
            <SlidersHorizontal size={14} className="text-gray-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="outline-none bg-transparent text-[13px] text-gray-700 cursor-pointer"
            >
              <option value="name">A → Z</option>
              <option value="permissions">Most Permissions</option>
            </select>
          </div>
        </div>

        {/* ── Cards grid ──────────────────────────────── */}
        {!loading && filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {filtered.map((role, index) => {
              const clr = ROLE_COLORS[index % ROLE_COLORS.length];
              const permCount = role.permissions?.length || 0;
              const pct = Math.round((permCount / maxPerms) * 100);
              return (
                <div
                  key={role._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: clr.bg }}
                      >
                        <ShieldCheck size={20} style={{ color: clr.text }} />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-gray-900 capitalize">{role.name}</p>
                        <p className="text-[12px] text-gray-400 mt-0.5">
                          {permCount} permission{permCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <ActionBtn color="blue" title="Edit"><Edit size={14} /></ActionBtn>
                      <ActionBtn color="red" title="Delete"><Trash2 size={14} /></ActionBtn>
                    </div>
                  </div>

                  {/* Permission progress bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Coverage</span>
                      <span className="text-[11px] font-bold" style={{ color: clr.text }}>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: clr.text }}
                      />
                    </div>
                  </div>

                  {/* Permission pills — show first 4 + overflow count */}
                  {role.permissions?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.slice(0, 4).map((p, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                          style={{ background: clr.bg, color: clr.text }}
                        >
                          {typeof p === "string" ? p : p.name || p}
                        </span>
                      ))}
                      {role.permissions.length > 4 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          +{role.permissions.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : !loading ? (
          /* Empty state */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
            <ShieldCheck size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-[14px] font-semibold text-gray-400">No roles found</p>
            <p className="text-[12px] text-gray-300 mt-0.5">
              {search ? `No results for "${search}"` : "Create your first role to get started"}
            </p>
          </div>
        ) : (
          /* Skeleton grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
                  <div>
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-1.5" />
                    <div className="h-3 w-16 bg-gray-50 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full animate-pulse" />
                <div className="flex gap-1.5">
                  {[1,2,3].map((j) => <div key={j} className="h-5 w-14 bg-gray-100 rounded-full animate-pulse" />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <p className="text-[12px] text-gray-400 mt-2">
            Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of{" "}
            <span className="font-semibold text-gray-600">{roles.length}</span> roles
          </p>
        )}
      </div>
    </AdminLayout>
  );
}