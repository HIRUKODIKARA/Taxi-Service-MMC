import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://localhost:5171/api";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  "";

const jsonHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const authOnlyHeaders = () => ({
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

const emptyForm = {
  fullName: "",
  nic: "",
  phone: "",
  email: "",
  address: "",
  dateOfBirth: "",
  password: "",
  confirmPassword: "",
  drivingLicenseNo: "",
  drivingLicenseExpiry: "",
  vehicleTypeId: "",
  registrationNumber: "",
  make: "",
  model: "",
  color: "",
  manufactureYear: "",
  gpsAvailable: true,
};

const requiredDocumentConfig = [
  { key: "NIC", label: "NIC" },
  { key: "DRIVING_LICENSE", label: "Driving Licence" },
  { key: "POLICE_REPORT", label: "Police Report" },
  {
    key: "VEHICLE_REGISTRATION",
    label: "Vehicle Registration Certificate",
  },
];

const requiredPhotoConfig = [
  { key: "FRONT", label: "Front Photo" },
  { key: "REAR", label: "Rear Photo" },
  { key: "SIDE", label: "Side Photo" },
];

function DriverRegistration() {
  const [form, setForm] = useState(emptyForm);
  const [vehicleTypes, setVehicleTypes] = useState([]);

  const [documents, setDocuments] = useState({
    NIC: null,
    DRIVING_LICENSE: null,
    POLICE_REPORT: null,
    VEHICLE_REGISTRATION: null,
  });

  const [photos, setPhotos] = useState({
    FRONT: null,
    REAR: null,
    SIDE: null,
    OTHER: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState([]);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const loadVehicleTypes = async () => {
      try {
        setLoadingTypes(true);
        const res = await fetch(`${API_BASE_URL}/vehicletypes/all`, {
          headers: jsonHeaders(),
        });
        const data = await safeJson(res);

        if (!res.ok) {
          throw new Error(data?.message || "Unable to load vehicle types.");
        }

        setVehicleTypes(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || "Unable to load vehicle types.");
      } finally {
        setLoadingTypes(false);
      }
    };

    loadVehicleTypes();
  }, []);

  const updateField = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const allRequiredFilesSelected = useMemo(
    () =>
      requiredDocumentConfig.every((item) => documents[item.key]) &&
      requiredPhotoConfig.every((item) => photos[item.key]),
    [documents, photos]
  );

  const validate = () => {
    const requiredTextFields = [
      ["fullName", "Full Name"],
      ["nic", "NIC"],
      ["phone", "Phone"],
      ["email", "Email"],
      ["address", "Address"],
      ["dateOfBirth", "Date of Birth"],
      ["password", "Password"],
      ["confirmPassword", "Confirm Password"],
      ["drivingLicenseNo", "Driving Licence Number"],
      ["drivingLicenseExpiry", "Driving Licence Expiry"],
      ["vehicleTypeId", "Vehicle Type"],
      ["registrationNumber", "Vehicle Registration Number"],
      ["make", "Vehicle Make"],
      ["model", "Vehicle Model"],
      ["color", "Vehicle Color"],
      ["manufactureYear", "Manufacture Year"],
    ];

    for (const [key, label] of requiredTextFields) {
      if (!String(form[key] ?? "").trim()) {
        return `${label} is required.`;
      }
    }

    if (form.password !== form.confirmPassword) {
      return "Password and Confirm Password do not match.";
    }

    if (form.password.length < 8) {
      return "Password must contain at least 8 characters.";
    }

    if (
      !/[A-Z]/.test(form.password) ||
      !/[a-z]/.test(form.password) ||
      !/[0-9]/.test(form.password)
    ) {
      return "Password must contain uppercase, lowercase and number.";
    }

    const expiry = new Date(`${form.drivingLicenseExpiry}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(expiry.getTime()) || expiry <= today) {
      return "Driving Licence Expiry must be a future date.";
    }

    const year = Number(form.manufactureYear);
    if (!Number.isInteger(year) || year < 1900 || year > currentYear + 1) {
      return `Manufacture Year must be between 1900 and ${currentYear + 1}.`;
    }

    if (!allRequiredFilesSelected) {
      return "Please select all 4 required documents and Front, Rear and Side vehicle photos.";
    }

    const docFiles = Object.values(documents).filter(Boolean);
    const photoFiles = Object.values(photos).filter(Boolean);

    for (const file of docFiles) {
      const allowed = [
        "image/jpeg",
        "image/png",
        "application/pdf",
      ];

      if (!allowed.includes(file.type)) {
        return `Invalid document file: ${file.name}. Use JPG, JPEG, PNG or PDF.`;
      }

      if (file.size > 5 * 1024 * 1024) {
        return `Document ${file.name} exceeds the 5 MB limit.`;
      }
    }

    for (const file of photoFiles) {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        return `Invalid vehicle photo: ${file.name}. Use JPG, JPEG or PNG.`;
      }

      if (file.size > 5 * 1024 * 1024) {
        return `Vehicle photo ${file.name} exceeds the 5 MB limit.`;
      }
    }

    return "";
  };

  const uploadDocument = async (driverId, documentType, file) => {
    const body = new FormData();
    body.append("documentType", documentType);
    body.append("file", file);

    const res = await fetch(
      `${API_BASE_URL}/driverdocuments/driver/${driverId}/upload`,
      {
        method: "POST",
        headers: authOnlyHeaders(),
        body,
      }
    );

    const data = await safeJson(res);

    if (!res.ok) {
      throw new Error(
        data?.message || `Unable to upload ${documentType}.`
      );
    }

    return data;
  };

  const uploadVehiclePhoto = async (vehicleId, photoType, file) => {
    const body = new FormData();
    body.append("photoType", photoType);
    body.append("file", file);

    const res = await fetch(
      `${API_BASE_URL}/vehiclephotos/vehicle/${vehicleId}`,
      {
        method: "POST",
        headers: authOnlyHeaders(),
        body,
      }
    );

    const data = await safeJson(res);

    if (!res.ok) {
      throw new Error(
        data?.message || `Unable to upload ${photoType} vehicle photo.`
      );
    }

    return data;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setError("");
    setMessage("");
    setResult(null);
    setProgress([]);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    let registration = null;

    try {
      setProgress(["Creating driver account, driver profile and vehicle..."]);

      const registerRes = await fetch(`${API_BASE_URL}/drivers/register`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          nic: form.nic.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
          address: form.address.trim(),
          dateOfBirth: form.dateOfBirth,
          drivingLicenseNo: form.drivingLicenseNo.trim(),
          drivingLicenseExpiry: form.drivingLicenseExpiry,
          vehicleTypeId: Number(form.vehicleTypeId),
          registrationNumber: form.registrationNumber.trim(),
          make: form.make.trim(),
          model: form.model.trim(),
          color: form.color.trim(),
          manufactureYear: Number(form.manufactureYear),
          gpsAvailable: Boolean(form.gpsAvailable),
        }),
      });

      registration = await safeJson(registerRes);

      if (!registerRes.ok) {
        throw new Error(
          registration?.message || "Unable to register driver."
        );
      }

      const driverId = registration.driverId;
      const vehicleId = registration.vehicleId;

      if (!driverId || !vehicleId) {
        throw new Error(
          "Registration succeeded but driverId or vehicleId was not returned."
        );
      }

      setResult(registration);
      setProgress((p) => [
        ...p,
        `Driver record created (Driver #${driverId}).`,
        "Uploading required driver documents...",
      ]);

      for (const item of requiredDocumentConfig) {
        await uploadDocument(driverId, item.key, documents[item.key]);
        setProgress((p) => [...p, `${item.label} uploaded.`]);
      }

      setProgress((p) => [...p, "Uploading required vehicle photos..."]);

      for (const item of requiredPhotoConfig) {
        await uploadVehiclePhoto(vehicleId, item.key, photos[item.key]);
        setProgress((p) => [...p, `${item.label} uploaded.`]);
      }

      if (photos.OTHER) {
        await uploadVehiclePhoto(vehicleId, "OTHER", photos.OTHER);
        setProgress((p) => [...p, "Additional vehicle photo uploaded."]);
      }

      setProgress((p) => [
        ...p,
        "Registration package completed and sent for verification.",
      ]);

      setMessage(
        "Driver registered successfully. The driver is PENDING until the required documents and vehicle details are reviewed and approved."
      );
    } catch (e) {
      if (registration?.driverId) {
        setError(
          `${e.message || "Upload failed."} The driver account was already created as PENDING (Driver #${registration.driverId}). Do not submit the registration again. Upload the missing files from the verification/management flow.`
        );
      } else {
        setError(e.message || "Unable to complete driver registration.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setDocuments({
      NIC: null,
      DRIVING_LICENSE: null,
      POLICE_REPORT: null,
      VEHICLE_REGISTRATION: null,
    });
    setPhotos({
      FRONT: null,
      REAR: null,
      SIDE: null,
      OTHER: null,
    });
    setError("");
    setMessage("");
    setResult(null);
    setProgress([]);
  };

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div>
          <h1>Driver Registration</h1>
          <p>
            Register a new MMC taxi driver, vehicle, required documents and
            vehicle photos.
          </p>
        </div>

        <button
          type="button"
          className="sa-btn-neutral"
          onClick={resetForm}
          disabled={submitting}
        >
          Clear Form
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

      <form onSubmit={handleSubmit}>
        <section className="sa-card" style={{ marginBottom: 18 }}>
          <h2>1. Personal Details</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 14,
            }}
          >
            <label>
              Full Name *
              <input
                className="sa-input"
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                placeholder="Driver full name"
              />
            </label>

            <label>
              NIC *
              <input
                className="sa-input"
                value={form.nic}
                onChange={(e) => updateField("nic", e.target.value)}
                placeholder="NIC number"
              />
            </label>

            <label>
              Phone *
              <input
                className="sa-input"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="07XXXXXXXX"
              />
            </label>

            <label>
              Email *
              <input
                className="sa-input"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="driver@example.com"
              />
            </label>

            <label>
              Date of Birth *
              <input
                className="sa-input"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => updateField("dateOfBirth", e.target.value)}
              />
            </label>

            <label style={{ gridColumn: "1 / -1" }}>
              Address *
              <input
                className="sa-input"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Residential address"
              />
            </label>

            <label>
              Password *
              <input
                className="sa-input"
                type="password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </label>

            <label>
              Confirm Password *
              <input
                className="sa-input"
                type="password"
                value={form.confirmPassword}
                onChange={(e) =>
                  updateField("confirmPassword", e.target.value)
                }
                placeholder="Repeat password"
              />
            </label>
          </div>
        </section>

        <section className="sa-card" style={{ marginBottom: 18 }}>
          <h2>2. Driving Details</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 14,
            }}
          >
            <label>
              Driving Licence Number *
              <input
                className="sa-input"
                value={form.drivingLicenseNo}
                onChange={(e) =>
                  updateField("drivingLicenseNo", e.target.value)
                }
                placeholder="Licence number"
              />
            </label>

            <label>
              Driving Licence Expiry *
              <input
                className="sa-input"
                type="date"
                value={form.drivingLicenseExpiry}
                onChange={(e) =>
                  updateField("drivingLicenseExpiry", e.target.value)
                }
              />
            </label>
          </div>
        </section>

        <section className="sa-card" style={{ marginBottom: 18 }}>
          <h2>3. Vehicle Details</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            <label>
              Vehicle Type *
              <select
                className="sa-input"
                value={form.vehicleTypeId}
                onChange={(e) =>
                  updateField("vehicleTypeId", e.target.value)
                }
                disabled={loadingTypes}
              >
                <option value="">
                  {loadingTypes ? "Loading..." : "Select vehicle type"}
                </option>
                {vehicleTypes.map((type) => (
                  <option
                    key={type.vehicleTypeId}
                    value={type.vehicleTypeId}
                  >
                    {type.typeName}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Registration Number *
              <input
                className="sa-input"
                value={form.registrationNumber}
                onChange={(e) =>
                  updateField("registrationNumber", e.target.value)
                }
                placeholder="WP ABC-1234"
              />
            </label>

            <label>
              Make *
              <input
                className="sa-input"
                value={form.make}
                onChange={(e) => updateField("make", e.target.value)}
                placeholder="Toyota"
              />
            </label>

            <label>
              Model *
              <input
                className="sa-input"
                value={form.model}
                onChange={(e) => updateField("model", e.target.value)}
                placeholder="Prius"
              />
            </label>

            <label>
              Color *
              <input
                className="sa-input"
                value={form.color}
                onChange={(e) => updateField("color", e.target.value)}
                placeholder="White"
              />
            </label>

            <label>
              Manufacture Year *
              <input
                className="sa-input"
                type="number"
                min="1900"
                max={currentYear + 1}
                value={form.manufactureYear}
                onChange={(e) =>
                  updateField("manufactureYear", e.target.value)
                }
                placeholder={String(currentYear)}
              />
            </label>

            <label
              style={{
                display: "flex",
                gap: 9,
                alignItems: "center",
                marginTop: 24,
              }}
            >
              <input
                type="checkbox"
                checked={form.gpsAvailable}
                onChange={(e) =>
                  updateField("gpsAvailable", e.target.checked)
                }
              />
              GPS Available
            </label>
          </div>
        </section>

        <section className="sa-card" style={{ marginBottom: 18 }}>
          <h2>4. Required Documents</h2>
          <p>Accepted formats: JPG, JPEG, PNG or PDF. Maximum 5 MB each.</p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 14,
            }}
          >
            {requiredDocumentConfig.map((item) => (
              <label key={item.key}>
                {item.label} *
                <input
                  className="sa-input"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={(e) =>
                    setDocuments((current) => ({
                      ...current,
                      [item.key]: e.target.files?.[0] || null,
                    }))
                  }
                />
                <small>
                  {documents[item.key]?.name || "No file selected"}
                </small>
              </label>
            ))}
          </div>
        </section>

        <section className="sa-card" style={{ marginBottom: 18 }}>
          <h2>5. Vehicle Photos</h2>
          <p>
            Front, Rear and Side photos are required. JPG/JPEG/PNG, maximum
            5 MB each.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 14,
            }}
          >
            {requiredPhotoConfig.map((item) => (
              <label key={item.key}>
                {item.label} *
                <input
                  className="sa-input"
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  onChange={(e) =>
                    setPhotos((current) => ({
                      ...current,
                      [item.key]: e.target.files?.[0] || null,
                    }))
                  }
                />
                <small>{photos[item.key]?.name || "No file selected"}</small>
              </label>
            ))}

            <label>
              Other Photo (Optional)
              <input
                className="sa-input"
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={(e) =>
                  setPhotos((current) => ({
                    ...current,
                    OTHER: e.target.files?.[0] || null,
                  }))
                }
              />
              <small>{photos.OTHER?.name || "No file selected"}</small>
            </label>
          </div>
        </section>

        {progress.length > 0 && (
          <section className="sa-card" style={{ marginBottom: 18 }}>
            <h2>Registration Progress</h2>
            <ol>
              {progress.map((item, index) => (
                <li key={`${index}-${item}`}>{item}</li>
              ))}
            </ol>
          </section>
        )}

        {result && (
          <section className="sa-card" style={{ marginBottom: 18 }}>
            <h2>Created Registration</h2>
            <p>
              <strong>Driver ID:</strong> {result.driverId}
            </p>
            <p>
              <strong>Vehicle ID:</strong> {result.vehicleId}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {result.verificationStatus || "PENDING"}
            </p>
          </section>
        )}

        <section className="sa-card">
          <div className="sa-actions">
            <button
              type="submit"
              className="sa-btn-edit"
              disabled={submitting || loadingTypes}
            >
              {submitting
                ? "Registering Driver..."
                : "Register Driver & Submit for Verification"}
            </button>

            <button
              type="button"
              className="sa-btn-neutral"
              onClick={resetForm}
              disabled={submitting}
            >
              Clear
            </button>
          </div>
        </section>
      </form>
    </main>
  );
}

export default DriverRegistration;
