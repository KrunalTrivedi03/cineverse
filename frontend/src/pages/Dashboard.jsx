import { Link } from "react-router-dom";
import { ArrowUpRight, Bookmark, CalendarDays, Film, Settings } from "lucide-react";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import { getCurrentUser } from "../utils/authSession";

const DESTINATIONS = [
  { title: "Browse movies", description: "Find movies now showing in cinemas.", to: "/now-showing", icon: Film },
  { title: "Your watchlist", description: "Find and manage movies you’ve saved.", to: "/watchlist", icon: Bookmark },
  { title: "Event bookings", description: "View your booked events and tickets.", to: "/my-event-bookings", icon: CalendarDays },
  { title: "Account settings", description: "Manage your profile, security, and payment methods.", to: "/settings", icon: Settings },
];

export default function Dashboard() {
  const user = getCurrentUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <BottomNav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="now-hero-blank relative isolate overflow-hidden rounded-2xl text-gray-900">
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-500">Your account</p>
            <h1 className="text-3xl font-bold break-words sm:text-5xl">Welcome back{user ? `, ${user.username}` : ""}</h1>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
          {DESTINATIONS.map(({ title, description, to, icon }) => {
            const Icon = icon;
            return (
              <Link key={to} to={to} className="group flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8fbfc] text-now-accent"><Icon size={19} /></span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold">{title}</h2>
                  <p className="mt-1 text-sm text-gray-500">{description}</p>
                </div>
                <ArrowUpRight size={17} className="mt-1 shrink-0 text-gray-500 group-hover:text-now-accent" />
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
