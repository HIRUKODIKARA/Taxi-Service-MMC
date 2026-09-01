import { useEffect, useState } from "react";

function TrackBooking() {
  const [booking, setBooking] = useState(null);

  const [driver, setDriver] = useState(null);

  const [driverUser, setDriverUser] = useState(null);

  const [vehicle, setVehicle] = useState(null);

  const [vehicleType, setVehicleType] = useState(null);

  const [location, setLocation] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);

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

  const getStatusClass = (status) => {
    switch (status) {
      case "ACCEPTED":
        return "accepted";

      case "DRIVER_ARRIVING":
        return "arriving";

      case "ON_RIDE":
        return "onride";

      case "COMPLETED":
        return "completed";

      default:
        return "waiting";
    }
  };

  const loadTrackingData =
    async (showMainLoading = true) => {
      if (!user) {
        setError(
          "Please login to track your booking."
        );

        setLoading(false);

        return;
      }

      try {
        if (showMainLoading) {
          setLoading(true);
        }

        setError("");

        const bookingsResponse =
          await fetch(
            "http://localhost:5171/api/bookings",
            {
              headers: getHeaders(),
            }
          );

        if (!bookingsResponse.ok) {
          throw new Error(
            "Unable to load bookings."
          );
        }

        const allBookings =
          await bookingsResponse.json();

        const passengerBookings =
          allBookings.filter(
            (item) =>
              Number(item.passengerId) ===
                Number(user.userId) &&
              [
                "ACCEPTED",
                "DRIVER_ARRIVING",
                "ON_RIDE",
              ].includes(
                item.bookingStatus
              )
          );

        passengerBookings.sort(
          (a, b) =>
            new Date(
              b.createdAt || 0
            ) -
            new Date(
              a.createdAt || 0
            )
        );

        const activeBooking =
          passengerBookings[0];

        if (!activeBooking) {
          setBooking(null);

          setDriver(null);

          setVehicle(null);

          setLocation(null);

          setError(
            "You do not currently have an accepted or active booking to track."
          );

          return;
        }

        setBooking(activeBooking);

        if (
          !activeBooking.assignedDriverId
        ) {
          setError(
            "A driver has not been assigned to this booking yet."
          );

          return;
        }

        const [
          driversResponse,
          usersResponse,
          vehiclesResponse,
          vehicleTypesResponse,
        ] = await Promise.all([
          fetch(
            "http://localhost:5171/api/drivers",
            {
              headers: getHeaders(),
            }
          ),

          fetch(
            "http://localhost:5171/api/users",
            {
              headers: getHeaders(),
            }
          ),

          fetch(
            "http://localhost:5171/api/vehicles",
            {
              headers: getHeaders(),
            }
          ),

          fetch(
            "http://localhost:5171/api/vehicletypes",
            {
              headers: getHeaders(),
            }
          ),
        ]);

        const driversData =
          driversResponse.ok
            ? await driversResponse.json()
            : [];

        const usersData =
          usersResponse.ok
            ? await usersResponse.json()
            : [];

        const vehiclesData =
          vehiclesResponse.ok
            ? await vehiclesResponse.json()
            : [];

        const vehicleTypesData =
          vehicleTypesResponse.ok
            ? await vehicleTypesResponse.json()
            : [];

        const assignedDriver =
          driversData.find(
            (item) =>
              Number(item.driverId) ===
              Number(
                activeBooking.assignedDriverId
              )
          );

        setDriver(
          assignedDriver || null
        );

        if (assignedDriver) {
          const assignedDriverUser =
            usersData.find(
              (item) =>
                Number(item.userId) ===
                Number(
                  assignedDriver.userId
                )
            );

          setDriverUser(
            assignedDriverUser || null
          );
        }

        const assignedVehicle =
          vehiclesData.find(
            (item) =>
              Number(item.vehicleId) ===
              Number(
                activeBooking.assignedVehicleId
              )
          );

        setVehicle(
          assignedVehicle || null
        );

        if (assignedVehicle) {
          const matchedVehicleType =
            vehicleTypesData.find(
              (item) =>
                Number(
                  item.vehicleTypeId
                ) ===
                Number(
                  assignedVehicle.vehicleTypeId
                )
            );

          setVehicleType(
            matchedVehicleType || null
          );
        }

        try {
          const locationResponse =
            await fetch(
              `http://localhost:5171/api/driverlocations/driver/${activeBooking.assignedDriverId}/latest`,
              {
                headers:
                  getHeaders(),
              }
            );

          if (locationResponse.ok) {
            const locationData =
              await locationResponse.json();

            setLocation(
              locationData
            );

            setLastUpdated(
              new Date()
            );
          } else {
            setLocation(null);
          }
        } catch (
          locationError
        ) {
          console.error(
            "Driver location error:",
            locationError
          );

          setLocation(null);
        }
      } catch (err) {
        console.error(
          "Tracking error:",
          err
        );

        setError(
          err.message ||
            "Unable to load tracking information."
        );
      } finally {
        if (showMainLoading) {
          setLoading(false);
        }
      }
    };

  useEffect(() => {
    loadTrackingData(true);

    const interval =
      setInterval(() => {
        loadTrackingData(false);
      }, 10000);

    return () =>
      clearInterval(interval);
  }, []);

  const getMapUrl = () => {
    if (!location) {
      return "";
    }

    const latitude =
      Number(location.latitude);

    const longitude =
      Number(location.longitude);

    const offset = 0.008;

    const left =
      longitude - offset;

    const right =
      longitude + offset;

    const bottom =
      latitude - offset;

    const top =
      latitude + offset;

    return (
      "https://www.openstreetmap.org/export/embed.html" +
      `?bbox=${left}%2C${bottom}%2C${right}%2C${top}` +
      `&layer=mapnik&marker=${latitude}%2C${longitude}`
    );
  };

  return (
    <>
      <style>{`
        .track-page {
          min-height: 100vh;

          padding: 30px;

          background: #f4f7fa;

          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .track-page h1 {
          margin: 0 0 6px;

          color: #0b2946;

          font-size: 28px;
        }

        .track-page > p {
          margin: 0 0 23px;

          color: #7b8794;

          font-size: 12px;
        }

        .track-grid {
          display: grid;

          grid-template-columns:
            1.4fr 1fr;

          gap: 20px;
        }

        .track-card {
          background: white;

          border:
            1px solid #e2e7ec;

          border-radius: 10px;

          padding: 22px;
        }

        .track-card h2 {
          margin: 0 0 17px;

          color: #0b2946;

          font-size: 17px;
        }

        .real-map {
          height: 400px;

          width: 100%;

          border:
            1px solid #e1e7eb;

          border-radius: 8px;

          overflow: hidden;

          background: #f8fafc;
        }

        .real-map iframe {
          width: 100%;

          height: 100%;

          border: none;
        }

        .map-unavailable {
          height: 400px;

          display: flex;

          align-items: center;

          justify-content: center;

          padding: 25px;

          box-sizing: border-box;

          background:
            linear-gradient(
              45deg,
              #eef3f7 25%,
              transparent 25%
            )
            0 0 / 30px 30px,

            linear-gradient(
              45deg,
              transparent 75%,
              #eef3f7 75%
            )
            0 0 / 30px 30px,

            #f8fafc;

          border:
            1px solid #e1e7eb;

          border-radius: 8px;

          text-align: center;

          color: #63717d;

          font-size: 11px;

          line-height: 1.7;
        }

        .map-unavailable span {
          display: block;

          margin-bottom: 10px;

          font-size: 35px;
        }

        .map-coordinate-box {
          display: flex;

          gap: 10px;

          margin-top: 12px;
        }

        .coordinate-item {
          flex: 1;

          padding: 10px;

          background: #f8fafc;

          border:
            1px solid #e7ebef;

          border-radius: 6px;
        }

        .coordinate-item span {
          display: block;

          margin-bottom: 4px;

          color: #8a959f;

          font-size: 8px;
        }

        .coordinate-item strong {
          color: #0b2946;

          font-size: 10px;
        }

        .track-row {
          display: flex;

          justify-content:
            space-between;

          gap: 15px;

          padding: 10px 0;

          border-bottom:
            1px solid #edf0f3;
        }

        .track-row span {
          color: #89949e;

          font-size: 10px;
        }

        .track-row strong {
          color: #0b2946;

          font-size: 11px;

          text-align: right;
        }

        .tracking-status {
          display: inline-block;

          margin-bottom: 15px;

          padding: 6px 10px;

          border-radius: 20px;

          font-size: 9px;

          font-weight: 700;
        }

        .tracking-status.accepted {
          background: #e3effc;

          color: #24649f;
        }

        .tracking-status.arriving {
          background: #fff3cd;

          color: #806400;
        }

        .tracking-status.onride {
          background: #e3f6e7;

          color: #18763a;
        }

        .tracking-status.completed {
          background: #e3f6e7;

          color: #18763a;
        }

        .tracking-status.waiting {
          background: #edf0f3;

          color: #53616e;
        }

        .tracking-note {
          margin-top: 16px;

          padding: 13px;

          background: #eef6ff;

          border-radius: 7px;

          color: #60758a;

          font-size: 10px;

          line-height: 1.6;
        }

        .tracking-error {
          padding: 18px;

          background: #fff1f1;

          border:
            1px solid #efc8c8;

          border-radius: 8px;

          color: #a43c3c;

          font-size: 11px;

          line-height: 1.6;
        }

        .tracking-loading {
          padding: 30px;

          text-align: center;

          color: #7b8794;

          font-size: 11px;
        }

        .tracking-refresh {
          margin-top: 13px;

          width: 100%;

          padding: 10px;

          border: none;

          border-radius: 6px;

          background: #0b2946;

          color: white;

          font-size: 9px;

          font-weight: 700;

          cursor: pointer;
        }

        .tracking-refresh:hover {
          background: #153b5e;
        }

        @media(max-width: 850px) {
          .track-grid {
            grid-template-columns:
              1fr;
          }

          .track-page {
            padding: 20px;
          }
        }

        @media(max-width: 500px) {
          .map-coordinate-box {
            flex-direction: column;
          }
        }
      `}</style>

      <main className="track-page">

        <h1>Track Booking</h1>

        <p>
          Track your assigned driver
          after the booking has been
          accepted.
        </p>

        {loading ? (
          <div className="track-card">

            <div className="tracking-loading">
              Loading your active
              booking...
            </div>

          </div>
        ) : error && !booking ? (
          <div className="tracking-error">
            {error}
          </div>
        ) : booking ? (
          <div className="track-grid">

            <section className="track-card">

              <h2>
                Driver Location
              </h2>

              {location ? (
                <>
                  <div className="real-map">

                    <iframe
                      title="Driver Location"
                      src={getMapUrl()}
                      loading="lazy"
                    />

                  </div>

                  <div className="map-coordinate-box">

                    <div className="coordinate-item">
                      <span>
                        Latitude
                      </span>

                      <strong>
                        {
                          location.latitude
                        }
                      </strong>
                    </div>

                    <div className="coordinate-item">
                      <span>
                        Longitude
                      </span>

                      <strong>
                        {
                          location.longitude
                        }
                      </strong>
                    </div>

                  </div>
                </>
              ) : (
                <div className="map-unavailable">

                  <div>
                    <span>📍</span>

                    Driver GPS location
                    is not available yet.

                    <br />

                    The map will appear
                    automatically when
                    the driver shares
                    location.
                  </div>

                </div>
              )}

            </section>

            <aside className="track-card">

              <h2>
                Booking Details
              </h2>

              <span
                className={`tracking-status ${getStatusClass(
                  booking.bookingStatus
                )}`}
              >
                ●{" "}
                {formatStatus(
                  booking.bookingStatus
                )}
              </span>

              <div className="track-row">
                <span>
                  Booking ID
                </span>

                <strong>
                  #
                  {
                    booking.bookingId
                  }
                </strong>
              </div>

              <div className="track-row">
                <span>
                  Driver
                </span>

                <strong>
                  {driverUser?.fullName ||
                    "Assigned Driver"}
                </strong>
              </div>

              <div className="track-row">
                <span>
                  Driver Phone
                </span>

                <strong>
                  {driverUser?.phone ||
                    "—"}
                </strong>
              </div>

              <div className="track-row">
                <span>
                  Vehicle
                </span>

                <strong>
                  {vehicleType?.typeName ||
                    "—"}
                </strong>
              </div>

              <div className="track-row">
                <span>
                  Registration
                </span>

                <strong>
                  {vehicle?.registrationNumber ||
                    "—"}
                </strong>
              </div>

              <div className="track-row">
                <span>
                  Pickup
                </span>

                <strong>
                  {
                    booking.pickupLocation
                  }
                </strong>
              </div>

              <div className="track-row">
                <span>
                  Destination
                </span>

                <strong>
                  {
                    booking.destination
                  }
                </strong>
              </div>

              <div className="track-row">
                <span>
                  GPS Status
                </span>

                <strong>
                  {location
                    ? "Live Location Available"
                    : "Waiting for Location"}
                </strong>
              </div>

              {location && (
                <div className="track-row">
                  <span>
                    Last Location
                  </span>

                  <strong>
                    {location.recordedAt
                      ? new Date(
                          location.recordedAt
                        ).toLocaleString()
                      : lastUpdated
                      ? lastUpdated.toLocaleString()
                      : "—"}
                  </strong>
                </div>
              )}

              <div className="tracking-note">
                Driver location is
                refreshed automatically
                every 10 seconds while
                this page is open.
              </div>

              <button
                type="button"
                className="tracking-refresh"
                onClick={() =>
                  loadTrackingData(
                    false
                  )
                }
              >
                Refresh Location
              </button>

            </aside>

          </div>
        ) : null}

      </main>
    </>
  );
}

export default TrackBooking;