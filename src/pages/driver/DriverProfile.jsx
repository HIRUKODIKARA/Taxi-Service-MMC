import { useEffect, useState } from "react";

function DriverProfile() {
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    email: "",
    nic: "",
    license: "",
    vehicleType: "Not Assigned",
    vehicleNo: "Not Assigned",
  });

  const [originalProfile, setOriginalProfile] =
    useState(null);

  const [driver, setDriver] = useState(null);
  const [vehicle, setVehicle] = useState(null);

  const [verificationStatus, setVerificationStatus] =
    useState("PENDING");

  const [operationalStatus, setOperationalStatus] =
    useState("OFFLINE");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getStoredUser = () => {
    try {
      const localUser = localStorage.getItem("user");
      const sessionUser = sessionStorage.getItem("user");

      if (localUser) {
        return JSON.parse(localUser);
      }

      if (sessionUser) {
        return JSON.parse(sessionUser);
      }

      return null;
    } catch {
      return null;
    }
  };

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      ""
    );
  };

  const getHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  const storedUser = getStoredUser();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!storedUser) {
      setError("Please login to your driver account.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        usersResponse,
        driverResponse,
        vehiclesResponse,
        vehicleTypesResponse,
      ] = await Promise.all([
        fetch("http://localhost:5171/api/users", {
          headers: getHeaders(),
        }),

        fetch(
          `http://localhost:5171/api/drivers/user/${storedUser.userId}`,
          {
            headers: getHeaders(),
          }
        ),

        fetch("http://localhost:5171/api/vehicles", {
          headers: getHeaders(),
        }),

        fetch("http://localhost:5171/api/vehicletypes", {
          headers: getHeaders(),
        }),
      ]);

      if (!usersResponse.ok) {
        throw new Error(
          "Unable to load user information."
        );
      }

      if (!driverResponse.ok) {
        throw new Error(
          "Driver profile was not found for this account."
        );
      }

      const users = await usersResponse.json();
      const driverData = await driverResponse.json();

      const vehicles = vehiclesResponse.ok
        ? await vehiclesResponse.json()
        : [];

      const vehicleTypes = vehicleTypesResponse.ok
        ? await vehicleTypesResponse.json()
        : [];

      const currentUser = users.find(
        (item) =>
          Number(item.userId) ===
          Number(storedUser.userId)
      );

      if (!currentUser) {
        throw new Error(
          "User information was not found."
        );
      }

      const assignedVehicle = vehicles.find(
        (item) =>
          Number(item.driverId) ===
          Number(driverData.driverId)
      );

      let vehicleTypeName = "Not Assigned";

      if (assignedVehicle) {
        const vehicleType = vehicleTypes.find(
          (item) =>
            Number(item.vehicleTypeId) ===
            Number(assignedVehicle.vehicleTypeId)
        );

        if (vehicleType) {
          vehicleTypeName = vehicleType.typeName;
        }
      }

      const loadedProfile = {
        name: currentUser.fullName || "",
        phone: currentUser.phone || "",
        email: currentUser.email || "",
        nic: currentUser.nic || "",
        license:
          driverData.drivingLicenseNo || "",
        vehicleType: vehicleTypeName,
        vehicleNo:
          assignedVehicle?.registrationNumber ||
          "Not Assigned",
      };

      setProfile(loadedProfile);
      setOriginalProfile(loadedProfile);

      setDriver(driverData);
      setVehicle(assignedVehicle || null);

      setVerificationStatus(
        driverData.verificationStatus || "PENDING"
      );

      setOperationalStatus(
        driverData.operationalStatus || "OFFLINE"
      );
    } catch (err) {
      console.error("Driver profile error:", err);

      setError(
        err.message ||
          "Unable to load driver profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const cancelEdit = () => {
    if (originalProfile) {
      setProfile(originalProfile);
    }

    setEditing(false);
    setError("");
    setMessage("");
  };

  const saveProfile = async () => {
    if (!storedUser) {
      return;
    }

    if (!profile.name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!profile.email.trim()) {
      setError("Email address is required.");
      return;
    }

    if (!profile.phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `http://localhost:5171/api/users/${storedUser.userId}`,
        {
          method: "PUT",

          headers: getHeaders(),

          body: JSON.stringify({
            fullName: profile.name.trim(),
            email: profile.email.trim(),
            phone: profile.phone.trim(),
          }),
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
            "Unable to save profile changes."
        );
      }

      const updatedProfile = {
        ...profile,
        name: data.fullName || profile.name,
        phone: data.phone || profile.phone,
        email: data.email || profile.email,
      };

      setProfile(updatedProfile);
      setOriginalProfile(updatedProfile);

      const updatedStoredUser = {
        ...storedUser,
        fullName: updatedProfile.name,
        phone: updatedProfile.phone,
        email: updatedProfile.email,
      };

      if (localStorage.getItem("user")) {
        localStorage.setItem(
          "user",
          JSON.stringify(updatedStoredUser)
        );
      }

      if (sessionStorage.getItem("user")) {
        sessionStorage.setItem(
          "user",
          JSON.stringify(updatedStoredUser)
        );
      }

      setEditing(false);

      setMessage(
        "Profile updated successfully."
      );
    } catch (err) {
      console.error("Profile save error:", err);

      setError(
        err.message ||
          "Unable to save profile changes."
      );
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (!profile.name) {
      return "DR";
    }

    const parts = profile.name
      .trim()
      .split(/\s+/);

    if (parts.length === 1) {
      return parts[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return `${parts[0][0]}${
      parts[parts.length - 1][0]
    }`.toUpperCase();
  };

  const getVerificationLabel = () => {
    switch (verificationStatus) {
      case "APPROVED":
        return "✓ Verified Driver";

      case "REJECTED":
        return "✕ Verification Rejected";

      default:
        return "Verification Pending";
    }
  };

  const getVerificationClass = () => {
    switch (verificationStatus) {
      case "APPROVED":
        return "approved";

      case "REJECTED":
        return "rejected";

      default:
        return "pending";
    }
  };

  const formatStatus = (status) => {
    if (!status) {
      return "Unknown";
    }

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  if (loading) {
    return (
      <>
        <style>{`
          .driver-profile-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f4f7fa;
            font-family: Arial, Helvetica, sans-serif;
            color: #7b8794;
            font-size: 12px;
          }
        `}</style>

        <div className="driver-profile-loading">
          Loading driver profile...
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        .driver-profile-page {
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .driver-profile-header h1 {
          margin: 0 0 6px;
          color: #0b2946;
          font-size: 28px;
        }

        .driver-profile-header p {
          margin: 0 0 23px;
          color: #7b8794;
          font-size: 12px;
        }

        .driver-profile-alert {
          max-width: 850px;
          margin-bottom: 15px;
          padding: 12px 14px;
          border-radius: 7px;
          font-size: 10px;
          line-height: 1.5;
        }

        .driver-profile-alert.error {
          background: #fff1f1;
          border: 1px solid #efc8c8;
          color: #a43c3c;
        }

        .driver-profile-alert.success {
          background: #e7f6eb;
          border: 1px solid #c9e7d1;
          color: #18763a;
        }

        .driver-profile-container {
          max-width: 850px;
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 10px;
          padding: 25px;
        }

        .driver-profile-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 1px solid #edf0f3;
        }

        .driver-profile-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .driver-profile-avatar-large {
          width: 60px;
          height: 60px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f6c20d;
          color: #0b2946;
          border-radius: 50%;
          font-size: 18px;
          font-weight: 800;
        }

        .driver-profile-info h2 {
          margin: 0 0 7px;
          color: #0b2946;
          font-size: 18px;
        }

        .driver-profile-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .driver-profile-verified {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 8px;
          font-weight: 700;
        }

        .driver-profile-verified.approved {
          background: #e3f6e7;
          color: #18763a;
        }

        .driver-profile-verified.pending {
          background: #fff3cc;
          color: #806300;
        }

        .driver-profile-verified.rejected {
          background: #fde7e7;
          color: #a13a3a;
        }

        .driver-profile-status {
          display: inline-block;
          padding: 5px 9px;
          background: #e6eff8;
          color: #24649f;
          border-radius: 20px;
          font-size: 8px;
          font-weight: 700;
        }

        .driver-profile-edit {
          border: none;
          background: #0b2946;
          color: white;
          padding: 9px 13px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 700;
          cursor: pointer;
        }

        .driver-profile-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 17px;
        }

        .driver-profile-field label {
          display: block;
          margin-bottom: 6px;
          color: #0b2946;
          font-size: 10px;
          font-weight: 700;
        }

        .driver-profile-field input {
          box-sizing: border-box;
          width: 100%;
          padding: 11px 12px;
          border: 1px solid #d9e0e6;
          border-radius: 6px;
          outline: none;
          color: #53616e;
          font-size: 11px;
        }

        .driver-profile-field input:disabled {
          background: #f7f9fa;
          color: #687681;
          cursor: not-allowed;
        }

        .driver-profile-field input:not(:disabled) {
          background: white;
          border-color: #b9c4cc;
        }

        .driver-profile-field input:not(:disabled):focus {
          border-color: #f6c20d;
          box-shadow: 0 0 0 2px rgba(246,194,13,0.12);
        }

        .driver-profile-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 22px;
        }

        .driver-profile-cancel {
          border: 1px solid #0b2946;
          background: white;
          color: #0b2946;
          padding: 11px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .driver-profile-save {
          border: none;
          background: #f6c20d;
          color: #0b2946;
          padding: 11px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .driver-profile-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .driver-profile-section-title {
          grid-column: 1 / -1;
          margin-top: 5px;
          padding-top: 16px;
          border-top: 1px solid #edf0f3;
          color: #0b2946;
          font-size: 12px;
          font-weight: 800;
        }

        .driver-profile-note {
          margin-top: 20px;
          padding: 13px;
          background: #eef6ff;
          border-radius: 7px;
          color: #60758a;
          font-size: 10px;
          line-height: 1.6;
        }

        @media(max-width: 700px) {
          .driver-profile-page {
            padding: 20px;
          }

          .driver-profile-grid,
          .driver-profile-actions {
            grid-template-columns: 1fr;
          }

          .driver-profile-section-title {
            grid-column: auto;
          }

          .driver-profile-top {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <main className="driver-profile-page">

        <div className="driver-profile-header">
          <h1>My Profile</h1>

          <p>
            View and manage your registered driver
            and assigned vehicle information.
          </p>
        </div>

        {error && (
          <div className="driver-profile-alert error">
            {error}
          </div>
        )}

        {message && (
          <div className="driver-profile-alert success">
            {message}
          </div>
        )}

        <div className="driver-profile-container">

          <div className="driver-profile-top">

            <div className="driver-profile-info">

              <div className="driver-profile-avatar-large">
                {getInitials()}
              </div>

              <div>
                <h2>
                  {profile.name || "Driver"}
                </h2>

                <div className="driver-profile-badges">

                  <span
                    className={`driver-profile-verified ${getVerificationClass()}`}
                  >
                    {getVerificationLabel()}
                  </span>

                  <span className="driver-profile-status">
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
                className="driver-profile-edit"
                onClick={() => {
                  setEditing(true);
                  setError("");
                  setMessage("");
                }}
              >
                Edit Profile
              </button>
            )}

          </div>

          <div className="driver-profile-grid">

            <div className="driver-profile-section-title">
              Personal Information
            </div>

            <div className="driver-profile-field">
              <label>Full Name</label>

              <input
                name="name"
                value={profile.name}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="driver-profile-field">
              <label>Phone Number</label>

              <input
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="driver-profile-field">
              <label>Email Address</label>

              <input
                name="email"
                type="email"
                value={profile.email}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="driver-profile-field">
              <label>NIC Number</label>

              <input
                value={
                  profile.nic ||
                  "Not Provided"
                }
                disabled
              />
            </div>

            <div className="driver-profile-section-title">
              Driver Information
            </div>

            <div className="driver-profile-field">
              <label>Driving License</label>

              <input
                value={
                  profile.license ||
                  "Not Provided"
                }
                disabled
              />
            </div>

            <div className="driver-profile-field">
              <label>Verification Status</label>

              <input
                value={formatStatus(
                  verificationStatus
                )}
                disabled
              />
            </div>

            <div className="driver-profile-section-title">
              Assigned Vehicle
            </div>

            <div className="driver-profile-field">
              <label>Vehicle Type</label>

              <input
                value={profile.vehicleType}
                disabled
              />
            </div>

            <div className="driver-profile-field">
              <label>Vehicle Number</label>

              <input
                value={profile.vehicleNo}
                disabled
              />
            </div>

            {vehicle && (
              <>
                <div className="driver-profile-field">
                  <label>Vehicle Status</label>

                  <input
                    value={formatStatus(
                      vehicle.operationalStatus
                    )}
                    disabled
                  />
                </div>

                <div className="driver-profile-field">
                  <label>GPS Available</label>

                  <input
                    value={
                      vehicle.gpsAvailable
                        ? "Yes"
                        : "No"
                    }
                    disabled
                  />
                </div>
              </>
            )}

          </div>

          {editing && (
            <div className="driver-profile-actions">

              <button
                type="button"
                className="driver-profile-cancel"
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="driver-profile-save"
                onClick={saveProfile}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>
          )}

          <div className="driver-profile-note">
            NIC, driving license, verification status and
            assigned vehicle information are controlled by
            MMC administration and cannot be changed directly
            by the driver.
          </div>

        </div>

      </main>
    </>
  );
}

export default DriverProfile;