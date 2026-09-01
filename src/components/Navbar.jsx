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
        }

        .navbar-brand span {
          color: white;
          font-size: 20px;
          font-weight: 800;
          white-space: nowrap;
        }

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

        .navbar-login {
          background: #ffc107 !important;
          color: #0b2946 !important;

          padding: 10px 23px;

          border-radius: 6px;

          font-weight: 800 !important;

          transition: 0.2s;
        }

        .navbar-login:hover {
          background: #e7ad00 !important;
          color: #0b2946 !important;
        }

        @media (max-width: 950px) {
          .navbar-container {
            flex-direction: column;
            justify-content: center;

            padding: 15px 0;
          }

          .navbar-links {
            flex-wrap: wrap;
            justify-content: center;
          }
        }

        @media (max-width: 600px) {
          .navbar-brand {
            flex-direction: column;
            gap: 7px;
          }

          .navbar-brand span {
            font-size: 17px;
          }

          .navbar-logo {
            width: 60px;
            height: 55px;
          }

          .navbar-links {
            gap: 14px;
          }

          .navbar-links a {
            font-size: 12px;
          }

          .navbar-login {
            padding: 8px 17px;
          }
        }
      `}</style>

      <nav className="taxi-navbar">
        <div className="navbar-container">

          <Link to="/" className="navbar-brand">
            <img
              src="/logo.png"
              alt="Makumbura Multimodal Centre"
              className="navbar-logo"
            />

            <span>Taxi Service - MMC</span>
          </Link>

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