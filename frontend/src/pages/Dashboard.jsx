import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { User, Film, ListTodo } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) return;

    const savedUser = JSON.parse(localStorage.getItem("userInfo"));
    setUser(savedUser);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto mt-16 px-6">
        <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-2">
          <User className="w-10 h-10 text-blue-600" />
          Welcome Back{user ? `, ${user.username}!` : "!"}
        </h1>

        <p className="text-gray-600 mt-2">
          Manage your Watchlist, browse movies, and keep track of what you're watching.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12">

          <div className="bg-white shadow-md hover:shadow-lg transition p-8 rounded-xl cursor-pointer hover:-translate-y-1">
            <Film className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800">Browse Movies</h3>
            <p className="text-gray-600 text-sm mt-2">
              See available movies or add your own (admin).
            </p>
            <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Go to Movies
            </button>
          </div>

          <div className="bg-white shadow-md hover:shadow-lg transition p-8 rounded-xl cursor-pointer hover:-translate-y-1">
            <ListTodo className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800">Your Watchlist</h3>
            <p className="text-gray-600 text-sm mt-2">
              View, update, or remove items from your watchlist.
            </p>
            <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Go to Watchlist
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
