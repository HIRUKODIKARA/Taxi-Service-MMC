import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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


function OperationsManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = async () => {
    try {
      setError("");
      const res = await fetch(`${API_BASE_URL}/users`, { headers: authHeaders() });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Unable to load Taxi Operators.");
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Unable to load Taxi Operators.");
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const operators = useMemo(() => users
    .filter((u) => (u.roles || []).includes("TAXI_OPERATIONS"))
    .filter((u) => `${u.fullName || ""} ${u.email || ""} ${u.phone || ""}`.toLowerCase().includes(search.toLowerCase())),
  [users, search]);

  const changeStatus = async (u) => {
    try {
      const next = u.accountStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const res = await fetch(`${API_BASE_URL}/users/${u.userId}/status`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status: next }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Unable to update Taxi Operator.");
      setMessage("Taxi Operator account updated.");
      await loadUsers();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div><h1>Taxi Operations Management</h1><p>Manage Taxi Operator accounts and operational access.</p></div>
        <button className="sa-primary-btn" onClick={() => navigate("/super-admin/users")}>+ Create Taxi Operator</button>
      </div>

      {error && <div className="sa-info-box"><strong>Error</strong><p>{error}</p></div>}
      {message && <div className="sa-info-box"><strong>Success</strong><p>{message}</p></div>}

      <div className="sa-summary-grid three">
        <div className="sa-summary-card"><span>Total Taxi Operators</span><h2>{operators.length}</h2></div>
        <div className="sa-summary-card"><span>Active</span><h2>{operators.filter((o) => o.accountStatus === "ACTIVE").length}</h2></div>
        <div className="sa-summary-card"><span>Inactive</span><h2>{operators.filter((o) => o.accountStatus !== "ACTIVE").length}</h2></div>
      </div>

      <section className="sa-card">
        <h2>Taxi Operator Responsibilities</h2>
        <div className="sa-grid-2">
          <div className="sa-detail"><span>Website Bookings</span><strong>Monitor and coordinate online bookings.</strong></div>
          <div className="sa-detail"><span>Phone Bookings</span><strong>Create bookings for callers.</strong></div>
          <div className="sa-detail"><span>On-Site Bookings</span><strong>Create bookings at the MMC counter.</strong></div>
          <div className="sa-detail"><span>Operational Monitoring</span><strong>Monitor drivers, vehicles and trip status.</strong></div>
        </div>
      </section>

      <section className="sa-card">
        <div className="sa-toolbar">
          <input className="sa-input" placeholder="Search Taxi Operator..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {operators.length === 0 ? (
                <tr><td colSpan="6">No Taxi Operator accounts found.</td></tr>
              ) : (
                operators.map((o) => (
                  <tr key={o.userId}>
                    <td className="sa-id">USR{String(o.userId).padStart(3, "0")}</td>
                    <td>{o.fullName}</td>
                    <td>{o.phone}</td>
                    <td>{o.email}</td>
                    <td><span className={`sa-badge ${o.accountStatus === "ACTIVE" ? "green" : "red"}`}>{formatText(o.accountStatus)}</span></td>
                    <td><button className="sa-btn-neutral" onClick={() => changeStatus(o)}>{o.accountStatus === "ACTIVE" ? "Disable" : "Enable"}</button></td>
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

export default OperationsManagement;
