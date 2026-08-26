import { Link } from "react-router-dom";
import backgroundImage from '../../assets/taxi-background.jpg';


function Home() {
  return (
    <div
      className="home-page"
      style={{
        backgroundImage: `linear-gradient(
          rgba(0, 0, 0, 0.62),
          rgba(0, 0, 0, 0.62)
        ), url(${backgroundImage})`,
      }}
    >

      {/* Hero Content */}
      <section className="hero-section">

        <div className="container">
          <div className="row align-items-center min-vh-75">

            <div className="col-lg-8 text-white">

              <span className="hero-badge">
                Makumbura Multimodal Centre
              </span>

              <h1 className="hero-title">
                Your Journey,
                <br />
                <span>Our Responsibility.</span>
              </h1>

              <p className="hero-description">
                Book a reliable taxi from Makumbura Multimodal Centre
                and travel safely and comfortably to your destination.
              </p>

              <div className="hero-buttons">

                <Link
                  to="/book-taxi"
                  className="btn btn-warning btn-lg px-5 me-3"
                >
                  Book a Taxi
                </Link>

                <Link
                  to="/vehicles"
                  className="btn btn-outline-light btn-lg px-5"
                >
                  View Vehicles
                </Link>

              </div>

            </div>

          </div>
        </div>

      </section>


      {/* Vehicle Types */}
      <section className="vehicle-section">

        <div className="container">

          <div className="text-center text-white mb-5">

            <h2 className="section-title">
              Choose Your Vehicle
            </h2>

            <p>
              Select the vehicle that best suits your journey.
            </p>

          </div>


          <div className="row g-4">

            {/* Car */}
            <div className="col-md-4">

              <div className="vehicle-card">

                <div className="vehicle-icon">
                  🚗
                </div>

                <h4>Car</h4>

                <p>
                  Comfortable and convenient transportation
                  for your journey.
                </p>

                <Link
                  to="/book-taxi"
                  className="btn btn-warning"
                >
                  Book Car
                </Link>

              </div>

            </div>


            {/* Three Wheeler */}
            <div className="col-md-4">

              <div className="vehicle-card">

                <div className="vehicle-icon">
                  🛺
                </div>

                <h4>Three Wheeler</h4>

                <p>
                  An affordable and convenient option
                  for local journeys.
                </p>

                <Link
                  to="/book-taxi"
                  className="btn btn-warning"
                >
                  Book Three Wheeler
                </Link>

              </div>

            </div>


            {/* Bike */}
            <div className="col-md-4">

              <div className="vehicle-card">

                <div className="vehicle-icon">
                  🏍️
                </div>

                <h4>Bike</h4>

                <p>
                  A quick and convenient option
                  for your journey.
                </p>

                <Link
                  to="/book-taxi"
                  className="btn btn-warning"
                >
                  Book Bike
                </Link>

              </div>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Home;