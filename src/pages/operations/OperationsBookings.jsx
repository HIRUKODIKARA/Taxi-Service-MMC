import { useState } from "react";

function OperationsBookings() {
  const [bookings, setBookings] = useState([
    {
      id: "BK001",
      source: "Website",
      passenger: "Nadeesha Perera",
      phone: "0771234567",
      pickup: "Makumbura Multimodal Center",
      destination: "Colombo",
      vehicleType: "Car",
      driver: "Kasun Perera",
      vehicleNo: "WP CAB-1234",
      status: "Confirmed",
    },
    {
      id: "BK002",
      source: "Phone",
      passenger: "Saman Silva",
      phone: "0712345678",
      pickup: "Makumbura Multimodal Center",
      destination: "Homagama",
      vehicleType: "Three-Wheeler",
      driver: "Not Assigned",
      vehicleNo: "-",
      status: "Pending",
    },
    {
      id: "BK003",
      source: "On-Site",
      passenger: "Amal Fernando",
      phone: "0753456789",
      pickup: "Makumbura Multimodal Center",
      destination: "Kottawa",
      vehicleType: "Bike",
      driver: "Nimal Jay",
      vehicleNo: "WP BCD-7890",
      status: "On Ride",
    },
  ]);

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedBooking, setSelectedBooking] = useState(null);

  const assignDriver = (id) => {
    setBookings((current) =>
      current.map((booking) =>
        booking.id === id
          ? {
              ...booking,
              driver: "Kasun Perera",
              vehicleNo: "WP CAB-1234",
              status: "Confirmed",
            }
          : booking
      )
    );

    alert("Driver and vehicle assigned successfully.");
  };

  const startTrip = (id) => {
    setBookings((current) =>
      current.map((booking) =>
        booking.id === id
          ? {
              ...booking,
              status: "On Ride",
            }
          : booking
      )
    );
  };

  const completeTrip = (id) => {
    setBookings((current) =>
      current.map((booking) =>
        booking.id === id
          ? {
              ...booking,
              status: "Completed",
            }
          : booking
      )
    );
  };

  const filteredBookings = bookings.filter((booking) => {
    const text = search.toLowerCase();

    const matchSearch =
      booking.id.toLowerCase().includes(text) ||
      booking.passenger.toLowerCase().includes(text) ||
      booking.phone.includes(text) ||
      booking.destination.toLowerCase().includes(text);

    const matchSource =
      sourceFilter === "All" || booking.source === sourceFilter;

    const matchStatus =
      statusFilter === "All" || booking.status === statusFilter;

    return matchSearch && matchSource && matchStatus;
  });

  const getStatusClass = (status) => {
    if (status === "Pending") return "pending";
    if (status === "Confirmed") return "confirmed";
    if (status === "On Ride") return "onride";
    if (status === "Completed") return "completed";
    return "";
  };

  const getSourceClass = (source) => {
    if (source === "Website") return "website";
    if (source === "Phone") return "phone";
    return "onsite";
  };

  return (
    <>
      <style>{`
        .op-booking-page {
          padding: 30px;
          background: #f4f7fa;
          min-height: 100vh;
          font-family: Arial, Helvetica, sans-serif;
          color: #0b2946;
        }

        .op-booking-header {
          margin-bottom: 25px;
        }

        .op-booking-header h1 {
          margin: 0 0 6px;
          font-size: 28px;
          color: #0b2946;
        }

        .op-booking-header p {
          margin: 0;
          color: #7b8794;
          font-size: 13px;
        }

        .op-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-bottom: 24px;
        }

        .op-summary-card {
          background: white;
          padding: 22px;
          border: 1px solid #e4e9ee;
          border-radius: 10px;
          box-shadow: 0 4px 14px rgba(11, 41, 70, 0.05);
        }

        .op-summary-card span {
          color: #7c8792;
          font-size: 12px;
        }

        .op-summary-card h2 {
          margin: 7px 0 0;
          font-size: 30px;
          color: #0b2946;
        }

        .op-booking-panel {
          background: white;
          border: 1px solid #e3e8ed;
          border-radius: 10px;
          padding: 22px;
          box-shadow: 0 4px 14px rgba(11, 41, 70, 0.05);
        }

        .op-tools {
          display: grid;
          grid-template-columns: 1fr 190px 190px;
          gap: 12px;
          margin-bottom: 22px;
        }

        .op-tools input,
        .op-tools select {
          width: 100%;
          padding: 11px 13px;
          border: 1px solid #d8e0e6;
          border-radius: 6px;
          outline: none;
          background: white;
          color: #435363;
          font-size: 12px;
        }

        .op-tools input:focus,
        .op-tools select:focus {
          border-color: #f6c20d;
          box-shadow: 0 0 0 3px rgba(246, 194, 13, 0.12);
        }

        .op-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .op-table {
          width: 100%;
          min-width: 1050px;
          border-collapse: collapse;
        }

        .op-table thead {
          background: #f6f8fa;
        }

        .op-table th {
          padding: 13px 14px;
          text-align: left;
          color: #5e6975;
          font-size: 11px;
          font-weight: 700;
          border-bottom: 1px solid #dde4ea;
          white-space: nowrap;
        }

        .op-table td {
          padding: 15px 14px;
          color: #44515e;
          font-size: 12px;
          border-bottom: 1px solid #edf0f3;
          vertical-align: middle;
        }

        .op-table tbody tr:hover {
          background: #fbfcfd;
        }

        .op-passenger strong,
        .op-vehicle strong {
          display: block;
          color: #0b2946;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .op-passenger span,
        .op-vehicle span {
          display: block;
          color: #8a949e;
          font-size: 10px;
        }

        .op-source {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .op-source.website {
          background: #e1efff;
          color: #176ac2;
        }

        .op-source.phone {
          background: #fff3cd;
          color: #886900;
        }

        .op-source.onsite {
          background: #eee6ff;
          color: #7048a8;
        }

        .op-status {
          display: inline-block;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .op-status.pending {
          background: #fff3cd;
          color: #806400;
        }

        .op-status.confirmed {
          background: #e1efff;
          color: #176ac2;
        }

        .op-status.onride {
          background: #e8e5ff;
          color: #6150b5;
        }

        .op-status.completed {
          background: #e2f6e7;
          color: #18803b;
        }

        .op-actions {
          display: flex;
          gap: 7px;
          white-space: nowrap;
        }

        .op-view-btn,
        .op-assign-btn {
          border-radius: 5px;
          padding: 7px 11px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .op-view-btn {
          border: 1px solid #0b2946;
          background: white;
          color: #0b2946;
        }

        .op-view-btn:hover {
          background: #0b2946;
          color: white;
        }

        .op-assign-btn {
          border: none;
          background: #f6c20d;
          color: #0b2946;
        }

        .op-assign-btn:hover {
          background: #e6b500;
        }

        .op-empty {
          text-align: center;
          padding: 30px !important;
          color: #89939e !important;
        }

        .op-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(4, 19, 33, 0.67);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          z-index: 5000;
        }

        .op-modal {
          width: 100%;
          max-width: 720px;
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 15px 45px rgba(0,0,0,0.25);
        }

        .op-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 15px;
          margin-bottom: 20px;
          border-bottom: 1px solid #e4e9ed;
        }

        .op-modal-header h2 {
          margin: 0;
          color: #0b2946;
          font-size: 21px;
        }

        .op-modal-header p {
          margin: 4px 0 0;
          color: #8a949e;
          font-size: 11px;
        }

        .op-close-btn {
          border: none;
          background: #f3f5f7;
          width: 34px;
          height: 34px;
          border-radius: 6px;
          cursor: pointer;
        }

        .op-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 13px;
        }

        .op-detail-card {
          background: #f8fafc;
          border: 1px solid #e5e9ed;
          border-radius: 7px;
          padding: 14px;
        }

        .op-detail-card span {
          display: block;
          color: #84909b;
          font-size: 10px;
          margin-bottom: 5px;
        }

        .op-detail-card strong {
          color: #34495c;
          font-size: 12px;
        }

        .op-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid #e6eaee;
        }

        .op-modal-actions button {
          border: none;
          background: #f6c20d;
          color: #0b2946;
          border-radius: 6px;
          padding: 10px 16px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        @media (max-width: 1000px) {
          .op-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .op-tools {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .op-booking-page {
            padding: 18px;
          }

          .op-summary-grid {
            grid-template-columns: 1fr;
          }

          .op-details-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="op-booking-page">

        {/* HEADER */}
        <div className="op-booking-header">
          <h1>Booking Management</h1>
          <p>
            Manage website, phone and on-site taxi bookings.
          </p>
        </div>

        {/* SUMMARY */}
        <div className="op-summary-grid">

          <div className="op-summary-card">
            <span>Total Bookings</span>
            <h2>{bookings.length}</h2>
          </div>

          <div className="op-summary-card">
            <span>Pending</span>
            <h2>
              {
                bookings.filter(
                  (booking) => booking.status === "Pending"
                ).length
              }
            </h2>
          </div>

          <div className="op-summary-card">
            <span>On Ride</span>
            <h2>
              {
                bookings.filter(
                  (booking) => booking.status === "On Ride"
                ).length
              }
            </h2>
          </div>

          <div className="op-summary-card">
            <span>Completed</span>
            <h2>
              {
                bookings.filter(
                  (booking) => booking.status === "Completed"
                ).length
              }
            </h2>
          </div>

        </div>

        {/* MAIN PANEL */}
        <section className="op-booking-panel">

          {/* FILTERS */}
          <div className="op-tools">

            <input
              type="search"
              placeholder="Search by booking ID, passenger, phone or destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="All">All Sources</option>
              <option value="Website">Website</option>
              <option value="Phone">Phone</option>
              <option value="On-Site">On-Site</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="On Ride">On Ride</option>
              <option value="Completed">Completed</option>
            </select>

          </div>

          {/* TABLE */}
          <div className="op-table-wrapper">

            <table className="op-table">

              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Source</th>
                  <th>Passenger</th>
                  <th>Pickup</th>
                  <th>Destination</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => (

                    <tr key={booking.id}>

                      <td>
                        <strong>{booking.id}</strong>
                      </td>

                      <td>
                        <span
                          className={`op-source ${getSourceClass(
                            booking.source
                          )}`}
                        >
                          {booking.source}
                        </span>
                      </td>

                      <td className="op-passenger">
                        <strong>{booking.passenger}</strong>
                        <span>{booking.phone}</span>
                      </td>

                      <td>
                        {booking.pickup}
                      </td>

                      <td>
                        {booking.destination}
                      </td>

                      <td className="op-vehicle">
                        <strong>{booking.vehicleType}</strong>
                        <span>{booking.vehicleNo}</span>
                      </td>

                      <td>
                        {booking.driver}
                      </td>

                      <td>
                        <span
                          className={`op-status ${getStatusClass(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </td>

                      <td>
                        <div className="op-actions">

                          <button
                            className="op-view-btn"
                            onClick={() =>
                              setSelectedBooking(booking)
                            }
                          >
                            View
                          </button>

                          {booking.driver === "Not Assigned" && (
                            <button
                              className="op-assign-btn"
                              onClick={() =>
                                assignDriver(booking.id)
                              }
                            >
                              Assign
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>

                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      className="op-empty"
                    >
                      No bookings found.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* VIEW MODAL */}
        {selectedBooking && (
          <div className="op-modal-overlay">

            <div className="op-modal">

              <div className="op-modal-header">

                <div>
                  <h2>Booking Details</h2>
                  <p>{selectedBooking.id}</p>
                </div>

                <button
                  className="op-close-btn"
                  onClick={() =>
                    setSelectedBooking(null)
                  }
                >
                  ✕
                </button>

              </div>

              <div className="op-details-grid">

                <div className="op-detail-card">
                  <span>Passenger Name</span>
                  <strong>
                    {selectedBooking.passenger}
                  </strong>
                </div>

                <div className="op-detail-card">
                  <span>Phone Number</span>
                  <strong>
                    {selectedBooking.phone}
                  </strong>
                </div>

                <div className="op-detail-card">
                  <span>Booking Source</span>
                  <strong>
                    {selectedBooking.source}
                  </strong>
                </div>

                <div className="op-detail-card">
                  <span>Vehicle Type</span>
                  <strong>
                    {selectedBooking.vehicleType}
                  </strong>
                </div>

                <div className="op-detail-card">
                  <span>Pickup Location</span>
                  <strong>
                    {selectedBooking.pickup}
                  </strong>
                </div>

                <div className="op-detail-card">
                  <span>Destination</span>
                  <strong>
                    {selectedBooking.destination}
                  </strong>
                </div>

                <div className="op-detail-card">
                  <span>Assigned Driver</span>
                  <strong>
                    {selectedBooking.driver}
                  </strong>
                </div>

                <div className="op-detail-card">
                  <span>Vehicle Number</span>
                  <strong>
                    {selectedBooking.vehicleNo}
                  </strong>
                </div>

              </div>

              <div className="op-modal-actions">

                {selectedBooking.driver ===
                  "Not Assigned" && (
                  <button
                    onClick={() => {
                      assignDriver(selectedBooking.id);
                      setSelectedBooking(null);
                    }}
                  >
                    Assign Driver & Vehicle
                  </button>
                )}

                {selectedBooking.status ===
                  "Confirmed" && (
                  <button
                    onClick={() => {
                      startTrip(selectedBooking.id);
                      setSelectedBooking(null);
                    }}
                  >
                    Start Trip
                  </button>
                )}

                {selectedBooking.status ===
                  "On Ride" && (
                  <button
                    onClick={() => {
                      completeTrip(
                        selectedBooking.id
                      );
                      setSelectedBooking(null);
                    }}
                  >
                    Complete Trip
                  </button>
                )}

              </div>

            </div>

          </div>
        )}

      </div>
    </>
  );
}

export default OperationsBookings;