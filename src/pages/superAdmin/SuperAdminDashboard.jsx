function SuperAdminDashboard() {
  const recentBookings = [
    {
      id: "BK001",
      passenger: "Nadeesha Perera",
      source: "Website",
      vehicle: "Car",
      status: "Confirmed",
    },
    {
      id: "BK002",
      passenger: "Saman Silva",
      source: "Phone",
      vehicle: "Three-Wheeler",
      status: "Pending",
    },
    {
      id: "BK003",
      passenger: "Tharushi Fernando",
      source: "On-Site",
      vehicle: "Bike",
      status: "Completed",
    },
  ];

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div>
          <h1>Super Admin Dashboard</h1>
          <p>
            Monitor the overall Makumbura Taxi Management System.
          </p>
        </div>

        <span className="sa-badge green">System Online</span>
      </div>

      <div className="sa-summary-grid">
        <div className="sa-summary-card">
          <span>Total Bookings</span>
          <h2>128</h2>
        </div>

        <div className="sa-summary-card">
          <span>Registered Drivers</span>
          <h2>24</h2>
        </div>

        <div className="sa-summary-card">
          <span>Active Vehicles</span>
          <h2>18</h2>
        </div>

        <div className="sa-summary-card">
          <span>Registered Users</span>
          <h2>86</h2>
        </div>
      </div>

      <div className="sa-grid-2">
        <section className="sa-card">
          <h2>Vehicle Status</h2>

          <div className="sa-detail-grid">
            <div className="sa-detail">
              <span>Available</span>
              <strong>12 Vehicles</strong>
            </div>

            <div className="sa-detail">
              <span>On Ride</span>
              <strong>6 Vehicles</strong>
            </div>

            <div className="sa-detail">
              <span>Offline</span>
              <strong>4 Vehicles</strong>
            </div>

            <div className="sa-detail">
              <span>GPS Connected</span>
              <strong>19 Vehicles</strong>
            </div>
          </div>
        </section>

        <section className="sa-card">
          <h2>Today's Operations</h2>

          <div className="sa-detail-grid">
            <div className="sa-detail">
              <span>Website</span>
              <strong>14 Bookings</strong>
            </div>

            <div className="sa-detail">
              <span>Phone</span>
              <strong>8 Bookings</strong>
            </div>

            <div className="sa-detail">
              <span>On-Site</span>
              <strong>11 Bookings</strong>
            </div>

            <div className="sa-detail">
              <span>Completed</span>
              <strong>28 Trips</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="sa-card">
        <h2>Recent Bookings</h2>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Passenger</th>
                <th>Source</th>
                <th>Vehicle</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {recentBookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="sa-id">{booking.id}</td>
                  <td>{booking.passenger}</td>
                  <td>{booking.source}</td>
                  <td>{booking.vehicle}</td>
                  <td>
                    <span
                      className={`sa-badge ${
                        booking.status === "Completed"
                          ? "green"
                          : booking.status === "Confirmed"
                          ? "blue"
                          : "yellow"
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
    </main>
  );
}

export default SuperAdminDashboard;