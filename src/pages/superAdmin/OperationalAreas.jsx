import { useEffect, useMemo, useState } from "react";

function OperationalAreas() {
  const API_BASE_URL = "http://localhost:5171/api";

  const [areas, setAreas] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [form, setForm] = useState({
    areaName: "",
    description: "",
  });

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

  const loadAreas = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError("");
      }

      const response = await fetch(
        `${API_BASE_URL}/OperationalAreas/all`,
        { headers: getHeaders() }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.title ||
            "Unable to load operational areas."
        );
      }

      setAreas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Operational areas load error:", err);

      if (!silent) {
        setError(
          err.message || "Unable to load operational areas."
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadAreas(false);
  }, []);

  const activeCount = areas.filter((area) => area.isActive).length;
  const inactiveCount = areas.length - activeCount;

  const filteredAreas = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return areas;

    return areas.filter((area) =>
      `${area.areaName || ""} ${area.description || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [areas, search]);

  const openAddModal = () => {
    setEditingArea(null);
    setForm({
      areaName: "",
      description: "",
    });
    setError("");
    setMessage("");
    setShowModal(true);
  };

  const openEditModal = (area) => {
    setEditingArea(area);
    setForm({
      areaName: area.areaName || "",
      description: area.description || "",
    });
    setError("");
    setMessage("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingArea(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveArea = async () => {
    const areaName = form.areaName.trim();
    const description = form.description.trim();

    if (!areaName) {
      setError("Operational area name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const isEditing = Boolean(editingArea);

      const url = isEditing
        ? `${API_BASE_URL}/OperationalAreas/${editingArea.operationalAreaId}`
        : `${API_BASE_URL}/OperationalAreas`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          areaName,
          description: description || null,
        }),
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.title ||
            `Unable to ${isEditing ? "update" : "create"} operational area.`
        );
      }

      setShowModal(false);
      setEditingArea(null);

      setMessage(
        isEditing
          ? "Operational area updated successfully."
          : "Operational area added successfully."
      );

      await loadAreas(true);
    } catch (err) {
      console.error("Operational area save error:", err);
      setError(
        err.message || "Unable to save operational area."
      );
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (area) => {
    const action = area.isActive ? "disable" : "enable";

    try {
      setActionId(area.operationalAreaId);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}/OperationalAreas/${area.operationalAreaId}/${action}`,
        {
          method: "PUT",
          headers: getHeaders(),
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.title ||
            `Unable to ${action} operational area.`
        );
      }

      setMessage(
        `${area.areaName} ${
          action === "enable" ? "enabled" : "disabled"
        } successfully.`
      );

      await loadAreas(true);
    } catch (err) {
      console.error("Operational area status error:", err);
      setError(
        err.message ||
          "Unable to change operational area status."
      );
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="sa-page">
      <div className="sa-header">
        <div>
          <h1>Operational Areas</h1>
          <p>
            Manage pickup operational areas used for
            Other Location → Makumbura bookings.
          </p>
        </div>

        <button
          type="button"
          className="sa-primary-btn"
          onClick={openAddModal}
        >
          + Add Operational Area
        </button>
      </div>

      {error && (
        <div style={{
          marginBottom: "16px",
          padding: "12px 14px",
          background: "#fff1f1",
          border: "1px solid #efcccc",
          borderRadius: "7px",
          color: "#a62d2d",
          fontSize: "10px"
        }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{
          marginBottom: "16px",
          padding: "12px 14px",
          background: "#e8f6ed",
          border: "1px solid #cce9d5",
          borderRadius: "7px",
          color: "#18763a",
          fontSize: "10px"
        }}>
          {message}
        </div>
      )}

      <div className="sa-summary-grid three">
        <div className="sa-summary-card">
          <span>Total Areas</span>
          <h2>{areas.length}</h2>
        </div>

        <div className="sa-summary-card">
          <span>Active Areas</span>
          <h2>{activeCount}</h2>
        </div>

        <div className="sa-summary-card">
          <span>Disabled Areas</span>
          <h2>{inactiveCount}</h2>
        </div>
      </div>

      <div className="sa-info-box">
        <strong>How this is used</strong>
        <p>
          Only active operational areas are shown to passengers
          when they select Other Location → Makumbura.
        </p>
      </div>

      <div className="sa-card">
        <div className="sa-toolbar">
          <input
            className="sa-input"
            type="text"
            placeholder="Search operational areas..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <button
            type="button"
            className="sa-btn-neutral"
            onClick={() => loadAreas(false)}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading operational areas...</p>
        ) : filteredAreas.length === 0 ? (
          <p>No operational areas found.</p>
        ) : (
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Area Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredAreas.map((area) => (
                  <tr key={area.operationalAreaId}>
                    <td>
                      <span className="sa-id">
                        #{area.operationalAreaId}
                      </span>
                    </td>

                    <td>
                      <strong>{area.areaName}</strong>
                    </td>

                    <td>{area.description || "—"}</td>

                    <td>
                      <span
                        className={`sa-badge ${
                          area.isActive ? "green" : "gray"
                        }`}
                      >
                        {area.isActive ? "ACTIVE" : "DISABLED"}
                      </span>
                    </td>

                    <td>
                      <div className="sa-actions">
                        <button
                          type="button"
                          className="sa-btn-edit"
                          onClick={() => openEditModal(area)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className={
                            area.isActive
                              ? "sa-btn-danger"
                              : "sa-btn-view"
                          }
                          disabled={
                            actionId === area.operationalAreaId
                          }
                          onClick={() => changeStatus(area)}
                        >
                          {actionId === area.operationalAreaId
                            ? "Processing..."
                            : area.isActive
                            ? "Disable"
                            : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="sa-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="sa-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sa-modal-header">
              <h2>
                {editingArea
                  ? "Edit Operational Area"
                  : "Add Operational Area"}
              </h2>

              <button
                type="button"
                className="sa-close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <div className="sa-modal-body">
              <div className="sa-form-grid">
                <div className="sa-field">
                  <label>Area Name *</label>
                  <input
                    type="text"
                    name="areaName"
                    value={form.areaName}
                    onChange={handleChange}
                    placeholder="e.g. Pettah"
                  />
                </div>

                <div className="sa-field">
                  <label>Description</label>
                  <input
                    type="text"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Short operational area description"
                  />
                </div>
              </div>
            </div>

            <div className="sa-modal-footer">
              <button
                type="button"
                className="sa-btn-neutral"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="sa-primary-btn"
                onClick={saveArea}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingArea
                  ? "Save Changes"
                  : "Add Area"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OperationalAreas;
