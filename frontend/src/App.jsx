import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Watchlist from "./pages/Watchlist";
import AdminRoutes from "./routes/AdminRoutes";
import VerifyEmail from "./pages/VerifyEmail";
import OtpVerification from "./pages/OtpVerification";
import MovieDetail from "./components/MovieDetail";
import NowShowing from "./components/NowShowing";
import BookTickets from "./components/BookTickets";
import SeatSelection from "./components/SeatSelection";
import UpcomingMoviesPage from "./components/UpcomingMoviesPage";
import BookingSuccess from "./components/BookingSuccess";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <>
      <Routes>

        <Route path="*" element={<NotFound />} />

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        <Route path="/verify-otp" element={<OtpVerification />} />

        <Route path="/movie/:id" element={<MovieDetail />} />

        <Route path="/now-showing" element={<NowShowing />} />
        <Route path="/coming-soon" element={<UpcomingMoviesPage />} />

        <Route path="/movie/:id/book" element={<BookTickets />} />

        <Route path="/movie/:id/seats" element={<SeatSelection />} />
        <Route path="/booking/success" element={<BookingSuccess />} />

        <Route path="/settings" element={<Settings />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/watchlist"
          element={
            <ProtectedRoute>
              <Watchlist />
            </ProtectedRoute>
          }
        />

        {AdminRoutes()}
      </Routes>
    </>
  );
}
