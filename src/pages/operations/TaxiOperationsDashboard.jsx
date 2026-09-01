import { useState } from "react";

function TaxiOperationsDashboard() {
  const [bookings] = useState([
    {
      id: "BK001",
      source: "Website",
      passenger: "Nadeesha Perera",
      destination: "Colombo",
      vehicle: "Car",
      status: "Confirmed",
    },
    {
      id: "BK002",
      source: "Phone",
      passenger: "Saman Silva",
      destination: "Homagama",
      vehicle: "Three-Wheeler",
      status: "Pending",
    },
    {
      id: "BK003",
      source: "On-Site",
      passenger: "Amal Fernando",
      destination: "Kottawa",
      vehicle: "Bike",
      status: "On Ride",
    },
  ]);

  const vehicles = [
    {
      id: "VEH001",
      number: "WP CAB-1234",
      type: "Car",
      driver: "Kasun Perera",
      status: "Available",
    },
    {
      id: "VEH002",
      number: "WP AAB-4567",
      type: "Three-Wheeler",
      driver: "Nimal Silva",
      status: "On Ride",
    },
    {
      id: "VEH003",
      number: "WP BCD-7890",
      type: "Bike",
      driver: "Amal Jay",
      status: "Offline",
    },
  ];

  const notifications = [
    "Driver Kasun Perera accepted booking BK001.",
    "Booking BK005 needs another driver assignment.",
  ];

  return (
    <>
      <style>{`
        .tod-page {
          padding: 30px;
          min-height: 100vh;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .tod-header {
          margin-bottom: 25px;
        }

        .tod-header h1 {
          margin: 0 0 6px;
          color: #0b2946;
          font-size: 30px;
          font-weight: 800;
        }

        .tod-header p {
          margin: 0;
          color: #7a8591;
          font-size: 13px;
        }

        .tod-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-bottom: 22px;
        }

        .tod-card {
          background: white;
          border: 1px solid #e3e8ed;
          border-radius: 10px;
          padding: 22px;
          box-shadow: 0 4px 14px rgba(11,41,70,0.05);
        }

        .tod-card span {
          color: #7c8792;
          font-size: 12px;
        }

        .tod-card h2 {
          margin: 6px 0 0;
          color: #0b2946;
          font-size: 30px;
        }

        .tod-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 22px;
        }

        .tod-actions button {
          border: none;
          background: #f6c20d;
          color: #0b2946;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .tod-actions button:hover {
          background: #e3b400;
        }

        .tod-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 20px;
          margin-bottom: 22px;
        }

        .tod-panel {
          background: white;
          border: 1px solid #e3e8ed;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 4px 14px rgba(11,41,70,0.05);
        }

        .tod-panel h3 {
          margin: 0 0 16px;
          color: #0b2946;
          font-size: 16px;
        }

        .tod-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .tod-table {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
        }

        .tod-table th {
          background: #f6f8fa;
          padding: 12px;
          text-align: left;
          color: #5e6975;
          font-size: 10px;
          border-bottom: 1px solid #dfe5ea;
        }

        .tod-table td {
          padding: 13px 12px;
          color: #46525e;
          font-size: 11px;
          border-bottom: 1px solid #edf0f3;
        }

        .tod-source {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
        }

        .tod-source.website {
          background: #e1efff;
          color: #176ac2;
        }

        .tod-source.phone {
          background: #fff3cd;
          color: #886900;
        }

        .tod-source.onsite {
          background: #eee6ff;
          color: #7048a8;
        }

        .tod-status {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
        }

        .tod-status.pending {
          background: #fff3cd;
          color: #886900;
        }

        .tod-status.confirmed {
          background: #e1efff;
          color: #176ac2;
        }

        .tod-status.onride {
          background: #eee6ff;
          color: #7048a8;
        }

        .tod-vehicle-row {
          display: grid;
          grid-template-columns: 14px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 13px 0;
          border-bottom: 1px solid #edf0f3;
        }

        .tod-vehicle-row:last-child {
          border-bottom: none;
        }

        .tod-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .tod-dot.available {
          background: #198754;
        }

        .tod-dot.onride {
          background: #176ac2;
        }

        .tod-dot.offline {
          background: #dc3545;
        }

        .tod-vehicle-main strong {
          display: block;
          color: #0b2946;
          font-size: 11px;
        }

        .tod-vehicle-main span {
          display: block;
          margin-top: 3px;
          color: #7b8590;
          font-size: 9px;
        }

        .tod-vehicle-row b {
          color: #5d6874;
          font-size: 9px;
        }

        .tod-notification {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 11px 0;
          border-bottom: 1px solid #edf0f3;
        }

        .tod-notification:last-child {
          border-bottom: none;
        }

        .tod-notification p {
          margin: 0;
          color: #5d6975;
          font-size: 11px;
        }

        @media (max-width: 1000px) {
          .tod-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .tod-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .tod-page {
            padding: 18px;
          }

          .tod-summary-grid {
            grid-template-columns: 1fr;
          }

          .tod-header h1 {
            font-size: 24px;
          }
        }
      `}</style>

      <div className="tod-page">

        <div className="tod-header">
          <h1>Taxi Operations Dashboard</h1>
          <p>
            Manage daily taxi bookings, drivers and vehicle operations.
          </p>
        </div>

        <div className="tod-summary-grid">

          <div className="tod-card">
            <span>Total Bookings</span>
            <h2>{bookings.length}</h2>
          </div>

          <div className="tod-card">
            <span>Pending Bookings</span>
            <h2>
              {
                bookings.filter(
                  (booking) => booking.status === "Pending"
                ).length
              }
            </h2>
          </div>

          <div className="tod-card">
            <span>Available Vehicles</span>
            <h2>
              {
                vehicles.filter(
                  (vehicle) => vehicle.status === "Available"
                ).length
              }
            </h2>
          </div>

          <div className="tod-card">
            <span>Vehicles On Ride</span>
            <h2>
              {
                vehicles.filter(
                  (vehicle) => vehicle.status === "On Ride"
                ).length
              }
            </h2>
          </div>

        </div>

        <div className="tod-actions">

          <button
            onClick={() =>
              window.location.href = "/operations/phone-booking"
            }
          >
            + Create Phone Booking
          </button>

          <button
            onClick={() =>
              window.location.href = "/operations/onsite-booking"
            }
          >
            + Create On-Site Booking
          </button>

          <button
            onClick={() =>
              window.location.href = "/operations/bookings"
            }
          >
            View All Bookings
          </button>

        </div>

        <div className="tod-grid">

          <section className="tod-panel">

            <h3>Recent Bookings</h3>

            <div className="tod-table-wrapper">

              <table className="tod-table">

                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Source</th>
                    <th>Passenger</th>
                    <th>Destination</th>
                    <th>Vehicle</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {bookings.map((booking) => (
                    <tr key={booking.id}>

                      <td>
                        <strong>{booking.id}</strong>
                      </td>

                      <td>
                        <span
                          className={`tod-source ${
                            booking.source === "Website"
                              ? "website"
                              : booking.source === "Phone"
                              ? "phone"
                              : "onsite"
                          }`}
                        >
                          {booking.source}
                        </span>
                      </td>

                      <td>{booking.passenger}</td>

                      <td>{booking.destination}</td>

                      <td>{booking.vehicle}</td>

                      <td>
                        <span
                          className={`tod-status ${
                            booking.status === "Confirmed"
                              ? "confirmed"
                              : booking.status === "Pending"
                              ? "pending"
                              : "onride"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </section>

          <section className="tod-panel">

            <h3>Vehicle Status</h3>

            {vehicles.map((vehicle) => (
              <div
                className="tod-vehicle-row"
                key={vehicle.id}
              >

                <span
                  className={`tod-dot ${
                    vehicle.status === "Available"
                      ? "available"
                      : vehicle.status === "On Ride"
                      ? "onride"
                      : "offline"
                  }`}
                ></span>

                <div className="tod-vehicle-main">
                  <strong>{vehicle.number}</strong>

                  <span>
                    {vehicle.type} · {vehicle.driver}
                  </span>
                </div>

                <b>{vehicle.status}</b>

              </div>
            ))}

          </section>

        </div>

        <section className="tod-panel">

          <h3>Notifications</h3>

          {notifications.map((message, index) => (
            <div
              className="tod-notification"
              key={index}
            >
              <span>🔔</span>
              <p>{message}</p>
            </div>
          ))}

        </section>

      </div>
    </>
  );
}

export default TaxiOperationsDashboard;