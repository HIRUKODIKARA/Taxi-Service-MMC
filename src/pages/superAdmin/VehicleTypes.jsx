import { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:5171/api";

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

const getVehicleIcon = (typeName) => {
  const name = typeName?.trim().toLowerCase();

  if (name === "car") {
    return "🚗";
  }

  if (
    name === "three-wheeler" ||
    name === "three wheeler" ||
    name === "threewheeler"
  ) {
    return "🛺";
  }

  if (
    name === "bike" ||
    name === "motorbike" ||
    name === "motorcycle"
  ) {
    return "🏍️";
  }

  return "🚕";
};

function VehicleTypes() {
  const [types, setTypes] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadTypes = async () => {
    try {
      setError("");

      const res = await fetch(
        `${API_BASE_URL}/vehicletypes/all`,
        {
          headers: authHeaders(),
        }
      );

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(
          data?.message || "Unable to load vehicle types."
        );
      }

      setTypes(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(
        e.message || "Unable to load vehicle types."
      );
    }
  };

  useEffect(() => {
    loadTypes();
  }, []);

  const createType = async () => {
    const typeName = window.prompt(
      "Vehicle type name:"
    );

    if (!typeName) return;

    const passengerCapacity = Number(
      window.prompt(
        "Passenger capacity:",
        "4"
      )
    );

    if (!passengerCapacity) return;

    const description =
      window.prompt(
        "Description:",
        ""
      ) || "";

    try {
      setError("");
      setMessage("");

      const res = await fetch(
        `${API_BASE_URL}/vehicletypes`,
        {
          method: "POST",

          headers: authHeaders(),

          body: JSON.stringify({
            typeName,
            description,
            passengerCapacity,
          }),
        }
      );

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(
          data?.message ||
            "Unable to create vehicle type."
        );
      }

      setMessage(
        "Vehicle type created successfully."
      );

      await loadTypes();
    } catch (e) {
      setError(e.message);
    }
  };

  const editType = async (t) => {
    const typeName = window.prompt(
      "Vehicle type name:",
      t.typeName
    );

    if (!typeName) return;

    const passengerCapacity = Number(
      window.prompt(
        "Passenger capacity:",
        String(t.passengerCapacity)
      )
    );

    if (!passengerCapacity) return;

    const description =
      window.prompt(
        "Description:",
        t.description || ""
      ) ??
      t.description ??
      "";

    try {
      setError("");
      setMessage("");

      const res = await fetch(
        `${API_BASE_URL}/vehicletypes/${t.vehicleTypeId}`,
        {
          method: "PUT",

          headers: authHeaders(),

          body: JSON.stringify({
            typeName,
            description,
            passengerCapacity,
          }),
        }
      );

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(
          data?.message ||
            "Unable to update vehicle type."
        );
      }

      setMessage(
        "Vehicle type updated successfully."
      );

      await loadTypes();
    } catch (e) {
      setError(e.message);
    }
  };

  const toggleStatus = async (t) => {
    try {
      setError("");
      setMessage("");

      const status =
        t.status === "ACTIVE"
          ? "INACTIVE"
          : "ACTIVE";

      const res = await fetch(
        `${API_BASE_URL}/vehicletypes/${t.vehicleTypeId}/status`,
        {
          method: "PUT",

          headers: authHeaders(),

          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(
          data?.message ||
            "Unable to update status."
        );
      }

      setMessage(
        "Vehicle type status updated successfully."
      );

      await loadTypes();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div>
          <h1>Vehicle Types</h1>

          <p>
            Manage taxi vehicle categories
            available in the MMC Taxi Service.
          </p>
        </div>

        <button
          className="sa-primary-btn"
          onClick={createType}
        >
          + Add Vehicle Type
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

      <div className="sa-summary-grid three">
        <div className="sa-summary-card">
          <span>Total Types</span>

          <h2>
            {types.length}
          </h2>
        </div>

        <div className="sa-summary-card">
          <span>Active Types</span>

          <h2>
            {
              types.filter(
                (t) =>
                  t.status === "ACTIVE"
              ).length
            }
          </h2>
        </div>

        <div className="sa-summary-card">
          <span>Inactive Types</span>

          <h2>
            {
              types.filter(
                (t) =>
                  t.status === "INACTIVE"
              ).length
            }
          </h2>
        </div>
      </div>

      <div className="sa-grid-3">
        {types.map((t) => (
          <section
            className="sa-card"
            key={t.vehicleTypeId}
          >
            <div
              style={{
                fontSize: 40,
                marginBottom: 12,
              }}
            >
              {getVehicleIcon(
                t.typeName
              )}
            </div>

            <span className="sa-id">
              TYPE
              {String(
                t.vehicleTypeId
              ).padStart(3, "0")}
            </span>

            <h2
              style={{
                marginTop: 7,
              }}
            >
              {t.typeName}
            </h2>

            <span
              className={`sa-badge ${
                t.status === "ACTIVE"
                  ? "green"
                  : "red"
              }`}
            >
              {formatText(
                t.status
              )}
            </span>

            <p>
              {t.description ||
                "No description"}
            </p>

            <div
              className="sa-detail"
              style={{
                marginBottom: 14,
              }}
            >
              <span>
                Passenger Capacity
              </span>

              <strong>
                {t.passengerCapacity}{" "}
                Passenger(s)
              </strong>
            </div>

            <div className="sa-actions">
              <button
                className="sa-btn-edit"
                onClick={() =>
                  editType(t)
                }
              >
                Edit
              </button>

              <button
                className="sa-btn-neutral"
                onClick={() =>
                  toggleStatus(t)
                }
              >
                {t.status === "ACTIVE"
                  ? "Disable"
                  : "Enable"}
              </button>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

export default VehicleTypes;