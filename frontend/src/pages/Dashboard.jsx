import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";
import {
  User, Film, Bookmark, Ticket, Calendar, Dumbbell,
  Settings, Clock, Sparkles, ChevronRight, MapPin,
  TrendingUp, CreditCard,
} from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const savedUser = JSON.parse(localStorage.getItem("userInfo"));
      setUser(savedUser);
    } catch {
      setUser(null);
    }

    try {
      const wl = JSON.parse(localStorage.getItem("watchlist") || "[]");
      setWatchlistCount(wl.length);
    } catch {
      setWatchlistCount(0);
    }
  }, []);

  const city = localStorage.getItem("selectedCity") || "Not selected";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex flex-col justify-between">
      <div>
        <Navbar />
        <BottomNav />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          
          {/* Welcome VIP Card */}
          <div
            className="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-white mb-10 shadow-xl"
            style={{
              background: "linear-gradient(135deg, #111422 0%, #1f2338 60%, #2a2238 100%)",
            }}
          >
            {/* Ambient Coral Glow */}
            <div
              className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full pointer-events-none opacity-25"
              style={{ background: "radial-gradient(circle, #f0545c 0%, transparent 70%)" }}
            />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4 sm:gap-5">
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-white text-[24px] sm:text-[30px] font-black shadow-lg flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #f0545c 0%, #d94048 100%)" }}
                >
                  {(user?.username?.[0] || "U").toUpperCase()}
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-extrabold uppercase tracking-wider mb-2 backdrop-blur-md border border-white/15">
                    <Sparkles size={11} className="text-[#f0545c]" />
                    <span>NOW Premier Member</span>
                  </div>

                  <h1 className="text-[26px] sm:text-[34px] font-black tracking-tight leading-tight">
                    Welcome back{user?.username ? `, ${user.username}` : ""}!
                  </h1>
                  <p className="text-white/60 text-[13px] sm:text-[14px] mt-1">
                    {user?.email || "Manage your bookings, watchlist, and personalized experiences."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[13px] font-bold backdrop-blur-md transition-all active:scale-95"
                >
                  <Settings size={15} />
                  <span>Profile Settings</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-[12px] font-bold uppercase tracking-wider">Watchlist</span>
                <Bookmark size={18} className="text-[#f0545c]" />
              </div>
              <p className="text-[28px] font-black text-gray-900 leading-none">{watchlistCount}</p>
              <p className="text-[12px] text-gray-400 mt-1 font-medium">Saved titles to watch</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-[12px] font-bold uppercase tracking-wider">Current City</span>
                <MapPin size={18} className="text-[#f0545c]" />
              </div>
              <p className="text-[22px] font-black text-gray-900 leading-tight truncate">{city}</p>
              <p className="text-[12px] text-gray-400 mt-1 font-medium">Active screening zone</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-[12px] font-bold uppercase tracking-wider">Experiences</span>
                <Calendar size={18} className="text-purple-500" />
              </div>
              <p className="text-[22px] font-black text-gray-900 leading-tight">Live &amp; Turf</p>
              <p className="text-[12px] text-gray-400 mt-1 font-medium">Concerts &amp; sports slots</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-[12px] font-bold uppercase tracking-wider">Payments</span>
                <CreditCard size={18} className="text-emerald-500" />
              </div>
              <p className="text-[22px] font-black text-gray-900 leading-tight">QuickPay</p>
              <p className="text-[12px] text-gray-400 mt-1 font-medium">Instant ticket checkout</p>
            </div>
          </div>

          {/* Quick Hub Portals */}
          <h2 className="text-[20px] font-black text-gray-900 tracking-tight mb-5">
            Your Entertainment Hub
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Movies card */}
            <div
              onClick={() => navigate("/now-showing")}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs hover:shadow-xl transition-all cursor-pointer group card-hover-lift"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#f0545c]/10 text-[#f0545c] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Film size={22} />
              </div>
              <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-[#f0545c] transition-colors flex items-center justify-between">
                <span>Browse Movies</span>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-[#f0545c] transition-colors" />
              </h3>
              <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
                Explore in-cinema releases, IMAX showtimes, and OTT streaming titles.
              </p>
            </div>

            {/* Watchlist card */}
            <div
              onClick={() => navigate("/watchlist")}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs hover:shadow-xl transition-all cursor-pointer group card-hover-lift"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Bookmark size={22} />
              </div>
              <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-amber-600 transition-colors flex items-center justify-between">
                <span>My Watchlist</span>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-amber-600 transition-colors" />
              </h3>
              <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
                Review your saved movies, mark finished titles, and organize favorites.
              </p>
            </div>

            {/* Live Events card */}
            <div
              onClick={() => navigate("/my-event-bookings")}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs hover:shadow-xl transition-all cursor-pointer group card-hover-lift"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar size={22} />
              </div>
              <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-purple-600 transition-colors flex items-center justify-between">
                <span>Event Bookings</span>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-purple-600 transition-colors" />
              </h3>
              <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
                View your confirmed concert passes, comedy show tickets and QR codes.
              </p>
            </div>

            {/* Play Bookings card */}
            <div
              onClick={() => navigate("/play/my-bookings")}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs hover:shadow-xl transition-all cursor-pointer group card-hover-lift"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Dumbbell size={22} />
              </div>
              <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-emerald-600 transition-colors flex items-center justify-between">
                <span>Play Bookings</span>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-600 transition-colors" />
              </h3>
              <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
                Check your reserved turf courts, badminton slots, and game schedules.
              </p>
            </div>

            {/* Transactions card */}
            <div
              onClick={() => navigate("/transactions")}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs hover:shadow-xl transition-all cursor-pointer group card-hover-lift"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CreditCard size={22} />
              </div>
              <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                <span>Order History</span>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
              </h3>
              <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
                Download invoice receipts, track payment statuses, and review refunds.
              </p>
            </div>

            {/* Settings card */}
            <div
              onClick={() => navigate("/settings")}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs hover:shadow-xl transition-all cursor-pointer group card-hover-lift"
            >
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Settings size={22} />
              </div>
              <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-gray-900 transition-colors flex items-center justify-between">
                <span>Account Preferences</span>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-900 transition-colors" />
              </h3>
              <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
                Update password, manage email notifications, and set default location.
              </p>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
