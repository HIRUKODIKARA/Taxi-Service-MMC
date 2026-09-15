import { useEffect, useState } from "react";

function DriverTripRequests() {
  const API_BASE_URL = "http://localhost:5171/api";

  const [requests, setRequests] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // =========================================================
  // TOKEN
  // =========================================================

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
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  // =========================================================
  // FORMATTERS
  // =========================================================

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatSource = (source) => {
    if (!source) return "Unknown";

    if (source === "ON_SITE") {
      return "On-Site";
    }

    return source
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatMoney = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "—";
    }

    return `Rs. ${number.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDistance = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "—";
    }

    return `${number.toFixed(2)} km`;
  };

  const formatDate = (value) => {
    if (!value) return "—";

    try {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return value;
      }

      return date.toLocaleDateString();
    } catch {
      return value;
    }
  };

  const formatTime = (value) => {
    if (!value) return "—";

    return value.toString().substring(0, 5);
  };

  const getVehicleTypeName = (vehicleTypeId) => {
    const type = vehicleTypes.find(
      (item) =>
        Number(item.vehicleTypeId) ===
        Number(vehicleTypeId)
    );

    return type?.typeName || `Type #${vehicleTypeId}`;
  };

  // =========================================================
  // LOAD DRIVER REQUESTS
  // =========================================================

  const loadRequests = async (showLoading = true) => {
    const token = getToken();

    if (!token) {
      setError("Please login to your driver account.");
      setLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }

      setError("");

      const [requestsResponse, vehicleTypesResponse] =
        await Promise.all([
          fetch(
            `${API_BASE_URL}/bookings/driver/requests`,
            {
              headers: getHeaders(),
            }
          ),

          fetch(`${API_BASE_URL}/vehicletypes`, {
            headers: getHeaders(),
          }),
        ]);

      let requestsData = null;

      try {
        requestsData =
          await requestsResponse.json();
      } catch {
        requestsData = null;
      }

      if (!requestsResponse.ok) {
        throw new Error(
          requestsData?.message ||
            requestsData?.title ||
            "Unable to load trip requests."
        );
      }

      let typeData = [];

      if (vehicleTypesResponse.ok) {
        try {
          typeData =
            await vehicleTypesResponse.json();
        } catch {
          typeData = [];
        }
      }

      setVehicleTypes(
        Array.isArray(typeData) ? typeData : []
      );

      setRequests(
        Array.isArray(requestsData)
          ? requestsData
          : []
      );
    } catch (err) {
      console.error(
        "Driver request error:",
        err
      );

      setError(
        err.message ||
          "Unable to load driver trip requests."
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // =========================================================
  // INITIAL LOAD + AUTO REFRESH
  // =========================================================

  useEffect(() => {
    loadRequests(true);

    // Refresh new requests every 5 seconds
    const interval = setInterval(() => {
      loadRequests(false);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // =========================================================
  // ACCEPT REQUEST
  // =========================================================

  const acceptRequest = async (bookingId) => {
    const confirmed = window.confirm(
      `Accept booking #${bookingId}?`
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(bookingId);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}/bookings/${bookingId}/accept`,
        {
          method: "PUT",
          headers: getHeaders(),
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
            data?.title ||
            "Unable to accept this booking."
        );
      }

      setMessage(
        `Booking #${bookingId} accepted successfully. It is now assigned to you.`
      );

      await loadRequests(false);
    } catch (err) {
      console.error(
        "Accept booking error:",
        err
      );

      setError(
        err.message ||
          "Unable to accept this booking."
      );

      // Refresh because another driver may
      // have accepted the booking first.
      await loadRequests(false);
    } finally {
      setActionLoadingId(null);
    }
  };

  // =========================================================
  // REJECT REQUEST
  // =========================================================

  const rejectRequest = async (bookingId) => {
    const confirmed = window.confirm(
      `Reject booking #${bookingId}?`
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(bookingId);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}/bookings/${bookingId}/reject`,
        {
          method: "PUT",
          headers: getHeaders(),
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
            data?.title ||
            "Unable to reject this booking."
        );
      }

      setMessage(
        `Booking #${bookingId} rejected.`
      );

      await loadRequests(false);
    } catch (err) {
      console.error(
        "Reject booking error:",
        err
      );

      setError(
        err.message ||
          "Unable to reject this booking."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // =========================================================
  // COUNTS
  // =========================================================

  const totalRequests = requests.length;

  const websiteRequests = requests.filter(
    (request) =>
      request.bookingSource === "WEBSITE"
  ).length;

  const operatorRequests = requests.filter(
    (request) =>
      request.bookingSource === "PHONE" ||
      request.bookingSource === "ON_SITE"
  ).length;

  // =========================================================
  // UI
  // =========================================================

  return (
    <>
      <style>{`
        .driver-request-page {
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
          box-sizing: border-box;
        }

        .driver-request-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .driver-request-header h1 {
          margin: 0 0 6px;
          color: #0b2946;
          font-size: 28px;
        }

        .driver-request-header p {
          margin: 0;
          color: #7b8794;
          font-size: 12px;
          line-height: 1.6;
        }

        .driver-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 11px;
          border-radius: 20px;
          background: #e6f7ec;
          color: #18763a;
          font-size: 9px;
          font-weight: 800;
          white-space: nowrap;
        }

        .driver-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #21a453;
        }

        .driver-request-alert {
          margin-bottom: 18px;
          padding: 12px 14px;
          border-radius: 7px;
          font-size: 10px;
          line-height: 1.5;
        }

        .driver-request-alert.error {
          background: #fff1f1;
          border: 1px solid #efc8c8;
          color: #a43c3c;
        }

        .driver-request-alert.success {
          background: #e8f6ed;
          border: 1px solid #cce9d5;
          color: #18763a;
        }

        .driver-request-summary {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .driver-request-summary-card {
          background: white;
          padding: 18px;
          border: 1px solid #e3e8ed;
          border-radius: 9px;
        }

        .driver-request-summary-card span {
          color: #89949e;
          font-size: 9px;
          font-weight: 700;
        }

        .driver-request-summary-card h2 {
          margin: 7px 0 0;
          color: #0b2946;
          font-size: 23px;
        }

        .driver-request-list {
          display: grid;
          gap: 17px;
        }

        .driver-request-card {
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 10px;
          padding: 22px;
          box-shadow:
            0 4px 14px
            rgba(11, 41, 70, 0.04);
          min-width: 0;
        }

        .driver-request-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          margin-bottom: 15px;
        }

        .driver-request-top h3 {
          margin: 0 0 5px;
          color: #0b2946;
          font-size: 16px;
        }

        .driver-request-source {
          color: #86919c;
          font-size: 9px;
        }

        .driver-request-status {
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 800;
          background: #fff3cc;
          color: #806300;
          white-space: nowrap;
        }

        .driver-request-route {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            34px
            minmax(0, 1fr);
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .driver-route-point span {
          display: block;
          margin-bottom: 5px;
          color: #929ca6;
          font-size: 8px;
          font-weight: 700;
        }

        .driver-route-point strong {
          display: block;
          color: #0b2946;
          font-size: 10px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .driver-route-arrow {
          text-align: center;
          color: #f0b900;
          font-size: 20px;
          font-weight: 800;
        }

        .driver-request-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .driver-request-detail {
          min-width: 0;
          background: #f8fafc;
          padding: 12px;
          border-radius: 7px;
        }

        .driver-request-detail span {
          display: block;
          margin-bottom: 4px;
          color: #929ca6;
          font-size: 8px;
          font-weight: 700;
        }

        .driver-request-detail strong {
          display: block;
          color: #0b2946;
          font-size: 10px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .driver-request-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 17px;
        }

        .driver-request-actions button {
          min-height: 40px;
          padding: 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 800;
        }

        .driver-request-actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .driver-accept-btn {
          border: none;
          background: #21a453;
          color: white;
        }

        .driver-accept-btn:hover:not(:disabled) {
          background: #188944;
        }

        .driver-reject-btn {
          border: 1px solid #db4141;
          background: white;
          color: #db4141;
        }

        .driver-reject-btn:hover:not(:disabled) {
          background: #fff1f1;
        }

        .driver-request-loading,
        .driver-request-empty {
          padding: 35px 20px;
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 10px;
          text-align: center;
          color: #7b8794;
          font-size: 11px;
          line-height: 1.7;
        }

        .driver-request-empty strong {
          display: block;
          margin-bottom: 5px;
          color: #0b2946;
          font-size: 14px;
        }

        @media(max-width: 900px) {
          .driver-request-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media(max-width: 700px) {
          .driver-request-page {
            padding: 78px 16px 24px;
          }

          .driver-request-header {
            flex-direction: column;
            gap: 10px;
          }

          .driver-request-header h1 {
            font-size: 23px;
          }

          .driver-request-summary {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .driver-request-summary-card {
            padding: 14px;
          }

          .driver-request-card {
            padding: 15px;
          }

          .driver-request-route {
            grid-template-columns: 1fr;
          }

          .driver-route-arrow {
            transform: rotate(90deg);
          }

          .driver-request-grid {
            grid-template-columns: 1fr;
          }

          .driver-request-actions {
            grid-template-columns: 1fr;
          }
        }

        @media(max-width: 420px) {
          .driver-request-page {
            padding-left: 12px;
            padding-right: 12px;
          }

          .driver-request-top {
            flex-direction: column;
          }

          .driver-request-status {
            align-self: flex-start;
          }
        }
      `}</style>

      <main className="driver-request-page">
        <div className="driver-request-header">
          <div>
            <h1>Trip Requests</h1>

            <p>
              New taxi bookings available for you
              will appear here. The first available
              driver to accept will receive the trip.
            </p>
          </div>

          <div className="driver-live-badge">
            <span className="driver-live-dot" />
            LIVE REQUESTS
          </div>
        </div>

        {error && (
          <div className="driver-request-alert error">
            {error}
          </div>
        )}

        {message && (
          <div className="driver-request-alert success">
            {message}
          </div>
        )}

        <div className="driver-request-summary">
          <div className="driver-request-summary-card">
            <span>AVAILABLE REQUESTS</span>
            <h2>{totalRequests}</h2>
          </div>

          <div className="driver-request-summary-card">
            <span>WEBSITE BOOKINGS</span>
            <h2>{websiteRequests}</h2>
          </div>

          <div className="driver-request-summary-card">
            <span>PHONE / ON-SITE</span>
            <h2>{operatorRequests}</h2>
          </div>
        </div>

        {loading ? (
          <div className="driver-request-loading">
            Loading available trip requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="driver-request-empty">
            <strong>No trip requests right now</strong>

            New bookings will automatically appear
            here when you are available and your
            vehicle matches the requested vehicle
            type.
          </div>
        ) : (
          <div className="driver-request-list">
            {requests.map((request) => (
              <div
                key={
                  request.requestId ||
                  request.bookingId
                }
                className="driver-request-card"
              >
                <div className="driver-request-top">
                  <div>
                    <h3>
                      Booking #{request.bookingId}
                    </h3>

                    <span className="driver-request-source">
                      Booking Source:{" "}
                      {formatSource(
                        request.bookingSource
                      )}
                    </span>
                  </div>

                  <span className="driver-request-status">
                    Waiting For Driver
                  </span>
                </div>

                <div className="driver-request-route">
                  <div className="driver-route-point">
                    <span>📍 PICKUP</span>
                    <strong>
                      {request.pickupLocation || "—"}
                    </strong>
                  </div>

                  <div className="driver-route-arrow">
                    →
                  </div>

                  <div className="driver-route-point">
                    <span>🏁 DESTINATION</span>
                    <strong>
                      {request.destination || "—"}
                    </strong>
                  </div>
                </div>

                <div className="driver-request-grid">
                  <div className="driver-request-detail">
                    <span>PASSENGER</span>
                    <strong>
                      {request.passengerName || "—"}
                    </strong>
                  </div>

                  <div className="driver-request-detail">
                    <span>PHONE</span>
                    <strong>
                      {request.passengerPhone || "—"}
                    </strong>
                  </div>

                  <div className="driver-request-detail">
                    <span>VEHICLE TYPE</span>
                    <strong>
                      {getVehicleTypeName(
                        request.vehicleTypeId
                      )}
                    </strong>
                  </div>

                  <div className="driver-request-detail">
                    <span>DISTANCE</span>
                    <strong>
                      {formatDistance(
                        request.distanceKm
                      )}
                    </strong>
                  </div>

                  <div className="driver-request-detail">
                    <span>ESTIMATED FARE</span>
                    <strong>
                      {formatMoney(
                        request.estimatedFare
                      )}
                    </strong>
                  </div>

                  <div className="driver-request-detail">
                    <span>DATE / TIME</span>
                    <strong>
                      {formatDate(
                        request.bookingDate
                      )}{" "}
                      {formatTime(
                        request.bookingTime
                      )}
                    </strong>
                  </div>
                </div>

                <div className="driver-request-actions">
                  <button
                    type="button"
                    className="driver-reject-btn"
                    disabled={
                      actionLoadingId ===
                      request.bookingId
                    }
                    onClick={() =>
                      rejectRequest(
                        request.bookingId
                      )
                    }
                  >
                    {actionLoadingId ===
                    request.bookingId
                      ? "Processing..."
                      : "✕ Reject Request"}
                  </button>

                  <button
                    type="button"
                    className="driver-accept-btn"
                    disabled={
                      actionLoadingId ===
                      request.bookingId
                    }
                    onClick={() =>
                      acceptRequest(
                        request.bookingId
                      )
                    }
                  >
                    {actionLoadingId ===
                    request.bookingId
                      ? "Processing..."
                      : "✓ Accept Request"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default DriverTripRequests;