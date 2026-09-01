import { useState } from "react";

function OperationsManagement() {
  const [officers, setOfficers] = useState([
    {
      id: "OP001",
      name: "Amal Fernando",
      phone: "0711111111",
      email: "amal@mmc.lk",
      shift: "Morning",
      status: "Active",
    },
    {
      id: "OP002",
      name: "Nimali Silva",
      phone: "0772222222",
      email: "nimali.ops@mmc.lk",
      shift: "Morning",
      status: "Active",
    },
    {
      id: "OP003",
      name: "Kasun Jayasuriya",
      phone: "0753333333",
      email: "kasun.ops@mmc.lk",
      shift: "Evening",
      status: "Inactive",
    },
  ]);

  const [search, setSearch] = useState("");
  const [shift, setShift] = useState("All");
  const [status, setStatus] = useState("All");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const filtered = officers.filter((item) => {
    const text =
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase());

    const shiftMatch = shift === "All" || item.shift === shift;
    const statusMatch = status === "All" || item.status === status;

    return text && shiftMatch && statusMatch;
  });

  const toggleStatus = (id) => {
    setOfficers(
      officers.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "Active" ? "Inactive" : "Active",
            }
          : item
      )
    );
  };

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div>
          <h1>Taxi Operations Management</h1>
          <p>
            Manage Taxi Operations Officer accounts and daily booking operations.
          </p>
        </div>

        <button
          className="sa-primary-btn"
          onClick={() => alert("Add Operations Officer form - frontend demo")}
        >
          + Add Operations Officer
        </button>
      </div>

      <div className="sa-summary-grid">
        <div className="sa-summary-card">
          <span>Total Officers</span>
          <h2>{officers.length}</h2>
        </div>

        <div className="sa-summary-card">
          <span>Active Officers</span>
          <h2>{officers.filter((o) => o.status === "Active").length}</h2>
        </div>

        <div className="sa-summary-card">
          <span>Morning Shift</span>
          <h2>{officers.filter((o) => o.shift === "Morning").length}</h2>
        </div>

        <div className="sa-summary-card">
          <span>Evening Shift</span>
          <h2>{officers.filter((o) => o.shift === "Evening").length}</h2>
        </div>
      </div>

      <section className="sa-card">
        <h2>Taxi Operations Responsibilities</h2>

        <div className="sa-grid-2">
          <div className="sa-detail">
            <span>Website Bookings</span>
            <strong>Monitor and coordinate online passenger bookings.</strong>
          </div>

          <div className="sa-detail">
            <span>Phone Bookings</span>
            <strong>Create bookings for passengers who call MMC.</strong>
          </div>

          <div className="sa-detail">
            <span>On-Site Bookings</span>
            <strong>Create bookings at the Makumbura taxi counter.</strong>
          </div>

          <div className="sa-detail">
            <span>Operational Monitoring</span>
            <strong>Monitor drivers, vehicles and trip status.</strong>
          </div>
        </div>
      </section>

      <section className="sa-card">
        <div className="sa-toolbar">
          <input
            className="sa-input"
            placeholder="Search operations officer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="sa-select"
            value={shift}
            onChange={(e) => setShift(e.target.value)}
          >
            <option value="All">All Shifts</option>
            <option value="Morning">Morning</option>
            <option value="Evening">Evening</option>
          </select>

          <select
            className="sa-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Officer ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Shift</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((officer) => (
                <tr key={officer.id}>
                  <td className="sa-id">{officer.id}</td>
                  <td>{officer.name}</td>
                  <td>{officer.phone}</td>
                  <td>{officer.email}</td>
                  <td>{officer.shift}</td>
                  <td>
                    <span
                      className={`sa-badge ${
                        officer.status === "Active" ? "green" : "red"
                      }`}
                    >
                      {officer.status}
                    </span>
                  </td>

                  <td>
                    <div className="sa-actions">
                      <button
                        className="sa-btn-view"
                        onClick={() => {
                          setSelected(officer);
                          setModal("view");
                        }}
                      >
                        View
                      </button>

                      <button
                        className="sa-btn-edit"
                        onClick={() => alert("Edit officer - frontend demo")}
                      >
                        Edit
                      </button>

                      <button
                        className="sa-btn-neutral"
                        onClick={() => toggleStatus(officer.id)}
                      >
                        {officer.status === "Active" ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modal === "view" && selected && (
        <div className="sa-modal-overlay">
          <div className="sa-modal">
            <div className="sa-modal-header">
              <h2>Operations Officer Details</h2>

              <button className="sa-close" onClick={() => setModal(null)}>
                ×
              </button>
            </div>

            <div className="sa-modal-body">
              <div className="sa-detail-grid">
                <div className="sa-detail">
                  <span>Officer ID</span>
                  <strong>{selected.id}</strong>
                </div>

                <div className="sa-detail">
                  <span>Name</span>
                  <strong>{selected.name}</strong>
                </div>

                <div className="sa-detail">
                  <span>Phone</span>
                  <strong>{selected.phone}</strong>
                </div>

                <div className="sa-detail">
                  <span>Email</span>
                  <strong>{selected.email}</strong>
                </div>

                <div className="sa-detail">
                  <span>Shift</span>
                  <strong>{selected.shift}</strong>
                </div>

                <div className="sa-detail">
                  <span>Status</span>
                  <strong>{selected.status}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default OperationsManagement;