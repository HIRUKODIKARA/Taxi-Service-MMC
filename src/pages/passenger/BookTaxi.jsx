import { useEffect, useState } from "react";

function BookTaxi() {
  const [formData, setFormData] = useState({
    pickup: "Makumbura Multimodal Center",
    destination: "",
    vehicleTypeId: "",
    date: "",
    time: "",
  });

  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [confirmation, setConfirmation] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [error, setError] = useState("");

  const getStoredUser = () => {
    const localUser = localStorage.getItem("user");
    const sessionUser = sessionStorage.getItem("user");

    try {
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

  const user = getStoredUser();
  const API_BASE_URL = "http://localhost:5171/api";

  useEffect(() => {
    const loadVehicleTypes = async () => {
      try {
        setLoadingVehicles(true);

        const response = await fetch(
          `${API_BASE_URL}/vehicletypes`
        );

        if (!response.ok) {
          throw new Error("Unable to load vehicle types.");
        }

        const data = await response.json();

        const activeVehicleTypes = data.filter(
          (vehicle) => vehicle.status === "ACTIVE"
        );

        setVehicleTypes(activeVehicleTypes);

        if (activeVehicleTypes.length > 0) {
          setFormData((previousData) => ({
            ...previousData,
            vehicleTypeId:
              previousData.vehicleTypeId ||
              String(activeVehicleTypes[0].vehicleTypeId),
          }));
        }
      } catch (err) {
        console.error("Vehicle type error:", err);

        setError(
          "Unable to load vehicle types. Please make sure the backend is running."
        );
      } finally {
        setLoadingVehicles(false);
      }
    };

    loadVehicleTypes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setConfirmation(null);

    const token = getToken();

    if (!token) {
      setError(
        "Please login to your passenger account before creating a booking."
      );
      return;
    }

    if (!formData.vehicleTypeId) {
      setError("Please select a vehicle type.");
      return;
    }

    if (
      !formData.destination.trim() ||
      !formData.date ||
      !formData.time
    ) {
      setError("Please complete all booking details.");
      return;
    }

    setLoading(true);

    try {
      const bookingData = {
        pickupLocation: formData.pickup.trim(),
        destination: formData.destination.trim(),
        bookingDate: formData.date,
        bookingTime: `${formData.time}:00`,
        vehicleTypeId: Number(formData.vehicleTypeId),
      };

      const response = await fetch(
        `${API_BASE_URL}/bookings`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(bookingData),
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
            "Unable to create booking."
        );
      }

      const selectedVehicle = vehicleTypes.find(
        (vehicle) =>
          vehicle.vehicleTypeId ===
          Number(formData.vehicleTypeId)
      );

      const createdBooking = data.booking || data;

      setConfirmation({
        id:
          createdBooking.bookingId ||
          createdBooking.BookingId ||
          "Created",

        vehicleType:
          selectedVehicle?.typeName || "Selected Vehicle",

        pickup: formData.pickup,
        destination: formData.destination,
        date: formData.date,
        time: formData.time,

        status:
          createdBooking.bookingStatus ||
          createdBooking.BookingStatus ||
          "PENDING",
      });

      setFormData((previousData) => ({
        ...previousData,
        destination: "",
        date: "",
        time: "",
      }));
    } catch (err) {
      console.error("Booking error:", err);

      setError(
        err.message ||
          "Unable to create booking. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status) => {
    if (!status) {
      return "";
    }

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const getVehicleDescription = (typeName) => {
    const name = typeName?.toLowerCase();

    if (name === "car") {
      return "Comfortable option for passengers and longer journeys.";
    }

    if (
      name === "three-wheeler" ||
      name === "three wheeler"
    ) {
      return "Convenient option for local and shorter journeys.";
    }

    if (name === "bike") {
      return "Quick option for a single passenger.";
    }

    return "Available vehicle option for your journey.";
  };

  const getVehicleIcon = (typeName) => {
    const name = typeName?.toLowerCase();

    if (name === "car") {
      return "🚗";
    }

    if (
      name === "three-wheeler" ||
      name === "three wheeler"
    ) {
      return "🛺";
    }

    if (name === "bike") {
      return "🏍️";
    }

    return "🚕";
  };

  return (
    <>
      <style>{`
        .book-taxi-page {
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .book-taxi-page h1 {
          margin: 0 0 6px;
          color: #0b2946;
          font-size: 28px;
        }

        .book-taxi-subtitle {
          margin: 0 0 23px;
          color: #7b8794;
          font-size: 12px;
        }

        .book-taxi-container {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 20px;
        }

        .book-taxi-card {
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 10px;
          padding: 23px;
        }

        .book-taxi-card h2 {
          margin: 0 0 18px;
          color: #0b2946;
          font-size: 17px;
        }

        .book-taxi-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .book-field {
          display: flex;
          flex-direction: column;
        }

        .book-field.full {
          grid-column: 1 / -1;
        }

        .book-field label {
          margin-bottom: 6px;
          color: #0b2946;
          font-size: 10px;
          font-weight: 700;
        }

        .book-field input,
        .book-field select {
          width: 100%;
          padding: 11px 12px;
          border: 1px solid #d9e0e6;
          border-radius: 6px;
          outline: none;
          font-size: 11px;
          color: #53616e;
          background: white;
          box-sizing: border-box;
        }

        .book-field input:focus,
        .book-field select:focus {
          border-color: #f6c20d;
          box-shadow: 0 0 0 3px rgba(246, 194, 13, 0.10);
        }

        .book-submit-btn {
          width: 100%;
          margin-top: 20px;
          border: none;
          padding: 12px;
          border-radius: 6px;
          background: #f6c20d;
          color: #0b2946;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .book-submit-btn:hover {
          background: #e3b300;
        }

        .book-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .vehicle-option-box {
          padding: 14px;
          margin-bottom: 10px;
          background: #f8fafc;
          border: 1px solid #e4e9ed;
          border-radius: 8px;
        }

        .vehicle-option-box strong {
          color: #0b2946;
          font-size: 11px;
        }

        .vehicle-option-box p {
          margin: 5px 0 0;
          color: #7a8792;
          font-size: 9px;
        }

        .booking-info-note {
          margin-top: 17px;
          padding: 13px;
          background: #eef6ff;
          border-radius: 7px;
          color: #60758a;
          font-size: 10px;
          line-height: 1.6;
        }

        .booking-user-info {
          margin-bottom: 18px;
          padding: 12px 14px;
          background: #f8fafc;
          border: 1px solid #e4e9ed;
          border-radius: 7px;
        }

        .booking-user-info strong {
          display: block;
          margin-bottom: 4px;
          color: #0b2946;
          font-size: 11px;
        }

        .booking-user-info span {
          color: #7a8792;
          font-size: 9px;
        }

        .book-error {
          margin-bottom: 18px;
          padding: 12px 14px;
          background: #fff1f1;
          border: 1px solid #efc6c6;
          border-radius: 7px;
          color: #a43b3b;
          font-size: 10px;
          line-height: 1.5;
        }

        .passenger-confirmation {
          margin-top: 20px;
          padding: 18px;
          background: #eaf7ed;
          border: 1px solid #cce8d2;
          border-radius: 9px;
        }

        .passenger-confirmation h3 {
          margin: 0 0 10px;
          color: #18763a;
          font-size: 14px;
        }

        .passenger-confirmation p {
          margin: 6px 0;
          color: #53616e;
          font-size: 10px;
        }

        .confirmation-id {
          display: inline-block;
          margin: 4px 0 7px;
          padding: 6px 10px;
          background: white;
          border-radius: 5px;
          color: #0b2946;
          font-size: 12px;
          font-weight: 800;
        }

        .vehicle-loading {
          padding: 14px;
          background: #f8fafc;
          border-radius: 7px;
          color: #7a8792;
          font-size: 10px;
        }

        @media(max-width: 850px) {
          .book-taxi-container,
          .book-taxi-grid {
            grid-template-columns: 1fr;
          }

          .book-field.full {
            grid-column: auto;
          }

          .book-taxi-page {
            padding: 20px;
          }
        }
      `}</style>

      <main className="book-taxi-page">
        <h1>Book a Taxi</h1>

        <p className="book-taxi-subtitle">
          Enter your journey details and select a suitable vehicle.
        </p>

        <div className="book-taxi-container">
          <section className="book-taxi-card">
            <h2>Journey Details</h2>

            {user && (
              <div className="booking-user-info">
                <strong>{user.fullName}</strong>

                <span>
                  {user.phone} • {user.email}
                </span>
              </div>
            )}

            {error && (
              <div className="book-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="book-taxi-grid">
                <div className="book-field full">
                  <label>Pickup Location</label>

                  <input
                    name="pickup"
                    value={formData.pickup}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="book-field full">
                  <label>Destination</label>

                  <input
                    name="destination"
                    placeholder="Enter destination"
                    value={formData.destination}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="book-field">
                  <label>Vehicle Type</label>

                  <select
                    name="vehicleTypeId"
                    value={formData.vehicleTypeId}
                    onChange={handleChange}
                    required
                    disabled={loadingVehicles}
                  >
                    {loadingVehicles ? (
                      <option value="">
                        Loading vehicle types...
                      </option>
                    ) : vehicleTypes.length === 0 ? (
                      <option value="">
                        No vehicle types available
                      </option>
                    ) : (
                      vehicleTypes.map((vehicle) => (
                        <option
                          key={vehicle.vehicleTypeId}
                          value={vehicle.vehicleTypeId}
                        >
                          {vehicle.typeName}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="book-field">
                  <label>Date</label>

                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="book-field">
                  <label>Time</label>

                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="book-submit-btn"
                disabled={
                  loading ||
                  loadingVehicles ||
                  vehicleTypes.length === 0
                }
              >
                {loading
                  ? "Creating Booking..."
                  : "Request Taxi"}
              </button>
            </form>

            {confirmation && (
              <div className="passenger-confirmation">
                <h3>✓ Booking Request Created</h3>

                <div className="confirmation-id">
                  Booking #{confirmation.id}
                </div>

                <p>
                  <strong>Vehicle:</strong>{" "}
                  {confirmation.vehicleType}
                </p>

                <p>
                  <strong>Pickup:</strong>{" "}
                  {confirmation.pickup}
                </p>

                <p>
                  <strong>Destination:</strong>{" "}
                  {confirmation.destination}
                </p>

                <p>
                  <strong>Date:</strong>{" "}
                  {confirmation.date}
                </p>

                <p>
                  <strong>Time:</strong>{" "}
                  {confirmation.time}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {formatStatus(confirmation.status)}
                </p>

                <p>
                  Your request has been sent to Makumbura Taxi
                  Operations and is waiting for driver processing.
                </p>
              </div>
            )}
          </section>

          <aside className="book-taxi-card">
            <h2>Vehicle Options</h2>

            {loadingVehicles ? (
              <div className="vehicle-loading">
                Loading available vehicle types...
              </div>
            ) : (
              vehicleTypes.map((vehicle) => (
                <div
                  className="vehicle-option-box"
                  key={vehicle.vehicleTypeId}
                >
                  <strong>
                    {getVehicleIcon(vehicle.typeName)}{" "}
                    {vehicle.typeName}
                  </strong>

                  <p>
                    {vehicle.description ||
                      getVehicleDescription(
                        vehicle.typeName
                      )}
                  </p>

                  <p>
                    Passenger capacity:{" "}
                    {vehicle.passengerCapacity}
                  </p>
                </div>
              ))
            )}

            <div className="booking-info-note">
              Your request will be processed through Makumbura Taxi
              Operations. Tracking becomes available after a driver
              accepts the booking.
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

export default BookTaxi;