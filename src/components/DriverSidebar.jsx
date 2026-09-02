import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

const API_BASE_URL =
  "http://localhost:5171/api";

function DriverSidebar() {
  const navigate = useNavigate();

  const [profile, setProfile] =
    useState({
      fullName: "Driver",
    });

  const [verified, setVerified] =
    useState(false);

  const [logoError, setLogoError] =
    useState(false);

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

  /* =========================================================
     TOKEN
  ========================================================= */

  const getToken = () =>
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem(
      "accessToken"
    ) ||
    "";

  /* =========================================================
     LOGOUT
  ========================================================= */

  const clearLoginData = () => {
    localStorage.removeItem("token");
    localStorage.removeItem(
      "authToken"
    );
    localStorage.removeItem(
      "accessToken"
    );
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem(
      "authToken"
    );
    sessionStorage.removeItem(
      "accessToken"
    );
    sessionStorage.removeItem("user");
  };

  const handleLogout = () => {
    clearLoginData();

    navigate("/login", {
      replace: true,
    });
  };

  /* =========================================================
     LOAD DRIVER
  ========================================================= */

  const loadSidebarProfile =
    async () => {
      const token = getToken();

      if (!token) {
        return;
      }

      try {
        const headers = {
          Authorization:
            `Bearer ${token}`,
        };

        const [
          userResponse,
          driverResponse,
        ] = await Promise.all([
          fetch(
            `${API_BASE_URL}/users/me`,
            {
              headers,
            }
          ),

          fetch(
            `${API_BASE_URL}/drivers/me`,
            {
              headers,
            }
          ),
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
          const user =
            await userResponse.json();

          setProfile({
            fullName:
              user.fullName ||
              "Driver",
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
          "Driver sidebar error:",
          error
        );
      }
    };

  /* =========================================================
     LOAD + LISTEN FOR PROFILE UPDATE
  ========================================================= */

  useEffect(() => {
    loadSidebarProfile();

    const handleProfileUpdate =
      () => {
        loadSidebarProfile();
      };

    window.addEventListener(
      "driver-profile-updated",
      handleProfileUpdate
    );

    return () => {
      window.removeEventListener(
        "driver-profile-updated",
        handleProfileUpdate
      );
    };
  }, []);

  /* =========================================================
     INITIALS
  ========================================================= */

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

    return `${parts[0][0]}${
      parts[parts.length - 1][0]
    }`.toUpperCase();
  }, [profile.fullName]);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      <style>{`
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

          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .driver-sidebar-header {
          padding: 25px 20px;

          border-bottom:
            1px solid
            rgba(255,255,255,.12);
        }

        .driver-sidebar-brand {
          display: flex;
          align-items: center;

          gap: 11px;
        }

        .driver-logo-box {
          width: 48px;
          height: 48px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          background: white;

          border-radius: 9px;

          overflow: hidden;
        }

        .driver-logo-box img {
          width: 100%;
          height: 100%;

          object-fit: contain;

          padding: 4px;

          box-sizing: border-box;
        }

        .driver-logo-fallback {
          color: #0b2946;

          font-size: 12px;
          font-weight: 900;

          text-align: center;
        }

        .driver-brand-text h2 {
          margin: 0;

          color: white;

          font-size: 21px;
          font-weight: 800;
        }

        .driver-brand-text p {
          margin: 4px 0 0;

          color:
            rgba(255,255,255,.66);

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

          color:
            rgba(255,255,255,.45);

          font-size: 8px;
          font-weight: 800;

          letter-spacing: 1px;
        }

        .driver-nav-link {
          display: flex;
          align-items: center;

          gap: 11px;

          margin-bottom: 5px;

          padding: 12px;

          border-radius: 7px;

          color:
            rgba(255,255,255,.8);

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
        }

        .driver-sidebar-bottom {
          padding: 16px;

          border-top:
            1px solid
            rgba(255,255,255,.12);
        }

        .driver-profile-small {
          display: flex;
          align-items: center;

          gap: 10px;

          padding: 11px;

          background:
            rgba(255,255,255,.07);

          border-radius: 8px;
        }

        .driver-avatar {
          width: 38px;
          height: 38px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #f6c20d;

          color: #0b2946;

          border-radius: 50%;

          font-size: 11px;
          font-weight: 900;
        }

        .driver-profile-info {
          min-width: 0;

          flex: 1;
        }

        .driver-profile-info strong {
          display: block;

          color: white;

          font-size: 10px;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .driver-profile-info span {
          display: block;

          margin-top: 3px;

          color:
            rgba(255,255,255,.58);

          font-size: 8px;
        }

        .driver-logout {
          width: 100%;

          margin-top: 10px;

          padding: 10px;

          border:
            1px solid
            rgba(255,255,255,.18);

          background:
            rgba(255,255,255,.05);

          color: white;

          border-radius: 7px;

          font-size: 10px;
          font-weight: 700;

          cursor: pointer;

          transition: .2s;
        }

        .driver-logout:hover {
          background: #f6c20d;

          border-color: #f6c20d;

          color: #0b2946;
        }

        @media(max-width:800px) {
          .driver-sidebar {
            width: 210px;
          }

          .driver-logo-box {
            width: 40px;
            height: 40px;
          }

          .driver-brand-text h2 {
            font-size: 17px;
          }
        }
      `}</style>

      <aside className="driver-sidebar">

        {/* LOGO */}

        <div className="driver-sidebar-header">

          <div className="driver-sidebar-brand">

            <div className="driver-logo-box">

              {!logoError ? (
                <img
                  src="/makumbura-logo.png"
                  alt="Makumbura Multimodal Center Logo"
                  onError={() =>
                    setLogoError(true)
                  }
                />
              ) : (
                <div className="driver-logo-fallback">
                  MMC
                </div>
              )}

            </div>

            <div className="driver-brand-text">
              <h2>MMC Taxi</h2>
              <p>Driver Portal</p>
            </div>

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
            className="driver-logout"
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