import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    nic: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setMessage("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            fullName: formData.fullName,
            nic: formData.nic,
            phone: formData.phone,
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Registration failed.");
        return;
      }

      setMessage("Registration successful! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      console.error("Registration error:", error);

      setMessage(
        "Cannot connect to the server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .register-page {
          min-height: calc(100vh - 88px);
          background: #f4f7fa;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 45px 20px;

          font-family: Arial, Helvetica, sans-serif;
        }

        .register-card {
          width: 100%;
          max-width: 760px;

          background: white;

          border: 1px solid #e4e8ed;
          border-radius: 12px;

          padding: 34px;

          box-shadow: 0 10px 30px rgba(11, 41, 70, 0.08);
        }

        .register-header {
          margin-bottom: 28px;
          text-align: center;
        }

        .register-header h1 {
          margin: 0 0 8px;

          color: #0b2946;

          font-size: 30px;
          font-weight: 800;
        }

        .register-header p {
          margin: 0;

          color: #7a8591;

          font-size: 13px;
          line-height: 1.6;
        }

        .register-type-badge {
          display: inline-block;

          margin-top: 13px;

          background: #fff3cd;
          color: #806400;

          padding: 7px 13px;

          border-radius: 20px;

          font-size: 10px;
          font-weight: 700;
        }

        .register-message {
          margin-bottom: 18px;

          padding: 11px 13px;

          background: #f8fafc;

          border: 1px solid #d9e0e6;
          border-radius: 6px;

          color: #0b2946;

          font-size: 12px;
          line-height: 1.5;
        }

        .register-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);

          gap: 18px;
        }

        .register-field {
          display: flex;
          flex-direction: column;
        }

        .register-field.full-width {
          grid-column: 1 / -1;
        }

        .register-field label {
          margin-bottom: 7px;

          color: #0b2946;

          font-size: 12px;
          font-weight: 700;
        }

        .register-field input {
          width: 100%;

          padding: 12px 13px;

          border: 1px solid #d9e0e6;
          border-radius: 6px;

          outline: none;

          color: #36495b;

          font-size: 13px;

          background: white;

          box-sizing: border-box;
        }

        .register-field input:focus {
          border-color: #f6c20d;

          box-shadow: 0 0 0 3px rgba(246,194,13,0.12);
        }

        .register-note {
          margin-top: 20px;

          padding: 13px 15px;

          background: #eef6ff;

          border: 1px solid #d6e8f9;
          border-radius: 7px;

          color: #5c748a;

          font-size: 10px;
          line-height: 1.6;
        }

        .register-terms {
          display: flex;
          align-items: flex-start;

          gap: 8px;

          margin: 20px 0;
        }

        .register-terms input {
          margin-top: 2px;

          accent-color: #f6c20d;
        }

        .register-terms span {
          color: #697684;

          font-size: 11px;
          line-height: 1.5;
        }

        .register-submit-btn {
          width: 100%;

          border: none;

          background: #f6c20d;

          color: #0b2946;

          padding: 13px;

          border-radius: 6px;

          font-size: 13px;
          font-weight: 800;

          cursor: pointer;

          transition: 0.2s;
        }

        .register-submit-btn:hover {
          background: #e3b300;
        }

        .register-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .register-divider {
          display: flex;
          align-items: center;

          gap: 12px;

          margin: 25px 0 20px;

          color: #a0a8b0;

          font-size: 10px;
        }

        .register-divider::before,
        .register-divider::after {
          content: "";

          flex: 1;

          height: 1px;

          background: #e3e7eb;
        }

        .register-login-text {
          text-align: center;

          color: #697684;

          font-size: 12px;
        }

        .register-login-text a {
          color: #d6a100;

          text-decoration: none;

          font-weight: 700;
        }

        .register-login-text a:hover {
          text-decoration: underline;
        }

        .driver-register-box {
          margin-top: 20px;

          padding: 15px;

          background: #f8fafc;

          border: 1px solid #e4e9ee;
          border-radius: 8px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 15px;
        }

        .driver-register-box h4 {
          margin: 0 0 4px;

          color: #0b2946;

          font-size: 12px;
        }

        .driver-register-box p {
          margin: 0;

          color: #7b8794;

          font-size: 10px;
        }

        .driver-register-link {
          flex-shrink: 0;

          padding: 9px 14px;

          border: 1px solid #0b2946;
          border-radius: 6px;

          color: #0b2946;

          text-decoration: none;

          font-size: 10px;
          font-weight: 700;
        }

        .driver-register-link:hover {
          background: #0b2946;
          color: white;
        }

        @media (max-width: 700px) {
          .register-card {
            padding: 25px 20px;
          }

          .register-form-grid {
            grid-template-columns: 1fr;
          }

          .register-field.full-width {
            grid-column: auto;
          }

          .driver-register-box {
            flex-direction: column;
            align-items: flex-start;
          }

          .driver-register-link {
            width: 100%;
            text-align: center;
            box-sizing: border-box;
          }
        }
      `}</style>

      <main className="register-page">
        <div className="register-card">
          <div className="register-header">
            <h1>Create Passenger Account</h1>

            <p>
              Register with Makumbura Taxi Service to book and manage
              your taxi journeys.
            </p>

            <span className="register-type-badge">
              Passenger Registration
            </span>
          </div>

          {message && (
            <div className="register-message">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="register-form-grid">

              <div className="register-field">
                <label>Full Name</label>

                <input
                  type="text"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="register-field">
                <label>NIC Number</label>

                <input
                  type="text"
                  name="nic"
                  placeholder="Enter NIC number"
                  value={formData.nic}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="register-field">
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

              <div className="register-field">
                <label>Email Address</label>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="register-field">
                <label>Password</label>

                <input
                  type="password"
                  name="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength="6"
                  required
                />
              </div>

              <div className="register-field">
                <label>Confirm Password</label>

                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  minLength="6"
                  required
                />
              </div>

            </div>

            <div className="register-note">
              Passenger accounts can be used to create website bookings,
              view booking details and manage future taxi service
              activities.
            </div>

            <label className="register-terms">
              <input type="checkbox" required />

              <span>
                I confirm that the information provided is correct and
                agree to the system terms and conditions.
              </span>
            </label>

            <button
              type="submit"
              className="register-submit-btn"
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : "Create Passenger Account"}
            </button>
          </form>

          <div className="register-divider">
            OR
          </div>

          <p className="register-login-text">
            Already have an account?{" "}
            <Link to="/login">
              Login here
            </Link>
          </p>

          <div className="driver-register-box">

            <div>
              <h4>Are you a Taxi Driver?</h4>

              <p>
                Complete the separate driver registration and
                verification process.
              </p>
            </div>

            <Link
              to="/driver-register"
              className="driver-register-link"
            >
              Driver Registration
            </Link>

          </div>
        </div>
      </main>
    </>
  );
}

export default Register;