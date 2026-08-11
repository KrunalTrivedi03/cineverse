import { Route } from "react-router-dom";

import AdminLogin from "../admin/pages/AdminLogin";
import Dashboard from "../admin/pages/Dashboard";
import Movies from "../admin/pages/Movies";
import Roles from "../admin/pages/Roles";
import Permissions from "../admin/pages/Permissions";
import Users from "../admin/pages/Users";
import Logout from "../admin/pages/Logout";
import AddMovie from "../admin/pages/AddMovie";
import ReviewSummary from "../admin/pages/ReviewSummary";
import EditMovie from "../admin/pages/EditMovie";
import AdminCities from "../admin/pages/AdminCities";
import AdminTheatres from "../admin/pages/Admintheatres";
import AdminShows from "../admin/pages/AdminShows";
import AdminSeatLayout from "../admin/pages/Adminseatlayout ";
import AdminEvents from "../admin/pages/Adminevents";
import AdminArtists from "../admin/pages/Adminartists";
import AdminVenues from "../admin/pages/Adminvenues";
import AdminVenueSeatLayout from "../admin/pages/Adminvenueseatlayout";
import AdminDistricts from "../admin/pages/Admindistricts";
import EditEvent from "../admin/pages/Editevent";
import AddEvent from "../admin/pages/Addevent";
import AdminEventSchedules from "../admin/pages/Admineventschedules";
import AdminOffers from "../admin/pages/AdminOffers";
import AdminTours from "../admin/pages/AdminTours";
import WebAdminShows from "../admin/pages/WebAdminShows";
import AdminChangePassword from "../admin/pages/AdminChangePassword";

export default function AdminRoutes() {
  return (
    <>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/admin/movies" element={<Movies />} />
      <Route path="/admin/cities" element={<AdminCities />} />
      <Route path="/admin/theatres" element={<AdminTheatres />} />
      <Route path="/admin/shows" element={<AdminShows />} />
      <Route path="/admin/theatres/:theatreId/screens/:screenId/layout" element={<AdminSeatLayout />} />
      <Route path="/admin/roles" element={<Roles />} />
      <Route path="/admin/permissions" element={<Permissions />} />
      <Route path="/admin/users" element={<Users />} />
      <Route path="/admin/logout" element={<Logout />} />
      <Route path="admin/movies/add" element={<AddMovie />} />
      <Route path="/admin/movies/edit/:id" element={<EditMovie />} />
      <Route path="/admin/movies/view/:id" element={<ReviewSummary />} />

      <Route path="/admin/events" element={<AdminEvents />} />
      <Route path="/admin/artists" element={<AdminArtists />} />
      <Route path="/admin/tours" element={<AdminTours />} />
      <Route path="/admin/events/add" element={<AddEvent />} />
      <Route path="/admin/events/edit/:id" element={<EditEvent />} />
      <Route path="/admin/venues" element={<AdminVenues />} />
      <Route path="/admin/venues/:venueId/layout" element={<AdminVenueSeatLayout />}/>
      <Route path="/admin/districts" element={<AdminDistricts />} />
      <Route path="admin/schedule-events" element={<AdminEventSchedules />} />
      <Route path="/admin/offers" element={<AdminOffers />} />
      <Route path="/admin/web-shows" element={<WebAdminShows />} />
      <Route path="/admin/change-password" element={<AdminChangePassword />} />

    </>
  );
}