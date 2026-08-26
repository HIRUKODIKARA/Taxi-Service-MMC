function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg bg-white shadow-sm py-3">
      <div className="container">

        <a className="navbar-brand fw-bold" href="/">
        <img 
           src = "/logo.png"
           alt = "Taxi Service MMC Logo"
           stylle = {{
            height: "180px",
            width: "auto",
            objectFit: "contain",
            marginRight: "15px"
           }}
           />
           Taxi Service-MMC
        </a>

        <div className="ms-auto d-flex gap-4 align-items-center">

          <a className="nav-link" href="/">
            Home
          </a>

          <a className="nav-link" href="#">
            About
          </a>

          <a className="nav-link" href="#">
            Services
          </a>

          <a className="nav-link" href="#">
            Vehicles
          </a>

          <a className="nav-link" href="#">
            Contact
          </a>

          <button className="btn btn-warning px-4">
            Login
          </button>

        </div>

      </div>
    </nav>
  );
}

export default Navbar;