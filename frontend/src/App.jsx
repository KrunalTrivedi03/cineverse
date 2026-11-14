import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoutes from "./routes/AdminRoutes";

// Core initial landing page (direct or lazy)
import Home from "./pages/Home";

// Lazy-load pages to maximize site speed and minimize bundle weight
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Watchlist = lazy(() => import("./pages/Watchlist"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const OtpVerification = lazy(() => import("./pages/OtpVerification"));
const MovieDetail = lazy(() => import("./components/MovieDetail"));
const NowShowing = lazy(() => import("./components/NowShowing"));
const BookTickets = lazy(() => import("./components/BookTickets"));
const SeatSelection = lazy(() => import("./components/SeatSelection"));
const UpcomingMoviesPage = lazy(() => import("./components/UpcomingMoviesPage"));
const BookingSuccess = lazy(() => import("./components/BookingSuccess"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ExploreEvents = lazy(() => import("./pages/ExploreEvents"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const CategoryEvents = lazy(() => import("./pages/CategoryEvents"));
const DistrictEvents = lazy(() => import("./pages/DistrictEvents"));
const ArtistDetail = lazy(() => import("./pages/ArtistDetail"));
const BookEventTickets = lazy(() => import("./pages/BookEventTickets"));
const EventSeatSelection = lazy(() => import("./pages/EventSeatSelection"));
const TicketQuantitySelection = lazy(() => import("./pages/TicketQuantitySelection"));
const EventBookingSuccess = lazy(() => import("./pages/EventBookingSuccess"));
const MyEventBookings = lazy(() => import("./pages/MyEventBookings"));
const OAuthSuccess = lazy(() => import("./pages/OAuthSuccess"));
const Play = lazy(() => import("./pages/Play"));
const PlayVenues = lazy(() => import("./pages/PlayVenues"));
const PlayVenueDetail = lazy(() => import("./pages/PlayVenueDetail"));
const PlaySlotSelection = lazy(() => import("./pages/PlaySlotSelection"));
const PlayBookingSuccess = lazy(() => import("./pages/PlayBookingSuccess"));
const MyPlayBookings = lazy(() => import("./pages/MyPlayBookings"));
const TransactionHistory = lazy(() => import("./pages/TransactionHistory"));
const Aboutus = lazy(() => import("./pages/Aboutus"));
const ContactUs = lazy(() => import("./pages/Contactus"));
const Offers = lazy(() => import("./pages/Offers"));
const BookingReview = lazy(() => import("./pages/BookingReview"));
const WebShowDetails = lazy(() => import("./pages/WebShowDetails"));
const WebShowsListing = lazy(() => import("./pages/WebShowsListing"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#f0545c] animate-spin" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
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

        <Route path="/web-shows" element={<WebShowsListing />} />
        <Route path="/web-shows/trending" element={<WebShowsListing category="trending-series" />} />
        <Route path="/web-shows/web-originals" element={<WebShowsListing category="web-original" />} />
        <Route path="/web-shows/:id" element={<WebShowDetails />} />

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
        <Route path="/play/venues" element={<PlayVenues />} />
        <Route path="/play/venues/:id" element={<PlayVenueDetail />} />
        <Route path="/play/venues/:id/slots" element={<PlaySlotSelection />} />
        <Route path="/play/booking-success" element={<PlayBookingSuccess />} />
        <Route path="/play/my-bookings" element={<MyPlayBookings />} />

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
    </Suspense>
  );
}
