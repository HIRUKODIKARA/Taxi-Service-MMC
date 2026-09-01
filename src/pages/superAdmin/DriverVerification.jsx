import { useState } from "react";

function DriverVerification() {
  const [drivers, setDrivers] = useState([
    {
      id: "REG001",
      name: "Sahan Perera",
      phone: "0715555555",
      nic: "200012345678",
      license: "B1234567",
      vehicle: "WP CAA-7788",
      status: "Pending",
    },
    {
      id: "REG002",
      name: "Tharindu Silva",
      phone: "0776666666",
      nic: "199912345678",
      license: "B9876543",
      vehicle: "WP CAB-8899",
      status: "Pending",
    },
  ]);

  const updateStatus = (id, status) => {
    setDrivers(
      drivers.map((driver) =>
        driver.id === id ? { ...driver, status } : driver
      )
    );
  };

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div>
          <h1>Driver Verification</h1>
          <p>
            Review driver registration details and approve verified applicants.
          </p>
        </div>
      </div>

      <div className="sa-summary-grid three">
        <div className="sa-summary-card">
          <span>Total Requests</span>
          <h2>{drivers.length}</h2>
        </div>

        <div className="sa-summary-card">
          <span>Pending</span>
          <h2>{drivers.filter((d) => d.status === "Pending").length}</h2>
        </div>

        <div className="sa-summary-card">
          <span>Approved</span>
          <h2>{drivers.filter((d) => d.status === "Approved").length}</h2>
        </div>
      </div>

      <div className="sa-info-box">
        <strong>Verification Required</strong>
        <p>
          Driver identity, driving licence and vehicle documents should be
          reviewed before activating the driver account.
        </p>
      </div>

      <section className="sa-card">
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>NIC</th>
                <th>License</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.id}>
                  <td className="sa-id">{driver.id}</td>
                  <td>{driver.name}</td>
                  <td>{driver.phone}</td>
                  <td>{driver.nic}</td>
                  <td>{driver.license}</td>
                  <td>{driver.vehicle}</td>

                  <td>
                    <span
                      className={`sa-badge ${
                        driver.status === "Approved"
                          ? "green"
                          : driver.status === "Rejected"
                          ? "red"
                          : "yellow"
                      }`}
                    >
                      {driver.status}
                    </span>
                  </td>

                  <td>
                    <div className="sa-actions">
                      <button
                        className="sa-btn-view"
                        onClick={() =>
                          alert(
                            `${driver.name}\nNIC: ${driver.nic}\nLicense: ${driver.license}\nVehicle: ${driver.vehicle}`
                          )
                        }
                      >
                        View
                      </button>

                      {driver.status === "Pending" && (
                        <>
                          <button
                            className="sa-btn-edit"
                            onClick={() => updateStatus(driver.id, "Approved")}
                          >
                            Approve
                          </button>

                          <button
                            className="sa-btn-danger"
                            onClick={() => updateStatus(driver.id, "Rejected")}
                          >
                            Reject
                          </button>
                        </>
                      )}
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

export default DriverVerification;