import { useState } from "react";

function VehicleManagement() {
  const [vehicles, setVehicles] = useState([
    {
      id: "VEH001",
      number: "WP CAB-1234",
      type: "Car",
      driver: "Kasun Perera",
      gps: "Enabled",
      status: "Available",
      account: "Active",
    },
    {
      id: "VEH002",
      number: "WP AAB-4567",
      type: "Three-Wheeler",
      driver: "Nimal Silva",
      gps: "Enabled",
      status: "On Ride",
      account: "Active",
    },
    {
      id: "VEH003",
      number: "WP BCD-7890",
      type: "Bike",
      driver: "Amal Fernando",
      gps: "Disabled",
      status: "Offline",
      account: "Inactive",
    },
  ]);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");

  const filtered = vehicles.filter((vehicle) => {
    const textMatch =
      vehicle.number.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.driver.toLowerCase().includes(search.toLowerCase());

    const typeMatch = type === "All" || vehicle.type === type;
    const statusMatch = status === "All" || vehicle.status === status;

    return textMatch && typeMatch && statusMatch;
  });

  const toggleAccount = (id) => {
    setVehicles(
      vehicles.map((vehicle) =>
        vehicle.id === id
          ? {
              ...vehicle,
              account: vehicle.account === "Active" ? "Inactive" : "Active",
            }
          : vehicle
      )
    );
  };

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div>
          <h1>Vehicle Management</h1>
          <p>Monitor and manage registered MMC taxi vehicles.</p>
        </div>
      </div>

      <div className="sa-summary-grid">
        <div className="sa-summary-card">
          <span>Total Vehicles</span>
          <h2>{vehicles.length}</h2>
        </div>

        <div className="sa-summary-card">
          <span>Available</span>
          <h2>{vehicles.filter((v) => v.status === "Available").length}</h2>
        </div>

        <div className="sa-summary-card">
          <span>On Ride</span>
          <h2>{vehicles.filter((v) => v.status === "On Ride").length}</h2>
        </div>

        <div className="sa-summary-card">
          <span>Offline</span>
          <h2>{vehicles.filter((v) => v.status === "Offline").length}</h2>
        </div>
      </div>

      <section className="sa-card">
        <div className="sa-toolbar">
          <input
            className="sa-input"
            placeholder="Search vehicle or driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="sa-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="All">All Vehicle Types</option>
            <option value="Car">Car</option>
            <option value="Three-Wheeler">Three-Wheeler</option>
            <option value="Bike">Bike</option>
          </select>

          <select
            className="sa-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Available">Available</option>
            <option value="On Ride">On Ride</option>
            <option value="Offline">Offline</option>
          </select>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Vehicle ID</th>
                <th>Vehicle No.</th>
                <th>Type</th>
                <th>Driver</th>
                <th>GPS</th>
                <th>Operational Status</th>
                <th>Account</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="sa-id">{vehicle.id}</td>
                  <td>{vehicle.number}</td>
                  <td>{vehicle.type}</td>
                  <td>{vehicle.driver}</td>
                  <td>{vehicle.gps}</td>

                  <td>
                    <span
                      className={`sa-badge ${
                        vehicle.status === "Available"
                          ? "green"
                          : vehicle.status === "On Ride"
                          ? "blue"
                          : "red"
                      }`}
                    >
                      {vehicle.status}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`sa-badge ${
                        vehicle.account === "Active" ? "green" : "red"
                      }`}
                    >
                      {vehicle.account}
                    </span>
                  </td>

                  <td>
                    <div className="sa-actions">
                      <button
                        className="sa-btn-view"
                        onClick={() =>
                          alert(
                            `${vehicle.number}\n${vehicle.type}\nDriver: ${vehicle.driver}`
                          )
                        }
                      >
                        View
                      </button>

                      <button
                        className="sa-btn-edit"
                        onClick={() => alert("Edit vehicle - frontend demo")}
                      >
                        Edit
                      </button>

                      <button
                        className="sa-btn-neutral"
                        onClick={() => toggleAccount(vehicle.id)}
                      >
                        {vehicle.account === "Active" ? "Disable" : "Enable"}
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

export default VehicleManagement;