import { useEffect, useState } from "react";

const API_BASE_URL = "/api";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const safeJson = async (response) => {
  const raw = await response.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
};

const formatText = (value) =>
  (value || "—")
    .toString()
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());


function SuperAdminDashboard() {
  const [report, setReport] = useState(null);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [reportRes, usersRes, bookingsRes, vehiclesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/reports/dashboard`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/users`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/bookings`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/vehicles`, { headers: authHeaders() }),
      ]);

      const [r, u, b, v] = await Promise.all([
        safeJson(reportRes),
        safeJson(usersRes),
        safeJson(bookingsRes),
        safeJson(vehiclesRes),
      ]);

      if (!reportRes.ok) throw new Error(r?.message || "Unable to load dashboard report.");

      setReport(r);
      setUsers(Array.isArray(u) ? u : []);
      setBookings(Array.isArray(b) ? b : []);
      setVehicles(Array.isArray(v) ? v : []);
    } catch (e) {
      setError(e.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  const available = vehicles.filter((v) => v.operationalStatus === "AVAILABLE").length;
  const onRide = vehicles.filter((v) => v.operationalStatus === "ON_RIDE").length;
  const offline = vehicles.filter((v) => v.operationalStatus === "OFFLINE").length;
  const gps = vehicles.filter((v) => v.gpsAvailable).length;

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div>
          <h1>Super Admin Dashboard</h1>
          <p>Monitor the overall Makumbura Taxi Management System.</p>
        </div>
        <span className="sa-badge green">{loading ? "Loading..." : "System Online"}</span>
      </div>

      {error && <div className="sa-info-box"><strong>Error</strong><p>{error}</p></div>}

      <div className="sa-summary-grid">
        <div className="sa-summary-card"><span>Total Bookings</span><h2>{report?.bookings?.total ?? 0}</h2></div>
        <div className="sa-summary-card"><span>Registered Drivers</span><h2>{report?.drivers?.total ?? 0}</h2></div>
        <div className="sa-summary-card"><span>Active Vehicles</span><h2>{report?.vehicles?.total ?? 0}</h2></div>
        <div className="sa-summary-card"><span>Registered Users</span><h2>{users.length}</h2></div>
      </div>

      <div className="sa-grid-2">
        <section className="sa-card">
          <h2>Vehicle Status</h2>
          <div className="sa-detail-grid">
            <div className="sa-detail"><span>Available</span><strong>{available} Vehicles</strong></div>
            <div className="sa-detail"><span>On Ride</span><strong>{onRide} Vehicles</strong></div>
            <div className="sa-detail"><span>Offline</span><strong>{offline} Vehicles</strong></div>
            <div className="sa-detail"><span>GPS Available</span><strong>{gps} Vehicles</strong></div>
          </div>
        </section>

        <section className="sa-card">
          <h2>Current Operations</h2>
          <div className="sa-detail-grid">
            <div className="sa-detail"><span>Today</span><strong>{report?.bookings?.today ?? 0} Bookings</strong></div>
            <div className="sa-detail"><span>Active</span><strong>{report?.bookings?.active ?? 0} Bookings</strong></div>
            <div className="sa-detail"><span>Completed</span><strong>{report?.bookings?.completed ?? 0} Trips</strong></div>
            <div className="sa-detail"><span>Cancelled</span><strong>{report?.bookings?.cancelled ?? 0} Bookings</strong></div>
          </div>
        </section>
      </div>

      <section className="sa-card">
        <h2>Recent Bookings</h2>
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead><tr><th>Booking ID</th><th>Passenger</th><th>Source</th><th>Pickup</th><th>Destination</th><th>Status</th></tr></thead>
            <tbody>
              {recentBookings.length === 0 ? (
                <tr><td colSpan="6">No bookings found.</td></tr>
              ) : (
                recentBookings.map((b) => (
                  <tr key={b.bookingId}>
                    <td className="sa-id">BK{String(b.bookingId).padStart(3, "0")}</td>
                    <td>{b.passengerName}</td>
                    <td>{formatText(b.bookingSource)}</td>
                    <td>{b.pickupLocation}</td>
                    <td>{b.destination}</td>
                    <td>
                      <span className={`sa-badge ${
                        b.bookingStatus === "COMPLETED"
                          ? "green"
                          : b.bookingStatus === "CANCELLED"
                          ? "red"
                          : "blue"
                      }`}>
                        {formatText(b.bookingStatus)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default SuperAdminDashboard;
