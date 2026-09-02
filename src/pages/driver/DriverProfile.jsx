import {
  useEffect,
  useState,
} from "react";

const API_BASE_URL =
  "http://localhost:5171/api";

function DriverProfile() {
  const [editing, setEditing] =
    useState(false);

  const [profile, setProfile] =
    useState({
      userId: null,

      name: "",
      phone: "",
      email: "",
      nic: "",

      license: "",

      vehicleType:
        "Not Assigned",

      vehicleNo:
        "Not Assigned",
    });

  const [
    originalProfile,
    setOriginalProfile,
  ] = useState(null);

  const [driver, setDriver] =
    useState(null);

  const [vehicle, setVehicle] =
    useState(null);

  const [
    verificationStatus,
    setVerificationStatus,
  ] = useState("PENDING");

  const [
    operationalStatus,
    setOperationalStatus,
  ] = useState("OFFLINE");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  /* =========================================================
     TOKEN
  ========================================================= */

  const getToken = () =>
    localStorage.getItem("token") ||
    localStorage.getItem(
      "authToken"
    ) ||
    localStorage.getItem(
      "accessToken"
    ) ||
    sessionStorage.getItem(
      "token"
    ) ||
    sessionStorage.getItem(
      "authToken"
    ) ||
    sessionStorage.getItem(
      "accessToken"
    ) ||
    "";

  const getHeaders = () => ({
    "Content-Type":
      "application/json",

    Authorization:
      `Bearer ${getToken()}`,
  });

  /* =========================================================
     UPDATE STORED LOGIN USER
  ========================================================= */

  const updateStoredUser = (
    updatedProfile
  ) => {
    const updateStorage =
      (storage) => {
        try {
          const raw =
            storage.getItem(
              "user"
            );

          if (!raw) {
            return;
          }

          const currentUser =
            JSON.parse(raw);

          const updatedUser = {
            ...currentUser,

            fullName:
              updatedProfile.name,

            phone:
              updatedProfile.phone,

            email:
              updatedProfile.email,
          };

          storage.setItem(
            "user",
            JSON.stringify(
              updatedUser
            )
          );
        } catch (err) {
          console.error(
            "Stored user update error:",
            err
          );
        }
      };

    updateStorage(localStorage);
    updateStorage(
      sessionStorage
    );
  };

  /* =========================================================
     LOAD PROFILE
  ========================================================= */

  const loadProfile =
    async () => {
      const token = getToken();

      if (!token) {
        setError(
          "Please login to your driver account."
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);

        setError("");
        setMessage("");

        const [
          userResponse,
          driverResponse,
          vehicleResponse,
          vehicleTypesResponse,
        ] = await Promise.all([
          fetch(
            `${API_BASE_URL}/users/me`,
            {
              headers:
                getHeaders(),
            }
          ),

          fetch(
            `${API_BASE_URL}/drivers/me`,
            {
              headers:
                getHeaders(),
            }
          ),

          fetch(
            `${API_BASE_URL}/vehicles/my`,
            {
              headers:
                getHeaders(),
            }
          ),

          fetch(
            `${API_BASE_URL}/vehicletypes`,
            {
              headers:
                getHeaders(),
            }
          ),
        ]);

        if (!userResponse.ok) {
          throw new Error(
            "Unable to load user information."
          );
        }

        if (!driverResponse.ok) {
          throw new Error(
            "Driver profile was not found."
          );
        }

        const currentUser =
          await userResponse.json();

        const driverData =
          await driverResponse.json();

        let vehicleData = null;

        if (vehicleResponse.ok) {
          vehicleData =
            await vehicleResponse.json();
        }

        const vehicleTypes =
          vehicleTypesResponse.ok
            ? await vehicleTypesResponse.json()
            : [];

        const assignedVehicle =
          Array.isArray(
            vehicleData
          )
            ? vehicleData[0] ||
              null
            : vehicleData;

        let vehicleTypeName =
          "Not Assigned";

        if (assignedVehicle) {
          const type =
            vehicleTypes.find(
              (item) =>
                Number(
                  item.vehicleTypeId
                ) ===
                Number(
                  assignedVehicle.vehicleTypeId
                )
            );

          if (type) {
            vehicleTypeName =
              type.typeName;
          }
        }

        const loadedProfile = {
          userId:
            currentUser.userId,

          name:
            currentUser.fullName ||
            "",

          phone:
            currentUser.phone ||
            "",

          email:
            currentUser.email ||
            "",

          nic:
            currentUser.nic ||
            "",

          license:
            driverData.drivingLicenseNo ||
            "",

          vehicleType:
            vehicleTypeName,

          vehicleNo:
            assignedVehicle
              ?.registrationNumber ||
            "Not Assigned",
        };

        setProfile(
          loadedProfile
        );

        setOriginalProfile(
          loadedProfile
        );

        setDriver(
          driverData
        );

        setVehicle(
          assignedVehicle
        );

        setVerificationStatus(
          driverData
            .verificationStatus ||
            "PENDING"
        );

        setOperationalStatus(
          driverData
            .operationalStatus ||
            "OFFLINE"
        );
      } catch (err) {
        console.error(
          "Driver profile error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load driver profile."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadProfile();
  }, []);

  /* =========================================================
     CHANGE
  ========================================================= */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setProfile(
      (current) => ({
        ...current,

        [name]: value,
      })
    );

    setError("");
    setMessage("");
  };

  /* =========================================================
     EDIT
  ========================================================= */

  const startEdit = () => {
    setOriginalProfile({
      ...profile,
    });

    setEditing(true);

    setError("");
    setMessage("");
  };

  const cancelEdit = () => {
    if (originalProfile) {
      setProfile(
        originalProfile
      );
    }

    setEditing(false);

    setError("");
    setMessage("");
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const saveProfile =
    async () => {
      if (!profile.userId) {
        setError(
          "Unable to identify driver user account."
        );

        return;
      }

      if (
        !profile.name.trim()
      ) {
        setError(
          "Full name is required."
        );

        return;
      }

      if (
        !profile.email.trim()
      ) {
        setError(
          "Email address is required."
        );

        return;
      }

      if (
        !profile.phone.trim()
      ) {
        setError(
          "Phone number is required."
        );

        return;
      }

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(
          profile.email.trim()
        )
      ) {
        setError(
          "Please enter a valid email address."
        );

        return;
      }

      try {
        setSaving(true);

        setError("");
        setMessage("");

        const response =
          await fetch(
            `${API_BASE_URL}/users/${profile.userId}`,
            {
              method: "PUT",

              headers:
                getHeaders(),

              body:
                JSON.stringify({
                  fullName:
                    profile.name.trim(),

                  email:
                    profile.email.trim(),

                  phone:
                    profile.phone.trim(),

                  nic:
                    profile.nic.trim() ||
                    null,
                }),
            }
          );

        let data = null;

        try {
          data =
            await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.title ||
              "Unable to save profile changes."
          );
        }

        const updatedProfile = {
          ...profile,

          name:
            data?.fullName ||
            profile.name.trim(),

          phone:
            data?.phone ||
            profile.phone.trim(),

          email:
            data?.email ||
            profile.email.trim(),

          nic:
            data?.nic ??
            profile.nic,
        };

        setProfile(
          updatedProfile
        );

        setOriginalProfile(
          updatedProfile
        );

        /*
          Update local/session login user.
        */

        updateStoredUser(
          updatedProfile
        );

        /*
          VERY IMPORTANT:
          Tell DriverSidebar to
          reload /users/me.
        */

        window.dispatchEvent(
          new CustomEvent(
            "driver-profile-updated",
            {
              detail: {
                fullName:
                  updatedProfile.name,

                phone:
                  updatedProfile.phone,

                email:
                  updatedProfile.email,
              },
            }
          )
        );

        setEditing(false);

        setMessage(
          "Profile updated successfully."
        );
      } catch (err) {
        console.error(
          "Profile save error:",
          err
        );

        setError(
          err?.message ||
            "Unable to save profile changes."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================================================
     INITIALS
  ========================================================= */

  const getInitials = () => {
    const name =
      profile.name?.trim();

    if (!name) {
      return "DR";
    }

    const parts =
      name.split(/\s+/);

    if (
      parts.length === 1
    ) {
      return parts[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return `${parts[0][0]}${
      parts[
        parts.length - 1
      ][0]
    }`.toUpperCase();
  };

  /* =========================================================
     STATUS
  ========================================================= */

  const formatStatus = (
    value
  ) => {
    if (!value) {
      return "Unknown";
    }

    return value
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  const verificationClass =
    verificationStatus ===
    "APPROVED"
      ? "approved"
      : verificationStatus ===
        "REJECTED"
      ? "rejected"
      : "pending";

  const verificationText =
    verificationStatus ===
    "APPROVED"
      ? "✓ Verified Driver"
      : verificationStatus ===
        "REJECTED"
      ? "✕ Verification Rejected"
      : "Verification Pending";

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <>
        <style>{`
          .dp-loading {
            min-height: 100vh;

            display: flex;
            align-items: center;
            justify-content: center;

            background: #f4f7fa;

            color: #7c8893;

            font-family:
              Arial,
              Helvetica,
              sans-serif;

            font-size: 12px;
          }
        `}</style>

        <div className="dp-loading">
          Loading driver profile...
        </div>
      </>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      <style>{`
        .dp-page {
          min-height: 100vh;

          padding: 30px;

          background: #f4f7fa;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          color: #0b2946;
        }

        .dp-header {
          margin-bottom: 22px;
        }

        .dp-header h1 {
          margin: 0 0 6px;

          font-size: 28px;
        }

        .dp-header p {
          margin: 0;

          color: #7b8794;

          font-size: 12px;
        }

        .dp-alert {
          max-width: 900px;

          margin-bottom: 14px;

          padding: 12px 14px;

          border-radius: 7px;

          font-size: 10px;
        }

        .dp-alert.error {
          background: #fff1f1;

          border:
            1px solid #efc6c6;

          color: #a53b3b;
        }

        .dp-alert.success {
          background: #eaf8ee;

          border:
            1px solid #c2e5cc;

          color: #23713a;
        }

        .dp-card {
          max-width: 900px;

          padding: 25px;

          background: white;

          border:
            1px solid #e2e7ec;

          border-radius: 10px;
        }

        .dp-top {
          display: flex;
          align-items: center;
          justify-content:
            space-between;

          gap: 20px;

          padding-bottom: 20px;

          margin-bottom: 20px;

          border-bottom:
            1px solid #edf0f3;
        }

        .dp-user {
          display: flex;
          align-items: center;

          gap: 14px;
        }

        .dp-avatar {
          width: 60px;
          height: 60px;

          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          background: #f6c20d;

          color: #0b2946;

          border-radius: 50%;

          font-size: 18px;
          font-weight: 900;
        }

        .dp-user h2 {
          margin: 0 0 7px;

          font-size: 18px;
        }

        .dp-badges {
          display: flex;
          flex-wrap: wrap;

          gap: 6px;
        }

        .dp-badge {
          display: inline-block;

          padding: 5px 9px;

          border-radius: 20px;

          font-size: 8px;
          font-weight: 800;
        }

        .dp-badge.approved {
          background: #e4f6e9;
          color: #18763a;
        }

        .dp-badge.pending {
          background: #fff3cc;
          color: #806300;
        }

        .dp-badge.rejected {
          background: #fde7e7;
          color: #a13a3a;
        }

        .dp-status {
          background: #e7f1fb;
          color: #24649f;
        }

        .dp-edit {
          border: none;

          background: #0b2946;

          color: white;

          padding: 10px 14px;

          border-radius: 6px;

          font-size: 9px;
          font-weight: 800;

          cursor: pointer;
        }

        .dp-grid {
          display: grid;

          grid-template-columns:
            repeat(2, 1fr);

          gap: 16px;
        }

        .dp-section {
          grid-column:
            1 / -1;

          margin-top: 6px;

          padding-top: 15px;

          border-top:
            1px solid #edf0f3;

          font-size: 12px;
          font-weight: 800;
        }

        .dp-section.first {
          margin-top: 0;

          padding-top: 0;

          border-top: none;
        }

        .dp-field label {
          display: block;

          margin-bottom: 6px;

          font-size: 10px;
          font-weight: 700;
        }

        .dp-field input {
          width: 100%;

          box-sizing:
            border-box;

          padding: 11px 12px;

          border:
            1px solid #d9e0e6;

          border-radius: 6px;

          outline: none;

          color: #52616e;

          font-size: 11px;
        }

        .dp-field input:disabled {
          background: #f7f9fa;

          color: #687681;
        }

        .dp-field input:not(:disabled):focus {
          border-color: #f6c20d;

          box-shadow:
            0 0 0 2px
            rgba(246,194,13,.13);
        }

        .dp-actions {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 10px;

          margin-top: 22px;
        }

        .dp-cancel,
        .dp-save {
          padding: 11px;

          border-radius: 6px;

          font-size: 10px;
          font-weight: 800;

          cursor: pointer;
        }

        .dp-cancel {
          border:
            1px solid #0b2946;

          background: white;

          color: #0b2946;
        }

        .dp-save {
          border: none;

          background: #f6c20d;

          color: #0b2946;
        }

        .dp-save:disabled,
        .dp-cancel:disabled {
          opacity: .6;

          cursor: not-allowed;
        }

        .dp-note {
          margin-top: 20px;

          padding: 13px;

          background: #eef6ff;

          border-radius: 7px;

          color: #60758a;

          font-size: 10px;

          line-height: 1.6;
        }

        @media(max-width:700px) {
          .dp-page {
            padding: 18px;
          }

          .dp-top {
            flex-direction:
              column;

            align-items:
              flex-start;
          }

          .dp-grid,
          .dp-actions {
            grid-template-columns:
              1fr;
          }

          .dp-section {
            grid-column: auto;
          }
        }
      `}</style>

      <main className="dp-page">

        <div className="dp-header">
          <h1>My Profile</h1>

          <p>
            View and manage your
            registered driver and assigned
            vehicle information.
          </p>
        </div>

        {error && (
          <div className="dp-alert error">
            {error}
          </div>
        )}

        {message && (
          <div className="dp-alert success">
            {message}
          </div>
        )}

        <div className="dp-card">

          {/* HEADER */}

          <div className="dp-top">

            <div className="dp-user">

              <div className="dp-avatar">
                {getInitials()}
              </div>

              <div>
                <h2>
                  {profile.name ||
                    "Driver"}
                </h2>

                <div className="dp-badges">

                  <span
                    className={`dp-badge ${verificationClass}`}
                  >
                    {verificationText}
                  </span>

                  <span className="dp-badge dp-status">
                    {formatStatus(
                      operationalStatus
                    )}
                  </span>

                </div>
              </div>

            </div>

            {!editing && (
              <button
                type="button"
                className="dp-edit"
                onClick={startEdit}
              >
                Edit Profile
              </button>
            )}

          </div>

          {/* DETAILS */}

          <div className="dp-grid">

            <div className="dp-section first">
              Personal Information
            </div>

            <div className="dp-field">
              <label>
                Full Name
              </label>

              <input
                name="name"
                value={profile.name}
                onChange={
                  handleChange
                }
                disabled={!editing}
              />
            </div>

            <div className="dp-field">
              <label>
                Phone Number
              </label>

              <input
                name="phone"
                value={profile.phone}
                onChange={
                  handleChange
                }
                disabled={!editing}
              />
            </div>

            <div className="dp-field">
              <label>
                Email Address
              </label>

              <input
                name="email"
                type="email"
                value={profile.email}
                onChange={
                  handleChange
                }
                disabled={!editing}
              />
            </div>

            <div className="dp-field">
              <label>
                NIC Number
              </label>

              <input
                value={
                  profile.nic ||
                  "Not Provided"
                }
                disabled
              />
            </div>

            <div className="dp-section">
              Driver Information
            </div>

            <div className="dp-field">
              <label>
                Driving License
              </label>

              <input
                value={
                  profile.license ||
                  "Not Provided"
                }
                disabled
              />
            </div>

            <div className="dp-field">
              <label>
                Verification Status
              </label>

              <input
                value={formatStatus(
                  verificationStatus
                )}
                disabled
              />
            </div>

            <div className="dp-section">
              Assigned Vehicle
            </div>

            <div className="dp-field">
              <label>
                Vehicle Type
              </label>

              <input
                value={
                  profile.vehicleType
                }
                disabled
              />
            </div>

            <div className="dp-field">
              <label>
                Vehicle Number
              </label>

              <input
                value={
                  profile.vehicleNo
                }
                disabled
              />
            </div>

            {vehicle && (
              <>
                <div className="dp-field">
                  <label>
                    Vehicle Status
                  </label>

                  <input
                    value={formatStatus(
                      vehicle
                        .operationalStatus
                    )}
                    disabled
                  />
                </div>

                <div className="dp-field">
                  <label>
                    GPS Available
                  </label>

                  <input
                    value={
                      vehicle
                        .gpsAvailable
                        ? "Yes"
                        : "No"
                    }
                    disabled
                  />
                </div>
              </>
            )}

          </div>

          {/* SAVE */}

          {editing && (
            <div className="dp-actions">

              <button
                type="button"
                className="dp-cancel"
                onClick={
                  cancelEdit
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="dp-save"
                onClick={
                  saveProfile
                }
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>
          )}

          <div className="dp-note">
            NIC, driving license,
            verification status and
            assigned vehicle information
            are controlled by MMC
            administration and cannot be
            changed directly by the
            driver.
          </div>

        </div>

      </main>
    </>
  );
}

export default DriverProfile;