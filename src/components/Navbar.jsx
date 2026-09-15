import { Link } from "react-router-dom";

function Navbar() {
  return (
    <>
      <style>{`
        .taxi-navbar {
          width: 100%;
          background: #0b2946;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.18);
          position: relative;
          z-index: 3000;
        }

        .navbar-container {
          width: 92%;
          max-width: 1250px;
          margin: auto;
          min-height: 88px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 30px;
        }

        /* ================================
           BRAND
        ================================= */

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 14px;

          text-decoration: none;
          flex-shrink: 0;
        }

        .navbar-logo {
          width: 70px;
          height: 62px;

          object-fit: contain;

          background: white;
          border-radius: 7px;
          padding: 4px;

          flex-shrink: 0;
        }

        .navbar-brand span {
          color: white;

          font-size: 20px;
          font-weight: 800;

          white-space: nowrap;
        }

        /* ================================
           NAVIGATION
        ================================= */

        .navbar-links {
          display: flex;
          align-items: center;

          gap: 27px;
        }

        .navbar-links a {
          color: white;
          text-decoration: none;

          font-size: 14px;
          font-weight: 600;

          transition: 0.2s;
        }

        .navbar-links a:hover {
          color: #ffc107;
        }

        /* LOGIN BUTTON */

        .navbar-login {
          background: #ffc107 !important;
          color: #0b2946 !important;

          padding: 10px 23px;

          border-radius: 6px;

          font-weight: 800 !important;
        }

        .navbar-login:hover {
          background: #e7ad00 !important;
          color: #0b2946 !important;
        }

        /* =================================
           TABLET
        ================================== */

        @media (max-width: 950px) {

          .navbar-container {
            width: 94%;

            min-height: auto;

            flex-direction: column;

            justify-content: center;
            align-items: center;

            gap: 14px;

            padding: 16px 0;
          }

          .navbar-brand {
            justify-content: center;
          }

          .navbar-links {
            width: 100%;

            justify-content: center;
            flex-wrap: wrap;

            gap: 10px 18px;
          }

          .navbar-links a {
            font-size: 13px;
          }

          .navbar-login {
            padding: 9px 20px;
          }
        }

        /* =================================
           MOBILE
        ================================== */

        @media (max-width: 600px) {

          .taxi-navbar {
            width: 100%;
          }

          .navbar-container {
            width: 100%;

            padding: 14px 16px 16px;

            flex-direction: column;

            align-items: center;

            gap: 15px;
          }

          /* BRAND */

          .navbar-brand {
            width: 100%;

            display: flex;

            justify-content: center;
            align-items: center;

            gap: 10px;
          }

          .navbar-logo {
            width: 52px;
            height: 48px;

            padding: 3px;
          }

          .navbar-brand span {
            font-size: 18px;

            white-space: nowrap;
          }

          /* MENU */

          .navbar-links {
            width: 100%;

            display: flex;

            flex-direction: row;
            flex-wrap: wrap;

            justify-content: center;
            align-items: center;

            gap: 8px 14px;
          }

          .navbar-links a {
            display: inline-flex;

            align-items: center;
            justify-content: center;

            padding: 7px 5px;

            font-size: 12px;

            white-space: nowrap;
          }

          /* LOGIN */

          .navbar-login {
            padding: 8px 16px !important;

            border-radius: 6px;
          }
        }

        /* =================================
           VERY SMALL PHONES
        ================================== */

        @media (max-width: 400px) {

          .navbar-container {
            padding-left: 10px;
            padding-right: 10px;
          }

          .navbar-logo {
            width: 46px;
            height: 43px;
          }

          .navbar-brand span {
            font-size: 16px;
          }

          .navbar-links {
            gap: 5px 10px;
          }

          .navbar-links a {
            font-size: 11px;

            padding: 6px 3px;
          }

          .navbar-login {
            padding: 7px 13px !important;
          }
        }
      `}</style>

      <nav className="taxi-navbar">
        <div className="navbar-container">

          {/* LOGO + NAME */}

          <Link
            to="/"
            className="navbar-brand"
          >
            <img
              src="/logo.png"
              alt="Makumbura Multimodal Centre"
              className="navbar-logo"
            />

            <span>
              Taxi Service - MMC
            </span>
          </Link>

          {/* NAVIGATION LINKS */}

          <div className="navbar-links">

            <Link to="/">
              Home
            </Link>

            <Link to="/about">
              About
            </Link>

            <Link to="/services">
              Services
            </Link>

            <Link to="/vehicles">
              Vehicles
            </Link>

            <Link to="/contact">
              Contact
            </Link>

            <Link
              to="/login"
              className="navbar-login"
            >
              Login
            </Link>

          </div>

        </div>
      </nav>
    </>
  );
}

export default Navbar;