import { useState } from "react";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!emailOrPhone.trim()) {
      setMessage("Please enter your email address or phone number.");
      return;
    }

    setMessage(
      "Password reset instructions will be sent after backend integration."
    );
  };

  return (
    <>
      <style>{`
        .forgot-page {
          min-height: calc(100vh - 88px);
          background: #f4f7fa;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 45px 20px;

          font-family: Arial, Helvetica, sans-serif;
        }

        .forgot-card {
          width: 100%;
          max-width: 450px;

          background: white;

          border: 1px solid #e4e8ed;
          border-radius: 12px;

          padding: 34px;

          box-shadow: 0 10px 30px rgba(11, 41, 70, 0.08);
        }

        .forgot-icon {
          width: 60px;
          height: 60px;

          margin: 0 auto 18px;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #fff6d5;

          border-radius: 50%;

          font-size: 26px;
        }

        .forgot-card h1 {
          margin: 0 0 9px;

          text-align: center;

          color: #0b2946;

          font-size: 28px;
          font-weight: 800;
        }

        .forgot-subtitle {
          margin: 0 0 27px;

          text-align: center;

          color: #7a8591;

          font-size: 12px;
          line-height: 1.6;
        }

        .forgot-field {
          margin-bottom: 18px;
        }

        .forgot-field label {
          display: block;

          margin-bottom: 7px;

          color: #0b2946;

          font-size: 12px;
          font-weight: 700;
        }

        .forgot-field input {
          width: 100%;

          padding: 12px 13px;

          border: 1px solid #d9e0e6;
          border-radius: 6px;

          outline: none;

          color: #36495b;

          font-size: 13px;
        }

        .forgot-field input:focus {
          border-color: #f6c20d;

          box-shadow: 0 0 0 3px rgba(246,194,13,0.12);
        }

        .forgot-submit {
          width: 100%;

          border: none;

          background: #f6c20d;

          color: #0b2946;

          padding: 12px;

          border-radius: 6px;

          font-size: 13px;
          font-weight: 800;

          cursor: pointer;
        }

        .forgot-submit:hover {
          background: #e3b300;
        }

        .forgot-message {
          margin-top: 17px;

          padding: 12px 13px;

          background: #eef6ff;

          border: 1px solid #d5e7f7;
          border-radius: 7px;

          color: #55718a;

          font-size: 11px;
          line-height: 1.5;
        }

        .forgot-back {
          margin-top: 22px;

          text-align: center;
        }

        .forgot-back a {
          color: #d6a100;

          text-decoration: none;

          font-size: 12px;
          font-weight: 700;
        }

        .forgot-back a:hover {
          text-decoration: underline;
        }
      `}</style>

      <main className="forgot-page">

        <div className="forgot-card">

          <div className="forgot-icon">
            🔐
          </div>

          <h1>Forgot Password?</h1>

          <p className="forgot-subtitle">
            Enter the email address or phone number connected to your
            Makumbura Taxi Service account.
          </p>

          <form onSubmit={handleSubmit}>

            <div className="forgot-field">

              <label>
                Email or Phone Number
              </label>

              <input
                type="text"
                placeholder="Enter email or phone number"
                value={emailOrPhone}
                onChange={(e) =>
                  setEmailOrPhone(e.target.value)
                }
              />

            </div>

            <button
              type="submit"
              className="forgot-submit"
            >
              Send Reset Instructions
            </button>

          </form>

          {message && (
            <div className="forgot-message">
              {message}
            </div>
          )}

          <div className="forgot-back">

            <Link to="/login">
              ← Back to Login
            </Link>

          </div>

        </div>

      </main>
    </>
  );
}

export default ForgotPassword;