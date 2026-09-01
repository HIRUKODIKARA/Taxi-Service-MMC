import { useEffect, useState } from "react";

function DriverNotifications() {
  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState(false);

  const getStoredUser = () => {
    try {
      const localUser =
        localStorage.getItem("user");

      const sessionUser =
        sessionStorage.getItem("user");

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

  const getHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  const user = getStoredUser();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications =
    async () => {
      if (!user) {
        setError(
          "Please login to view notifications."
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5171/api/notifications/user/${user.userId}`,
          {
            headers: getHeaders(),
          }
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load notifications."
          );
        }

        const data =
          await response.json();

        const sorted =
          [...data].sort(
            (a, b) =>
              new Date(
                b.createdAt || 0
              ) -
              new Date(
                a.createdAt || 0
              )
          );

        setNotifications(
          sorted
        );
      } catch (err) {
        console.error(
          "Notification loading error:",
          err
        );

        setError(
          err.message ||
            "Unable to load notifications."
        );
      } finally {
        setLoading(false);
      }
    };

  const markRead =
    async (notificationId) => {
      try {
        setError("");

        const response = await fetch(
          `http://localhost:5171/api/notifications/${notificationId}/read`,
          {
            method: "PUT",

            headers: getHeaders(),
          }
        );

        if (!response.ok) {
          throw new Error(
            "Unable to mark notification as read."
          );
        }

        setNotifications(
          notifications.map(
            (notification) =>
              Number(
                notification.notificationId
              ) ===
              Number(
                notificationId
              )
                ? {
                    ...notification,
                    isRead: true,
                  }
                : notification
          )
        );
      } catch (err) {
        console.error(
          "Mark notification read error:",
          err
        );

        setError(
          err.message ||
            "Unable to update notification."
        );
      }
    };

  const markAll =
    async () => {
      if (!user) {
        return;
      }

      try {
        setActionLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5171/api/notifications/user/${user.userId}/read-all`,
          {
            method: "PUT",

            headers: getHeaders(),
          }
        );

        if (!response.ok) {
          throw new Error(
            "Unable to mark all notifications as read."
          );
        }

        setNotifications(
          notifications.map(
            (notification) => ({
              ...notification,
              isRead: true,
            })
          )
        );
      } catch (err) {
        console.error(
          "Mark all notification error:",
          err
        );

        setError(
          err.message ||
            "Unable to update notifications."
        );
      } finally {
        setActionLoading(false);
      }
    };

  const getTimeText =
    (createdAt) => {
      if (!createdAt) {
        return "";
      }

      const created =
        new Date(createdAt);

      const now =
        new Date();

      const difference =
        now - created;

      const minutes =
        Math.floor(
          difference /
            (1000 * 60)
        );

      const hours =
        Math.floor(
          difference /
            (1000 * 60 * 60)
        );

      const days =
        Math.floor(
          difference /
            (1000 * 60 * 60 * 24)
        );

      if (minutes < 1) {
        return "Just now";
      }

      if (minutes < 60) {
        return `${minutes} minute${
          minutes === 1 ? "" : "s"
        } ago`;
      }

      if (hours < 24) {
        return `${hours} hour${
          hours === 1 ? "" : "s"
        } ago`;
      }

      if (days === 1) {
        return "Yesterday";
      }

      if (days < 7) {
        return `${days} days ago`;
      }

      return created.toLocaleString();
    };

  const getNotificationIcon =
    (type) => {
      switch (type) {
        case "BOOKING":
          return "🚕";

        case "DRIVER":
          return "👤";

        case "VEHICLE":
          return "🚗";

        case "SYSTEM":
          return "⚙️";

        default:
          return "🔔";
      }
    };

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.isRead
    ).length;

  return (
    <>
      <style>{`
        .driver-notification-page {
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .driver-notification-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          margin-bottom: 22px;
        }

        .driver-notification-header h1 {
          margin: 0 0 6px;
          color: #0b2946;
          font-size: 28px;
        }

        .driver-notification-header p {
          margin: 0;
          color: #7b8794;
          font-size: 12px;
        }

        .driver-notification-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .driver-unread-count {
          padding: 7px 10px;
          background: #fff3cc;
          color: #806300;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
        }

        .driver-mark-all {
          border: none;
          background: #0b2946;
          color: white;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 700;
          cursor: pointer;
        }

        .driver-mark-all:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .driver-notification-error {
          margin-bottom: 18px;
          padding: 12px 14px;
          background: #fff1f1;
          border: 1px solid #efc8c8;
          border-radius: 7px;
          color: #a43c3c;
          font-size: 10px;
          line-height: 1.5;
        }

        .driver-notification-list {
          display: grid;
          gap: 11px;
        }

        .driver-notification-card {
          display: grid;
          grid-template-columns: 45px 1fr auto;
          align-items: center;
          gap: 14px;
          background: white;
          padding: 16px;
          border: 1px solid #e2e7ec;
          border-radius: 9px;
        }

        .driver-notification-card.unread {
          border-left: 4px solid #f6c20d;
          background: #fffdf5;
        }

        .driver-notification-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eef3f7;
          border-radius: 8px;
          font-size: 18px;
        }

        .driver-notification-content h3 {
          margin: 0 0 5px;
          color: #0b2946;
          font-size: 12px;
        }

        .driver-notification-content p {
          margin: 0 0 5px;
          color: #65727e;
          font-size: 10px;
          line-height: 1.5;
        }

        .driver-notification-content span {
          color: #9aa3ac;
          font-size: 8px;
        }

        .driver-notification-read {
          border: 1px solid #0b2946;
          background: white;
          color: #0b2946;
          padding: 7px 9px;
          border-radius: 5px;
          font-size: 8px;
          cursor: pointer;
        }

        .driver-notification-read:hover {
          background: #0b2946;
          color: white;
        }

        .driver-read-label {
          color: #909ba5;
          font-size: 9px;
        }

        .driver-notification-loading,
        .driver-notification-empty {
          padding: 32px;
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 9px;
          text-align: center;
          color: #7b8794;
          font-size: 11px;
        }

        @media(max-width: 700px) {
          .driver-notification-card {
            grid-template-columns: 1fr;
          }

          .driver-notification-header {
            flex-direction: column;
          }

          .driver-notification-actions {
            flex-wrap: wrap;
          }

          .driver-notification-page {
            padding: 20px;
          }
        }
      `}</style>

      <main className="driver-notification-page">
        <div className="driver-notification-header">
          <div>
            <h1>Notifications</h1>

            <p>
              View booking, trip and system related driver
              notifications.
            </p>
          </div>

          <div className="driver-notification-actions">
            <span className="driver-unread-count">
              {unreadCount} Unread
            </span>

            <button
              type="button"
              className="driver-mark-all"
              disabled={
                actionLoading ||
                unreadCount === 0
              }
              onClick={markAll}
            >
              {actionLoading
                ? "Updating..."
                : "Mark All as Read"}
            </button>
          </div>
        </div>

        {error && (
          <div className="driver-notification-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="driver-notification-loading">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="driver-notification-empty">
            You do not have any notifications yet.
          </div>
        ) : (
          <div className="driver-notification-list">
            {notifications.map(
              (notification) => (
                <div
                  key={
                    notification.notificationId
                  }
                  className={`driver-notification-card ${
                    !notification.isRead
                      ? "unread"
                      : ""
                  }`}
                >
                  <div className="driver-notification-icon">
                    {getNotificationIcon(
                      notification.notificationType
                    )}
                  </div>

                  <div className="driver-notification-content">
                    <h3>
                      {notification.title}
                    </h3>

                    <p>
                      {notification.message}
                    </p>

                    <span>
                      {getTimeText(
                        notification.createdAt
                      )}
                    </span>
                  </div>

                  {notification.isRead ? (
                    <span className="driver-read-label">
                      Read
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="driver-notification-read"
                      onClick={() =>
                        markRead(
                          notification.notificationId
                        )
                      }
                    >
                      Mark Read
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

export default DriverNotifications;