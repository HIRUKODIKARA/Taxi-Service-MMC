import { useEffect, useMemo, useState } from "react";

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


function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const loadBookings = async () => {
    try {
      setError("");
      const response = await fetch(`${API_BASE_URL}/bookings`, { headers: authHeaders() });
      const data = await safeJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to load bookings.");
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Unable to load bookings.");
    }
  };

  useEffect(() => { loadBookings(); }, []);

  const filtered = useMemo(() => bookings.filter((b) => {
    const q = search.trim().toLowerCase();
    const text = `${b.bookingId} ${b.passengerName || ""} ${b.passengerPhone || ""} ${b.pickupLocation || ""} ${b.destination || ""}`.toLowerCase();
    return (!q || text.includes(q)) &&
      (source === "ALL" || b.bookingSource === source) &&
      (status === "ALL" || b.bookingStatus === status);
  }), [bookings, search, source, status]);

  const pending = bookings.filter((b) => ["PENDING", "WAITING_FOR_DRIVER"].includes(b.bookingStatus)).length;
  const active = bookings.filter((b) => ["ACCEPTED", "DRIVER_ARRIVING", "ON_RIDE"].includes(b.bookingStatus)).length;
  const completed = bookings.filter((b) => b.bookingStatus === "COMPLETED").length;

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div><h1>Booking Management</h1><p>Monitor website, phone and on-site taxi bookings.</p></div>
        <button className="sa-btn-neutral" onClick={loadBookings}>Refresh</button>
      </div>

      {error && <div className="sa-info-box"><strong>Error</strong><p>{error}</p></div>}

      <div className="sa-summary-grid">
        <div className="sa-summary-card"><span>Total Bookings</span><h2>{bookings.length}</h2></div>
        <div className="sa-summary-card"><span>Pending</span><h2>{pending}</h2></div>
        <div className="sa-summary-card"><span>Active Trips</span><h2>{active}</h2></div>
        <div className="sa-summary-card"><span>Completed</span><h2>{completed}</h2></div>
      </div>

      <section className="sa-card">
        <div className="sa-toolbar">
          <input className="sa-input" placeholder="Search booking, passenger or location..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="sa-select" value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="ALL">All Sources</option>
            <option value="WEBSITE">Website</option>
            <option value="PHONE">Phone</option>
            <option value="ON_SITE">On-Site</option>
          </select>
          <select className="sa-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All Status</option>
            {["PENDING","WAITING_FOR_DRIVER","ACCEPTED","DRIVER_ARRIVING","ON_RIDE","COMPLETED","CANCELLED","REJECTED"].map((s) => (
              <option key={s} value={s}>{formatText(s)}</option>
            ))}
          </select>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead><tr><th>ID</th><th>Passenger</th><th>Source</th><th>Pickup</th><th>Destination</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7">No bookings found.</td></tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.bookingId}>
                    <td className="sa-id">BK{String(b.bookingId).padStart(3, "0")}</td>
                    <td>{b.passengerName}<br/><small>{b.passengerPhone}</small></td>
                    <td>{formatText(b.bookingSource)}</td>
                    <td>{b.pickupLocation}</td>
                    <td>{b.destination}</td>
                    <td><span className="sa-badge blue">{formatText(b.bookingStatus)}</span></td>
                    <td><button className="sa-btn-view" onClick={() => setSelected(b)}>View</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <div className="sa-modal-overlay">
          <div className="sa-modal">
            <div className="sa-modal-header">
              <h2>Booking BK{String(selected.bookingId).padStart(3, "0")}</h2>
              <button className="sa-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="sa-modal-body">
              <div className="sa-detail-grid">
                <div className="sa-detail"><span>Passenger</span><strong>{selected.passengerName}</strong></div>
                <div className="sa-detail"><span>Phone</span><strong>{selected.passengerPhone}</strong></div>
                <div className="sa-detail"><span>Pickup</span><strong>{selected.pickupLocation}</strong></div>
                <div className="sa-detail"><span>Destination</span><strong>{selected.destination}</strong></div>
                <div className="sa-detail"><span>Source</span><strong>{formatText(selected.bookingSource)}</strong></div>
                <div className="sa-detail"><span>Status</span><strong>{formatText(selected.bookingStatus)}</strong></div>
                <div className="sa-detail"><span>Assigned Driver ID</span><strong>{selected.assignedDriverId ?? "Not Assigned"}</strong></div>
                <div className="sa-detail"><span>Assigned Vehicle ID</span><strong>{selected.assignedVehicleId ?? "Not Assigned"}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default BookingManagement;
