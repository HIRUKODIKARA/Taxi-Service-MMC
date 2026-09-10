import { useEffect, useRef, useState } from "react";

function TrackBooking() {
  const [booking, setBooking] = useState(null);
  const [vehicleType, setVehicleType] = useState(null);
  const [location, setLocation] = useState(null);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [roadRoute, setRoadRoute] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeError, setRouteError] = useState("");

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const routeRequestRef = useRef(0);

  const API_BASE_URL = "http://localhost:5171/api";

  const getToken = () =>
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    "";

  const getHeaders = () => {
    const token = getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";
    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "ACCEPTED":
        return "accepted";
      case "DRIVER_ARRIVING":
      case "DRIVER_ARRIVED":
        return "arriving";
      case "ON_RIDE":
        return "onride";
      case "COMPLETED":
        return "completed";
      default:
        return "waiting";
    }
  };

  // Photon supports search/autocomplete use and avoids Nominatim autocomplete.
  const geocodeLocation = async (place) => {
    if (!place) return null;

    // If backend already supplies coordinates in future, no change is needed here.
    try {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(
          place + ", Sri Lanka"
        )}&limit=1`
      );

      if (!response.ok) return null;

      const data = await response.json();
      const feature = data?.features?.[0];
      if (!feature?.geometry?.coordinates) return null;

      const [lng, lat] = feature.geometry.coordinates;
      return { lat: Number(lat), lng: Number(lng) };
    } catch (err) {
      console.error("Location geocoding error:", err);
      return null;
    }
  };

  const loadTrackingData = async (showMainLoading = true) => {
    const token = getToken();

    if (!token) {
      setError("Please login to track your booking.");
      setLoading(false);
      return;
    }

    try {
      if (showMainLoading) setLoading(true);
      setError("");

      const bookingsResponse = await fetch(`${API_BASE_URL}/bookings/my`, {
        headers: getHeaders(),
      });

      if (!bookingsResponse.ok) {
        let errorData = null;
        try {
          errorData = await bookingsResponse.json();
        } catch {
          errorData = null;
        }

        throw new Error(
          errorData?.message || "Unable to load your bookings."
        );
      }

      const myBookings = await bookingsResponse.json();

      const passengerBookings = myBookings.filter((item) =>
        ["ACCEPTED", "DRIVER_ARRIVING", "DRIVER_ARRIVED", "ON_RIDE"].includes(
          item.bookingStatus
        )
      );

      passengerBookings.sort(
        (a, b) =>
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      const activeBooking = passengerBookings[0];

      if (!activeBooking) {
        setBooking(null);
        setLocation(null);
        setError(
          "You do not currently have an accepted or active booking to track."
        );
        return;
      }

      setBooking(activeBooking);

      if (!activeBooking.assignedDriverId) {
        setError("A driver has not been assigned to this booking yet.");
        return;
      }

      // Public active vehicle types
      try {
        const vehicleTypesResponse = await fetch(
          `${API_BASE_URL}/vehicletypes`,
          { headers: getHeaders() }
        );

        if (vehicleTypesResponse.ok) {
          const vehicleTypesData = await vehicleTypesResponse.json();
          const matched = vehicleTypesData.find(
            (item) =>
              Number(item.vehicleTypeId) ===
              Number(activeBooking.vehicleTypeId)
          );
          setVehicleType(matched || null);
        }
      } catch (err) {
        console.error("Vehicle type error:", err);
      }

      // Latest assigned driver GPS location
      try {
        const locationResponse = await fetch(
          `${API_BASE_URL}/driverlocations/driver/${activeBooking.assignedDriverId}/latest`,
          { headers: getHeaders() }
        );

        if (locationResponse.ok) {
          const locationData = await locationResponse.json();
          setLocation(locationData);
          setLastUpdated(new Date());
        } else {
          // Keep the previous location so the passenger can still see the
          // last known driver position if a refresh temporarily fails.
          setLocation((previousLocation) => previousLocation);
        }
      } catch (locationError) {
        console.error("Driver location error:", locationError);
        // Do not clear the previous location on a temporary network error.
        setLocation((previousLocation) => previousLocation);
      }
    } catch (err) {
      console.error("Tracking error:", err);
      setError(err.message || "Unable to load tracking information.");
    } finally {
      if (showMainLoading) setLoading(false);
    }
  };

  // Load Leaflet without requiring another npm package.
  useEffect(() => {
    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const finish = () => setMapReady(true);

    if (window.L) {
      finish();
      return;
    }

    const existing = document.getElementById("leaflet-js");
    if (existing) {
      existing.addEventListener("load", finish);
      return () => existing.removeEventListener("load", finish);
    }

    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = finish;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    loadTrackingData(true);

    const interval = setInterval(() => {
      loadTrackingData(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Dynamically resolve whatever pickup/destination the passenger selected.
  useEffect(() => {
    if (!booking) {
      setPickupCoords(null);
      setDestinationCoords(null);
      return;
    }

    let cancelled = false;

    const resolveBookingLocations = async () => {
      const [pickup, destination] = await Promise.all([
        geocodeLocation(booking.pickupLocation),
        geocodeLocation(booking.destination),
      ]);

      if (!cancelled) {
        setPickupCoords(pickup);
        setDestinationCoords(destination);
      }
    };

    resolveBookingLocations();

    return () => {
      cancelled = true;
    };
  }, [booking?.bookingId, booking?.pickupLocation, booking?.destination]);

  // Load the real road route from OSRM whenever the driver or target changes.
  useEffect(() => {
    const driverLat = Number(location?.latitude);
    const driverLng = Number(location?.longitude);

    if (!Number.isFinite(driverLat) || !Number.isFinite(driverLng)) {
      setRoadRoute([]);
      setRouteInfo(null);
      setRouteError("");
      return;
    }

    // Before pickup: Driver -> Pickup
    // During ON_RIDE: Driver -> Destination
    const target =
      booking?.bookingStatus === "ON_RIDE"
        ? destinationCoords
        : pickupCoords;

    if (!target) {
      setRoadRoute([]);
      setRouteInfo(null);
      setRouteError("");
      return;
    }

    const targetLat = Number(target.lat);
    const targetLng = Number(target.lng);

    if (!Number.isFinite(targetLat) || !Number.isFinite(targetLng)) {
      return;
    }

    const currentRequestId = ++routeRequestRef.current;
    const controller = new AbortController();

    const loadRoadRoute = async () => {
      try {
        setRouteError("");

        // OSRM expects coordinates in longitude,latitude order.
        const routeUrl =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${driverLng},${driverLat};${targetLng},${targetLat}` +
          `?overview=full&geometries=geojson&steps=false`;

        const response = await fetch(routeUrl, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Road route service is currently unavailable.");
        }

        const data = await response.json();
        const route = data?.routes?.[0];
        const coordinates = route?.geometry?.coordinates;

        if (
          data?.code !== "Ok" ||
          !Array.isArray(coordinates) ||
          coordinates.length === 0
        ) {
          throw new Error("No road route was found for these locations.");
        }

        // Ignore an older response if a newer GPS request already started.
        if (currentRequestId !== routeRequestRef.current) return;

        // GeoJSON coordinates are [longitude, latitude].
        // Leaflet needs [latitude, longitude].
        const leafletRoute = coordinates.map(([lng, lat]) => [
          Number(lat),
          Number(lng),
        ]);

        setRoadRoute(leafletRoute);
        setRouteInfo({
          distanceMeters: Number(route.distance || 0),
          durationSeconds: Number(route.duration || 0),
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        if (currentRequestId !== routeRequestRef.current) return;

        console.error("OSRM road route error:", err);
        setRouteError(err.message || "Unable to load the road route.");

        // Keep the last successful road route visible instead of removing it.
      }
    };

    loadRoadRoute();

    return () => controller.abort();
  }, [
    location?.latitude,
    location?.longitude,
    pickupCoords?.lat,
    pickupCoords?.lng,
    destinationCoords?.lat,
    destinationCoords?.lng,
    booking?.bookingStatus,
  ]);

  // Create/update live map.
  useEffect(() => {
    if (!mapReady || !mapContainerRef.current || !window.L) return;

    const L = window.L;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
      }).setView([6.9271, 79.8612], 11);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    const createIcon = (emoji, className) =>
      L.divIcon({
        className: `custom-map-marker ${className}`,
        html: `<div>${emoji}</div>`,
        iconSize: [42, 42],
        iconAnchor: [21, 36],
      });

    const points = [];

    if (pickupCoords) {
      const point = [pickupCoords.lat, pickupCoords.lng];
      points.push(point);

      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = L.marker(point, {
          icon: createIcon("📍", "pickup-marker"),
        })
          .addTo(map)
          .bindPopup(
            `<b>Passenger Pickup</b><br/>${booking?.pickupLocation || ""}`
          );
      } else {
        pickupMarkerRef.current.setLatLng(point);
      }
    }

    if (destinationCoords) {
      const point = [destinationCoords.lat, destinationCoords.lng];
      points.push(point);

      if (!destinationMarkerRef.current) {
        destinationMarkerRef.current = L.marker(point, {
          icon: createIcon("🏁", "destination-marker"),
        })
          .addTo(map)
          .bindPopup(
            `<b>Destination</b><br/>${booking?.destination || ""}`
          );
      } else {
        destinationMarkerRef.current.setLatLng(point);
      }
    }

    if (location) {
      const driverPoint = [
        Number(location.latitude),
        Number(location.longitude),
      ];

      if (
        Number.isFinite(driverPoint[0]) &&
        Number.isFinite(driverPoint[1])
      ) {
        points.push(driverPoint);

        if (!driverMarkerRef.current) {
          driverMarkerRef.current = L.marker(driverPoint, {
            icon: createIcon("🚕", "driver-marker"),
          })
            .addTo(map)
            .bindPopup("<b>Your Driver</b><br/>Latest received location");
        } else {
          driverMarkerRef.current.setLatLng(driverPoint);
        }
      }
    }

    // Draw the real road route returned by OSRM.
    if (roadRoute.length >= 2) {
      if (!routeLineRef.current) {
        routeLineRef.current = L.polyline(roadRoute, {
          weight: 6,
          opacity: 0.85,
        }).addTo(map);
      } else {
        routeLineRef.current.setLatLngs(roadRoute);
      }
    }

    // Fit the map to the road route when available.
    if (roadRoute.length >= 2) {
      map.fitBounds(roadRoute, { padding: [45, 45], maxZoom: 16 });
    } else if (points.length >= 2) {
      map.fitBounds(points, { padding: [45, 45], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    }

    setTimeout(() => map.invalidateSize(), 50);
  }, [
    mapReady,
    location?.latitude,
    location?.longitude,
    pickupCoords?.lat,
    pickupCoords?.lng,
    destinationCoords?.lat,
    destinationCoords?.lng,
    booking?.bookingStatus,
    roadRoute,
  ]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const getConnectionStatus = () => {
    if (!location) return "OFFLINE";

    if (location?.tracking?.connectionStatus) {
      return location.tracking.connectionStatus;
    }

    if (!location.recordedAt) return "OFFLINE";

    const recorded = new Date(location.recordedAt).getTime();
    if (Number.isNaN(recorded)) return "OFFLINE";

    const ageSeconds = Math.max(
      0,
      (Date.now() - recorded) / 1000
    );

    if (ageSeconds <= 30) return "LIVE";
    if (ageSeconds <= 60) return "UNSTABLE";
    return "OFFLINE";
  };

  const connectionStatus = getConnectionStatus();

  const getConnectionLabel = () => {
    if (connectionStatus === "LIVE") {
      return "● LIVE";
    }

    if (connectionStatus === "UNSTABLE") {
      return "● CONNECTION UNSTABLE";
    }

    return "● DRIVER OFFLINE";
  };

  const getConnectionClass = () => {
    if (connectionStatus === "LIVE") return "live";
    if (connectionStatus === "UNSTABLE") return "unstable";
    return "offline";
  };

  const trackingSourceLabel =
    location?.trackingSource === "GPS_DEVICE"
      ? "GPS Device"
      : "Phone / Map";

  const trackingTarget =
    booking?.bookingStatus === "ON_RIDE"
      ? "Tracking trip to destination"
      : "Tracking driver to your pickup location";

  return (
    <>
      <style>{`
        .track-page {
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }
        .track-page h1 { margin: 0 0 6px; color: #0b2946; font-size: 28px; }
        .track-page > p { margin: 0 0 23px; color: #7b8794; font-size: 12px; }
        .track-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }
        .track-card {
          background: white; border: 1px solid #e2e7ec;
          border-radius: 10px; padding: 22px;
        }
        .track-card h2 { margin: 0 0 17px; color: #0b2946; font-size: 17px; }
        .live-heading {
          display:flex; align-items:center; justify-content:space-between;
          gap:12px; margin-bottom:14px;
        }
        .live-badge {
          padding:6px 10px;
          border-radius:20px;
          font-size:9px;
          font-weight:700;
          white-space:nowrap;
        }

        .live-badge.live {
          background:#e7f7ec;
          color:#18763a;
        }

        .live-badge.unstable {
          background:#fff3cd;
          color:#806400;
        }

        .live-badge.offline {
          background:#fde8e8;
          color:#a43c3c;
        }
        .real-map {
          height: 460px; width: 100%; border: 1px solid #e1e7eb;
          border-radius: 9px; overflow: hidden; background:#f8fafc;
          position:relative;
        }
        .leaflet-map { width:100%; height:100%; }
        .map-unavailable {
          height:460px; display:flex; align-items:center; justify-content:center;
          text-align:center; color:#63717d; font-size:11px; line-height:1.7;
        }
        .custom-map-marker { background:transparent !important; border:none !important; }
        .custom-map-marker div {
          width:38px; height:38px; display:flex; align-items:center;
          justify-content:center; background:white; border-radius:50%;
          box-shadow:0 3px 12px rgba(0,0,0,.25); font-size:23px;
        }
        .driver-marker div { border:3px solid #f4c430; }
        .pickup-marker div { border:3px solid #0b2946; }
        .destination-marker div { border:3px solid #29935a; }
        .map-status-banner {
          margin-top:12px;
          padding:11px 13px;
          border-radius:7px;
          font-size:10px;
          line-height:1.6;
        }

        .map-status-banner.live {
          background:#e7f7ec;
          color:#18763a;
        }

        .map-status-banner.unstable {
          background:#fff3cd;
          color:#806400;
        }

        .map-status-banner.offline {
          background:#fde8e8;
          color:#a43c3c;
        }

        .map-legend {
          display:flex; flex-wrap:wrap; gap:10px; margin-top:12px;
        }
        .legend-item {
          padding:8px 11px; background:#f8fafc; border:1px solid #e7ebef;
          border-radius:6px; color:#53616e; font-size:10px;
        }
        .route-summary {
          margin-top:12px; padding:12px 14px; border-radius:7px;
          background:#fff8dc; color:#67591e; font-size:10px; line-height:1.6;
        }
        .track-row {
          display:flex; justify-content:space-between; gap:15px;
          padding:10px 0; border-bottom:1px solid #edf0f3;
        }
        .track-row span { color:#89949e; font-size:10px; }
        .track-row strong { color:#0b2946; font-size:11px; text-align:right; }
        .tracking-status {
          display:inline-block; margin-bottom:15px; padding:6px 10px;
          border-radius:20px; font-size:9px; font-weight:700;
        }
        .tracking-status.accepted { background:#e3effc; color:#24649f; }
        .tracking-status.arriving { background:#fff3cd; color:#806400; }
        .tracking-status.onride,.tracking-status.completed {
          background:#e3f6e7; color:#18763a;
        }
        .tracking-status.waiting { background:#edf0f3; color:#53616e; }
        .tracking-note {
          margin-top:16px; padding:13px; background:#eef6ff;
          border-radius:7px; color:#60758a; font-size:10px; line-height:1.6;
        }
        .tracking-error {
          padding:18px; background:#fff1f1; border:1px solid #efc8c8;
          border-radius:8px; color:#a43c3c; font-size:11px; line-height:1.6;
        }
        .tracking-loading {
          padding:30px; text-align:center; color:#7b8794; font-size:11px;
        }
        .tracking-refresh {
          margin-top:13px; width:100%; padding:10px; border:none;
          border-radius:6px; background:#0b2946; color:white;
          font-size:9px; font-weight:700; cursor:pointer;
        }
        .tracking-refresh:hover { background:#153b5e; }
        @media(max-width:850px) {
          .track-grid { grid-template-columns:1fr; }
          .track-page { padding:20px; }
        }
      `}</style>

      <main className="track-page">
        <h1>Track Booking</h1>
        <p>
          Live tracking uses the driver's GPS and the pickup/destination
          selected for this booking.
        </p>

        {loading ? (
          <div className="track-card">
            <div className="tracking-loading">Loading your active booking...</div>
          </div>
        ) : error && !booking ? (
          <div className="tracking-error">{error}</div>
        ) : booking ? (
          <div className="track-grid">
            <section className="track-card">
              <div className="live-heading">
                <h2 style={{ margin: 0 }}>Live Driver Tracking</h2>
                <span
                  className={`live-badge ${getConnectionClass()}`}
                >
                  {getConnectionLabel()}
                </span>
              </div>

              <div className="real-map">
                {mapReady ? (
                  <div ref={mapContainerRef} className="leaflet-map" />
                ) : (
                  <div className="map-unavailable">Loading live map...</div>
                )}
              </div>

              <div
                className={`map-status-banner ${getConnectionClass()}`}
              >
                {connectionStatus === "LIVE" && (
                  <>
                    Driver location is updating normally from{" "}
                    <strong>{trackingSourceLabel}</strong>.
                  </>
                )}

                {connectionStatus === "UNSTABLE" && (
                  <>
                    Driver connection is unstable. The map is showing the
                    latest received location and will update automatically
                    when a new location arrives.
                  </>
                )}

                {connectionStatus === "OFFLINE" && (
                  <>
                    Driver is currently offline or location updates have
                    stopped. The marker below shows the{" "}
                    <strong>last known location</strong>.
                  </>
                )}
              </div>

              <div className="map-legend">
                <div className="legend-item">🚕 Driver</div>
                <div className="legend-item">📍 Your Pickup</div>
                <div className="legend-item">🏁 Destination</div>
              </div>

              <div className="route-summary">
                <strong>{trackingTarget}</strong>
                <br />
                {booking.pickupLocation} → {booking.destination}

                {routeInfo && (
                  <>
                    <br />
                    <strong>Road Distance:</strong>{" "}
                    {(routeInfo.distanceMeters / 1000).toFixed(1)} km
                    {"  •  "}
                    <strong>Estimated Time:</strong>{" "}
                    {Math.max(1, Math.round(routeInfo.durationSeconds / 60))} min
                  </>
                )}

                {routeError && (
                  <>
                    <br />
                    <span>Road route update unavailable: {routeError}</span>
                  </>
                )}
              </div>

              {!location && (
                <div className="tracking-note">
                  Driver GPS location is not available yet. The driver marker
                  will appear automatically when the assigned driver starts
                  sharing location.
                </div>
              )}
            </section>

            <aside className="track-card">
              <h2>Booking Details</h2>

              <span
                className={`tracking-status ${getStatusClass(
                  booking.bookingStatus
                )}`}
              >
                ● {formatStatus(booking.bookingStatus)}
              </span>

              <div className="track-row">
                <span>Booking ID</span>
                <strong>#{booking.bookingId}</strong>
              </div>

              <div className="track-row">
                <span>Driver</span>
                <strong>
                  {booking.assignedDriverId
                    ? `Driver #${booking.assignedDriverId}`
                    : "Assigned Driver"}
                </strong>
              </div>

              <div className="track-row">
                <span>Vehicle</span>
                <strong>{vehicleType?.typeName || "—"}</strong>
              </div>

              <div className="track-row">
                <span>Registration</span>
                <strong>
                  {booking.assignedVehicleId
                    ? `Vehicle #${booking.assignedVehicleId}`
                    : "—"}
                </strong>
              </div>

              <div className="track-row">
                <span>Pickup</span>
                <strong>{booking.pickupLocation}</strong>
              </div>

              <div className="track-row">
                <span>Destination</span>
                <strong>{booking.destination}</strong>
              </div>

              <div className="track-row">
                <span>Tracking Status</span>
                <strong>
                  {connectionStatus === "LIVE"
                    ? "Live"
                    : connectionStatus === "UNSTABLE"
                    ? "Connection Unstable"
                    : "Driver Offline"}
                </strong>
              </div>

              <div className="track-row">
                <span>Tracking Method</span>
                <strong>
                  {location ? trackingSourceLabel : "Waiting for Location"}
                </strong>
              </div>

              {location && (
                <div className="track-row">
                  <span>Last Location</span>
                  <strong>
                    {location.recordedAt
                      ? new Date(location.recordedAt).toLocaleString()
                      : lastUpdated
                      ? lastUpdated.toLocaleString()
                      : "—"}
                  </strong>
                </div>
              )}

              <div className="tracking-note">
                The latest driver location is checked automatically every
                5 seconds. If the driver's mobile data/Wi-Fi is unavailable,
                the system keeps the last known location and shows the driver
                as Offline until new location updates are received.
              </div>

              <button
                type="button"
                className="tracking-refresh"
                onClick={() => loadTrackingData(false)}
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
