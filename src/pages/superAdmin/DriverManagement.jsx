import { useState } from "react";

function DriverManagement() {
  const [drivers, setDrivers] = useState([
    {
      id: "DRV001",
      name: "Kasun Perera",
      phone: "0712345678",
      vehicle: "WP CAB-1234",
      type: "Car",
      status: "Available",
      account: "Active",
    },
    {
      id: "DRV002",
      name: "Nimal Silva",
      phone: "0774567890",
      vehicle: "WP AAB-4567",
      type: "Three-Wheeler",
      status: "On Ride",
      account: "Active",
    },
    {
      id: "DRV003",
      name: "Amal Fernando",
      phone: "0759876543",
      vehicle: "WP BCD-7890",
      type: "Bike",
      status: "Offline",
      account: "Inactive",
    },
  ]);

  const [search, setSearch] = useState("");

  const filtered = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.vehicle.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAccount = (id) => {
    setDrivers(
      drivers.map((d) =>
        d.id === id
          ? {
              ...d,
              account: d.account === "Active" ? "Inactive" : "Active",
            }
          : d
      )
    );
  };

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div>
          <h1>Driver Management</h1>
          <p>Monitor registered MMC taxi drivers and their operational status.</p>
        </div>
      </div>

      <div className="sa-summary-grid">
        <div className="sa-summary-card">
          <span>Total Drivers</span>
          <h2>{drivers.length}</h2>
        </div>

        <div className="sa-summary-card">
          <span>Available</span>
          <h2>{drivers.filter((d) => d.status === "Available").length}</h2>
        </div>

        <div className="sa-summary-card">
          <span>On Ride</span>
          <h2>{drivers.filter((d) => d.status === "On Ride").length}</h2>
        </div>

        <div className="sa-summary-card">
          <span>Offline</span>
          <h2>{drivers.filter((d) => d.status === "Offline").length}</h2>
        </div>
      </div>

      <section className="sa-card">
        <div className="sa-toolbar">
          <input
            className="sa-input"
            placeholder="Search driver or vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Driver ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Vehicle</th>
                <th>Type</th>
                <th>Operational Status</th>
                <th>Account</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((driver) => (
                <tr key={driver.id}>
                  <td className="sa-id">{driver.id}</td>
                  <td>{driver.name}</td>
                  <td>{driver.phone}</td>
                  <td>{driver.vehicle}</td>
                  <td>{driver.type}</td>

                  <td>
                    <span
                      className={`sa-badge ${
                        driver.status === "Available"
                          ? "green"
                          : driver.status === "On Ride"
                          ? "blue"
                          : "red"
                      }`}
                    >
                      {driver.status}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`sa-badge ${
                        driver.account === "Active" ? "green" : "red"
                      }`}
                    >
                      {driver.account}
                    </span>
                  </td>

                  <td>
                    <div className="sa-actions">
                      <button
                        className="sa-btn-view"
                        onClick={() =>
                          alert(
                            `${driver.name}\n${driver.vehicle}\n${driver.status}`
                          )
                        }
                      >
                        View
                      </button>

                      <button
                        className="sa-btn-edit"
                        onClick={() => alert("Edit driver - frontend demo")}
                      >
                        Edit
                      </button>

                      <button
                        className="sa-btn-neutral"
                        onClick={() => toggleAccount(driver.id)}
                      >
                        {driver.account === "Active" ? "Disable" : "Enable"}
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

export default DriverManagement;