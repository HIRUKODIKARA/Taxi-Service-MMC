import { useState } from "react";

function OperationsNotifications() {
  const [filter, setFilter] = useState("All");

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "Booking",
      title: "New Website Booking",
      message:
        "Booking BK001 has been created by Nadeesha Perera for Colombo.",
      time: "2 minutes ago",
      read: false,
    },
    {
      id: 2,
      type: "Driver",
      title: "Driver Accepted Booking",
      message:
        "Kasun Perera accepted booking BK001. Vehicle WP CAB-1234 assigned.",
      time: "5 minutes ago",
      read: false,
    },
    {
      id: 3,
      type: "Booking",
      title: "Phone Booking Created",
      message:
        "Booking BK002 was created by Taxi Operations through a phone call.",
      time: "12 minutes ago",
      read: true,
    },
    {
      id: 4,
      type: "Vehicle",
      title: "Vehicle Became Available",
      message:
        "Vehicle WP CAA-7788 is now available for a new booking.",
      time: "20 minutes ago",
      read: true,
    },
    {
      id: 5,
      type: "Driver",
      title: "Driver Went Offline",
      message:
        "Driver Amal Jay is currently offline. Vehicle WP BCD-7890 is unavailable.",
      time: "35 minutes ago",
      read: false,
    },
    {
      id: 6,
      type: "System",
      title: "GPS Connection Lost",
      message:
        "GPS connection for vehicle WP BCD-7890 has been disconnected.",
      time: "40 minutes ago",
      read: true,
    },
  ]);

  const filteredNotifications =
    filter === "All"
      ? notifications
      : notifications.filter(
          (notification) => notification.type === filter
        );

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  const getIcon = (type) => {
    if (type === "Booking") return "📋";
    if (type === "Driver") return "👤";
    if (type === "Vehicle") return "🚗";
    return "⚙️";
  };

  const getTypeClass = (type) => {
    return `notification-type ${type.toLowerCase()}`;
  };

  return (
    <>
      <style>{`
        .notifications-page {
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .notifications-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .notifications-header h1 {
          margin: 0 0 6px;
          color: #0b2946;
          font-size: 28px;
          font-weight: 800;
        }

        .notifications-header p {
          margin: 0;
          color: #7b8794;
          font-size: 13px;
        }

        .mark-all-btn {
          border: none;
          background: #0b2946;
          color: white;
          padding: 10px 15px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .mark-all-btn:hover {
          background: #123d64;
        }

        .notifications-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .notification-summary-card {
          background: white;
          border: 1px solid #e3e8ed;
          border-radius: 9px;
          padding: 18px;
          box-shadow: 0 3px 12px rgba(11,41,70,0.04);
        }

        .notification-summary-card span {
          color: #89949e;
          font-size: 10px;
        }

        .notification-summary-card h3 {
          margin: 7px 0 0;
          color: #0b2946;
          font-size: 23px;
        }

        .notification-filters {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
          margin-bottom: 18px;
          padding: 13px;
          background: white;
          border: 1px solid #e3e8ed;
          border-radius: 9px;
        }

        .notification-filter-btn {
          border: 1px solid #d8e0e6;
          background: white;
          color: #607080;
          padding: 8px 13px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .notification-filter-btn.active {
          background: #f6c20d;
          border-color: #f6c20d;
          color: #0b2946;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        .notification-card {
          display: grid;
          grid-template-columns: 50px 1fr auto;
          gap: 15px;
          align-items: center;
          padding: 17px;
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 9px;
          box-shadow: 0 3px 12px rgba(11,41,70,0.04);
        }

        .notification-card.unread {
          border-left: 4px solid #f6c20d;
          background: #fffdf5;
        }

        .notification-icon {
          width: 46px;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f8;
          border-radius: 9px;
          font-size: 20px;
        }

        .notification-content {
          min-width: 0;
        }

        .notification-top {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 5px;
        }

        .notification-top h3 {
          margin: 0;
          color: #0b2946;
          font-size: 13px;
          font-weight: 800;
        }

        .notification-type {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 8px;
          font-weight: 700;
        }

        .notification-type.booking {
          background: #e6f0ff;
          color: #2b64a1;
        }

        .notification-type.driver {
          background: #e6f6eb;
          color: #237c42;
        }

        .notification-type.vehicle {
          background: #fff4d7;
          color: #8a6b12;
        }

        .notification-type.system {
          background: #f2e8ff;
          color: #7150a1;
        }

        .notification-content p {
          margin: 0 0 6px;
          color: #63717d;
          font-size: 11px;
          line-height: 1.55;
        }

        .notification-time {
          color: #9aa3ac;
          font-size: 9px;
        }

        .notification-action {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notification-unread-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f6c20d;
        }

        .notification-read-btn {
          border: 1px solid #0b2946;
          background: white;
          color: #0b2946;
          padding: 7px 10px;
          border-radius: 5px;
          font-size: 9px;
          font-weight: 700;
          cursor: pointer;
        }

        .notification-read-btn:hover {
          background: #0b2946;
          color: white;
        }

        .notification-read-label {
          color: #8b969f;
          font-size: 9px;
          font-weight: 700;
        }

        .notifications-empty {
          padding: 45px 20px;
          text-align: center;
          background: white;
          border: 1px solid #e3e8ed;
          border-radius: 9px;
          color: #89949e;
          font-size: 12px;
        }

        @media (max-width: 900px) {
          .notifications-summary {
            grid-template-columns: repeat(2, 1fr);
          }

          .notification-card {
            grid-template-columns: 45px 1fr;
          }

          .notification-action {
            grid-column: 2;
          }
        }

        @media (max-width: 600px) {
          .notifications-page {
            padding: 18px;
          }

          .notifications-header {
            flex-direction: column;
          }

          .mark-all-btn {
            width: 100%;
          }

          .notifications-summary {
            grid-template-columns: 1fr;
          }

          .notification-card {
            grid-template-columns: 1fr;
          }

          .notification-icon {
            width: 40px;
            height: 40px;
          }

          .notification-action {
            grid-column: auto;
          }
        }
      `}</style>

      <main className="notifications-page">
        <div className="notifications-header">
          <div>
            <h1>Notifications</h1>

            <p>
              View operational booking, driver, vehicle and system
              notifications.
            </p>
          </div>

          <button
            className="mark-all-btn"
            onClick={markAllAsRead}
          >
            Mark All as Read
          </button>
        </div>

        <div className="notifications-summary">
          <div className="notification-summary-card">
            <span>TOTAL NOTIFICATIONS</span>
            <h3>{notifications.length}</h3>
          </div>

          <div className="notification-summary-card">
            <span>UNREAD</span>
            <h3>{unreadCount}</h3>
          </div>

          <div className="notification-summary-card">
            <span>BOOKING ALERTS</span>

            <h3>
              {
                notifications.filter(
                  (notification) =>
                    notification.type === "Booking"
                ).length
              }
            </h3>
          </div>

          <div className="notification-summary-card">
            <span>DRIVER ALERTS</span>

            <h3>
              {
                notifications.filter(
                  (notification) =>
                    notification.type === "Driver"
                ).length
              }
            </h3>
          </div>
        </div>

        <div className="notification-filters">
          {[
            "All",
            "Booking",
            "Driver",
            "Vehicle",
            "System",
          ].map((item) => (
            <button
              key={item}
              className={`notification-filter-btn ${
                filter === item ? "active" : ""
              }`}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="notifications-list">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-card ${
                !notification.read ? "unread" : ""
              }`}
            >
              <div className="notification-icon">
                {getIcon(notification.type)}
              </div>

              <div className="notification-content">
                <div className="notification-top">
                  <h3>{notification.title}</h3>

                  <span
                    className={getTypeClass(
                      notification.type
                    )}
                  >
                    {notification.type}
                  </span>
                </div>

                <p>{notification.message}</p>

                <span className="notification-time">
                  {notification.time}
                </span>
              </div>

              <div className="notification-action">
                {!notification.read ? (
                  <>
                    <span className="notification-unread-dot"></span>

                    <button
                      className="notification-read-btn"
                      onClick={() =>
                        markAsRead(notification.id)
                      }
                    >
                      Mark Read
                    </button>
                  </>
                ) : (
                  <span className="notification-read-label">
                    Read
                  </span>
                )}
              </div>
            </div>
          ))}

          {filteredNotifications.length === 0 && (
            <div className="notifications-empty">
              No notifications found.
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default OperationsNotifications;