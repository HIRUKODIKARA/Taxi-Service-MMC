function Reports() {
  const driverData = [
    {
      driver: "Kasun Perera",
      trips: 24,
      completed: 23,
      rating: "4.8",
    },
    {
      driver: "Nimal Silva",
      trips: 20,
      completed: 19,
      rating: "4.7",
    },
    {
      driver: "Amal Fernando",
      trips: 16,
      completed: 15,
      rating: "4.6",
    },
  ];

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div>
          <h1>Reports</h1>
          <p>
            Review booking, vehicle and driver performance information.
          </p>
        </div>

        <button
          className="sa-primary-btn"
          onClick={() =>
            alert("Report export will be connected to backend later.")
          }
        >
          Export Report
        </button>
      </div>

      <div className="sa-summary-grid">
        <div className="sa-summary-card">
          <span>Total Trips</span>
          <h2>128</h2>
        </div>

        <div className="sa-summary-card">
          <span>Completed</span>
          <h2>116</h2>
        </div>

        <div className="sa-summary-card">
          <span>Cancelled</span>
          <h2>7</h2>
        </div>

        <div className="sa-summary-card">
          <span>Pending</span>
          <h2>5</h2>
        </div>
      </div>

      <div className="sa-grid-2">
        <section className="sa-card">
          <h2>Bookings by Source</h2>

          <div className="sa-detail-grid">
            <div className="sa-detail">
              <span>Website</span>
              <strong>58 Bookings</strong>
            </div>

            <div className="sa-detail">
              <span>Phone</span>
              <strong>34 Bookings</strong>
            </div>

            <div className="sa-detail">
              <span>On-Site</span>
              <strong>36 Bookings</strong>
            </div>

            <div className="sa-detail">
              <span>Total</span>
              <strong>128 Bookings</strong>
            </div>
          </div>
        </section>

        <section className="sa-card">
          <h2>Vehicle Status Report</h2>

          <div className="sa-detail-grid">
            <div className="sa-detail">
              <span>Available</span>
              <strong>12</strong>
            </div>

            <div className="sa-detail">
              <span>On Ride</span>
              <strong>6</strong>
            </div>

            <div className="sa-detail">
              <span>Offline</span>
              <strong>4</strong>
            </div>

            <div className="sa-detail">
              <span>Total Vehicles</span>
              <strong>22</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="sa-card">
        <h2>Driver Performance</h2>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Total Trips</th>
                <th>Completed</th>
                <th>Rating</th>
              </tr>
            </thead>

            <tbody>
              {driverData.map((driver) => (
                <tr key={driver.driver}>
                  <td className="sa-id">{driver.driver}</td>
                  <td>{driver.trips}</td>
                  <td>{driver.completed}</td>
                  <td>⭐ {driver.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default Reports;