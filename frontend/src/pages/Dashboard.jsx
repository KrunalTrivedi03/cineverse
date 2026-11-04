import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";
import PageBackgroundWatermark from "../components/PageBackgroundWatermark";
import {
  Film,
  Bookmark,
  Calendar,
  Dumbbell,
  Settings,
  ChevronRight,
  MapPin,
  CreditCard,
  Sparkles,
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
    <div className="min-h-screen bg-[#f8f9fa] text-neutral-900 flex flex-col justify-between relative">
      <PageBackgroundWatermark variant="settings" />

      <div className="relative z-10">
        <Navbar />
        <BottomNav />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-32 md:pb-16">
          {/* ── Welcome Card in Light Warm Blush Theme ── */}
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#fff4f5] via-[#fff1f3] to-[#fef6f2] border border-rose-100/90 text-neutral-900 mb-8 shadow-[0_10px_30px_rgba(255,77,88,0.06)]">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-black bg-gradient-to-tr from-[#ff4d58] to-[#ff757e] shadow-xs flex-shrink-0">
                  {(user?.username?.[0] || "U").toUpperCase()}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
                      {user?.username ? `Welcome, ${user.username}` : "Welcome to NOW"}
                    </h1>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#fff0f2] text-[#ff4d58] uppercase">
                      Member
                    </span>
                  </div>
                  <p className="text-neutral-500 text-xs sm:text-sm mt-0.5">
                    {user?.email || "Manage your bookings, watchlist, and personalized entertainment."}
                  </p>
                </div>
              </div>

              <div>
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white hover:bg-neutral-50 border border-neutral-200/80 text-neutral-800 text-xs font-bold shadow-2xs transition-all"
                >
                  <Settings size={14} className="text-[#ff4d58]" />
                  <span>Account Settings</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Watchlist
                </span>
                <Bookmark size={16} className="text-[#ff4d58]" />
              </div>
              <p className="text-2xl font-black text-neutral-900 leading-none">
                {watchlistCount}
              </p>
              <p className="text-xs text-neutral-400 mt-1">Saved titles</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  City
                </span>
                <MapPin size={16} className="text-[#ff4d58]" />
              </div>
              <p className="text-xl font-black text-neutral-900 leading-tight truncate">
                {city}
              </p>
              <p className="text-xs text-neutral-400 mt-1">Active screening region</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Live Passes
                </span>
                <Calendar size={16} className="text-neutral-700" />
              </div>
              <p className="text-xl font-black text-neutral-900 leading-tight">
                Concerts
              </p>
              <p className="text-xs text-neutral-400 mt-1">Events and experiences</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Turfs
                </span>
                <Dumbbell size={16} className="text-neutral-700" />
              </div>
              <p className="text-xl font-black text-neutral-900 leading-tight">
                Play Arenas
              </p>
              <p className="text-xs text-neutral-400 mt-1">Instant slot booking</p>
            </div>
          </div>

          {/* Quick Hub Portals */}
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight mb-4">
            Quick Portals
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
            {/* Movies card */}
            <div
              onClick={() => navigate("/now-showing")}
              className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs hover:shadow-md hover:border-[#ff4d58]/30 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#ff4d58] flex items-center justify-center mb-3">
                <Film size={20} />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 group-hover:text-[#ff4d58] transition-colors flex items-center justify-between">
                <span>Browse Movies</span>
                <ChevronRight size={15} className="text-neutral-400 group-hover:text-[#ff4d58] transition-colors" />
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Explore in-cinema releases, IMAX showtimes, and OTT streaming titles.
              </p>
            </div>

            {/* Watchlist card */}
            <div
              onClick={() => navigate("/watchlist")}
              className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs hover:shadow-md hover:border-[#ff4d58]/30 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center mb-3">
                <Bookmark size={20} />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 group-hover:text-[#ff4d58] transition-colors flex items-center justify-between">
                <span>My Watchlist</span>
                <ChevronRight size={15} className="text-neutral-400 group-hover:text-[#ff4d58] transition-colors" />
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Review your saved titles, mark finished movies, and organize favorites.
              </p>
            </div>

            {/* Live Events card */}
            <div
              onClick={() => navigate("/my-event-bookings")}
              className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs hover:shadow-md hover:border-[#ff4d58]/30 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center mb-3">
                <Calendar size={20} />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 group-hover:text-[#ff4d58] transition-colors flex items-center justify-between">
                <span>Event Bookings</span>
                <ChevronRight size={15} className="text-neutral-400 group-hover:text-[#ff4d58] transition-colors" />
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                View your confirmed concert passes, comedy show tickets and entry QR codes.
              </p>
            </div>

            {/* Play Bookings card */}
            <div
              onClick={() => navigate("/play/my-bookings")}
              className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs hover:shadow-md hover:border-[#ff4d58]/30 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center mb-3">
                <Dumbbell size={20} />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 group-hover:text-[#ff4d58] transition-colors flex items-center justify-between">
                <span>Play Bookings</span>
                <ChevronRight size={15} className="text-neutral-400 group-hover:text-[#ff4d58] transition-colors" />
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Check your reserved turf courts, badminton slots, and venue directions.
              </p>
            </div>

            {/* Transactions card */}
            <div
              onClick={() => navigate("/transactions")}
              className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs hover:shadow-md hover:border-[#ff4d58]/30 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center mb-3">
                <CreditCard size={20} />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 group-hover:text-[#ff4d58] transition-colors flex items-center justify-between">
                <span>Order History</span>
                <ChevronRight size={15} className="text-neutral-400 group-hover:text-[#ff4d58] transition-colors" />
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Download invoice receipts, track payment statuses, and review bookings.
              </p>
            </div>

            {/* Settings card */}
            <div
              onClick={() => navigate("/settings")}
              className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs hover:shadow-md hover:border-[#ff4d58]/30 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center mb-3">
                <Settings size={20} />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 group-hover:text-[#ff4d58] transition-colors flex items-center justify-between">
                <span>Account Preferences</span>
                <ChevronRight size={15} className="text-neutral-400 group-hover:text-[#ff4d58] transition-colors" />
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
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
