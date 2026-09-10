import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

/* =========================================================
   COMPONENTS
========================================================= */

import Navbar from "./components/Navbar";

/* =========================================================
   PUBLIC
========================================================= */

import PublicPageLayout from "./layouts/PublicPageLayout";

import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Services from "./pages/public/Services";
import Vehicles from "./pages/public/Vehicles";
import Contact from "./pages/public/Contact";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import ForgotPassword from "./pages/public/ForgotPassword";
import DriverRegister from "./pages/public/DriverRegister";

/* =========================================================
   SUPER ADMIN
========================================================= */

import SuperAdminLayout from "./layouts/SuperAdminLayout";

import SuperAdminDashboard from "./pages/superAdmin/SuperAdminDashboard";
import AdminManagement from "./pages/superAdmin/AdminManagement";
import OperationsManagement from "./pages/superAdmin/OperationsManagement";
import UserManagement from "./pages/superAdmin/UserManagement";
import DriverManagement from "./pages/superAdmin/DriverManagement";
import DriverVerification from "./pages/superAdmin/DriverVerification";
import DriverRegistration from "./pages/superAdmin/DriverRegistration";
import VehicleManagement from "./pages/superAdmin/VehicleManagement";
import VehicleTypes from "./pages/superAdmin/VehicleTypes";
import OperationalAreas from "./pages/superAdmin/OperationalAreas";
import BookingManagement from "./pages/superAdmin/BookingManagement";
import RolesPermissions from "./pages/superAdmin/RolesPermissions";
import Reports from "./pages/superAdmin/Reports";
import ActivityMonitoring from "./pages/superAdmin/ActivityMonitoring";
import SystemSettings from "./pages/superAdmin/SystemSettings";

/* =========================================================
   ADMIN
========================================================= */

import AdminLayout from "./layouts/AdminLayout";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDrivers from "./pages/admin/AdminDrivers";
import AdminDriverVerification from "./pages/admin/AdminDriverVerification";
import AdminVehicles from "./pages/admin/AdminVehicles";
import AdminVehicleTypes from "./pages/admin/AdminVehicleTypes";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminReports from "./pages/admin/AdminReports";
import AdminActivity from "./pages/admin/AdminActivity";
import TaxiOperatorAreaManagement from "./pages/TaxiOperatorAreaManagement";

/* =========================================================
   TAXI OPERATOR
========================================================= */

import OperationsLayout from "./layouts/OperationsLayout";

import TaxiOperationsDashboard from "./pages/operations/TaxiOperationsDashboard";
import OperationsBookings from "./pages/operations/OperationsBookings";
import PhoneBooking from "./pages/operations/PhoneBooking";
import OnSiteBooking from "./pages/operations/OnSiteBooking";
import OperationsDrivers from "./pages/operations/OperationsDrivers";
import OperationsVehicles from "./pages/operations/OperationsVehicles";
import OperationsNotifications from "./pages/operations/OperationsNotifications";

/* =========================================================
   DRIVER
========================================================= */

import DriverLayout from "./layouts/DriverLayout";

import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverTripRequests from "./pages/driver/DriverTripRequests";
import DriverTrips from "./pages/driver/DriverTrips";
import DriverLocation from "./pages/driver/DriverLocation";
import DriverNotifications from "./pages/driver/DriverNotifications";
import DriverProfile from "./pages/driver/DriverProfile";

/* =========================================================
   PASSENGER
========================================================= */

import PassengerLayout from "./layouts/PassengerLayout";

import PassengerDashboard from "./pages/passenger/PassengerDashboard";
import BookTaxi from "./pages/passenger/BookTaxi";
import MyBookings from "./pages/passenger/MyBookings";
import TrackBooking from "./pages/passenger/TrackBooking";
import PassengerNotifications from "./pages/passenger/PassengerNotifications";
import PassengerProfile from "./pages/passenger/PassengerProfile";

/* =========================================================
   AUTH HELPERS
========================================================= */

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("authToken") ||
  sessionStorage.getItem("accessToken") ||
  "";

