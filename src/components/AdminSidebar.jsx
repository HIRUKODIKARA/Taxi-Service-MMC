import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

function AdminSidebar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: "🏠", path: "/admin/dashboard" },
    { name: "Users", icon: "👥", path: "/admin/users" },
    { name: "Drivers", icon: "🚕", path: "/admin/drivers" },
    {
      name: "Driver Verification",
      icon: "✅",
      path: "/admin/driver-verification",
    },
    { name: "Vehicles", icon: "🚗", path: "/admin/vehicles" },
    {
      name: "Vehicle Types",
      icon: "🚘",
      path: "/admin/vehicle-types",
    },
    {
      name: "Taxi Operator Areas",
      icon: "🗺️",
      path: "/admin/taxi-operator-areas",
    },
    { name: "Bookings", icon: "📋", path: "/admin/bookings" },
    { name: "Reports", icon: "📊", path: "/admin/reports" },
    {
      name: "Activity Monitoring",
      icon: "🕘",
      path: "/admin/activity",
    },
  ];

  const logout = () => {
    ["token", "authToken", "accessToken", "user"].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    setMobileOpen(false);

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <>
      <style>{`
        .admin-sidebar {
          position: fixed;
          top: 0;
          left: 0;

          width: 285px;
          height: 100vh;

          background: #0b2946;
          color: white;

          display: flex;
          flex-direction: column;

          z-index: 5000;

          font-family: Arial, Helvetica, sans-serif;
          box-sizing: border-box;

          transition: transform .25s ease;
        }

        .admin-sidebar-header {
          padding: 25px 22px;
          border-bottom: 1px solid rgba(255,255,255,.12);
          flex-shrink: 0;
        }

        .admin-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .admin-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .admin-brand-logo {
          width: 52px;
          height: 52px;

          background: white;
          border-radius: 9px;

          display: flex;
          align-items: center;
          justify-content: center;

          overflow: hidden;
          flex-shrink: 0;
        }

        .admin-brand-logo img {
          width: 100%;
          height: 100%;

          object-fit: contain;
          padding: 4px;

          box-sizing: border-box;
        }

        .admin-brand-text {
          min-width: 0;
        }

        .admin-brand-text h2 {
          margin: 0;
          color: white;
          font-size: 21px;
          font-weight: 800;
          white-space: nowrap;
        }

        .admin-brand-text p {
          margin: 5px 0 0;
          color: #f6c20d;
          font-size: 10px;
          font-weight: 700;
        }

        /* CLOSE BUTTON */

        .admin-sidebar-close {
          display: none;

          width: 34px;
          height: 34px;

          flex-shrink: 0;

          border: none;
          border-radius: 7px;

          background: rgba(255,255,255,.10);
          color: white;

          font-size: 23px;
          line-height: 1;

          cursor: pointer;
        }

        .admin-sidebar-close:hover {
          background: rgba(255,255,255,.18);
        }

        /* MENU */

        .admin-menu {
          flex: 1;
          padding: 20px 13px;
          overflow-y: auto;
        }

        .admin-menu-label {
          display: block;

          margin: 0 10px 12px;

          color: rgba(255,255,255,.45);

          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .admin-nav {
          display: flex;
          align-items: center;

          gap: 11px;

          margin-bottom: 5px;
          padding: 12px 13px;

          border-radius: 7px;

          color: rgba(255,255,255,.82);
          text-decoration: none;

          font-size: 11px;
          font-weight: 650;

          transition: .2s;
        }

        .admin-nav:hover {
          background: rgba(255,255,255,.08);
          color: white;
        }

        .admin-nav.active {
          background: #f6c20d;
          color: #0b2946;
          font-weight: 800;
        }

        .admin-nav-icon {
          width: 22px;
          text-align: center;
          font-size: 14px;
          flex-shrink: 0;
        }

        /* FOOTER */

        .admin-sidebar-footer {
          padding: 16px;

          border-top: 1px solid rgba(255,255,255,.12);

          flex-shrink: 0;
        }

        .admin-account {
          margin-bottom: 10px;
          padding: 11px;

          background: rgba(255,255,255,.06);

          border-radius: 8px;
        }

        .admin-account strong {
          display: block;
          color: white;
          font-size: 10px;
        }

        .admin-account span {
          display: block;
          margin-top: 4px;

          color: rgba(255,255,255,.55);

          font-size: 8px;
        }

        .admin-logout {
          width: 100%;

          padding: 10px;

          border: 1px solid rgba(255,255,255,.2);
          background: transparent;

          color: white;

          border-radius: 7px;

          cursor: pointer;

          font-size: 10px;
          font-weight: 700;
        }

        .admin-logout:hover {
          background: rgba(255,255,255,.08);
        }

        /* MOBILE HAMBURGER */

        .admin-mobile-btn {
          display: none;

          position: fixed;

          top: 14px;
          left: 14px;

          z-index: 10001;

          width: 44px;
          height: 44px;

          border: none;
          border-radius: 9px;

          background: #f6c20d;
          color: #0b2946;

          font-size: 24px;
          font-weight: 800;
          line-height: 1;

          cursor: pointer;

          box-shadow: 0 3px 10px rgba(0,0,0,.15);
        }

        .admin-overlay {
          display: none;
        }

        /* TABLET */

        @media (max-width: 1100px) and (min-width: 761px) {
          .admin-sidebar {
            width: 250px;
          }
        }

        /* MOBILE */

        @media (max-width: 760px) {
          .admin-mobile-btn {
            display: block;
          }

          .admin-sidebar {
            width: min(285px, 84vw);

            transform: translateX(-100%);

            z-index: 10000;

            box-shadow: 5px 0 20px rgba(0,0,0,.20);
          }

          .admin-sidebar.mobile-open {
            transform: translateX(0);
          }

          .admin-sidebar-close {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .admin-overlay {
            display: block;

            position: fixed;
            inset: 0;

            background: rgba(0,0,0,.45);

            z-index: 9999;
          }
        }
      `}</style>

      {/* MOBILE HAMBURGER */}

      {!mobileOpen && (
        <button
          type="button"
          className="admin-mobile-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
      )}

      {/* DARK OVERLAY */}

      {mobileOpen && (
        <div
          className="admin-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`admin-sidebar ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >
        <div className="admin-sidebar-header">
          <div className="admin-header-row">

            <div className="admin-brand">
              <div className="admin-brand-logo">
                <img
                  src="/logo.png"
                  alt="MMC Logo"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>

              <div className="admin-brand-text">
                <h2>MMC Taxi</h2>
                <p>Admin Portal</p>
              </div>
            </div>

            <button
              type="button"
              className="admin-sidebar-close"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              ×
            </button>

          </div>
        </div>

        {/* MENU */}

        <nav className="admin-menu">
          <span className="admin-menu-label">
            ADMIN MENU
          </span>

          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `admin-nav ${isActive ? "active" : ""}`
              }
            >
              <span className="admin-nav-icon">
                {item.icon}
              </span>

              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* FOOTER */}

        <div className="admin-sidebar-footer">
          <div className="admin-account">
            <strong>MMC Administrator</strong>
            <span>Makumbura Multimodal Center</span>
          </div>

          <button
            type="button"
            className="admin-logout"
            onClick={logout}
          >
            ↪ Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;