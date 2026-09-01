import { useState } from "react";
import { Link } from "react-router-dom";

function DriverRegister() {
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    nic: "",
    phone: "",
    email: "",
    license: "",
    vehicleType: "Car",
    vehicleNo: "",
    gpsAvailable: "Yes",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <style>{`
        .driver-register-page {
          min-height: calc(100vh - 80px);
          padding: 45px 20px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .driver-register-card {
          width: 100%;
          max-width: 800px;
          margin: auto;
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 8px 25px rgba(11,41,70,0.06);
        }

        .driver-register-header {
          text-align: center;
          margin-bottom: 27px;
        }

        .driver-register-header h1 {
          margin: 0 0 8px;
          color: #0b2946;
          font-size: 28px;
        }

        .driver-register-header p {
          max-width: 620px;
          margin: auto;
          color: #7b8794;
          font-size: 11px;
          line-height: 1.6;
        }

        .driver-reg-badge {
          display: inline-block;
          margin-top: 12px;
          padding: 6px 11px;
          background: #fff3cc;
          color: #806300;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
        }

        .driver-register-grid {
          display: grid;
          grid-template-columns: repeat(2,1fr);
          gap: 16px;
        }

        .driver-reg-field {
          display: flex;
          flex-direction: column;
        }

        .driver-reg-field label {
          margin-bottom: 6px;
          color: #0b2946;
          font-size: 10px;
          font-weight: 700;
        }

        .driver-reg-field input,
        .driver-reg-field select {
          width: 100%;
          padding: 11px 12px;
          border: 1px solid #d9e0e6;
          border-radius: 6px;
          outline: none;
          background: white;
          color: #53616e;
          font-size: 11px;
        }

        .driver-reg-field input:focus,
        .driver-reg-field select:focus {
          border-color: #f6c20d;
        }

        .driver-document-box {
          margin-top: 20px;
          padding: 16px;
          background: #f8fafc;
          border: 1px solid #e3e8ed;
          border-radius: 8px;
        }

        .driver-document-box h3 {
          margin: 0 0 10px;
          color: #0b2946;
          font-size: 12px;
        }

        .driver-document-box p {
          margin: 0 0 12px;
          color: #70808d;
          font-size: 9px;
          line-height: 1.5;
        }

        .driver-document-box input {
          font-size: 10px;
        }

        .driver-register-submit {
          width: 100%;
          margin-top: 20px;
          padding: 12px;
          border: none;
          border-radius: 6px;
          background: #f6c20d;
          color: #0b2946;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .driver-reg-success {
          margin-top: 18px;
          padding: 15px;
          background: #e5f6eb;
          border: 1px solid #cbe8d3;
          border-radius: 7px;
          color: #18763a;
          font-size: 10px;
          line-height: 1.6;
        }

        .driver-reg-login {
          margin-top: 20px;
          text-align: center;
          color: #7a8792;
          font-size: 10px;
        }

        .driver-reg-login a {
          color: #d5a400;
          text-decoration: none;
          font-weight: 700;
        }

        @media(max-width: 700px) {
          .driver-register-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="driver-register-page">
        <div className="driver-register-card">
          <div className="driver-register-header">
            <h1>Driver Registration</h1>

            <p>
              Submit your driver and vehicle details for verification.
              An authorized administrator must verify the registration
              before the driver account can begin accepting trips.
            </p>

            <span className="driver-reg-badge">
              Verification Required
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="driver-register-grid">
              <div className="driver-reg-field">
                <label>Full Name</label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="driver-reg-field">
                <label>NIC Number</label>

                <input
                  name="nic"
                  value={form.nic}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="driver-reg-field">
                <label>Phone Number</label>

                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="driver-reg-field">
                <label>Email Address</label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="driver-reg-field">
                <label>Driving License Number</label>

                <input
                  name="license"
                  value={form.license}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="driver-reg-field">
                <label>Vehicle Type</label>

                <select
                  name="vehicleType"
                  value={form.vehicleType}
                  onChange={handleChange}
                >
                  <option value="Car">Car</option>
                  <option value="Three-Wheeler">
                    Three-Wheeler
                  </option>
                  <option value="Bike">Bike</option>
                </select>
              </div>

              <div className="driver-reg-field">
                <label>Vehicle Registration Number</label>

                <input
                  name="vehicleNo"
                  value={form.vehicleNo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="driver-reg-field">
                <label>GPS / Location Capability</label>

                <select
                  name="gpsAvailable"
                  value={form.gpsAvailable}
                  onChange={handleChange}
                >
                  <option value="Yes">Available</option>
                  <option value="No">Not Available</option>
                </select>
              </div>
            </div>

            <div className="driver-document-box">
              <h3>Verification Documents</h3>

              <p>
                Upload supporting documents such as driving license
                and vehicle registration documents. File storage will
                be connected to the backend later.
              </p>

              <input type="file" multiple />
            </div>

            <button className="driver-register-submit">
              Submit Driver Registration
            </button>
          </form>

          {submitted && (
            <div className="driver-reg-success">
              ✓ Registration submitted successfully in the frontend demo.
              Your account will remain pending until an administrator
              completes the driver verification process.
            </div>
          )}

          <div className="driver-reg-login">
            Already registered?{" "}
            <Link to="/login">
              Go to Login
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

export default DriverRegister;