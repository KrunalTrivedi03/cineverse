import { useState, useEffect } from "react";
import AdminLayout from "../layout/AdminLayout";
import axiosAdmin from "../../api/axiosAdmin";
import {
  Star,
  Film,
  BarChart3,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const IMG = (path) => `${import.meta.env.VITE_API_URL}${path}`;

const isReleased = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr) <= new Date();
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [movies, setMovies]   = useState([]);
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axiosAdmin.get("/admin/movies").catch(() => ({ data: [] })),
      axiosAdmin.get("/admin/users").catch(() => ({ data: [] })),
    ]).then(([movRes, usrRes]) => {
      setMovies(movRes.data || []);
      setUsers(usrRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const released = movies.filter((m) => isReleased(m.releaseDate) === true).length;
  const upcoming = movies.filter((m) => isReleased(m.releaseDate) === false).length;
  const avgRating = movies.length
    ? (movies.reduce((s, m) => s + (parseFloat(m.rating) || 0), 0) / movies.length).toFixed(1)
    : "—";

  const topMovies = [...movies]
    .filter((m) => m.rating)
    .sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
    .slice(0, 5);

  const latestMovies = [...movies]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  const STATS = [
    {
      label: "Total Movies",
      value: movies.length,
      icon: Film,
      color: "#6366f1",
      bg: "rgba(99,102,241,0.08)",
      delta: `+${upcoming} upcoming`,
    },
    {
      label: "In Cinemas",
      value: released,
      icon: BarChart3,
      color: "#10b981",
      bg: "rgba(16,185,129,0.08)",
      delta: "Now showing",
    },
    {
      label: "Total Users",
      value: users.length,
      icon: Users,
      color: "#f0545c",
      bg: "rgba(240,84,92,0.08)",
      delta: "Registered",
    },
    {
      label: "Avg Rating",
      value: avgRating,
      icon: Star,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.08)",
      delta: "Across all movies",
    },
  ];

  return (
    <AdminLayout>
      <div
        className="min-h-screen bg-gray-50 p-6 md:p-8"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">
              Welcome back — here's what's happening
            </p>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-gray-400 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
            <CalendarDays size={13} />
            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {STATS.map(({ label, value, icon: Icon, color, bg, delta }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest">
                  {label}
                </p>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                  <Icon size={15} style={{ color }} />
                </div>
              </div>
              <p className="text-[28px] font-bold text-gray-900 leading-none">{loading ? "—" : value}</p>
              <p className="text-[11px] font-medium flex items-center gap-1" style={{ color }}>
                <TrendingUp size={11} /> {delta}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <TableCard
            title="Top Rated Movies"
            icon={<Star size={15} style={{ color: "#f59e0b" }} />}
            onViewAll={() => navigate("/admin/movies")}
            loading={loading}
          >
            {topMovies.length === 0 && !loading ? (
              <EmptyRow cols={4} message="No rated movies yet" />
            ) : (
              topMovies.map((m, i) => (
                <tr
                  key={m._id}
                  className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/movies/view/${m._id}`)}
                >
                  <td className="py-3 px-4 text-[12px] text-gray-400 font-medium w-8">
                    {i + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                        {m.poster
                          ? <img src={IMG(m.poster)} alt={m.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Film size={12} className="text-gray-300" /></div>
                        }
                      </div>
                      <p className="text-[13px] font-semibold text-gray-900 line-clamp-1 max-w-[130px]">
                        {m.title}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                      {m.genre || "—"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1 text-[13px] font-bold text-amber-500">
                      <Star size={11} fill="currentColor" /> {m.rating}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </TableCard>

          <TableCard
            title="Latest Added"
            icon={<Clock size={15} style={{ color: "#6366f1" }} />}
            onViewAll={() => navigate("/admin/movies")}
            loading={loading}
          >
            {latestMovies.length === 0 && !loading ? (
              <EmptyRow cols={4} message="No movies added yet" />
            ) : (
              latestMovies.map((m, i) => {
                const rel = isReleased(m.releaseDate);
                return (
                  <tr
                    key={m._id}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/movies/view/${m._id}`)}
                  >
                    <td className="py-3 px-4 text-[12px] text-gray-400 font-medium w-8">
                      {i + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                          {m.poster
                            ? <img src={IMG(m.poster)} alt={m.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Film size={12} className="text-gray-300" /></div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 line-clamp-1 max-w-[120px]">
                            {m.title}
                          </p>
                          <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <CalendarDays size={10} /> {formatDate(m.releaseDate)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {m.genre || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {rel === null ? (
                        <span className="text-gray-300 text-[12px]">—</span>
                      ) : rel ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                          In Cinemas
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-100">
                          Upcoming
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </TableCard>
        </div>
      </div>
    </AdminLayout>
  );
}

function TableCard({ title, icon, onViewAll, loading, children }) {
  const HEADERS = ["#", "Movie", "Genre", loading ? "" : "Info"];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
          {icon} {title}
        </h2>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-[12px] font-semibold transition-colors"
          style={{ color: "#f0545c" }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          View All <ArrowRight size={13} />
        </button>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-50">
            {HEADERS.map((h) => (
              <th
                key={h}
                className="py-2.5 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">
                <td className="py-3 px-4"><div className="h-4 w-5 bg-gray-100 rounded animate-pulse" /></td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-10 bg-gray-100 rounded-lg animate-pulse flex-shrink-0" />
                    <div className="h-3.5 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                </td>
                <td className="py-3 px-4"><div className="h-4 w-14 bg-gray-100 rounded animate-pulse" /></td>
                <td className="py-3 px-4"><div className="h-4 w-12 bg-gray-100 rounded animate-pulse" /></td>
              </tr>
            ))
          ) : children}
        </tbody>
      </table>
    </div>
  );
}

function EmptyRow({ cols, message }) {
  return (
    <tr>
      <td colSpan={cols} className="py-10 text-center text-[13px] text-gray-400">
        <Film size={24} className="text-gray-200 mx-auto mb-2" />
        {message}
      </td>
    </tr>
  );
}
