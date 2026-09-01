import { Link } from "react-router-dom";

function Services() {
  const services = [
    {
      icon: "🚗",
      title: "Car Service",
      description:
        "Comfortable and reliable taxi service for individual passengers, families and longer journeys.",
      features: [
        "Comfortable seating",
        "Suitable for family travel",
        "Verified drivers",
      ],
    },
    {
      icon: "🛺",
      title: "Three-Wheeler Service",
      description:
        "Affordable and convenient transport option for short-distance and local journeys.",
      features: [
        "Affordable travel",
        "Ideal for short trips",
        "Easy local transportation",
      ],
    },
    {
      icon: "🏍️",
      title: "Bike Service",
      description:
        "Quick transportation option for individual passengers who need a faster journey.",
      features: [
        "Fast transportation",
        "Suitable for one passenger",
        "Good for shorter routes",
      ],
    },
    {
      icon: "📞",
      title: "Taxi Operations Booking",
      description:
        "Passengers can also request a taxi by contacting or visiting Makumbura Taxi Operations.",
      features: [
        "Phone booking support",
        "On-site counter booking",
        "Driver and vehicle coordination",
      ],
    },
  ];

  return (
    <>
      <style>{`
        .services-page {
          min-height: 100vh;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
          color: #0b2946;
        }

        .services-hero {
          background: #0b2946;
          padding: 70px 20px;
          text-align: center;
        }

        .services-hero-content {
          width: 90%;
          max-width: 900px;
          margin: auto;
        }

        .services-hero-label {
          display: inline-block;
          background: #ffc107;
          color: #0b2946;
          padding: 7px 15px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 18px;
        }

        .services-hero h1 {
          margin: 0 0 13px;
          color: white;
          font-size: 42px;
          font-weight: 800;
        }

        .services-hero p {
          max-width: 700px;
          margin: auto;
          color: rgba(255,255,255,0.78);
          font-size: 15px;
          line-height: 1.7;
        }

        .services-content {
          width: 90%;
          max-width: 1200px;
          margin: auto;
          padding: 60px 0 80px;
        }

        .services-title {
          text-align: center;
          margin-bottom: 35px;
        }

        .services-title h2 {
          margin: 0;
          color: #0b2946;
          font-size: 30px;
          font-weight: 800;
        }

        .services-title-line {
          width: 45px;
          height: 3px;
          background: #ffc107;
          margin: 10px auto 13px;
        }

        .services-title p {
          margin: 0;
          color: #75818d;
          font-size: 13px;
        }

        .services-page-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 22px;
        }

        .services-page-card {
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 11px;
          padding: 28px;
          box-shadow: 0 5px 18px rgba(11,41,70,0.05);
          transition: 0.25s;
        }

        .services-page-card:hover {
          transform: translateY(-4px);
          border-color: #f6c20d;
          box-shadow: 0 10px 25px rgba(11,41,70,0.09);
        }

        .services-card-top {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }

        .services-card-icon {
          width: 52px;
          height: 52px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff6d5;
          border-radius: 9px;
          font-size: 24px;
        }

        .services-card-top h3 {
          margin: 0;
          color: #0b2946;
          font-size: 19px;
          font-weight: 800;
        }

        .services-page-card > p {
          margin: 0 0 18px;
          color: #6f7b87;
          font-size: 13px;
          line-height: 1.65;
        }

        .services-feature-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
          margin-bottom: 20px;
        }

        .services-feature-item {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #53616e;
          font-size: 12px;
        }

        .services-check {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: #e2f6e7;
          color: #18803b;
          border-radius: 50%;
          font-size: 10px;
          font-weight: 800;
        }

        .services-book-btn {
          display: inline-block;
          background: #f6c20d;
          color: #0b2946;
          padding: 10px 17px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 11px;
          font-weight: 800;
        }

        .services-book-btn:hover {
          background: #e3b300;
        }

        .services-process {
          margin-top: 55px;
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 11px;
          padding: 30px;
        }

        .services-process h2 {
          text-align: center;
          margin: 0 0 27px;
          color: #0b2946;
          font-size: 25px;
        }

        .services-process-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .services-process-card {
          text-align: center;
          padding: 18px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .services-process-number {
          width: 38px;
          height: 38px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0b2946;
          color: #ffc107;
          border-radius: 50%;
          font-size: 13px;
          font-weight: 800;
        }

        .services-process-card h4 {
          margin: 0 0 7px;
          color: #0b2946;
          font-size: 13px;
        }

        .services-process-card p {
          margin: 0;
          color: #7a8590;
          font-size: 10px;
          line-height: 1.5;
        }

        .services-cta {
          margin-top: 45px;
          background: #0b2946;
          border-radius: 11px;
          text-align: center;
          padding: 38px 20px;
        }

        .services-cta h2 {
          margin: 0 0 10px;
          color: white;
          font-size: 25px;
        }

        .services-cta p {
          margin: 0 0 20px;
          color: rgba(255,255,255,0.75);
          font-size: 12px;
        }

        @media (max-width: 900px) {
          .services-page-grid {
            grid-template-columns: 1fr;
          }

          .services-process-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .services-hero h1 {
            font-size: 32px;
          }

          .services-process-grid {
            grid-template-columns: 1fr;
          }

          .services-page-card {
            padding: 22px;
          }
        }
      `}</style>

      <main className="services-page">

        <section className="services-hero">
          <div className="services-hero-content">

            <span className="services-hero-label">
              MMC Taxi Service
            </span>

            <h1>Our Taxi Services</h1>

            <p>
              Choose a suitable taxi service from Makumbura
              Multimodal Centre and travel safely with registered
              and verified drivers.
            </p>

          </div>
        </section>


        <section className="services-content">

          <div className="services-title">

            <h2>Choose Your Vehicle</h2>

            <div className="services-title-line"></div>

            <p>
              Select the vehicle type that best suits your journey.
            </p>

          </div>


          <div className="services-page-grid">

            {services.map((service) => (
              <div
                className="services-page-card"
                key={service.title}
              >

                <div className="services-card-top">

                  <div className="services-card-icon">
                    {service.icon}
                  </div>

                  <h3>{service.title}</h3>

                </div>

                <p>{service.description}</p>

                <div className="services-feature-list">

                  {service.features.map((feature) => (
                    <div
                      className="services-feature-item"
                      key={feature}
                    >
                      <span className="services-check">
                        ✓
                      </span>

                      {feature}
                    </div>
                  ))}

                </div>

                {service.title === "Taxi Operations Booking" ? (
                  <Link
                    to="/contact"
                    className="services-book-btn"
                  >
                    Contact Operations
                  </Link>
                ) : (
                  <Link
                    to="/book-taxi"
                    className="services-book-btn"
                  >
                    Book This Vehicle
                  </Link>
                )}

              </div>
            ))}

          </div>


          <div className="services-process">

            <h2>How Taxi Booking Works</h2>

            <div className="services-process-grid">

              <div className="services-process-card">
                <div className="services-process-number">
                  1
                </div>

                <h4>Enter Journey</h4>

                <p>
                  Enter your pickup location and destination.
                </p>
              </div>


              <div className="services-process-card">
                <div className="services-process-number">
                  2
                </div>

                <h4>Select Vehicle</h4>

                <p>
                  Choose Car, Three-Wheeler or Bike.
                </p>
              </div>


              <div className="services-process-card">
                <div className="services-process-number">
                  3
                </div>

                <h4>Driver Acceptance</h4>

                <p>
                  The selected available driver receives the booking.
                </p>
              </div>


              <div className="services-process-card">
                <div className="services-process-number">
                  4
                </div>

                <h4>Start Your Trip</h4>

                <p>
                  After confirmation, your taxi journey can begin.
                </p>
              </div>

            </div>

          </div>


          <div className="services-cta">

            <h2>Need a Taxi?</h2>

            <p>
              Book online or contact Makumbura Taxi Operations
              for assistance.
            </p>

            <Link
              to="/book-taxi"
              className="services-book-btn"
            >
              Book a Taxi
            </Link>

          </div>

        </section>

      </main>
    </>
  );
}

export default Services;