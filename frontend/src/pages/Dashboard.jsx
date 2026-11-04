import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";
import {
  Film, Bookmark, Calendar, Dumbbell,
  Settings, ChevronRight, MapPin,
  CreditCard,
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
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col justify-between">
      <div>
        <Navbar />
        <BottomNav />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          
          {/* Welcome Card */}
          <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-[#0c0d12] text-white mb-8 border border-white/10 shadow-lg">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-white text-xl sm:text-2xl font-bold bg-[#f0545c] shadow-md flex-shrink-0">
                  {(user?.username?.[0] || "U").toUpperCase()}
                </div>

                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    {user?.username ? `Welcome, ${user.username}` : "Welcome to NOW"}
                  </h1>
                  <p className="text-neutral-400 text-xs sm:text-sm mt-0.5">
                    {user?.email || "Manage your bookings, watchlist, and personalized entertainment."}
                  </p>
                </div>
              </div>

              <div>
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold backdrop-blur-md transition-colors"
                >
                  <Settings size={14} />
                  <span>Account Settings</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-neutral-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">Watchlist</span>
                <Bookmark size={16} className="text-[#f0545c]" />
              </div>
              <p className="text-2xl font-bold text-neutral-900 leading-none">{watchlistCount}</p>
              <p className="text-xs text-neutral-400 mt-1">Saved titles</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-neutral-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">City</span>
                <MapPin size={16} className="text-[#f0545c]" />
              </div>
              <p className="text-xl font-bold text-neutral-900 leading-tight truncate">{city}</p>
              <p className="text-xs text-neutral-400 mt-1">Active screening region</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-neutral-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">Live Passes</span>
                <Calendar size={16} className="text-neutral-700" />
              </div>
              <p className="text-xl font-bold text-neutral-900 leading-tight">Concerts</p>
              <p className="text-xs text-neutral-400 mt-1">Events and experiences</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-neutral-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">Turfs</span>
                <Dumbbell size={16} className="text-neutral-700" />
              </div>
              <p className="text-xl font-bold text-neutral-900 leading-tight">Play Arenas</p>
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
              className="bg-white rounded-xl p-5 border border-neutral-200/80 shadow-2xs hover:border-neutral-300 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-red-50 text-[#f0545c] flex items-center justify-center mb-3">
                <Film size={20} />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-[#f0545c] transition-colors flex items-center justify-between">
                <span>Browse Movies</span>
                <ChevronRight size={15} className="text-neutral-400 group-hover:text-[#f0545c] transition-colors" />
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Explore in-cinema releases, IMAX showtimes, and OTT streaming titles.
              </p>
            </div>

            {/* Watchlist card */}
            <div
              onClick={() => navigate("/watchlist")}
              className="bg-white rounded-xl p-5 border border-neutral-200/80 shadow-2xs hover:border-neutral-300 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center mb-3">
                <Bookmark size={20} />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-[#f0545c] transition-colors flex items-center justify-between">
                <span>My Watchlist</span>
                <ChevronRight size={15} className="text-neutral-400 group-hover:text-[#f0545c] transition-colors" />
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Review your saved titles, mark finished movies, and organize favorites.
              </p>
            </div>

            {/* Live Events card */}
            <div
              onClick={() => navigate("/my-event-bookings")}
              className="bg-white rounded-xl p-5 border border-neutral-200/80 shadow-2xs hover:border-neutral-300 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center mb-3">
                <Calendar size={20} />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-[#f0545c] transition-colors flex items-center justify-between">
                <span>Event Bookings</span>
                <ChevronRight size={15} className="text-neutral-400 group-hover:text-[#f0545c] transition-colors" />
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                View your confirmed concert passes, comedy show tickets and entry QR codes.
              </p>
            </div>

            {/* Play Bookings card */}
            <div
              onClick={() => navigate("/play/my-bookings")}
              className="bg-white rounded-xl p-5 border border-neutral-200/80 shadow-2xs hover:border-neutral-300 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center mb-3">
                <Dumbbell size={20} />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-[#f0545c] transition-colors flex items-center justify-between">
                <span>Play Bookings</span>
                <ChevronRight size={15} className="text-neutral-400 group-hover:text-[#f0545c] transition-colors" />
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Check your reserved turf courts, badminton slots, and venue directions.
              </p>
            </div>

            {/* Transactions card */}
            <div
              onClick={() => navigate("/transactions")}
              className="bg-white rounded-xl p-5 border border-neutral-200/80 shadow-2xs hover:border-neutral-300 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center mb-3">
                <CreditCard size={20} />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-[#f0545c] transition-colors flex items-center justify-between">
                <span>Order History</span>
                <ChevronRight size={15} className="text-neutral-400 group-hover:text-[#f0545c] transition-colors" />
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Download invoice receipts, track payment statuses, and review bookings.
              </p>
            </div>

            {/* Settings card */}
            <div
              onClick={() => navigate("/settings")}
              className="bg-white rounded-xl p-5 border border-neutral-200/80 shadow-2xs hover:border-neutral-300 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center mb-3">
                <Settings size={20} />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-[#f0545c] transition-colors flex items-center justify-between">
                <span>Account Preferences</span>
                <ChevronRight size={15} className="text-neutral-400 group-hover:text-[#f0545c] transition-colors" />
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
