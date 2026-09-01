import { useState } from "react";

function OnSiteBooking() {
  const [formData, setFormData] = useState({
    passengerName: "",
    phone: "",
    pickup: "Makumbura Multimodal Center",
    destination: "",
    vehicleType: "Car",
    passengers: "1",
    notes: "",
  });

  const [confirmation, setConfirmation] = useState(null);

  const availableVehicles = {
    Car: {
      driver: "Kasun Perera",
      vehicle: "WP CAB-1234",
      status: "Available",
    },

    "Three-Wheeler": {
      driver: "Nimal Silva",
      vehicle: "WP AAB-4567",
      status: "Available",
    },

    Bike: {
      driver: "Amal Jay",
      vehicle: "WP BCD-7890",
      status: "Available",
    },
  };

  const selectedVehicle =
    availableVehicles[formData.vehicleType];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const booking = {
      bookingId: `BK${Math.floor(
        1000 + Math.random() * 9000
      )}`,

      passengerName: formData.passengerName,
      phone: formData.phone,
      pickup: formData.pickup,
      destination: formData.destination,
      vehicleType: formData.vehicleType,
      passengers: formData.passengers,

      driver: selectedVehicle.driver,
      vehicle: selectedVehicle.vehicle,

      source: "On-Site",
      status: "Waiting for Driver Acceptance",
    };

    setConfirmation(booking);
  };

  const resetForm = () => {
    setFormData({
      passengerName: "",
      phone: "",
      pickup: "Makumbura Multimodal Center",
      destination: "",
      vehicleType: "Car",
      passengers: "1",
      notes: "",
    });

    setConfirmation(null);
  };

  return (
    <>
      <style>{`
        .onsite-page {
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .onsite-header {
          margin-bottom: 24px;
        }

        .onsite-header h1 {
          margin: 0 0 6px;
          color: #0b2946;
          font-size: 28px;
          font-weight: 800;
        }

        .onsite-header p {
          margin: 0;
          color: #7b8794;
          font-size: 13px;
        }

        .onsite-info {
          display: flex;
          gap: 13px;
          align-items: center;

          background: #fff7dc;

          border: 1px solid #eedc9d;
          border-radius: 8px;

          padding: 15px 17px;

          margin-bottom: 22px;
        }

        .onsite-info-icon {
          font-size: 25px;
        }

        .onsite-info h3 {
          margin: 0 0 4px;
          color: #0b2946;
          font-size: 13px;
        }

        .onsite-info p {
          margin: 0;
          color: #766b4d;
          font-size: 11px;
          line-height: 1.5;
        }

        .onsite-container {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 22px;
        }

        .onsite-card {
          background: white;

          border: 1px solid #e2e7ec;
          border-radius: 10px;

          padding: 24px;

          box-shadow: 0 4px 14px rgba(11,41,70,0.05);
        }

        .onsite-card h2 {
          margin: 0 0 20px;

          color: #0b2946;

          font-size: 18px;
          font-weight: 800;
        }

        .onsite-grid {
          display: grid;

          grid-template-columns: repeat(2, 1fr);

          gap: 17px;
        }

        .onsite-field {
          display: flex;
          flex-direction: column;
        }

        .onsite-field.full {
          grid-column: 1 / -1;
        }

        .onsite-field label {
          margin-bottom: 7px;

          color: #0b2946;

          font-size: 11px;
          font-weight: 700;
        }

        .onsite-field input,
        .onsite-field select,
        .onsite-field textarea {
          width: 100%;

          padding: 11px 12px;

          border: 1px solid #d8e0e6;
          border-radius: 6px;

          outline: none;

          background: white;

          color: #405160;

          font-size: 12px;
        }

        .onsite-field textarea {
          min-height: 85px;
          resize: vertical;
        }

        .onsite-field input:focus,
        .onsite-field select:focus,
        .onsite-field textarea:focus {
          border-color: #f6c20d;

          box-shadow:
            0 0 0 3px rgba(246,194,13,0.1);
        }

        .onsite-submit {
          width: 100%;

          margin-top: 20px;

          padding: 12px;

          border: none;
          border-radius: 6px;

          background: #f6c20d;

          color: #0b2946;

          font-size: 12px;
          font-weight: 800;

          cursor: pointer;
        }

        .onsite-submit:hover {
          background: #e3b300;
        }

        .onsite-status-box {
          padding: 15px;

          background: #f7fafc;

          border: 1px solid #e4e9ed;
          border-radius: 8px;

          margin-bottom: 15px;
        }

        .onsite-status-label {
          display: block;

          color: #89939d;

          font-size: 9px;

          margin-bottom: 4px;
        }

        .onsite-status-value {
          color: #0b2946;

          font-size: 12px;
          font-weight: 700;
        }

        .onsite-vehicle {
          margin-top: 20px;

          padding: 18px;

          background: #eef9f1;

          border: 1px solid #cfe9d5;
          border-radius: 8px;
        }

        .onsite-vehicle-title {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 15px;
        }

        .onsite-vehicle-title h3 {
          margin: 0;

          color: #0b2946;

          font-size: 13px;
        }

        .onsite-available {
          background: #dff3e4;
          color: #18763a;

          padding: 5px 9px;

          border-radius: 20px;

          font-size: 9px;
          font-weight: 700;
        }

        .onsite-vehicle-row {
          display: flex;
          justify-content: space-between;

          gap: 15px;

          padding: 8px 0;

          border-bottom: 1px solid #daeade;
        }

        .onsite-vehicle-row:last-child {
          border-bottom: none;
        }

        .onsite-vehicle-row span {
          color: #748077;
          font-size: 10px;
        }

        .onsite-vehicle-row strong {
          color: #0b2946;
          font-size: 11px;
        }

        .onsite-warning {
          margin-top: 18px;

          padding: 13px;

          background: #eef6ff;

          border: 1px solid #d8e9f8;
          border-radius: 7px;

          color: #5a7186;

          font-size: 10px;
          line-height: 1.6;
        }

        .onsite-modal-bg {
          position: fixed;
          inset: 0;

          z-index: 5000;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 20px;

          background: rgba(4,19,33,0.68);
        }

        .onsite-modal {
          width: 100%;
          max-width: 530px;

          background: white;

          border-radius: 12px;

          padding: 27px;

          box-shadow:
            0 16px 50px rgba(0,0,0,0.25);
        }

        .onsite-success {
          width: 58px;
          height: 58px;

          margin: 0 auto 15px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #e1f5e7;

          color: #19813c;

          font-size: 25px;
          font-weight: 800;
        }

        .onsite-modal h2 {
          margin: 0 0 7px;

          text-align: center;

          color: #0b2946;

          font-size: 21px;
        }

        .onsite-modal-subtitle {
          margin: 0 0 20px;

          text-align: center;

          color: #7b8792;

          font-size: 11px;
        }

        .onsite-confirm-details {
          background: #f8fafc;

          border: 1px solid #e5e9ed;
          border-radius: 8px;

          padding: 15px;
        }

        .onsite-confirm-row {
          display: flex;

          justify-content: space-between;

          gap: 15px;

          padding: 8px 0;

          border-bottom: 1px solid #edf0f2;
        }

        .onsite-confirm-row:last-child {
          border-bottom: none;
        }

        .onsite-confirm-row span {
          color: #89939d;

          font-size: 10px;
        }

        .onsite-confirm-row strong {
          color: #0b2946;

          font-size: 11px;

          text-align: right;
        }

        .onsite-message {
          margin-top: 15px;

          padding: 14px;

          background: #fff7d9;

          border: 1px solid #edd990;
          border-radius: 7px;

          color: #746743;

          font-size: 10px;
          line-height: 1.6;
        }

        .onsite-actions {
          display: grid;

          grid-template-columns: 1fr 1fr;

          gap: 10px;

          margin-top: 18px;
        }

        .onsite-actions button {
          padding: 10px;

          border-radius: 6px;

          cursor: pointer;

          font-size: 11px;
          font-weight: 700;
        }

        .onsite-close {
          background: white;

          color: #0b2946;

          border: 1px solid #0b2946;
        }

        .onsite-new {
          border: none;

          background: #f6c20d;

          color: #0b2946;
        }

        @media (max-width: 950px) {
          .onsite-container {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .onsite-page {
            padding: 18px;
          }

          .onsite-grid {
            grid-template-columns: 1fr;
          }

          .onsite-field.full {
            grid-column: auto;
          }

          .onsite-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="onsite-page">

        <div className="onsite-header">
          <h1>On-Site Booking</h1>

          <p>
            Create bookings for passengers visiting the Makumbura
            Taxi Operations counter.
          </p>
        </div>

        <div className="onsite-info">

          <div className="onsite-info-icon">
            📍
          </div>

          <div>
            <h3>Makumbura Counter Booking</h3>

            <p>
              Enter the passenger's journey information and select
              a suitable available vehicle.
            </p>
          </div>

        </div>

        <div className="onsite-container">

          <section className="onsite-card">

            <h2>Passenger & Journey Details</h2>

            <form onSubmit={handleSubmit}>

              <div className="onsite-grid">

                <div className="onsite-field">
                  <label>Passenger Name</label>

                  <input
                    type="text"
                    name="passengerName"
                    placeholder="Enter passenger name"
                    value={formData.passengerName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="onsite-field">
                  <label>Phone Number</label>

                  <input
                    type="tel"
                    name="phone"
                    placeholder="07XXXXXXXX"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="onsite-field full">
                  <label>Pickup Location</label>

                  <input
                    type="text"
                    name="pickup"
                    value={formData.pickup}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="onsite-field full">
                  <label>Destination</label>

                  <input
                    type="text"
                    name="destination"
                    placeholder="Enter destination"
                    value={formData.destination}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="onsite-field">
                  <label>Vehicle Type</label>

                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                  >
                    <option value="Car">
                      Car
                    </option>

                    <option value="Three-Wheeler">
                      Three-Wheeler
                    </option>

                    <option value="Bike">
                      Bike
                    </option>
                  </select>
                </div>

                <div className="onsite-field">
                  <label>Number of Passengers</label>

                  <select
                    name="passengers"
                    value={formData.passengers}
                    onChange={handleChange}
                  >
                    <option value="1">1 Passenger</option>
                    <option value="2">2 Passengers</option>
                    <option value="3">3 Passengers</option>
                    <option value="4">4 Passengers</option>
                  </select>
                </div>

                <div className="onsite-field full">
                  <label>Additional Notes</label>

                  <textarea
                    name="notes"
                    placeholder="Optional journey notes..."
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>

              </div>

              <button
                type="submit"
                className="onsite-submit"
              >
                Create On-Site Booking
              </button>

            </form>

          </section>

          <aside className="onsite-card">

            <h2>Booking Information</h2>

            <div className="onsite-status-box">
              <span className="onsite-status-label">
                BOOKING SOURCE
              </span>

              <span className="onsite-status-value">
                On-Site / Counter
              </span>
            </div>

            <div className="onsite-status-box">
              <span className="onsite-status-label">
                PICKUP POINT
              </span>

              <span className="onsite-status-value">
                Makumbura Multimodal Center
              </span>
            </div>

            <div className="onsite-status-box">
              <span className="onsite-status-label">
                SELECTED VEHICLE TYPE
              </span>

              <span className="onsite-status-value">
                {formData.vehicleType}
              </span>
            </div>

            <div className="onsite-vehicle">

              <div className="onsite-vehicle-title">

                <h3>Available Vehicle</h3>

                <span className="onsite-available">
                  ● Available
                </span>

              </div>

              <div className="onsite-vehicle-row">
                <span>Driver</span>

                <strong>
                  {selectedVehicle.driver}
                </strong>
              </div>

              <div className="onsite-vehicle-row">
                <span>Vehicle No.</span>

                <strong>
                  {selectedVehicle.vehicle}
                </strong>
              </div>

              <div className="onsite-vehicle-row">
                <span>Status</span>

                <strong>
                  {selectedVehicle.status}
                </strong>
              </div>

            </div>

            <div className="onsite-warning">
              The selected driver must accept the booking before
              the trip can begin. Backend integration will later
              provide real driver availability and live booking
              updates.
            </div>

          </aside>

        </div>

        {confirmation && (

          <div className="onsite-modal-bg">

            <div className="onsite-modal">

              <div className="onsite-success">
                ✓
              </div>

              <h2>On-Site Booking Created</h2>

              <p className="onsite-modal-subtitle">
                Booking created successfully and sent for driver
                acceptance.
              </p>

              <div className="onsite-confirm-details">

                <div className="onsite-confirm-row">
                  <span>Booking ID</span>

                  <strong>
                    {confirmation.bookingId}
                  </strong>
                </div>

                <div className="onsite-confirm-row">
                  <span>Passenger</span>

                  <strong>
                    {confirmation.passengerName}
                  </strong>
                </div>

                <div className="onsite-confirm-row">
                  <span>Phone</span>

                  <strong>
                    {confirmation.phone}
                  </strong>
                </div>

                <div className="onsite-confirm-row">
                  <span>Vehicle Type</span>

                  <strong>
                    {confirmation.vehicleType}
                  </strong>
                </div>

                <div className="onsite-confirm-row">
                  <span>Driver</span>

                  <strong>
                    {confirmation.driver}
                  </strong>
                </div>

                <div className="onsite-confirm-row">
                  <span>Vehicle</span>

                  <strong>
                    {confirmation.vehicle}
                  </strong>
                </div>

                <div className="onsite-confirm-row">
                  <span>Destination</span>

                  <strong>
                    {confirmation.destination}
                  </strong>
                </div>

                <div className="onsite-confirm-row">
                  <span>Status</span>

                  <strong>
                    {confirmation.status}
                  </strong>
                </div>

              </div>

              <div className="onsite-message">
                Confirmation example: Booking{" "}
                <strong>{confirmation.bookingId}</strong> created.
                Driver: {confirmation.driver}, Vehicle:{" "}
                {confirmation.vehicle}, Pickup:{" "}
                {confirmation.pickup}, Destination:{" "}
                {confirmation.destination}. SMS functionality will
                be connected with the backend later.
              </div>

              <div className="onsite-actions">

                <button
                  className="onsite-close"
                  onClick={() =>
                    setConfirmation(null)
                  }
                >
                  Close
                </button>

                <button
                  className="onsite-new"
                  onClick={resetForm}
                >
                  New Booking
                </button>

              </div>

            </div>

          </div>

        )}

      </main>
    </>
  );
}

export default OnSiteBooking;