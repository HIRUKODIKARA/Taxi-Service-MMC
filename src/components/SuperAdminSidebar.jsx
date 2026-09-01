import { NavLink } from "react-router-dom";

function SuperAdminSidebar() {
  return (
    <aside className="sa-sidebar">

      <div className="sa-logo-area">

        <img
          src="/logo.png"
          alt="Makumbura MMC"
          className="sa-logo"
        />

        <div>
          <h3>MMC Taxi</h3>
          <span>Super Admin</span>
        </div>

      </div>

      <nav className="sa-menu">

        <NavLink to="/super-admin/dashboard">
          🏠 Dashboard
        </NavLink>

        <NavLink to="/super-admin/admins">
          👨‍💼 Admin Management
        </NavLink>

        <NavLink to="/super-admin/operations">
          🎧 Taxi Operations
        </NavLink>

        <NavLink to="/super-admin/users">
          👥 Users
        </NavLink>

        <NavLink to="/super-admin/drivers">
          🚖 Drivers
        </NavLink>

        <NavLink to="/super-admin/driver-verification">
          ✅ Driver Verification
        </NavLink>

        <NavLink to="/super-admin/vehicles">
          🚗 Vehicles
        </NavLink>

        <NavLink to="/super-admin/vehicle-types">
          🚘 Vehicle Types
        </NavLink>

        <NavLink to="/super-admin/bookings">
          📋 Bookings
        </NavLink>

        <NavLink to="/super-admin/permissions">
          🔐 Roles & Permissions
        </NavLink>

        <NavLink to="/super-admin/reports">
          📊 Reports
        </NavLink>

        <NavLink to="/super-admin/activity">
          🕒 Activity Monitoring
        </NavLink>

        <NavLink to="/super-admin/settings">
          ⚙️ System Settings
        </NavLink>

      </nav>

      <NavLink to="/" className="sa-logout">
        ↪ Logout
      </NavLink>

    </aside>
  );
}

export default SuperAdminSidebar;