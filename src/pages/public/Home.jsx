import { Link } from "react-router-dom";

function Home() {
  return (
    <>
      <style>{`

        .home-page {
          width: 100%;
          background: #ffffff;
          font-family: Arial, Helvetica, sans-serif;
        }

        .home-container {
          width: 90%;
          max-width: 1200px;
          margin: auto;
        }

        /* =========================
           HERO
        ========================= */

        .home-hero {
          position: relative;
          min-height: 590px;

          background-image: url("/taxi-background.jpg");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;

          display: flex;
          align-items: center;
        }

        .home-overlay {
          position: absolute;
          inset: 0;

          background: linear-gradient(
            90deg,
            rgba(5, 21, 37, 0.90),
            rgba(5, 21, 37, 0.65),
            rgba(5, 21, 37, 0.25)
          );
        }

        .hero-content {
          position: relative;
          z-index: 2;
        }

        .hero-text {
          max-width: 650px;
        }

        .hero-label {
          display: inline-block;

          background: #ffc107;
          color: #111;

          padding: 9px 18px;
          border-radius: 25px;

          font-size: 13px;
          font-weight: 700;

          margin-bottom: 22px;
        }

        .hero-text h1 {
          margin: 0 0 22px;

          color: white;

          font-size: 58px;
          line-height: 1.08;
          font-weight: 800;
        }

        .hero-text h1 span {
          color: #ffc107;
        }

        .hero-text p {
          max-width: 590px;

          margin: 0 0 30px;

          color: rgba(255,255,255,0.92);

          font-size: 17px;
          line-height: 1.7;
        }

        .hero-buttons {
          display: flex;
          gap: 14px;
        }

        .primary-btn {
          display: inline-block;

          background: #ffc107;
          color: #111;

          padding: 12px 28px;

          border-radius: 6px;

          text-decoration: none;

          font-weight: 700;
          font-size: 14px;
        }

        .primary-btn:hover {
          background: #e7ad00;
        }

        .outline-btn {
          display: inline-block;

          border: 1px solid white;

          color: white;

          padding: 12px 28px;

          border-radius: 6px;

          text-decoration: none;

          font-weight: 700;
          font-size: 14px;
        }

        .outline-btn:hover {
          background: white;
          color: #0b2946;
        }


        /* =========================
           FEATURES
        ========================= */

        .features-section {
          background: white;
          padding-bottom: 70px;
        }

        .features-box {
          position: relative;
          z-index: 10;

          margin-top: -50px;

          display: grid;
          grid-template-columns: repeat(4, 1fr);

          background: white;

          border-radius: 12px;

          box-shadow: 0 10px 30px rgba(0,0,0,0.12);

          overflow: hidden;
        }

        .feature-card {
          padding: 30px 20px;

          text-align: center;

          border-right: 1px solid #eeeeee;
        }

        .feature-card:last-child {
          border-right: none;
        }

        .feature-icon {
          width: 48px;
          height: 48px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin: 0 auto 15px;

          background: #fff6d5;

          border-radius: 8px;

          font-size: 22px;
        }

        .feature-card h3 {
          margin: 0 0 8px;

          color: #0b2946;

          font-size: 16px;
          font-weight: 700;
        }

        .feature-card p {
          margin: 0;

          color: #6c757d;

          font-size: 13px;
          line-height: 1.6;
        }


        /* =========================
           SERVICES
        ========================= */

        .services-home {
          padding: 25px 0 90px;
          background: #ffffff;
        }

        .section-title {
          text-align: center;
          margin-bottom: 40px;
        }

        .section-title h2 {
          margin: 0;

          color: #0b2946;

          font-size: 34px;
          font-weight: 800;
        }

        .title-line {
          width: 45px;
          height: 3px;

          background: #ffc107;

          margin: 10px auto 15px;
        }

        .section-title p {
          margin: 0;

          color: #6c757d;

          font-size: 14px;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);

          gap: 18px;
        }

        .service-home-card {
          padding: 30px 20px;

          text-align: center;

          border: 1px solid #e1e6ec;

          border-radius: 9px;

          background: white;

          transition: 0.3s;
        }

        .service-home-card:hover {
          transform: translateY(-5px);

          border-color: #ffc107;

          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
        }

        .service-icon {
          width: 48px;
          height: 48px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin: 0 auto 15px;

          background: #fff6d5;

          border-radius: 8px;

          font-size: 22px;
        }

        .service-home-card h3 {
          margin: 0 0 10px;

          color: #0b2946;

          font-size: 17px;
        }

        .service-home-card p {
          min-height: 65px;

          margin: 0 0 12px;

          color: #6c757d;

          font-size: 13px;
          line-height: 1.6;
        }

        .service-home-card a {
          color: #d6a100;

          text-decoration: none;

          font-size: 13px;
          font-weight: 700;
        }


        /* =========================
           CTA
        ========================= */

        .home-cta {
          padding: 70px 20px;

          text-align: center;

          background: #0b2946;
        }

        .home-cta h2 {
          margin: 0 0 12px;

          color: white;

          font-size: 32px;
          font-weight: 800;
        }

        .home-cta p {
          margin: 0 0 25px;

          color: rgba(255,255,255,0.75);

          font-size: 14px;
        }


        /* =========================
           RESPONSIVE
        ========================= */

        @media (max-width: 900px) {

          .features-box,
          .services-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .hero-text h1 {
            font-size: 46px;
          }

        }

        @media (max-width: 600px) {

          .home-hero {
            min-height: 520px;
          }

          .hero-text {
            text-align: center;
          }

          .hero-text h1 {
            font-size: 38px;
          }

          .hero-buttons {
            flex-direction: column;
          }

          .features-box,
          .services-grid {
            grid-template-columns: 1fr;
          }

          .feature-card {
            border-right: none;
            border-bottom: 1px solid #eeeeee;
          }

        }

      `}</style>

      <main className="home-page">

        {/* HERO SECTION */}
        <section className="home-hero">

          <div className="home-overlay"></div>

          <div className="home-container hero-content">

            <div className="hero-text">

              <span className="hero-label">
                Makumbura Multimodal Centre
              </span>

              <h1>
                Your Journey,
                <br />
                <span>Our Responsibility.</span>
              </h1>

              <p>
                Book a reliable taxi from Makumbura Multimodal Centre
                and travel safely and comfortably to your destination.
              </p>

              <div className="hero-buttons">

                <Link
                  to="/book-taxi"
                  className="primary-btn"
                >
                  Book a Taxi
                </Link>

                <Link
                  to="/services"
                  className="outline-btn"
                >
                  Learn More
                </Link>

              </div>

            </div>

          </div>

        </section>


        {/* FEATURES */}
        <section className="features-section">

          <div className="home-container">

            <div className="features-box">

              <div className="feature-card">
                <div className="feature-icon">⚡</div>

                <h3>Easy Booking</h3>

                <p>
                  Book your taxi in just a few simple steps.
                </p>
              </div>


              <div className="feature-card">
                <div className="feature-icon">🛡️</div>

                <h3>Safe & Secure</h3>

                <p>
                  Travel with registered and verified drivers.
                </p>
              </div>


              <div className="feature-card">
                <div className="feature-icon">🚕</div>

                <h3>Multiple Vehicles</h3>

                <p>
                  Choose from cars, three-wheelers and bikes.
                </p>
              </div>


              <div className="feature-card">
                <div className="feature-icon">☎️</div>

                <h3>Taxi Operations</h3>

                <p>
                  Get support through Makumbura Taxi Operations.
                </p>
              </div>

            </div>

          </div>

        </section>


        {/* SERVICES */}
        <section className="services-home">

          <div className="home-container">

            <div className="section-title">

              <h2>Our Services</h2>

              <div className="title-line"></div>

              <p>
                Select the taxi service that suits your journey.
              </p>

            </div>


            <div className="services-grid">

              <div className="service-home-card">

                <div className="service-icon">🚗</div>

                <h3>Car Service</h3>

                <p>
                  Comfortable transportation for individual and
                  family journeys.
                </p>

                <Link to="/book-taxi">
                  Book Now
                </Link>

              </div>


              <div className="service-home-card">

                <div className="service-icon">🛺</div>

                <h3>Three Wheeler</h3>

                <p>
                  Affordable and convenient transportation for
                  shorter journeys.
                </p>

                <Link to="/book-taxi">
                  Book Now
                </Link>

              </div>


              <div className="service-home-card">

                <div className="service-icon">🏍️</div>

                <h3>Bike Service</h3>

                <p>
                  Quick transportation for individual passengers.
                </p>

                <Link to="/book-taxi">
                  Book Now
                </Link>

              </div>


              <div className="service-home-card">

                <div className="service-icon">📞</div>

                <h3>Operations Booking</h3>

                <p>
                  Book a taxi through Makumbura Taxi Operations.
                </p>

                <Link to="/contact">
                  Contact Us
                </Link>

              </div>

            </div>

          </div>

        </section>


        {/* CTA */}
        <section className="home-cta">

          <div className="home-container">

            <h2>
              Ready to Start Your Journey?
            </h2>

            <p>
              Find a suitable vehicle and book your taxi today.
            </p>

            <Link
              to="/book-taxi"
              className="primary-btn"
            >
              Book a Taxi
            </Link>

          </div>

        </section>

      </main>
    </>
  );
}

export default Home;