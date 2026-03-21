import { useEffect, useState } from "react";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  Edit,
  Trash2,
  Lock,
  Search,
  Users as UsersIcon,
  ShieldCheck,
  ShieldX,
  UserCheck,
  SlidersHorizontal,
  CalendarDays,
} from "lucide-react";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
};

/* Initials avatar */
function Avatar({ name }) {
  const initials = name ? name.slice(0, 2).toUpperCase() : "??";
  const colors = [
    ["rgba(99,102,241,0.12)", "#6366f1"],
    ["rgba(240,84,92,0.12)",  "#f0545c"],
    ["rgba(16,185,129,0.12)", "#10b981"],
    ["rgba(245,158,11,0.12)", "#f59e0b"],
    ["rgba(139,92,246,0.12)", "#8b5cf6"],
  ];
  const [bg, text] = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
      style={{ background: bg, color: text }}
    >
      {initials}
    </div>
  );
}

/* Reusable action button */
const COLOR_MAP = {
  green: { bg: "#f0fdf4", text: "#16a34a", hover: "#dcfce7" },
  blue:  { bg: "#eff6ff", text: "#2563eb", hover: "#dbeafe" },
  red:   { bg: "#fff1f2", text: "#dc2626", hover: "#fee2e2" },
};
function ActionBtn({ onClick, color, title, children }) {
  const c = COLOR_MAP[color];
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

export default function Users() {
  const [users, setUsers]     = useState([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy]   = useState("newest");
  const [filter, setFilter]   = useState("all");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axiosAdmin.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users
    .filter((u) => {
      const matchSearch = u.username?.toLowerCase().includes(search.toLowerCase()) ||
                          u.email?.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all"
        ? true
        : filter === "banned"
        ? u.status === "banned"
        : u.status !== "banned";
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === "name")   return (a.username || "").localeCompare(b.username || "");
      return 0;
    });

  const total   = users.length;
  const active  = users.filter((u) => u.status !== "banned").length;
  const banned  = users.filter((u) => u.status === "banned").length;
  const premium = users.filter((u) => u.plan && u.plan !== "Free").length;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-8" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

        {/* ── Header ──────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Users</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Manage registered members</p>
          </div>
        </div>

        {/* ── Stat cards ──────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Users",   value: total,   icon: UsersIcon,  color: "#6366f1", bg: "rgba(99,102,241,0.08)"  },
            { label: "Active",        value: active,  icon: UserCheck,  color: "#10b981", bg: "rgba(16,185,129,0.08)"  },
            { label: "Banned",        value: banned,  icon: ShieldX,    color: "#f0545c", bg: "rgba(240,84,92,0.08)"   },
            { label: "Premium",       value: premium, icon: ShieldCheck,color: "#f59e0b", bg: "rgba(245,158,11,0.08)"  },
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
          {/* Search */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex-1 min-w-0">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name or email..."
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

          {/* Filter pills */}
          <div className="flex items-center gap-1.5">
            {["all", "active", "banned"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-[12px] font-semibold px-3 py-2 rounded-xl border transition-all capitalize"
                style={
                  filter === f
                    ? { background: "rgba(240,84,92,0.08)", color: "#f0545c", borderColor: "rgba(240,84,92,0.25)" }
                    : { background: "white", color: "#6b7280", borderColor: "#e5e7eb" }
                }
              >
                {f}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-600">
            <SlidersHorizontal size={14} className="text-gray-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="outline-none bg-transparent text-[13px] text-gray-700 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">A → Z</option>
            </select>
          </div>
        </div>

        {/* ── Table ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["#", "User", "Plan", "Comments", "Reviews", "Status", "Joined", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="py-3 px-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-4 px-4"><div className="h-4 w-5 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                        <div>
                          <div className="h-3.5 w-28 bg-gray-100 rounded animate-pulse mb-1.5" />
                          <div className="h-3 w-40 bg-gray-50 rounded animate-pulse" />
                        </div>
                      </div>
                    </td>
                    {[1,2,3,4,5,6].map((j) => (
                      <td key={j} className="py-4 px-4"><div className="h-4 w-12 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <UsersIcon size={32} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-[14px] font-semibold text-gray-400">No users found</p>
                    <p className="text-[12px] text-gray-300 mt-0.5">
                      {search ? `No results for "${search}"` : "No users registered yet"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((u, index) => (
                  <tr
                    key={u._id}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                  >
                    {/* Index */}
                    <td className="py-4 px-4 text-[13px] text-gray-400 font-medium w-8">
                      {index + 1}
                    </td>

                    {/* User info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.username} />
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 truncate max-w-[140px] capitalize">
                            {u.username}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate max-w-[160px] mt-0.5">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="py-4 px-4">
                      <span
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                        style={
                          u.plan && u.plan !== "Free"
                            ? { background: "rgba(245,158,11,0.08)", color: "#f59e0b", borderColor: "rgba(245,158,11,0.2)" }
                            : { background: "#f9fafb", color: "#9ca3af", borderColor: "#e5e7eb" }
                        }
                      >
                        {u.plan || "Free"}
                      </span>
                    </td>

                    {/* Comments */}
                    <td className="py-4 px-4 text-[13px] text-gray-600 font-medium">
                      {u.comments ?? 0}
                    </td>

                    {/* Reviews */}
                    <td className="py-4 px-4 text-[13px] text-gray-600 font-medium">
                      {u.reviews ?? 0}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      {u.status === "banned" ? (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-500 border border-red-100">
                          Banned
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                          Active
                        </span>
                      )}
                    </td>

                    {/* Joined date */}
                    <td className="py-4 px-4">
                      <span className="text-[12px] text-gray-400 flex items-center gap-1 whitespace-nowrap">
                        <CalendarDays size={11} className="flex-shrink-0" />
                        {formatDate(u.createdAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <ActionBtn color="green" title="Lock/Unlock">
                          <Lock size={15} />
                        </ActionBtn>
                        <ActionBtn color="blue" title="Edit">
                          <Edit size={15} />
                        </ActionBtn>
                        <ActionBtn color="red" title="Delete">
                          <Trash2 size={15} />
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50">
              <p className="text-[12px] text-gray-400">
                Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of{" "}
                <span className="font-semibold text-gray-600">{users.length}</span> users
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
