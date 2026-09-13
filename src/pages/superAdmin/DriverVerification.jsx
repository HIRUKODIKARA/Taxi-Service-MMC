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

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const badgeClass = (status) => {
  if (status === "APPROVED" || status === "AVAILABLE" || status === "ACTIVE")
    return "green";
  if (status === "REJECTED" || status === "OFFLINE" || status === "INACTIVE")
    return "red";
  if (status === "ON_RIDE") return "blue";
  return "yellow";
};

function DriverVerification() {
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [types, setTypes] = useState([]);
  const [details, setDetails] = useState({});
  const [vehiclePhotos, setVehiclePhotos] = useState({});
  const [expandedDriver, setExpandedDriver] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const requestJson = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: options.headers || authHeaders(),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data?.message || "Request failed.");
    return data;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [driverData, userData, vehicleData, typeData] = await Promise.all([
        requestJson(`${API_BASE_URL}/drivers`),
        requestJson(`${API_BASE_URL}/users`),
        requestJson(`${API_BASE_URL}/vehicles`),
        requestJson(`${API_BASE_URL}/vehicletypes/all`),
      ]);

      const driverList = Array.isArray(driverData) ? driverData : [];
      const vehicleList = Array.isArray(vehicleData) ? vehicleData : [];

      setDrivers(driverList);
      setUsers(Array.isArray(userData) ? userData : []);
      setVehicles(vehicleList);
      setTypes(Array.isArray(typeData) ? typeData : []);

      const verificationEntries = await Promise.all(
        driverList.map(async (driver) => {
          try {
            const data = await requestJson(
              `${API_BASE_URL}/drivers/${driver.driverId}/verification`
            );
            return [driver.driverId, data];
          } catch {
            return [driver.driverId, null];
          }
        })
      );
      setDetails(Object.fromEntries(verificationEntries));

      const photoEntries = await Promise.all(
        vehicleList.map(async (vehicle) => {
          try {
            const data = await requestJson(
              `${API_BASE_URL}/vehiclephotos/vehicle/${vehicle.vehicleId}`
            );
            return [vehicle.vehicleId, Array.isArray(data) ? data : []];
          } catch {
            return [vehicle.vehicleId, []];
          }
        })
      );
      setVehiclePhotos(Object.fromEntries(photoEntries));
    } catch (e) {
      setError(e.message || "Unable to load driver verification data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const rows = useMemo(() => {
    return drivers
      .map((driver) => {
        const user =
          users.find((u) => Number(u.userId) === Number(driver.userId)) || {};
        const vehicle =
          vehicles.find(
            (v) => Number(v.driverId) === Number(driver.driverId)
          ) || null;
        const type = vehicle
          ? types.find(
              (t) => Number(t.vehicleTypeId) === Number(vehicle.vehicleTypeId)
            ) || null
          : null;

        return {
          ...driver,
          user,
          vehicle,
          type,
          verification: details[driver.driverId] || null,
          photos: vehicle ? vehiclePhotos[vehicle.vehicleId] || [] : [],
        };
      })
      .filter((row) => {
        const matchesStatus =
          statusFilter === "ALL" ||
          row.verificationStatus === statusFilter;

        const haystack = `${row.user.fullName || ""} ${
          row.user.phone || ""
        } ${row.user.email || ""} ${row.drivingLicenseNo || ""} ${
          row.vehicle?.registrationNumber || ""
        }`.toLowerCase();

        return matchesStatus && haystack.includes(search.toLowerCase());
      });
  }, [
    drivers,
    users,
    vehicles,
    types,
    details,
    vehiclePhotos,
    search,
    statusFilter,
  ]);

  const openProtectedFile = async (url) => {
    try {
      setError("");
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data?.message || "Unable to open file.");
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const newWindow = window.open(blobUrl, "_blank", "noopener,noreferrer");

      if (!newWindow) {
        URL.revokeObjectURL(blobUrl);
        throw new Error("Browser blocked the file window. Please allow pop-ups.");
      }

      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (e) {
      setError(e.message || "Unable to open file.");
    }
  };

  const documentAction = async (documentId, action) => {
    try {
      setBusyKey(`doc-${documentId}-${action}`);
      setError("");
      setMessage("");

      const options = { method: "PUT", headers: authHeaders() };

      if (action === "reject") {
        const reason = window.prompt(
          "Reason for rejecting this document:",
          "Document does not meet verification requirements."
        );
        if (reason === null) return;
        options.body = JSON.stringify({ reason });
      }

      await requestJson(
        `${API_BASE_URL}/driverdocuments/${documentId}/${action}`,
        options
      );

      setMessage(`Document ${action} action completed successfully.`);
      await loadData();
    } catch (e) {
      setError(e.message || `Unable to ${action} document.`);
    } finally {
      setBusyKey("");
    }
  };

  const driverAction = async (driverId, action) => {
    try {
      setBusyKey(`driver-${driverId}-${action}`);
      setError("");
      setMessage("");

      const options = { method: "PUT", headers: authHeaders() };

      if (action === "reject") {
        const reason = window.prompt(
          "Reason for rejecting this driver:",
          "Driver verification requirements were not satisfied."
        );
        if (reason === null) return;
        options.body = JSON.stringify({ reason });
      }

      await requestJson(`${API_BASE_URL}/drivers/${driverId}/${action}`, options);

      setMessage(`Driver ${action} action completed successfully.`);
      await loadData();
    } catch (e) {
      setError(e.message || `Unable to ${action} driver.`);
    } finally {
      setBusyKey("");
    }
  };

  const hasRequiredVehiclePhotos = (photos) =>
    ["FRONT", "REAR", "SIDE"].every((type) =>
      photos.some((photo) => photo.photoType === type)
    );

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div>
          <h1>Driver Verification</h1>
          <p>
            Review driver details, required documents and vehicle photos before
            final approval.
          </p>
        </div>
        <button className="sa-btn-neutral" onClick={loadData} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="sa-info-box">
          <strong>Error</strong>
          <p>{error}</p>
        </div>
      )}

      {message && (
        <div className="sa-info-box">
          <strong>Success</strong>
          <p>{message}</p>
        </div>
      )}

      <div className="sa-summary-grid">
        <div className="sa-summary-card">
          <span>Total Drivers</span>
          <h2>{drivers.length}</h2>
        </div>
        <div className="sa-summary-card">
          <span>Pending</span>
          <h2>
            {drivers.filter((d) => d.verificationStatus === "PENDING").length}
          </h2>
        </div>
        <div className="sa-summary-card">
          <span>Approved</span>
          <h2>
            {drivers.filter((d) => d.verificationStatus === "APPROVED").length}
          </h2>
        </div>
        <div className="sa-summary-card">
          <span>Rejected</span>
          <h2>
            {drivers.filter((d) => d.verificationStatus === "REJECTED").length}
          </h2>
        </div>
      </div>

      <section className="sa-card">
        <div className="sa-toolbar" style={{ gap: 10, flexWrap: "wrap" }}>
          <input
            className="sa-input"
            placeholder="Search driver, email, licence or vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="sa-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Verification Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Licence</th>
                <th>Vehicle</th>
                <th>Documents</th>
                <th>Vehicle Photos</th>
                <th>Verification</th>
                <th>Review</th>
              </tr>
            </thead>

            <tbody>
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan="7">No driver records found.</td>
                </tr>
              ) : (
                rows.map((row) => {
                  const info = row.verification;
                  const docs = info?.documents || [];
                  const photosOk = hasRequiredVehiclePhotos(row.photos);
                  const isExpanded = expandedDriver === row.driverId;

                  return (
                    <>
                      <tr key={`driver-${row.driverId}`}>
                        <td>
                          <strong>
                            {row.user.fullName || `Driver #${row.driverId}`}
                          </strong>
                          <br />
                          <small>{row.user.phone || "No phone"}</small>
                          <br />
                          <small>{row.user.email || ""}</small>
                        </td>

                        <td>
                          <strong>{row.drivingLicenseNo || "—"}</strong>
                          <br />
                          <small>
                            Expiry: {formatDate(row.drivingLicenseExpiry)}
                          </small>
                        </td>

                        <td>
                          {row.vehicle ? (
                            <>
                              <strong>{row.vehicle.registrationNumber}</strong>
                              <br />
                              <small>{row.type?.typeName || "—"}</small>
                            </>
                          ) : (
                            <span className="sa-badge red">Not Assigned</span>
                          )}
                        </td>

                        <td>
                          {docs.length > 0 ? (
                            <>
                              {docs.filter((d) => d.verificationStatus === "APPROVED")
                                .length}
                              /{docs.length} Approved
                            </>
                          ) : (
                            "Loading / None"
                          )}
                        </td>

                        <td>
                          <span
                            className={`sa-badge ${photosOk ? "green" : "yellow"}`}
                          >
                            {photosOk ? "Complete" : "Incomplete"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`sa-badge ${badgeClass(
                              row.verificationStatus
                            )}`}
                          >
                            {formatText(row.verificationStatus)}
                          </span>
                        </td>

                        <td>
                          <button
                            className="sa-btn-neutral"
                            onClick={() =>
                              setExpandedDriver(isExpanded ? null : row.driverId)
                            }
                          >
                            {isExpanded ? "Close Review" : "Review"}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`review-${row.driverId}`}>
                          <td colSpan="7">
                            <div style={{ padding: "12px 4px" }}>
                              <h3 style={{ marginTop: 0 }}>
                                Driver Verification Review
                              </h3>

                              <div
                                className="sa-summary-grid"
                                style={{ marginBottom: 18 }}
                              >
                                <div className="sa-summary-card">
                                  <span>Address</span>
                                  <p>{row.address || "Not provided"}</p>
                                </div>

                                <div className="sa-summary-card">
                                  <span>Date of Birth</span>
                                  <p>{formatDate(row.dateOfBirth)}</p>
                                </div>

                                <div className="sa-summary-card">
                                  <span>Licence Expiry</span>
                                  <p>{formatDate(row.drivingLicenseExpiry)}</p>
                                </div>

                                <div className="sa-summary-card">
                                  <span>Document Check</span>
                                  <p>
                                    {info?.allRequiredDocumentsApproved
                                      ? "All Approved"
                                      : "Incomplete"}
                                  </p>
                                </div>
                              </div>

                              <h3>Required Documents</h3>

                              <div className="sa-table-wrapper">
                                <table className="sa-table">
                                  <thead>
                                    <tr>
                                      <th>Document</th>
                                      <th>Status</th>
                                      <th>File</th>
                                      <th>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {docs.map((doc) => (
                                      <tr key={doc.documentType}>
                                        <td>{formatText(doc.documentType)}</td>
                                        <td>
                                          <span
                                            className={`sa-badge ${badgeClass(
                                              doc.verificationStatus
                                            )}`}
                                          >
                                            {formatText(doc.verificationStatus)}
                                          </span>
                                        </td>
                                        <td>
                                          {doc.documentId ? (
                                            <button
                                              className="sa-btn-neutral"
                                              onClick={() =>
                                                openProtectedFile(
                                                  `${API_BASE_URL}/driverdocuments/${doc.documentId}/file`
                                                )
                                              }
                                            >
                                              View Document
                                            </button>
                                          ) : (
                                            "Not Uploaded"
                                          )}
                                        </td>
                                        <td>
                                          {doc.documentId &&
                                          doc.verificationStatus !==
                                            "APPROVED" ? (
                                            <div className="sa-actions">
                                              <button
                                                className="sa-btn-edit"
                                                disabled={Boolean(busyKey)}
                                                onClick={() =>
                                                  documentAction(
                                                    doc.documentId,
                                                    "approve"
                                                  )
                                                }
                                              >
                                                Approve
                                              </button>
                                              <button
                                                className="sa-btn-danger"
                                                disabled={Boolean(busyKey)}
                                                onClick={() =>
                                                  documentAction(
                                                    doc.documentId,
                                                    "reject"
                                                  )
                                                }
                                              >
                                                Reject
                                              </button>
                                            </div>
                                          ) : (
                                            "—"
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              <h3 style={{ marginTop: 22 }}>Vehicle Details</h3>

                              {row.vehicle ? (
                                <>
                                  <div
                                    className="sa-summary-grid"
                                    style={{ marginBottom: 18 }}
                                  >
                                    <div className="sa-summary-card">
                                      <span>Registration</span>
                                      <p>{row.vehicle.registrationNumber}</p>
                                    </div>
                                    <div className="sa-summary-card">
                                      <span>Vehicle Type</span>
                                      <p>{row.type?.typeName || "—"}</p>
                                    </div>
                                    <div className="sa-summary-card">
                                      <span>Make / Model</span>
                                      <p>
                                        {row.vehicle.make || "—"} /{" "}
                                        {row.vehicle.model || "—"}
                                      </p>
                                    </div>
                                    <div className="sa-summary-card">
                                      <span>Color / Year</span>
                                      <p>
                                        {row.vehicle.color || "—"} /{" "}
                                        {row.vehicle.manufactureYear || "—"}
                                      </p>
                                    </div>
                                  </div>

                                  <h3>Vehicle Photos</h3>

                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns:
                                        "repeat(auto-fit, minmax(180px, 1fr))",
                                      gap: 12,
                                      marginBottom: 20,
                                    }}
                                  >
                                    {["FRONT", "REAR", "SIDE"].map((type) => {
                                      const photo = row.photos.find(
                                        (p) => p.photoType === type
                                      );

                                      return (
                                        <div
                                          className="sa-summary-card"
                                          key={type}
                                        >
                                          <span>{formatText(type)} Photo</span>
                                          <p>
                                            {photo ? "Uploaded" : "Not Uploaded"}
                                          </p>

                                          {photo && (
                                            <button
                                              className="sa-btn-neutral"
                                              onClick={() =>
                                                openProtectedFile(
                                                  `${API_BASE_URL}/vehiclephotos/${photo.vehiclePhotoId}/file`
                                                )
                                              }
                                            >
                                              View Photo
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </>
                              ) : (
                                <div className="sa-info-box">
                                  <strong>Vehicle Missing</strong>
                                  <p>
                                    An active vehicle must be assigned before
                                    final driver approval.
                                  </p>
                                </div>
                              )}

                              <div
                                className="sa-actions"
                                style={{ marginTop: 20 }}
                              >
                                {row.verificationStatus !== "APPROVED" && (
                                  <button
                                    className="sa-btn-edit"
                                    disabled={Boolean(busyKey)}
                                    onClick={() =>
                                      driverAction(row.driverId, "approve")
                                    }
                                  >
                                    Approve Driver
                                  </button>
                                )}

                                {row.verificationStatus !== "REJECTED" && (
                                  <button
                                    className="sa-btn-danger"
                                    disabled={Boolean(busyKey)}
                                    onClick={() =>
                                      driverAction(row.driverId, "reject")
                                    }
                                  >
                                    Reject Driver
                                  </button>
                                )}
                              </div>

                              <small>
                                Final approval is also validated by the backend.
                                Missing documents, expired licence, incomplete
                                vehicle details or missing Front/Rear/Side
                                photos will prevent approval.
                              </small>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default DriverVerification;
