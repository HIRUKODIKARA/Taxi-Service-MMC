import { useEffect, useMemo, useState } from "react";

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

const formatText = (value) =>
  (value ?? "—")
    .toString()
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const timeAgo = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const minutes = Math.floor(
    (Date.now() - date.getTime()) / 60000
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} minute${
      minutes === 1 ? "" : "s"
    } ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${
      hours === 1 ? "" : "s"
    } ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} day${
      days === 1 ? "" : "s"
    } ago`;
  }

  return date.toLocaleString();
};

function OperationsNotifications() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("ALL");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  /* =========================================================
     LOAD NOTIFICATIONS
  ========================================================= */

  const loadNotifications = async (
    showSuccess = false
  ) => {
    const token = getToken();

    if (!token) {
      setError(
        "Please login to your Taxi Operator account."
      );

      setLoading(false);

      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_BASE_URL}/notifications/me`,
        {
          headers: authHeaders(),
        }
      );

      const data =
        await safeJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load notifications."
        );
      }

      const notifications =
        Array.isArray(data)
          ? [...data].sort(
              (a, b) =>
                new Date(
                  b.createdAt || 0
                ) -
                new Date(
                  a.createdAt || 0
                )
            )
          : [];

      setItems(notifications);

      if (showSuccess) {
        setSuccess(
          `Notifications refreshed successfully. ${notifications.length} notification(s) loaded.`
        );
      }
    } catch (err) {
      console.error(
        "Operations notification load error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(false);
  }, []);

  /* =========================================================
     MARK ONE AS READ
  ========================================================= */

  const markRead = async (
    notificationId
  ) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: authHeaders(),
        }
      );

      const data =
        await safeJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to mark notification as read."
        );
      }

      setItems((current) =>
        current.map((notification) =>
          Number(
            notification.notificationId
          ) ===
          Number(notificationId)
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );

      setSuccess(
        data?.message ||
          "Notification marked as read."
      );
    } catch (err) {
      console.error(
        "Mark notification read error:",
        err
      );

      setError(
        err?.message ||
          "Unable to update notification."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================================
     MARK ALL READ
  ========================================================= */

  const markAllRead = async () => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_BASE_URL}/notifications/me/read-all`,
        {
          method: "PUT",
          headers: authHeaders(),
        }
      );

      const data =
        await safeJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to mark all notifications as read."
        );
      }

      setItems((current) =>
        current.map(
          (notification) => ({
            ...notification,
            isRead: true,
          })
        )
      );

      setSuccess(
        data?.message ||
          "All notifications marked as read."
      );
    } catch (err) {
      console.error(
        "Mark all notifications error:",
        err
      );

      setError(
        err?.message ||
          "Unable to update notifications."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================================
     FILTER
  ========================================================= */

  const types = useMemo(
    () => [
      "ALL",
      ...Array.from(
        new Set(
          items
            .map(
              (notification) =>
                notification.notificationType
            )
            .filter(Boolean)
        )
      ),
    ],
    [items]
  );

  const filtered = useMemo(
    () =>
      filter === "ALL"
        ? items
        : items.filter(
            (notification) =>
              notification.notificationType ===
              filter
          ),
    [items, filter]
  );

  const unread = items.filter(
    (notification) =>
      !notification.isRead
  ).length;

  const read =
    items.length - unread;

  /* =========================================================
     ICON
  ========================================================= */

  const getIcon = (type) => {
    switch (type) {
      case "BOOKING":
        return "📋";

      case "DRIVER":
        return "👤";

      case "VEHICLE":
        return "🚗";

      case "PAYMENT":
        return "💳";

      case "SYSTEM":
        return "🔔";

      default:
        return "🔔";
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      <style>{`
        .on-page {
          padding: 30px;
          min-height: 100vh;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
          color: #0b2946;
        }

        .on-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          margin-bottom: 20px;
        }

        .on-head h1 {
          margin: 0 0 6px;
          font-size: 28px;
        }

        .on-head p {
          margin: 0;
          color: #7b8794;
          font-size: 12px;
        }

        .on-actions {
          display: flex;
          gap: 8px;
        }

        .on-action-btn {
          border: none;
          background: #0b2946;
          color: white;
          padding: 10px 14px;
          border-radius: 6px;
          font-weight: 700;
          cursor: pointer;
          min-width: 105px;
        }

        .on-action-btn:hover:not(:disabled) {
          background: #163e63;
        }

        .on-action-btn:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .on-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 17px;
        }

        .on-stat {
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 9px;
          padding: 18px;
        }

        .on-stat span {
          font-size: 9px;
          color: #89949e;
        }

        .on-stat h2 {
          margin: 6px 0 0;
          font-size: 22px;
        }

        .on-message {
          padding: 11px 13px;
          border-radius: 7px;
          margin-bottom: 14px;
          font-size: 10px;
        }

        .on-error {
          background: #fff1f1;
          border: 1px solid #efc1c1;
          color: #a63737;
        }

        .on-success {
          background: #edf9f0;
          border: 1px solid #b8e2c1;
          color: #276638;
        }

        .on-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 9px;
          padding: 12px;
          margin-bottom: 14px;
        }

        .on-filter {
          border: 1px solid #d8e0e6;
          background: white;
          padding: 7px 11px;
          border-radius: 20px;
          font-size: 9px;
          cursor: pointer;
        }

        .on-filter.active {
          background: #f6c20d;
          border-color: #f6c20d;
          font-weight: 800;
        }

        .on-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .on-card {
          display: grid;
          grid-template-columns:
            45px 1fr auto;
          gap: 13px;
          align-items: center;

          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 9px;

          padding: 15px;
        }

        .on-card.unread {
          border-left: 4px solid #f6c20d;
          background: #fffdf5;
        }

        .on-icon {
          width: 42px;
          height: 42px;

          border-radius: 8px;

          background: #eef3f7;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 18px;
        }

        .on-card h3 {
          margin: 0 0 4px;

          font-size: 12px;
        }

        .on-card p {
          margin: 0 0 5px;

          color: #63717d;

          font-size: 10px;
        }

        .on-card small {
          color: #9aa3ac;

          font-size: 8px;
        }

        .on-read {
          border: 1px solid #0b2946;
          background: white;
          color: #0b2946;

          padding: 7px 9px;

          border-radius: 5px;

          font-size: 8px;
          font-weight: 700;

          cursor: pointer;
        }

        .on-read:hover:not(:disabled) {
          background: #0b2946;
          color: white;
        }

        .on-read-status {
          font-size: 8px;
          color: #87929c;
        }

        .on-loading,
        .on-empty {
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 9px;
          padding: 30px;
          text-align: center;
          font-size: 11px;
          color: #7f8a94;
        }

        @media(max-width:700px) {
          .on-page {
            padding: 18px;
          }

          .on-summary {
            grid-template-columns: 1fr;
          }

          .on-head {
            flex-direction: column;
          }

          .on-actions {
            width: 100%;
          }

          .on-action-btn {
            flex: 1;
          }

          .on-card {
            grid-template-columns:
              40px 1fr;
          }

          .on-card > button,
          .on-read-status {
            grid-column: 2;
          }
        }
      `}</style>

      <main className="on-page">

        <div className="on-head">

          <div>
            <h1>Notifications</h1>

            <p>
              Operational notifications for your
              Taxi Operator account.
            </p>
          </div>

          <div className="on-actions">

            <button
              type="button"
              className="on-action-btn"
              onClick={() =>
                loadNotifications(true)
              }
              disabled={
                loading ||
                actionLoading
              }
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              type="button"
              className="on-action-btn"
              onClick={markAllRead}
              disabled={
                unread === 0 ||
                actionLoading
              }
              title={
                unread === 0
                  ? "There are no unread notifications."
                  : "Mark all unread notifications as read."
              }
            >
              {actionLoading
                ? "Updating..."
                : "Mark All Read"}
            </button>

          </div>
        </div>

        {error && (
          <div className="on-message on-error">
            {error}
          </div>
        )}

        {success && (
          <div className="on-message on-success">
            {success}
          </div>
        )}

        <div className="on-summary">

          <div className="on-stat">
            <span>TOTAL</span>
            <h2>{items.length}</h2>
          </div>

          <div className="on-stat">
            <span>UNREAD</span>
            <h2>{unread}</h2>
          </div>

          <div className="on-stat">
            <span>READ</span>
            <h2>{read}</h2>
          </div>

        </div>

        <div className="on-filters">

          {types.map((type) => (
            <button
              type="button"
              key={type}
              className={`on-filter ${
                filter === type
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setFilter(type)
              }
            >
              {type === "ALL"
                ? "All"
                : formatText(type)}
            </button>
          ))}

        </div>

        {loading ? (
          <div className="on-loading">
            Loading notifications...
          </div>
        ) : (
          <div className="on-list">

            {filtered.map(
              (notification) => (
                <div
                  key={
                    notification.notificationId
                  }
                  className={`on-card ${
                    !notification.isRead
                      ? "unread"
                      : ""
                  }`}
                >
                  <div className="on-icon">
                    {getIcon(
                      notification.notificationType
                    )}
                  </div>

                  <div>
                    <h3>
                      {notification.title ||
                        formatText(
                          notification.notificationType
                        )}
                    </h3>

                    <p>
                      {notification.message}
                    </p>

                    <small>
                      {timeAgo(
                        notification.createdAt
                      )}
                    </small>
                  </div>

                  {!notification.isRead ? (
                    <button
                      type="button"
                      className="on-read"
                      disabled={
                        actionLoading
                      }
                      onClick={() =>
                        markRead(
                          notification.notificationId
                        )
                      }
                    >
                      Mark Read
                    </button>
                  ) : (
                    <span className="on-read-status">
                      Read
                    </span>
                  )}
                </div>
              )
            )}

            {filtered.length === 0 && (
              <div className="on-empty">
                No notifications found.
              </div>
            )}

          </div>
        )}

      </main>
    </>
  );
}

export default OperationsNotifications;