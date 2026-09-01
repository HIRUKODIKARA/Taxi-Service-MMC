import { useState } from "react";

function ActivityMonitoring() {
  const [filter, setFilter] = useState("All");

  const activities = [
    {
      id: 1,
      type: "Booking",
      user: "Taxi Operations",
      action: "Created phone booking BK002",
      time: "10:35 AM",
    },
    {
      id: 2,
      type: "Driver",
      user: "Kasun Perera",
      action: "Accepted booking BK001",
      time: "10:28 AM",
    },
    {
      id: 3,
      type: "Vehicle",
      user: "System",
      action: "Vehicle WP AAB-4567 changed status to On Ride",
      time: "10:26 AM",
    },
    {
      id: 4,
      type: "Admin",
      user: "Super Admin",
      action: "Updated TMS Operator account ADM002",
      time: "09:50 AM",
    },
  ];

  const filtered =
    filter === "All"
      ? activities
      : activities.filter((activity) => activity.type === filter);

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div>
          <h1>Activity Monitoring</h1>
          <p>Monitor important user and system activities.</p>
        </div>
      </div>

      <div className="sa-summary-grid">
        <div className="sa-summary-card">
          <span>Activities Today</span>
          <h2>24</h2>
        </div>

        <div className="sa-summary-card">
          <span>Booking Events</span>
          <h2>10</h2>
        </div>

        <div className="sa-summary-card">
          <span>Driver Events</span>
          <h2>8</h2>
        </div>

        <div className="sa-summary-card">
          <span>System Alerts</span>
          <h2>2</h2>
        </div>
      </div>

      <section className="sa-card">
        <div className="sa-toolbar">
          <select
            className="sa-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Activity</option>
            <option value="Booking">Booking</option>
            <option value="Driver">Driver</option>
            <option value="Vehicle">Vehicle</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>User / Source</th>
                <th>Activity</th>
                <th>Time</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((activity) => (
                <tr key={activity.id}>
                  <td>
                    <span className="sa-badge blue">
                      {activity.type}
                    </span>
                  </td>

                  <td className="sa-id">{activity.user}</td>
                  <td>{activity.action}</td>
                  <td>{activity.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default ActivityMonitoring;