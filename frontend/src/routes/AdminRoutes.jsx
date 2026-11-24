import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";

// Lazy-load all Admin pages on demand so non-admin users never download them
const AdminLogin = lazy(() => import("../admin/pages/AdminLogin"));
const Dashboard = lazy(() => import("../admin/pages/Dashboard"));
const Movies = lazy(() => import("../admin/pages/Movies"));
const Roles = lazy(() => import("../admin/pages/Roles"));
const Permissions = lazy(() => import("../admin/pages/Permissions"));
const Users = lazy(() => import("../admin/pages/Users"));
const Logout = lazy(() => import("../admin/pages/Logout"));
const AddMovie = lazy(() => import("../admin/pages/AddMovie"));
const ReviewSummary = lazy(() => import("../admin/pages/ReviewSummary"));
const EditMovie = lazy(() => import("../admin/pages/EditMovie"));
const AdminCities = lazy(() => import("../admin/pages/AdminCities"));
const AdminTheatres = lazy(() => import("../admin/pages/Admintheatres"));
const AdminShows = lazy(() => import("../admin/pages/AdminShows"));
const AdminSeatLayout = lazy(() => import("../admin/pages/Adminseatlayout "));
const AdminEvents = lazy(() => import("../admin/pages/Adminevents"));
const AdminArtists = lazy(() => import("../admin/pages/Adminartists"));
const AdminVenues = lazy(() => import("../admin/pages/Adminvenues"));
const AdminVenueSeatLayout = lazy(() => import("../admin/pages/Adminvenueseatlayout"));
const AdminDistricts = lazy(() => import("../admin/pages/Admindistricts"));
const EditEvent = lazy(() => import("../admin/pages/Editevent"));
const AddEvent = lazy(() => import("../admin/pages/Addevent"));
const AdminEventSchedules = lazy(() => import("../admin/pages/Admineventschedules"));
const AdminOffers = lazy(() => import("../admin/pages/AdminOffers"));
const AdminChangePassword = lazy(() => import("../admin/pages/AdminChangePassword"));
const AdminPlayActivities = lazy(() => import("../admin/pages/AdminPlayActivities"));
const AdminPlayVenues = lazy(() => import("../admin/pages/AdminPlayVenues"));
const AdminPlayVenueCourts = lazy(() => import("../admin/pages/AdminPlayVenueCourts"));
const AdminPlayBookings = lazy(() => import("../admin/pages/AdminPlayBookings"));
const WebAdminShows = lazy(() => import("../admin/pages/WebAdminShows"));

const AdminLoader = () => (
  <div role="status" className="min-h-screen bg-gray-50 flex items-center justify-center">
    <span className="sr-only">Loading admin page</span>
    <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-now-accent animate-spin" />
  </div>
);

const withSuspense = (LazyComponent) => (
  <Suspense fallback={<AdminLoader />}>
    <LazyComponent />
  </Suspense>
);

export default function AdminRoutes() {
  return (
    <>
      <Route path="/admin/login" element={withSuspense(AdminLogin)} />
      <Route path="/admin/dashboard" element={withSuspense(Dashboard)} />
      <Route path="/admin/movies" element={withSuspense(Movies)} />
      <Route path="/admin/cities" element={withSuspense(AdminCities)} />
      <Route path="/admin/theatres" element={withSuspense(AdminTheatres)} />
      <Route path="/admin/shows" element={withSuspense(AdminShows)} />
      <Route path="/admin/theatres/:theatreId/screens/:screenId/layout" element={withSuspense(AdminSeatLayout)} />
      <Route path="/admin/roles" element={withSuspense(Roles)} />
      <Route path="/admin/permissions" element={withSuspense(Permissions)} />
      <Route path="/admin/users" element={withSuspense(Users)} />
      <Route path="/admin/logout" element={withSuspense(Logout)} />
      <Route path="/admin/movies/add" element={withSuspense(AddMovie)} />
      <Route path="/admin/movies/edit/:id" element={withSuspense(EditMovie)} />
      <Route path="/admin/movies/view/:id" element={withSuspense(ReviewSummary)} />

      <Route path="/admin/events" element={withSuspense(AdminEvents)} />
      <Route path="/admin/artists" element={withSuspense(AdminArtists)} />
      <Route path="/admin/events/add" element={withSuspense(AddEvent)} />
      <Route path="/admin/events/edit/:id" element={withSuspense(EditEvent)} />
      <Route path="/admin/venues" element={withSuspense(AdminVenues)} />
      <Route path="/admin/venues/:venueId/layout" element={withSuspense(AdminVenueSeatLayout)} />
      <Route path="/admin/districts" element={withSuspense(AdminDistricts)} />
      <Route path="/admin/web-shows" element={withSuspense(WebAdminShows)} />
      <Route path="/admin/schedule-events" element={withSuspense(AdminEventSchedules)} />
      <Route path="/admin/offers" element={withSuspense(AdminOffers)} />
      <Route path="/admin/change-password" element={withSuspense(AdminChangePassword)} />
      <Route path="/admin/play/activities" element={withSuspense(AdminPlayActivities)} />
      <Route path="/admin/play/venues" element={withSuspense(AdminPlayVenues)} />
      <Route path="/admin/play/venues/:venueId/courts" element={withSuspense(AdminPlayVenueCourts)} />
      <Route path="/admin/play/bookings" element={withSuspense(AdminPlayBookings)} />
    </>
  );
}
