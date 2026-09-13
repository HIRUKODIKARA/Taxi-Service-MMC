import { useEffect, useState } from "react";

function DriverTripRequests() {
  const API_BASE_URL = "/api";
  const [requests, setRequests] = useState([]);
  const [driver, setDriver] = useState(null);
  const [vehicleTypes, setVehicleTypes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
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

  const formatStatus = (status) => {
    if (!status) {
      return "Unknown";
    }

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatSource = (source) => {
    if (!source) {
      return "Unknown";
    }

    if (source === "ON_SITE") {
      return "On-Site";
    }

    return source
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const getVehicleTypeName = (vehicleTypeId) => {
    const type = vehicleTypes.find(
      (item) =>
        Number(item.vehicleTypeId) === Number(vehicleTypeId)
    );

    return type?.typeName || "—";
  };

  const loadRequests = async () => {
    if (!user) {
      setError("Please login to your driver account.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const driverResponse = await fetch(
        `${API_BASE_URL}/drivers/me`,
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
        throw new Error(
          "Unable to load assigned trip requests."
        );
      }

      const bookingsData = await bookingsResponse.json();

      const vehicleTypeData = vehicleTypesResponse.ok
        ? await vehicleTypesResponse.json()
        : [];

      setVehicleTypes(vehicleTypeData);

      const assignedRequests = bookingsData
        .filter(
          (booking) =>
            Number(booking.assignedDriverId) ===
              Number(driverData.driverId) &&
            [
              "WAITING_FOR_DRIVER",
              "ACCEPTED",
              "REJECTED",
            ].includes(booking.bookingStatus)
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
        );

      setRequests(assignedRequests);
    } catch (err) {
      console.error("Driver request error:", err);

      setError(
        err.message ||
          "Unable to load driver trip requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const acceptRequest = async (bookingId) => {
    if (!driver) {
      return;
    }

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
        `Booking #${bookingId} accepted successfully.`
      );

      await loadRequests();
    } catch (err) {
      console.error("Accept booking error:", err);

      setError(
        err.message ||
          "Unable to accept this booking."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const rejectRequest = async (bookingId) => {
    if (!driver) {
      return;
    }

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
        `Booking #${bookingId} rejected successfully.`
      );

      await loadRequests();
    } catch (err) {
      console.error("Reject booking error:", err);

      setError(
        err.message ||
          "Unable to reject this booking."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingCount = requests.filter(
    (request) =>
      request.bookingStatus === "WAITING_FOR_DRIVER"
  ).length;

  const acceptedCount = requests.filter(
    (request) =>
      request.bookingStatus === "ACCEPTED"
  ).length;

  return (
    <>
      <style>{`
        .driver-request-page {
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .driver-request-header {
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
          grid-template-columns: repeat(3, 1fr);
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
          box-shadow: 0 4px 14px rgba(11,41,70,0.04);
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
          font-weight: 700;
        }

        .driver-request-status.waiting_for_driver {
          background: #fff3cc;
          color: #806300;
        }

        .driver-request-status.accepted {
          background: #e2f5e7;
          color: #18763a;
        }

        .driver-request-status.rejected {
          background: #fde7e7;
          color: #a13a3a;
        }

        .driver-request-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .driver-request-detail {
          background: #f8fafc;
          padding: 12px;
          border-radius: 7px;
        }

        .driver-request-detail span {
          display: block;
          margin-bottom: 4px;
          color: #929ca6;
          font-size: 8px;
        }

        .driver-request-detail strong {
          color: #0b2946;
          font-size: 10px;
          line-height: 1.5;
        }

        .driver-request-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 17px;
        }

        .driver-request-actions button {
          padding: 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
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

        .driver-reject-btn {
          border: 1px solid #db4141;
          background: white;
          color: #db4141;
        }

        .driver-request-message {
          margin-top: 14px;
          padding: 12px;
          background: #eef6ff;
          color: #5b7184;
          border-radius: 7px;
          font-size: 10px;
          line-height: 1.6;
        }

        .driver-request-loading,
        .driver-request-empty {
          padding: 30px;
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 10px;
          text-align: center;
          color: #7b8794;
          font-size: 11px;
        }

        @media(max-width: 700px) {
          .driver-request-summary,
          .driver-request-grid,
          .driver-request-actions {
            grid-template-columns: 1fr;
          }

          .driver-request-page {
            padding: 20px;
          }
        }
      `}</style>

      <main className="driver-request-page">
        <div className="driver-request-header">
          <h1>Trip Requests</h1>

          <p>
            Review assigned taxi booking requests and accept or
            reject them.
          </p>
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
            <span>TOTAL REQUESTS</span>
            <h2>{requests.length}</h2>
          </div>

          <div className="driver-request-summary-card">
            <span>PENDING</span>
            <h2>{pendingCount}</h2>
          </div>

          <div className="driver-request-summary-card">
            <span>ACCEPTED</span>
            <h2>{acceptedCount}</h2>
          </div>
        </div>

        {loading ? (
          <div className="driver-request-loading">
            Loading assigned trip requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="driver-request-empty">
            No assigned trip requests found.
          </div>
        ) : (
          <div className="driver-request-list">
            {requests.map((request) => (
              <div
                key={request.bookingId}
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

                  <span
                    className={`driver-request-status ${
                      request.bookingStatus?.toLowerCase() ||
                      ""
                    }`}
                  >
                    {formatStatus(
                      request.bookingStatus
                    )}
                  </span>
                </div>

                <div className="driver-request-grid">
                  <div className="driver-request-detail">
                    <span>PASSENGER</span>
                    <strong>
                      {request.passengerName}
                    </strong>
                  </div>

                  <div className="driver-request-detail">
                    <span>PHONE</span>
                    <strong>
                      {request.passengerPhone}
                    </strong>
                  </div>

                  <div className="driver-request-detail">
                    <span>PICKUP</span>
                    <strong>
                      {request.pickupLocation}
                    </strong>
                  </div>

                  <div className="driver-request-detail">
                    <span>DESTINATION</span>
                    <strong>
                      {request.destination}
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
                    <span>DATE / TIME</span>
                    <strong>
                      {request.bookingDate || "—"}{" "}
                      {request.bookingTime
                        ? request.bookingTime
                            .toString()
                            .substring(0, 5)
                        : ""}
                    </strong>
                  </div>
                </div>

                {request.bookingStatus ===
                "WAITING_FOR_DRIVER" ? (
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
                        : "Reject Request"}
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
                        : "Accept Request"}
                    </button>
                  </div>
                ) : (
                  <div className="driver-request-message">
                    Request status:{" "}
                    <strong>
                      {formatStatus(
                        request.bookingStatus
                      )}
                    </strong>
                    .
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default DriverTripRequests;