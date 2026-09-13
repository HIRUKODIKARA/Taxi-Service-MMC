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


function AdminManagement() {
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
      if (!res.ok) throw new Error(data?.message || "Unable to load admins.");
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Unable to load admins.");
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const admins = useMemo(() => users
    .filter((u) => (u.roles || []).includes("ADMIN"))
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
      if (!res.ok) throw new Error(data?.message || "Unable to update Admin.");
      setMessage("Admin account updated.");
      await loadUsers();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div><h1>Admin Management</h1><p>Manage MMC Taxi Service Admin accounts.</p></div>
        <button className="sa-primary-btn" onClick={() => navigate("/super-admin/users")}>+ Create Admin</button>
      </div>

      {error && <div className="sa-info-box"><strong>Error</strong><p>{error}</p></div>}
      {message && <div className="sa-info-box"><strong>Success</strong><p>{message}</p></div>}

      <div className="sa-summary-grid three">
        <div className="sa-summary-card"><span>Total Admins</span><h2>{admins.length}</h2></div>
        <div className="sa-summary-card"><span>Active</span><h2>{admins.filter((a) => a.accountStatus === "ACTIVE").length}</h2></div>
        <div className="sa-summary-card"><span>Inactive</span><h2>{admins.filter((a) => a.accountStatus !== "ACTIVE").length}</h2></div>
      </div>

      <div className="sa-info-box">
        <strong>Protected Admin Role</strong>
        <p>Admin accounts cannot change their own role, permissions or Super Admin system settings.</p>
      </div>

      <section className="sa-card">
        <div className="sa-toolbar">
          <input className="sa-input" placeholder="Search admin..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead><tr><th>Admin ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {admins.length === 0 ? (
                <tr><td colSpan="7">No Admin accounts found.</td></tr>
              ) : (
                admins.map((a) => (
                  <tr key={a.userId}>
                    <td className="sa-id">ADM{String(a.userId).padStart(3, "0")}</td>
                    <td>{a.fullName}</td>
                    <td>{a.email}</td>
                    <td>{a.phone}</td>
                    <td><span className={`sa-badge ${a.accountStatus === "ACTIVE" ? "green" : "red"}`}>{formatText(a.accountStatus)}</span></td>
                    <td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—"}</td>
                    <td><button className="sa-btn-neutral" onClick={() => changeStatus(a)}>{a.accountStatus === "ACTIVE" ? "Disable" : "Enable"}</button></td>
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

export default AdminManagement;
