import { NavLink } from "react-router-dom";

function DriverSidebar() {
  const menuItems = [
    {
      name: "Dashboard",
      icon: "▦",
      path: "/driver/dashboard",
    },
    {
      name: "Trip Requests",
      icon: "📋",
      path: "/driver/requests",
    },
    {
      name: "My Trips",
      icon: "🚕",
      path: "/driver/trips",
    },
    {
      name: "Location & Status",
      icon: "📍",
      path: "/driver/location",
    },
    {
      name: "Notifications",
      icon: "🔔",
      path: "/driver/notifications",
    },
    {
      name: "My Profile",
      icon: "👤",
      path: "/driver/profile",
    },
  ];

  return (
    <>
      <style>{`
        .driver-layout {
          min-height: 100vh;
          background: #f4f7fa;
        }

        .driver-sidebar {
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

        .driver-main-content {
          margin-left: 250px;

          width: calc(100% - 250px);
          min-height: 100vh;
        }

        .driver-sidebar-header {
          padding: 26px 22px;

          border-bottom: 1px solid rgba(255,255,255,0.12);
        }

        .driver-sidebar-logo h2 {
          margin: 0;

          color: white;

          font-size: 22px;
          font-weight: 800;
        }

        .driver-sidebar-logo p {
          margin: 4px 0 0;

          color: rgba(255,255,255,0.65);

          font-size: 10px;
        }

        .driver-sidebar-menu {
          flex: 1;

          padding: 20px 12px;

          overflow-y: auto;
        }

        .driver-sidebar-label {
          display: block;

          margin-bottom: 10px;
          padding: 0 10px;

          color: rgba(255,255,255,0.45);

          font-size: 8px;
          font-weight: 700;

          letter-spacing: 1px;
        }

        .driver-nav-link {
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

          transition: 0.2s;
        }

        .driver-nav-link:hover {
          background: rgba(255,255,255,0.08);

          color: white;
        }

        .driver-nav-link.active {
          background: #f6c20d;

          color: #0b2946;

          font-weight: 800;
        }

        .driver-nav-icon {
          width: 22px;

          text-align: center;

          font-size: 15px;
        }

        .driver-sidebar-bottom {
          padding: 16px;

          border-top: 1px solid rgba(255,255,255,0.12);
        }

        .driver-profile-small {
          display: flex;
          align-items: center;

          gap: 10px;

          padding: 10px;

          background: rgba(255,255,255,0.06);

          border-radius: 8px;
        }

        .driver-avatar {
          width: 36px;
          height: 36px;

          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          background: #f6c20d;
          color: #0b2946;

          border-radius: 50%;

          font-size: 11px;
          font-weight: 800;
        }

        .driver-profile-small strong {
          display: block;

          color: white;

          font-size: 10px;
        }

        .driver-profile-small span {
          display: block;

          margin-top: 3px;

          color: rgba(255,255,255,0.55);

          font-size: 8px;
        }

        @media (max-width: 800px) {
          .driver-sidebar {
            width: 210px;
          }

          .driver-main-content {
            margin-left: 210px;

            width: calc(100% - 210px);
          }
        }
      `}</style>

      <aside className="driver-sidebar">

        <div className="driver-sidebar-header">
          <div className="driver-sidebar-logo">
            <h2>MMC Taxi</h2>
            <p>Driver Portal</p>
          </div>
        </div>

        <nav className="driver-sidebar-menu">

          <span className="driver-sidebar-label">
            DRIVER MENU
          </span>

          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `driver-nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="driver-nav-icon">
                {item.icon}
              </span>

              {item.name}
            </NavLink>
          ))}

        </nav>

        <div className="driver-sidebar-bottom">

          <div className="driver-profile-small">

            <div className="driver-avatar">
              KP
            </div>

            <div>
              <strong>Kasun Perera</strong>
              <span>Verified Driver</span>
            </div>

          </div>

        </div>

      </aside>
    </>
  );
}

export default DriverSidebar;