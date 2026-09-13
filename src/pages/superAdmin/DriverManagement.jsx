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


function DriverManagement() {
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [types, setTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      setError("");
      const responses = await Promise.all([
        fetch(`${API_BASE_URL}/drivers`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/users`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/vehicles`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/vehicletypes/all`, { headers: authHeaders() }),
      ]);

      const data = await Promise.all(responses.map(safeJson));
      if (!responses[0].ok) throw new Error(data[0]?.message || "Unable to load drivers.");

      setDrivers(Array.isArray(data[0]) ? data[0] : []);
      setUsers(Array.isArray(data[1]) ? data[1] : []);
      setVehicles(Array.isArray(data[2]) ? data[2] : []);
      setTypes(Array.isArray(data[3]) ? data[3] : []);
    } catch (e) {
      setError(e.message || "Unable to load drivers.");
    }
  };

  useEffect(() => { loadData(); }, []);

  const rows = useMemo(() => drivers.map((d) => {
    const user = users.find((u) => Number(u.userId) === Number(d.userId)) || {};
    const vehicle = vehicles.find((v) => Number(v.driverId) === Number(d.driverId)) || null;
    const type = vehicle ? types.find((t) => Number(t.vehicleTypeId) === Number(vehicle.vehicleTypeId)) : null;
    return { ...d, user, vehicle, type };
  }).filter((r) =>
    `${r.user.fullName || ""} ${r.user.phone || ""} ${r.drivingLicenseNo || ""} ${r.vehicle?.registrationNumber || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  ), [drivers, users, vehicles, types, search]);

  const changeDriverStatus = async (driverId, newStatus) => {
    try {
      setError("");
      setMessage("");
      const res = await fetch(`${API_BASE_URL}/drivers/${driverId}/status`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Unable to update driver status.");
      setMessage("Driver status updated.");
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  };

  const changeAccount = async (row, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${row.userId}/status`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Unable to update account.");
      setMessage("Driver account updated.");
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div><h1>Driver Management</h1><p>Monitor registered MMC taxi drivers and their operational status.</p></div>
        <button className="sa-btn-neutral" onClick={loadData}>Refresh</button>
      </div>

      {error && <div className="sa-info-box"><strong>Error</strong><p>{error}</p></div>}
      {message && <div className="sa-info-box"><strong>Success</strong><p>{message}</p></div>}

      <div className="sa-summary-grid">
        <div className="sa-summary-card"><span>Total Drivers</span><h2>{drivers.length}</h2></div>
        <div className="sa-summary-card"><span>Available</span><h2>{drivers.filter((d) => d.operationalStatus === "AVAILABLE").length}</h2></div>
        <div className="sa-summary-card"><span>On Ride</span><h2>{drivers.filter((d) => d.operationalStatus === "ON_RIDE").length}</h2></div>
        <div className="sa-summary-card"><span>Offline</span><h2>{drivers.filter((d) => d.operationalStatus === "OFFLINE").length}</h2></div>
      </div>

      <section className="sa-card">
        <div className="sa-toolbar">
          <input className="sa-input" placeholder="Search driver, license or vehicle..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead><tr><th>Driver ID</th><th>Name</th><th>Phone</th><th>License</th><th>Vehicle</th><th>Type</th><th>Verification</th><th>Status</th><th>Account</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="10">No drivers found.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.driverId}>
                    <td className="sa-id">DRV{String(r.driverId).padStart(3, "0")}</td>
                    <td>{r.user.fullName || "—"}</td>
                    <td>{r.user.phone || "—"}</td>
                    <td>{r.drivingLicenseNo}</td>
                    <td>{r.vehicle?.registrationNumber || "Not Assigned"}</td>
                    <td>{r.type?.typeName || "—"}</td>
                    <td><span className={`sa-badge ${r.verificationStatus === "APPROVED" ? "green" : r.verificationStatus === "REJECTED" ? "red" : "yellow"}`}>{formatText(r.verificationStatus)}</span></td>
                    <td><span className={`sa-badge ${r.operationalStatus === "AVAILABLE" ? "green" : r.operationalStatus === "ON_RIDE" ? "blue" : "red"}`}>{formatText(r.operationalStatus)}</span></td>
                    <td>{formatText(r.user.accountStatus)}</td>
                    <td>
                      <div className="sa-actions">
                        {r.operationalStatus !== "ON_RIDE" && (
                          <button className="sa-btn-edit" onClick={() => changeDriverStatus(r.driverId, r.operationalStatus === "AVAILABLE" ? "OFFLINE" : "AVAILABLE")}>
                            {r.operationalStatus === "AVAILABLE" ? "Set Offline" : "Set Available"}
                          </button>
                        )}
                        <button className="sa-btn-neutral" onClick={() => changeAccount(r, r.user.accountStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE")}>
                          {r.user.accountStatus === "ACTIVE" ? "Disable" : "Enable"}
                        </button>
                      </div>
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

export default DriverManagement;
