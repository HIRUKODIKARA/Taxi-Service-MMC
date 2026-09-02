import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

function PassengerSidebar() {
  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:5171/api";

  const [profile, setProfile] = useState({
    fullName: "Passenger",
  });

  const menuItems = [
    { name: "Dashboard", icon: "▦", path: "/passenger/dashboard" },
    { name: "Book Taxi", icon: "🚕", path: "/passenger/book-taxi" },
    { name: "My Bookings", icon: "📋", path: "/passenger/bookings" },
    { name: "Track Booking", icon: "📍", path: "/passenger/tracking" },
    { name: "Notifications", icon: "🔔", path: "/passenger/notifications" },
    { name: "My Profile", icon: "👤", path: "/passenger/profile" },
  ];

  const getToken = () =>
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("accessToken") ||
    "";

  const loadProfile = async () => {
    const token = getToken();

    if (!token) {
      setProfile({ fullName: "Passenger" });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const data = await response.json();

      setProfile({
        fullName: data.fullName || "Passenger",
      });
    } catch (error) {
      console.error("Sidebar profile error:", error);
    }
  };

  useEffect(() => {
    loadProfile();

    const handleProfileUpdated = () => loadProfile();

    window.addEventListener(
      "passenger-profile-updated",
      handleProfileUpdated
    );

    return () => {
      window.removeEventListener(
        "passenger-profile-updated",
        handleProfileUpdated
      );
    };
  }, []);

  const handleLogout = () => {
    ["token", "authToken", "accessToken", "user"].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    navigate("/login", { replace: true });
  };

  const initials = useMemo(() => {
    const parts = (profile.fullName || "Passenger")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) return "P";

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (
      parts[0][0] + parts[parts.length - 1][0]
    ).toUpperCase();
  }, [profile.fullName]);

  return (
    <>
      <style>{`
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
          margin-bottom: 10px;
        }

        .passenger-avatar {
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

        .passenger-logout-btn {
          width: 100%;
          border: 1px solid rgba(255,255,255,.20);
          background: transparent;
          color: rgba(255,255,255,.85);
          padding: 10px 12px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 9px;
          font-weight: 700;
        }

        .passenger-logout-btn:hover {
          background: rgba(255,255,255,.08);
          color: white;
        }

        @media(max-width: 800px) {
          .passenger-sidebar {
            width: 210px;
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
                `passenger-nav-link ${
                  isActive ? "active" : ""
                }`
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
            <div className="passenger-avatar">
              {initials}
            </div>

            <div>
              <strong>{profile.fullName}</strong>
              <span>Passenger Account</span>
            </div>
          </div>

          <button
            type="button"
            className="passenger-logout-btn"
            onClick={handleLogout}
          >
            ↪ Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default PassengerSidebar;