const getStoredUser = () => {
  const raw =
    localStorage.getItem("user") ||
    sessionStorage.getItem("user");

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const normalizeRole = (role) => {
  if (!role) {
    return "";
  }

  return String(role)
    .trim()
    .toUpperCase()
    .replaceAll(" ", "_");
};

const getUserRoles = () => {
  const user = getStoredUser();

  if (!user) {
    return [];
  }

  if (Array.isArray(user.roles)) {
    return user.roles
      .map(normalizeRole)
      .filter(Boolean);
  }

  if (user.role) {
    return [normalizeRole(user.role)];
  }

  if (user.roleName) {
    return [normalizeRole(user.roleName)];
  }

  return [];
};

/* =========================================================
   DEFAULT DASHBOARD BY ROLE
========================================================= */

const getDefaultDashboard = () => {
  const roles = getUserRoles();

  if (roles.includes("SUPER_ADMIN")) {
    return "/super-admin/dashboard";
  }

  if (roles.includes("ADMIN")) {
    return "/admin/dashboard";
  }

  if (roles.includes("TAXI_OPERATIONS")) {
    return "/operations/dashboard";
  }

  if (roles.includes("DRIVER")) {
    return "/driver/dashboard";
  }

  if (roles.includes("PASSENGER")) {
    return "/passenger/dashboard";
  }

  return "/login";
};

/* =========================================================
   ROLE GUARD
========================================================= */

function RoleGuard({ allowedRoles, children }) {
  const token = getToken();

  const roles = getUserRoles();

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (roles.length === 0) {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const normalizedAllowedRoles =
    allowedRoles.map(normalizeRole);

  const hasAllowedRole =
    normalizedAllowedRoles.some((role) =>
      roles.includes(role)
    );

  if (!hasAllowedRole) {
    return (
      <Navigate
        to={getDefaultDashboard()}
        replace
      />
    );
  }

  return children;
}

/* =========================================================
   PUBLIC ONLY
========================================================= */

function PublicOnly({ children }) {
  const token = getToken();

  if (token) {
    return (
      <Navigate
        to={getDefaultDashboard()}
        replace
      />
    );
  }

  return children;
}

/* =========================================================
   ROOT REDIRECT
========================================================= */

function RootPage() {
  const token = getToken();

  if (token) {
    return (
      <Navigate
        to={getDefaultDashboard()}
        replace
      />
    );
  }

  return (
    <>
      <Navbar />
      <Home />
    </>
  );
}

/* =========================================================
   APP
========================================================= */

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =================================================
            HOME
        ================================================= */}

        <Route
          path="/"
          element={<RootPage />}
        />

        {/* =================================================
            PUBLIC PAGES
        ================================================= */}

        <Route element={<PublicPageLayout />}>

          <Route
            path="/about"
            element={<About />}
          />

          <Route
            path="/services"
            element={<Services />}
          />

          <Route
            path="/vehicles"
            element={<Vehicles />}
          />

          <Route
            path="/contact"
            element={<Contact />}
          />

          <Route
            path="/login"
            element={
              <PublicOnly>
                <Login />
              </PublicOnly>
            }
          />

          <Route
            path="/register"
            element={
              <PublicOnly>
                <Register />
              </PublicOnly>
            }
          />

          <Route
            path="/forgot-password"
            element={
              <PublicOnly>
                <ForgotPassword />
              </PublicOnly>
            }
          />

          <Route
            path="/driver-register"
            element={
              <PublicOnly>
                <DriverRegister />
              </PublicOnly>
            }
          />

        </Route>

        {/* =================================================
            SUPER ADMIN
        ================================================= */}

        <Route
          path="/super-admin"
          element={
            <RoleGuard
              allowedRoles={["SUPER_ADMIN"]}
            >
              <SuperAdminLayout />
            </RoleGuard>
          }
        >

          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />

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
            path="driver-registration"
            element={<DriverRegistration />}
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
            path="operational-areas"
            element={<OperationalAreas />}
          />

          <Route
            path="taxi-operator-areas"
            element={<TaxiOperatorAreaManagement />}
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

        {/* =================================================
            ADMIN
        ================================================= */}

        <Route
          path="/admin"
          element={
            <RoleGuard
              allowedRoles={["ADMIN"]}
            >
              <AdminLayout />
            </RoleGuard>
          }
        >

          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={<AdminDashboard />}
          />

          <Route
            path="users"
            element={<AdminUsers />}
          />

          <Route
            path="drivers"
            element={<AdminDrivers />}
          />

          <Route
            path="driver-registration"
            element={<DriverRegistration />}
          />

          <Route
            path="driver-verification"
            element={
              <AdminDriverVerification />
            }
          />

          <Route
            path="vehicles"
            element={<AdminVehicles />}
          />

          <Route
            path="vehicle-types"
            element={<AdminVehicleTypes />}
          />

          <Route
            path="taxi-operator-areas"
            element={<TaxiOperatorAreaManagement />}
          />

          <Route
            path="bookings"
            element={<AdminBookings />}
          />

          <Route
            path="reports"
            element={<AdminReports />}
          />

          <Route
            path="activity"
            element={<AdminActivity />}
          />

        </Route>

        {/* =================================================
            TAXI OPERATOR
        ================================================= */}

        <Route
          path="/operations"
          element={
            <RoleGuard
              allowedRoles={[
                "TAXI_OPERATIONS",
              ]}
            >
              <OperationsLayout />
            </RoleGuard>
          }
        >

          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <TaxiOperationsDashboard />
            }
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
            element={
              <OperationsNotifications />
            }
          />

        </Route>

        {/* =================================================
            DRIVER
        ================================================= */}

        <Route
          path="/driver"
          element={
            <RoleGuard
              allowedRoles={["DRIVER"]}
            >
              <DriverLayout />
            </RoleGuard>
          }
        >

          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />

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

        {/* =================================================
            PASSENGER
        ================================================= */}

        <Route
          path="/passenger"
          element={
            <RoleGuard
              allowedRoles={["PASSENGER"]}
            >
              <PassengerLayout />
            </RoleGuard>
          }
        >

          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />

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
            element={
              <PassengerNotifications />
            }
          />

          <Route
            path="profile"
            element={<PassengerProfile />}
          />

        </Route>

        {/* =================================================
            OLD BOOK TAXI URL
        ================================================= */}

        <Route
          path="/book-taxi"
          element={
            <RoleGuard
              allowedRoles={["PASSENGER"]}
            >
              <Navigate
                to="/passenger/book-taxi"
                replace
              />
            </RoleGuard>
          }
        />

        {/* =================================================
            NOT FOUND
        ================================================= */}

        <Route
          path="*"
          element={
            getToken() ? (
              <Navigate
                to={getDefaultDashboard()}
                replace
              />
            ) : (
              <Navigate
                to="/"
                replace
              />
            )
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;