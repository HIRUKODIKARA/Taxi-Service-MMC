import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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

const formatStatus = (value) =>
  (value || "—")
    .toString()
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

function TaxiOperatorAreaManagement() {
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminPage = location.pathname.startsWith("/admin");

  const [operators, setOperators] = useState([]);
  const [areas, setAreas] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const clearAlerts = () => {
    setError("");
    setMessage("");
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [operatorsRes, areasRes, assignmentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/TaxiOperatorOperationalAreas/operators`, {
          headers: authHeaders(),
        }),

        fetch(`${API_BASE_URL}/OperationalAreas`, {
          headers: authHeaders(),
        }),

        fetch(`${API_BASE_URL}/TaxiOperatorOperationalAreas/assignments`, {
          headers: authHeaders(),
        }),
      ]);

      const operatorsData = await safeJson(operatorsRes);
      const areasData = await safeJson(areasRes);
      const assignmentsData = await safeJson(assignmentsRes);

      if (!operatorsRes.ok) {
        throw new Error(
          operatorsData?.message || "Unable to load Taxi Operators."
        );
      }

      if (!areasRes.ok) {
        throw new Error(
          areasData?.message || "Unable to load Operational Areas."
        );
      }

      if (!assignmentsRes.ok) {
        throw new Error(
          assignmentsData?.message || "Unable to load assignments."
        );
      }

      setOperators(Array.isArray(operatorsData) ? operatorsData : []);
      setAreas(Array.isArray(areasData) ? areasData : []);

      // Backend returns assignment details as flat properties.
      // Normalize them into the structure used by this page.
      const normalizedAssignments = Array.isArray(assignmentsData)
        ? assignmentsData.map((item) => ({
            taxiOperatorOperationalAreaId:
              item.taxiOperatorOperationalAreaId ??
              item.TaxiOperatorOperationalAreaId,

            operator: {
              userId: item.userId ?? item.UserId,
              fullName: item.fullName ?? item.FullName ?? "",
              email: item.email ?? item.Email ?? "",
              phone: item.phone ?? item.Phone ?? "",
              accountStatus:
                item.accountStatus ?? item.AccountStatus ?? "",
            },

            operationalArea: {
              operationalAreaId:
                item.operationalAreaId ?? item.OperationalAreaId,
              areaName: item.areaName ?? item.AreaName ?? "",
              isActive: Boolean(
                item.areaIsActive ?? item.AreaIsActive ?? false
              ),
            },

            isActive: Boolean(
              item.assignmentIsActive ??
                item.AssignmentIsActive ??
                item.isActive ??
                item.IsActive ??
                false
            ),

            createdAt: item.createdAt ?? item.CreatedAt,
            updatedAt: item.updatedAt ?? item.UpdatedAt,
          }))
        : [];

      setAssignments(normalizedAssignments);
    } catch (e) {
      setError(
        e.message || "Unable to load Taxi Operator area management data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeOperators = useMemo(
    () =>
      operators.filter(
        (operator) =>
          (operator.accountStatus || "").toUpperCase() === "ACTIVE"
      ),
    [operators]
  );

  const activeAreas = useMemo(
    () => areas.filter((area) => area.isActive),
    [areas]
  );

  const filteredAssignments = useMemo(() => {
    const q = search.trim().toLowerCase();

    return assignments.filter((item) => {
      const operator = item.operator || {};
      const area = item.operationalArea || {};

      const matchesSearch =
        !q ||
        `${operator.fullName || ""} ${operator.email || ""} ${
          operator.phone || ""
        } ${area.areaName || ""}`
          .toLowerCase()
          .includes(q);

      const isActive = Boolean(item.isActive);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && isActive) ||
        (statusFilter === "INACTIVE" && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [assignments, search, statusFilter]);

  const activeAssignmentCount = assignments.filter(
    (item) => item.isActive
  ).length;

  const inactiveAssignmentCount =
    assignments.length - activeAssignmentCount;

  const assignedOperatorIds = new Set(
    assignments
      .filter((item) => item.isActive)
      .map((item) => item.operator?.userId)
  );

  const handleAssign = async (e) => {
    e.preventDefault();
    clearAlerts();

    if (!selectedUserId) {
      setError("Please select a Taxi Operator.");
      return;
    }

    if (!selectedAreaId) {
      setError("Please select an Operational Area.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE_URL}/TaxiOperatorOperationalAreas/assign`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            userId: Number(selectedUserId),
            operationalAreaId: Number(selectedAreaId),
          }),
        }
      );

      const data = await safeJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to assign Taxi Operator."
        );
      }

      setMessage(
        data?.message ||
          "Taxi Operator assigned to Operational Area successfully."
      );

      setSelectedUserId("");
      setSelectedAreaId("");

      await loadData();
    } catch (e) {
      setError(e.message || "Unable to assign Taxi Operator.");
    } finally {
      setSaving(false);
    }
  };

  const changeAssignmentStatus = async (assignment) => {
    clearAlerts();

    try {
      setSaving(true);

      const action = assignment.isActive ? "disable" : "enable";

      const response = await fetch(
        `${API_BASE_URL}/TaxiOperatorOperationalAreas/${assignment.taxiOperatorOperationalAreaId}/${action}`,
        {
          method: "PUT",
          headers: authHeaders(),
        }
      );

      const data = await safeJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to update assignment."
        );
      }

      setMessage(
        data?.message || "Taxi Operator area assignment updated."
      );

      await loadData();
    } catch (e) {
      setError(e.message || "Unable to update assignment.");
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    navigate(
      isAdminPage
        ? "/admin/dashboard"
        : "/super-admin/dashboard"
    );
  };

  return (
    <main className="toa-page">
      <style>{`
        .toa-page {
          min-height: 100vh;
          padding: 34px;
          background: #f4f7fb;
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
          color: #18314d;
        }

        .toa-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 24px;
        }

        .toa-header h1 {
          margin: 0;
          font-size: 28px;
          color: #0b2946;
        }

        .toa-header p {
          margin: 8px 0 0;
          color: #718096;
          font-size: 14px;
        }

        .toa-back-btn {
          border: 1px solid #d8e0e9;
          background: white;
          color: #0b2946;
          border-radius: 9px;
          padding: 11px 16px;
          cursor: pointer;
          font-weight: 700;
        }

        .toa-alert {
          margin-bottom: 18px;
          padding: 14px 16px;
          border-radius: 9px;
          font-size: 13px;
        }

        .toa-alert.error {
          background: #fff1f1;
          border: 1px solid #f2bcbc;
          color: #9d2525;
        }

        .toa-alert.success {
          background: #edf9f0;
          border: 1px solid #b9e5c3;
          color: #256b37;
        }

        .toa-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .toa-summary-card {
          background: white;
          border: 1px solid #e4e9ef;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 5px 16px rgba(11,41,70,.05);
        }

        .toa-summary-card span {
          color: #718096;
          font-size: 12px;
          font-weight: 700;
        }

        .toa-summary-card h2 {
          margin: 10px 0 0;
          font-size: 27px;
          color: #0b2946;
        }

        .toa-card {
          background: white;
          border: 1px solid #e4e9ef;
          border-radius: 12px;
          padding: 22px;
          margin-bottom: 22px;
          box-shadow: 0 5px 16px rgba(11,41,70,.05);
        }

        .toa-card-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 18px;
        }

        .toa-card-title h2 {
          margin: 0;
          font-size: 19px;
          color: #0b2946;
        }

        .toa-card-title p {
          margin: 6px 0 0;
          color: #718096;
          font-size: 12px;
        }

        .toa-form {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 14px;
          align-items: end;
        }

        .toa-field label {
          display: block;
          margin-bottom: 7px;
          font-size: 12px;
          font-weight: 800;
          color: #354b63;
        }

        .toa-input,
        .toa-select {
          width: 100%;
          height: 43px;
          border: 1px solid #d8e0e9;
          border-radius: 8px;
          padding: 0 12px;
          box-sizing: border-box;
          outline: none;
          background: white;
          font-size: 13px;
        }

        .toa-input:focus,
        .toa-select:focus {
          border-color: #0b2946;
        }

        .toa-primary-btn {
          height: 43px;
          border: none;
          background: #f6c20d;
          color: #0b2946;
          border-radius: 8px;
          padding: 0 20px;
          cursor: pointer;
          font-weight: 800;
          white-space: nowrap;
        }

        .toa-primary-btn:disabled {
          cursor: not-allowed;
          opacity: .55;
        }

        .toa-toolbar {
          display: grid;
          grid-template-columns: minmax(220px, 1fr) 180px;
          gap: 12px;
          margin-bottom: 16px;
        }

        .toa-table-wrapper {
          overflow-x: auto;
        }

        .toa-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 850px;
        }

        .toa-table th {
          text-align: left;
          background: #f7f9fc;
          color: #53667a;
          padding: 12px;
          border-bottom: 1px solid #e5eaf0;
          font-size: 11px;
          text-transform: uppercase;
        }

        .toa-table td {
          padding: 13px 12px;
          border-bottom: 1px solid #edf1f5;
          font-size: 12px;
          vertical-align: middle;
        }

        .toa-id {
          font-weight: 800;
          color: #0b2946;
        }

        .toa-main-text {
          display: block;
          color: #17324d;
          font-weight: 700;
        }

        .toa-sub-text {
          display: block;
          margin-top: 4px;
          color: #8996a5;
          font-size: 10px;
        }

        .toa-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
        }

        .toa-badge.green {
          color: #20733a;
          background: #e9f7ed;
        }

        .toa-badge.red {
          color: #a12b2b;
          background: #fff0f0;
        }

        .toa-action-btn {
          border: 1px solid #d8e0e9;
          background: white;
          color: #0b2946;
          border-radius: 7px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 800;
        }

        .toa-action-btn:hover {
          background: #f6c20d;
          border-color: #f6c20d;
        }

        .toa-empty {
          text-align: center;
          color: #8996a5;
          padding: 28px !important;
        }

        .toa-loading {
          padding: 45px;
          text-align: center;
          color: #718096;
        }

        @media(max-width: 950px) {
          .toa-summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .toa-form {
            grid-template-columns: 1fr;
          }
        }

        @media(max-width: 650px) {
          .toa-page {
            padding: 20px;
          }

          .toa-header {
            flex-direction: column;
          }

          .toa-summary-grid {
            grid-template-columns: 1fr;
          }

          .toa-toolbar {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="toa-header">
        <div>
          <h1>Taxi Operator Area Management</h1>
          <p>
            Assign Taxi Operators to Operational Areas such as Pettah,
            BIA, Borella and other service locations.
          </p>
        </div>

        <button
          type="button"
          className="toa-back-btn"
          onClick={goBack}
        >
          ← Dashboard
        </button>
      </div>

      {error && (
        <div className="toa-alert error">
          <strong>Error: </strong>
          {error}
        </div>
      )}

      {message && (
        <div className="toa-alert success">
          <strong>Success: </strong>
          {message}
        </div>
      )}

      <div className="toa-summary-grid">
        <div className="toa-summary-card">
          <span>Total Taxi Operators</span>
          <h2>{operators.length}</h2>
        </div>

        <div className="toa-summary-card">
          <span>Operators With Active Areas</span>
          <h2>{assignedOperatorIds.size}</h2>
        </div>

        <div className="toa-summary-card">
          <span>Active Assignments</span>
          <h2>{activeAssignmentCount}</h2>
        </div>

        <div className="toa-summary-card">
          <span>Inactive Assignments</span>
          <h2>{inactiveAssignmentCount}</h2>
        </div>
      </div>

      <section className="toa-card">
        <div className="toa-card-title">
          <div>
            <h2>Assign Operational Area</h2>
            <p>
              Select an active Taxi Operator and an active Operational
              Area.
            </p>
          </div>
        </div>

        <form className="toa-form" onSubmit={handleAssign}>
          <div className="toa-field">
            <label>Taxi Operator</label>

            <select
              className="toa-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Select Taxi Operator</option>

              {activeOperators.map((operator) => (
                <option
                  key={operator.userId}
                  value={operator.userId}
                >
                  {operator.fullName} - {operator.email}
                </option>
              ))}
            </select>
          </div>

          <div className="toa-field">
            <label>Operational Area</label>

            <select
              className="toa-select"
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
            >
              <option value="">Select Operational Area</option>

              {activeAreas.map((area) => (
                <option
                  key={area.operationalAreaId}
                  value={area.operationalAreaId}
                >
                  {area.areaName}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="toa-primary-btn"
            disabled={saving}
          >
            {saving ? "Please Wait..." : "+ Assign Area"}
          </button>
        </form>
      </section>

      <section className="toa-card">
        <div className="toa-card-title">
          <div>
            <h2>Taxi Operator Area Assignments</h2>
            <p>
              View, enable or disable operational area assignments.
            </p>
          </div>
        </div>

        <div className="toa-toolbar">
          <input
            className="toa-input"
            placeholder="Search operator, email or area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="toa-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="toa-loading">Loading assignments...</div>
        ) : (
          <div className="toa-table-wrapper">
            <table className="toa-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Taxi Operator</th>
                  <th>Phone</th>
                  <th>Operational Area</th>
                  <th>Area Status</th>
                  <th>Assignment</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="toa-empty">
                      No Taxi Operator area assignments found.
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map((item) => {
                    const operator = item.operator || {};
                    const area = item.operationalArea || {};

                    return (
                      <tr
                        key={
                          item.taxiOperatorOperationalAreaId
                        }
                      >
                        <td className="toa-id">
                          TOA
                          {String(
                            item.taxiOperatorOperationalAreaId
                          ).padStart(3, "0")}
                        </td>

                        <td>
                          <span className="toa-main-text">
                            {operator.fullName || "—"}
                          </span>
                          <span className="toa-sub-text">
                            {operator.email || "—"}
                          </span>
                        </td>

                        <td>{operator.phone || "—"}</td>

                        <td>
                          <span className="toa-main-text">
                            {area.areaName || "—"}
                          </span>
                          <span className="toa-sub-text">
                            {area.description || ""}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`toa-badge ${
                              area.isActive ? "green" : "red"
                            }`}
                          >
                            {area.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`toa-badge ${
                              item.isActive ? "green" : "red"
                            }`}
                          >
                            {item.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="toa-action-btn"
                            disabled={saving}
                            onClick={() =>
                              changeAssignmentStatus(item)
                            }
                          >
                            {item.isActive ? "Disable" : "Enable"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="toa-card">
        <div className="toa-card-title">
          <div>
            <h2>How It Works</h2>
            <p>
              Example: if a passenger selects Other Location →
              Makumbura and chooses Pettah, the system can identify the
              Taxi Operator responsible for the Pettah operational
              area.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "12px",
          }}
        >
          {[
            ["1", "Passenger selects an Operational Area."],
            ["2", "System finds the assigned Taxi Operator."],
            ["3", "Relevant operator handles that area's booking."],
            ["4", "Admin/Super Admin can change assignments anytime."],
          ].map(([no, text]) => (
            <div
              key={no}
              style={{
                padding: "15px",
                border: "1px solid #e5eaf0",
                borderRadius: "9px",
                background: "#fafbfd",
                fontSize: "12px",
                lineHeight: "1.6",
              }}
            >
              <strong
                style={{
                  display: "block",
                  marginBottom: "5px",
                  color: "#0b2946",
                }}
              >
                Step {no}
              </strong>

              {text}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default TaxiOperatorAreaManagement;
