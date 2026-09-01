import { useState } from "react";

function BookingManagement() {
  const [bookings, setBookings] = useState([
    {
      id: "BK001",
      passenger: "Nadeesha Perera",
      phone: "0712345678",
      source: "Website",
      pickup: "Makumbura Multimodal Center",
      destination: "Colombo",
      vehicle: "Car",
      driver: "Kasun Perera",
      status: "Confirmed",
    },
    {
      id: "BK002",
      passenger: "Saman Silva",
      phone: "0774567890",
      source: "Phone",
      pickup: "Makumbura Multimodal Center",
      destination: "Homagama",
      vehicle: "Three-Wheeler",
      driver: "Nimal Silva",
      status: "Pending",
    },
    {
      id: "BK003",
      passenger: "Tharushi Fernando",
      phone: "0751234567",
      source: "On-Site",
      pickup: "Makumbura Multimodal Center",
      destination: "Kottawa",
      vehicle: "Bike",
      driver: "Amal Fernando",
      status: "Completed",
    },
  ]);

  const [search, setSearch] = useState("");
  const [source, setSource] = useState("All");
  const [status, setStatus] = useState("All");

  const filtered = bookings.filter((booking) => {
    const match =
      booking.id.toLowerCase().includes(search.toLowerCase()) ||
      booking.passenger.toLowerCase().includes(search.toLowerCase());

    return (
      match &&
      (source === "All" || booking.source === source) &&
      (status === "All" || booking.status === status)
    );
  });

  const changeStatus = (id, newStatus) => {
    setBookings(
      bookings.map((booking) =>
        booking.id === id
          ? { ...booking, status: newStatus }
          : booking
      )
    );
  };

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div>
          <h1>Booking Management</h1>
          <p>
            Monitor website, phone and on-site taxi bookings.
          </p>
        </div>
      </div>

      <div className="sa-summary-grid">
        <div className="sa-summary-card">
          <span>Total Bookings</span>
          <h2>{bookings.length}</h2>
        </div>

        <div className="sa-summary-card">
          <span>Pending</span>
          <h2>{bookings.filter((b) => b.status === "Pending").length}</h2>
        </div>

        <div className="sa-summary-card">
          <span>Confirmed</span>
          <h2>{bookings.filter((b) => b.status === "Confirmed").length}</h2>
        </div>

        <div className="sa-summary-card">
          <span>Completed</span>
          <h2>{bookings.filter((b) => b.status === "Completed").length}</h2>
        </div>
      </div>

      <section className="sa-card">
        <div className="sa-toolbar">
          <input
            className="sa-input"
            placeholder="Search booking or passenger..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="sa-select"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="All">All Sources</option>
            <option value="Website">Website</option>
            <option value="Phone">Phone</option>
            <option value="On-Site">On-Site</option>
          </select>

          <select
            className="sa-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Passenger</th>
                <th>Source</th>
                <th>Pickup</th>
                <th>Destination</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((booking) => (
                <tr key={booking.id}>
                  <td className="sa-id">{booking.id}</td>
                  <td>{booking.passenger}</td>
                  <td>{booking.source}</td>
                  <td>{booking.pickup}</td>
                  <td>{booking.destination}</td>
                  <td>{booking.vehicle}</td>
                  <td>{booking.driver}</td>

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

                  <td>
                    <div className="sa-actions">
                      <button
                        className="sa-btn-view"
                        onClick={() =>
                          alert(
                            `${booking.id}\n${booking.passenger}\n${booking.pickup} → ${booking.destination}`
                          )
                        }
                      >
                        View
                      </button>

                      {booking.status === "Pending" && (
                        <button
                          className="sa-btn-edit"
                          onClick={() =>
                            changeStatus(booking.id, "Confirmed")
                          }
                        >
                          Confirm
                        </button>
                      )}

                      {booking.status === "Confirmed" && (
                        <button
                          className="sa-btn-neutral"
                          onClick={() =>
                            changeStatus(booking.id, "Completed")
                          }
                        >
                          Complete
                        </button>
                      )}
                    </div>
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

export default BookingManagement;