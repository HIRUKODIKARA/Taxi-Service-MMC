import { useState } from "react";

function OperationsVehicles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const vehicles = [
    {
      id: "VH001",
      vehicleNo: "WP CAB-1234",
      type: "Car",
      driver: "Kasun Perera",
      phone: "0712345678",
      status: "Available",
      gps: "Connected",
    },
    {
      id: "VH002",
      vehicleNo: "WP AAB-4567",
      type: "Three-Wheeler",
      driver: "Nimal Silva",
      phone: "0774567890",
      status: "On Ride",
      gps: "Connected",
    },
    {
      id: "VH003",
      vehicleNo: "WP BCD-7890",
      type: "Bike",
      driver: "Amal Jay",
      phone: "0759876543",
      status: "Offline",
      gps: "Disconnected",
    },
    {
      id: "VH004",
      vehicleNo: "WP CAA-7788",
      type: "Car",
      driver: "Saman Fernando",
      phone: "0762233445",
      status: "Available",
      gps: "Connected",
    },
  ];

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.vehicleNo
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      vehicle.driver
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      vehicle.status === statusFilter;

    const matchesType =
      typeFilter === "All" ||
      vehicle.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusClass = (status) => {
    if (status === "Available") {
      return "vehicle-status available";
    }

    if (status === "On Ride") {
      return "vehicle-status onride";
    }

    return "vehicle-status offline";
  };

  const getGpsClass = (gps) => {
    if (gps === "Connected") {
      return "gps-badge connected";
    }

    return "gps-badge disconnected";
  };

  return (
    <>
      <style>{`
        .vehicles-page {
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .vehicles-header {
          margin-bottom: 24px;
        }

        .vehicles-header h1 {
          margin: 0 0 6px;
          color: #0b2946;
          font-size: 28px;
          font-weight: 800;
        }

        .vehicles-header p {
          margin: 0;
          color: #7b8794;
          font-size: 13px;
        }

        .vehicles-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .vehicle-summary-card {
          background: white;
          border: 1px solid #e3e8ed;
          border-radius: 9px;
          padding: 18px;
          box-shadow: 0 3px 12px rgba(11,41,70,0.04);
        }

        .vehicle-summary-card span {
          display: block;
          color: #89949e;
          font-size: 10px;
          margin-bottom: 6px;
        }

        .vehicle-summary-card h3 {
          margin: 0;
          color: #0b2946;
          font-size: 23px;
        }

        .vehicles-toolbar {
          display: grid;
          grid-template-columns: 1fr 180px 180px;
          gap: 12px;
          margin-bottom: 18px;
          padding: 14px;
          background: white;
          border: 1px solid #e3e8ed;
          border-radius: 9px;
        }

        .vehicles-toolbar input,
        .vehicles-toolbar select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d9e0e6;
          border-radius: 6px;
          outline: none;
          color: #425160;
          font-size: 12px;
          background: white;
        }

        .vehicles-toolbar input:focus,
        .vehicles-toolbar select:focus {
          border-color: #f6c20d;
        }

        .vehicles-table-card {
          background: white;
          border: 1px solid #e3e8ed;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 14px rgba(11,41,70,0.04);
        }

        .vehicles-table-wrapper {
          overflow-x: auto;
        }

        .vehicles-table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
        }

        .vehicles-table th {
          padding: 13px 14px;
          background: #0b2946;
          color: white;
          text-align: left;
          font-size: 10px;
          font-weight: 700;
        }

        .vehicles-table td {
          padding: 14px;
          border-bottom: 1px solid #edf0f3;
          color: #52616e;
          font-size: 11px;
        }

        .vehicles-table tr:last-child td {
          border-bottom: none;
        }

        .vehicle-number {
          color: #0b2946;
          font-weight: 800;
        }

        .vehicle-id {
          display: block;
          margin-top: 3px;
          color: #9aa3ab;
          font-size: 9px;
        }

        .vehicle-type-badge {
          display: inline-block;
          padding: 5px 9px;
          background: #eef3f7;
          color: #445a6c;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
        }

        .vehicle-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
        }

        .vehicle-status::before {
          content: "";
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .vehicle-status.available {
          background: #e3f6e7;
          color: #18763a;
        }

        .vehicle-status.available::before {
          background: #21a453;
        }

        .vehicle-status.onride {
          background: #e3effc;
          color: #24649f;
        }

        .vehicle-status.onride::before {
          background: #3284d6;
        }

        .vehicle-status.offline {
          background: #fde7e7;
          color: #a13a3a;
        }

        .vehicle-status.offline::before {
          background: #db4141;
        }

        .gps-badge {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
        }

        .gps-badge.connected {
          background: #e5f6eb;
          color: #18763a;
        }

        .gps-badge.disconnected {
          background: #fde7e7;
          color: #a13a3a;
        }

        .vehicle-view-btn {
          border: 1px solid #0b2946;
          background: white;
          color: #0b2946;
          padding: 7px 11px;
          border-radius: 5px;
          font-size: 9px;
          font-weight: 700;
          cursor: pointer;
        }

        .vehicle-view-btn:hover {
          background: #0b2946;
          color: white;
        }

        .vehicles-legend {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
          margin-top: 16px;
          padding: 14px 17px;
          background: white;
          border: 1px solid #e3e8ed;
          border-radius: 8px;
        }

        .vehicle-legend-item {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #697784;
          font-size: 10px;
        }

        .legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .legend-green {
          background: #21a453;
        }

        .legend-blue {
          background: #3284d6;
        }

        .legend-red {
          background: #db4141;
        }

        .vehicles-empty {
          padding: 30px;
          text-align: center;
          color: #89949e;
          font-size: 12px;
        }

        @media (max-width: 900px) {
          .vehicles-summary {
            grid-template-columns: repeat(2, 1fr);
          }

          .vehicles-toolbar {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .vehicles-page {
            padding: 18px;
          }

          .vehicles-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="vehicles-page">
        <div className="vehicles-header">
          <h1>Vehicle Status</h1>

          <p>
            Monitor taxi vehicles, assigned drivers and current
            operational availability.
          </p>
        </div>

        <div className="vehicles-summary">
          <div className="vehicle-summary-card">
            <span>TOTAL VEHICLES</span>
            <h3>{vehicles.length}</h3>
          </div>

          <div className="vehicle-summary-card">
            <span>AVAILABLE</span>

            <h3>
              {
                vehicles.filter(
                  (vehicle) => vehicle.status === "Available"
                ).length
              }
            </h3>
          </div>

          <div className="vehicle-summary-card">
            <span>ON RIDE</span>

            <h3>
              {
                vehicles.filter(
                  (vehicle) => vehicle.status === "On Ride"
                ).length
              }
            </h3>
          </div>

          <div className="vehicle-summary-card">
            <span>OFFLINE</span>

            <h3>
              {
                vehicles.filter(
                  (vehicle) => vehicle.status === "Offline"
                ).length
              }
            </h3>
          </div>
        </div>

        <div className="vehicles-toolbar">
          <input
            type="text"
            placeholder="Search vehicle number or driver..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
          />

          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value)
            }
          >
            <option value="All">
              All Vehicle Types
            </option>

            <option value="Car">
              Car
            </option>

            <option value="Three-Wheeler">
              Three-Wheeler
            </option>

            <option value="Bike">
              Bike
            </option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="All">
              All Status
            </option>

            <option value="Available">
              Available
            </option>

            <option value="On Ride">
              On Ride
            </option>

            <option value="Offline">
              Offline
            </option>
          </select>
        </div>

        <div className="vehicles-table-card">
          <div className="vehicles-table-wrapper">
            <table className="vehicles-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Type</th>
                  <th>Driver</th>
                  <th>Phone</th>
                  <th>GPS</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>
                      <span className="vehicle-number">
                        {vehicle.vehicleNo}
                      </span>

                      <span className="vehicle-id">
                        {vehicle.id}
                      </span>
                    </td>

                    <td>
                      <span className="vehicle-type-badge">
                        {vehicle.type}
                      </span>
                    </td>

                    <td>{vehicle.driver}</td>

                    <td>{vehicle.phone}</td>

                    <td>
                      <span
                        className={getGpsClass(
                          vehicle.gps
                        )}
                      >
                        {vehicle.gps}
                      </span>
                    </td>

                    <td>
                      <span
                        className={getStatusClass(
                          vehicle.status
                        )}
                      >
                        {vehicle.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="vehicle-view-btn"
                        onClick={() =>
                          alert(
                            `Vehicle: ${vehicle.vehicleNo}\nType: ${vehicle.type}\nDriver: ${vehicle.driver}\nPhone: ${vehicle.phone}\nGPS: ${vehicle.gps}\nStatus: ${vehicle.status}`
                          )
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredVehicles.length === 0 && (
              <div className="vehicles-empty">
                No vehicles found.
              </div>
            )}
          </div>
        </div>

        <div className="vehicles-legend">
          <div className="vehicle-legend-item">
            <span className="legend-dot legend-green"></span>
            Green - Available
          </div>

          <div className="vehicle-legend-item">
            <span className="legend-dot legend-blue"></span>
            Blue - On Ride
          </div>

          <div className="vehicle-legend-item">
            <span className="legend-dot legend-red"></span>
            Red - Offline
          </div>
        </div>
      </main>
    </>
  );
}

export default OperationsVehicles;