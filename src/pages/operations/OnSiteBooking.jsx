import { useEffect, useState } from "react";

const API_BASE_URL = "/api";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("authToken") ||
  sessionStorage.getItem("accessToken") ||
  "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const safeJson = async (response) => {
  const raw = await response.text();

  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
};

const formatText = (value) =>
  (value ?? "—")
    .toString()
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

function OnSiteBooking() {
  const [vehicleTypes, setVehicleTypes] = useState([]);

  const [form, setForm] = useState({
    passengerName: "",
    passengerPhone: "",
    pickupLocation: "Makumbura Multimodal Center",
    destination: "",
    bookingDate: "",
    bookingTime: "",
    vehicleTypeId: "",
  });

  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingVehicleTypes, setLoadingVehicleTypes] = useState(true);

  /* =========================================================
     LOAD VEHICLE TYPES
  ========================================================= */

  const loadVehicleTypes = async () => {
    try {
      setLoadingVehicleTypes(true);
      setError("");

      // Public ACTIVE vehicle types endpoint
      const response = await fetch(
        `${API_BASE_URL}/vehicletypes`
      );

      const data = await safeJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to load vehicle types."
        );
      }

      const activeTypes = Array.isArray(data)
        ? data.filter((item) => item.status === "ACTIVE")
        : [];

      setVehicleTypes(activeTypes);

      if (activeTypes.length > 0) {
        setForm((current) => ({
          ...current,
          vehicleTypeId:
            current.vehicleTypeId ||
            String(activeTypes[0].vehicleTypeId),
        }));
      }
    } catch (err) {
      console.error("On-site vehicle type error:", err);

      setVehicleTypes([]);

      setError(
        err?.message || "Unable to load vehicle types."
      );
    } finally {
      setLoadingVehicleTypes(false);
    }
  };

  useEffect(() => {
    loadVehicleTypes();
  }, []);

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const change = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  /* =========================================================
     CREATE ON-SITE BOOKING
  ========================================================= */

  const submit = async (event) => {
    event.preventDefault();

    if (loading) return;

    const token = getToken();

    if (!token) {
      setError("Please login to your Taxi Operator account.");
      return;
    }

    if (!form.passengerName.trim()) {
      setError("Passenger name is required.");
      return;
    }

    if (!form.passengerPhone.trim()) {
      setError("Passenger phone number is required.");
      return;
    }

    if (!form.pickupLocation.trim()) {
      setError("Pickup location is required.");
      return;
    }

    if (!form.destination.trim()) {
      setError("Destination is required.");
      return;
    }

    if (!form.vehicleTypeId) {
      setError("Please select a vehicle type.");
      return;
    }

    if (!form.bookingDate) {
      setError("Required date is required.");
      return;
    }

    if (!form.bookingTime) {
      setError("Required time is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setConfirmation(null);

      const payload = {
        passengerName: form.passengerName.trim(),
        passengerPhone: form.passengerPhone.trim(),

        pickupLocation: form.pickupLocation.trim(),
        destination: form.destination.trim(),

        bookingDate: form.bookingDate,

        bookingTime: `${form.bookingTime}:00`,

        vehicleTypeId: Number(form.vehicleTypeId),

        bookingSource: "ON_SITE",
      };

      const response = await fetch(
        `${API_BASE_URL}/bookings`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        }
      );

      const data = await safeJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.title ||
            "Unable to create booking."
        );
      }

      // Supports either:
      // { booking: {...} }
      // OR direct booking object.
      const createdBooking = data?.booking || data;

      setConfirmation(createdBooking);
    } catch (err) {
      console.error("On-site booking error:", err);

      setError(
        err?.message || "Unable to create booking."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     RESET
  ========================================================= */

  const reset = () => {
    setConfirmation(null);
    setError("");

    setForm((current) => ({
      passengerName: "",
      passengerPhone: "",
      pickupLocation: "Makumbura Multimodal Center",
      destination: "",
      bookingDate: "",
      bookingTime: "",
      vehicleTypeId: current.vehicleTypeId,
    }));
  };

  /* =========================================================
     VEHICLE ICON
  ========================================================= */

  const getVehicleIcon = (typeName) => {
    const type = (typeName || "").toUpperCase();

    if (type.includes("CAR")) {
      return "🚗";
    }

    if (
      type.includes("THREE") ||
      type.includes("TUK")
    ) {
      return "🛺";
    }

    if (
      type.includes("BIKE") ||
      type.includes("MOTOR")
    ) {
      return "🏍️";
    }

    return "🚕";
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      <style>{`
        .bk-page {
          padding: 30px;
          min-height: 100vh;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
          color: #0b2946;
        }

        .bk-head {
          margin-bottom: 20px;
        }

        .bk-head h1 {
          margin: 0 0 6px;
          font-size: 28px;
          font-weight: 800;
        }

        .bk-head p {
          margin: 0;
          color: #7b8794;
          font-size: 12px;
        }

        .bk-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 18px;
        }

        .bk-card {
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 10px;
          padding: 22px;
        }

        .bk-card h2 {
          margin: 0 0 18px;
          font-size: 17px;
        }

        .bk-form {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .bk-field.full {
          grid-column: 1 / -1;
        }

        .bk-field label {
          display: block;
          margin-bottom: 6px;
          font-size: 10px;
          font-weight: 800;
        }

        .bk-field input,
        .bk-field select {
          width: 100%;
          padding: 10px 11px;
          border: 1px solid #d8e0e6;
          border-radius: 6px;
          outline: none;
          background: white;
          color: #25394b;
          box-sizing: border-box;
        }

        .bk-field input:focus,
        .bk-field select:focus {
          border-color: #f6c20d;
          box-shadow: 0 0 0 3px rgba(246,194,13,.12);
        }

        .bk-submit {
          width: 100%;
          margin-top: 17px;
          border: none;
          background: #f6c20d;
          color: #0b2946;
          padding: 12px;
          border-radius: 6px;
          font-weight: 800;
          cursor: pointer;
        }

        .bk-submit:hover:not(:disabled) {
          background: #e6b500;
        }

        .bk-submit:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .bk-info {
          padding: 12px;
          background: #f7f9fb;
          border-radius: 7px;
          margin-bottom: 10px;
        }

        .bk-info span {
          display: block;
          font-size: 8px;
          color: #8a96a0;
          margin-bottom: 4px;
        }

        .bk-info strong {
          font-size: 10px;
        }

        .bk-error {
          padding: 11px 13px;
          border-radius: 7px;
          margin-bottom: 14px;
          font-size: 10px;
          background: #fff1f1;
          border: 1px solid #efc1c1;
          color: #a63737;
        }

        .bk-vehicle-list {
          margin-top: 18px;
        }

        .bk-vehicle-list h3 {
          margin: 0 0 10px;
          font-size: 12px;
        }

        .bk-vehicle-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 11px;
          margin-bottom: 7px;
          background: white;
          border: 1px solid #e6eaee;
          border-radius: 6px;
        }

        .bk-vehicle-item span {
          font-size: 10px;
          font-weight: 700;
        }

        .bk-vehicle-item small {
          color: #87939e;
          font-size: 8px;
        }

        .bk-overlay {
          position: fixed;
          inset: 0;
          background: rgba(4, 19, 33, .68);
          z-index: 5000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .bk-modal {
          width: 100%;
          max-width: 520px;
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 20px 50px rgba(0,0,0,.25);
        }

        .bk-modal h2 {
          text-align: center;
          margin: 0 0 15px;
          color: #0b2946;
        }

        .bk-row {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 8px 0;
          border-bottom: 1px solid #edf0f3;
          font-size: 10px;
        }

        .bk-row span {
          color: #7c8995;
        }

        .bk-row strong {
          color: #0b2946;
          text-align: right;
        }

        .bk-close {
          width: 100%;
          margin-top: 15px;
          border: none;
          background: #0b2946;
          color: white;
          padding: 10px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 700;
        }

        @media(max-width: 900px) {
          .bk-grid {
            grid-template-columns: 1fr;
          }
        }

        @media(max-width: 600px) {
          .bk-page {
            padding: 18px;
          }

          .bk-form {
            grid-template-columns: 1fr;
          }

          .bk-field.full {
            grid-column: auto;
          }
        }
      `}</style>

      <main className="bk-page">

        {/* HEADER */}

        <div className="bk-head">
          <h1>On-Site Booking</h1>

          <p>
            Create a booking for a passenger visiting the
            Makumbura Taxi Operations counter.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="bk-error">
            {error}
          </div>
        )}

        <div className="bk-grid">

          {/* BOOKING FORM */}

          <section className="bk-card">
            <h2>Passenger & Journey Details</h2>

            <form onSubmit={submit}>
              <div className="bk-form">

                <div className="bk-field">
                  <label>Passenger Name</label>

                  <input
                    name="passengerName"
                    value={form.passengerName}
                    onChange={change}
                    placeholder="Enter passenger name"
                    required
                  />
                </div>

                <div className="bk-field">
                  <label>Phone Number</label>

                  <input
                    name="passengerPhone"
                    type="tel"
                    placeholder="07XXXXXXXX"
                    value={form.passengerPhone}
                    onChange={change}
                    required
                  />
                </div>

                <div className="bk-field full">
                  <label>Pickup Location</label>

                  <input
                    name="pickupLocation"
                    value={form.pickupLocation}
                    onChange={change}
                    required
                  />
                </div>

                <div className="bk-field full">
                  <label>Destination</label>

                  <input
                    name="destination"
                    value={form.destination}
                    onChange={change}
                    placeholder="Enter destination"
                    required
                  />
                </div>

                <div className="bk-field">
                  <label>Vehicle Type</label>

                  <select
                    name="vehicleTypeId"
                    value={form.vehicleTypeId}
                    onChange={change}
                    disabled={loadingVehicleTypes}
                    required
                  >
                    <option value="">
                      {loadingVehicleTypes
                        ? "Loading..."
                        : "Select Vehicle Type"}
                    </option>

                    {vehicleTypes.map((vehicle) => (
                      <option
                        key={vehicle.vehicleTypeId}
                        value={vehicle.vehicleTypeId}
                      >
                        {vehicle.typeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bk-field">
                  <label>Required Date</label>

                  <input
                    name="bookingDate"
                    type="date"
                    value={form.bookingDate}
                    onChange={change}
                    required
                  />
                </div>

                <div className="bk-field">
                  <label>Required Time</label>

                  <input
                    name="bookingTime"
                    type="time"
                    value={form.bookingTime}
                    onChange={change}
                    required
                  />
                </div>

              </div>

              <button
                type="submit"
                className="bk-submit"
                disabled={
                  loading ||
                  loadingVehicleTypes ||
                  !form.vehicleTypeId
                }
              >
                {loading
                  ? "Creating Booking..."
                  : "Create Booking"}
              </button>
            </form>
          </section>

          {/* BOOKING INFORMATION */}

          <aside className="bk-card">
            <h2>Booking Information</h2>

            <div className="bk-info">
              <span>SOURCE</span>
              <strong>{formatText("ON_SITE")}</strong>
            </div>

            <div className="bk-info">
              <span>MANAGED BY</span>
              <strong>Taxi Operator</strong>
            </div>

            <div className="bk-info">
              <span>INITIAL STATUS</span>
              <strong>Pending Driver Assignment</strong>
            </div>

            <div className="bk-info">
              <span>NEXT STEP</span>

              <strong>
                Assign a matching available vehicle and driver
                from Booking Management.
              </strong>
            </div>

            <div className="bk-vehicle-list">
              <h3>Available Vehicle Types</h3>

              {loadingVehicleTypes ? (
                <div className="bk-info">
                  Loading vehicle types...
                </div>
              ) : vehicleTypes.length === 0 ? (
                <div className="bk-info">
                  No active vehicle types available.
                </div>
              ) : (
                vehicleTypes.map((vehicle) => (
                  <div
                    className="bk-vehicle-item"
                    key={vehicle.vehicleTypeId}
                  >
                    <span>
                      {getVehicleIcon(vehicle.typeName)}{" "}
                      {vehicle.typeName}
                    </span>

                    <small>
                      Capacity: {vehicle.passengerCapacity}
                    </small>
                  </div>
                ))
              )}
            </div>
          </aside>

        </div>

        {/* BOOKING CONFIRMATION */}

        {confirmation && (
          <div className="bk-overlay">

            <div className="bk-modal">
              <h2>✓ Booking Created</h2>

              <div className="bk-row">
                <span>Booking ID</span>

                <strong>
                  BK
                  {String(
                    confirmation.bookingId || ""
                  ).padStart(4, "0")}
                </strong>
              </div>

              <div className="bk-row">
                <span>Source</span>
                <strong>On Site</strong>
              </div>

              <div className="bk-row">
                <span>Passenger</span>

                <strong>
                  {confirmation.passengerName ||
                    form.passengerName}
                </strong>
              </div>

              <div className="bk-row">
                <span>Phone</span>

                <strong>
                  {confirmation.passengerPhone ||
                    form.passengerPhone}
                </strong>
              </div>

              <div className="bk-row">
                <span>Pickup</span>

                <strong>
                  {confirmation.pickupLocation ||
                    form.pickupLocation}
                </strong>
              </div>

              <div className="bk-row">
                <span>Destination</span>

                <strong>
                  {confirmation.destination ||
                    form.destination}
                </strong>
              </div>

              <div className="bk-row">
                <span>Status</span>

                <strong>
                  {formatText(
                    confirmation.bookingStatus ||
                      "WAITING_FOR_DRIVER"
                  )}
                </strong>
              </div>

              <button
                type="button"
                className="bk-close"
                onClick={reset}
              >
                Create Another Booking
              </button>
            </div>

          </div>
        )}

      </main>
    </>
  );
}

export default OnSiteBooking;