import DeleteDialog from "../../components/DeleteDialog";
import { showToast } from "../../utils/toast";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  Search, Edit, Trash2, PartyPopper, Plus, Star,
  SlidersHorizontal, Armchair, Users2,
} from "lucide-react";

const IMG = (path) => !path ? null : path.startsWith("http") ? path : `https://res.cloudinary.com/duhc0vvqz/image/upload${path}`;

const STATUS_CLS = {
  upcoming:  "bg-orange-50 text-orange-500 border-orange-100",
  live:      "bg-emerald-50 text-emerald-600 border-emerald-100",
  completed: "bg-gray-50 text-gray-500 border-gray-200",
  cancelled: "bg-red-50 text-red-500 border-red-100",
};

const COLOR_MAP = {
  blue: { bg: "#eff6ff", text: "#2563eb", hover: "#dbeafe" },
  red:  { bg: "#fff1f2", text: "#dc2626", hover: "#fee2e2" },
};

function ActionBtn({ onClick, color, title, children }) {
  const c = COLOR_MAP[color];
  return (
    <button onClick={onClick} title={title}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
      style={{ background: c.bg, color: c.text }}
      onMouseEnter={(e) => (e.currentTarget.style.background = c.hover)}
      onMouseLeave={(e) => (e.currentTarget.style.background = c.bg)}>
      {children}
    </button>
  );
}

export default function AdminEvents() {
  const navigate = useNavigate();
  const [events, setEvents]   = useState([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy]   = useState("newest");
  const [filterCategory, setFilterCategory] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await axiosAdmin.get("/admin/events");
      setEvents(res.data);
    } catch (err) {
      console.error("Fetch events failed", err);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchEvents(); }, []);

  const categories = [...new Set(events.map((e) => e.category))];

  const filtered = events
    .filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))
    .filter((e) => !filterCategory || e.category === filterCategory)
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === "rating") return (b.ratings?.average ?? 0) - (a.ratings?.average ?? 0);
      if (sortBy === "title")  return a.title.localeCompare(b.title);
      return 0;
    });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosAdmin.delete(`/admin/events/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchEvents();
    } catch (err) {
      console.error("Delete failed", err);
      showToast.error("Failed to delete event");
    } finally { setDeleting(false); }
  };

  const live     = events.filter((e) => e.status === "live").length;
  const upcoming = events.filter((e) => e.status === "upcoming").length;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-8" style={{ fontFamily: "var(--now-ui-font)" }}>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Events</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Manage your event catalogue</p>
          </div>
          <button
            onClick={() => navigate("/admin/events/add")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all active:scale-[0.98] self-start sm:self-auto"
            style={{ background: "#106579" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#125467")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#106579")}>
            <Plus size={15} /> Add Event
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Events", value: events.length, color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
            { label: "Live Now",     value: live,           color: "#10b981", bg: "rgba(16,185,129,0.08)" },
            { label: "Upcoming",     value: upcoming,        color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
            { label: "Avg Rating",
              value: events.length ? (events.reduce((s, e) => s + (e.ratings?.average || 0), 0) / events.length).toFixed(1) : "—",
              color: "#106579", bg: "rgba(16,101,121,0.08)" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-[26px] font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex-1 min-w-0">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input type="text" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-[13px] text-gray-900 outline-none bg-transparent placeholder-gray-400" />
            {search && <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500 text-[11px] font-medium flex-shrink-0">Clear</button>}
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-600">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="outline-none bg-transparent text-[13px] text-gray-700 cursor-pointer">
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-600">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="outline-none bg-transparent text-[13px] text-gray-700 cursor-pointer">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating">Top Rated</option>
              <option value="title">A → Z</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["#", "Event", "Category", "Type", "Rating", "Status", "Actions"].map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-4 px-4"><div className="h-4 w-6 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="flex items-center gap-3"><div className="w-11 h-14 bg-gray-100 rounded-lg animate-pulse flex-shrink-0" /><div><div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse mb-1.5" /><div className="h-3 w-48 bg-gray-50 rounded animate-pulse" /></div></div></td>
                    {[1, 2, 3, 4].map((j) => <td key={j} className="py-4 px-4"><div className="h-4 w-16 bg-gray-100 rounded animate-pulse" /></td>)}
                    <td className="py-4 px-4"><div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(16,101,121,0.08)" }}>
                      <PartyPopper size={22} style={{ color: "#106579" }} />
                    </div>
                    <p className="text-[14px] font-semibold text-gray-400">No events found</p>
                    <p className="text-[12px] text-gray-300 mt-0.5">{search ? `No results for "${search}"` : "Add your first event to get started"}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((event, index) => (
                  <tr key={event._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-4 text-[13px] text-gray-400 font-medium w-10">{index + 1}</td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-[52px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                          {event.poster ? <img src={IMG(event.poster)} alt={event.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><PartyPopper size={16} className="text-gray-300" /></div>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 truncate max-w-[180px]">{event.title}</p>
                          <p className="text-[12px] text-gray-400 truncate max-w-[220px] mt-0.5">{event.artists?.map((a) => a.name).join(", ") || "No artists listed"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 whitespace-nowrap">{event.category}</span>
                    </td>

                    <td className="py-4 px-4">
                      {event.bookingType === "seated" ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit" style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed" }}><Armchair size={10} /> Seated</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit" style={{ background: "rgba(245,158,11,0.08)", color: "#d97706" }}><Users2 size={10} /> General</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {event.ratings?.count > 0 ? (
                        <span className="flex items-center gap-1 text-[13px] font-semibold text-amber-500"><Star size={12} fill="currentColor" />{event.ratings.average.toFixed(1)}</span>
                      ) : <span className="text-gray-300 text-[13px]">—</span>}
                    </td>

                    <td className="py-4 px-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_CLS[event.status] || STATUS_CLS.upcoming}`}>
                        {event.status?.charAt(0).toUpperCase() + event.status?.slice(1)}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <ActionBtn onClick={() => navigate(`/admin/events/edit/${event._id}`)} color="blue" title="Edit"><Edit size={15} /></ActionBtn>
                        <ActionBtn onClick={() => setDeleteTarget({ id: event._id, title: event.title })} color="red" title="Delete"><Trash2 size={15} /></ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
              <p className="text-[12px] text-gray-400">
                Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of{" "}
                <span className="font-semibold text-gray-600">{events.length}</span> events
              </p>
            </div>
          )}
        </div>
      </div>

      {deleteTarget && (
        <DeleteDialog title="Delete event?" onCancel={() => setDeleteTarget(null)} onDelete={handleDelete} busy={deleting}>
          <p><strong>{deleteTarget.title}</strong> and all its schedules will be permanently removed. This action cannot be undone.</p>
        </DeleteDialog>
      )}
    </AdminLayout>
  );
}