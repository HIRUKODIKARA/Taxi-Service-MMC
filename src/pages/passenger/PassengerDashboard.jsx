import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function PassengerDashboard() {
  const navigate = useNavigate();
  const API_BASE_URL = "/api";

  const [profile, setProfile] = useState({ fullName: "Passenger" });
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getToken = () =>
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("accessToken") ||
    "";

  const getHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadDashboard = async () => {
    const token = getToken();

    if (!token) {
      setError("Please login to view your passenger dashboard.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [profileResponse, bookingsResponse, notificationsResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/users/me`, {
            headers: getHeaders(),
          }),
          fetch(`${API_BASE_URL}/bookings/my`, {
            headers: getHeaders(),
          }),
          fetch(`${API_BASE_URL}/notifications/me`, {
            headers: getHeaders(),
          }),
        ]);

      if (!profileResponse.ok) {
        throw new Error("Unable to load passenger information.");
      }

      if (!bookingsResponse.ok) {
        throw new Error("Unable to load your bookings.");
      }

      const profileData = await profileResponse.json();
      const bookingsData = await bookingsResponse.json();
      const notificationsData = notificationsResponse.ok
        ? await notificationsResponse.json()
        : [];

      setProfile({
        fullName: profileData.fullName || "Passenger",
      });

      setBookings(
        [...bookingsData].sort(
          (a, b) =>
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        )
      );

      setNotifications(notificationsData);
    } catch (err) {
      console.error("Passenger dashboard error:", err);
      setError(err.message || "Unable to load passenger dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    const handleProfileUpdated = () => loadDashboard();
    window.addEventListener(
      "passenger-profile-updated",
      handleProfileUpdated
    );

    return () =>
      window.removeEventListener(
        "passenger-profile-updated",
        handleProfileUpdated
      );
  }, []);

  const activeStatuses = [
    "PENDING",
    "WAITING_FOR_DRIVER",
    "ACCEPTED",
    "DRIVER_ARRIVING",
    "ON_RIDE",
  ];

  const activeBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        activeStatuses.includes(booking.bookingStatus)
      ),
    [bookings]
  );

  const currentBooking = activeBookings[0] || null;

  const completedTrips = bookings.filter(
    (booking) => booking.bookingStatus === "COMPLETED"
  ).length;

  const unreadNotifications = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const canTrack =
    currentBooking &&
    ["ACCEPTED", "DRIVER_ARRIVING", "ON_RIDE"].includes(
      currentBooking.bookingStatus
    ) &&
    currentBooking.assignedDriverId;

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

        .passenger-dashboard-error,
        .passenger-dashboard-loading,
        .passenger-empty-booking {
          margin-bottom: 20px;
          padding: 14px;
          border-radius: 8px;
          font-size: 10px;
          line-height: 1.6;
        }

        .passenger-dashboard-error {
          background: #fff1f1;
          border: 1px solid #efc8c8;
          color: #a43c3c;
        }

        .passenger-dashboard-loading,
        .passenger-empty-booking {
          background: white;
          border: 1px solid #e2e7ec;
          color: #7b8794;
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

        .passenger-current-actions button:disabled {
          opacity: .5;
          cursor: not-allowed;
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
          Welcome back, {profile.fullName}. Manage your taxi bookings and trips.
        </p>

        {error && (
          <div className="passenger-dashboard-error">{error}</div>
        )}

        {loading ? (
          <div className="passenger-dashboard-loading">
            Loading passenger dashboard...
          </div>
        ) : (
          <>
            <div className="passenger-summary-grid">
              <div className="passenger-summary-card">
                <span>TOTAL BOOKINGS</span>
                <h2>{bookings.length}</h2>
              </div>

              <div className="passenger-summary-card">
                <span>ACTIVE BOOKINGS</span>
                <h2>{activeBookings.length}</h2>
              </div>

              <div className="passenger-summary-card">
                <span>COMPLETED TRIPS</span>
                <h2>{completedTrips}</h2>
              </div>

              <div className="passenger-summary-card">
                <span>UNREAD NOTIFICATIONS</span>
                <h2>{unreadNotifications}</h2>
              </div>
            </div>

            <div className="passenger-dashboard-grid">
              <section className="passenger-card">
                <h2>Current Booking</h2>

                {!currentBooking ? (
                  <div className="passenger-empty-booking">
                    You do not have an active booking right now.
                    <br />
                    Use <strong>Book Taxi</strong> to create a new request.
                  </div>
                ) : (
                  <>
                    <span className="passenger-status">
                      {formatStatus(currentBooking.bookingStatus)}
                    </span>

                    <div className="current-booking-row">
                      <span>Booking ID</span>
                      <strong>#{currentBooking.bookingId}</strong>
                    </div>

                    <div className="current-booking-row">
                      <span>Pickup</span>
                      <strong>
                        {currentBooking.pickupLocation || "—"}
                      </strong>
                    </div>

                    <div className="current-booking-row">
                      <span>Destination</span>
                      <strong>
                        {currentBooking.destination || "—"}
                      </strong>
                    </div>

                    <div className="current-booking-row">
                      <span>Driver</span>
                      <strong>
                        {currentBooking.assignedDriverId
                          ? `Assigned (Driver #${currentBooking.assignedDriverId})`
                          : "Waiting for assignment"}
                      </strong>
                    </div>

                    <div className="current-booking-row">
                      <span>Vehicle</span>
                      <strong>
                        {currentBooking.assignedVehicleId
                          ? `Assigned (Vehicle #${currentBooking.assignedVehicleId})`
                          : "Waiting for assignment"}
                      </strong>
                    </div>

                    <div className="passenger-current-actions">
                      <button
                        type="button"
                        className="passenger-outline-btn"
                        onClick={() =>
                          navigate("/passenger/bookings")
                        }
                      >
                        View Booking
                      </button>

                      <button
                        type="button"
                        className="passenger-yellow-btn"
                        disabled={!canTrack}
                        onClick={() =>
                          navigate("/passenger/tracking")
                        }
                      >
                        {canTrack
                          ? "Track Driver"
                          : "Tracking Pending"}
                      </button>
                    </div>
                  </>
                )}
              </section>

              <section className="passenger-card">
                <h2>Quick Actions</h2>

                <div className="passenger-quick-grid">
                  <button
                    type="button"
                    className="passenger-quick-btn"
                    onClick={() =>
                      navigate("/passenger/book-taxi")
                    }
                  >
                    <span>🚕</span>
                    Book Taxi
                  </button>

                  <button
                    type="button"
                    className="passenger-quick-btn"
                    onClick={() =>
                      navigate("/passenger/bookings")
                    }
                  >
                    <span>📋</span>
                    My Bookings
                  </button>

                  <button
                    type="button"
                    className="passenger-quick-btn"
                    onClick={() =>
                      navigate("/passenger/tracking")
                    }
                  >
                    <span>📍</span>
                    Track Booking
                  </button>

                  <button
                    type="button"
                    className="passenger-quick-btn"
                    onClick={() =>
                      navigate("/passenger/notifications")
                    }
                  >
                    <span>🔔</span>
                    Notifications
                  </button>
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </>
  );
}

export default PassengerDashboard;
