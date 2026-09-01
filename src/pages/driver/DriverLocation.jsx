import { useEffect, useRef, useState } from "react";

function DriverLocation() {
  const [status, setStatus] = useState("Offline");
  const [driver, setDriver] = useState(null);

  const [locationEnabled, setLocationEnabled] =
    useState(false);

  const [locationText, setLocationText] =
    useState("Location not shared");

  const [latitude, setLatitude] =
    useState(null);

  const [longitude, setLongitude] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [statusLoading, setStatusLoading] =
    useState(false);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const intervalRef = useRef(null);

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

  const apiStatusToDisplay = (apiStatus) => {
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

  const displayStatusToApi = (displayStatus) => {
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

  useEffect(() => {
    loadDriver();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const loadDriver = async () => {
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

      const response = await fetch(
        "http://localhost:5171/api/drivers",
        {
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load driver information."
        );
      }

      const drivers =
        await response.json();

      const currentDriver =
        drivers.find(
          (item) =>
            Number(item.userId) ===
            Number(user.userId)
        );

      if (!currentDriver) {
        setError(
          "Driver profile was not found for this account."
        );

        return;
      }

      setDriver(currentDriver);

      setStatus(
        apiStatusToDisplay(
          currentDriver.operationalStatus
        )
      );

      if (currentDriver.gpsEnabled) {
        setLocationEnabled(true);

        setLocationText(
          "GPS sharing is enabled for this driver."
        );
      }
    } catch (err) {
      console.error(
        "Driver loading error:",
        err
      );

      setError(
        err.message ||
          "Unable to load driver information."
      );
    } finally {
      setLoading(false);
    }
  };

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

        const apiStatus =
          displayStatusToApi(newStatus);

        const response = await fetch(
          `http://localhost:5171/api/drivers/${driver.driverId}`,
          {
            method: "PUT",

            headers: getHeaders(),

            body: JSON.stringify({
              ...driver,

              operationalStatus:
                apiStatus,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            "Unable to update driver status."
          );
        }

        const updatedDriver =
          await response.json();

        setDriver(
          updatedDriver
        );

        setStatus(
          apiStatusToDisplay(
            updatedDriver.operationalStatus
          )
        );
      } catch (err) {
        console.error(
          "Driver status error:",
          err
        );

        setError(
          err.message ||
            "Unable to update driver status."
        );
      } finally {
        setStatusLoading(false);
      }
    };

  const saveLocation =
    async (position) => {
      if (!driver) {
        return;
      }

      const lat =
        position.coords.latitude;

      const lng =
        position.coords.longitude;

      setLatitude(lat);
      setLongitude(lng);

      try {
        const response = await fetch(
          "http://localhost:5171/api/driverlocations",
          {
            method: "POST",

            headers: getHeaders(),

            body: JSON.stringify({
              driverId:
                driver.driverId,

              latitude: lat,

              longitude: lng,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            "Unable to save GPS location."
          );
        }

        setLocationEnabled(true);

        setLocationText(
          `Latitude: ${lat.toFixed(
            5
          )}, Longitude: ${lng.toFixed(
            5
          )}`
        );

        await updateGpsEnabled(true);
      } catch (err) {
        console.error(
          "Save location error:",
          err
        );

        setLocationText(
          "GPS location was received, but could not be saved to the server."
        );
      }
    };

  const updateGpsEnabled =
    async (enabled) => {
      if (!driver) {
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5171/api/drivers/${driver.driverId}`,
          {
            method: "PUT",

            headers: getHeaders(),

            body: JSON.stringify({
              ...driver,

              gpsEnabled: enabled,
            }),
          }
        );

        if (response.ok) {
          const updatedDriver =
            await response.json();

          setDriver(
            updatedDriver
          );
        }
      } catch (err) {
        console.error(
          "GPS status update error:",
          err
        );
      }
    };

  const requestCurrentLocation =
    () => {
      if (!navigator.geolocation) {
        setLocationText(
          "Geolocation is not supported by this browser."
        );

        return;
      }

      setLocationLoading(true);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await saveLocation(
            position
          );

          setLocationLoading(false);
        },

        (geoError) => {
          console.error(
            "Geolocation error:",
            geoError
          );

          setLocationEnabled(false);

          if (
            geoError.code ===
            geoError.PERMISSION_DENIED
          ) {
            setLocationText(
              "Location permission was denied. Please allow location permission in your browser."
            );
          } else if (
            geoError.code ===
            geoError.POSITION_UNAVAILABLE
          ) {
            setLocationText(
              "Current location is unavailable."
            );
          } else if (
            geoError.code ===
            geoError.TIMEOUT
          ) {
            setLocationText(
              "Location request timed out."
            );
          } else {
            setLocationText(
              "Unable to get current location."
            );
          }

          setLocationLoading(false);
        },

        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        }
      );
    };

  const startLocationSharing =
    () => {
      if (!navigator.geolocation) {
        setLocationText(
          "Geolocation is not supported by this browser."
        );

        return;
      }

      requestCurrentLocation();

      if (intervalRef.current) {
        clearInterval(
          intervalRef.current
        );
      }

      intervalRef.current =
        setInterval(() => {
          requestCurrentLocation();
        }, 15000);
    };

  const stopLocationSharing =
    async () => {
      if (intervalRef.current) {
        clearInterval(
          intervalRef.current
        );

        intervalRef.current =
          null;
      }

      setLocationEnabled(false);

      setLocationText(
        "Location sharing stopped."
      );

      setLatitude(null);
      setLongitude(null);

      await updateGpsEnabled(false);
    };

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
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
          }
        `}</style>

        <div className="driver-location-loading">
          Loading driver information...
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        .driver-location-page {
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
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

        .driver-location-error {
          margin-bottom: 20px;
          padding: 13px;
          background: #fff1f1;
          border: 1px solid #efc8c8;
          border-radius: 7px;
          color: #a43c3c;
          font-size: 10px;
          line-height: 1.6;
        }

        .driver-location-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .driver-location-card {
          background: white;
          padding: 22px;
          border: 1px solid #e2e7ec;
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
          justify-content: space-between;
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
          border: 1px solid #d9e0e6;
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
          opacity: 0.6;
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

        .driver-location-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .driver-stop-location-btn {
          width: 100%;
          margin-top: 9px;
          border: 1px solid #d9e0e6;
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
          background: ${
            locationEnabled
              ? "#e5f6eb"
              : "#fff4d7"
          };
          border-radius: 7px;
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
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .driver-gps-detail {
          padding: 10px;
          background: white;
          border: 1px solid #e4e9ed;
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

        @media(max-width: 800px) {
          .driver-location-grid {
            grid-template-columns: 1fr;
          }
        }

        @media(max-width: 480px) {
          .driver-gps-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="driver-location-page">

        <div className="driver-location-header">
          <h1>Location & Status</h1>

          <p>
            Manage your availability and share
            your current GPS location with
            Makumbura Taxi Operations.
          </p>
        </div>

        {error && (
          <div className="driver-location-error">
            {error}
          </div>
        )}

        <div className="driver-location-grid">

          <section className="driver-location-card">

            <h2>Driver Availability</h2>

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

                  <span>{item}</span>

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

              Current operational status:{" "}

              <strong>
                {status}
              </strong>

              <br />
              <br />

              Available drivers can receive
              booking requests. On Ride means
              an active passenger trip is in
              progress. Offline drivers should
              not receive new assignments.

            </div>

          </section>

          <section className="driver-location-card">

            <h2>GPS Location</h2>

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
                Allow browser location permission
                so Taxi Operations and passengers
                with an active booking can view
                your latest location.
              </p>

              <button
                type="button"

                className="driver-location-btn"

                disabled={locationLoading}

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
                      <span>Latitude</span>

                      <strong>
                        {latitude.toFixed(
                          6
                        )}
                      </strong>
                    </div>

                    <div className="driver-gps-detail">
                      <span>Longitude</span>

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

              While location sharing is active,
              this page sends a new GPS location
              to the MMC Taxi backend every
              15 seconds.

              <br />
              <br />

              Browser-based sharing normally
              works while this page is open.
              If the browser or tab is closed,
              continuous browser GPS tracking
              cannot be guaranteed.

            </div>

          </section>

        </div>

      </main>
    </>
  );
}

export default DriverLocation;