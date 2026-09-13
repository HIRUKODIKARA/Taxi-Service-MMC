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


function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    nic: "",
    password: "",
    confirmPassword: "",
    role: "PASSENGER",
  });

  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    nic: "",
  });

  const loadUsers = async () => {
    try {
      setError("");
      const res = await fetch(`${API_BASE_URL}/users`, { headers: authHeaders() });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Unable to load users.");
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Unable to load users.");
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const roleOf = (u) => (u.roles && u.roles[0]) || "";
  const roleName = (r) => r === "TAXI_OPERATIONS" ? "Taxi Operator" : formatText(r);

  const filtered = useMemo(() => users.filter((u) => {
    const q = search.toLowerCase();
    const text = `${u.fullName || ""} ${u.email || ""} ${u.phone || ""} ${u.nic || ""}`.toLowerCase();
    return (!q || text.includes(q)) &&
      (roleFilter === "ALL" || roleOf(u) === roleFilter) &&
      (statusFilter === "ALL" || u.accountStatus === statusFilter);
  }), [users, search, roleFilter, statusFilter]);

  const createUser = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      if (form.password !== form.confirmPassword) {
        throw new Error("Password and Confirm Password do not match.");
      }

      const res = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Unable to create user.");

      setMessage("User created successfully.");
      setShowCreate(false);
      setForm({
        fullName: "",
        email: "",
        phone: "",
        nic: "",
        password: "",
        confirmPassword: "",
        role: "PASSENGER",
      });
      await loadUsers();
    } catch (e) {
      setError(e.message);
    }
  };

  const openEdit = (u) => {
    setEditing(u);
    setEditForm({
      fullName: u.fullName || "",
      email: u.email || "",
      phone: u.phone || "",
      nic: u.nic || "",
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE_URL}/users/${editing.userId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(editForm),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Unable to update user.");

      setMessage("User updated successfully.");
      setEditing(null);
      await loadUsers();
    } catch (e) {
      setError(e.message);
    }
  };

  const changeStatus = async (u, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${u.userId}/status`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Unable to change status.");

      setMessage("User status updated.");
      await loadUsers();
    } catch (e) {
      setError(e.message);
    }
  };

  const resetPassword = async (u) => {
    const password = window.prompt(`New password for ${u.fullName}:`);
    if (!password) return;

    const confirmPassword = window.prompt("Confirm new password:");
    if (confirmPassword === null) return;

    try {
      const res = await fetch(`${API_BASE_URL}/password/admin-reset/${u.userId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          newPassword: password,
          confirmPassword,
        }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Unable to reset password.");

      setMessage("Password reset successfully.");
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div><h1>User Management</h1><p>Create and manage system users and account status.</p></div>
        <button className="sa-primary-btn" onClick={() => setShowCreate(true)}>+ Create User</button>
      </div>

      {error && <div className="sa-info-box"><strong>Error</strong><p>{error}</p></div>}
      {message && <div className="sa-info-box"><strong>Success</strong><p>{message}</p></div>}

      <div className="sa-summary-grid">
        <div className="sa-summary-card"><span>Total Users</span><h2>{users.length}</h2></div>
        <div className="sa-summary-card"><span>Active Users</span><h2>{users.filter((u) => u.accountStatus === "ACTIVE").length}</h2></div>
        <div className="sa-summary-card"><span>Taxi Operators</span><h2>{users.filter((u) => roleOf(u) === "TAXI_OPERATIONS").length}</h2></div>
        <div className="sa-summary-card"><span>Drivers</span><h2>{users.filter((u) => roleOf(u) === "DRIVER").length}</h2></div>
      </div>

      <section className="sa-card">
        <div className="sa-toolbar">
          <input className="sa-input" placeholder="Search name, email, phone or NIC..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="sa-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="ALL">All Roles</option>
            {["SUPER_ADMIN","ADMIN","TAXI_OPERATIONS","DRIVER","PASSENGER"].map((r) => (
              <option key={r} value={r}>{roleName(r)}</option>
            ))}
          </select>
          <select className="sa-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <button className="sa-btn-neutral" onClick={loadUsers}>Refresh</button>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead><tr><th>User ID</th><th>Name</th><th>Email</th><th>Phone</th><th>NIC</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="8">No users found.</td></tr>
              ) : (
                filtered.map((u) => {
                  const role = roleOf(u);
                  const protectedUser = role === "SUPER_ADMIN";

                  return (
                    <tr key={u.userId}>
                      <td className="sa-id">USR{String(u.userId).padStart(3, "0")}</td>
                      <td>{u.fullName}</td>
                      <td>{u.email}</td>
                      <td>{u.phone}</td>
                      <td>{u.nic || "—"}</td>
                      <td>{roleName(role)}</td>
                      <td><span className={`sa-badge ${u.accountStatus === "ACTIVE" ? "green" : u.accountStatus === "SUSPENDED" ? "red" : "gray"}`}>{formatText(u.accountStatus)}</span></td>
                      <td>
                        <div className="sa-actions">
                          <button className="sa-btn-view" onClick={() => openEdit(u)}>Edit</button>

                          {!protectedUser && (
                            <>
                              <button className="sa-btn-neutral" onClick={() => changeStatus(u, u.accountStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE")}>
                                {u.accountStatus === "ACTIVE" ? "Disable" : "Enable"}
                              </button>

                              <button className="sa-btn-edit" onClick={() => resetPassword(u)}>
                                Reset Password
                              </button>
                            </>
                          )}
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

      {showCreate && (
        <div className="sa-modal-overlay">
          <div className="sa-modal">
            <div className="sa-modal-header">
              <h2>Create User</h2>
              <button className="sa-close" onClick={() => setShowCreate(false)}>×</button>
            </div>

            <form onSubmit={createUser}>
              <div className="sa-modal-body">
                <div className="sa-form-grid">
                  {["fullName","email","phone","nic","password","confirmPassword"].map((name) => (
                    <div className="sa-field" key={name}>
                      <label>{formatText(name)}</label>
                      <input
                        type={name.toLowerCase().includes("password") ? "password" : name === "email" ? "email" : "text"}
                        value={form[name]}
                        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                        required={name !== "nic"}
                      />
                    </div>
                  ))}

                  <div className="sa-field">
                    <label>Role</label>
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                      <option value="PASSENGER">Passenger</option>
                      <option value="DRIVER">Driver</option>
                      <option value="TAXI_OPERATIONS">Taxi Operator</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="sa-modal-footer">
                <button type="button" className="sa-btn-neutral" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="sa-primary-btn" type="submit">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editing && (
        <div className="sa-modal-overlay">
          <div className="sa-modal">
            <div className="sa-modal-header">
              <h2>Edit User</h2>
              <button className="sa-close" onClick={() => setEditing(null)}>×</button>
            </div>

            <form onSubmit={saveEdit}>
              <div className="sa-modal-body">
                <div className="sa-form-grid">
                  {["fullName","email","phone","nic"].map((name) => (
                    <div className="sa-field" key={name}>
                      <label>{formatText(name)}</label>
                      <input
                        value={editForm[name]}
                        onChange={(e) => setEditForm({ ...editForm, [name]: e.target.value })}
                        required={name !== "nic"}
                      />
                    </div>
                  ))}
                </div>

                <div className="sa-info-box">
                  <strong>Role</strong>
                  <p>{roleName(roleOf(editing))} — the current backend does not yet expose an existing-user role-change endpoint.</p>
                </div>
              </div>

              <div className="sa-modal-footer">
                <button type="button" className="sa-btn-neutral" onClick={() => setEditing(null)}>Cancel</button>
                <button className="sa-primary-btn" type="submit">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default UserManagement;
