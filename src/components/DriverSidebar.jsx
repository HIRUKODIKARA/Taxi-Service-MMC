import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

function DriverSidebar() {
  const API_BASE_URL = "http://localhost:5171/api";

  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "Driver",
  });

  const [verified, setVerified] = useState(false);

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

  /* =========================
     TOKEN
  ========================= */

  const getToken = () =>
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("accessToken") ||
    "";

  /* =========================
     CLEAR LOGIN DATA
  ========================= */

  const clearLoginData = () => {
    [
      "token",
      "authToken",
      "accessToken",
      "user",
    ].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  };

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = () => {
    clearLoginData();

    setMobileOpen(false);

    navigate("/login", {
      replace: true,
    });
  };

  /* =========================
     LOAD DRIVER PROFILE
  ========================= */

  const loadSidebarProfile = async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    try {
      const [userResponse, driverResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/users/me`, {
            headers,
          }),

          fetch(`${API_BASE_URL}/drivers/me`, {
            headers,
          }),
        ]);

      if (
        userResponse.status === 401 ||
        driverResponse.status === 401
      ) {
        clearLoginData();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      if (userResponse.ok) {
        const user = await userResponse.json();

        setProfile({
          fullName:
            user.fullName || "Driver",
        });
      }

      if (driverResponse.ok) {
        const driver =
          await driverResponse.json();

        setVerified(
          driver.verificationStatus ===
            "APPROVED"
        );
      }
    } catch (error) {
      console.error(
        "Driver sidebar profile error:",
        error
      );
    }
  };

  /* =========================
     PROFILE EFFECT
  ========================= */

  useEffect(() => {
    loadSidebarProfile();

    const handleProfileUpdated = () => {
      loadSidebarProfile();
    };

    window.addEventListener(
      "driver-profile-updated",
      handleProfileUpdated
    );

    return () => {
      window.removeEventListener(
        "driver-profile-updated",
        handleProfileUpdated
      );
    };
  }, []);

  /* =========================
     INITIALS
  ========================= */

  const initials = useMemo(() => {
    const parts = (
      profile.fullName || "Driver"
    )
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) {
      return "DR";
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
        /* =========================
           SIDEBAR
        ========================= */

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

          z-index: 5000;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          box-sizing: border-box;

          transition:
            transform 0.25s ease;
        }

        /* =========================
           HEADER
        ========================= */

        .driver-sidebar-header {
          padding: 26px 22px;

          border-bottom:
            1px solid
            rgba(255,255,255,.12);

          flex-shrink: 0;
        }

        .driver-sidebar-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .driver-sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .driver-sidebar-logo-image {
          width: 42px;
          height: 42px;

          object-fit: contain;

          background: white;

          border-radius: 8px;

          padding: 3px;

          flex-shrink: 0;
        }

        .driver-sidebar-logo-text {
          min-width: 0;
        }

        .driver-sidebar-logo-text h2 {
          margin: 0;

          color: white;

          font-size: 20px;
          font-weight: 800;

          white-space: nowrap;
        }

        .driver-sidebar-logo-text p {
          margin: 4px 0 0;

          color:
            rgba(255,255,255,.65);

          font-size: 10px;
        }

        /* =========================
           CLOSE BUTTON
        ========================= */

        .driver-sidebar-close {
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

        .driver-sidebar-close:hover {
          background:
            rgba(255,255,255,.18);
        }

        /* =========================
           MENU
        ========================= */

        .driver-sidebar-menu {
          flex: 1;

          padding: 20px 12px;

          overflow-y: auto;
        }

        .driver-sidebar-label {
          display: block;

          margin-bottom: 10px;

          padding: 0 10px;

          color:
            rgba(255,255,255,.45);

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

          color:
            rgba(255,255,255,.78);

          text-decoration: none;

          font-size: 11px;

          font-weight: 600;

          transition: .2s;
        }

        .driver-nav-link:hover {
          background:
            rgba(255,255,255,.08);

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

          flex-shrink: 0;
        }

        /* =========================
           BOTTOM PROFILE
        ========================= */

        .driver-sidebar-bottom {
          padding: 16px;

          border-top:
            1px solid
            rgba(255,255,255,.12);

          flex-shrink: 0;
        }

        .driver-profile-small {
          display: flex;

          align-items: center;

          gap: 10px;

          padding: 10px;

          background:
            rgba(255,255,255,.06);

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

        .driver-profile-info {
          flex: 1;
          min-width: 0;
        }

        .driver-profile-info strong {
          display: block;

          color: white;

          font-size: 10px;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;
        }

        .driver-profile-info span {
          display: block;

          margin-top: 3px;

          color:
            rgba(255,255,255,.55);

          font-size: 8px;
        }

        /* =========================
           LOGOUT
        ========================= */

        .driver-logout-button {
          width: 100%;

          margin-top: 10px;

          padding: 10px 12px;

          border: none;

          border-radius: 7px;

          background:
            rgba(255,255,255,.09);

          color: white;

          font-size: 10px;

          font-weight: 700;

          cursor: pointer;
        }

        .driver-logout-button:hover {
          background:
            rgba(255,255,255,.16);
        }

        /* =========================
           MOBILE MENU BUTTON
        ========================= */

        .driver-mobile-btn {
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
            0 3px 10px
            rgba(0,0,0,.15);
        }

        /* =========================
           OVERLAY
        ========================= */

        .driver-overlay {
          display: none;
        }

        /* =========================
           TABLET
        ========================= */

        @media (
          max-width: 1000px
        ) and (
          min-width: 761px
        ) {
          .driver-sidebar {
            width: 210px;
          }
        }

        /* =========================
           MOBILE
        ========================= */

        @media (max-width: 760px) {

          .driver-mobile-btn {
            display: block;
          }

          .driver-sidebar {
            width: min(280px, 82vw);

            transform:
              translateX(-100%);

            z-index: 10000;

            box-shadow:
              5px 0 20px
              rgba(0,0,0,.20);
          }

          .driver-sidebar.mobile-open {
            transform:
              translateX(0);
          }

          .driver-sidebar-close {
            display: flex;

            align-items: center;

            justify-content: center;
          }

          .driver-overlay {
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
          className="driver-mobile-btn"
          onClick={() =>
            setMobileOpen(true)
          }
          aria-label="Open menu"
        >
          ☰
        </button>
      )}

      {/* MOBILE OVERLAY */}

      {mobileOpen && (
        <div
          className="driver-overlay"
          onClick={() =>
            setMobileOpen(false)
          }
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`driver-sidebar ${
          mobileOpen
            ? "mobile-open"
            : ""
        }`}
      >
        {/* HEADER */}

        <div className="driver-sidebar-header">

          <div className="driver-sidebar-header-row">

            <div className="driver-sidebar-logo">

              <img
                src="/logo.png"
                alt="Makumbura Logo"
                className="driver-sidebar-logo-image"
              />

              <div className="driver-sidebar-logo-text">
                <h2>MMC Taxi</h2>
                <p>Driver Portal</p>
              </div>

            </div>

            <button
              type="button"
              className="driver-sidebar-close"
              onClick={() =>
                setMobileOpen(false)
              }
              aria-label="Close menu"
            >
              ×
            </button>

          </div>

        </div>

        {/* MENU */}

        <nav className="driver-sidebar-menu">

          <span className="driver-sidebar-label">
            DRIVER MENU
          </span>

          {menuItems.map((item) => (

            <NavLink
              key={item.name}
              to={item.path}

              onClick={() =>
                setMobileOpen(false)
              }

              className={({
                isActive,
              }) =>
                `driver-nav-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >

              <span className="driver-nav-icon">
                {item.icon}
              </span>

              {item.name}

            </NavLink>

          ))}

        </nav>

        {/* PROFILE */}

        <div className="driver-sidebar-bottom">

          <div className="driver-profile-small">

            <div className="driver-avatar">
              {initials}
            </div>

            <div className="driver-profile-info">

              <strong>
                {profile.fullName}
              </strong>

              <span>
                {verified
                  ? "Verified Driver"
                  : "Driver Account"}
              </span>

            </div>

          </div>

          <button
            type="button"
            className="driver-logout-button"
            onClick={handleLogout}
          >
            ↪ Logout
          </button>

        </div>

      </aside>
    </>
  );
}

export default DriverSidebar;