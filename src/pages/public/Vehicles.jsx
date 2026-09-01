import { Link } from "react-router-dom";

function Vehicles() {
  const vehicles = [
    {
      icon: "🚗",
      name: "Car",
      passengers: "Up to 4 passengers",
      description:
        "Comfortable option for families, luggage and longer journeys.",
    },
    {
      icon: "🛺",
      name: "Three-Wheeler",
      passengers: "Up to 3 passengers",
      description:
        "Affordable and convenient option for local and shorter journeys.",
    },
    {
      icon: "🏍️",
      name: "Bike",
      passengers: "1 passenger",
      description:
        "Quick transport option for a single passenger and short journeys.",
    },
  ];

  return (
    <>
      <style>{`
        .public-vehicles-page {
          min-height: 100vh;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .public-vehicles-hero {
          padding: 65px 20px;
          text-align: center;
          background: #0b2946;
        }

        .public-vehicles-hero h1 {
          margin: 0 0 10px;
          color: white;
          font-size: 40px;
        }

        .public-vehicles-hero p {
          margin: 0;
          color: rgba(255,255,255,0.72);
          font-size: 13px;
        }

        .public-vehicles-content {
          width: 90%;
          max-width: 1100px;
          margin: auto;
          padding: 55px 0;
        }

        .public-vehicles-grid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 20px;
        }

        .public-vehicle-card {
          background: white;
          padding: 30px 24px;
          text-align: center;
          border: 1px solid #e1e7eb;
          border-radius: 11px;
          transition: 0.2s;
        }

        .public-vehicle-card:hover {
          transform: translateY(-4px);
          border-color: #f6c20d;
        }

        .public-vehicle-icon {
          font-size: 45px;
          margin-bottom: 15px;
        }

        .public-vehicle-card h2 {
          margin: 0 0 7px;
          color: #0b2946;
          font-size: 21px;
        }

        .public-vehicle-capacity {
          display: inline-block;
          margin-bottom: 14px;
          padding: 5px 9px;
          background: #fff3cc;
          color: #806300;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
        }

        .public-vehicle-card p {
          margin: 0 0 20px;
          color: #6f7c88;
          font-size: 11px;
          line-height: 1.7;
        }

        .vehicle-book-link {
          display: inline-block;
          background: #f6c20d;
          color: #0b2946;
          padding: 10px 16px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 10px;
          font-weight: 800;
        }

        @media(max-width: 800px) {
          .public-vehicles-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="public-vehicles-page">
        <section className="public-vehicles-hero">
          <h1>Our Vehicles</h1>

          <p>
            Select a suitable vehicle type for your journey.
          </p>
        </section>

        <section className="public-vehicles-content">
          <div className="public-vehicles-grid">
            {vehicles.map((vehicle) => (
              <div
                className="public-vehicle-card"
                key={vehicle.name}
              >
                <div className="public-vehicle-icon">
                  {vehicle.icon}
                </div>

                <h2>{vehicle.name}</h2>

                <span className="public-vehicle-capacity">
                  {vehicle.passengers}
                </span>

                <p>{vehicle.description}</p>

                <Link
                  to="/book-taxi"
                  className="vehicle-book-link"
                >
                  Book {vehicle.name}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

export default Vehicles;