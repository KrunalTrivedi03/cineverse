import { useState, useEffect } from "react";
import axiosAdmin from "../../api/axiosAdmin";
import AdminLayout from "../layout/AdminLayout";
import {
  Search, Calendar, Building2, User, IndianRupee, Loader2, Dumbbell,
} from "lucide-react";

const STATUS_STYLES = {
  confirmed: { bg: "rgba(16,185,129,0.08)", text: "#059669" },
  cancelled: { bg: "rgba(156,163,175,0.12)", text: "#6b7280" },
  pending:   { bg: "rgba(245,158,11,0.08)",  text: "#d97706" },
  expired:   { bg: "rgba(156,163,175,0.12)", text: "#6b7280" },
};

const fmtDate = (d) => !d ? "" : new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function AdminPlayBookings() {
  const [bookings, setBookings] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [venueFilter, setVenueFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const fetchAll = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (venueFilter) params.set("venue", venueFilter);
      if (dateFilter) params.set("date", dateFilter);

      const [b, v] = await Promise.all([
        axiosAdmin.get(`/play-slots/bookings/admin?${params.toString()}`),
        axiosAdmin.get("/play/venues/admin"),
      ]);
      setBookings(b.data);
      setVenues(v.data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [statusFilter, venueFilter, dateFilter]);

  const filtered = bookings.filter((b) =>
    !search ||
    b.bookingRef?.toLowerCase().includes(search.toLowerCase()) ||
    b.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
    b.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    revenue: bookings.filter((b) => b.status === "confirmed").reduce((sum, b) => sum + (b.pricing?.total || 0), 0),
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-8" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

        <div className="mb-8">
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Play Bookings</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">All sports/activity bookings across venues</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {[
            { label: "Total Bookings", value: stats.total, color: "#6366f1" },
            { label: "Confirmed", value: stats.confirmed, color: "#10b981" },
            { label: "Revenue", value: `₹${stats.revenue.toLocaleString("en-IN")}`, color: "#106579" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-[24px] font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex-1 min-w-0">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input type="text" placeholder="Search by ref, name, or email..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-[13px] text-gray-900 outline-none bg-transparent placeholder-gray-400" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 bg-white cursor-pointer">
            <option value="">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
          <select value={venueFilter} onChange={(e) => setVenueFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 bg-white cursor-pointer">
            <option value="">All Venues</option>
            {venues.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
          </select>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 bg-white" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["Booking Ref", "User", "Activity / Venue", "Date", "Amount", "Status"].map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center"><Loader2 size={20} className="animate-spin text-gray-300 mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(16,101,121,0.08)" }}>
                      <Dumbbell size={22} style={{ color: "#106579" }} />
                    </div>
                    <p className="text-[14px] font-semibold text-gray-400">No bookings found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const st = STATUS_STYLES[b.status] || STATUS_STYLES.pending;
                  return (
                    <tr key={b._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-[12px] font-mono text-gray-600">{b.bookingRef}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99,102,241,0.08)" }}>
                            <User size={13} style={{ color: "#6366f1" }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-semibold text-gray-800 truncate max-w-[140px]">{b.user?.username || "—"}</p>
                            <p className="text-[10.5px] text-gray-400 truncate max-w-[140px]">{b.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-[12.5px] font-semibold text-gray-800">{b.activityName}</p>
                        <p className="text-[10.5px] text-gray-400 flex items-center gap-1"><Building2 size={9} /> {b.venueName} · {b.courtName}</p>
                      </td>
                      <td className="py-3.5 px-4 text-[12.5px] text-gray-600 flex items-center gap-1.5 mt-0.5">
                        <Calendar size={11} className="text-gray-400" /> {fmtDate(b.date)}
                      </td>
                      <td className="py-3.5 px-4 text-[12.5px] font-bold text-gray-800 flex items-center gap-0.5 mt-0.5">
                        <IndianRupee size={11} /> {b.pricing?.total || 0}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide" style={{ background: st.bg, color: st.text }}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}