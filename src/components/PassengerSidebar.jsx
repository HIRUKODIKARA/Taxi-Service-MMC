import { NavLink } from "react-router-dom";

function PassengerSidebar() {
  const menuItems = [
    { name: "Dashboard", icon: "▦", path: "/passenger/dashboard" },
    { name: "Book Taxi", icon: "🚕", path: "/passenger/book-taxi" },
    { name: "My Bookings", icon: "📋", path: "/passenger/bookings" },
    { name: "Track Booking", icon: "📍", path: "/passenger/tracking" },
    { name: "Notifications", icon: "🔔", path: "/passenger/notifications" },
    { name: "My Profile", icon: "👤", path: "/passenger/profile" },
  ];

  return (
    <>
      <style>{`
        .passenger-layout {
          min-height: 100vh;
          background: #f4f7fa;
        }

        .passenger-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 250px;
          height: 100vh;
          background: #0b2946;
          color: white;
          display: flex;
          flex-direction: column;
          z-index: 1000;
          font-family: Arial, Helvetica, sans-serif;
        }

        .passenger-main-content {
          margin-left: 250px;
          width: calc(100% - 250px);
          min-height: 100vh;
        }

        .passenger-sidebar-header {
          padding: 26px 22px;
          border-bottom: 1px solid rgba(255,255,255,0.12);
        }

        .passenger-sidebar-header h2 {
          margin: 0;
          font-size: 22px;
          color: white;
        }

        .passenger-sidebar-header p {
          margin: 4px 0 0;
          color: rgba(255,255,255,0.6);
          font-size: 10px;
        }

        .passenger-sidebar-menu {
          flex: 1;
          padding: 20px 12px;
          overflow-y: auto;
        }

        .passenger-sidebar-label {
          display: block;
          margin-bottom: 10px;
          padding: 0 10px;
          color: rgba(255,255,255,0.45);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .passenger-nav-link {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 5px;
          padding: 11px 12px;
          border-radius: 7px;
          color: rgba(255,255,255,0.78);
          text-decoration: none;
          font-size: 11px;
          font-weight: 600;
        }

        .passenger-nav-link:hover {
          background: rgba(255,255,255,0.08);
          color: white;
        }

        .passenger-nav-link.active {
          background: #f6c20d;
          color: #0b2946;
          font-weight: 800;
        }

        .passenger-nav-icon {
          width: 22px;
          text-align: center;
        }

        .passenger-sidebar-bottom {
          padding: 16px;
          border-top: 1px solid rgba(255,255,255,0.12);
        }

        .passenger-profile-small {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: rgba(255,255,255,0.06);
          border-radius: 8px;
        }

        .passenger-avatar {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f6c20d;
          color: #0b2946;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 800;
        }

        .passenger-profile-small strong {
          display: block;
          font-size: 10px;
          color: white;
        }

        .passenger-profile-small span {
          display: block;
          margin-top: 3px;
          color: rgba(255,255,255,0.55);
          font-size: 8px;
        }

        @media(max-width: 800px) {
          .passenger-sidebar {
            width: 210px;
          }

          .passenger-main-content {
            margin-left: 210px;
            width: calc(100% - 210px);
          }
        }
      `}</style>

      <aside className="passenger-sidebar">
        <div className="passenger-sidebar-header">
          <h2>MMC Taxi</h2>
          <p>Passenger Portal</p>
        </div>

        <nav className="passenger-sidebar-menu">
          <span className="passenger-sidebar-label">
            PASSENGER MENU
          </span>

          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `passenger-nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="passenger-nav-icon">
                {item.icon}
              </span>

              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="passenger-sidebar-bottom">
          <div className="passenger-profile-small">
            <div className="passenger-avatar">NP</div>

            <div>
              <strong>Nadeesha Perera</strong>
              <span>Passenger Account</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default PassengerSidebar;