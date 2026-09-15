import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

function PassengerSidebar() {
  const navigate = useNavigate();

  const API_BASE_URL = "http://localhost:5171/api";

  const [mobileOpen, setMobileOpen] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "Passenger",
  });

  const menuItems = [
    {
      name: "Dashboard",
      icon: "▦",
      path: "/passenger/dashboard",
    },
    {
      name: "Book Taxi",
      icon: "🚕",
      path: "/passenger/book-taxi",
    },
    {
      name: "My Bookings",
      icon: "📋",
      path: "/passenger/bookings",
    },
    {
      name: "Track Booking",
      icon: "📍",
      path: "/passenger/tracking",
    },
    {
      name: "Notifications",
      icon: "🔔",
      path: "/passenger/notifications",
    },
    {
      name: "My Profile",
      icon: "👤",
      path: "/passenger/profile",
    },
  ];

  // =========================================================
  // GET TOKEN
  // =========================================================

  const getToken = () =>
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("accessToken") ||
    "";

  // =========================================================
  // LOAD PASSENGER PROFILE
  // =========================================================

  const loadProfile = async () => {
    const token = getToken();

    if (!token) {
      setProfile({
        fullName: "Passenger",
      });

      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setProfile({
        fullName: data.fullName || "Passenger",
      });
    } catch (error) {
      console.error("Passenger sidebar profile error:", error);
    }
  };

  // =========================================================
  // LOAD PROFILE
  // =========================================================

  useEffect(() => {
    loadProfile();

    const handleProfileUpdated = () => {
      loadProfile();
    };

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

  // =========================================================
  // LOGOUT
  // =========================================================

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

    navigate("/login", {
      replace: true,
    });
  };

  // =========================================================
  // PASSENGER INITIALS
  // =========================================================

  const initials = useMemo(() => {
    const parts = (profile.fullName || "Passenger")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) {
      return "P";
    }

    if (parts.length === 1) {
      return parts[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }, [profile.fullName]);

  return (
    <>
      <style>{`

        /* =====================================================
           PASSENGER SIDEBAR
        ===================================================== */

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

          z-index: 5000;

          font-family: Arial, Helvetica, sans-serif;

          box-sizing: border-box;

          transition: transform 0.25s ease;
        }


        /* =====================================================
           HEADER
        ===================================================== */

        .passenger-sidebar-header {
          padding: 22px 20px;

          border-bottom:
            1px solid rgba(255,255,255,0.12);

          flex-shrink: 0;
        }

        .passenger-brand {
          display: flex;
          align-items: center;

          gap: 12px;

          width: 100%;
        }


        /* =====================================================
           LOGO
        ===================================================== */

        .passenger-brand-logo {
          width: 48px;
          height: 48px;

          background: white;

          border-radius: 9px;

          display: flex;
          align-items: center;
          justify-content: center;

          overflow: hidden;

          flex-shrink: 0;
        }

        .passenger-brand-logo img {
          width: 100%;
          height: 100%;

          object-fit: contain;

          padding: 4px;

          box-sizing: border-box;
        }


        /* =====================================================
           BRAND TEXT
        ===================================================== */

        .passenger-brand-text {
          min-width: 0;

          flex: 1;
        }

        .passenger-brand-text h2 {
          margin: 0;

          color: white;

          font-size: 20px;
          font-weight: 800;

          white-space: nowrap;
        }

        .passenger-brand-text p {
          margin: 5px 0 0;

          color: rgba(255,255,255,0.65);

          font-size: 10px;

          white-space: nowrap;
        }


        /* =====================================================
           CLOSE BUTTON
        ===================================================== */

        .passenger-close-btn {
          display: none;

          align-items: center;
          justify-content: center;

          width: 42px;
          height: 42px;

          margin-left: auto;

          flex-shrink: 0;

          border: none;
          border-radius: 8px;

          background: #234968;

          color: white;

          font-size: 25px;
          font-weight: 700;

          line-height: 1;

          cursor: pointer;
        }

        .passenger-close-btn:hover {
          background: #315b7e;
        }


        /* =====================================================
           MENU
        ===================================================== */

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

          transition: 0.2s;
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

          font-size: 14px;

          flex-shrink: 0;
        }


        /* =====================================================
           PROFILE SECTION
        ===================================================== */

        .passenger-sidebar-bottom {
          padding: 16px;

          border-top:
            1px solid rgba(255,255,255,0.12);

          flex-shrink: 0;
        }

        .passenger-profile-small {
          display: flex;
          align-items: center;

          gap: 10px;

          padding: 10px;

          background:
            rgba(255,255,255,0.06);

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

        .passenger-profile-info {
          flex: 1;

          min-width: 0;
        }

        .passenger-profile-info strong {
          display: block;

          color: white;

          font-size: 10px;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;
        }

        .passenger-profile-info span {
          display: block;

          margin-top: 3px;

          color: rgba(255,255,255,0.55);

          font-size: 8px;
        }


        /* =====================================================
           LOGOUT BUTTON
        ===================================================== */

        .passenger-logout-btn {
          width: 100%;

          border:
            1px solid rgba(255,255,255,0.20);

          background: transparent;

          color: white;

          padding: 10px 12px;

          border-radius: 7px;

          cursor: pointer;

          font-size: 9px;
          font-weight: 700;

          transition: 0.2s;
        }

        .passenger-logout-btn:hover {
          background:
            rgba(255,255,255,0.08);
        }


        /* =====================================================
           MOBILE HAMBURGER
        ===================================================== */

        .passenger-mobile-btn {
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

          align-items: center;
          justify-content: center;
        }


        /* =====================================================
           MOBILE OVERLAY
        ===================================================== */

        .passenger-overlay {
          display: none;
        }


        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 1000px) and (min-width: 801px) {

          .passenger-sidebar {
            width: 210px;
          }

          .passenger-brand-logo {
            width: 42px;
            height: 42px;
          }

          .passenger-brand-text h2 {
            font-size: 18px;
          }

        }


        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 800px) {

          .passenger-mobile-btn {
            display: flex;
          }

          .passenger-sidebar {
            width: 285px;

            transform: translateX(-100%);

            z-index: 10000;

            box-shadow:
              5px 0 18px rgba(0,0,0,0.25);
          }

          .passenger-sidebar.mobile-open {
            transform: translateX(0);
          }

          .passenger-overlay {
            display: block;

            position: fixed;

            inset: 0;

            background:
              rgba(0,0,0,0.45);

            z-index: 9999;
          }

          .passenger-sidebar-header {
            padding: 20px;
          }

          .passenger-close-btn {
            display: flex;
          }

          .passenger-brand-logo {
            width: 48px;
            height: 48px;
          }

          .passenger-brand-text h2 {
            font-size: 19px;
          }

        }


        /* =====================================================
           SMALL PHONES
        ===================================================== */

        @media (max-width: 360px) {

          .passenger-sidebar {
            width: 270px;
          }

          .passenger-sidebar-header {
            padding: 18px 15px;
          }

          .passenger-brand {
            gap: 9px;
          }

          .passenger-brand-logo {
            width: 44px;
            height: 44px;
          }

          .passenger-brand-text h2 {
            font-size: 17px;
          }

          .passenger-close-btn {
            width: 38px;
            height: 38px;

            font-size: 22px;
          }

        }

      `}</style>


      {/* =====================================================
          MOBILE HAMBURGER
      ===================================================== */}

      {!mobileOpen && (
        <button
          type="button"
          className="passenger-mobile-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open passenger menu"
        >
          ☰
        </button>
      )}


      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileOpen && (
        <div
          className="passenger-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`passenger-sidebar ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >

        {/* HEADER */}

        <div className="passenger-sidebar-header">

          <div className="passenger-brand">

            {/* MMC LOGO */}

            <div className="passenger-brand-logo">

              <img
                src="/logo.png"
                alt="Makumbura Multimodal Centre"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />

            </div>


            {/* BRAND */}

            <div className="passenger-brand-text">

              <h2>
                MMC Taxi
              </h2>

              <p>
                Passenger Portal
              </p>

            </div>


            {/* CLOSE BUTTON */}

            {mobileOpen && (
              <button
                type="button"
                className="passenger-close-btn"
                onClick={() => setMobileOpen(false)}
                aria-label="Close passenger menu"
              >
                ×
              </button>
            )}

          </div>

        </div>


        {/* =====================================================
            MENU
        ===================================================== */}

        <nav className="passenger-sidebar-menu">

          <span className="passenger-sidebar-label">
            PASSENGER MENU
          </span>

          {menuItems.map((item) => (

            <NavLink
              key={item.name}

              to={item.path}

              onClick={() =>
                setMobileOpen(false)
              }

              className={({ isActive }) =>
                `passenger-nav-link ${
                  isActive ? "active" : ""
                }`
              }
            >

              <span className="passenger-nav-icon">
                {item.icon}
              </span>

              <span>
                {item.name}
              </span>

            </NavLink>

          ))}

        </nav>


        {/* =====================================================
            PROFILE + LOGOUT
        ===================================================== */}

        <div className="passenger-sidebar-bottom">

          <div className="passenger-profile-small">

            <div className="passenger-avatar">
              {initials}
            </div>

            <div className="passenger-profile-info">

              <strong>
                {profile.fullName}
              </strong>

              <span>
                Passenger Account
              </span>

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