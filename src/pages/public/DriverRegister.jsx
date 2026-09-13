import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = "/api";

const safeJson = async (response) => {
  const raw = await response.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
};

const initialForm = {
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
  gpsAvailable: "Yes",
};

function DriverRegister() {
  const [form, setForm] = useState(initialForm);
  const [vehicleTypes, setVehicleTypes] = useState([]);

  const [documents, setDocuments] = useState({
    nicDocument: null,
    drivingLicenseDocument: null,
    policeReportDocument: null,
    vehicleRegistrationDocument: null,
  });

  const [photos, setPhotos] = useState({
    frontPhoto: null,
    rearPhoto: null,
    sidePhoto: null,
    otherPhoto: null,
  });

  const [loadingTypes, setLoadingTypes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const loadVehicleTypes = async () => {
      try {
        setLoadingTypes(true);
        const res = await fetch(`${API_BASE_URL}/vehicletypes`);
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

  const requiredFilesReady = useMemo(
    () =>
      documents.nicDocument &&
      documents.drivingLicenseDocument &&
      documents.policeReportDocument &&
      documents.vehicleRegistrationDocument &&
      photos.frontPhoto &&
      photos.rearPhoto &&
      photos.sidePhoto,
    [documents, photos]
  );

  const validate = () => {
    const requiredFields = [
      ["fullName", "Full Name"],
      ["nic", "NIC"],
      ["phone", "Phone Number"],
      ["email", "Email Address"],
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

    for (const [key, label] of requiredFields) {
      if (!String(form[key] ?? "").trim()) {
        return `${label} is required.`;
      }
    }

    if (form.password !== form.confirmPassword) {
      return "Password and Confirm Password do not match.";
    }

    if (
      form.password.length < 8 ||
      !/[A-Z]/.test(form.password) ||
      !/[a-z]/.test(form.password) ||
      !/[0-9]/.test(form.password)
    ) {
      return "Password must be at least 8 characters and contain uppercase, lowercase and number.";
    }

    const dob = new Date(`${form.dateOfBirth}T00:00:00`);
    if (Number.isNaN(dob.getTime()) || dob >= new Date()) {
      return "Please enter a valid Date of Birth.";
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

    if (!requiredFilesReady) {
      return "Please upload all required documents and Front, Rear and Side vehicle photos.";
    }

    const documentFiles = Object.values(documents).filter(Boolean);
    for (const file of documentFiles) {
      if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
        return `Invalid document file: ${file.name}. Use JPG, JPEG, PNG or PDF.`;
      }

      if (file.size > 5 * 1024 * 1024) {
        return `${file.name} exceeds the 5 MB document limit.`;
      }
    }

    const photoFiles = Object.values(photos).filter(Boolean);
    for (const file of photoFiles) {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        return `Invalid vehicle photo: ${file.name}. Use JPG, JPEG or PNG.`;
      }

      if (file.size > 5 * 1024 * 1024) {
        return `${file.name} exceeds the 5 MB photo limit.`;
      }
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setError("");
    setMessage("");
    setResult(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);

      const body = new FormData();

      body.append("FullName", form.fullName.trim());
      body.append("Nic", form.nic.trim());
      body.append("Phone", form.phone.trim());
      body.append("Email", form.email.trim());
      body.append("Address", form.address.trim());
      body.append("DateOfBirth", form.dateOfBirth);
      body.append("Password", form.password);
      body.append("ConfirmPassword", form.confirmPassword);

      body.append("DrivingLicenseNo", form.drivingLicenseNo.trim());
      body.append("DrivingLicenseExpiry", form.drivingLicenseExpiry);

      body.append("VehicleTypeId", form.vehicleTypeId);
      body.append("RegistrationNumber", form.registrationNumber.trim());
      body.append("Make", form.make.trim());
      body.append("Model", form.model.trim());
      body.append("Color", form.color.trim());
      body.append("ManufactureYear", form.manufactureYear);
      body.append("GpsAvailable", form.gpsAvailable === "Yes" ? "true" : "false");

      body.append("NicDocument", documents.nicDocument);
      body.append(
        "DrivingLicenseDocument",
        documents.drivingLicenseDocument
      );
      body.append("PoliceReportDocument", documents.policeReportDocument);
      body.append(
        "VehicleRegistrationDocument",
        documents.vehicleRegistrationDocument
      );

      body.append("FrontPhoto", photos.frontPhoto);
      body.append("RearPhoto", photos.rearPhoto);
      body.append("SidePhoto", photos.sidePhoto);

      if (photos.otherPhoto) {
        body.append("OtherPhoto", photos.otherPhoto);
      }

      const res = await fetch(`${API_BASE_URL}/drivers/public-register`, {
        method: "POST",
        body,
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.message || "Unable to submit driver registration.");
      }

      setResult(data);
      setMessage(
        "Driver registration submitted successfully. Your account will remain pending until Admin or Super Admin verification is completed."
      );

      setForm(initialForm);
      setDocuments({
        nicDocument: null,
        drivingLicenseDocument: null,
        policeReportDocument: null,
        vehicleRegistrationDocument: null,
      });
      setPhotos({
        frontPhoto: null,
        rearPhoto: null,
        sidePhoto: null,
        otherPhoto: null,
      });
    } catch (e) {
      setError(e.message || "Unable to submit driver registration.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .driver-register-page {
          min-height: calc(100vh - 80px);
          padding: 45px 20px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .driver-register-card {
          width: 100%;
          max-width: 1050px;
          margin: auto;
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 8px 25px rgba(11,41,70,0.06);
        }

        .driver-register-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .driver-register-header h1 {
          margin: 0 0 8px;
          color: #0b2946;
          font-size: 30px;
        }

        .driver-register-header p {
          max-width: 760px;
          margin: auto;
          color: #7b8794;
          font-size: 11px;
          line-height: 1.7;
        }

        .driver-reg-badge {
          display: inline-block;
          margin-top: 12px;
          padding: 6px 11px;
          background: #fff3cc;
          color: #806300;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
        }

        .driver-reg-section {
          margin-top: 22px;
          padding: 20px;
          border: 1px solid #e3e8ed;
          border-radius: 9px;
          background: #fff;
        }

        .driver-reg-section h2 {
          margin: 0 0 5px;
          color: #0b2946;
          font-size: 16px;
        }

        .driver-reg-section > p {
          margin: 0 0 16px;
          color: #7b8794;
          font-size: 9px;
          line-height: 1.6;
        }

        .driver-register-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .driver-register-grid.three {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .driver-reg-field {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .driver-reg-field.full {
          grid-column: 1 / -1;
        }

        .driver-reg-field label {
          margin-bottom: 6px;
          color: #0b2946;
          font-size: 10px;
          font-weight: 700;
        }

        .driver-reg-field input,
        .driver-reg-field select,
        .driver-reg-field textarea {
          width: 100%;
          padding: 11px 12px;
          border: 1px solid #d9e0e6;
          border-radius: 6px;
          outline: none;
          background: white;
          color: #53616e;
          font-size: 11px;
          font-family: Arial, Helvetica, sans-serif;
        }

        .driver-reg-field textarea {
          min-height: 80px;
          resize: vertical;
        }

        .driver-reg-field input:focus,
        .driver-reg-field select:focus,
        .driver-reg-field textarea:focus {
          border-color: #f6c20d;
        }

        .driver-file-name {
          margin-top: 5px;
          color: #7b8794;
          font-size: 9px;
        }

        .driver-reg-error,
        .driver-reg-success {
          margin-top: 18px;
          padding: 15px;
          border-radius: 7px;
          font-size: 10px;
          line-height: 1.6;
        }

        .driver-reg-error {
          background: #fff0f0;
          border: 1px solid #f1caca;
          color: #9d2f2f;
        }

        .driver-reg-success {
          background: #e5f6eb;
          border: 1px solid #cbe8d3;
          color: #18763a;
        }

        .driver-register-submit {
          width: 100%;
          margin-top: 24px;
          padding: 13px;
          border: none;
          border-radius: 7px;
          background: #f6c20d;
          color: #0b2946;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .driver-register-submit:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .driver-reg-login {
          margin-top: 20px;
          text-align: center;
          color: #7a8792;
          font-size: 10px;
        }

        .driver-reg-login a {
          color: #d5a400;
          text-decoration: none;
          font-weight: 700;
        }

        .driver-reg-note {
          margin-top: 18px;
          padding: 14px;
          background: #eef5fb;
          border-left: 4px solid #0b2946;
          border-radius: 6px;
          color: #657787;
          font-size: 9px;
          line-height: 1.7;
        }

        @media(max-width: 850px) {
          .driver-register-grid,
          .driver-register-grid.three {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="driver-register-page">
        <div className="driver-register-card">
          <div className="driver-register-header">
            <h1>Driver Registration</h1>
            <p>
              Complete your personal, driving and vehicle information and upload
              the required verification documents. Your driver account will
              remain pending until an Admin or Super Admin completes verification.
            </p>
            <span className="driver-reg-badge">Verification Required</span>
          </div>

          {error && <div className="driver-reg-error">{error}</div>}
          {message && <div className="driver-reg-success">{message}</div>}

          {result && (
            <div className="driver-reg-note">
              <strong>Registration Reference:</strong> Driver #{result.driverId}
              {" · "}Vehicle #{result.vehicleId}
              {" · "}Status: {result.verificationStatus || "PENDING"}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <section className="driver-reg-section">
              <h2>1. Personal Details</h2>
              <p>Enter your personal and contact information.</p>

              <div className="driver-register-grid">
                <div className="driver-reg-field">
                  <label>Full Name *</label>
                  <input
                    value={form.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    required
                  />
                </div>

                <div className="driver-reg-field">
                  <label>NIC Number *</label>
                  <input
                    value={form.nic}
                    onChange={(e) => updateField("nic", e.target.value)}
                    required
                  />
                </div>

                <div className="driver-reg-field">
                  <label>Phone Number *</label>
                  <input
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    required
                  />
                </div>

                <div className="driver-reg-field">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    required
                  />
                </div>

                <div className="driver-reg-field">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => updateField("dateOfBirth", e.target.value)}
                    required
                  />
                </div>

                <div className="driver-reg-field full">
                  <label>Address *</label>
                  <textarea
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    required
                  />
                </div>

                <div className="driver-reg-field">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    required
                  />
                </div>

                <div className="driver-reg-field">
                  <label>Confirm Password *</label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) =>
                      updateField("confirmPassword", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
            </section>

            <section className="driver-reg-section">
              <h2>2. Driving Details</h2>
              <p>Driving licence details are required for verification.</p>

              <div className="driver-register-grid">
                <div className="driver-reg-field">
                  <label>Driving Licence Number *</label>
                  <input
                    value={form.drivingLicenseNo}
                    onChange={(e) =>
                      updateField("drivingLicenseNo", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="driver-reg-field">
                  <label>Driving Licence Expiry *</label>
                  <input
                    type="date"
                    value={form.drivingLicenseExpiry}
                    onChange={(e) =>
                      updateField("drivingLicenseExpiry", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
            </section>

            <section className="driver-reg-section">
              <h2>3. Vehicle Details</h2>
              <p>Provide the vehicle information that will be reviewed by MMC.</p>

              <div className="driver-register-grid three">
                <div className="driver-reg-field">
                  <label>Vehicle Type *</label>
                  <select
                    value={form.vehicleTypeId}
                    onChange={(e) =>
                      updateField("vehicleTypeId", e.target.value)
                    }
                    disabled={loadingTypes}
                    required
                  >
                    <option value="">
                      {loadingTypes ? "Loading..." : "Select Vehicle Type"}
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
                </div>

                <div className="driver-reg-field">
                  <label>Vehicle Registration Number *</label>
                  <input
                    value={form.registrationNumber}
                    onChange={(e) =>
                      updateField("registrationNumber", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="driver-reg-field">
                  <label>Vehicle Make *</label>
                  <input
                    value={form.make}
                    onChange={(e) => updateField("make", e.target.value)}
                    placeholder="Toyota"
                    required
                  />
                </div>

                <div className="driver-reg-field">
                  <label>Vehicle Model *</label>
                  <input
                    value={form.model}
                    onChange={(e) => updateField("model", e.target.value)}
                    placeholder="Prius"
                    required
                  />
                </div>

                <div className="driver-reg-field">
                  <label>Vehicle Color *</label>
                  <input
                    value={form.color}
                    onChange={(e) => updateField("color", e.target.value)}
                    required
                  />
                </div>

                <div className="driver-reg-field">
                  <label>Manufacture Year *</label>
                  <input
                    type="number"
                    min="1900"
                    max={currentYear + 1}
                    value={form.manufactureYear}
                    onChange={(e) =>
                      updateField("manufactureYear", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="driver-reg-field">
                  <label>GPS / Location Capability *</label>
                  <select
                    value={form.gpsAvailable}
                    onChange={(e) =>
                      updateField("gpsAvailable", e.target.value)
                    }
                  >
                    <option value="Yes">Available</option>
                    <option value="No">Not Available</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="driver-reg-section">
              <h2>4. Required Verification Documents</h2>
              <p>
                JPG/JPEG/PNG/PDF accepted. Maximum file size is 5 MB per
                document.
              </p>

              <div className="driver-register-grid">
                <div className="driver-reg-field">
                  <label>NIC Document *</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    onChange={(e) =>
                      setDocuments((current) => ({
                        ...current,
                        nicDocument: e.target.files?.[0] || null,
                      }))
                    }
                    required
                  />
                  <span className="driver-file-name">
                    {documents.nicDocument?.name || "No file selected"}
                  </span>
                </div>

                <div className="driver-reg-field">
                  <label>Driving Licence Document *</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    onChange={(e) =>
                      setDocuments((current) => ({
                        ...current,
                        drivingLicenseDocument:
                          e.target.files?.[0] || null,
                      }))
                    }
                    required
                  />
                  <span className="driver-file-name">
                    {documents.drivingLicenseDocument?.name ||
                      "No file selected"}
                  </span>
                </div>

                <div className="driver-reg-field">
                  <label>Police Report *</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    onChange={(e) =>
                      setDocuments((current) => ({
                        ...current,
                        policeReportDocument:
                          e.target.files?.[0] || null,
                      }))
                    }
                    required
                  />
                  <span className="driver-file-name">
                    {documents.policeReportDocument?.name ||
                      "No file selected"}
                  </span>
                </div>

                <div className="driver-reg-field">
                  <label>Vehicle Registration Certificate *</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    onChange={(e) =>
                      setDocuments((current) => ({
                        ...current,
                        vehicleRegistrationDocument:
                          e.target.files?.[0] || null,
                      }))
                    }
                    required
                  />
                  <span className="driver-file-name">
                    {documents.vehicleRegistrationDocument?.name ||
                      "No file selected"}
                  </span>
                </div>
              </div>
            </section>

            <section className="driver-reg-section">
              <h2>5. Vehicle Photos</h2>
              <p>
                Front, Rear and Side photos are required. JPG/JPEG/PNG only,
                maximum 5 MB each.
              </p>

              <div className="driver-register-grid">
                <div className="driver-reg-field">
                  <label>Front Photo *</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={(e) =>
                      setPhotos((current) => ({
                        ...current,
                        frontPhoto: e.target.files?.[0] || null,
                      }))
                    }
                    required
                  />
                  <span className="driver-file-name">
                    {photos.frontPhoto?.name || "No file selected"}
                  </span>
                </div>

                <div className="driver-reg-field">
                  <label>Rear Photo *</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={(e) =>
                      setPhotos((current) => ({
                        ...current,
                        rearPhoto: e.target.files?.[0] || null,
                      }))
                    }
                    required
                  />
                  <span className="driver-file-name">
                    {photos.rearPhoto?.name || "No file selected"}
                  </span>
                </div>

                <div className="driver-reg-field">
                  <label>Side Photo *</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={(e) =>
                      setPhotos((current) => ({
                        ...current,
                        sidePhoto: e.target.files?.[0] || null,
                      }))
                    }
                    required
                  />
                  <span className="driver-file-name">
                    {photos.sidePhoto?.name || "No file selected"}
                  </span>
                </div>

                <div className="driver-reg-field">
                  <label>Other Photo (Optional)</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={(e) =>
                      setPhotos((current) => ({
                        ...current,
                        otherPhoto: e.target.files?.[0] || null,
                      }))
                    }
                  />
                  <span className="driver-file-name">
                    {photos.otherPhoto?.name || "No file selected"}
                  </span>
                </div>
              </div>
            </section>

            <div className="driver-reg-note">
              After submission, the driver account is created with
              <strong> PENDING verification</strong>. The driver cannot become
              operational until MMC Admin or Super Admin reviews the required
              documents, vehicle details and vehicle photos.
            </div>

            <button
              className="driver-register-submit"
              disabled={submitting || loadingTypes}
            >
              {submitting
                ? "Submitting Registration..."
                : "Submit Driver Registration"}
            </button>
          </form>

          <div className="driver-reg-login">
            Already registered? <Link to="/login">Go to Login</Link>
          </div>
        </div>
      </main>
    </>
  );
}

export default DriverRegister;
