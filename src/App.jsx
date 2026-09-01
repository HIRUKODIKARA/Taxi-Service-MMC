import { BrowserRouter, Routes, Route } from "react-router-dom";

/* COMPONENTS */
import Navbar from "./components/Navbar";

/* PUBLIC LAYOUT */
import PublicPageLayout from "./layouts/PublicPageLayout";

/* PUBLIC PAGES */
import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Services from "./pages/public/Services";
import Vehicles from "./pages/public/Vehicles";
import Contact from "./pages/public/Contact";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import ForgotPassword from "./pages/public/ForgotPassword";
import DriverRegister from "./pages/public/DriverRegister";

/* SUPER ADMIN */
import SuperAdminLayout from "./layouts/SuperAdminLayout";

import SuperAdminDashboard from "./pages/superAdmin/SuperAdminDashboard";
import AdminManagement from "./pages/superAdmin/AdminManagement";
import OperationsManagement from "./pages/superAdmin/OperationsManagement";
import UserManagement from "./pages/superAdmin/UserManagement";
import DriverManagement from "./pages/superAdmin/DriverManagement";
import DriverVerification from "./pages/superAdmin/DriverVerification";
import VehicleManagement from "./pages/superAdmin/VehicleManagement";
import VehicleTypes from "./pages/superAdmin/VehicleTypes";
import BookingManagement from "./pages/superAdmin/BookingManagement";
import RolesPermissions from "./pages/superAdmin/RolesPermissions";
import Reports from "./pages/superAdmin/Reports";
import ActivityMonitoring from "./pages/superAdmin/ActivityMonitoring";
import SystemSettings from "./pages/superAdmin/SystemSettings";

/* TAXI OPERATIONS */
import OperationsLayout from "./layouts/OperationsLayout";

import TaxiOperationsDashboard from "./pages/operations/TaxiOperationsDashboard";
import OperationsBookings from "./pages/operations/OperationsBookings";
import PhoneBooking from "./pages/operations/PhoneBooking";
import OnSiteBooking from "./pages/operations/OnSiteBooking";
import OperationsDrivers from "./pages/operations/OperationsDrivers";
import OperationsVehicles from "./pages/operations/OperationsVehicles";
import OperationsNotifications from "./pages/operations/OperationsNotifications";

/* DRIVER */
import DriverLayout from "./layouts/DriverLayout";

import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverTripRequests from "./pages/driver/DriverTripRequests";
import DriverTrips from "./pages/driver/DriverTrips";
import DriverLocation from "./pages/driver/DriverLocation";
import DriverNotifications from "./pages/driver/DriverNotifications";
import DriverProfile from "./pages/driver/DriverProfile";

/* PASSENGER */
import PassengerLayout from "./layouts/PassengerLayout";

import PassengerDashboard from "./pages/passenger/PassengerDashboard";
import BookTaxi from "./pages/passenger/BookTaxi";
import MyBookings from "./pages/passenger/MyBookings";
import TrackBooking from "./pages/passenger/TrackBooking";
import PassengerNotifications from "./pages/passenger/PassengerNotifications";
import PassengerProfile from "./pages/passenger/PassengerProfile";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= HOME ================= */}

        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Home />
            </>
          }
        />

        {/* ================= PUBLIC PAGES ================= */}

        <Route element={<PublicPageLayout />}>
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/driver-register"
            element={<DriverRegister />}
          />

          <Route
            path="/book-taxi"
            element={<BookTaxi />}
          />
        </Route>

        {/* ================= SUPER ADMIN ================= */}

        <Route
          path="/super-admin"
          element={<SuperAdminLayout />}
        >
          <Route
            path="dashboard"
            element={<SuperAdminDashboard />}
          />

          <Route
            path="admins"
            element={<AdminManagement />}
          />

          <Route
            path="operations"
            element={<OperationsManagement />}
          />

          <Route
            path="users"
            element={<UserManagement />}
          />

          <Route
            path="drivers"
            element={<DriverManagement />}
          />

          <Route
            path="driver-verification"
            element={<DriverVerification />}
          />

          <Route
            path="vehicles"
            element={<VehicleManagement />}
          />

          <Route
            path="vehicle-types"
            element={<VehicleTypes />}
          />

          <Route
            path="bookings"
            element={<BookingManagement />}
          />

          <Route
            path="permissions"
            element={<RolesPermissions />}
          />

          <Route
            path="reports"
            element={<Reports />}
          />

          <Route
            path="activity"
            element={<ActivityMonitoring />}
          />

          <Route
            path="settings"
            element={<SystemSettings />}
          />
        </Route>

        {/* ================= TAXI OPERATIONS ================= */}

        <Route
          path="/operations"
          element={<OperationsLayout />}
        >
          <Route
            path="dashboard"
            element={<TaxiOperationsDashboard />}
          />

          <Route
            path="bookings"
            element={<OperationsBookings />}
          />

          <Route
            path="phone-booking"
            element={<PhoneBooking />}
          />

          <Route
            path="onsite-booking"
            element={<OnSiteBooking />}
          />

          <Route
            path="drivers"
            element={<OperationsDrivers />}
          />

          <Route
            path="vehicles"
            element={<OperationsVehicles />}
          />

          <Route
            path="notifications"
            element={<OperationsNotifications />}
          />
        </Route>

        {/* ================= DRIVER ================= */}

        <Route
          path="/driver"
          element={<DriverLayout />}
        >
          <Route
            path="dashboard"
            element={<DriverDashboard />}
          />

          <Route
            path="requests"
            element={<DriverTripRequests />}
          />

          <Route
            path="trips"
            element={<DriverTrips />}
          />

          <Route
            path="location"
            element={<DriverLocation />}
          />

          <Route
            path="notifications"
            element={<DriverNotifications />}
          />

          <Route
            path="profile"
            element={<DriverProfile />}
          />
        </Route>

        {/* ================= PASSENGER ================= */}

        <Route
          path="/passenger"
          element={<PassengerLayout />}
        >
          <Route
            path="dashboard"
            element={<PassengerDashboard />}
          />

          <Route
            path="book-taxi"
            element={<BookTaxi />}
          />

          <Route
            path="bookings"
            element={<MyBookings />}
          />

          <Route
            path="tracking"
            element={<TrackBooking />}
          />

          <Route
            path="notifications"
            element={<PassengerNotifications />}
          />

          <Route
            path="profile"
            element={<PassengerProfile />}
          />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;