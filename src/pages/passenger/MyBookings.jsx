import { useEffect, useState } from "react";

function MyBookings() {
  const [filter, setFilter] = useState("All");

  const [bookings, setBookings] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const getStoredUser = () => {
    const localUser = localStorage.getItem("user");
    const sessionUser = sessionStorage.getItem("user");

    try {
      if (localUser) {
        return JSON.parse(localUser);
      }

      if (sessionUser) {
        return JSON.parse(sessionUser);
      }

      return null;
    } catch {
      return null;
    }
  };

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      ""
    );
  };

  const user = getStoredUser();
  const API_BASE_URL = "http://localhost:5171/api";

  const getHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  useEffect(() => {
    loadBookings(false);

    const intervalId = setInterval(() => {
      loadBookings(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const loadBookings = async (silent = false) => {
    const token = getToken();

    if (!token) {
      setError("Please login to view your bookings.");
      setLoading(false);
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
        setError("");
      }

      const [bookingsResponse, vehicleTypesResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/bookings/my`, {
            headers: getHeaders(),
          }),

          fetch(`${API_BASE_URL}/vehicletypes`, {
            headers: getHeaders(),
          }),
        ]);

      if (!bookingsResponse.ok) {
        let errorData = null;

        try {
          errorData = await bookingsResponse.json();
        } catch {
          errorData = null;
        }

        throw new Error(
          errorData?.message ||
            "Unable to load your bookings."
        );
      }

      const passengerBookings =
        await bookingsResponse.json();

      const vehicleData =
        vehicleTypesResponse.ok
          ? await vehicleTypesResponse.json()
          : [];

      passengerBookings.sort((a, b) => {
        const aDate = new Date(a.createdAt || 0);
        const bDate = new Date(b.createdAt || 0);
        return bDate - aDate;
      });

      setBookings(passengerBookings);
      setVehicleTypes(vehicleData);

      // Passenger pages must not request the global users/drivers lists.
      // Driver display falls back to "Assigned Driver" when an assignment exists.
      setDrivers([]);
      setUsers([]);
    } catch (err) {
      console.error(
        "My bookings error:",
        err
      );

      if (!silent) {
        setError(
          err.message ||
            "Unable to load your bookings."
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const formatStatus = (status) => {
    if (!status) {
      return "Unknown";
    }

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "PENDING":
        return "pending";

      case "WAITING_FOR_DRIVER":
        return "waiting";

      case "ACCEPTED":
        return "accepted";

      case "DRIVER_ARRIVING":
        return "arriving";

      case "DRIVER_ARRIVED":
        return "arrived";

      case "ON_RIDE":
        return "onride";

      case "COMPLETED":
        return "completed";

      case "CANCELLED":
        return "cancelled";

      case "REJECTED":
        return "rejected";

      default:
        return "default";
    }
  };

  const getVehicleName = (
    vehicleTypeId
  ) => {
    const vehicle =
      vehicleTypes.find(
        (item) =>
          Number(
            item.vehicleTypeId
          ) ===
          Number(vehicleTypeId)
      );

    return vehicle?.typeName || "—";
  };

  const getDriverName = (
    driverId
  ) => {
    if (!driverId) {
      return "Not Assigned";
    }

    const driver =
      drivers.find(
        (item) =>
          Number(item.driverId) ===
          Number(driverId)
      );

    if (!driver) {
      return "Assigned Driver";
    }

    const driverUser =
      users.find(
        (item) =>
          Number(item.userId) ===
          Number(driver.userId)
      );

    return (
      driverUser?.fullName ||
      "Assigned Driver"
    );
  };

  const getFilterCategory = (
    status
  ) => {
    if (
      [
        "PENDING",
        "WAITING_FOR_DRIVER",
        "ACCEPTED",
        "DRIVER_ARRIVING",
        "DRIVER_ARRIVED",
        "ON_RIDE",
      ].includes(status)
    ) {
      return "Active";
    }

    if (status === "COMPLETED") {
      return "Completed";
    }

    if (
      status === "CANCELLED"
    ) {
      return "Cancelled";
    }

    if (
      status === "REJECTED"
    ) {
      return "Rejected";
    }

    return "Other";
  };

  const filteredBookings =
    filter === "All"
      ? bookings
      : bookings.filter(
          (booking) =>
            getFilterCategory(
              booking.bookingStatus
            ) === filter
        );

  const activeBooking = bookings.find((booking) =>
    ["PENDING", "WAITING_FOR_DRIVER", "ACCEPTED", "DRIVER_ARRIVING", "DRIVER_ARRIVED", "ON_RIDE"].includes(
      booking.bookingStatus
    )
  );

  const rideSteps = [
    { key: "PENDING", label: "Booking Requested" },
    { key: "WAITING_FOR_DRIVER", label: "Finding Driver" },
    { key: "ACCEPTED", label: "Driver Accepted" },
    { key: "DRIVER_ARRIVING", label: "Driver Arriving" },
    { key: "DRIVER_ARRIVED", label: "Driver Arrived" },
    { key: "ON_RIDE", label: "On Ride" },
    { key: "COMPLETED", label: "Completed" },
  ];

  const getStepIndex = (status) => {
    const index = rideSteps.findIndex((step) => step.key === status);
    return index < 0 ? 0 : index;
  };

  const getLiveMessage = (status) => {
    switch (status) {
      case "PENDING":
        return "Your booking has been received. Waiting for the Taxi Operator.";
      case "WAITING_FOR_DRIVER":
        return "A driver and vehicle are being arranged for your trip.";
      case "ACCEPTED":
        return "Your driver has accepted the trip.";
      case "DRIVER_ARRIVING":
        return "Your driver is on the way to the pickup location.";
      case "DRIVER_ARRIVED":
        return "Your driver has arrived at the pickup location.";
      case "ON_RIDE":
        return "Your trip is now in progress.";
      default:
        return "Your booking status will update automatically.";
    }
  };

  const handleViewBooking =
    async (booking) => {
      setSelectedBooking(booking);
      setBookingHistory([]);
      setHistoryLoading(true);

      try {
        const response =
          await fetch(
            `${API_BASE_URL}/bookings/${booking.bookingId}/history`,
            {
              headers: getHeaders(),
            }
          );

        if (response.ok) {
          const data =
            await response.json();

          setBookingHistory(data);
        }
      } catch (err) {
        console.error(
          "Booking history error:",
          err
        );
      } finally {
        setHistoryLoading(false);
      }
    };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return date;
    }

    return parsed.toLocaleDateString();
  };

  const formatTime = (time) => {
    if (!time) {
      return "—";
    }

    return time
      .toString()
      .substring(0, 5);
  };

  return (
    <>
      <style>{`
        .my-bookings-page {
          min-height: 100vh;

          padding: 30px;

          background: #f4f7fa;

          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .my-bookings-page h1 {
          margin: 0 0 6px;

          color: #0b2946;

          font-size: 28px;
        }

        .my-bookings-page > p {
          margin: 0 0 20px;

          color: #7b8794;

          font-size: 12px;
        }

        .booking-summary {
          display: grid;

          grid-template-columns:
            repeat(4, 1fr);

          gap: 12px;

          margin-bottom: 20px;
        }

        .booking-summary-card {
          padding: 15px;

          background: white;

          border:
            1px solid #e2e7ec;

          border-radius: 8px;
        }

        .booking-summary-card span {
          display: block;

          margin-bottom: 5px;

          color: #7b8794;

          font-size: 9px;
        }

        .booking-summary-card strong {
          color: #0b2946;

          font-size: 20px;
        }

        .booking-filter-bar {
          display: flex;

          flex-wrap: wrap;

          gap: 8px;

          margin-bottom: 18px;
        }

        .booking-filter-bar button {
          padding: 8px 13px;

          border:
            1px solid #d8e0e6;

          background: white;

          border-radius: 20px;

          color: #61717f;

          font-size: 9px;

          cursor: pointer;
        }

        .booking-filter-bar button.active {
          background: #f6c20d;

          border-color: #f6c20d;

          color: #0b2946;

          font-weight: 700;
        }

        .booking-table-card {
          background: white;

          border:
            1px solid #e2e7ec;

          border-radius: 10px;

          overflow: hidden;
        }

        .booking-table-wrapper {
          overflow-x: auto;
        }

        .passenger-booking-table {
          width: 100%;

          border-collapse: collapse;

          min-width: 1000px;
        }

        .passenger-booking-table th {
          background: #0b2946;

          color: white;

          padding: 13px;

          text-align: left;

          font-size: 9px;
        }

        .passenger-booking-table td {
          padding: 14px 13px;

          border-bottom:
            1px solid #edf0f3;

          color: #53616e;

          font-size: 10px;
        }

        .booking-id-text {
          color: #0b2946;

          font-weight: 800;
        }

        .booking-status {
          display: inline-block;

          padding: 5px 9px;

          border-radius: 20px;

          font-size: 8px;

          font-weight: 700;

          white-space: nowrap;
        }

        .booking-status.pending {
          background: #fff3cd;
          color: #806400;
        }

        .booking-status.waiting {
          background: #fff3cd;
          color: #806400;
        }

        .booking-status.accepted {
          background: #e3effc;
          color: #24649f;
        }

        .booking-status.arriving {
          background: #e7f0ff;
          color: #245b96;
        }

        .booking-status.arrived {
          background: #e8f6ec;
          color: #18763a;
        }

        .booking-status.onride {
          background: #e4e8ff;
          color: #3f51a3;
        }

        .booking-status.completed {
          background: #e3f6e7;
          color: #18763a;
        }

        .booking-status.cancelled,
        .booking-status.rejected {
          background: #fde7e7;
          color: #a43c3c;
        }

        .booking-status.default {
          background: #edf0f3;
          color: #53616e;
        }

        .passenger-booking-view {
          border:
            1px solid #0b2946;

          background: white;

          color: #0b2946;

          padding: 6px 10px;

          border-radius: 5px;

          font-size: 8px;

          font-weight: 700;

          cursor: pointer;
        }

        .passenger-booking-view:hover {
          background: #0b2946;

          color: white;
        }

        .booking-loading,
        .booking-error,
        .booking-empty {
          padding: 30px;

          text-align: center;

          font-size: 11px;
        }

        .booking-loading {
          color: #607080;
        }

        .booking-error {
          color: #a43c3c;

          background: #fff1f1;
        }

        .booking-empty {
          color: #7b8794;
        }

        .booking-modal-overlay {
          position: fixed;

          top: 0;
          left: 0;
          right: 0;
          bottom: 0;

          z-index: 9999;

          display: flex;

          align-items: center;
          justify-content: center;

          padding: 20px;

          background:
            rgba(3, 20, 36, 0.58);
        }

        .booking-modal {
          width: 100%;

          max-width: 650px;

          max-height: 90vh;

          overflow-y: auto;

          background: white;

          border-radius: 12px;

          box-shadow:
            0 18px 45px
            rgba(0,0,0,0.20);
        }

        .booking-modal-header {
          display: flex;

          justify-content:
            space-between;

          align-items: center;

          gap: 15px;

          padding: 20px 22px;

          background: #0b2946;

          color: white;

          border-radius:
            12px 12px 0 0;
        }

        .booking-modal-header h2 {
          margin: 0;

          font-size: 17px;
        }

        .booking-modal-close {
          border: none;

          background: transparent;

          color: white;

          font-size: 24px;

          cursor: pointer;
        }

        .booking-modal-body {
          padding: 22px;
        }

        .booking-detail-grid {
          display: grid;

          grid-template-columns:
            repeat(2, 1fr);

          gap: 12px;

          margin-bottom: 22px;
        }

        .booking-detail-item {
          padding: 12px;

          background: #f8fafc;

          border:
            1px solid #e7ebef;

          border-radius: 7px;
        }

        .booking-detail-item.full {
          grid-column: 1 / -1;
        }

        .booking-detail-item span {
          display: block;

          margin-bottom: 5px;

          color: #8a959f;

          font-size: 8px;

          text-transform:
            uppercase;
        }

        .booking-detail-item strong {
          color: #0b2946;

          font-size: 11px;

          line-height: 1.5;
        }

        .booking-history-title {
          margin:
            5px 0 12px;

          color: #0b2946;

          font-size: 14px;
        }

        .history-item {
          position: relative;

          margin-bottom: 10px;

          padding: 11px 12px 11px 16px;

          border-left:
            3px solid #f6c20d;

          background: #f8fafc;

          border-radius: 4px;
        }

        .history-item strong {
          display: block;

          margin-bottom: 4px;

          color: #0b2946;

          font-size: 10px;
        }

        .history-item span {
          display: block;

          color: #7b8794;

          font-size: 8px;

          line-height: 1.5;
        }

        .history-empty {
          padding: 12px;

          background: #f8fafc;

          color: #7b8794;

          border-radius: 6px;

          font-size: 9px;
        }

        .live-ride-card {
          margin-bottom: 20px;
          padding: 20px;
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 12px;
          box-shadow: 0 5px 18px rgba(11,41,70,0.06);
        }

        .live-ride-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          margin-bottom: 18px;
        }

        .live-ride-top h2 {
          margin: 0 0 5px;
          color: #0b2946;
          font-size: 18px;
        }

        .live-ride-top p {
          margin: 0;
          color: #71808e;
          font-size: 10px;
        }

        .live-indicator {
          padding: 7px 10px;
          border-radius: 20px;
          background: #e8f6ec;
          color: #24733d;
          font-size: 8px;
          font-weight: 800;
          white-space: nowrap;
        }

        .ride-route {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 12px;
          align-items: center;
          padding: 14px;
          margin-bottom: 18px;
          background: #f8fafc;
          border-radius: 9px;
        }

        .ride-route span {
          display: block;
          margin-bottom: 4px;
          color: #89949e;
          font-size: 8px;
          text-transform: uppercase;
        }

        .ride-route strong {
          color: #0b2946;
          font-size: 10px;
        }

        .route-arrow {
          color: #f6c20d;
          font-size: 22px;
          font-weight: 900;
        }

        .ride-progress {
          display: grid;
          grid-template-columns: repeat(7,1fr);
          gap: 5px;
          margin-bottom: 17px;
        }

        .ride-step {
          position: relative;
          padding-top: 13px;
          color: #9aa5af;
          text-align: center;
          font-size: 7px;
        }

        .ride-step::before {
          content: "";
          position: absolute;
          top: 0;
          left: 50%;
          width: 9px;
          height: 9px;
          transform: translateX(-50%);
          border-radius: 50%;
          background: #d9e0e6;
        }

        .ride-step.done,
        .ride-step.current {
          color: #0b2946;
          font-weight: 700;
        }

        .ride-step.done::before,
        .ride-step.current::before {
          background: #f6c20d;
        }

        .live-info-grid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 10px;
        }

        .live-info {
          padding: 11px;
          border: 1px solid #e7ebef;
          border-radius: 7px;
        }

        .live-info span {
          display: block;
          margin-bottom: 4px;
          color: #8a959f;
          font-size: 8px;
        }

        .live-info strong {
          color: #0b2946;
          font-size: 10px;
        }

        .live-message {
          margin-top: 13px;
          padding: 11px 13px;
          border-radius: 7px;
          background: #fff8d8;
          color: #66520a;
          font-size: 9px;
          line-height: 1.5;
        }

        @media(max-width: 850px) {
          .booking-summary {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .live-info-grid {
            grid-template-columns: 1fr;
          }

          .my-bookings-page {
            padding: 20px;
          }
        }

        @media(max-width: 550px) {
          .booking-summary,
          .booking-detail-grid {
            grid-template-columns:
              1fr;
          }

          .ride-route {
            grid-template-columns: 1fr;
          }

          .route-arrow {
            transform: rotate(90deg);
            text-align: center;
          }

          .ride-progress {
            grid-template-columns: repeat(3,1fr);
            row-gap: 14px;
          }

          .booking-detail-item.full {
            grid-column: auto;
          }
        }
      `}</style>

      <main className="my-bookings-page">

        <h1>My Bookings</h1>

        <p>
          View your current and previous
          taxi bookings.
        </p>

        {activeBooking && (
          <section className="live-ride-card">
            <div className="live-ride-top">
              <div>
                <h2>Current Ride · Booking #{activeBooking.bookingId}</h2>
                <p>{getLiveMessage(activeBooking.bookingStatus)}</p>
              </div>
              <span className="live-indicator">● LIVE · Auto updating</span>
            </div>

            <div className="ride-route">
              <div>
                <span>Pickup</span>
                <strong>{activeBooking.pickupLocation || "—"}</strong>
              </div>
              <div className="route-arrow">→</div>
              <div>
                <span>Destination</span>
                <strong>{activeBooking.destination || "—"}</strong>
              </div>
            </div>

            <div className="ride-progress">
              {rideSteps.map((step, index) => {
                const currentIndex = getStepIndex(activeBooking.bookingStatus);
                return (
                  <div
                    key={step.key}
                    className={`ride-step ${
                      index < currentIndex
                        ? "done"
                        : index === currentIndex
                        ? "current"
                        : ""
                    }`}
                  >
                    {step.label}
                  </div>
                );
              })}
            </div>

            <div className="live-info-grid">
              <div className="live-info">
                <span>Current Status</span>
                <strong>{formatStatus(activeBooking.bookingStatus)}</strong>
              </div>
              <div className="live-info">
                <span>Vehicle Type</span>
                <strong>{getVehicleName(activeBooking.vehicleTypeId)}</strong>
              </div>
              <div className="live-info">
                <span>Driver</span>
                <strong>{getDriverName(activeBooking.assignedDriverId)}</strong>
              </div>
            </div>

            <div className="live-message">
              This booking checks for status changes automatically every 5 seconds.
              You do not need to refresh this page.
            </div>
          </section>
        )}

        <div className="booking-summary">

          <div className="booking-summary-card">
            <span>Total Bookings</span>

            <strong>
              {bookings.length}
            </strong>
          </div>

          <div className="booking-summary-card">
            <span>Active Bookings</span>

            <strong>
              {
                bookings.filter(
                  (booking) =>
                    getFilterCategory(
                      booking.bookingStatus
                    ) === "Active"
                ).length
              }
            </strong>
          </div>

          <div className="booking-summary-card">
            <span>Completed</span>

            <strong>
              {
                bookings.filter(
                  (booking) =>
                    booking.bookingStatus ===
                    "COMPLETED"
                ).length
              }
            </strong>
          </div>

          <div className="booking-summary-card">
            <span>Cancelled / Rejected</span>

            <strong>
              {
                bookings.filter(
                  (booking) =>
                    booking.bookingStatus ===
                      "CANCELLED" ||
                    booking.bookingStatus ===
                      "REJECTED"
                ).length
              }
            </strong>
          </div>

        </div>

        <div className="booking-filter-bar">

          {[
            "All",
            "Active",
            "Completed",
            "Cancelled",
            "Rejected",
          ].map((item) => (
            <button
              key={item}
              type="button"
              className={
                filter === item
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter(item)
              }
            >
              {item}
            </button>
          ))}

        </div>

        <div className="booking-table-card">

          {loading ? (
            <div className="booking-loading">
              Loading your bookings...
            </div>
          ) : error ? (
            <div className="booking-error">
              {error}
            </div>
          ) : filteredBookings.length ===
            0 ? (
            <div className="booking-empty">
              No bookings found.
            </div>
          ) : (
            <div className="booking-table-wrapper">

              <table className="passenger-booking-table">

                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Date</th>
                    <th>Pickup</th>
                    <th>Destination</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredBookings.map(
                    (booking) => (
                      <tr
                        key={
                          booking.bookingId
                        }
                      >
                        <td>
                          <span className="booking-id-text">
                            #
                            {
                              booking.bookingId
                            }
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            booking.bookingDate
                          )}
                        </td>

                        <td>
                          {
                            booking.pickupLocation
                          }
                        </td>

                        <td>
                          {
                            booking.destination
                          }
                        </td>

                        <td>
                          {getVehicleName(
                            booking.vehicleTypeId
                          )}
                        </td>

                        <td>
                          {getDriverName(
                            booking.assignedDriverId
                          )}
                        </td>

                        <td>
                          <span
                            className={`booking-status ${getStatusClass(
                              booking.bookingStatus
                            )}`}
                          >
                            {formatStatus(
                              booking.bookingStatus
                            )}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="passenger-booking-view"
                            onClick={() =>
                              handleViewBooking(
                                booking
                              )
                            }
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </main>

      {selectedBooking && (
        <div
          className="booking-modal-overlay"
          onClick={() =>
            setSelectedBooking(null)
          }
        >

          <div
            className="booking-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="booking-modal-header">

              <h2>
                Booking #
                {
                  selectedBooking.bookingId
                }
              </h2>

              <button
                type="button"
                className="booking-modal-close"
                onClick={() =>
                  setSelectedBooking(null)
                }
              >
                ×
              </button>

            </div>

            <div className="booking-modal-body">

              <div className="booking-detail-grid">

                <div className="booking-detail-item">
                  <span>Status</span>

                  <strong>
                    {formatStatus(
                      selectedBooking.bookingStatus
                    )}
                  </strong>
                </div>

                <div className="booking-detail-item">
                  <span>
                    Booking Source
                  </span>

                  <strong>
                    {formatStatus(
                      selectedBooking.bookingSource
                    )}
                  </strong>
                </div>

                <div className="booking-detail-item full">
                  <span>
                    Pickup Location
                  </span>

                  <strong>
                    {
                      selectedBooking.pickupLocation
                    }
                  </strong>
                </div>

                <div className="booking-detail-item full">
                  <span>
                    Destination
                  </span>

                  <strong>
                    {
                      selectedBooking.destination
                    }
                  </strong>
                </div>

                <div className="booking-detail-item">
                  <span>Vehicle</span>

                  <strong>
                    {getVehicleName(
                      selectedBooking.vehicleTypeId
                    )}
                  </strong>
                </div>

                <div className="booking-detail-item">
                  <span>Driver</span>

                  <strong>
                    {getDriverName(
                      selectedBooking.assignedDriverId
                    )}
                  </strong>
                </div>

                <div className="booking-detail-item">
                  <span>Date</span>

                  <strong>
                    {formatDate(
                      selectedBooking.bookingDate
                    )}
                  </strong>
                </div>

                <div className="booking-detail-item">
                  <span>Time</span>

                  <strong>
                    {formatTime(
                      selectedBooking.bookingTime
                    )}
                  </strong>
                </div>

              </div>

              <h3 className="booking-history-title">
                Booking Status History
              </h3>

              {historyLoading ? (
                <div className="history-empty">
                  Loading booking history...
                </div>
              ) : bookingHistory.length ===
                0 ? (
                <div className="history-empty">
                  No status history
                  available.
                </div>
              ) : (
                bookingHistory.map(
                  (history) => (
                    <div
                      className="history-item"
                      key={
                        history.historyId
                      }
                    >
                      <strong>
                        {history.oldStatus
                          ? `${formatStatus(
                              history.oldStatus
                            )} → `
                          : ""}
                        {formatStatus(
                          history.newStatus
                        )}
                      </strong>

                      <span>
                        {history.remarks ||
                          "Booking status updated"}
                      </span>

                      <span>
                        {history.changedAt
                          ? new Date(
                              history.changedAt
                            ).toLocaleString()
                          : ""}
                      </span>
                    </div>
                  )
                )
              )}

            </div>

          </div>

        </div>
      )}
    </>
  );
}

export default MyBookings;