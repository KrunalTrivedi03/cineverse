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
import ExploreEvents from "./pages/ExploreEvents";
import EventDetail from "./pages/EventDetail";
import CategoryEvents from "./pages/CategoryEvents";
import DistrictEvents from "./pages/DistrictEvents";
import ArtistDetail from "./pages/ArtistDetail";
import BookEventTickets from "./pages/BookEventTickets";
import EventSeatSelection from "./pages/EventSeatSelection";
import TicketQuantitySelection from "./pages/TicketQuantitySelection";
import EventBookingSuccess from "./pages/EventBookingSuccess";
import MyEventBookings from "./pages/MyEventBookings";
import OAuthSuccess from "./pages/OAuthSuccess";
import Play from "./pages/Play";
import TransactionHistory from "./pages/TransactionHistory";
import Aboutus from "./pages/Aboutus";
import ContactUs from "./pages/Contactus";
import Offers from "./pages/Offers";
import BookingReview from "./pages/BookingReview";

export default function App() {
  return (
    <>
      <Routes>

        <Route path="*" element={<NotFound />} />

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />

        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        <Route path="/verify-otp" element={<OtpVerification />} />

        <Route path="/movie/:id" element={<MovieDetail />} />

        <Route path="/now-showing" element={<NowShowing />} />
        <Route path="/coming-soon" element={<UpcomingMoviesPage />} />

        <Route path="/about" element={<Aboutus />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/offers" element={<Offers />} />

        <Route path="/events" element={<ExploreEvents />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/category/:category" element={<CategoryEvents />} />
        <Route path="/events/district/:districtId" element={<DistrictEvents />} />
        <Route path="/artists/:id" element={<ArtistDetail />} />

        <Route path="/events/:id/book" element={<BookEventTickets />} />
        <Route path="/events/:id/schedule/:scheduleId/slot/:slotId/seats" element={<EventSeatSelection />} />
        <Route path="/events/:id/schedule/:scheduleId/slot/:slotId/tickets" element={<TicketQuantitySelection />} />
        <Route path="/booking/event-success" element={<EventBookingSuccess />} />

        <Route path="/play" element={<Play />} />

        <Route
          path="/my-event-bookings"
          element={
            <ProtectedRoute>
              <MyEventBookings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <TransactionHistory />
            </ProtectedRoute>
          }
        />

        <Route path="/movie/:id/book" element={<BookTickets />} />

        <Route path="/movie/:id/seats" element={<SeatSelection />} />
        <Route path="/booking/review" element={<BookingReview />} />
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