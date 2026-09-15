import { useEffect, useMemo, useState } from "react";

function AdminDrivers() {
  const API_BASE_URL = "/api";

  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getToken = () =>
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("accessToken") ||
    "";

  const getHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadDrivers = async () => {
    try {
      setLoading(true);
      setError("");

      const [driversResponse, vehiclesResponse, usersResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/drivers`, { headers: getHeaders() }),
          fetch(`${API_BASE_URL}/vehicles`, { headers: getHeaders() }),
          fetch(`${API_BASE_URL}/users`, { headers: getHeaders() }),
        ]);

      if (!driversResponse.ok) {
        throw new Error("Unable to load drivers.");
      }

      const driversData = await driversResponse.json();
      const vehiclesData = vehiclesResponse.ok
        ? await vehiclesResponse.json()
        : [];
      const usersData = usersResponse.ok
        ? await usersResponse.json()
        : [];

      setDrivers(Array.isArray(driversData) ? driversData : []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error("Admin drivers error:", err);
      setError(err.message || "Unable to load driver information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const getDriverUser = (driver) =>
    users.find(
      (user) => Number(user.userId) === Number(driver.userId)
    );

  const getAssignedVehicle = (driver) =>
    vehicles.find(
      (vehicle) => Number(vehicle.driverId) === Number(driver.driverId)
    );

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const filteredDrivers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return drivers.filter((driver) => {
      const user = getDriverUser(driver);
      const vehicle = getAssignedVehicle(driver);

      const searchableText = [
        driver.driverId,
        driver.drivingLicenseNo,
        driver.verificationStatus,
        driver.operationalStatus,
        user?.fullName,
        user?.email,
        user?.phone,
        vehicle?.registrationNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        driver.verificationStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [drivers, vehicles, users, search, statusFilter]);

  const approvedDrivers = drivers.filter(
    (driver) => driver.verificationStatus === "APPROVED"
  ).length;

  const pendingDrivers = drivers.filter(
    (driver) => driver.verificationStatus === "PENDING"
  ).length;

  const availableDrivers = drivers.filter(
    (driver) => driver.operationalStatus === "AVAILABLE"
  ).length;

  const getVerificationClass = (status) => {
    switch (status) {
      case "APPROVED":
        return "approved";
      case "REJECTED":
        return "rejected";
      default:
        return "pending";
    }
  };

  const getOperationalClass = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "available";
      case "ON_RIDE":
        return "onride";
      default:
        return "offline";
    }
  };

  return (
    <>
      <style>{`
        .admin-drivers-page {
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
          box-sizing: border-box;
        }

        .admin-drivers-header {
          margin-bottom: 22px;
        }

        .admin-drivers-header h1 {
          margin: 0 0 6px;
          color: #0b2946;
          font-size: 27px;
        }

        .admin-drivers-header p {
          margin: 0;
          color: #7b8794;
          font-size: 11px;
        }

        .admin-driver-error {
          margin-bottom: 18px;
          padding: 12px 14px;
          background: #fff1f1;
          border: 1px solid #efc8c8;
          border-radius: 7px;
          color: #a43c3c;
          font-size: 10px;
        }

        .admin-driver-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }

        .admin-driver-summary-card {
          padding: 16px;
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 8px;
        }

        .admin-driver-summary-card span {
          display: block;
          color: #89949e;
          font-size: 8px;
          font-weight: 700;
        }

        .admin-driver-summary-card strong {
          display: block;
          margin-top: 6px;
          color: #0b2946;
          font-size: 22px;
        }

        .admin-driver-filter-card {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
          padding: 14px;
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 8px;
        }

        .admin-driver-search {
          flex: 1;
          min-width: 200px;
          padding: 10px 12px;
          border: 1px solid #d9e0e6;
          border-radius: 6px;
          outline: none;
          color: #53616e;
          font-size: 10px;
          box-sizing: border-box;
        }

        .admin-driver-search:focus {
          border-color: #f6c20d;
        }

        .admin-driver-filter {
          padding: 10px 12px;
          border: 1px solid #d9e0e6;
          border-radius: 6px;
          background: white;
          color: #53616e;
          font-size: 10px;
          outline: none;
          box-sizing: border-box;
        }

        .admin-driver-refresh {
          border: none;
          background: #0b2946;
          color: white;
          padding: 10px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 9px;
          font-weight: 700;
        }

        .admin-driver-table-card {
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 10px;
          overflow: hidden;
        }

        .admin-driver-table-wrapper {
          overflow-x: auto;
        }

        .admin-driver-table {
          width: 100%;
          min-width: 1100px;
          border-collapse: collapse;
        }

        .admin-driver-table th {
          padding: 13px;
          background: #0b2946;
          color: white;
          text-align: left;
          font-size: 8px;
          letter-spacing: .3px;
        }

        .admin-driver-table td {
          padding: 13px;
          border-bottom: 1px solid #edf0f3;
          color: #53616e;
          font-size: 9px;
          vertical-align: middle;
        }

        .admin-driver-name {
          color: #0b2946;
          font-weight: 700;
        }

        .admin-driver-email {
          display: block;
          margin-top: 3px;
          color: #89949e;
          font-size: 8px;
          overflow-wrap: anywhere;
        }

        .admin-driver-status {
          display: inline-block;
          padding: 5px 8px;
          border-radius: 20px;
          font-size: 7px;
          font-weight: 800;
          white-space: nowrap;
        }

        .admin-driver-status.approved,
        .admin-driver-status.available {
          background: #e3f6e7;
          color: #18763a;
        }

        .admin-driver-status.pending {
          background: #fff3cd;
          color: #806400;
        }

        .admin-driver-status.rejected {
          background: #fde7e7;
          color: #a53a3a;
        }

        .admin-driver-status.onride {
          background: #e4e8ff;
          color: #3f51a3;
        }

        .admin-driver-status.offline {
          background: #edf0f3;
          color: #65717c;
        }

        .admin-driver-gps {
          font-weight: 700;
          font-size: 8px;
        }

        .admin-driver-gps.enabled {
          color: #18763a;
        }

        .admin-driver-gps.disabled {
          color: #a43c3c;
        }

        .admin-driver-loading,
        .admin-driver-empty {
          padding: 35px;
          text-align: center;
          color: #7b8794;
          font-size: 10px;
        }

        .admin-driver-mobile-list {
          display: none;
        }

        .admin-driver-mobile-card {
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 12px;
          overflow: hidden;
        }

        .admin-driver-mobile-head {
          padding: 15px;
          background: #0b2946;
        }

        .admin-driver-mobile-head .admin-driver-name {
          display: block;
          color: white;
          font-size: 14px;
        }

        .admin-driver-mobile-head .admin-driver-email {
          color: #cbd7e2;
          font-size: 10px;
        }

        .admin-driver-mobile-body {
          padding: 4px 15px;
        }

        .admin-driver-mobile-row {
          display: grid;
          grid-template-columns: 120px minmax(0, 1fr);
          gap: 12px;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #edf0f3;
        }

        .admin-driver-mobile-row:last-child {
          border-bottom: none;
        }

        .admin-driver-mobile-label {
          color: #89949e;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .admin-driver-mobile-value {
          min-width: 0;
          color: #53616e;
          font-size: 11px;
          font-weight: 600;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .admin-driver-note {
          margin-top: 17px;
          padding: 13px 15px;
          border-left: 4px solid #f6c20d;
          background: #fffdf2;
          color: #6d7780;
          font-size: 9px;
          line-height: 1.6;
        }

        @media(max-width: 900px) {
          .admin-driver-summary {
            grid-template-columns: repeat(2, 1fr);
          }

          .admin-driver-filter-card {
            flex-direction: column;
            align-items: stretch;
          }

          .admin-driver-search {
            min-width: 0;
            width: 100%;
          }

          .admin-driver-filter,
          .admin-driver-refresh {
            width: 100%;
          }
        }

        @media(max-width: 760px) {
          .admin-drivers-page {
            padding: 76px 16px 22px;
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
          }

          .admin-drivers-header h1 {
            font-size: 24px;
          }

          .admin-driver-summary {
            grid-template-columns: 1fr;
          }

          .admin-driver-table-card {
            display: none;
          }

          .admin-driver-mobile-list {
            display: grid;
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .admin-driver-filter-card {
            padding: 14px;
          }

          .admin-driver-summary-card {
            min-width: 0;
          }
        }

        @media(max-width: 420px) {
          .admin-drivers-page {
            padding-left: 12px;
            padding-right: 12px;
          }

          .admin-driver-mobile-row {
            grid-template-columns: 105px minmax(0, 1fr);
            gap: 8px;
          }
        }
      `}</style>

      <main className="admin-drivers-page">
        <div className="admin-drivers-header">
          <h1>Driver Management</h1>
          <p>
            View registered drivers, verification status, availability and
            assigned vehicles.
          </p>
        </div>

        {error && <div className="admin-driver-error">{error}</div>}

        <div className="admin-driver-summary">
          <div className="admin-driver-summary-card">
            <span>TOTAL DRIVERS</span>
            <strong>{drivers.length}</strong>
          </div>

          <div className="admin-driver-summary-card">
            <span>APPROVED DRIVERS</span>
            <strong>{approvedDrivers}</strong>
          </div>

          <div className="admin-driver-summary-card">
            <span>PENDING VERIFICATION</span>
            <strong>{pendingDrivers}</strong>
          </div>

          <div className="admin-driver-summary-card">
            <span>AVAILABLE DRIVERS</span>
            <strong>{availableDrivers}</strong>
          </div>
        </div>

        <div className="admin-driver-filter-card">
          <input
            type="text"
            className="admin-driver-search"
            placeholder="Search driver name, email, licence or vehicle..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="admin-driver-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All Verification Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            type="button"
            className="admin-driver-refresh"
            onClick={loadDrivers}
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <section className="admin-driver-table-card">
            <div className="admin-driver-loading">Loading drivers...</div>
          </section>
        ) : filteredDrivers.length === 0 ? (
          <section className="admin-driver-table-card">
            <div className="admin-driver-empty">No drivers found.</div>
          </section>
        ) : (
          <>
            <section className="admin-driver-table-card">
              <div className="admin-driver-table-wrapper">
                <table className="admin-driver-table">
                  <thead>
                    <tr>
                      <th>DRIVER</th>
                      <th>PHONE</th>
                      <th>LICENCE NO.</th>
                      <th>VERIFICATION</th>
                      <th>OPERATION STATUS</th>
                      <th>GPS</th>
                      <th>ASSIGNED VEHICLE</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredDrivers.map((driver) => {
                      const user = getDriverUser(driver);
                      const vehicle = getAssignedVehicle(driver);

                      return (
                        <tr key={driver.driverId}>
                          <td>
                            <span className="admin-driver-name">
                              {user?.fullName || `Driver #${driver.driverId}`}
                            </span>
                            <span className="admin-driver-email">
                              {user?.email || "—"}
                            </span>
                          </td>

                          <td>{user?.phone || "—"}</td>
                          <td>{driver.drivingLicenseNo || "—"}</td>

                          <td>
                            <span
                              className={`admin-driver-status ${getVerificationClass(
                                driver.verificationStatus
                              )}`}
                            >
                              {formatStatus(driver.verificationStatus)}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`admin-driver-status ${getOperationalClass(
                                driver.operationalStatus
                              )}`}
                            >
                              {formatStatus(driver.operationalStatus)}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`admin-driver-gps ${
                                driver.gpsEnabled ? "enabled" : "disabled"
                              }`}
                            >
                              {driver.gpsEnabled ? "● Enabled" : "● Disabled"}
                            </span>
                          </td>

                          <td>
                            {vehicle
                              ? vehicle.registrationNumber
                              : "Not Assigned"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-driver-mobile-list">
              {filteredDrivers.map((driver) => {
                const user = getDriverUser(driver);
                const vehicle = getAssignedVehicle(driver);

                return (
                  <article
                    className="admin-driver-mobile-card"
                    key={`mobile-${driver.driverId}`}
                  >
                    <div className="admin-driver-mobile-head">
                      <span className="admin-driver-name">
                        {user?.fullName || `Driver #${driver.driverId}`}
                      </span>
                      <span className="admin-driver-email">
                        {user?.email || "—"}
                      </span>
                    </div>

                    <div className="admin-driver-mobile-body">
                      <div className="admin-driver-mobile-row">
                        <span className="admin-driver-mobile-label">Phone</span>
                        <span className="admin-driver-mobile-value">
                          {user?.phone || "—"}
                        </span>
                      </div>

                      <div className="admin-driver-mobile-row">
                        <span className="admin-driver-mobile-label">
                          Licence No.
                        </span>
                        <span className="admin-driver-mobile-value">
                          {driver.drivingLicenseNo || "—"}
                        </span>
                      </div>

                      <div className="admin-driver-mobile-row">
                        <span className="admin-driver-mobile-label">
                          Verification
                        </span>
                        <span className="admin-driver-mobile-value">
                          <span
                            className={`admin-driver-status ${getVerificationClass(
                              driver.verificationStatus
                            )}`}
                          >
                            {formatStatus(driver.verificationStatus)}
                          </span>
                        </span>
                      </div>

                      <div className="admin-driver-mobile-row">
                        <span className="admin-driver-mobile-label">
                          Operation Status
                        </span>
                        <span className="admin-driver-mobile-value">
                          <span
                            className={`admin-driver-status ${getOperationalClass(
                              driver.operationalStatus
                            )}`}
                          >
                            {formatStatus(driver.operationalStatus)}
                          </span>
                        </span>
                      </div>

                      <div className="admin-driver-mobile-row">
                        <span className="admin-driver-mobile-label">GPS</span>
                        <span className="admin-driver-mobile-value">
                          <span
                            className={`admin-driver-gps ${
                              driver.gpsEnabled ? "enabled" : "disabled"
                            }`}
                          >
                            {driver.gpsEnabled ? "● Enabled" : "● Disabled"}
                          </span>
                        </span>
                      </div>

                      <div className="admin-driver-mobile-row">
                        <span className="admin-driver-mobile-label">
                          Assigned Vehicle
                        </span>
                        <span className="admin-driver-mobile-value">
                          {vehicle
                            ? vehicle.registrationNumber
                            : "Not Assigned"}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        )}

        <div className="admin-driver-note">
          Driver approval and rejection actions are handled from the{" "}
          <strong>Driver Verification</strong> page. This page is for driver
          monitoring and management information.
        </div>
      </main>
    </>
  );
}

export default AdminDrivers;
