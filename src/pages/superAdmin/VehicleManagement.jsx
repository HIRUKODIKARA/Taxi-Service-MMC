import {
  useEffect,
  useMemo,
  useState,
} from "react";

const API_BASE_URL =
  "/api";

/* =========================================================
   AUTH
========================================================= */

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("authToken") ||
  sessionStorage.getItem("accessToken") ||
  "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const safeJson = async (response) => {
  const raw = await response.text();

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {
      message: raw,
    };
  }
};

const formatText = (value) =>
  (value || "—")
    .toString()
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) =>
      c.toUpperCase()
    );

/* =========================================================
   COMPONENT
========================================================= */

function VehicleManagement() {
  const [vehicles, setVehicles] =
    useState([]);

  const [drivers, setDrivers] =
    useState([]);

  const [users, setUsers] =
    useState([]);

  const [types, setTypes] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    showVehicleModal,
    setShowVehicleModal,
  ] = useState(false);

  const [
    editingVehicle,
    setEditingVehicle,
  ] = useState(null);

  const [form, setForm] =
    useState({
      registrationNumber: "",
      vehicleTypeId: "",
      driverId: "",
      gpsAvailable: true,
    });

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadData = async (
    showMessage = false
  ) => {
    try {
      setLoading(true);

      setError("");

      if (!showMessage) {
        setMessage("");
      }

      const responses =
        await Promise.all([
          fetch(
            `${API_BASE_URL}/vehicles`,
            {
              headers:
                authHeaders(),
            }
          ),

          fetch(
            `${API_BASE_URL}/drivers`,
            {
              headers:
                authHeaders(),
            }
          ),

          fetch(
            `${API_BASE_URL}/users`,
            {
              headers:
                authHeaders(),
            }
          ),

          fetch(
            `${API_BASE_URL}/vehicletypes/all`,
            {
              headers:
                authHeaders(),
            }
          ),
        ]);

      const data =
        await Promise.all(
          responses.map(
            safeJson
          )
        );

      if (!responses[0].ok) {
        throw new Error(
          data[0]?.message ||
            "Unable to load vehicles."
        );
      }

      if (!responses[1].ok) {
        throw new Error(
          data[1]?.message ||
            "Unable to load drivers."
        );
      }

      if (!responses[2].ok) {
        throw new Error(
          data[2]?.message ||
            "Unable to load users."
        );
      }

      if (!responses[3].ok) {
        throw new Error(
          data[3]?.message ||
            "Unable to load vehicle types."
        );
      }

      setVehicles(
        Array.isArray(data[0])
          ? data[0]
          : []
      );

      setDrivers(
        Array.isArray(data[1])
          ? data[1]
          : []
      );

      setUsers(
        Array.isArray(data[2])
          ? data[2]
          : []
      );

      setTypes(
        Array.isArray(data[3])
          ? data[3]
          : []
      );

      if (showMessage) {
        setMessage(
          "Vehicle information refreshed successfully."
        );
      }
    } catch (err) {
      console.error(
        "Vehicle management load error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load vehicle information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =========================================================
     DRIVER / TYPE HELPERS
  ========================================================= */

  const getDriverName = (
    driverId
  ) => {
    const driver =
      drivers.find(
        (item) =>
          Number(
            item.driverId
          ) === Number(driverId)
      );

    if (!driver) {
      return "Not Assigned";
    }

    const user =
      users.find(
        (item) =>
          Number(item.userId) ===
          Number(driver.userId)
      );

    return (
      user?.fullName ||
      `Driver #${driverId}`
    );
  };

  const getVehicleTypeName = (
    vehicleTypeId
  ) => {
    const type =
      types.find(
        (item) =>
          Number(
            item.vehicleTypeId
          ) ===
          Number(vehicleTypeId)
      );

    return (
      type?.typeName ||
      `Type #${vehicleTypeId}`
    );
  };

  const getVehicleIcon = (
    typeName
  ) => {
    const normalized =
      (typeName || "")
        .toUpperCase();

    if (
      normalized.includes("CAR")
    ) {
      return "🚗";
    }

    if (
      normalized.includes("THREE") ||
      normalized.includes("TUK")
    ) {
      return "🛺";
    }

    if (
      normalized.includes("BIKE") ||
      normalized.includes("MOTOR")
    ) {
      return "🏍️";
    }

    return "🚕";
  };

  /* =========================================================
     TABLE ROWS
  ========================================================= */

  const rows = useMemo(() => {
    return vehicles
      .map((vehicle) => ({
        ...vehicle,

        driverName:
          getDriverName(
            vehicle.driverId
          ),

        typeName:
          getVehicleTypeName(
            vehicle.vehicleTypeId
          ),
      }))
      .filter((vehicle) => {
        const query =
          search
            .trim()
            .toLowerCase();

        const matchesSearch =
          `${vehicle.registrationNumber || ""}
           ${vehicle.driverName || ""}
           ${vehicle.typeName || ""}`
            .toLowerCase()
            .includes(query);

        const matchesStatus =
          statusFilter ===
            "ALL" ||
          vehicle.operationalStatus ===
            statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      });
  }, [
    vehicles,
    drivers,
    users,
    types,
    search,
    statusFilter,
  ]);

  /* =========================================================
     FORM
  ========================================================= */

  const resetForm = () => {
    setForm({
      registrationNumber: "",
      vehicleTypeId: "",
      driverId: "",
      gpsAvailable: true,
    });

    setEditingVehicle(null);
  };

  const openCreateModal = () => {
    resetForm();

    setError("");
    setMessage("");

    setShowVehicleModal(true);
  };

  const openEditModal = (
    vehicle
  ) => {
    setEditingVehicle(
      vehicle
    );

    setForm({
      registrationNumber:
        vehicle.registrationNumber ||
        "",

      vehicleTypeId:
        String(
          vehicle.vehicleTypeId ||
            ""
        ),

      driverId:
        vehicle.driverId
          ? String(
              vehicle.driverId
            )
          : "",

      gpsAvailable:
        Boolean(
          vehicle.gpsAvailable
        ),
    });

    setError("");
    setMessage("");

    setShowVehicleModal(true);
  };

  const closeVehicleModal =
    () => {
      if (saving) {
        return;
      }

      setShowVehicleModal(
        false
      );

      resetForm();
    };

  const handleFormChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  /* =========================================================
     SAVE VEHICLE
  ========================================================= */

  const saveVehicle =
    async (event) => {
      event.preventDefault();

      if (saving) {
        return;
      }

      if (
        !form.registrationNumber
          .trim()
      ) {
        setError(
          "Vehicle registration number is required."
        );

        return;
      }

      if (
        !form.vehicleTypeId
      ) {
        setError(
          "Please select a vehicle type."
        );

        return;
      }

      try {
        setSaving(true);

        setError("");
        setMessage("");

        const payload = {
          registrationNumber:
            form.registrationNumber
              .trim(),

          vehicleTypeId:
            Number(
              form.vehicleTypeId
            ),

          driverId:
            form.driverId
              ? Number(
                  form.driverId
                )
              : null,

          gpsAvailable:
            Boolean(
              form.gpsAvailable
            ),
        };

        const isEditing =
          Boolean(
            editingVehicle
          );

        const url =
          isEditing
            ? `${API_BASE_URL}/vehicles/${editingVehicle.vehicleId}`
            : `${API_BASE_URL}/vehicles`;

        const response =
          await fetch(url, {
            method:
              isEditing
                ? "PUT"
                : "POST",

            headers:
              authHeaders(),

            body:
              JSON.stringify(
                payload
              ),
          });

        const data =
          await safeJson(
            response
          );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.title ||
              "Unable to save vehicle."
          );
        }

        setShowVehicleModal(
          false
        );

        resetForm();

        setMessage(
          data?.message ||
            (isEditing
              ? "Vehicle updated successfully."
              : "Vehicle created successfully.")
        );

        await loadData();
      } catch (err) {
        console.error(
          "Vehicle save error:",
          err
        );

        setError(
          err?.message ||
            "Unable to save vehicle."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================================================
     UPDATE OPERATIONAL STATUS
  ========================================================= */

  const updateStatus =
    async (
      vehicle,
      status
    ) => {
      try {
        setError("");
        setMessage("");

        const response =
          await fetch(
            `${API_BASE_URL}/vehicles/${vehicle.vehicleId}/status`,
            {
              method: "PUT",

              headers:
                authHeaders(),

              body:
                JSON.stringify({
                  status,
                }),
            }
          );

        const data =
          await safeJson(
            response
          );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to update vehicle status."
          );
        }

        setMessage(
          data?.message ||
            "Vehicle status updated successfully."
        );

        await loadData();
      } catch (err) {
        console.error(
          "Vehicle status error:",
          err
        );

        setError(
          err?.message ||
            "Unable to update vehicle status."
        );
      }
    };

  /* =========================================================
     ACCOUNT STATUS
  ========================================================= */

  const toggleAccount =
    async (vehicle) => {
      try {
        setError("");
        setMessage("");

        const action =
          vehicle.accountStatus ===
          "ACTIVE"
            ? "deactivate"
            : "activate";

        const response =
          await fetch(
            `${API_BASE_URL}/vehicles/${vehicle.vehicleId}/${action}`,
            {
              method: "PUT",

              headers:
                authHeaders(),
            }
          );

        const data =
          await safeJson(
            response
          );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to update vehicle account."
          );
        }

        setMessage(
          data?.message ||
            "Vehicle account updated successfully."
        );

        await loadData();
      } catch (err) {
        console.error(
          "Vehicle account error:",
          err
        );

        setError(
          err?.message ||
            "Unable to update vehicle account."
        );
      }
    };

  /* =========================================================
     ACTIVE TYPES / APPROVED DRIVERS
  ========================================================= */

  const activeTypes =
    types.filter(
      (type) =>
        type.status ===
        "ACTIVE"
    );

  const approvedDrivers =
    drivers.filter((driver) => {
      if (
        driver.verificationStatus !==
        "APPROVED"
      ) {
        return false;
      }

      const user =
        users.find(
          (item) =>
            Number(
              item.userId
            ) ===
            Number(
              driver.userId
            )
        );

      return (
        user?.accountStatus ===
        "ACTIVE"
      );
    });

  /* =========================================================
     UI
  ========================================================= */

  return (
    <main className="sa-page">
      <style>{`
        .vehicle-header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .vehicle-modal-overlay {
          position: fixed;
          inset: 0;

          background:
            rgba(4, 19, 33, .65);

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 20px;

          z-index: 6000;
        }

        .vehicle-modal {
          width: 100%;
          max-width: 620px;

          background: white;

          border-radius: 12px;

          box-shadow:
            0 20px 50px
            rgba(0,0,0,.25);

          overflow: hidden;
        }

        .vehicle-modal-header {
          display: flex;
          align-items: center;
          justify-content:
            space-between;

          gap: 15px;

          padding: 18px 20px;

          background: #0b2946;

          color: white;
        }

        .vehicle-modal-header h2 {
          margin: 0;

          font-size: 17px;
        }

        .vehicle-modal-close {
          border: none;

          background: transparent;

          color: white;

          font-size: 22px;

          cursor: pointer;
        }

        .vehicle-modal-body {
          padding: 22px;
        }

        .vehicle-form-grid {
          display: grid;

          grid-template-columns:
            repeat(2, 1fr);

          gap: 15px;
        }

        .vehicle-form-field.full {
          grid-column: 1 / -1;
        }

        .vehicle-form-field label {
          display: block;

          margin-bottom: 6px;

          color: #0b2946;

          font-size: 10px;

          font-weight: 800;
        }

        .vehicle-form-field input,
        .vehicle-form-field select {
          width: 100%;

          box-sizing: border-box;

          padding: 11px 12px;

          border:
            1px solid #d8e0e6;

          border-radius: 6px;

          outline: none;

          background: white;

          color: #34495c;
        }

        .vehicle-form-field input:focus,
        .vehicle-form-field select:focus {
          border-color: #f6c20d;

          box-shadow:
            0 0 0 3px
            rgba(246,194,13,.12);
        }

        .vehicle-checkbox {
          display: flex;

          align-items: center;

          gap: 9px;

          min-height: 42px;

          padding: 0 3px;
        }

        .vehicle-checkbox input {
          width: auto;
        }

        .vehicle-checkbox span {
          color: #53616e;

          font-size: 10px;

          font-weight: 700;
        }

        .vehicle-modal-note {
          margin-top: 17px;

          padding: 12px;

          background: #eef6ff;

          border-radius: 7px;

          color: #5e7488;

          font-size: 9px;

          line-height: 1.6;
        }

        .vehicle-modal-actions {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 10px;

          margin-top: 18px;
        }

        .vehicle-cancel-btn {
          border:
            1px solid #0b2946;

          background: white;

          color: #0b2946;

          padding: 11px;

          border-radius: 6px;

          font-weight: 800;

          cursor: pointer;
        }

        .vehicle-save-btn {
          border: none;

          background: #f6c20d;

          color: #0b2946;

          padding: 11px;

          border-radius: 6px;

          font-weight: 800;

          cursor: pointer;
        }

        .vehicle-save-btn:disabled,
        .vehicle-cancel-btn:disabled {
          opacity: .6;

          cursor:
            not-allowed;
        }

        .vehicle-table-icon {
          margin-right: 5px;
        }

        @media(max-width:700px) {
          .vehicle-header-actions {
            width: 100%;
            flex-direction: column;
          }

          .vehicle-header-actions button {
            width: 100%;
          }

          .vehicle-form-grid,
          .vehicle-modal-actions {
            grid-template-columns:
              1fr;
          }

          .vehicle-form-field.full {
            grid-column: auto;
          }
        }
      `}</style>

      {/* HEADER */}

      <div className="sa-header">
        <div>
          <h1>
            Vehicle Management
          </h1>

          <p>
            Register, monitor and
            manage MMC taxi vehicles.
          </p>
        </div>

        <div className="vehicle-header-actions">
          <button
            type="button"
            className="sa-btn-neutral"
            onClick={() =>
              loadData(true)
            }
          >
            Refresh
          </button>

          <button
            type="button"
            className="sa-primary-btn"
            onClick={
              openCreateModal
            }
          >
            + Add Vehicle
          </button>
        </div>
      </div>

      {/* MESSAGES */}

      {error && (
        <div className="sa-info-box">
          <strong>
            Error
          </strong>

          <p>{error}</p>
        </div>
      )}

      {message && (
        <div className="sa-info-box">
          <strong>
            Success
          </strong>

          <p>{message}</p>
        </div>
      )}

      {/* SUMMARY */}

      <div className="sa-summary-grid">
        <div className="sa-summary-card">
          <span>
            Total Vehicles
          </span>

          <h2>
            {vehicles.length}
          </h2>
        </div>

        <div className="sa-summary-card">
          <span>
            Available
          </span>

          <h2>
            {
              vehicles.filter(
                (vehicle) =>
                  vehicle.operationalStatus ===
                  "AVAILABLE"
              ).length
            }
          </h2>
        </div>

        <div className="sa-summary-card">
          <span>
            On Ride
          </span>

          <h2>
            {
              vehicles.filter(
                (vehicle) =>
                  vehicle.operationalStatus ===
                  "ON_RIDE"
              ).length
            }
          </h2>
        </div>

        <div className="sa-summary-card">
          <span>
            Offline
          </span>

          <h2>
            {
              vehicles.filter(
                (vehicle) =>
                  vehicle.operationalStatus ===
                  "OFFLINE"
              ).length
            }
          </h2>
        </div>
      </div>

      {/* TABLE */}

      <section className="sa-card">
        <div className="sa-toolbar">
          <input
            className="sa-input"
            placeholder="Search vehicle, driver or type..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

          <select
            className="sa-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Status
            </option>

            <option value="AVAILABLE">
              Available
            </option>

            <option value="ON_RIDE">
              On Ride
            </option>

            <option value="OFFLINE">
              Offline
            </option>
          </select>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>
                  Vehicle No.
                </th>
                <th>Type</th>
                <th>Driver</th>
                <th>GPS</th>
                <th>Status</th>
                <th>Account</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8">
                    Loading vehicles...
                  </td>
                </tr>
              ) : rows.length ===
                0 ? (
                <tr>
                  <td colSpan="8">
                    No vehicles found.
                  </td>
                </tr>
              ) : (
                rows.map(
                  (vehicle) => (
                    <tr
                      key={
                        vehicle.vehicleId
                      }
                    >
                      <td className="sa-id">
                        VEH
                        {String(
                          vehicle.vehicleId
                        ).padStart(
                          3,
                          "0"
                        )}
                      </td>

                      <td>
                        <span className="vehicle-table-icon">
                          {getVehicleIcon(
                            vehicle.typeName
                          )}
                        </span>

                        {
                          vehicle.registrationNumber
                        }
                      </td>

                      <td>
                        {
                          vehicle.typeName
                        }
                      </td>

                      <td>
                        {
                          vehicle.driverName
                        }
                      </td>

                      <td>
                        {vehicle.gpsAvailable
                          ? "Enabled"
                          : "Disabled"}
                      </td>

                      <td>
                        <span
                          className={`sa-badge ${
                            vehicle.operationalStatus ===
                            "AVAILABLE"
                              ? "green"
                              : vehicle.operationalStatus ===
                                "ON_RIDE"
                              ? "blue"
                              : "red"
                          }`}
                        >
                          {formatText(
                            vehicle.operationalStatus
                          )}
                        </span>
                      </td>

                      <td>
                        {formatText(
                          vehicle.accountStatus
                        )}
                      </td>

                      <td>
                        <div className="sa-actions">
                          <button
                            type="button"
                            className="sa-btn-neutral"
                            onClick={() =>
                              openEditModal(
                                vehicle
                              )
                            }
                          >
                            Edit
                          </button>

                          {vehicle.operationalStatus !==
                            "ON_RIDE" && (
                            <button
                              type="button"
                              className="sa-btn-edit"
                              onClick={() =>
                                updateStatus(
                                  vehicle,
                                  vehicle.operationalStatus ===
                                    "AVAILABLE"
                                    ? "OFFLINE"
                                    : "AVAILABLE"
                                )
                              }
                            >
                              {vehicle.operationalStatus ===
                              "AVAILABLE"
                                ? "Set Offline"
                                : "Set Available"}
                            </button>
                          )}

                          <button
                            type="button"
                            className="sa-btn-neutral"
                            onClick={() =>
                              toggleAccount(
                                vehicle
                              )
                            }
                          >
                            {vehicle.accountStatus ===
                            "ACTIVE"
                              ? "Disable"
                              : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ADD / EDIT MODAL */}

      {showVehicleModal && (
        <div className="vehicle-modal-overlay">
          <div className="vehicle-modal">

            <div className="vehicle-modal-header">
              <h2>
                {editingVehicle
                  ? "Edit Vehicle"
                  : "Add Vehicle"}
              </h2>

              <button
                type="button"
                className="vehicle-modal-close"
                onClick={
                  closeVehicleModal
                }
              >
                ×
              </button>
            </div>

            <form
              className="vehicle-modal-body"
              onSubmit={
                saveVehicle
              }
            >
              <div className="vehicle-form-grid">

                <div className="vehicle-form-field full">
                  <label>
                    Vehicle Registration Number
                  </label>

                  <input
                    type="text"
                    name="registrationNumber"
                    placeholder="Example: WP BI-7890"
                    value={
                      form.registrationNumber
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                  />
                </div>

                <div className="vehicle-form-field">
                  <label>
                    Vehicle Type
                  </label>

                  <select
                    name="vehicleTypeId"
                    value={
                      form.vehicleTypeId
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                  >
                    <option value="">
                      Select vehicle type
                    </option>

                    {activeTypes.map(
                      (type) => (
                        <option
                          key={
                            type.vehicleTypeId
                          }
                          value={
                            type.vehicleTypeId
                          }
                        >
                          {getVehicleIcon(
                            type.typeName
                          )}{" "}
                          {type.typeName}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="vehicle-form-field">
                  <label>
                    Assigned Driver
                  </label>

                  <select
                    name="driverId"
                    value={
                      form.driverId
                    }
                    onChange={
                      handleFormChange
                    }
                  >
                    <option value="">
                      Not Assigned
                    </option>

                    {approvedDrivers.map(
                      (driver) => (
                        <option
                          key={
                            driver.driverId
                          }
                          value={
                            driver.driverId
                          }
                        >
                          {getDriverName(
                            driver.driverId
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="vehicle-form-field full">
                  <label>
                    GPS Availability
                  </label>

                  <div className="vehicle-checkbox">
                    <input
                      type="checkbox"
                      name="gpsAvailable"
                      checked={
                        form.gpsAvailable
                      }
                      onChange={
                        handleFormChange
                      }
                    />

                    <span>
                      GPS tracking is available for this vehicle
                    </span>
                  </div>
                </div>

              </div>

              <div className="vehicle-modal-note">
                New vehicles are created as
                <strong> Offline </strong>
                for safety. After creating the
                vehicle, assign an approved driver
                and click
                <strong> Set Available </strong>
                before Taxi Operations can assign
                it to a booking.
              </div>

              <div className="vehicle-modal-actions">
                <button
                  type="button"
                  className="vehicle-cancel-btn"
                  onClick={
                    closeVehicleModal
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="vehicle-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingVehicle
                    ? "Save Changes"
                    : "Add Vehicle"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default VehicleManagement;