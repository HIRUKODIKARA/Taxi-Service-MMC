import { useState } from "react";

function VehicleTypes() {
  const [types, setTypes] = useState([
    {
      id: "TYPE001",
      name: "Car",
      description: "Comfortable vehicle for individual and family journeys.",
      capacity: 4,
      status: "Active",
      icon: "🚗",
    },
    {
      id: "TYPE002",
      name: "Three-Wheeler",
      description: "Affordable and convenient vehicle for shorter journeys.",
      capacity: 3,
      status: "Active",
      icon: "🛺",
    },
    {
      id: "TYPE003",
      name: "Bike",
      description: "Quick transport option for individual passengers.",
      capacity: 1,
      status: "Active",
      icon: "🏍️",
    },
  ]);

  const toggleStatus = (id) => {
    setTypes(
      types.map((type) =>
        type.id === id
          ? {
              ...type,
              status: type.status === "Active" ? "Inactive" : "Active",
            }
          : type
      )
    );
  };

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div>
          <h1>Vehicle Types</h1>
          <p>Manage taxi vehicle categories available in the MMC Taxi Service.</p>
        </div>

        <button
          className="sa-primary-btn"
          onClick={() => alert("Add Vehicle Type - frontend demo")}
        >
          + Add Vehicle Type
        </button>
      </div>

      <div className="sa-summary-grid three">
        <div className="sa-summary-card">
          <span>Total Types</span>
          <h2>{types.length}</h2>
        </div>

        <div className="sa-summary-card">
          <span>Active Types</span>
          <h2>{types.filter((t) => t.status === "Active").length}</h2>
        </div>

        <div className="sa-summary-card">
          <span>Inactive Types</span>
          <h2>{types.filter((t) => t.status === "Inactive").length}</h2>
        </div>
      </div>

      <div className="sa-grid-3">
        {types.map((type) => (
          <section className="sa-card" key={type.id}>
            <div style={{ fontSize: "34px", marginBottom: "12px" }}>
              {type.icon}
            </div>

            <span className="sa-id">{type.id}</span>

            <h2 style={{ marginTop: "7px", marginBottom: "8px" }}>
              {type.name}
            </h2>

            <span
              className={`sa-badge ${
                type.status === "Active" ? "green" : "red"
              }`}
            >
              {type.status}
            </span>

            <p>{type.description}</p>

            <div
              className="sa-detail"
              style={{ marginBottom: "14px" }}
            >
              <span>Passenger Capacity</span>
              <strong>{type.capacity} Passenger(s)</strong>
            </div>

            <div className="sa-actions">
              <button
                className="sa-btn-edit"
                onClick={() => alert(`Edit ${type.name} - frontend demo`)}
              >
                Edit
              </button>

              <button
                className="sa-btn-neutral"
                onClick={() => toggleStatus(type.id)}
              >
                {type.status === "Active" ? "Disable" : "Enable"}
              </button>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

export default VehicleTypes;