import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const response = await fetch("http://localhost:5171/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed.");
        setMessageType("error");
        return;
      }

      const storage = rememberMe ? localStorage : sessionStorage;

      storage.setItem("token", data.token);
      storage.setItem("user", JSON.stringify(data.user));

      // Clear old login data from the other storage
      if (rememberMe) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

      setMessage("Login successful. Redirecting...");
      setMessageType("success");

      const roles = data.user?.roles || [];

      setTimeout(() => {
        if (roles.includes("SUPER_ADMIN")) {
          navigate("/super-admin/dashboard");
        } else if (
          roles.includes("TAXI_OPERATIONS") ||
          roles.includes("ADMIN")
        ) {
          navigate("/operations/dashboard");
        } else if (roles.includes("DRIVER")) {
          navigate("/driver/dashboard");
        } else if (roles.includes("PASSENGER")) {
          navigate("/passenger/dashboard");
        } else {
          navigate("/");
        }
      }, 600);
    } catch (error) {
      console.error("Login error:", error);

      setMessage(
        "Cannot connect to the server. Please make sure the backend is running."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .login-page {
          min-height: calc(100vh - 88px);
          background: #f4f7fa;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 45px 20px;

          font-family: Arial, Helvetica, sans-serif;
        }

        .login-card {
          width: 100%;
          max-width: 430px;

          background: white;

          border: 1px solid #e4e8ed;
          border-radius: 12px;

          padding: 34px;

          box-shadow: 0 10px 30px rgba(11, 41, 70, 0.08);
        }

        .login-card h1 {
          margin: 0 0 8px;

          color: #0b2946;

          font-size: 30px;
          font-weight: 800;
        }

        .login-subtitle {
          margin: 0 0 28px;

          color: #7a8591;

          font-size: 13px;
          line-height: 1.6;
        }

        .login-field {
          margin-bottom: 18px;
        }

        .login-field label {
          display: block;

          margin-bottom: 7px;

          color: #0b2946;

          font-size: 12px;
          font-weight: 700;
        }

        .login-field input {
          width: 100%;

          padding: 12px 13px;

          border: 1px solid #d9e0e6;
          border-radius: 6px;

          outline: none;

          color: #36495b;

          font-size: 13px;

          box-sizing: border-box;
        }

        .login-field input:focus {
          border-color: #f6c20d;

          box-shadow: 0 0 0 3px rgba(246,194,13,0.12);
        }

        .login-options {
          display: flex;
          justify-content: space-between;
          align-items: center;

          gap: 15px;

          margin-bottom: 22px;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 7px;

          color: #5c6976;

          font-size: 11px;
        }

        .remember-me input {
          accent-color: #f6c20d;
        }

        .forgot-link {
          color: #d5a000;

          text-decoration: none;

          font-size: 11px;
          font-weight: 700;
        }

        .forgot-link:hover {
          text-decoration: underline;
        }

        .login-submit-btn {
          width: 100%;

          border: none;

          background: #f6c20d;

          color: #0b2946;

          padding: 12px;

          border-radius: 6px;

          font-size: 13px;
          font-weight: 800;

          cursor: pointer;

          transition: 0.2s;
        }

        .login-submit-btn:hover {
          background: #e3b300;
        }

        .login-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .login-message {
          margin: 0 0 18px;

          padding: 10px 12px;

          border-radius: 6px;

          font-size: 11px;
          line-height: 1.5;
        }

        .login-message.success {
          background: #edf9f0;
          border: 1px solid #b8e2c1;
          color: #276638;
        }

        .login-message.error {
          background: #fff1f1;
          border: 1px solid #efc1c1;
          color: #a63737;
        }

        .login-divider {
          display: flex;
          align-items: center;

          gap: 12px;

          margin: 25px 0;

          color: #9aa3ac;

          font-size: 10px;
        }

        .login-divider::before,
        .login-divider::after {
          content: "";

          flex: 1;

          height: 1px;

          background: #e3e7eb;
        }

        .login-register-text {
          text-align: center;

          margin: 0 0 15px;

          color: #687582;

          font-size: 12px;
        }

        .login-register-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;

          gap: 10px;
        }

        .login-register-btn {
          display: block;

          text-align: center;

          padding: 10px;

          border: 1px solid #0b2946;
          border-radius: 6px;

          color: #0b2946;

          text-decoration: none;

          font-size: 11px;
          font-weight: 700;

          transition: 0.2s;
        }

        .login-register-btn:hover {
          background: #0b2946;

          color: white;
        }

        .login-role-info {
          margin-top: 25px;

          padding: 13px;

          background: #f8fafc;

          border: 1px solid #e7ebef;
          border-radius: 7px;

          color: #778390;

          font-size: 10px;
          line-height: 1.6;
        }

        @media (max-width: 550px) {
          .login-card {
            padding: 25px 20px;
          }

          .login-options {
            flex-direction: column;
            align-items: flex-start;
          }

          .login-register-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="login-page">
        <div className="login-card">
          <h1>Welcome Back</h1>

          <p className="login-subtitle">
            Login to your Makumbura Taxi Service account.
          </p>

          {message && (
            <div className={`login-message ${messageType}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label>Email</label>

              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-field">
              <label>Password</label>

              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />

                Remember me
              </label>

              <Link
                to="/forgot-password"
                className="forgot-link"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="login-divider">
            OR
          </div>

          <p className="login-register-text">
            Don't have an account?
          </p>

          <div className="login-register-actions">
            <Link
              to="/register"
              className="login-register-btn"
            >
              Register as Passenger
            </Link>

            <Link
              to="/driver-register"
              className="login-register-btn"
            >
              Register as Driver
            </Link>
          </div>

          <div className="login-role-info">
            Admin, Super Admin and Taxi Operations accounts are
            created and managed by authorized system administrators.
          </div>
        </div>
      </main>
    </>
  );
}

export default Login;