import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function DriverDashboard() {
  const navigate = useNavigate();

  const [driver, setDriver] = useState(null);
  const [status, setStatus] = useState("OFFLINE");

  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [vehicleType, setVehicleType] = useState(null);

  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getStoredUser = () => {
    try {
      const localUser = localStorage.getItem("user");
      const sessionUser = sessionStorage.getItem("user");

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

  const user = getStoredUser();

  const formatStatus = (value) => {
    if (!value) {
      return "Unknown";
    }

    return value
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const loadDashboard = async () => {
    if (!user) {
      setError("Please login to your driver account.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const driverResponse = await fetch(
        `http://localhost:5171/api/drivers/user/${user.userId}`,
        {
          headers: getHeaders(),
        }
      );

      if (!driverResponse.ok) {
        throw new Error(
          "Driver profile was not found for this account."
        );
      }

      const driverData = await driverResponse.json();

      setDriver(driverData);
      setStatus(driverData.operationalStatus || "OFFLINE");

      const [
        bookingsResponse,
        vehiclesResponse,
        vehicleTypesResponse,
        notificationsResponse,
      ] = await Promise.all([
        fetch("http://localhost:5171/api/bookings", {
          headers: getHeaders(),
        }),

        fetch("http://localhost:5171/api/vehicles", {
          headers: getHeaders(),
        }),

        fetch("http://localhost:5171/api/vehicletypes", {
          headers: getHeaders(),
        }),

        fetch(
          `http://localhost:5171/api/notifications/user/${user.userId}`,
          {
            headers: getHeaders(),
          }
        ),
      ]);

      if (!bookingsResponse.ok) {
        throw new Error("Unable to load driver bookings.");
      }

      const allBookings = await bookingsResponse.json();

      const allVehicles = vehiclesResponse.ok
        ? await vehiclesResponse.json()
        : [];

      const allVehicleTypes = vehicleTypesResponse.ok
        ? await vehicleTypesResponse.json()
        : [];

      const driverNotifications = notificationsResponse.ok
        ? await notificationsResponse.json()
        : [];

      const driverBookings = allBookings
        .filter(
          (booking) =>
            Number(booking.assignedDriverId) ===
            Number(driverData.driverId)
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
        );

      setBookings(driverBookings);
      setNotifications(driverNotifications);

      const assignedVehicle = allVehicles.find(
        (item) =>
          Number(item.driverId) ===
          Number(driverData.driverId)
      );

      setVehicle(assignedVehicle || null);

      if (assignedVehicle) {
        const foundVehicleType = allVehicleTypes.find(
          (item) =>
            Number(item.vehicleTypeId) ===
            Number(assignedVehicle.vehicleTypeId)
        );

        setVehicleType(foundVehicleType || null);
      } else {
        setVehicleType(null);
      }
    } catch (err) {
      console.error("Driver dashboard error:", err);

      setError(
        err.message ||
          "Unable to load driver dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleStatusChange = async (newStatus) => {
    if (!driver) {
      return;
    }

    try {
      setStatusLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `http://localhost:5171/api/drivers/${driver.driverId}/status`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to update driver status."
        );
      }

      setStatus(data.operationalStatus || newStatus);

      setDriver((current) => ({
        ...current,
        operationalStatus:
          data.operationalStatus || newStatus,
      }));

      setMessage(
        `Driver status changed to ${formatStatus(
          data.operationalStatus || newStatus
        )}.`
      );
    } catch (err) {
      console.error("Driver status error:", err);

      setError(
        err.message ||
          "Unable to update driver status."
      );
    } finally {
      setStatusLoading(false);
    }
  };

  const today = new Date();

  const todayTrips = bookings.filter((booking) => {
    if (!booking.bookingDate) {
      return false;
    }

    const bookingDate = new Date(booking.bookingDate);

    return (
      bookingDate.getFullYear() === today.getFullYear() &&
      bookingDate.getMonth() === today.getMonth() &&
      bookingDate.getDate() === today.getDate()
    );
  }).length;

  const pendingRequests = bookings.filter(
    (booking) =>
      booking.bookingStatus === "WAITING_FOR_DRIVER"
  ).length;

  const completedTrips = bookings.filter(
    (booking) =>
      booking.bookingStatus === "COMPLETED"
  ).length;

  const unreadNotifications = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const currentTrip = bookings.find((booking) =>
    [
      "ON_RIDE",
      "DRIVER_ARRIVING",
      "ACCEPTED",
    ].includes(booking.bookingStatus)
  );

  const getStatusClass = () => {
    if (status === "AVAILABLE") {
      return "available";
    }

    if (status === "ON_RIDE") {
      return "onride";
    }

    return "offline";
  };

  const getStatusDescription = () => {
    if (status === "AVAILABLE") {
      return "You can receive new taxi booking requests.";
    }

    if (status === "ON_RIDE") {
      return "You are currently completing a trip.";
    }

    return "You will not receive new booking requests while offline.";
  };

  const getCurrentTripButton = () => {
    if (!currentTrip) {
      return null;
    }

    if (currentTrip.bookingStatus === "ACCEPTED") {
      return "Manage Trip";
    }

    if (currentTrip.bookingStatus === "DRIVER_ARRIVING") {
      return "Start Trip";
    }

    if (currentTrip.bookingStatus === "ON_RIDE") {
      return "Complete Trip";
    }

    return "View Trip";
  };

  return (
    <>
      <style>{`
        .driver-dashboard-page {
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .driver-dashboard-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .driver-dashboard-top h1 {
          margin: 0 0 6px;
          color: #0b2946;
          font-size: 28px;
          font-weight: 800;
        }

        .driver-dashboard-top p {
          margin: 0;
          color: #7b8794;
          font-size: 12px;
        }

        .driver-status-control {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px;
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 8px;
        }

        .driver-status-control label {
          padding-left: 5px;
          color: #6f7c88;
          font-size: 10px;
          font-weight: 700;
        }

        .driver-status-control select {
          border: none;
          outline: none;
          padding: 8px 10px;
          border-radius: 5px;
          background: #f4f7fa;
          color: #0b2946;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .driver-status-control select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .driver-dashboard-alert {
          margin-bottom: 18px;
          padding: 12px 14px;
          border-radius: 7px;
          font-size: 10px;
          line-height: 1.5;
        }

        .driver-dashboard-alert.error {
          background: #fff1f1;
          border: 1px solid #efc8c8;
          color: #a43c3c;
        }

        .driver-dashboard-alert.success {
          background: #e7f6eb;
          border: 1px solid #c9e7d1;
          color: #18763a;
        }

        .driver-status-banner {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 22px;
          padding: 15px 17px;
          background: white;
          border: 1px solid #e1e7eb;
          border-radius: 8px;
        }

        .driver-status-dot {
          width: 11px;
          height: 11px;
          flex-shrink: 0;
          border-radius: 50%;
        }

        .driver-status-dot.available {
          background: #21a453;
        }

        .driver-status-dot.onride {
          background: #3284d6;
        }

        .driver-status-dot.offline {
          background: #db4141;
        }

        .driver-status-banner h3 {
          margin: 0 0 3px;
          color: #0b2946;
          font-size: 12px;
        }

        .driver-status-banner p {
          margin: 0;
          color: #718078;
          font-size: 10px;
        }

        .driver-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .driver-summary-card {
          background: white;
          border: 1px solid #e3e8ed;
          border-radius: 9px;
          padding: 18px;
          box-shadow: 0 3px 12px rgba(11,41,70,0.04);
        }

        .driver-summary-card span {
          display: block;
          margin-bottom: 7px;
          color: #89949e;
          font-size: 9px;
          font-weight: 700;
        }

        .driver-summary-card h2 {
          margin: 0;
          color: #0b2946;
          font-size: 23px;
        }

        .driver-dashboard-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 20px;
        }

        .driver-dashboard-card {
          background: white;
          border: 1px solid #e3e8ed;
          border-radius: 10px;
          padding: 21px;
          box-shadow: 0 4px 14px rgba(11,41,70,0.04);
        }

        .driver-dashboard-card h2 {
          margin: 0 0 17px;
          color: #0b2946;
          font-size: 16px;
        }

        .driver-trip-badge {
          display: inline-block;
          margin-bottom: 14px;
          padding: 5px 9px;
          background: #fff3cc;
          color: #806300;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
        }

        .driver-trip-row {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 10px 0;
          border-bottom: 1px solid #edf0f3;
        }

        .driver-trip-row span {
          color: #8a949e;
          font-size: 10px;
        }

        .driver-trip-row strong {
          color: #0b2946;
          font-size: 11px;
          text-align: right;
        }

        .driver-trip-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 18px;
        }

        .driver-trip-actions button {
          padding: 10px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .driver-view-trip {
          border: 1px solid #0b2946;
          background: white;
          color: #0b2946;
        }

        .driver-start-trip {
          border: none;
          background: #f6c20d;
          color: #0b2946;
        }

        .driver-no-trip {
          padding: 24px;
          background: #f8fafc;
          border: 1px dashed #d7dfe5;
          border-radius: 8px;
          text-align: center;
        }

        .driver-no-trip strong {
          display: block;
          margin-bottom: 6px;
          color: #0b2946;
          font-size: 12px;
        }

        .driver-no-trip p {
          margin: 0;
          color: #7b8794;
          font-size: 10px;
        }

        .driver-quick-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 11px;
        }

        .driver-quick-btn {
          position: relative;
          padding: 17px 10px;
          border: 1px solid #e1e6ea;
          border-radius: 8px;
          background: #f8fafc;
          color: #0b2946;
          text-align: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .driver-quick-btn:hover {
          border-color: #f6c20d;
          background: #fffaf0;
        }

        .driver-quick-icon {
          display: block;
          margin-bottom: 7px;
          font-size: 21px;
        }

        .driver-quick-btn strong {
          display: block;
          font-size: 10px;
        }

        .driver-notification-count {
          position: absolute;
          top: 7px;
          right: 7px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #db4141;
          color: white;
          border-radius: 20px;
          font-size: 7px;
          font-weight: 800;
        }

        .driver-vehicle-box {
          margin-top: 20px;
          padding: 14px;
          background: #f8fafc;
          border: 1px solid #e4e9ed;
          border-radius: 8px;
        }

        .driver-vehicle-box h3 {
          margin: 0 0 10px;
          color: #0b2946;
          font-size: 12px;
        }

        .driver-vehicle-box p {
          margin: 5px 0;
          color: #697784;
          font-size: 10px;
        }

        .driver-gps-connected,
        .driver-gps-disconnected {
          display: inline-block;
          margin-top: 7px;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 8px;
          font-weight: 700;
        }

        .driver-gps-connected {
          background: #e3f6e7;
          color: #18763a;
        }

        .driver-gps-disconnected {
          background: #fde7e7;
          color: #a13a3a;
        }

        .driver-dashboard-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f4f7fa;
          color: #7b8794;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
        }

        @media (max-width: 1000px) {
          .driver-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .driver-dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .driver-dashboard-page {
            padding: 18px;
          }

          .driver-dashboard-top {
            flex-direction: column;
          }

          .driver-summary-grid {
            grid-template-columns: 1fr;
          }

          .driver-trip-actions,
          .driver-quick-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {loading ? (
        <div className="driver-dashboard-loading">
          Loading driver dashboard...
        </div>
      ) : (
        <main className="driver-dashboard-page">
          <div className="driver-dashboard-top">
            <div>
              <h1>Driver Dashboard</h1>

              <p>
                Welcome back, {user?.fullName || "Driver"}. Manage
                your trips and availability.
              </p>
            </div>

            <div className="driver-status-control">
              <label>My Status</label>

              <select
                value={status}
                disabled={statusLoading}
                onChange={(e) =>
                  handleStatusChange(e.target.value)
                }
              >
                <option value="AVAILABLE">
                  Available
                </option>

                <option value="ON_RIDE">
                  On Ride
                </option>

                <option value="OFFLINE">
                  Offline
                </option>
              </select>
            </div>
          </div>

          {error && (
            <div className="driver-dashboard-alert error">
              {error}
            </div>
          )}

          {message && (
            <div className="driver-dashboard-alert success">
              {message}
            </div>
          )}

          <div className="driver-status-banner">
            <span
              className={`driver-status-dot ${getStatusClass()}`}
            />

            <div>
              <h3>
                Current Status: {formatStatus(status)}
              </h3>

              <p>{getStatusDescription()}</p>
            </div>
          </div>

          <div className="driver-summary-grid">
            <div className="driver-summary-card">
              <span>TODAY'S TRIPS</span>
              <h2>{todayTrips}</h2>
            </div>

            <div className="driver-summary-card">
              <span>PENDING REQUESTS</span>
              <h2>{pendingRequests}</h2>
            </div>

            <div className="driver-summary-card">
              <span>COMPLETED TRIPS</span>
              <h2>{completedTrips}</h2>
            </div>

            <div className="driver-summary-card">
              <span>UNREAD NOTIFICATIONS</span>
              <h2>{unreadNotifications}</h2>
            </div>
          </div>

          <div className="driver-dashboard-grid">
            <section className="driver-dashboard-card">
              <h2>Current / Assigned Trip</h2>

              {currentTrip ? (
                <>
                  <span className="driver-trip-badge">
                    {formatStatus(currentTrip.bookingStatus)}
                  </span>

                  <div className="driver-trip-row">
                    <span>Booking ID</span>
                    <strong>
                      #{currentTrip.bookingId}
                    </strong>
                  </div>

                  <div className="driver-trip-row">
                    <span>Passenger</span>
                    <strong>
                      {currentTrip.passengerName}
                    </strong>
                  </div>

                  <div className="driver-trip-row">
                    <span>Phone</span>
                    <strong>
                      {currentTrip.passengerPhone}
                    </strong>
                  </div>

                  <div className="driver-trip-row">
                    <span>Pickup</span>
                    <strong>
                      {currentTrip.pickupLocation}
                    </strong>
                  </div>

                  <div className="driver-trip-row">
                    <span>Destination</span>
                    <strong>
                      {currentTrip.destination}
                    </strong>
                  </div>

                  <div className="driver-trip-actions">
                    <button
                      type="button"
                      className="driver-view-trip"
                      onClick={() =>
                        navigate("/driver/trips")
                      }
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      className="driver-start-trip"
                      onClick={() =>
                        navigate("/driver/trips")
                      }
                    >
                      {getCurrentTripButton()}
                    </button>
                  </div>
                </>
              ) : (
                <div className="driver-no-trip">
                  <strong>No Active Trip</strong>

                  <p>
                    You currently have no accepted or active
                    taxi trip.
                  </p>
                </div>
              )}
            </section>

            <section className="driver-dashboard-card">
              <h2>Quick Actions</h2>

              <div className="driver-quick-actions">
                <button
                  type="button"
                  className="driver-quick-btn"
                  onClick={() =>
                    navigate("/driver/requests")
                  }
                >
                  <span className="driver-quick-icon">
                    📋
                  </span>

                  <strong>
                    Trip Requests
                  </strong>
                </button>

                <button
                  type="button"
                  className="driver-quick-btn"
                  onClick={() =>
                    navigate("/driver/trips")
                  }
                >
                  <span className="driver-quick-icon">
                    🚕
                  </span>

                  <strong>My Trips</strong>
                </button>

                <button
                  type="button"
                  className="driver-quick-btn"
                  onClick={() =>
                    navigate("/driver/location")
                  }
                >
                  <span className="driver-quick-icon">
                    📍
                  </span>

                  <strong>Location</strong>
                </button>

                <button
                  type="button"
                  className="driver-quick-btn"
                  onClick={() =>
                    navigate("/driver/notifications")
                  }
                >
                  {unreadNotifications > 0 && (
                    <span className="driver-notification-count">
                      {unreadNotifications}
                    </span>
                  )}

                  <span className="driver-quick-icon">
                    🔔
                  </span>

                  <strong>
                    Notifications
                  </strong>
                </button>
              </div>

              <div className="driver-vehicle-box">
                <h3>Assigned Vehicle</h3>

                {vehicle ? (
                  <>
                    <p>
                      {vehicleType?.typeName || "Vehicle"} •{" "}
                      {vehicle.registrationNumber}
                    </p>

                    <p>
                      Vehicle Status:{" "}
                      {formatStatus(
                        vehicle.operationalStatus
                      )}
                    </p>

                    <span
                      className={
                        driver?.gpsEnabled
                          ? "driver-gps-connected"
                          : "driver-gps-disconnected"
                      }
                    >
                      {driver?.gpsEnabled
                        ? "● GPS Connected"
                        : "● GPS Disconnected"}
                    </span>
                  </>
                ) : (
                  <p>
                    No vehicle is currently assigned to this
                    driver.
                  </p>
                )}
              </div>
            </section>
          </div>
        </main>
      )}
    </>
  );
}

export default DriverDashboard;