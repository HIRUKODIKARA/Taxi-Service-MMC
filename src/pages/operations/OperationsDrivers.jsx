import { useState } from "react";

function OperationsDrivers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const drivers = [
    {
      id: "DR001",
      name: "Kasun Perera",
      phone: "0712345678",
      vehicleType: "Car",
      vehicleNo: "WP CAB-1234",
      status: "Available",
      trips: 24,
    },
    {
      id: "DR002",
      name: "Nimal Silva",
      phone: "0774567890",
      vehicleType: "Three-Wheeler",
      vehicleNo: "WP AAB-4567",
      status: "On Ride",
      trips: 31,
    },
    {
      id: "DR003",
      name: "Amal Jay",
      phone: "0759876543",
      vehicleType: "Bike",
      vehicleNo: "WP BCD-7890",
      status: "Offline",
      trips: 18,
    },
    {
      id: "DR004",
      name: "Saman Fernando",
      phone: "0762233445",
      vehicleType: "Car",
      vehicleNo: "WP CAA-7788",
      status: "Available",
      trips: 16,
    },
  ];

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.includes(searchTerm);

    const matchesStatus =
      statusFilter === "All" || driver.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusClass = (status) => {
    if (status === "Available") return "driver-status available";
    if (status === "On Ride") return "driver-status onride";
    return "driver-status offline";
  };

  return (
    <>
      <style>{`
        .drivers-page {
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .drivers-header {
          margin-bottom: 24px;
        }

        .drivers-header h1 {
          margin: 0 0 6px;
          color: #0b2946;
          font-size: 28px;
          font-weight: 800;
        }

        .drivers-header p {
          margin: 0;
          color: #7a8590;
          font-size: 13px;
        }

        .drivers-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .drivers-summary-card {
          background: white;
          border: 1px solid #e3e8ed;
          border-radius: 9px;
          padding: 18px;
          box-shadow: 0 3px 12px rgba(11,41,70,0.04);
        }

        .drivers-summary-card span {
          color: #89949e;
          font-size: 10px;
        }

        .drivers-summary-card h3 {
          margin: 7px 0 0;
          color: #0b2946;
          font-size: 23px;
        }

        .drivers-toolbar {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 18px;
          background: white;
          border: 1px solid #e3e8ed;
          border-radius: 9px;
          padding: 14px;
        }

        .drivers-search {
          flex: 1;
        }

        .drivers-search input,
        .drivers-filter select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d9e0e6;
          border-radius: 6px;
          outline: none;
          color: #425160;
          font-size: 12px;
          background: white;
        }

        .drivers-search input:focus,
        .drivers-filter select:focus {
          border-color: #f6c20d;
        }

        .drivers-filter {
          width: 190px;
        }

        .drivers-table-card {
          background: white;
          border: 1px solid #e3e8ed;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 14px rgba(11,41,70,0.04);
        }

        .drivers-table-wrapper {
          overflow-x: auto;
        }

        .drivers-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 850px;
        }

        .drivers-table th {
          padding: 13px 14px;
          background: #0b2946;
          color: white;
          text-align: left;
          font-size: 10px;
          font-weight: 700;
        }

        .drivers-table td {
          padding: 14px;
          border-bottom: 1px solid #edf0f3;
          color: #52616e;
          font-size: 11px;
        }

        .drivers-table tr:last-child td {
          border-bottom: none;
        }

        .driver-name {
          color: #0b2946;
          font-weight: 700;
        }

        .driver-id {
          display: block;
          margin-top: 3px;
          color: #9aa3ab;
          font-size: 9px;
        }

        .driver-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
        }

        .driver-status::before {
          content: "";
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .driver-status.available {
          background: #e3f6e7;
          color: #18763a;
        }

        .driver-status.available::before {
          background: #21a453;
        }

        .driver-status.onride {
          background: #e3effc;
          color: #24649f;
        }

        .driver-status.onride::before {
          background: #3284d6;
        }

        .driver-status.offline {
          background: #fde7e7;
          color: #a13a3a;
        }

        .driver-status.offline::before {
          background: #db4141;
        }

        .driver-action-btn {
          border: 1px solid #0b2946;
          background: white;
          color: #0b2946;
          padding: 7px 11px;
          border-radius: 5px;
          font-size: 9px;
          font-weight: 700;
          cursor: pointer;
        }

        .driver-action-btn:hover {
          background: #0b2946;
          color: white;
        }

        .drivers-empty {
          padding: 30px;
          text-align: center;
          color: #89949e;
          font-size: 12px;
        }

        @media (max-width: 900px) {
          .drivers-summary {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 650px) {
          .drivers-page {
            padding: 18px;
          }

          .drivers-summary {
            grid-template-columns: 1fr;
          }

          .drivers-toolbar {
            flex-direction: column;
          }

          .drivers-filter {
            width: 100%;
          }
        }
      `}</style>

      <main className="drivers-page">

        <div className="drivers-header">
          <h1>Driver Status</h1>
          <p>
            Monitor registered taxi drivers and their current operational status.
          </p>
        </div>

        <div className="drivers-summary">

          <div className="drivers-summary-card">
            <span>TOTAL DRIVERS</span>
            <h3>{drivers.length}</h3>
          </div>

          <div className="drivers-summary-card">
            <span>AVAILABLE</span>
            <h3>
              {drivers.filter((driver) => driver.status === "Available").length}
            </h3>
          </div>

          <div className="drivers-summary-card">
            <span>ON RIDE</span>
            <h3>
              {drivers.filter((driver) => driver.status === "On Ride").length}
            </h3>
          </div>

          <div className="drivers-summary-card">
            <span>OFFLINE</span>
            <h3>
              {drivers.filter((driver) => driver.status === "Offline").length}
            </h3>
          </div>

        </div>

        <div className="drivers-toolbar">

          <div className="drivers-search">
            <input
              type="text"
              placeholder="Search driver, phone or vehicle number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="drivers-filter">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Available">Available</option>
              <option value="On Ride">On Ride</option>
              <option value="Offline">Offline</option>
            </select>
          </div>

        </div>

        <div className="drivers-table-card">

          <div className="drivers-table-wrapper">

            <table className="drivers-table">

              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Phone</th>
                  <th>Vehicle Type</th>
                  <th>Vehicle No.</th>
                  <th>Total Trips</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredDrivers.map((driver) => (
                  <tr key={driver.id}>

                    <td>
                      <span className="driver-name">
                        {driver.name}
                      </span>

                      <span className="driver-id">
                        {driver.id}
                      </span>
                    </td>

                    <td>{driver.phone}</td>

                    <td>{driver.vehicleType}</td>

                    <td>{driver.vehicleNo}</td>

                    <td>{driver.trips}</td>

                    <td>
                      <span className={getStatusClass(driver.status)}>
                        {driver.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="driver-action-btn"
                        onClick={() =>
                          alert(
                            `${driver.name}\n${driver.phone}\n${driver.vehicleType} - ${driver.vehicleNo}\nStatus: ${driver.status}`
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

            {filteredDrivers.length === 0 && (
              <div className="drivers-empty">
                No drivers found.
              </div>
            )}

          </div>

        </div>

      </main>
    </>
  );
}

export default OperationsDrivers;