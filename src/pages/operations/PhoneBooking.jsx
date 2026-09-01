import { useState } from "react";

function PhoneBooking() {
  const [formData, setFormData] = useState({
    passengerName: "",
    phone: "",
    pickup: "Makumbura Multimodal Center",
    destination: "",
    vehicleType: "Car",
    requiredDate: "",
    requiredTime: "",
    notes: "",
  });

  const [confirmation, setConfirmation] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newBooking = {
      bookingId: `BK${Math.floor(1000 + Math.random() * 9000)}`,
      passengerName: formData.passengerName,
      phone: formData.phone,
      pickup: formData.pickup,
      destination: formData.destination,
      vehicleType: formData.vehicleType,
      requiredDate: formData.requiredDate,
      requiredTime: formData.requiredTime,
      status: "Pending Driver Assignment",
    };

    setConfirmation(newBooking);
  };

  const resetForm = () => {
    setFormData({
      passengerName: "",
      phone: "",
      pickup: "Makumbura Multimodal Center",
      destination: "",
      vehicleType: "Car",
      requiredDate: "",
      requiredTime: "",
      notes: "",
    });

    setConfirmation(null);
  };

  return (
    <>
      <style>{`
        .phone-booking-page {
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .phone-booking-header {
          margin-bottom: 24px;
        }

        .phone-booking-header h1 {
          margin: 0 0 6px;
          color: #0b2946;
          font-size: 28px;
          font-weight: 800;
        }

        .phone-booking-header p {
          margin: 0;
          color: #7b8794;
          font-size: 13px;
        }

        .phone-booking-info {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 22px;
          padding: 15px 17px;
          background: #eef6ff;
          border: 1px solid #d5e7f7;
          border-radius: 8px;
        }

        .phone-booking-info span {
          font-size: 20px;
        }

        .phone-booking-info h3 {
          margin: 0 0 4px;
          color: #0b2946;
          font-size: 13px;
        }

        .phone-booking-info p {
          margin: 0;
          color: #5e7489;
          font-size: 11px;
          line-height: 1.5;
        }

        .phone-booking-container {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 22px;
        }

        .phone-booking-card {
          background: white;
          border: 1px solid #e3e8ed;
          border-radius: 10px;
          padding: 24px;
          box-shadow: 0 4px 14px rgba(11, 41, 70, 0.05);
        }

        .phone-booking-card h2 {
          margin: 0 0 20px;
          color: #0b2946;
          font-size: 18px;
        }

        .phone-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 17px;
        }

        .phone-field {
          display: flex;
          flex-direction: column;
        }

        .phone-field.full-width {
          grid-column: 1 / -1;
        }

        .phone-field label {
          margin-bottom: 7px;
          color: #0b2946;
          font-size: 11px;
          font-weight: 700;
        }

        .phone-field input,
        .phone-field select,
        .phone-field textarea {
          width: 100%;
          padding: 11px 12px;
          border: 1px solid #d9e0e6;
          border-radius: 6px;
          outline: none;
          background: white;
          color: #405160;
          font-size: 12px;
        }

        .phone-field textarea {
          min-height: 90px;
          resize: vertical;
        }

        .phone-field input:focus,
        .phone-field select:focus,
        .phone-field textarea:focus {
          border-color: #f6c20d;
          box-shadow: 0 0 0 3px rgba(246, 194, 13, 0.1);
        }

        .phone-create-btn {
          width: 100%;
          margin-top: 20px;
          border: none;
          background: #f6c20d;
          color: #0b2946;
          padding: 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .phone-create-btn:hover {
          background: #e3b300;
        }

        .phone-side-box {
          padding: 14px;
          margin-bottom: 12px;
          background: #f8fafc;
          border: 1px solid #e7ebef;
          border-radius: 7px;
        }

        .phone-side-box span {
          display: block;
          color: #89939e;
          font-size: 9px;
          margin-bottom: 4px;
        }

        .phone-side-box strong {
          color: #0b2946;
          font-size: 12px;
        }

        .phone-process-title {
          margin-top: 22px !important;
          margin-bottom: 14px !important;
        }

        .phone-process-step {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid #edf0f3;
        }

        .phone-process-step:last-child {
          border-bottom: none;
        }

        .phone-step-number {
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0b2946;
          color: #f6c20d;
          border-radius: 50%;
          font-size: 10px;
          font-weight: 800;
        }

        .phone-process-step p {
          margin: 0;
          color: #62707d;
          font-size: 10px;
        }

        .phone-confirm-overlay {
          position: fixed;
          inset: 0;
          z-index: 5000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(4, 19, 33, 0.68);
        }

        .phone-confirm-modal {
          width: 100%;
          max-width: 520px;
          background: white;
          border-radius: 12px;
          padding: 26px;
          box-shadow: 0 15px 45px rgba(0,0,0,0.25);
        }

        .phone-confirm-icon {
          width: 55px;
          height: 55px;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e2f6e7;
          color: #18803b;
          border-radius: 50%;
          font-size: 25px;
        }

        .phone-confirm-modal h2 {
          margin: 0 0 8px;
          text-align: center;
          color: #0b2946;
          font-size: 21px;
        }

        .phone-confirm-modal > p {
          margin: 0 0 20px;
          text-align: center;
          color: #7a8591;
          font-size: 11px;
        }

        .phone-confirm-details {
          background: #f8fafc;
          border: 1px solid #e5eaee;
          border-radius: 8px;
          padding: 15px;
        }

        .phone-confirm-row {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 8px 0;
          border-bottom: 1px solid #edf0f3;
        }

        .phone-confirm-row:last-child {
          border-bottom: none;
        }

        .phone-confirm-row span {
          color: #84909b;
          font-size: 10px;
        }

        .phone-confirm-row strong {
          color: #0b2946;
          font-size: 11px;
          text-align: right;
        }

        .phone-confirm-message {
          margin-top: 15px;
          padding: 14px;
          background: #fff8dc;
          border: 1px solid #efda90;
          border-radius: 7px;
          color: #6e6241;
          font-size: 10px;
          line-height: 1.6;
        }

        .phone-confirm-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 18px;
        }

        .phone-confirm-actions button {
          padding: 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .phone-close-btn {
          border: 1px solid #0b2946;
          background: white;
          color: #0b2946;
        }

        .phone-new-btn {
          border: none;
          background: #f6c20d;
          color: #0b2946;
        }

        @media (max-width: 950px) {
          .phone-booking-container {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .phone-booking-page {
            padding: 18px;
          }

          .phone-form-grid {
            grid-template-columns: 1fr;
          }

          .phone-field.full-width {
            grid-column: auto;
          }

          .phone-confirm-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="phone-booking-page">

        <div className="phone-booking-header">
          <h1>Phone Booking</h1>

          <p>
            Create a taxi booking for passengers who contact
            Makumbura Taxi Operations by phone.
          </p>
        </div>

        <div className="phone-booking-info">

          <span>📞</span>

          <div>
            <h3>Telephone Booking Process</h3>

            <p>
              Collect passenger information, journey details and
              required vehicle type before creating the booking.
            </p>
          </div>

        </div>

        <div className="phone-booking-container">

          <section className="phone-booking-card">

            <h2>Create Phone Booking</h2>

            <form onSubmit={handleSubmit}>

              <div className="phone-form-grid">

                <div className="phone-field">
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

                <div className="phone-field">
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

                <div className="phone-field full-width">
                  <label>Pickup Location</label>

                  <input
                    type="text"
                    name="pickup"
                    value={formData.pickup}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="phone-field full-width">
                  <label>Destination</label>

                  <input
                    type="text"
                    name="destination"
                    placeholder="Enter passenger destination"
                    value={formData.destination}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="phone-field">
                  <label>Vehicle Type</label>

                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                  >
                    <option value="Car">Car</option>
                    <option value="Three-Wheeler">
                      Three-Wheeler
                    </option>
                    <option value="Bike">Bike</option>
                  </select>
                </div>

                <div className="phone-field">
                  <label>Required Date</label>

                  <input
                    type="date"
                    name="requiredDate"
                    value={formData.requiredDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="phone-field">
                  <label>Required Time</label>

                  <input
                    type="time"
                    name="requiredTime"
                    value={formData.requiredTime}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="phone-field full-width">
                  <label>Additional Notes</label>

                  <textarea
                    name="notes"
                    placeholder="Optional passenger or journey notes..."
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>

              </div>

              <button
                type="submit"
                className="phone-create-btn"
              >
                Create Phone Booking
              </button>

            </form>

          </section>

          <aside className="phone-booking-card">

            <h2>Booking Information</h2>

            <div className="phone-side-box">
              <span>Booking Source</span>
              <strong>Phone Call</strong>
            </div>

            <div className="phone-side-box">
              <span>Managed By</span>
              <strong>Taxi Operations Officer</strong>
            </div>

            <div className="phone-side-box">
              <span>Initial Status</span>
              <strong>Pending Driver Assignment</strong>
            </div>

            <h2 className="phone-process-title">
              Next Steps
            </h2>

            <div className="phone-process-step">
              <div className="phone-step-number">1</div>
              <p>Create passenger booking.</p>
            </div>

            <div className="phone-process-step">
              <div className="phone-step-number">2</div>
              <p>Check available driver and vehicle.</p>
            </div>

            <div className="phone-process-step">
              <div className="phone-step-number">3</div>
              <p>Assign suitable driver and vehicle.</p>
            </div>

            <div className="phone-process-step">
              <div className="phone-step-number">4</div>
              <p>Driver accepts the booking.</p>
            </div>

            <div className="phone-process-step">
              <div className="phone-step-number">5</div>
              <p>Send/show passenger confirmation.</p>
            </div>

          </aside>

        </div>

        {confirmation && (
          <div className="phone-confirm-overlay">

            <div className="phone-confirm-modal">

              <div className="phone-confirm-icon">
                ✓
              </div>

              <h2>Booking Created</h2>

              <p>
                The phone booking has been added to Taxi Operations.
              </p>

              <div className="phone-confirm-details">

                <div className="phone-confirm-row">
                  <span>Booking ID</span>
                  <strong>
                    {confirmation.bookingId}
                  </strong>
                </div>

                <div className="phone-confirm-row">
                  <span>Passenger</span>
                  <strong>
                    {confirmation.passengerName}
                  </strong>
                </div>

                <div className="phone-confirm-row">
                  <span>Phone</span>
                  <strong>
                    {confirmation.phone}
                  </strong>
                </div>

                <div className="phone-confirm-row">
                  <span>Vehicle Type</span>
                  <strong>
                    {confirmation.vehicleType}
                  </strong>
                </div>

                <div className="phone-confirm-row">
                  <span>Pickup</span>
                  <strong>
                    {confirmation.pickup}
                  </strong>
                </div>

                <div className="phone-confirm-row">
                  <span>Destination</span>
                  <strong>
                    {confirmation.destination}
                  </strong>
                </div>

                <div className="phone-confirm-row">
                  <span>Status</span>
                  <strong>
                    {confirmation.status}
                  </strong>
                </div>

              </div>

              <div className="phone-confirm-message">
                Passenger confirmation message will be sent after
                driver and vehicle assignment. SMS/API integration
                will be connected through the backend later.
              </div>

              <div className="phone-confirm-actions">

                <button
                  className="phone-close-btn"
                  onClick={() =>
                    setConfirmation(null)
                  }
                >
                  Close
                </button>

                <button
                  className="phone-new-btn"
                  onClick={resetForm}
                >
                  Create Another Booking
                </button>

              </div>

            </div>

          </div>
        )}

      </main>
    </>
  );
}

export default PhoneBooking;