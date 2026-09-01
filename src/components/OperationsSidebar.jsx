import { NavLink } from "react-router-dom";

function OperationsSidebar() {
  return (
    <>
      <style>{`

        /* ===============================
           OPERATIONS MAIN LAYOUT
        =============================== */

        .operations-layout {
          display: flex;
          width: 100%;
          min-height: 100vh;
          background: #f4f7fa;
        }

        .operations-main-content {
          width: calc(100% - 250px);
          margin-left: 250px;
          min-height: 100vh;
          background: #f4f7fa;
        }


        /* ===============================
           OPERATIONS SIDEBAR
        =============================== */

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

          overflow: hidden;

          z-index: 2000;
        }


        /* LOGO AREA */

        .operations-sidebar-logo {
          padding: 28px 22px 22px;

          border-bottom: 1px solid
            rgba(255,255,255,0.12);

          flex-shrink: 0;
        }

        .operations-sidebar-logo h2 {
          margin: 0 0 6px;

          color: #f6c20d;

          font-size: 25px;
          font-weight: 800;
        }

        .operations-sidebar-logo span {
          display: block;

          color: #d2dce5;

          font-size: 11px;
        }


        /* MENU */

        .operations-sidebar-menu {
          flex: 1;

          display: flex;
          flex-direction: column;

          gap: 6px;

          padding: 20px 12px;

          overflow-y: auto;
          overflow-x: hidden;
        }


        /* MENU LINKS */

        .operations-sidebar-link {
          width: 100%;

          display: flex;
          align-items: center;

          gap: 12px;

          padding: 12px 14px;

          border-radius: 7px;

          text-decoration: none;

          color: #dbe5ee;

          font-size: 13px;
          font-weight: 500;

          transition: 0.2s;
        }

        .operations-sidebar-link span {
          width: 20px;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 15px;
        }

        .operations-sidebar-link:hover {
          background: #123d67;

          color: white;
        }

        .operations-sidebar-link.active {
          background: #f6c20d;

          color: #0b2946;

          font-weight: 700;
        }


        /* BOTTOM PROFILE */

        .operations-sidebar-bottom {
          flex-shrink: 0;

          padding: 17px 20px;

          border-top: 1px solid
            rgba(255,255,255,0.12);

          background: #09243e;
        }

        .operations-sidebar-bottom span {
          display: block;

          color: white;

          font-size: 11px;
          font-weight: 700;
        }

        .operations-sidebar-bottom small {
          display: block;

          margin-top: 4px;

          color: #aebdca;

          font-size: 9px;

          line-height: 1.5;
        }


        /* SIDEBAR SCROLLBAR */

        .operations-sidebar-menu::-webkit-scrollbar {
          width: 5px;
        }

        .operations-sidebar-menu::-webkit-scrollbar-track {
          background: transparent;
        }

        .operations-sidebar-menu::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.25);

          border-radius: 20px;
        }


        /* RESPONSIVE */

        @media (max-width: 800px) {

          .operations-sidebar {
            width: 210px;
          }

          .operations-main-content {
            width: calc(100% - 210px);
            margin-left: 210px;
          }

        }

      `}</style>


      <aside className="operations-sidebar">

        {/* LOGO */}

        <div className="operations-sidebar-logo">

          <h2>MMC Taxi</h2>

          <span>
            Taxi Operations
          </span>

        </div>


        {/* MENU */}

        <nav className="operations-sidebar-menu">

          <NavLink
            to="/operations/dashboard"
            className={({ isActive }) =>
              isActive
                ? "operations-sidebar-link active"
                : "operations-sidebar-link"
            }
          >
            <span>🏠</span>
            Dashboard
          </NavLink>


          <NavLink
            to="/operations/bookings"
            className={({ isActive }) =>
              isActive
                ? "operations-sidebar-link active"
                : "operations-sidebar-link"
            }
          >
            <span>📋</span>
            Bookings
          </NavLink>


          <NavLink
            to="/operations/phone-booking"
            className={({ isActive }) =>
              isActive
                ? "operations-sidebar-link active"
                : "operations-sidebar-link"
            }
          >
            <span>📞</span>
            Phone Booking
          </NavLink>


          <NavLink
            to="/operations/onsite-booking"
            className={({ isActive }) =>
              isActive
                ? "operations-sidebar-link active"
                : "operations-sidebar-link"
            }
          >
            <span>🏢</span>
            On-Site Booking
          </NavLink>


          <NavLink
            to="/operations/drivers"
            className={({ isActive }) =>
              isActive
                ? "operations-sidebar-link active"
                : "operations-sidebar-link"
            }
          >
            <span>👨‍✈️</span>
            Drivers
          </NavLink>


          <NavLink
            to="/operations/vehicles"
            className={({ isActive }) =>
              isActive
                ? "operations-sidebar-link active"
                : "operations-sidebar-link"
            }
          >
            <span>🚕</span>
            Vehicles
          </NavLink>


          <NavLink
            to="/operations/notifications"
            className={({ isActive }) =>
              isActive
                ? "operations-sidebar-link active"
                : "operations-sidebar-link"
            }
          >
            <span>🔔</span>
            Notifications
          </NavLink>

        </nav>


        {/* BOTTOM */}

        <div className="operations-sidebar-bottom">

          <span>
            Taxi Operations Officer
          </span>

          <small>
            Makumbura Multimodal Center
          </small>

        </div>

      </aside>
    </>
  );
}

export default OperationsSidebar;