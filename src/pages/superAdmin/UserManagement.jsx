import { useState } from "react";

function UserManagement() {
  const [users, setUsers] = useState([
    {
      id: "USR001",
      name: "Nadeesha Perera",
      phone: "0712345678",
      email: "nadeesha@gmail.com",
      bookings: 8,
      status: "Active",
    },
    {
      id: "USR002",
      name: "Saman Silva",
      phone: "0774567890",
      email: "saman@gmail.com",
      bookings: 5,
      status: "Active",
    },
    {
      id: "USR003",
      name: "Dilani Fernando",
      phone: "0756781234",
      email: "dilani@gmail.com",
      bookings: 2,
      status: "Inactive",
    },
  ]);

  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.id.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (id) => {
    setUsers(
      users.map((user) =>
        user.id === id
          ? {
              ...user,
              status: user.status === "Active" ? "Inactive" : "Active",
            }
          : user
      )
    );
  };

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div>
          <h1>User / Passenger Management</h1>
          <p>View and manage registered passenger accounts.</p>
        </div>
      </div>

      <div className="sa-summary-grid three">
        <div className="sa-summary-card">
          <span>Total Passengers</span>
          <h2>{users.length}</h2>
        </div>

        <div className="sa-summary-card">
          <span>Active Users</span>
          <h2>{users.filter((u) => u.status === "Active").length}</h2>
        </div>

        <div className="sa-summary-card">
          <span>Total Bookings</span>
          <h2>{users.reduce((total, u) => total + u.bookings, 0)}</h2>
        </div>
      </div>

      <section className="sa-card">
        <div className="sa-toolbar">
          <input
            className="sa-input"
            placeholder="Search passenger..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Passenger Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Bookings</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td className="sa-id">{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.phone}</td>
                  <td>{user.email}</td>
                  <td>{user.bookings}</td>
                  <td>
                    <span
                      className={`sa-badge ${
                        user.status === "Active" ? "green" : "red"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>

                  <td>
                    <div className="sa-actions">
                      <button
                        className="sa-btn-view"
                        onClick={() =>
                          alert(
                            `${user.name}\n${user.phone}\n${user.email}\nBookings: ${user.bookings}`
                          )
                        }
                      >
                        View
                      </button>

                      <button
                        className="sa-btn-neutral"
                        onClick={() => toggleStatus(user.id)}
                      >
                        {user.status === "Active" ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default UserManagement;