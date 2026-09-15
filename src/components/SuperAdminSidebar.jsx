import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

function SuperAdminSidebar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    [
      "token",
      "authToken",
      "accessToken",
      "user",
    ].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    setMobileOpen(false);

    navigate("/login", {
      replace: true,
    });
  };

  const menuClass = ({ isActive }) =>
    isActive
      ? "sa-menu-link active"
      : "sa-menu-link";

  const items = [
    ["/super-admin/dashboard", "🏠 Dashboard"],
    ["/super-admin/admins", "👨‍💼 Admin Management"],
    ["/super-admin/operations", "🎧 Taxi Operations"],
    ["/super-admin/users", "👥 Users"],
    ["/super-admin/drivers", "🚖 Drivers"],
    [
      "/super-admin/driver-registration",
      "➕ Driver Registration",
    ],
    [
      "/super-admin/driver-verification",
      "✅ Driver Verification",
    ],
    ["/super-admin/vehicles", "🚗 Vehicles"],
    ["/super-admin/vehicle-types", "🚘 Vehicle Types"],
    [
      "/super-admin/operational-areas",
      "📍 Operational Areas",
    ],
    [
      "/super-admin/taxi-operator-areas",
      "🗺️ Taxi Operator Areas",
    ],
    ["/super-admin/bookings", "📋 Bookings"],
    [
      "/super-admin/fare-management",
      "💰 Fare Management",
    ],
    [
      "/super-admin/permissions",
      "🔐 Roles & Permissions",
    ],
    ["/super-admin/reports", "📊 Reports"],
    [
      "/super-admin/activity",
      "🕒 Activity Monitoring",
    ],
    [
      "/super-admin/settings",
      "⚙️ System Settings",
    ],
  ];

  return (
    <>
      <style>{`
        .sa-sidebar {
          position: fixed;
          top: 0;
          left: 0;

          width: 285px;
          height: 100vh;

          background: #0b2946;

          display: flex;
          flex-direction: column;

          z-index: 5000;

          overflow-y: auto;
          overflow-x: hidden;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          transition: transform .25s ease;
        }

        /* =========================
           LOGO / HEADER
        ========================= */

        .sa-logo-area {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 12px;

          padding: 24px 22px;

          border-bottom:
            1px solid rgba(255,255,255,.1);

          flex-shrink: 0;
        }

        .sa-logo-content {
          display: flex;
          align-items: center;
          gap: 12px;

          min-width: 0;
        }

        .sa-logo {
          width: 48px;
          height: 48px;

          object-fit: contain;

          background: white;

          border-radius: 9px;

          padding: 4px;

          flex-shrink: 0;
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

        /* =========================
           MOBILE CLOSE BUTTON
        ========================= */

        .sa-sidebar-close {
          display: none;

          width: 34px;
          height: 34px;

          flex-shrink: 0;

          border: none;
          border-radius: 7px;

          background:
            rgba(255,255,255,.10);

          color: white;

          font-size: 23px;
          line-height: 1;

          cursor: pointer;
        }

        .sa-sidebar-close:hover {
          background:
            rgba(255,255,255,.18);
        }

        /* =========================
           MENU
        ========================= */

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

          color: #d9e3ec;

          text-decoration: none;

          font-size: 11px;
          font-weight: 600;

          white-space: nowrap;

          transition: .2s;
        }

        .sa-menu-link:hover {
          background:
            rgba(255,255,255,.08);

          color: white;
        }

        .sa-menu-link.active {
          background: #f6c20d;

          color: #0b2946;

          font-weight: 800;
        }

        /* =========================
           LOGOUT
        ========================= */

        .sa-logout-btn {
          margin: 12px;

          padding: 11px 14px;

          border:
            1px solid rgba(255,255,255,.2);

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
          background:
            rgba(255,255,255,.08);
        }

        /* =========================
           MOBILE HAMBURGER
        ========================= */

        .sa-mobile-btn {
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

          box-shadow:
            0 3px 10px rgba(0,0,0,.15);
        }

        /* =========================
           OVERLAY
        ========================= */

        .sa-overlay {
          display: none;
        }

        /* =========================
           TABLET
        ========================= */

        @media (
          max-width: 1100px
        ) and (
          min-width: 761px
        ) {
          .sa-sidebar {
            width: 250px;
          }
        }

        /* =========================
           MOBILE
        ========================= */

        @media (max-width: 760px) {

          .sa-mobile-btn {
            display: block;
          }

          .sa-sidebar {
            width: min(285px, 84vw);

            transform:
              translateX(-100%);

            z-index: 10000;

            box-shadow:
              5px 0 20px
              rgba(0,0,0,.20);
          }

          .sa-sidebar.mobile-open {
            transform:
              translateX(0);
          }

          .sa-sidebar-close {
            display: flex;

            align-items: center;
            justify-content: center;
          }

          .sa-overlay {
            display: block;

            position: fixed;

            inset: 0;

            background:
              rgba(0,0,0,.45);

            z-index: 9999;
          }
        }
      `}</style>

      {/* MOBILE HAMBURGER */}

      {!mobileOpen && (
        <button
          type="button"
          className="sa-mobile-btn"
          onClick={() =>
            setMobileOpen(true)
          }
          aria-label="Open menu"
        >
          ☰
        </button>
      )}

      {/* DARK OVERLAY */}

      {mobileOpen && (
        <div
          className="sa-overlay"
          onClick={() =>
            setMobileOpen(false)
          }
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`sa-sidebar ${
          mobileOpen
            ? "mobile-open"
            : ""
        }`}
      >

        {/* HEADER */}

        <div className="sa-logo-area">

          <div className="sa-logo-content">

            <img
              src="/logo.png"
              alt="Makumbura MMC"
              className="sa-logo"
            />

            <div>
              <h3>MMC Taxi</h3>
              <span>
                Super Admin
              </span>
            </div>

          </div>

          <button
            type="button"
            className="sa-sidebar-close"
            onClick={() =>
              setMobileOpen(false)
            }
            aria-label="Close menu"
          >
            ×
          </button>

        </div>

        {/* MENU */}

        <nav className="sa-menu">

          {items.map(
            ([path, label]) => (
              <NavLink
                key={path}
                to={path}
                className={menuClass}
                onClick={() =>
                  setMobileOpen(false)
                }
              >
                {label}
              </NavLink>
            )
          )}

        </nav>

        {/* LOGOUT */}

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