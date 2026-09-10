import { useEffect, useState } from "react";

function DriverTrips() {
  const API_BASE_URL = "http://localhost:5171/api";
  const [filter, setFilter] = useState("All");

  const [driver, setDriver] = useState(null);

  const [trips, setTrips] = useState([]);

  const [loading, setLoading] = useState(true);

  const [actionLoadingId, setActionLoadingId] =
    useState(null);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  // PHONE_MAP is the current tracking method.
  // GPS_DEVICE remains available for future hardware integration.
  const [trackingSource, setTrackingSource] = useState("PHONE_MAP");
  const [locationSharing, setLocationSharing] = useState(false);
  const [locationStatus, setLocationStatus] = useState("OFFLINE");
  const [lastLocationUpdate, setLastLocationUpdate] = useState(null);
  const [locationWatchId, setLocationWatchId] = useState(null);

  const [selectedTrip, setSelectedTrip] =
    useState(null);

  const getStoredUser = () => {
    try {
      const localUser =
        localStorage.getItem("user");

      const sessionUser =
        sessionStorage.getItem("user");

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

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }

    return parsedDate.toLocaleDateString();
  };

  const formatTime = (time) => {
    if (!time) {
      return "—";
    }

    return time
      .toString()
      .substring(0, 5);
  };

  const loadTrips = async () => {
    if (!user) {
      setError(
        "Please login to your driver account."
      );

      setLoading(false);

      return;
    }

    try {
      setLoading(true);
      setError("");

      const driverResponse =
        await fetch(
          `${API_BASE_URL}/drivers/me`,
          {
            headers: getHeaders(),
          }
        );

      if (!driverResponse.ok) {
        throw new Error(
          "Driver profile was not found."
        );
      }

      const driverData =
        await driverResponse.json();

      setDriver(driverData);

      const bookingsResponse =
        await fetch(
          `${API_BASE_URL}/bookings/my`,
          {
            headers: getHeaders(),
          }
        );

      if (!bookingsResponse.ok) {
        throw new Error(
          "Unable to load your trips."
        );
      }

      const bookings =
        await bookingsResponse.json();

      const driverTrips =
        bookings
          .filter(
            (booking) =>
              Number(
                booking.assignedDriverId
              ) ===
                Number(
                  driverData.driverId
                ) &&
              [
                "ACCEPTED",
                "DRIVER_ARRIVING",
                "DRIVER_ARRIVED",
                "ON_RIDE",
                "COMPLETED",
              ].includes(
                booking.bookingStatus
              )
          )
          .sort(
            (a, b) =>
              new Date(
                b.createdAt || 0
              ) -
              new Date(
                a.createdAt || 0
              )
          );

      setTrips(driverTrips);
    } catch (err) {
      console.error(
        "Driver trips error:",
        err
      );

      setError(
        err.message ||
          "Unable to load driver trips."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const updateTripStatus =
    async (
      bookingId,
      action
    ) => {
      try {
        setActionLoadingId(
          bookingId
        );

        setError("");
        setMessage("");

        const response =
          await fetch(
            `${API_BASE_URL}/bookings/${bookingId}/${action}`,
            {
              method: "PUT",
              headers:
                getHeaders(),
            }
          );

        let data = null;

        try {
          data =
            await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.title ||
              "Unable to update trip."
          );
        }

        let successText =
          "Trip updated successfully.";

        if (
          action === "arriving"
        ) {
          successText =
            `Booking #${bookingId}: Driver Arriving status updated.`;
        }

        if (action === "arrived") {
          successText =
            `Booking #${bookingId}: Arrival confirmed. Passenger has been notified.`;
        }

        if (action === "start") {
          successText =
            `Booking #${bookingId}: Trip started successfully.`;
        }

        if (
          action === "complete"
        ) {
          successText =
            `Booking #${bookingId}: Trip completed successfully.`;
        }

        setMessage(successText);

        setSelectedTrip(null);

        await loadTrips();
      } catch (err) {
        console.error(
          "Trip status error:",
          err
        );

        setError(
          err.message ||
            "Unable to update trip status."
        );
      } finally {
        setActionLoadingId(
          null
        );
      }
    };

  // =========================================================
  // PHONE / MAP LOCATION TRACKING
  // =========================================================
  const sendPhoneLocation = async (position) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/driverlocations`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            trackingSource: "PHONE_MAP",
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to update driver location."
        );
      }

      setLocationStatus(
        data?.location?.tracking?.connectionStatus || "LIVE"
      );
      setLastLocationUpdate(new Date());
      setError("");
    } catch (err) {
      console.error("Location update error:", err);
      setLocationStatus("OFFLINE");
      setError(
        err.message || "Unable to share your current location."
      );
    }
  };

  const startPhoneTracking = () => {
    setError("");
    setMessage("");

    if (!navigator.geolocation) {
      setError(
        "Location service is not supported by this browser."
      );
      return;
    }

    if (locationWatchId !== null) {
      setLocationSharing(true);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocationSharing(true);
        setLocationStatus("LIVE");
        sendPhoneLocation(position);
      },
      (geoError) => {
        console.error("Browser location error:", geoError);
        setLocationSharing(false);
        setLocationStatus("OFFLINE");

        if (geoError.code === 1) {
          setError(
            "Location permission was denied. Please allow Location access on the phone/browser."
          );
        } else if (geoError.code === 2) {
          setError(
            "Your current location is unavailable. Check phone Location/GPS settings."
          );
        } else {
          setError(
            "Location request timed out. Please try again."
          );
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    setLocationWatchId(watchId);
    setLocationSharing(true);
    setTrackingSource("PHONE_MAP");
    setMessage(
      "Phone / Map tracking started. Keep location permission and internet connection enabled."
    );
  };

  const stopPhoneTracking = () => {
    if (
      locationWatchId !== null &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(locationWatchId);
    }

    setLocationWatchId(null);
    setLocationSharing(false);
    setLocationStatus("OFFLINE");
    setMessage(
      "Phone / Map tracking stopped. Passengers will see the last known location until tracking starts again."
    );
  };

  const openGoogleMapsNavigation = (trip) => {
    if (!trip?.pickupLocation) {
      setError("Pickup location is not available.");
      return;
    }

    const destination =
      trip.bookingStatus === "ON_RIDE"
        ? trip.destination
        : trip.pickupLocation;

    const googleMapsUrl =
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        destination
      )}&travelmode=driving`;

    window.open(
      googleMapsUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // Stop browser location watcher when leaving this page.
  useEffect(() => {
    return () => {
      if (
        locationWatchId !== null &&
        navigator.geolocation
      ) {
        navigator.geolocation.clearWatch(locationWatchId);
      }
    };
  }, [locationWatchId]);

  const filteredTrips =
    filter === "All"
      ? trips
      : filter === "Active"
      ? trips.filter(
          (trip) =>
            [
              "ACCEPTED",
              "DRIVER_ARRIVING",
              "ON_RIDE",
            ].includes(
              trip.bookingStatus
            )
        )
      : trips.filter(
          (trip) =>
            trip.bookingStatus ===
            "COMPLETED"
        );

  const getStatusClass =
    (status) => {
      switch (status) {
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

        default:
          return "default";
      }
    };

  const getActionButton =
    (trip) => {
      if (
        trip.bookingStatus ===
        "ACCEPTED"
      ) {
        return (
          <button
            type="button"
            className="trip-action-btn arriving"
            disabled={
              actionLoadingId ===
              trip.bookingId
            }
            onClick={() =>
              updateTripStatus(
                trip.bookingId,
                "arriving"
              )
            }
          >
            {actionLoadingId ===
            trip.bookingId
              ? "Updating..."
              : "Mark Driver Arriving"}
          </button>
        );
      }

      if (
        trip.bookingStatus ===
        "DRIVER_ARRIVING"
      ) {
        return (
          <button
            type="button"
            className="trip-action-btn arrived"
            disabled={
              actionLoadingId ===
              trip.bookingId
            }
            onClick={() =>
              updateTripStatus(
                trip.bookingId,
                "arrived"
              )
            }
          >
            {actionLoadingId ===
            trip.bookingId
              ? "Updating..."
              : "I Have Arrived"}
          </button>
        );
      }

      if (
        trip.bookingStatus ===
        "DRIVER_ARRIVED"
      ) {
        return (
          <button
            type="button"
            className="trip-action-btn start"
            disabled={
              actionLoadingId ===
              trip.bookingId
            }
            onClick={() =>
              updateTripStatus(
                trip.bookingId,
                "start"
              )
            }
          >
            {actionLoadingId ===
            trip.bookingId
              ? "Starting..."
              : "Start Trip"}
          </button>
        );
      }

      if (
        trip.bookingStatus ===
        "ON_RIDE"
      ) {
        return (
          <button
            type="button"
            className="trip-action-btn complete"
            disabled={
              actionLoadingId ===
              trip.bookingId
            }
            onClick={() =>
              updateTripStatus(
                trip.bookingId,
                "complete"
              )
            }
          >
            {actionLoadingId ===
            trip.bookingId
              ? "Completing..."
              : "Complete Trip"}
          </button>
        );
      }

      return (
        <div className="trip-completed-note">
          Trip Completed
        </div>
      );
    };

  return (
    <>
      <style>{`
        .driver-trips-page {
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .driver-trips-header h1 {
          margin: 0 0 6px;
          color: #0b2946;
          font-size: 28px;
        }

        .driver-trips-header p {
          margin: 0 0 22px;
          color: #7b8794;
          font-size: 12px;
        }

        .driver-trip-alert {
          margin-bottom: 18px;
          padding: 12px 14px;
          border-radius: 7px;
          font-size: 10px;
          line-height: 1.6;
        }

        .driver-trip-alert.error {
          background: #fff1f1;
          border: 1px solid #efc8c8;
          color: #a43c3c;
        }

        .driver-trip-alert.success {
          background: #e7f6eb;
          border: 1px solid #cae8d2;
          color: #18763a;
        }

        .driver-trip-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }

        .driver-trip-summary-card {
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 9px;
          padding: 17px;
        }

        .driver-trip-summary-card span {
          display: block;
          margin-bottom: 6px;
          color: #89949e;
          font-size: 9px;
        }

        .driver-trip-summary-card strong {
          color: #0b2946;
          font-size: 22px;
        }

        .driver-trips-filter {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 18px;
        }

        .driver-trips-filter button {
          padding: 8px 13px;
          border: 1px solid #d7dfe5;
          background: white;
          border-radius: 20px;
          color: #61717f;
          font-size: 10px;
          cursor: pointer;
        }

        .driver-trips-filter button.active {
          background: #f6c20d;
          border-color: #f6c20d;
          color: #0b2946;
          font-weight: 700;
        }

        .driver-trips-card {
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 10px;
          overflow: hidden;
        }

        .driver-table-wrapper {
          overflow-x: auto;
        }

        .driver-trips-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
        }

        .driver-trips-table th {
          background: #0b2946;
          color: white;
          padding: 13px;
          text-align: left;
          font-size: 9px;
        }

        .driver-trips-table td {
          padding: 14px 13px;
          border-bottom: 1px solid #edf0f3;
          color: #53616e;
          font-size: 10px;
        }

        .driver-trip-id {
          color: #0b2946;
          font-weight: 800;
        }

        .driver-trip-status {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 8px;
          font-weight: 700;
          white-space: nowrap;
        }

        .driver-trip-status.accepted {
          background: #e3effc;
          color: #24649f;
        }

        .driver-trip-status.arriving {
          background: #fff3cd;
          color: #806400;
        }

        .driver-trip-status.arrived {
          background: #e8f5e9;
          color: #18763a;
        }

        .driver-trip-status.onride {
          background: #e3effc;
          color: #24649f;
        }

        .driver-trip-status.completed {
          background: #e3f6e7;
          color: #18763a;
        }

        .driver-trip-status.default {
          background: #edf0f3;
          color: #53616e;
        }

        .driver-trip-view {
          border: 1px solid #0b2946;
          background: white;
          color: #0b2946;
          border-radius: 5px;
          padding: 6px 9px;
          font-size: 8px;
          cursor: pointer;
        }

        .driver-trip-view:hover {
          background: #0b2946;
          color: white;
        }

        .driver-trip-loading,
        .driver-trip-empty {
          padding: 30px;
          text-align: center;
          color: #7b8794;
          font-size: 11px;
        }

        .trip-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(3, 20, 36, 0.58);
        }

        .trip-modal {
          width: 100%;
          max-width: 620px;
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 18px 45px rgba(0,0,0,0.2);
        }

        .trip-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 19px 22px;
          background: #0b2946;
          color: white;
          border-radius: 12px 12px 0 0;
        }

        .trip-modal-header h2 {
          margin: 0;
          font-size: 17px;
        }

        .trip-modal-close {
          border: none;
          background: transparent;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }

        .trip-modal-body {
          padding: 22px;
        }

        .trip-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 11px;
        }

        .trip-detail {
          padding: 12px;
          background: #f8fafc;
          border: 1px solid #e7ebef;
          border-radius: 7px;
        }

        .trip-detail.full {
          grid-column: 1 / -1;
        }

        .trip-detail span {
          display: block;
          margin-bottom: 5px;
          color: #8a959f;
          font-size: 8px;
        }

        .trip-detail strong {
          color: #0b2946;
          font-size: 10px;
          line-height: 1.6;
        }

        .trip-action-area {
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid #edf0f3;
        }

        .trip-action-btn {
          width: 100%;
          border: none;
          padding: 11px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .trip-action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .trip-action-btn.arriving {
          background: #f6c20d;
          color: #0b2946;
        }

        .trip-action-btn.arrived {
          background: #21a453;
          color: white;
        }

        .trip-action-btn.start {
          background: #24649f;
          color: white;
        }

        .trip-action-btn.complete {
          background: #21a453;
          color: white;
        }

        .trip-completed-note {
          padding: 11px;
          background: #e3f6e7;
          color: #18763a;
          border-radius: 6px;
          text-align: center;
          font-size: 10px;
          font-weight: 700;
        }

        .driver-tracking-panel {
          margin-bottom: 20px;
          padding: 18px;
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 10px;
        }

        .driver-tracking-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 14px;
        }

        .driver-tracking-top h2 {
          margin: 0 0 4px;
          color: #0b2946;
          font-size: 16px;
        }

        .driver-tracking-top p {
          margin: 0;
          color: #7b8794;
          font-size: 9px;
        }

        .driver-location-badge {
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 800;
        }

        .driver-location-badge.live {
          background: #e3f6e7;
          color: #18763a;
        }

        .driver-location-badge.offline {
          background: #fde8e8;
          color: #a43c3c;
        }

        .driver-tracking-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .driver-tracking-option {
          padding: 14px;
          border: 1px solid #e2e7ec;
          border-radius: 8px;
          background: #f8fafc;
        }

        .driver-tracking-option.active {
          border-color: #f6c20d;
          background: #fffbea;
        }

        .driver-tracking-option h3 {
          margin: 0 0 5px;
          color: #0b2946;
          font-size: 11px;
        }

        .driver-tracking-option p {
          margin: 0 0 10px;
          color: #7b8794;
          font-size: 9px;
          line-height: 1.5;
        }

        .driver-track-btn {
          border: none;
          border-radius: 6px;
          padding: 9px 12px;
          background: #0b2946;
          color: white;
          font-size: 9px;
          font-weight: 800;
          cursor: pointer;
        }

        .driver-track-btn.stop {
          background: #a43c3c;
        }

        .driver-track-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .driver-last-update {
          margin-top: 10px;
          color: #7b8794;
          font-size: 9px;
        }

        .google-nav-btn {
          width: 100%;
          margin-bottom: 9px;
          border: 1px solid #0b2946;
          border-radius: 6px;
          padding: 10px;
          background: white;
          color: #0b2946;
          font-size: 9px;
          font-weight: 800;
          cursor: pointer;
        }

        .google-nav-btn:hover {
          background: #f4f7fa;
        }

        @media(max-width: 700px) {
          .driver-trips-page {
            padding: 18px;
          }

          .driver-trip-summary,
          .trip-detail-grid,
          .driver-tracking-options {
            grid-template-columns: 1fr;
          }

          .trip-detail.full {
            grid-column: auto;
          }
        }
      `}</style>

      <main className="driver-trips-page">
        <div className="driver-trips-header">
          <h1>My Trips</h1>

          <p>
            Manage your accepted, active and completed taxi trips.
          </p>
        </div>

        {error && (
          <div className="driver-trip-alert error">
            {error}
          </div>
        )}

        {message && (
          <div className="driver-trip-alert success">
            {message}
          </div>
        )}

        <section className="driver-tracking-panel">
          <div className="driver-tracking-top">
            <div>
              <h2>Driver Location Tracking</h2>
              <p>
                Use phone/map tracking now. GPS device tracking is kept ready for future integration.
              </p>
            </div>

            <span
              className={`driver-location-badge ${
                locationStatus === "LIVE" ? "live" : "offline"
              }`}
            >
              {locationStatus === "LIVE" ? "● LIVE" : "● OFFLINE"}
            </span>
          </div>

          <div className="driver-tracking-options">
            <div
              className={`driver-tracking-option ${
                trackingSource === "PHONE_MAP" ? "active" : ""
              }`}
            >
              <h3>📱 Phone / Map Tracking</h3>
              <p>
                Uses this phone's location service and sends live coordinates to the MMC system.
              </p>

              {!locationSharing ? (
                <button
                  type="button"
                  className="driver-track-btn"
                  onClick={startPhoneTracking}
                >
                  Start Phone Tracking
                </button>
              ) : (
                <button
                  type="button"
                  className="driver-track-btn stop"
                  onClick={stopPhoneTracking}
                >
                  Stop Tracking
                </button>
              )}

              <div className="driver-last-update">
                Last update:{" "}
                {lastLocationUpdate
                  ? lastLocationUpdate.toLocaleTimeString()
                  : "No location sent yet"}
              </div>
            </div>

            <div className="driver-tracking-option">
              <h3>📡 GPS Device Tracking</h3>
              <p>
                Reserved for a future external GPS device. Existing phone/map tracking continues to work now.
              </p>

              <button
                type="button"
                className="driver-track-btn"
                disabled
              >
                Future GPS Option
              </button>
            </div>
          </div>
        </section>

        <div className="driver-trip-summary">
          <div className="driver-trip-summary-card">
            <span>TOTAL TRIPS</span>

            <strong>{trips.length}</strong>
          </div>

          <div className="driver-trip-summary-card">
            <span>ACTIVE</span>

            <strong>
              {
                trips.filter(
                  (trip) =>
                    trip.bookingStatus !==
                    "COMPLETED"
                ).length
              }
            </strong>
          </div>

          <div className="driver-trip-summary-card">
            <span>COMPLETED</span>

            <strong>
              {
                trips.filter(
                  (trip) =>
                    trip.bookingStatus ===
                    "COMPLETED"
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="driver-trips-filter">
          {[
            "All",
            "Active",
            "Completed",
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

        <div className="driver-trips-card">
          {loading ? (
            <div className="driver-trip-loading">
              Loading your trips...
            </div>
          ) : filteredTrips.length ===
            0 ? (
            <div className="driver-trip-empty">
              No trips found.
            </div>
          ) : (
            <div className="driver-table-wrapper">
              <table className="driver-trips-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Passenger</th>
                    <th>Phone</th>
                    <th>Pickup</th>
                    <th>Destination</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTrips.map(
                    (trip) => (
                      <tr
                        key={
                          trip.bookingId
                        }
                      >
                        <td>
                          <span className="driver-trip-id">
                            #
                            {
                              trip.bookingId
                            }
                          </span>
                        </td>

                        <td>
                          {
                            trip.passengerName
                          }
                        </td>

                        <td>
                          {
                            trip.passengerPhone
                          }
                        </td>

                        <td>
                          {
                            trip.pickupLocation
                          }
                        </td>

                        <td>
                          {
                            trip.destination
                          }
                        </td>

                        <td>
                          {formatDate(
                            trip.bookingDate
                          )}
                        </td>

                        <td>
                          <span
                            className={`driver-trip-status ${getStatusClass(
                              trip.bookingStatus
                            )}`}
                          >
                            {formatStatus(
                              trip.bookingStatus
                            )}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="driver-trip-view"
                            onClick={() =>
                              setSelectedTrip(
                                trip
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

      {selectedTrip && (
        <div
          className="trip-modal-overlay"
          onClick={() =>
            setSelectedTrip(null)
          }
        >
          <div
            className="trip-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="trip-modal-header">
              <h2>
                Booking #
                {
                  selectedTrip.bookingId
                }
              </h2>

              <button
                type="button"
                className="trip-modal-close"
                onClick={() =>
                  setSelectedTrip(null)
                }
              >
                ×
              </button>
            </div>

            <div className="trip-modal-body">
              <div className="trip-detail-grid">
                <div className="trip-detail">
                  <span>STATUS</span>

                  <strong>
                    {formatStatus(
                      selectedTrip.bookingStatus
                    )}
                  </strong>
                </div>

                <div className="trip-detail">
                  <span>
                    BOOKING SOURCE
                  </span>

                  <strong>
                    {formatStatus(
                      selectedTrip.bookingSource
                    )}
                  </strong>
                </div>

                <div className="trip-detail">
                  <span>PASSENGER</span>

                  <strong>
                    {
                      selectedTrip.passengerName
                    }
                  </strong>
                </div>

                <div className="trip-detail">
                  <span>PHONE</span>

                  <strong>
                    {
                      selectedTrip.passengerPhone
                    }
                  </strong>
                </div>

                <div className="trip-detail full">
                  <span>PICKUP</span>

                  <strong>
                    {
                      selectedTrip.pickupLocation
                    }
                  </strong>
                </div>

                <div className="trip-detail full">
                  <span>DESTINATION</span>

                  <strong>
                    {
                      selectedTrip.destination
                    }
                  </strong>
                </div>

                <div className="trip-detail">
                  <span>DATE</span>

                  <strong>
                    {formatDate(
                      selectedTrip.bookingDate
                    )}
                  </strong>
                </div>

                <div className="trip-detail">
                  <span>TIME</span>

                  <strong>
                    {formatTime(
                      selectedTrip.bookingTime
                    )}
                  </strong>
                </div>
              </div>

              <div className="trip-action-area">
                {selectedTrip.bookingStatus !== "COMPLETED" && (
                  <button
                    type="button"
                    className="google-nav-btn"
                    onClick={() =>
                      openGoogleMapsNavigation(selectedTrip)
                    }
                  >
                    {selectedTrip.bookingStatus === "ON_RIDE"
                      ? "Open Destination in Google Maps"
                      : "Navigate to Passenger Pickup"}
                  </button>
                )}

                {getActionButton(
                  selectedTrip
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DriverTrips;