import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE_URL = "http://localhost:5171/api";
const MMC_NAME = "Makumbura Multimodal Center";
const SRI_LANKA_CENTER = [7.8731, 80.7718];

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapEvents({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MoveMap({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) map.setView(position, 15);
  }, [map, position]);

  return null;
}

function LocationMap({ position, onSelect, onDragEnd }) {
  const markerRef = useRef(null);

  return (
    <MapContainer
      center={position || SRI_LANKA_CENTER}
      zoom={position ? 15 : 8}
      scrollWheelZoom
      className="location-map"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEvents onSelect={onSelect} />
      <MoveMap position={position} />
      {position && (
        <Marker
          position={position}
          icon={markerIcon}
          draggable
          ref={markerRef}
          eventHandlers={{
            dragend() {
              const marker = markerRef.current;
              if (!marker) return;
              const point = marker.getLatLng();
              onDragEnd(point.lat, point.lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}

function BookTaxi() {
  const [formData, setFormData] = useState({
    tripDirection: "MMC_TO_OTHER",
    operationalAreaId: "",
    pickup: MMC_NAME,
    destination: "",
    vehicleTypeId: "",
    bookingMode: "NOW",
    date: "",
    time: "",
  });

  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [operationalAreas, setOperationalAreas] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  // Location autocomplete helpers
  const autocompleteAbortRef = useRef(null);
  const skipAutocompleteRef = useRef(false);

  const getStoredUser = () => {
    try {
      const value = localStorage.getItem("user") || sessionStorage.getItem("user");
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  };

  const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token") || "";

  const user = getStoredUser();

  useEffect(() => {
    const loadVehicleTypes = async () => {
      try {
        setLoadingVehicles(true);
        const response = await fetch(`${API_BASE_URL}/vehicletypes`);
        if (!response.ok) throw new Error("Unable to load vehicle types.");
        const data = await response.json();
        const active = data.filter((v) => v.status === "ACTIVE");
        setVehicleTypes(active);
        if (active.length > 0) {
          setFormData((p) => ({
            ...p,
            vehicleTypeId: p.vehicleTypeId || String(active[0].vehicleTypeId),
          }));
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load vehicle types. Please make sure the backend is running.");
      } finally {
        setLoadingVehicles(false);
      }
    };
    loadVehicleTypes();
  }, []);

  useEffect(() => {
    const loadAreas = async () => {
      try {
        setLoadingAreas(true);
        const response = await fetch(`${API_BASE_URL}/OperationalAreas`);
        if (!response.ok) throw new Error("Unable to load operational areas.");
        const data = await response.json();
        setOperationalAreas(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Unable to load operational areas. Please make sure the backend is running.");
      } finally {
        setLoadingAreas(false);
      }
    };
    loadAreas();
  }, []);

  const selectedArea = operationalAreas.find(
    (area) => Number(area.operationalAreaId) === Number(formData.operationalAreaId)
  );

  const resetMapSelection = () => {
    if (autocompleteAbortRef.current) {
      autocompleteAbortRef.current.abort();
      autocompleteAbortRef.current = null;
    }

    skipAutocompleteRef.current = true;
    setSelectedLocation(null);
    setSelectedAddress("");
    setLocationConfirmed(false);
    setSearchText("");
    setSearchResults([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const changeDirection = (direction) => {
    setError("");
    setConfirmation(null);
    resetMapSelection();
    setFormData((p) => ({
      ...p,
      tripDirection: direction,
      operationalAreaId: "",
      pickup: direction === "MMC_TO_OTHER" ? MMC_NAME : "",
      destination: direction === "OTHER_TO_MMC" ? MMC_NAME : "",
    }));
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`
      );
      if (!response.ok) throw new Error("Reverse geocoding failed.");
      const data = await response.json();
      return data.display_name || `Selected location (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    } catch {
      return `Selected location (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    }
  };

  const selectLocation = async (latValue, lngValue, knownAddress = "") => {
    const lat = Number(latValue);
    const lng = Number(lngValue);
    setError("");
    setLocationConfirmed(false);
    setSelectedLocation({ lat, lng });
    const address = knownAddress || (await reverseGeocode(lat, lng));
    setSelectedAddress(address);
    skipAutocompleteRef.current = true;
    setSearchText(address);
    setSearchResults([]);
  };

  const confirmSelectedLocation = () => {
    if (!selectedLocation || !selectedAddress) {
      setError("Please search or select an exact point on the map first.");
      return;
    }
    setError("");
    setLocationConfirmed(true);
    setFormData((p) => ({
      ...p,
      pickup: p.tripDirection === "OTHER_TO_MMC" ? selectedAddress : MMC_NAME,
      destination: p.tripDirection === "MMC_TO_OTHER" ? selectedAddress : MMC_NAME,
    }));
  };

  const formatPhotonAddress = (feature) => {
    const p = feature?.properties || {};

    const parts = [
      p.name,
      p.street,
      p.locality,
      p.district,
      p.city,
      p.county,
      p.state,
      p.postcode,
      p.country,
    ].filter(Boolean);

    return [...new Set(parts)].join(", ");
  };

  const fetchLocationSuggestions = async (
    term,
    { showErrors = false, signal } = {}
  ) => {
    const value = term.trim();

    if (value.length < 2) {
      setSearchResults([]);
      if (showErrors) {
        setError("Please enter at least 2 letters to search.");
      }
      return [];
    }

    if (
      formData.tripDirection === "OTHER_TO_MMC" &&
      !formData.operationalAreaId
    ) {
      setSearchResults([]);
      if (showErrors) {
        setError("Please select an operational area first.");
      }
      return [];
    }

    try {
      if (showErrors) setError("");
      setSearching(true);
      setLocationConfirmed(false);

      const query =
        formData.tripDirection === "OTHER_TO_MMC" && selectedArea
          ? `${value} ${selectedArea.areaName}`
          : value;

      // Photon supports search-as-you-type. Restrict results to Sri Lanka.
      const url =
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}` +
        `&limit=7&lang=en&countrycode=LK`;

      const response = await fetch(url, { signal });

      if (!response.ok) {
        throw new Error("Location search failed.");
      }

      const data = await response.json();
      const features = Array.isArray(data?.features) ? data.features : [];

      const results = features
        .filter(
          (feature) =>
            Array.isArray(feature?.geometry?.coordinates) &&
            feature.geometry.coordinates.length >= 2
        )
        .map((feature, index) => {
          const [lon, lat] = feature.geometry.coordinates;

          return {
            place_id:
              feature?.properties?.osm_id ||
              `${lat}-${lon}-${index}`,
            lat: String(lat),
            lon: String(lon),
            display_name:
              formatPhotonAddress(feature) ||
              `Selected location (${Number(lat).toFixed(6)}, ${Number(lon).toFixed(6)})`,
          };
        });

      setSearchResults(results);

      if (showErrors && results.length === 0) {
        setError(
          "No matching location found. Try another name or click the exact point on the map."
        );
      }

      return results;
    } catch (err) {
      if (err?.name === "AbortError") return [];

      setSearchResults([]);

      if (showErrors) {
        setError(
          "Location search failed. You can still click the exact point on the map."
        );
      }

      return [];
    } finally {
      if (!signal?.aborted) {
        setSearching(false);
      }
    }
  };

  const searchLocation = async () => {
    if (autocompleteAbortRef.current) {
      autocompleteAbortRef.current.abort();
    }

    const controller = new AbortController();
    autocompleteAbortRef.current = controller;

    await fetchLocationSuggestions(searchText, {
      showErrors: true,
      signal: controller.signal,
    });
  };

  // Search automatically after 2+ typed characters.
  // Debounce prevents a request for every keystroke.
  useEffect(() => {
    if (skipAutocompleteRef.current) {
      skipAutocompleteRef.current = false;
      return;
    }

    const value = searchText.trim();

    if (value.length < 2) {
      if (autocompleteAbortRef.current) {
        autocompleteAbortRef.current.abort();
        autocompleteAbortRef.current = null;
      }

      setSearchResults([]);
      setSearching(false);
      return;
    }

    if (
      formData.tripDirection === "OTHER_TO_MMC" &&
      !formData.operationalAreaId
    ) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      if (autocompleteAbortRef.current) {
        autocompleteAbortRef.current.abort();
      }

      const controller = new AbortController();
      autocompleteAbortRef.current = controller;

      await fetchLocationSuggestions(value, {
        showErrors: false,
        signal: controller.signal,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [
    searchText,
    formData.tripDirection,
    formData.operationalAreaId,
    selectedArea?.areaName,
  ]);


  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Current location is not supported by this browser.");
      return;
    }

    setError("");
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await selectLocation(position.coords.latitude, position.coords.longitude);
        setLocating(false);
      },
      () => {
        setError("Unable to access your current location. Please allow location permission or select a point on the map.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const getCurrentBookingDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}:${seconds}`,
      displayTime: `${hours}:${minutes}`,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setConfirmation(null);

    const token = getToken();
    if (!token) return setError("Please login to your passenger account before creating a booking.");
    if (!formData.vehicleTypeId) return setError("Please select a vehicle type.");
    if (formData.tripDirection === "OTHER_TO_MMC" && !formData.operationalAreaId)
      return setError("Please select an operational area.");
    if (!selectedLocation || !locationConfirmed)
      return setError(
        formData.tripDirection === "MMC_TO_OTHER"
          ? "Please select and confirm the exact destination."
          : "Please select and confirm the exact pickup location."
      );
    if (
      formData.bookingMode === "SCHEDULE" &&
      (!formData.date || !formData.time)
    )
      return setError("Please select the booking date and time.");

    setLoading(true);

    try {
      const outward = formData.tripDirection === "MMC_TO_OTHER";
      const currentDateTime = getCurrentBookingDateTime();

      const bookingDate =
        formData.bookingMode === "NOW"
          ? currentDateTime.date
          : formData.date;

      const bookingTime =
        formData.bookingMode === "NOW"
          ? currentDateTime.time
          : `${formData.time}:00`;

      const bookingData = {
        tripDirection: formData.tripDirection,
        operationalAreaId: outward ? null : Number(formData.operationalAreaId),
        pickupLocation: formData.pickup.trim(),
        pickupLatitude: outward ? null : selectedLocation.lat,
        pickupLongitude: outward ? null : selectedLocation.lng,
        destination: formData.destination.trim(),
        destinationLatitude: outward ? selectedLocation.lat : null,
        destinationLongitude: outward ? selectedLocation.lng : null,
        bookingDate,
        bookingTime,
        vehicleTypeId: Number(formData.vehicleTypeId),
      };

      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      let data = null;
      try { data = await response.json(); } catch {}
      if (!response.ok)
        throw new Error(data?.message || data?.title || "Unable to create booking.");

      const vehicle = vehicleTypes.find(
        (item) => item.vehicleTypeId === Number(formData.vehicleTypeId)
      );
      const created = data?.booking || data || {};

      setConfirmation({
        id: created.bookingId || created.BookingId || "Created",
        direction: formData.tripDirection,
        area: outward ? "" : selectedArea?.areaName || "",
        vehicle: vehicle?.typeName || "Selected Vehicle",
        pickup: formData.pickup,
        destination: formData.destination,
        bookingMode: formData.bookingMode,
        date: bookingDate,
        time:
          formData.bookingMode === "NOW"
            ? currentDateTime.displayTime
            : formData.time,
        status: created.bookingStatus || created.BookingStatus || "PENDING",
      });

      resetMapSelection();
      setFormData((p) => ({
        ...p,
        operationalAreaId: "",
        pickup: p.tripDirection === "MMC_TO_OTHER" ? MMC_NAME : "",
        destination: p.tripDirection === "OTHER_TO_MMC" ? MMC_NAME : "",
        date: "",
        time: "",
      }));
    } catch (err) {
      setError(err.message || "Unable to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status) =>
    status
      ? status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
      : "";

  const vehicleIcon = (name = "") => {
    const value = name.toLowerCase();
    if (value === "car") return "🚗";
    if (value === "three-wheeler" || value === "three wheeler") return "🛺";
    if (value === "bike") return "🏍️";
    return "🚕";
  };

  return (
    <>
      <style>{`
        .book-taxi-page{min-height:100vh;padding:30px;background:#f4f7fa;font-family:Arial,Helvetica,sans-serif}
        .book-taxi-page h1{margin:0 0 6px;color:#0b2946;font-size:28px}.subtitle{margin:0 0 23px;color:#7b8794;font-size:12px}
        .container{display:grid;grid-template-columns:1.4fr 1fr;gap:20px;align-items:start}.card{background:#fff;border:1px solid #e2e7ec;border-radius:10px;padding:23px}.card h2{margin:0 0 18px;color:#0b2946;font-size:17px}
        .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.field{display:flex;flex-direction:column}.full{grid-column:1/-1}
        .field label{margin-bottom:6px;color:#0b2946;font-size:10px;font-weight:700}.field input,.field select,.search-row input{width:100%;padding:11px 12px;border:1px solid #d9e0e6;border-radius:6px;outline:none;font-size:11px;color:#53616e;background:#fff;box-sizing:border-box}.readonly{background:#f5f7f9!important}
        .directions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.direction{border:1px solid #dce3e9;background:#f8fafc;border-radius:8px;padding:13px;text-align:left;cursor:pointer;color:#0b2946}.direction strong{display:block;font-size:11px;margin-bottom:4px}.direction span{font-size:9px;color:#7a8792}.direction.active{border-color:#f6c20d;background:#fff9dc}
        .booking-mode-wrap{grid-column:1/-1}.booking-modes{display:grid;grid-template-columns:1fr 1fr;gap:10px}.booking-mode{border:1px solid #dce3e9;background:#f8fafc;border-radius:8px;padding:13px;text-align:left;cursor:pointer;color:#0b2946}.booking-mode strong{display:block;font-size:11px;margin-bottom:4px}.booking-mode span{font-size:9px;color:#7a8792;line-height:1.45}.booking-mode.active{border-color:#f6c20d;background:#fff9dc}.now-note{margin-top:9px;padding:10px 12px;border-radius:7px;background:#eef6ff;color:#536f86;font-size:9px;line-height:1.5}
        .picker{grid-column:1/-1;border:1px solid #e1e7ec;border-radius:9px;padding:14px;background:#fbfcfd}.picker-title{margin:0 0 5px;color:#0b2946;font-size:11px;font-weight:800}.picker-help{margin:0 0 10px;color:#7a8792;font-size:9px;line-height:1.5}
        .search-row{display:grid;grid-template-columns:1fr auto;gap:8px;margin-bottom:9px}.search-btn,.current-btn,.confirm-location-btn{border:0;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer}.search-btn{padding:0 15px;background:#0b2946;color:#fff}.current-btn{width:100%;padding:10px 12px;margin-bottom:10px;background:#eef6ff;border:1px solid #d7e9f8;color:#0b2946}.search-btn:disabled,.current-btn:disabled,.confirm-location-btn:disabled{opacity:.55;cursor:not-allowed}
        .results{margin-bottom:10px;border:1px solid #e0e6eb;border-radius:7px;overflow:hidden;background:#fff}.result{display:block;width:100%;border:0;border-bottom:1px solid #edf0f2;padding:10px 11px;background:#fff;text-align:left;color:#53616e;font-size:9px;line-height:1.45;cursor:pointer}.result:hover{background:#fff9dc}
        .location-map{height:310px;width:100%;border-radius:8px;border:1px solid #dfe5ea;z-index:1}.selected-card{margin-top:10px;padding:12px;border:1px solid #dbe5ec;border-radius:7px;background:#fff}.selected-card strong{display:block;margin-bottom:5px;color:#0b2946;font-size:10px}.selected-card p{margin:0 0 7px;color:#667786;font-size:9px;line-height:1.5}.selected-card small{color:#8a98a5;font-size:8px}.confirm-location-btn{width:100%;margin-top:10px;padding:11px 12px;background:#f6c20d;color:#0b2946}.confirmed-badge{margin-top:8px;padding:8px 10px;border-radius:6px;background:#eaf7ed;color:#18763a;font-size:9px;font-weight:700;text-align:center}
        .submit{width:100%;margin-top:20px;border:0;padding:12px;border-radius:6px;background:#f6c20d;color:#0b2946;font-size:11px;font-weight:800;cursor:pointer}.submit:disabled{opacity:.65}.user{margin-bottom:18px;padding:12px 14px;background:#f8fafc;border:1px solid #e4e9ed;border-radius:7px}.user strong{display:block;color:#0b2946;font-size:11px}.user span{color:#7a8792;font-size:9px}.error{margin-bottom:18px;padding:12px 14px;background:#fff1f1;border:1px solid #efc6c6;border-radius:7px;color:#a43b3b;font-size:10px}
        .vehicle{padding:14px;margin-bottom:10px;background:#f8fafc;border:1px solid #e4e9ed;border-radius:8px}.vehicle strong{color:#0b2946;font-size:11px}.vehicle p{margin:5px 0 0;color:#7a8792;font-size:9px}.note{margin-top:17px;padding:13px;background:#eef6ff;border-radius:7px;color:#60758a;font-size:10px;line-height:1.6}.confirm{margin-top:20px;padding:18px;background:#eaf7ed;border:1px solid #cce8d2;border-radius:9px}.confirm h3{margin:0 0 10px;color:#18763a;font-size:14px}.confirm p{margin:6px 0;color:#53616e;font-size:10px}
        @media(max-width:850px){.container,.grid,.directions,.booking-modes{grid-template-columns:1fr}.full,.picker,.booking-mode-wrap{grid-column:auto}.book-taxi-page{padding:20px}}
      `}</style>

      <main className="book-taxi-page">
        <h1>Book a Taxi</h1>
        <p className="subtitle">Choose your trip direction, exact location and vehicle.</p>

        <div className="container">
          <section className="card">
            <h2>Journey Details</h2>

            {user && (
              <div className="user">
                <strong>{user.fullName}</strong>
                <span>{user.phone} • {user.email}</span>
              </div>
            )}

            {error && <div className="error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="grid">
                <div className="field full">
                  <label>Trip Direction</label>
                  <div className="directions">
                    <button type="button" className={`direction ${formData.tripDirection === "MMC_TO_OTHER" ? "active" : ""}`} onClick={() => changeDirection("MMC_TO_OTHER")}>
                      <strong>Makumbura → Other Location</strong>
                      <span>Select any exact destination.</span>
                    </button>
                    <button type="button" className={`direction ${formData.tripDirection === "OTHER_TO_MMC" ? "active" : ""}`} onClick={() => changeDirection("OTHER_TO_MMC")}>
                      <strong>Other Location → Makumbura</strong>
                      <span>Select operational area and exact pickup.</span>
                    </button>
                  </div>
                </div>

                {formData.tripDirection === "MMC_TO_OTHER" && (
                  <div className="field full">
                    <label>Pickup Location</label>
                    <input className="readonly" value={MMC_NAME} readOnly />
                  </div>
                )}

                {formData.tripDirection === "OTHER_TO_MMC" && (
                  <>
                    <div className="field full">
                      <label>Destination</label>
                      <input className="readonly" value={MMC_NAME} readOnly />
                    </div>

                    <div className="field full">
                      <label>Pickup Location (Operational Area)</label>
                      <select
                        value={formData.operationalAreaId}
                        disabled={loadingAreas}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData((p) => ({ ...p, operationalAreaId: value, pickup: "", destination: MMC_NAME }));
                          resetMapSelection();
                        }}
                        required
                      >
                        <option value="">{loadingAreas ? "Loading operational areas..." : "Select operational area"}</option>
                        {operationalAreas.map((area) => (
                          <option key={area.operationalAreaId} value={area.operationalAreaId}>{area.areaName}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="picker">
                  <p className="picker-title">
                    {formData.tripDirection === "MMC_TO_OTHER" ? "Destination" : "Exact Pickup Location"}
                  </p>
                  <p className="picker-help">
                    Type at least 2 letters to see location suggestions automatically. You can also use your current location or click the exact point on the map.
                  </p>

                  <div className="search-row">
                    <input
                      value={searchText}
                      onChange={(e) => {
                        skipAutocompleteRef.current = false;
                        setSearchText(e.target.value);
                        setLocationConfirmed(false);
                        setError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          searchLocation();
                        }
                      }}
                      placeholder={
                        formData.tripDirection === "OTHER_TO_MMC" && selectedArea
                          ? `Type 2+ letters for exact pickup near ${selectedArea.areaName}`
                          : "Type 2+ letters for destination"
                      }
                      autoComplete="off"
                      disabled={
                        formData.tripDirection === "OTHER_TO_MMC" &&
                        !formData.operationalAreaId
                      }
                    />
                    <button
                      type="button"
                      className="search-btn"
                      onClick={searchLocation}
                      disabled={
                        searching ||
                        searchText.trim().length < 2 ||
                        (formData.tripDirection === "OTHER_TO_MMC" &&
                          !formData.operationalAreaId)
                      }
                    >
                      {searching ? "Searching..." : "Search"}
                    </button>
                  </div>

                  {searchText.trim().length === 1 && (
                    <div style={{ margin: "-3px 0 9px", color: "#7a8792", fontSize: "9px" }}>
                      Type one more letter to see location suggestions.
                    </div>
                  )}

                  <button
                    type="button"
                    className="current-btn"
                    onClick={useCurrentLocation}
                    disabled={locating || (formData.tripDirection === "OTHER_TO_MMC" && !formData.operationalAreaId)}
                  >
                    {locating ? "Getting Current Location..." : "📍 Use Current Location"}
                  </button>

                  {searchResults.length > 0 && (
                    <div className="results">
                      {searchResults.map((result) => (
                        <button type="button" className="result" key={result.place_id} onClick={() => selectLocation(result.lat, result.lon, result.display_name)}>
                          {result.display_name}
                        </button>
                      ))}
                    </div>
                  )}

                  <LocationMap
                    position={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : null}
                    onSelect={selectLocation}
                    onDragEnd={selectLocation}
                  />

                  {selectedLocation && (
                    <div className="selected-card">
                      <strong>
                        Selected {formData.tripDirection === "MMC_TO_OTHER" ? "Destination" : "Pickup Location"}
                      </strong>
                      <p>{selectedAddress || "Selected map point"}</p>
                      <small>
                        Latitude: {selectedLocation.lat.toFixed(6)} • Longitude: {selectedLocation.lng.toFixed(6)}
                      </small>
                      <button type="button" className="confirm-location-btn" onClick={confirmSelectedLocation}>
                        ✓ Confirm Location
                      </button>
                      {locationConfirmed && <div className="confirmed-badge">Location Confirmed</div>}
                    </div>
                  )}
                </div>

                <div className="field">
                  <label>Vehicle Type</label>
                  <select name="vehicleTypeId" value={formData.vehicleTypeId} onChange={handleChange} required disabled={loadingVehicles}>
                    {loadingVehicles ? (
                      <option value="">Loading vehicle types...</option>
                    ) : (
                      vehicleTypes.map((vehicle) => (
                        <option key={vehicle.vehicleTypeId} value={vehicle.vehicleTypeId}>{vehicle.typeName}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="booking-mode-wrap">
                  <div className="field">
                    <label>Booking Type</label>
                  </div>

                  <div className="booking-modes">
                    <button
                      type="button"
                      className={`booking-mode ${formData.bookingMode === "NOW" ? "active" : ""}`}
                      onClick={() => {
                        setError("");
                        setFormData((p) => ({
                          ...p,
                          bookingMode: "NOW",
                          date: "",
                          time: "",
                        }));
                      }}
                    >
                      <strong>⚡ Book Now</strong>
                      <span>Request a taxi immediately. Date and time are selected automatically.</span>
                    </button>

                    <button
                      type="button"
                      className={`booking-mode ${formData.bookingMode === "SCHEDULE" ? "active" : ""}`}
                      onClick={() => {
                        setError("");
                        setFormData((p) => ({
                          ...p,
                          bookingMode: "SCHEDULE",
                        }));
                      }}
                    >
                      <strong>🗓 Schedule for Later</strong>
                      <span>Choose a future date and time for your taxi request.</span>
                    </button>
                  </div>

                  {formData.bookingMode === "NOW" && (
                    <div className="now-note">
                      Current date and time will be captured automatically when the booking is submitted.
                    </div>
                  )}
                </div>

                {formData.bookingMode === "SCHEDULE" && (
                  <>
                    <div className="field">
                      <label>Date</label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>

                    <div className="field">
                      <label>Time</label>
                      <input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </>
                )}
              </div>

              <button className="submit" type="submit" disabled={loading || loadingVehicles || vehicleTypes.length === 0}>
                {loading
                  ? "Creating Booking..."
                  : formData.bookingMode === "NOW"
                  ? "Book Now"
                  : "Schedule Taxi"}
              </button>
            </form>

            {confirmation && (
              <div className="confirm">
                <h3>✓ Booking Request Created</h3>
                <p><strong>Booking:</strong> #{confirmation.id}</p>
                <p><strong>Direction:</strong> {confirmation.direction === "MMC_TO_OTHER" ? "Makumbura → Other Location" : "Other Location → Makumbura"}</p>
                {confirmation.area && <p><strong>Operational Area:</strong> {confirmation.area}</p>}
                <p>
                  <strong>Booking Type:</strong>{" "}
                  {confirmation.bookingMode === "NOW" ? "Book Now" : "Scheduled for Later"}
                </p>
                <p><strong>Vehicle:</strong> {confirmation.vehicle}</p>
                <p><strong>Pickup:</strong> {confirmation.pickup}</p>
                <p><strong>Destination:</strong> {confirmation.destination}</p>
                <p><strong>Date:</strong> {confirmation.date}</p>
                <p><strong>Time:</strong> {confirmation.time}</p>
                <p><strong>Status:</strong> {formatStatus(confirmation.status)}</p>
              </div>
            )}
          </section>

          <aside className="card">
            <h2>Vehicle Options</h2>
            {loadingVehicles ? (
              <div className="note">Loading vehicle types...</div>
            ) : (
              vehicleTypes.map((vehicle) => (
                <div className="vehicle" key={vehicle.vehicleTypeId}>
                  <strong>{vehicleIcon(vehicle.typeName)} {vehicle.typeName}</strong>
                  <p>{vehicle.description || "Available vehicle option for your journey."}</p>
                  <p>Passenger capacity: {vehicle.passengerCapacity}</p>
                </div>
              ))
            )}
            <div className="note">
              Start typing at least 2 letters to get location suggestions, or use your current location/map. Confirm the exact location before requesting the taxi.
            </div>
            <div className="note">
              Your request will be processed through Makumbura Taxi Operations. Tracking becomes available after a driver accepts the booking.
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

export default BookTaxi;
