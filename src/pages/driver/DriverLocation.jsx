import {
  useEffect,
  useRef,
  useState,
} from "react";

const API_BASE_URL =
  "/api";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("authToken") ||
  sessionStorage.getItem("accessToken") ||
  "";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const safeJson = async (response) => {
  const raw = await response.text();

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {
      message: raw,
    };
  }
};

function DriverLocation() {
  const [driver, setDriver] =
    useState(null);

  const [status, setStatus] =
    useState("Offline");

  const [
    locationEnabled,
    setLocationEnabled,
  ] = useState(false);

  const [
    locationText,
    setLocationText,
  ] = useState(
    "Location not shared"
  );

  const [
    latitude,
    setLatitude,
  ] = useState(null);

  const [
    longitude,
    setLongitude,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [
    statusLoading,
    setStatusLoading,
  ] = useState(false);

  const [
    locationLoading,
    setLocationLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const intervalRef = useRef(null);

  /* =========================================================
     STATUS HELPERS
  ========================================================= */

  const apiStatusToDisplay = (
    apiStatus
  ) => {
    switch (apiStatus) {
      case "AVAILABLE":
        return "Available";

      case "ON_RIDE":
        return "On Ride";

      case "OFFLINE":
        return "Offline";

      default:
        return "Offline";
    }
  };

  const displayStatusToApi = (
    displayStatus
  ) => {
    switch (displayStatus) {
      case "Available":
        return "AVAILABLE";

      case "On Ride":
        return "ON_RIDE";

      case "Offline":
        return "OFFLINE";

      default:
        return "OFFLINE";
    }
  };

  /* =========================================================
     LOAD DRIVER
  ========================================================= */

  const loadDriver = async () => {
    const token = getToken();

    if (!token) {
      setError(
        "Please login to your driver account."
      );

      setLoading(false);

      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_BASE_URL}/drivers/me`,
        {
          headers: getHeaders(),
        }
      );

      const data =
        await safeJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load driver information."
        );
      }

      setDriver(data);

      setStatus(
        apiStatusToDisplay(
          data.operationalStatus
        )
      );

      if (data.gpsEnabled) {
        setLocationEnabled(true);

        setLocationText(
          "GPS sharing is enabled for this driver."
        );
      } else {
        setLocationEnabled(false);

        setLocationText(
          "Location not shared"
        );
      }
    } catch (err) {
      console.error(
        "Driver load error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load driver information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriver();

    return () => {
      if (intervalRef.current) {
        clearInterval(
          intervalRef.current
        );

        intervalRef.current =
          null;
      }
    };
  }, []);

  /* =========================================================
     UPDATE DRIVER STATUS
  ========================================================= */

  const updateDriverStatus =
    async (newStatus) => {
      if (!driver) {
        setError(
          "Driver profile is not available."
        );

        return;
      }

      try {
        setStatusLoading(true);

        setError("");
        setSuccess("");

        const apiStatus =
          displayStatusToApi(
            newStatus
          );

        const response = await fetch(
          `${API_BASE_URL}/drivers/${driver.driverId}/status`,
          {
            method: "PUT",

            headers:
              getHeaders(),

            body:
              JSON.stringify({
                status: apiStatus,
              }),
          }
        );

        const data =
          await safeJson(response);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to update driver status."
          );
        }

        const updatedStatus =
          data?.operationalStatus ||
          data?.driver?.operationalStatus ||
          apiStatus;

        setDriver((current) => ({
          ...current,

          operationalStatus:
            updatedStatus,
        }));

        setStatus(
          apiStatusToDisplay(
            updatedStatus
          )
        );

        setSuccess(
          `Driver status changed to ${apiStatusToDisplay(
            updatedStatus
          )}.`
        );
      } catch (err) {
        console.error(
          "Driver status error:",
          err
        );

        setError(
          err?.message ||
            "Unable to update driver status."
        );
      } finally {
        setStatusLoading(false);
      }
    };

  /* =========================================================
     ENABLE / DISABLE GPS IN BACKEND
  ========================================================= */

  const updateGpsEnabled =
    async (enabled) => {
      if (!driver) {
        throw new Error(
          "Driver profile is not available."
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/drivers/${driver.driverId}/gps`,
        {
          method: "PUT",

          headers:
            getHeaders(),

          body:
            JSON.stringify({
              enabled,
            }),
        }
      );

      const data =
        await safeJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to update GPS status."
        );
      }

      const gpsEnabled =
        data?.gpsEnabled ??
        data?.driver?.gpsEnabled ??
        enabled;

      setDriver((current) => ({
        ...current,

        gpsEnabled,
      }));

      setLocationEnabled(
        gpsEnabled
      );

      return gpsEnabled;
    };

  /* =========================================================
     SAVE LOCATION
  ========================================================= */

  const saveLocation =
    async (position) => {
      const lat =
        position.coords.latitude;

      const lng =
        position.coords.longitude;

      setLatitude(lat);
      setLongitude(lng);

      try {
        /*
          Backend identifies driver from JWT.
          Do NOT send driverId.
        */

        const response = await fetch(
          `${API_BASE_URL}/driverlocations`,
          {
            method: "POST",

            headers:
              getHeaders(),

            body:
              JSON.stringify({
                latitude: lat,
                longitude: lng,
              }),
          }
        );

        const data =
          await safeJson(response);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to save GPS location."
          );
        }

        setLocationEnabled(true);

        setLocationText(
          `Location shared successfully. Latitude: ${lat.toFixed(
            6
          )}, Longitude: ${lng.toFixed(
            6
          )}`
        );

        setSuccess(
          "Latest GPS location saved successfully."
        );

        return true;
      } catch (err) {
        console.error(
          "Save location error:",
          err
        );

        setLocationText(
          err?.message ||
            "GPS location was received, but could not be saved to the server."
        );

        setError(
          err?.message ||
            "Unable to save GPS location."
        );

        return false;
      }
    };

  /* =========================================================
     GET CURRENT LOCATION
  ========================================================= */

  const requestCurrentLocation =
    () =>
      new Promise(
        (resolve, reject) => {
          if (
            !navigator.geolocation
          ) {
            reject(
              new Error(
                "Geolocation is not supported by this browser."
              )
            );

            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) =>
              resolve(position),

            (geoError) => {
              if (
                geoError.code ===
                geoError.PERMISSION_DENIED
              ) {
                reject(
                  new Error(
                    "Location permission was denied. Please allow location permission in your browser."
                  )
                );

                return;
              }

              if (
                geoError.code ===
                geoError.POSITION_UNAVAILABLE
              ) {
                reject(
                  new Error(
                    "Current location is unavailable."
                  )
                );

                return;
              }

              if (
                geoError.code ===
                geoError.TIMEOUT
              ) {
                reject(
                  new Error(
                    "Location request timed out."
                  )
                );

                return;
              }

              reject(
                new Error(
                  "Unable to get current location."
                )
              );
            },

            {
              enableHighAccuracy:
                true,

              timeout: 15000,

              maximumAge: 5000,
            }
          );
        }
      );

  /* =========================================================
     SINGLE LOCATION UPDATE
  ========================================================= */

  const sendCurrentLocation =
    async () => {
      try {
        const position =
          await requestCurrentLocation();

        await saveLocation(
          position
        );
      } catch (err) {
        console.error(
          "Location request error:",
          err
        );

        setLocationText(
          err?.message ||
            "Unable to get current location."
        );

        setError(
          err?.message ||
            "Unable to get current location."
        );
      }
    };

  /* =========================================================
     START LOCATION SHARING
  ========================================================= */

  const startLocationSharing =
    async () => {
      if (!driver) {
        setError(
          "Driver profile is not available."
        );

        return;
      }

      try {
        setLocationLoading(true);

        setError("");
        setSuccess("");

        /*
          IMPORTANT ORDER

          1. Enable GPS in backend
          2. Get browser GPS
          3. POST location
        */

        await updateGpsEnabled(
          true
        );

        const position =
          await requestCurrentLocation();

        const saved =
          await saveLocation(
            position
          );

        if (!saved) {
          return;
        }

        if (
          intervalRef.current
        ) {
          clearInterval(
            intervalRef.current
          );
        }

        intervalRef.current =
          setInterval(() => {
            sendCurrentLocation();
          }, 15000);

        setSuccess(
          "Location sharing is active. Your latest location will be sent every 15 seconds while this page remains open."
        );
      } catch (err) {
        console.error(
          "Start location sharing error:",
          err
        );

        setLocationEnabled(false);

        setLocationText(
          err?.message ||
            "Unable to start location sharing."
        );

        setError(
          err?.message ||
            "Unable to start location sharing."
        );
      } finally {
        setLocationLoading(false);
      }
    };

  /* =========================================================
     STOP LOCATION SHARING
  ========================================================= */

  const stopLocationSharing =
    async () => {
      try {
        setLocationLoading(true);

        setError("");
        setSuccess("");

        if (
          intervalRef.current
        ) {
          clearInterval(
            intervalRef.current
          );

          intervalRef.current =
            null;
        }

        await updateGpsEnabled(
          false
        );

        setLocationEnabled(false);

        setLatitude(null);
        setLongitude(null);

        setLocationText(
          "Location sharing stopped."
        );

        setSuccess(
          "GPS location sharing has been stopped."
        );
      } catch (err) {
        console.error(
          "Stop location error:",
          err
        );

        setError(
          err?.message ||
            "Unable to stop location sharing."
        );
      } finally {
        setLocationLoading(false);
      }
    };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <>
        <style>{`
          .driver-location-loading {
            min-height: 100vh;

            display: flex;
            align-items: center;
            justify-content: center;

            background: #f4f7fa;

            color: #7b8794;

            font-family:
              Arial,
              Helvetica,
              sans-serif;

            font-size: 12px;
          }
        `}</style>

        <div className="driver-location-loading">
          Loading driver information...
        </div>
      </>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      <style>{`
        .driver-location-page {
          min-height: 100vh;

          padding: 30px;

          background: #f4f7fa;

          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .driver-location-header h1 {
          margin: 0 0 6px;

          color: #0b2946;

          font-size: 28px;
        }

        .driver-location-header p {
          margin: 0 0 24px;

          color: #7b8794;

          font-size: 12px;
        }

        .driver-location-alert {
          margin-bottom: 15px;

          padding: 12px 14px;

          border-radius: 7px;

          font-size: 10px;

          line-height: 1.5;
        }

        .driver-location-alert.error {
          background: #fff1f1;

          border:
            1px solid #efc8c8;

          color: #a43c3c;
        }

        .driver-location-alert.success {
          background: #e8f7ed;

          border:
            1px solid #c3e6cd;

          color: #24713b;
        }

        .driver-location-grid {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 20px;
        }

        .driver-location-card {
          background: white;

          padding: 22px;

          border:
            1px solid #e2e7ec;

          border-radius: 10px;
        }

        .driver-location-card h2 {
          margin: 0 0 18px;

          color: #0b2946;

          font-size: 17px;
        }

        .driver-status-options {
          display: grid;

          gap: 10px;
        }

        .driver-status-option {
          display: flex;

          justify-content:
            space-between;

          align-items: center;

          padding: 13px;

          background: #f8fafc;

          border-radius: 7px;
        }

        .driver-status-option span {
          color: #53616e;

          font-size: 11px;
        }

        .driver-status-option button {
          border:
            1px solid #d9e0e6;

          background: white;

          padding: 7px 10px;

          border-radius: 5px;

          cursor: pointer;

          font-size: 9px;
        }

        .driver-status-option button.selected {
          background: #f6c20d;

          border-color: #f6c20d;

          color: #0b2946;

          font-weight: 700;
        }

        .driver-status-option button:disabled {
          opacity: .6;

          cursor: not-allowed;
        }

        .driver-location-box {
          padding: 18px;

          background: #f8fafc;

          border-radius: 8px;

          text-align: center;
        }

        .driver-location-icon {
          font-size: 35px;

          margin-bottom: 12px;
        }

        .driver-location-box h3 {
          margin: 0 0 7px;

          color: #0b2946;

          font-size: 14px;
        }

        .driver-location-box p {
          margin: 0 0 15px;

          color: #73808c;

          font-size: 10px;

          line-height: 1.5;
        }

        .driver-location-btn {
          width: 100%;

          border: none;

          background: #f6c20d;

          color: #0b2946;

          padding: 11px;

          border-radius: 6px;

          cursor: pointer;

          font-weight: 700;

          font-size: 10px;
        }

        .driver-location-btn:hover:not(:disabled) {
          background: #e5b500;
        }

        .driver-location-btn:disabled {
          opacity: .6;

          cursor: not-allowed;
        }

        .driver-stop-location-btn {
          width: 100%;

          margin-top: 9px;

          border:
            1px solid #d9e0e6;

          background: white;

          color: #a43c3c;

          padding: 10px;

          border-radius: 6px;

          cursor: pointer;

          font-weight: 700;

          font-size: 10px;
        }

        .driver-location-result {
          margin-top: 15px;

          padding: 12px;

          border-radius: 7px;

          background: ${
            locationEnabled
              ? "#e5f6eb"
              : "#fff4d7"
          };

          color: #53616e;

          font-size: 10px;

          line-height: 1.5;
        }

        .driver-location-note {
          margin-top: 20px;

          padding: 14px;

          background: #eef6ff;

          border-radius: 7px;

          color: #5b7184;

          font-size: 10px;

          line-height: 1.6;
        }

        .driver-gps-details {
          margin-top: 15px;

          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 10px;
        }

        .driver-gps-detail {
          padding: 10px;

          background: white;

          border:
            1px solid #e4e9ed;

          border-radius: 6px;

          text-align: left;
        }

        .driver-gps-detail span {
          display: block;

          margin-bottom: 4px;

          color: #8a959f;

          font-size: 8px;
        }

        .driver-gps-detail strong {
          color: #0b2946;

          font-size: 10px;
        }

        .location-live-indicator {
          display: inline-block;

          margin-bottom: 12px;

          padding: 5px 9px;

          border-radius: 20px;

          background: #e5f6eb;

          color: #18763a;

          font-size: 9px;

          font-weight: 700;
        }

        @media(max-width:800px) {
          .driver-location-grid {
            grid-template-columns:
              1fr;
          }
        }

        @media(max-width:480px) {
          .driver-gps-details {
            grid-template-columns:
              1fr;
          }
        }
      `}</style>

      <main className="driver-location-page">

        <div className="driver-location-header">
          <h1>
            Location & Status
          </h1>

          <p>
            Manage your availability and
            share your current GPS
            location with Makumbura Taxi
            Operations.
          </p>
        </div>

        {error && (
          <div className="driver-location-alert error">
            {error}
          </div>
        )}

        {success && (
          <div className="driver-location-alert success">
            {success}
          </div>
        )}

        <div className="driver-location-grid">

          {/* =================================================
              DRIVER STATUS
          ================================================= */}

          <section className="driver-location-card">

            <h2>
              Driver Availability
            </h2>

            <div className="driver-status-options">

              {[
                "Available",
                "On Ride",
                "Offline",
              ].map((item) => (
                <div
                  className="driver-status-option"
                  key={item}
                >
                  <span>
                    {item}
                  </span>

                  <button
                    type="button"
                    disabled={
                      statusLoading
                    }
                    className={
                      status === item
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      updateDriverStatus(
                        item
                      )
                    }
                  >
                    {statusLoading
                      ? "Updating..."
                      : status === item
                      ? "Current"
                      : "Set Status"}
                  </button>
                </div>
              ))}

            </div>

            <div className="driver-location-note">
              Current operational
              status:{" "}

              <strong>
                {status}
              </strong>

              <br />
              <br />

              <strong>
                Available:
              </strong>{" "}
              Driver can receive new
              booking assignments.

              <br />
              <br />

              <strong>
                Offline:
              </strong>{" "}
              Driver is not available for
              new bookings.

              <br />
              <br />

              <strong>
                On Ride:
              </strong>{" "}
              Normally this status should
              be controlled automatically
              by the trip lifecycle when a
              trip starts and completes.
            </div>

          </section>

          {/* =================================================
              GPS
          ================================================= */}

          <section className="driver-location-card">

            <h2>
              GPS Location
            </h2>

            <div className="driver-location-box">

              {locationEnabled && (
                <div className="location-live-indicator">
                  ● Location Sharing Active
                </div>
              )}

              <div className="driver-location-icon">
                📍
              </div>

              <h3>
                {locationEnabled
                  ? "GPS Location Enabled"
                  : "GPS Location Disabled"}
              </h3>

              <p>
                Allow browser location
                permission so Taxi
                Operations and passengers
                with an active booking can
                view your latest location.
              </p>

              <button
                type="button"
                className="driver-location-btn"
                disabled={
                  locationLoading
                }
                onClick={
                  startLocationSharing
                }
              >
                {locationLoading
                  ? "Getting Location..."
                  : locationEnabled
                  ? "Refresh / Continue Sharing"
                  : "Enable Location Sharing"}
              </button>

              {locationEnabled && (
                <button
                  type="button"
                  className="driver-stop-location-btn"
                  disabled={
                    locationLoading
                  }
                  onClick={
                    stopLocationSharing
                  }
                >
                  Stop Location Sharing
                </button>
              )}

              <div className="driver-location-result">
                {locationText}
              </div>

              {latitude !== null &&
                longitude !== null && (
                  <div className="driver-gps-details">

                    <div className="driver-gps-detail">
                      <span>
                        Latitude
                      </span>

                      <strong>
                        {latitude.toFixed(
                          6
                        )}
                      </strong>
                    </div>

                    <div className="driver-gps-detail">
                      <span>
                        Longitude
                      </span>

                      <strong>
                        {longitude.toFixed(
                          6
                        )}
                      </strong>
                    </div>

                  </div>
                )}

            </div>

            <div className="driver-location-note">
              While location sharing is
              active, this page sends the
              latest GPS location to the
              MMC Taxi backend every
              <strong> 15 seconds</strong>.

              <br />
              <br />

              Browser-based sharing works
              while this page remains open.
              Closing the browser/tab can
              stop continuous GPS updates.
            </div>

          </section>

        </div>

      </main>
    </>
  );
}

export default DriverLocation;