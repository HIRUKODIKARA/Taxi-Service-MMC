import { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:5171/api";

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


function DriverVerification() {
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [details, setDetails] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      setError("");

      const [dRes, uRes] = await Promise.all([
        fetch(`${API_BASE_URL}/drivers`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/users`, { headers: authHeaders() }),
      ]);

      const [d, u] = await Promise.all([safeJson(dRes), safeJson(uRes)]);
      if (!dRes.ok) throw new Error(d?.message || "Unable to load drivers.");

      const list = Array.isArray(d) ? d : [];
      setDrivers(list);
      setUsers(Array.isArray(u) ? u : []);

      const results = await Promise.all(
        list.map(async (driver) => {
          const res = await fetch(`${API_BASE_URL}/drivers/${driver.driverId}/verification`, { headers: authHeaders() });
          return [driver.driverId, res.ok ? await safeJson(res) : null];
        })
      );

      setDetails(Object.fromEntries(results));
    } catch (e) {
      setError(e.message || "Unable to load verification data.");
    }
  };

  useEffect(() => { loadData(); }, []);

  const documentAction = async (documentId, action) => {
    try {
      setError("");
      setMessage("");

      const options = { method: "PUT", headers: authHeaders() };

      if (action === "reject") {
        const reason = window.prompt(
          "Reason for rejecting this document:",
          "Document does not meet verification requirements."
        );
        if (reason === null) return;
        options.body = JSON.stringify({ reason });
      }

      const res = await fetch(`${API_BASE_URL}/driverdocuments/${documentId}/${action}`, options);
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || `Unable to ${action} document.`);

      setMessage(`Document ${action} action completed.`);
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  };

  const driverAction = async (driverId, action) => {
    try {
      setError("");
      setMessage("");

      const options = { method: "PUT", headers: authHeaders() };

      if (action === "reject") {
        const reason = window.prompt(
          "Reason for rejecting this driver:",
          "Driver verification requirements were not satisfied."
        );
        if (reason === null) return;
        options.body = JSON.stringify({ reason });
      }

      const res = await fetch(`${API_BASE_URL}/drivers/${driverId}/${action}`, options);
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || `Unable to ${action} driver.`);

      setMessage(`Driver ${action} action completed successfully.`);
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div><h1>Driver Verification</h1><p>Review driver documents and approve verified applicants.</p></div>
        <button className="sa-btn-neutral" onClick={loadData}>Refresh</button>
      </div>

      {error && <div className="sa-info-box"><strong>Error</strong><p>{error}</p></div>}
      {message && <div className="sa-info-box"><strong>Success</strong><p>{message}</p></div>}

      <div className="sa-summary-grid three">
        <div className="sa-summary-card"><span>Total Drivers</span><h2>{drivers.length}</h2></div>
        <div className="sa-summary-card"><span>Pending</span><h2>{drivers.filter((d) => d.verificationStatus === "PENDING").length}</h2></div>
        <div className="sa-summary-card"><span>Approved</span><h2>{drivers.filter((d) => d.verificationStatus === "APPROVED").length}</h2></div>
      </div>

      <section className="sa-card">
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead><tr><th>Driver</th><th>License</th><th>Documents</th><th>Verification</th><th>Actions</th></tr></thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr><td colSpan="5">No driver records found.</td></tr>
              ) : (
                drivers.map((d) => {
                  const user = users.find((u) => Number(u.userId) === Number(d.userId)) || {};
                  const info = details[d.driverId];

                  return (
                    <tr key={d.driverId}>
                      <td><strong>{user.fullName || `Driver #${d.driverId}`}</strong><br/><small>{user.phone || ""}</small></td>
                      <td>{d.drivingLicenseNo}</td>
                      <td>
                        {info?.documents?.map((doc) => (
                          <div key={doc.documentType} style={{ marginBottom: 7 }}>
                            <strong>{formatText(doc.documentType)}:</strong> {formatText(doc.verificationStatus)}
                            {doc.documentId && doc.verificationStatus !== "APPROVED" && (
                              <span className="sa-actions" style={{ marginLeft: 7, display: "inline-flex" }}>
                                <button className="sa-btn-edit" onClick={() => documentAction(doc.documentId, "approve")}>Approve</button>
                                <button className="sa-btn-danger" onClick={() => documentAction(doc.documentId, "reject")}>Reject</button>
                              </span>
                            )}
                          </div>
                        )) || "Loading..."}
                      </td>
                      <td><span className={`sa-badge ${d.verificationStatus === "APPROVED" ? "green" : d.verificationStatus === "REJECTED" ? "red" : "yellow"}`}>{formatText(d.verificationStatus)}</span></td>
                      <td>
                        <div className="sa-actions">
                          {d.verificationStatus !== "APPROVED" && <button className="sa-btn-edit" onClick={() => driverAction(d.driverId, "approve")}>Approve Driver</button>}
                          {d.verificationStatus !== "REJECTED" && <button className="sa-btn-danger" onClick={() => driverAction(d.driverId, "reject")}>Reject</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default DriverVerification;
