import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

function OperationsSidebar() {
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);

  const menuClass = ({ isActive }) =>
    isActive
      ? "operations-sidebar-link active"
      : "operations-sidebar-link";

  /* =========================
     LOGOUT
  ========================= */

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

  return (
    <>
      <style>{`

        /* =========================
           SIDEBAR
        ========================= */

        .operations-sidebar {
          position: fixed;
          top: 0;
          left: 0;

          width: 250px;
          height: 100vh;

          background: #0b2946;
          color: white;

          display: flex;
          flex-direction: column;

          overflow-y: auto;

          z-index: 5000;

          font-family: Arial, Helvetica, sans-serif;

          box-sizing: border-box;

          transition: transform .25s ease;
        }

        /* =========================
           HEADER
        ========================= */

        .operations-sidebar-logo {
          padding: 26px 22px 20px;

          border-bottom:
            1px solid rgba(255,255,255,.12);

          flex-shrink: 0;
        }

        .operations-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 12px;
        }

        .operations-brand-text h2 {
          margin: 0 0 6px;

          color: #f6c20d;

          font-size: 24px;
          font-weight: 800;
        }

        .operations-brand-text span {
          color: #d2dce5;

          font-size: 11px;
          font-weight: 700;
        }

        /* =========================
           CLOSE BUTTON
        ========================= */

        .operations-sidebar-close {
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

        .operations-sidebar-close:hover {
          background:
            rgba(255,255,255,.18);
        }

        /* =========================
           MENU
        ========================= */

        .operations-sidebar-menu {
          flex: 1;

          display: flex;
          flex-direction: column;

          gap: 6px;

          padding: 18px 12px;
        }

        .operations-sidebar-link {
          display: flex;
          align-items: center;

          gap: 11px;

          padding: 12px 14px;

          border-radius: 7px;

          text-decoration: none;

          color: #dbe5ee;

          font-size: 12px;
          font-weight: 600;

          transition: .2s;
        }

        .operations-sidebar-link:hover {
          background: #123d67;
          color: white;
        }

        .operations-sidebar-link.active {
          background: #f6c20d;
          color: #0b2946;
          font-weight: 800;
        }

        /* =========================
           BOTTOM
        ========================= */

        .operations-sidebar-bottom {
          padding: 16px 14px;

          border-top:
            1px solid rgba(255,255,255,.12);

          background: #09243e;

          flex-shrink: 0;
        }

        .operations-role {
          padding: 0 6px 12px;
        }

        .operations-role strong {
          display: block;

          color: white;

          font-size: 11px;
        }

        .operations-role small {
          display: block;

          margin-top: 4px;

          color: #aebdca;

          font-size: 9px;
        }

        /* =========================
           LOGOUT
        ========================= */

        .operations-logout-btn {
          width: 100%;

          padding: 10px 12px;

          border:
            1px solid rgba(255,255,255,.22);

          border-radius: 6px;

          background: transparent;

          color: white;

          font-size: 11px;
          font-weight: 700;

          text-align: left;

          cursor: pointer;
        }

        .operations-logout-btn:hover {
          background:
            rgba(255,255,255,.08);
        }

        /* =========================
           MOBILE HAMBURGER
        ========================= */

        .operations-mobile-btn {
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

        .operations-overlay {
          display: none;
        }

        /* =========================
           TABLET
        ========================= */

        @media (max-width: 1000px) and (min-width: 761px) {
          .operations-sidebar {
            width: 210px;
          }
        }

        /* =========================
           MOBILE
        ========================= */

        @media (max-width: 760px) {

          .operations-mobile-btn {
            display: block;
          }

          .operations-sidebar {
            width: min(280px, 82vw);

            transform:
              translateX(-100%);

            z-index: 10000;

            box-shadow:
              5px 0 20px rgba(0,0,0,.20);
          }

          .operations-sidebar.mobile-open {
            transform:
              translateX(0);
          }

          .operations-sidebar-close {
            display: flex;

            align-items: center;
            justify-content: center;
          }

          .operations-overlay {
            display: block;

            position: fixed;

            inset: 0;

            background:
              rgba(0,0,0,.45);

            z-index: 9999;
          }
        }
      `}</style>

      {/* =========================
          MOBILE HAMBURGER
      ========================= */}

      {!mobileOpen && (
        <button
          type="button"
          className="operations-mobile-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
      )}

      {/* =========================
          MOBILE OVERLAY
      ========================= */}

      {mobileOpen && (
        <div
          className="operations-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside
        className={`operations-sidebar ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >

        {/* HEADER */}

        <div className="operations-sidebar-logo">

          <div className="operations-header-row">

            <div className="operations-brand-text">
              <h2>MMC Taxi</h2>
              <span>Taxi Operator</span>
            </div>

            <button
              type="button"
              className="operations-sidebar-close"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              ×
            </button>

          </div>

        </div>

        {/* MENU */}

        <nav className="operations-sidebar-menu">

          <NavLink
            to="/operations/dashboard"
            className={menuClass}
            onClick={() => setMobileOpen(false)}
          >
            🏠 Dashboard
          </NavLink>

          <NavLink
            to="/operations/bookings"
            className={menuClass}
            onClick={() => setMobileOpen(false)}
          >
            📋 Bookings
          </NavLink>

          <NavLink
            to="/operations/phone-booking"
            className={menuClass}
            onClick={() => setMobileOpen(false)}
          >
            📞 Phone Booking
          </NavLink>

          <NavLink
            to="/operations/onsite-booking"
            className={menuClass}
            onClick={() => setMobileOpen(false)}
          >
            🏢 On-Site Booking
          </NavLink>

          <NavLink
            to="/operations/drivers"
            className={menuClass}
            onClick={() => setMobileOpen(false)}
          >
            👨‍✈️ Drivers
          </NavLink>

          <NavLink
            to="/operations/vehicles"
            className={menuClass}
            onClick={() => setMobileOpen(false)}
          >
            🚕 Vehicles
          </NavLink>

          <NavLink
            to="/operations/notifications"
            className={menuClass}
            onClick={() => setMobileOpen(false)}
          >
            🔔 Notifications
          </NavLink>

        </nav>

        {/* BOTTOM */}

        <div className="operations-sidebar-bottom">

          <div className="operations-role">
            <strong>Taxi Operator</strong>

            <small>
              Makumbura Multimodal Center
            </small>
          </div>

          <button
            type="button"
            className="operations-logout-btn"
            onClick={handleLogout}
          >
            ↪ Logout
          </button>

        </div>

      </aside>
    </>
  );
}

export default OperationsSidebar;