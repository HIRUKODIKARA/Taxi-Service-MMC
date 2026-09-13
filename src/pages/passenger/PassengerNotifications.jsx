import { useEffect, useState } from "react";

function PassengerNotifications() {
  const API_BASE_URL = "/api";

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState(null);

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      ""
    );
  };

  const getHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    loadNotifications(true);

    const intervalId = setInterval(() => {
      loadNotifications(false);
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const loadNotifications = async (showLoader = true) => {
    const token = getToken();

    if (!token) {
      setError(
        "Please login to view your notifications."
      );
      setLoading(false);
      return;
    }

    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        `${API_BASE_URL}/notifications/me`,
        {
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        let errorData = null;

        try {
          errorData = await response.json();
        } catch {
          errorData = null;
        }

        throw new Error(
          errorData?.message ||
            "Unable to load notifications."
        );
      }

      const data = await response.json();

      const sortedData = [...data].sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );

      setNotifications(sortedData);
    } catch (err) {
      console.error(
        "Passenger notifications error:",
        err
      );

      setError(
        err.message ||
          "Unable to load notifications."
      );
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const markRead = async (notificationId) => {
    try {
      setMarkingId(notificationId);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        let errorData = null;

        try {
          errorData = await response.json();
        } catch {
          errorData = null;
        }

        throw new Error(
          errorData?.message ||
            "Unable to mark notification as read."
        );
      }

      setNotifications((current) =>
        current.map((item) =>
          Number(item.notificationId) ===
          Number(notificationId)
            ? {
                ...item,
                isRead: true,
              }
            : item
        )
      );
    } catch (err) {
      console.error(
        "Mark notification read error:",
        err
      );

      setError(
        err.message ||
          "Unable to mark notification as read."
      );
    } finally {
      setMarkingId(null);
    }
  };

  const formatDateTime = (date) => {
    if (!date) {
      return "";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return parsed.toLocaleString();
  };

  const getNotificationIcon = (type) => {
    const value = (type || "")
      .toUpperCase();

    if (
      value.includes("BOOKING") ||
      value.includes("TRIP")
    ) {
      return "🚕";
    }

    if (value.includes("PAYMENT")) {
      return "💳";
    }

    if (
      value.includes("DRIVER") ||
      value.includes("LOCATION")
    ) {
      return "📍";
    }

    if (
      value.includes("SYSTEM") ||
      value.includes("SECURITY")
    ) {
      return "⚙️";
    }

    return "🔔";
  };

  const unreadCount =
    notifications.filter(
      (item) => !item.isRead
    ).length;

  return (
    <>
      <style>{`
        .passenger-notifications-page {
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .passenger-notifications-page h1 {
          margin: 0 0 6px;
          color: #0b2946;
          font-size: 28px;
        }

        .passenger-notifications-page > p {
          margin: 0 0 22px;
          color: #7b8794;
          font-size: 12px;
        }

        .passenger-notification-summary {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .passenger-notification-summary-card {
          min-width: 140px;
          padding: 14px 16px;
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 8px;
        }

        .passenger-notification-summary-card span {
          display: block;
          margin-bottom: 5px;
          color: #89949e;
          font-size: 9px;
        }

        .passenger-notification-summary-card strong {
          color: #0b2946;
          font-size: 20px;
        }

        .passenger-notification-list {
          display: grid;
          gap: 11px;
        }

        .passenger-notification-card {
          display: grid;
          grid-template-columns: 45px 1fr auto;
          gap: 14px;
          align-items: center;
          background: white;
          padding: 16px;
          border: 1px solid #e2e7ec;
          border-radius: 9px;
        }

        .passenger-notification-card.unread {
          border-left: 4px solid #f6c20d;
          background: #fffdf5;
        }

        .passenger-notification-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eef3f7;
          border-radius: 8px;
          font-size: 18px;
        }

        .passenger-notification-content h3 {
          margin: 0 0 5px;
          color: #0b2946;
          font-size: 12px;
        }

        .passenger-notification-content p {
          margin: 0 0 5px;
          color: #65727e;
          font-size: 10px;
          line-height: 1.6;
        }

        .passenger-notification-content span {
          color: #9aa3ac;
          font-size: 8px;
        }

        .passenger-mark-read {
          border: 1px solid #0b2946;
          background: white;
          color: #0b2946;
          padding: 7px 9px;
          border-radius: 5px;
          font-size: 8px;
          font-weight: 700;
          cursor: pointer;
        }

        .passenger-mark-read:hover {
          background: #0b2946;
          color: white;
        }

        .passenger-mark-read:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .passenger-read-label {
          color: #909ba5;
          font-size: 9px;
        }

        .passenger-notification-loading,
        .passenger-notification-empty,
        .passenger-notification-error {
          padding: 30px;
          border-radius: 8px;
          text-align: center;
          font-size: 11px;
        }

        .passenger-notification-loading,
        .passenger-notification-empty {
          background: white;
          border: 1px solid #e2e7ec;
          color: #7b8794;
        }

        .passenger-notification-error {
          margin-bottom: 15px;
          background: #fff1f1;
          border: 1px solid #efc8c8;
          color: #a43c3c;
        }

        @media(max-width: 700px) {
          .passenger-notification-card {
            grid-template-columns: 1fr;
          }

          .passenger-notification-summary {
            flex-direction: column;
          }
        }
      `}</style>

      <main className="passenger-notifications-page">
        <h1>Notifications</h1>

        <p>
          View your booking, driver and trip updates.
        </p>

        <div className="passenger-notification-summary">
          <div className="passenger-notification-summary-card">
            <span>Total Notifications</span>
            <strong>
              {notifications.length}
            </strong>
          </div>

          <div className="passenger-notification-summary-card">
            <span>Unread</span>
            <strong>{unreadCount}</strong>
          </div>
        </div>

        {error && (
          <div className="passenger-notification-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="passenger-notification-loading">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="passenger-notification-empty">
            You do not have any notifications yet.
          </div>
        ) : (
          <div className="passenger-notification-list">
            {notifications.map(
              (notification) => (
                <div
                  key={
                    notification.notificationId
                  }
                  className={`passenger-notification-card ${
                    !notification.isRead
                      ? "unread"
                      : ""
                  }`}
                >
                  <div className="passenger-notification-icon">
                    {getNotificationIcon(
                      notification.notificationType
                    )}
                  </div>

                  <div className="passenger-notification-content">
                    <h3>
                      {notification.title ||
                        "Notification"}
                    </h3>

                    <p>
                      {notification.message}
                    </p>

                    <span>
                      {formatDateTime(
                        notification.createdAt
                      )}
                    </span>
                  </div>

                  {notification.isRead ? (
                    <span className="passenger-read-label">
                      Read
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="passenger-mark-read"
                      disabled={
                        markingId ===
                        notification.notificationId
                      }
                      onClick={() =>
                        markRead(
                          notification.notificationId
                        )
                      }
                    >
                      {markingId ===
                      notification.notificationId
                        ? "Updating..."
                        : "Mark Read"}
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </main>
    </>
  );
}

export default PassengerNotifications;