import { useState } from "react";

function PassengerNotifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Driver Accepted",
      message:
        "Kasun Perera accepted booking BK001. Your vehicle is WP CAB-1234.",
      time: "5 minutes ago",
      read: false,
    },
    {
      id: 2,
      title: "Booking Confirmed",
      message:
        "Your booking from Makumbura Multimodal Center to Colombo is confirmed.",
      time: "8 minutes ago",
      read: false,
    },
    {
      id: 3,
      title: "Trip Completed",
      message:
        "Your previous booking BK090 was successfully completed.",
      time: "Yesterday",
      read: true,
    },
  ]);

  const markRead = (id) => {
    setNotifications(
      notifications.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    );
  };

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
          cursor: pointer;
        }

        .passenger-read-label {
          color: #909ba5;
          font-size: 9px;
        }

        @media(max-width: 700px) {
          .passenger-notification-card {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="passenger-notifications-page">
        <h1>Notifications</h1>
        <p>View booking and trip updates.</p>

        <div className="passenger-notification-list">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`passenger-notification-card ${
                !notification.read ? "unread" : ""
              }`}
            >
              <div className="passenger-notification-icon">
                🔔
              </div>

              <div className="passenger-notification-content">
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <span>{notification.time}</span>
              </div>

              {notification.read ? (
                <span className="passenger-read-label">
                  Read
                </span>
              ) : (
                <button
                  className="passenger-mark-read"
                  onClick={() => markRead(notification.id)}
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

export default PassengerNotifications;