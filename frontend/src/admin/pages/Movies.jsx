import { useState, useEffect } from "react";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  Search,
  Edit,
  Trash2,
  Lock,
  Film,
  Plus,
  Eye,
  Star,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const IMG = (path) => !path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;

const isReleased = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr) <= new Date();
};

export default function Movies() {
  const navigate = useNavigate();
  const [movies, setMovies]   = useState([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy]   = useState("newest");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await axiosAdmin.get("/admin/movies");
      setMovies(res.data);
    } catch (err) {
      console.error("Fetch movies failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMovies(); }, []);

  const filtered = movies
    .filter((m) => m.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === "title")  return a.title.localeCompare(b.title);
      return 0;
    });

  const handleDelete = async () => {
  if (!deleteTarget) return;
  try {
    await axiosAdmin.delete(`/admin/movies/${deleteTarget.id}`); // ✅ fixed path
    setDeleteTarget(null);
    fetchMovies();
  } catch (err) {
    console.error("Delete failed", err);
    alert("Failed to delete movie");
  }
};

  const released  = movies.filter((m) => isReleased(m.releaseDate) === true).length;
  const upcoming  = movies.filter((m) => isReleased(m.releaseDate) === false).length;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-8" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Movies</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">
              Manage your movie catalogue
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/movies/add")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all active:scale-[0.98] self-start sm:self-auto"
            style={{ background: "#f0545c" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#d94048")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f0545c")}
          >
            <Plus size={15} /> Add Movie
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Movies",   value: movies.length,  color: "#6366f1", bg: "rgba(99,102,241,0.08)"  },
            { label: "In Cinemas",     value: released,        color: "#10b981", bg: "rgba(16,185,129,0.08)" },
            { label: "Upcoming",       value: upcoming,        color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
            { label: "Avg Rating",
              value: movies.length
                ? (movies.reduce((s, m) => s + (parseFloat(m.rating) || 0), 0) / movies.length).toFixed(1)
                : "—",
              color: "#f0545c", bg: "rgba(240,84,92,0.08)" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                {s.label}
              </p>
              <p className="text-[26px] font-bold" style={{ color: s.color }}>{s.value}</p>
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
              placeholder="Search movies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-[13px] text-gray-900 outline-none bg-transparent placeholder-gray-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-gray-300 hover:text-gray-500 text-[11px] font-medium flex-shrink-0"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-600 cursor-pointer hover:border-gray-300 transition-colors">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="outline-none bg-transparent text-[13px] text-gray-700 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating">Top Rated</option>
              <option value="title">A → Z</option>
            </select>
          </div>
        </div>

        {/* ── Table ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["#", "Movie", "Genre", "Rating", "Status", "Actions"].map((h) => (
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
                /* Skeleton rows */
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-4 px-4"><div className="h-4 w-6 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-14 bg-gray-100 rounded-lg animate-pulse flex-shrink-0" />
                        <div>
                          <div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse mb-1.5" />
                          <div className="h-3 w-48 bg-gray-50 rounded animate-pulse" />
                        </div>
                      </div>
                    </td>
                    {[1,2,3,4].map((j) => (
                      <td key={j} className="py-4 px-4"><div className="h-4 w-16 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Film size={32} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-[14px] font-semibold text-gray-400">No movies found</p>
                    <p className="text-[12px] text-gray-300 mt-0.5">
                      {search ? `No results for "${search}"` : "Add your first movie to get started"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((movie, index) => {
                  const rel = isReleased(movie.releaseDate);
                  return (
                    <tr
                      key={movie._id}
                      className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors group"
                    >
                      {/* Index */}
                      <td className="py-4 px-4 text-[13px] text-gray-400 font-medium w-10">
                        {index + 1}
                      </td>

                      {/* Movie info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-[52px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                            {movie.poster ? (
                              <img
                                src={IMG(movie.poster)}
                                alt={movie.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Film size={16} className="text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 truncate max-w-[180px]">
                              {movie.title}
                            </p>
                            <p className="text-[12px] text-gray-400 truncate max-w-[220px] mt-0.5">
                              {movie.description?.slice(0, 60) || "No description"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Genre */}
                      <td className="py-4 px-4">
                        {movie.genre ? (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 whitespace-nowrap">
                            {movie.genre}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-[13px]">—</span>
                        )}
                      </td>

                      {/* Rating */}
                      <td className="py-4 px-4">
                        {movie.rating != null ? (
                          <span className="flex items-center gap-1 text-[13px] font-semibold text-amber-500">
                            <Star size={12} fill="currentColor" />
                            {movie.rating}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-[13px]">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {rel === null ? (
                          <span className="text-gray-300 text-[13px]">—</span>
                        ) : rel ? (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            In Cinemas
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-500 border border-orange-100">
                            Upcoming
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <ActionBtn
                            onClick={() => navigate(`/admin/movies/view/${movie._id}`)}
                            color="sky"
                            title="View"
                          >
                            <Eye size={15} />
                          </ActionBtn>
                          <ActionBtn
                            onClick={() => navigate(`/admin/movies/edit/${movie._id}`)}
                            color="blue"
                            title="Edit"
                          >
                            <Edit size={15} />
                          </ActionBtn>
                          <ActionBtn color="green" title="Lock">
                            <Lock size={15} />
                          </ActionBtn>
                          <ActionBtn
                            onClick={() => setDeleteTarget({ id: movie._id, title: movie.title })}
                            color="red"
                            title="Delete"
                          >
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

          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
              <p className="text-[12px] text-gray-400">
                Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of{" "}
                <span className="font-semibold text-gray-600">{movies.length}</span> movies
              </p>
            </div>
          )}
        </div>
        {deleteTarget && (
  <div style={{
    position: "fixed", inset: 0, zIndex: 50,
    background: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center"
  }}>
    <div style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--border-radius-lg)",
      padding: "2rem", width: 360, textAlign: "center"
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: "50%",
        background: "rgba(220,38,38,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 1.25rem"
      }}>
        <Trash2 size={24} color="#dc2626" />
      </div>
      <p style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)", margin: "0 0 0.5rem" }}>
        Delete movie?
      </p>
      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 1.75rem", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--color-text-primary)" }}>{deleteTarget.title}</strong> will be permanently removed. This cannot be undone.
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => setDeleteTarget(null)}
          style={{
            flex: 1, padding: "0.6rem",
            borderRadius: "var(--border-radius-md)",
            border: "0.5px solid var(--color-border-secondary)",
            background: "transparent", color: "var(--color-text-secondary)",
            fontSize: 13, cursor: "pointer"
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          style={{
            flex: 1, padding: "0.6rem",
            borderRadius: "var(--border-radius-md)",
            border: "none", background: "#dc2626",
            color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer"
          }}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </AdminLayout>
  );
}

/* ─── Action button ───────────────────────────────────── */
const COLOR_MAP = {
  sky:   { bg: "#f0f9ff", text: "#0284c7", hover: "#e0f2fe" },
  blue:  { bg: "#eff6ff", text: "#2563eb", hover: "#dbeafe" },
  green: { bg: "#f0fdf4", text: "#16a34a", hover: "#dcfce7" },
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


