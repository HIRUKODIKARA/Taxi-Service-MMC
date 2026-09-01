import { useNavigate } from "react-router-dom";

function PassengerDashboard() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        .passenger-dashboard {
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .passenger-dashboard h1 {
          margin: 0 0 6px;
          color: #0b2946;
          font-size: 28px;
        }

        .passenger-dashboard-subtitle {
          margin: 0 0 24px;
          color: #7b8794;
          font-size: 12px;
        }

        .passenger-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .passenger-summary-card {
          background: white;
          padding: 18px;
          border: 1px solid #e3e8ed;
          border-radius: 9px;
        }

        .passenger-summary-card span {
          color: #89949e;
          font-size: 9px;
        }

        .passenger-summary-card h2 {
          margin: 7px 0 0;
          color: #0b2946;
          font-size: 23px;
        }

        .passenger-dashboard-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 20px;
        }

        .passenger-card {
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 10px;
          padding: 22px;
        }

        .passenger-card h2 {
          margin: 0 0 17px;
          color: #0b2946;
          font-size: 17px;
        }

        .current-booking-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #edf0f3;
          gap: 15px;
        }

        .current-booking-row span {
          color: #89949e;
          font-size: 10px;
        }

        .current-booking-row strong {
          color: #0b2946;
          font-size: 11px;
          text-align: right;
        }

        .passenger-status {
          display: inline-block;
          margin-bottom: 15px;
          padding: 5px 9px;
          border-radius: 20px;
          background: #e3f6e7;
          color: #18763a;
          font-size: 9px;
          font-weight: 700;
        }

        .passenger-current-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 17px;
        }

        .passenger-current-actions button {
          border-radius: 6px;
          padding: 10px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
        }

        .passenger-outline-btn {
          border: 1px solid #0b2946;
          background: white;
          color: #0b2946;
        }

        .passenger-yellow-btn {
          border: none;
          background: #f6c20d;
          color: #0b2946;
        }

        .passenger-quick-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 11px;
        }

        .passenger-quick-btn {
          border: 1px solid #e2e7ec;
          background: #f8fafc;
          color: #0b2946;
          border-radius: 8px;
          padding: 18px 10px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
        }

        .passenger-quick-btn span {
          display: block;
          font-size: 21px;
          margin-bottom: 7px;
        }

        @media(max-width: 950px) {
          .passenger-summary-grid {
            grid-template-columns: repeat(2,1fr);
          }

          .passenger-dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        @media(max-width: 600px) {
          .passenger-summary-grid,
          .passenger-current-actions,
          .passenger-quick-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="passenger-dashboard">
        <h1>Passenger Dashboard</h1>

        <p className="passenger-dashboard-subtitle">
          Welcome back, Nadeesha. Manage your taxi bookings and trips.
        </p>

        <div className="passenger-summary-grid">
          <div className="passenger-summary-card">
            <span>TOTAL BOOKINGS</span>
            <h2>8</h2>
          </div>

          <div className="passenger-summary-card">
            <span>ACTIVE BOOKING</span>
            <h2>1</h2>
          </div>

          <div className="passenger-summary-card">
            <span>COMPLETED TRIPS</span>
            <h2>7</h2>
          </div>

          <div className="passenger-summary-card">
            <span>NOTIFICATIONS</span>
            <h2>2</h2>
          </div>
        </div>

        <div className="passenger-dashboard-grid">
          <section className="passenger-card">
            <h2>Current Booking</h2>

            <span className="passenger-status">
              Driver Accepted
            </span>

            <div className="current-booking-row">
              <span>Booking ID</span>
              <strong>BK001</strong>
            </div>

            <div className="current-booking-row">
              <span>Pickup</span>
              <strong>Makumbura Multimodal Center</strong>
            </div>

            <div className="current-booking-row">
              <span>Destination</span>
              <strong>Colombo</strong>
            </div>

            <div className="current-booking-row">
              <span>Driver</span>
              <strong>Kasun Perera</strong>
            </div>

            <div className="current-booking-row">
              <span>Vehicle</span>
              <strong>WP CAB-1234</strong>
            </div>

            <div className="passenger-current-actions">
              <button
                className="passenger-outline-btn"
                onClick={() => navigate("/passenger/bookings")}
              >
                View Booking
              </button>

              <button
                className="passenger-yellow-btn"
                onClick={() => navigate("/passenger/tracking")}
              >
                Track Driver
              </button>
            </div>
          </section>

          <section className="passenger-card">
            <h2>Quick Actions</h2>

            <div className="passenger-quick-grid">
              <button
                className="passenger-quick-btn"
                onClick={() => navigate("/passenger/book-taxi")}
              >
                <span>🚕</span>
                Book Taxi
              </button>

              <button
                className="passenger-quick-btn"
                onClick={() => navigate("/passenger/bookings")}
              >
                <span>📋</span>
                My Bookings
              </button>

              <button
                className="passenger-quick-btn"
                onClick={() => navigate("/passenger/tracking")}
              >
                <span>📍</span>
                Track Booking
              </button>

              <button
                className="passenger-quick-btn"
                onClick={() => navigate("/passenger/notifications")}
              >
                <span>🔔</span>
                Notifications
              </button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default PassengerDashboard;