import { NavLink, useNavigate } from "react-router-dom";

function SuperAdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  const menuClass = ({ isActive }) =>
    isActive ? "sa-menu-link active" : "sa-menu-link";

  return (
    <>
      <style>{`
        .sa-sidebar {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 285px !important;
          height: 100vh !important;
          background: #0b2946 !important;
          display: flex !important;
          flex-direction: column !important;
          z-index: 1000 !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          font-family: Arial, Helvetica, sans-serif !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        .sa-logo-area {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 24px 22px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }

        .sa-logo {
          width: 48px;
          height: 48px;
          object-fit: contain;
          background: white;
          border-radius: 9px;
          padding: 4px;
        }

        .sa-logo-area h3 {
          margin: 0 0 4px;
          color: white;
          font-size: 17px;
          font-weight: 800;
        }

        .sa-logo-area span {
          color: #f6c20d;
          font-size: 10px;
          font-weight: 700;
        }

        .sa-menu {
          flex: 1;
          padding: 18px 12px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .sa-menu-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 13px;
          border-radius: 7px;
          color: #d9e3ec !important;
          text-decoration: none !important;
          font-size: 11px;
          font-weight: 600;
          transition: 0.2s ease;
          white-space: nowrap;
        }

        .sa-menu-link:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white !important;
        }

        .sa-menu-link.active {
          background: #f6c20d;
          color: #0b2946 !important;
          font-weight: 800;
        }

        .sa-logout-btn {
          margin: 12px;
          padding: 11px 14px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 7px;
          background: transparent;
          color: white;
          font-size: 11px;
          font-weight: 700;
          text-align: left;
          cursor: pointer;
          flex-shrink: 0;
        }

        .sa-logout-btn:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        @media (max-width: 1100px) {
          .sa-sidebar {
            width: 250px !important;
          }
        }
      `}</style>

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
          <NavLink to="/super-admin/dashboard" className={menuClass}>
            🏠 Dashboard
          </NavLink>

          <NavLink to="/super-admin/admins" className={menuClass}>
            👨‍💼 Admin Management
          </NavLink>

          <NavLink to="/super-admin/operations" className={menuClass}>
            🎧 Taxi Operations
          </NavLink>

          <NavLink to="/super-admin/users" className={menuClass}>
            👥 Users
          </NavLink>

          <NavLink to="/super-admin/drivers" className={menuClass}>
            🚖 Drivers
          </NavLink>

          <NavLink
            to="/super-admin/driver-registration"
            className={menuClass}
          >
            ➕ Driver Registration
          </NavLink>

          <NavLink
            to="/super-admin/driver-verification"
            className={menuClass}
          >
            ✅ Driver Verification
          </NavLink>

          <NavLink to="/super-admin/vehicles" className={menuClass}>
            🚗 Vehicles
          </NavLink>

          <NavLink to="/super-admin/vehicle-types" className={menuClass}>
            🚘 Vehicle Types
          </NavLink>

          <NavLink to="/super-admin/operational-areas" className={menuClass}>
            📍 Operational Areas
          </NavLink>

          <NavLink to="/super-admin/taxi-operator-areas" className={menuClass}>
            🗺️ Taxi Operator Areas
          </NavLink>

          <NavLink to="/super-admin/bookings" className={menuClass}>
            📋 Bookings
          </NavLink>

          <NavLink to="/super-admin/fare-management" className={menuClass}>
            💰 Fare Management
          </NavLink>

          <NavLink to="/super-admin/permissions" className={menuClass}>
            🔐 Roles & Permissions
          </NavLink>

          <NavLink to="/super-admin/reports" className={menuClass}>
            📊 Reports
          </NavLink>

          <NavLink to="/super-admin/activity" className={menuClass}>
            🕒 Activity Monitoring
          </NavLink>

          <NavLink to="/super-admin/settings" className={menuClass}>
            ⚙️ System Settings
          </NavLink>
        </nav>

        <button
          type="button"
          className="sa-logout-btn"
          onClick={handleLogout}
        >
          ↪ Logout
        </button>
      </aside>
    </>
  );
}

export default SuperAdminSidebar;
