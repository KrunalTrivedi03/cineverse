import { useEffect, useState } from "react";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  KeyRound,
  Edit,
  Trash2,
  Search,
  SlidersHorizontal,
  ShieldCheck,
  Eye,
  PenLine,
  ShieldAlert,
  Plus,
  CalendarDays,
} from "lucide-react";

/* ── helpers ──────────────────────────────────────────── */
const inferScope = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("delete") || n.includes("manage") || n.includes("admin") || n.includes("settings"))
    return "admin";
  if (n.includes("write") || n.includes("create") || n.includes("update") || n.includes("upload"))
    return "write";
  return "read";
};

const SCOPE_CONFIG = {
  read: {
    label: "Read",
    icon: Eye,
    bg: "rgba(16,185,129,0.08)",
    color: "#059669",
    border: "rgba(16,185,129,0.2)",
  },
  write: {
    label: "Write",
    icon: PenLine,
    bg: "rgba(245,158,11,0.08)",
    color: "#b45309",
    border: "rgba(245,158,11,0.2)",
  },
  admin: {
    label: "Admin",
    icon: ShieldAlert,
    bg: "rgba(16,101,121,0.08)",
    color: "#dc2626",
    border: "rgba(16,101,121,0.2)",
  },
};

/* ── sub-components ───────────────────────────────────── */
const COLOR_MAP = {
  blue: { bg: "#eff6ff", text: "#2563eb", hover: "#dbeafe" },
  red:  { bg: "#fff1f2", text: "#dc2626", hover: "#fee2e2" },
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

function ScopeBadge({ scope }) {
  const cfg = SCOPE_CONFIG[scope] || SCOPE_CONFIG.read;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

/* ── main component ───────────────────────────────────── */
export default function Permissions() {
  const [permissions, setPermissions] = useState([]);
  const [search, setSearch]           = useState("");
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState("all");
  const [sortBy, setSortBy]           = useState("az");

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const res = await axiosAdmin.get("/permissions");
      setPermissions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPermissions(); }, []);

  /* derived stats */
  const total      = permissions.length;
  const readCount  = permissions.filter((p) => inferScope(p.name) === "read").length;
  const writeCount = permissions.filter((p) => inferScope(p.name) === "write").length;
  const adminCount = permissions.filter((p) => inferScope(p.name) === "admin").length;

  /* filtered + sorted list */
  const filtered = permissions
    .filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const scope       = inferScope(p.name);
      const matchFilter = filter === "all" || scope === filter;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sortBy === "az")  return a.name.localeCompare(b.name);
      if (sortBy === "za")  return b.name.localeCompare(a.name);
      return 0;
    });

  const FILTER_PILLS = ["all", "read", "write", "admin"];

  return (
    <AdminLayout>
      <div
        className="min-h-screen bg-gray-50 p-6 md:p-8"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

        {/* ── Header ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Permissions</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Manage access controls & capabilities</p>
          </div>

          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
            style={{
              background: "rgba(16,101,121,0.09)",
              color: "#106579",
              border: "1px solid rgba(16,101,121,0.25)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(16,101,121,0.16)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(16,101,121,0.09)")}
          >
            <Plus size={15} />
            New Permission
          </button>
        </div>

        {/* ── Stat Cards ─────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total",   value: total,      icon: KeyRound,    color: "#6366f1", bg: "rgba(99,102,241,0.08)"  },
            { label: "Read",    value: readCount,  icon: Eye,         color: "#10b981", bg: "rgba(16,185,129,0.08)"  },
            { label: "Write",   value: writeCount, icon: PenLine,     color: "#f59e0b", bg: "rgba(245,158,11,0.08)"  },
            { label: "Admin",   value: adminCount, icon: ShieldCheck, color: "#106579", bg: "rgba(16,101,121,0.08)"   },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest">
                  {label}
                </p>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: bg }}
                >
                  <Icon size={15} style={{ color }} />
                </div>
              </div>
              <p className="text-[28px] font-bold text-gray-900 leading-none">
                {loading ? "—" : value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Toolbar ────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          {/* Search */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex-1 min-w-0">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search permission..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-[13px] text-gray-900 outline-none bg-transparent placeholder-gray-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-gray-300 hover:text-gray-500 text-[11px] font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5">
            {FILTER_PILLS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-[12px] font-semibold px-3 py-2 rounded-xl border transition-all capitalize"
                style={
                  filter === f
                    ? {
                        background: "rgba(16,101,121,0.08)",
                        color: "#106579",
                        borderColor: "rgba(16,101,121,0.25)",
                      }
                    : { background: "white", color: "#6b7280", borderColor: "#e4e4e7" }
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
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
            </select>
          </div>
        </div>

        {/* ── Table ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["#", "Permission", "Scope", "Actions"].map((h) => (
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
                    <td className="py-4 px-4">
                      <div className="h-4 w-5 bg-gray-100 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
                        <div className="h-3.5 w-40 bg-gray-100 rounded animate-pulse" />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <KeyRound size={32} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-[14px] font-semibold text-gray-400">No permissions found</p>
                    <p className="text-[12px] text-gray-300 mt-0.5">
                      {search
                        ? `No results for "${search}"`
                        : "No permissions created yet"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((p, index) => {
                  const scope = inferScope(p.name);
                  const [resource, action] = p.name.split(":");

                  return (
                    <tr
                      key={p._id}
                      className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                    >
                      {/* Index */}
                      <td className="py-4 px-4 text-[13px] text-gray-400 font-medium w-8">
                        {index + 1}
                      </td>

                      {/* Permission name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: "rgba(16,101,121,0.08)" }}
                          >
                            <KeyRound size={16} style={{ color: "#106579" }} />
                          </div>
                          <span className="text-[13px] font-semibold text-gray-900 font-mono tracking-tight">
                            {resource}
                            {action && (
                              <>
                                <span className="text-gray-400 font-sans">:</span>
                                {action}
                              </>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Scope badge */}
                      <td className="py-4 px-4">
                        <ScopeBadge scope={scope} />
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <ActionBtn color="blue" title="Edit">
                            <Edit size={15} />
                          </ActionBtn>
                          <ActionBtn color="red" title="Delete">
                            <Trash2 size={15} />
                          </ActionBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50">
              <p className="text-[12px] text-gray-400">
                Showing{" "}
                <span className="font-semibold text-gray-600">{filtered.length}</span> of{" "}
                <span className="font-semibold text-gray-600">{permissions.length}</span>{" "}
                permissions
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


