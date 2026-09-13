import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = "/api";

const safeJson = async (response) => {
  const raw = await response.text();

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {
      message: raw,
    };
  }
};

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [step, setStep] = useState("request");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  /* =========================================================
     REQUEST RESET TOKEN
  ========================================================= */

  const handleRequestReset = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      const response = await fetch(
        `${API_BASE_URL}/password/forgot`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await safeJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to create password reset request."
        );
      }

      /*
        During development the backend returns resetToken.

        Later, when email/SMS integration is added,
        this token should normally be sent through
        an email reset link instead.
      */

      if (data?.resetToken) {
        setResetToken(data.resetToken);

        setStep("reset");

        setMessage(
          "Password reset request created. Please enter your new password."
        );

        setMessageType("success");
      } else {
        setMessage(
          data?.message ||
            "If an active account exists for this email, reset instructions have been created."
        );

        setMessageType("success");
      }
    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      setMessage(
        error?.message ||
          "Cannot connect to the server."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     RESET PASSWORD
  ========================================================= */

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    if (!resetToken) {
      setMessage(
        "Password reset token is missing. Please request a new reset."
      );

      setMessageType("error");

      setStep("request");

      return;
    }

    if (!newPassword) {
      setMessage(
        "Please enter your new password."
      );

      setMessageType("error");

      return;
    }

    if (newPassword.length < 8) {
      setMessage(
        "Password must contain at least 8 characters."
      );

      setMessageType("error");

      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setMessage(
        "Password must contain at least one uppercase letter."
      );

      setMessageType("error");

      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setMessage(
        "Password must contain at least one lowercase letter."
      );

      setMessageType("error");

      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setMessage(
        "Password must contain at least one number."
      );

      setMessageType("error");

      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage(
        "New password and confirm password do not match."
      );

      setMessageType("error");

      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      const response = await fetch(
        `${API_BASE_URL}/password/reset`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            token: resetToken,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await safeJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to reset password."
        );
      }

      setStep("complete");

      setMessage(
        data?.message ||
          "Password reset successfully."
      );

      setMessageType("success");

      setNewPassword("");
      setConfirmPassword("");
      setResetToken("");
    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      setMessage(
        error?.message ||
          "Unable to reset password."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     START AGAIN
  ========================================================= */

  const handleStartAgain = () => {
    setStep("request");

    setResetToken("");

    setNewPassword("");
    setConfirmPassword("");

    setMessage("");
    setMessageType("");
  };

  /* =========================================================
     UI
  ========================================================= */

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

          box-sizing: border-box;
        }

        .forgot-field input:focus {
          border-color: #f6c20d;

          box-shadow:
            0 0 0 3px
            rgba(246, 194, 13, 0.12);
        }

        .forgot-password-wrapper {
          position: relative;
        }

        .forgot-password-wrapper input {
          padding-right: 65px;
        }

        .forgot-show-btn {
          position: absolute;

          top: 50%;
          right: 10px;

          transform: translateY(-50%);

          border: none;
          background: transparent;

          color: #0b2946;

          font-size: 10px;
          font-weight: 700;

          cursor: pointer;
        }

        .forgot-password-help {
          margin: -7px 0 17px;

          padding: 10px 12px;

          background: #f8fafc;

          border: 1px solid #e7ebef;
          border-radius: 6px;

          color: #75818c;

          font-size: 9px;
          line-height: 1.6;
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

          transition: .2s;
        }

        .forgot-submit:hover:not(:disabled) {
          background: #e3b300;
        }

        .forgot-submit:disabled {
          opacity: .65;

          cursor: not-allowed;
        }

        .forgot-secondary {
          width: 100%;

          margin-top: 10px;

          border: 1px solid #0b2946;

          background: white;

          color: #0b2946;

          padding: 11px;

          border-radius: 6px;

          font-size: 11px;
          font-weight: 700;

          cursor: pointer;
        }

        .forgot-secondary:hover {
          background: #f4f7fa;
        }

        .forgot-message {
          margin: 0 0 18px;

          padding: 12px 13px;

          border-radius: 7px;

          font-size: 11px;
          line-height: 1.5;
        }

        .forgot-message.success {
          background: #edf9f0;

          border: 1px solid #b8e2c1;

          color: #276638;
        }

        .forgot-message.error {
          background: #fff1f1;

          border: 1px solid #efc1c1;

          color: #a63737;
        }

        .forgot-success-box {
          padding: 20px;

          background: #edf9f0;

          border: 1px solid #b8e2c1;
          border-radius: 8px;

          text-align: center;
        }

        .forgot-success-box h3 {
          margin: 0 0 8px;

          color: #276638;

          font-size: 16px;
        }

        .forgot-success-box p {
          margin: 0 0 18px;

          color: #4f765a;

          font-size: 11px;
          line-height: 1.6;
        }

        .forgot-login-btn {
          display: block;

          padding: 11px;

          background: #f6c20d;

          border-radius: 6px;

          color: #0b2946;

          text-decoration: none;

          font-size: 12px;
          font-weight: 800;
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

        @media (max-width: 520px) {
          .forgot-card {
            padding: 27px 20px;
          }
        }
      `}</style>

      <main className="forgot-page">
        <div className="forgot-card">

          <div className="forgot-icon">
            {step === "complete"
              ? "✅"
              : "🔐"}
          </div>

          {/* ==============================================
              REQUEST RESET
          ============================================== */}

          {step === "request" && (
            <>
              <h1>
                Forgot Password?
              </h1>

              <p className="forgot-subtitle">
                Enter the email address
                connected to your Makumbura
                Taxi Service account.
              </p>

              {message && (
                <div
                  className={`forgot-message ${messageType}`}
                >
                  {message}
                </div>
              )}

              <form
                onSubmit={
                  handleRequestReset
                }
              >
                <div className="forgot-field">
                  <label>
                    Email Address
                  </label>

                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    disabled={loading}
                    autoComplete="email"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="forgot-submit"
                  disabled={loading}
                >
                  {loading
                    ? "Creating Reset Request..."
                    : "Continue"}
                </button>
              </form>
            </>
          )}

          {/* ==============================================
              NEW PASSWORD
          ============================================== */}

          {step === "reset" && (
            <>
              <h1>
                Create New Password
              </h1>

              <p className="forgot-subtitle">
                Enter a new password for{" "}
                <strong>{email}</strong>.
              </p>

              {message && (
                <div
                  className={`forgot-message ${messageType}`}
                >
                  {message}
                </div>
              )}

              <form
                onSubmit={
                  handleResetPassword
                }
              >
                <div className="forgot-field">
                  <label>
                    New Password
                  </label>

                  <div className="forgot-password-wrapper">
                    <input
                      type={
                        showNewPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(
                          e.target.value
                        )
                      }
                      disabled={loading}
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      className="forgot-show-btn"
                      onClick={() =>
                        setShowNewPassword(
                          (current) =>
                            !current
                        )
                      }
                    >
                      {showNewPassword
                        ? "Hide"
                        : "Show"}
                    </button>
                  </div>
                </div>

                <div className="forgot-field">
                  <label>
                    Confirm Password
                  </label>

                  <div className="forgot-password-wrapper">
                    <input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Confirm new password"
                      value={
                        confirmPassword
                      }
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      disabled={loading}
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      className="forgot-show-btn"
                      onClick={() =>
                        setShowConfirmPassword(
                          (current) =>
                            !current
                        )
                      }
                    >
                      {showConfirmPassword
                        ? "Hide"
                        : "Show"}
                    </button>
                  </div>
                </div>

                <div className="forgot-password-help">
                  Password must have at
                  least 8 characters,
                  including an uppercase
                  letter, lowercase letter
                  and number.
                </div>

                <button
                  type="submit"
                  className="forgot-submit"
                  disabled={loading}
                >
                  {loading
                    ? "Resetting Password..."
                    : "Reset Password"}
                </button>

                <button
                  type="button"
                  className="forgot-secondary"
                  onClick={
                    handleStartAgain
                  }
                  disabled={loading}
                >
                  Use Another Email
                </button>
              </form>
            </>
          )}

          {/* ==============================================
              COMPLETE
          ============================================== */}

          {step === "complete" && (
            <>
              <h1>
                Password Changed
              </h1>

              <p className="forgot-subtitle">
                Your account password has
                been reset successfully.
              </p>

              <div className="forgot-success-box">
                <h3>
                  Reset Successful
                </h3>

                <p>
                  You can now log in to
                  your MMC Taxi account
                  using your new password.
                </p>

                <Link
                  to="/login"
                  className="forgot-login-btn"
                >
                  Go to Login
                </Link>
              </div>
            </>
          )}

          {step !== "complete" && (
            <div className="forgot-back">
              <Link to="/login">
                ← Back to Login
              </Link>
            </div>
          )}

        </div>
      </main>
    </>
  );
}

export default ForgotPassword;