import { useEffect, useMemo, useState } from "react";

function PassengerProfile() {
  const API_BASE_URL = "/api";

  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    userId: null,
    fullName: "",
    phone: "",
    email: "",
    nic: "",
    accountStatus: "",
  });

  const [originalProfile, setOriginalProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const token = getToken();

    if (!token) {
      setError("Please login to view your profile.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_BASE_URL}/users/me`,
        {
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        let errorData = null;

        try {
          errorData = await response.json();
        } catch {
          errorData = null;
        }

        throw new Error(
          errorData?.message ||
            "Unable to load your profile."
        );
      }

      const data = await response.json();

      const normalizedProfile = {
        userId: data.userId,
        fullName: data.fullName || "",
        phone: data.phone || "",
        email: data.email || "",
        nic: data.nic || "",
        accountStatus: data.accountStatus || "",
      };

      setProfile(normalizedProfile);
      setOriginalProfile(normalizedProfile);
    } catch (err) {
      console.error(
        "Passenger profile load error:",
        err
      );

      setError(
        err.message ||
          "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  };

  const handleEditToggle = () => {
    if (editing) {
      if (originalProfile) {
        setProfile(originalProfile);
      }

      setError("");
      setSuccess("");
      setEditing(false);
      return;
    }

    setOriginalProfile(profile);
    setEditing(true);
    setError("");
    setSuccess("");
  };

  const validateProfile = () => {
    if (!profile.fullName.trim()) {
      return "Full name is required.";
    }

    if (!profile.email.trim()) {
      return "Email address is required.";
    }

    if (!profile.phone.trim()) {
      return "Phone number is required.";
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(profile.email.trim())) {
      return "Please enter a valid email address.";
    }

    return "";
  };

  const updateStoredUser = (updatedProfile) => {
    const storageKeys = [
      [localStorage, "user"],
      [sessionStorage, "user"],
    ];

    storageKeys.forEach(([storage, key]) => {
      const existingValue = storage.getItem(key);

      if (!existingValue) {
        return;
      }

      try {
        const currentUser =
          JSON.parse(existingValue);

        storage.setItem(
          key,
          JSON.stringify({
            ...currentUser,
            userId: updatedProfile.userId,
            fullName: updatedProfile.fullName,
            phone: updatedProfile.phone,
            email: updatedProfile.email,
            nic: updatedProfile.nic,
            accountStatus:
              updatedProfile.accountStatus,
          })
        );
      } catch {
        // Ignore malformed cached user data.
      }
    });
  };

  const handleSave = async () => {
    const validationError = validateProfile();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!profile.userId) {
      setError(
        "Unable to identify your account."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        fullName: profile.fullName.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        nic: profile.nic.trim() || null,
      };

      const response = await fetch(
        `${API_BASE_URL}/users/${profile.userId}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        }
      );

      let responseData = null;

      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }

      if (!response.ok) {
        throw new Error(
          responseData?.message ||
            "Unable to update your profile."
        );
      }

      const refreshedResponse = await fetch(
        `${API_BASE_URL}/users/me`,
        {
          headers: getHeaders(),
        }
      );

      let updatedProfile = {
        ...profile,
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        nic: payload.nic || "",
      };

      if (refreshedResponse.ok) {
        const refreshedData =
          await refreshedResponse.json();

        updatedProfile = {
          userId: refreshedData.userId,
          fullName: refreshedData.fullName || "",
          phone: refreshedData.phone || "",
          email: refreshedData.email || "",
          nic: refreshedData.nic || "",
          accountStatus:
            refreshedData.accountStatus || "",
        };
      }

      setProfile(updatedProfile);
      setOriginalProfile(updatedProfile);
      updateStoredUser(updatedProfile);

      window.dispatchEvent(
        new Event("passenger-profile-updated")
      );

      setEditing(false);
      setSuccess(
        responseData?.message ||
          "Profile updated successfully."
      );
    } catch (err) {
      console.error(
        "Passenger profile update error:",
        err
      );

      setError(
        err.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const initials = useMemo(() => {
    const parts = profile.fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) {
      return "P";
    }

    if (parts.length === 1) {
      return parts[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }, [profile.fullName]);

  return (
    <>
      <style>{`
        .passenger-profile-page {
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .passenger-profile-page h1 {
          margin: 0 0 6px;
          color: #0b2946;
          font-size: 28px;
        }

        .passenger-profile-page > p {
          margin: 0 0 22px;
          color: #7b8794;
          font-size: 12px;
        }

        .passenger-profile-card {
          max-width: 780px;
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 10px;
          padding: 24px;
        }

        .passenger-profile-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 22px;
          padding-bottom: 18px;
          border-bottom: 1px solid #edf0f3;
        }

        .passenger-profile-user {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .passenger-profile-avatar {
          width: 58px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: #f6c20d;
          color: #0b2946;
          border-radius: 50%;
          font-size: 17px;
          font-weight: 800;
        }

        .passenger-profile-user h2 {
          margin: 0 0 4px;
          color: #0b2946;
          font-size: 17px;
        }

        .passenger-profile-user span {
          color: #89949e;
          font-size: 9px;
        }

        .passenger-profile-status {
          display: inline-block;
          margin-top: 6px;
          padding: 4px 8px;
          border-radius: 20px;
          background: #e3f6e7;
          color: #18763a;
          font-size: 8px;
          font-weight: 700;
        }

        .passenger-edit-btn {
          border: none;
          background: #0b2946;
          color: white;
          padding: 9px 13px;
          border-radius: 6px;
          font-size: 9px;
          cursor: pointer;
          font-weight: 700;
        }

        .passenger-edit-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .passenger-profile-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .passenger-profile-field label {
          display: block;
          margin-bottom: 6px;
          color: #0b2946;
          font-size: 10px;
          font-weight: 700;
        }

        .passenger-profile-field input {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 12px;
          border: 1px solid #d9e0e6;
          border-radius: 6px;
          font-size: 11px;
          color: #53616e;
          background: ${
            editing ? "white" : "#f7f9fa"
          };
          outline: none;
        }

        .passenger-profile-field input:focus {
          border-color: #0b2946;
        }

        .passenger-profile-field input:disabled {
          cursor: default;
          color: #6b7782;
        }

        .passenger-save-btn {
          width: 100%;
          margin-top: 20px;
          border: none;
          background: #f6c20d;
          color: #0b2946;
          padding: 11px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .passenger-save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .passenger-profile-loading,
        .passenger-profile-error,
        .passenger-profile-success {
          max-width: 780px;
          padding: 16px;
          border-radius: 8px;
          font-size: 11px;
          line-height: 1.5;
        }

        .passenger-profile-loading {
          background: white;
          border: 1px solid #e2e7ec;
          color: #7b8794;
        }

        .passenger-profile-error {
          margin-bottom: 15px;
          background: #fff1f1;
          border: 1px solid #efc8c8;
          color: #a43c3c;
        }

        .passenger-profile-success {
          margin-bottom: 15px;
          background: #eef9f0;
          border: 1px solid #c9e7cf;
          color: #18763a;
        }

        @media(max-width: 700px) {
          .passenger-profile-grid {
            grid-template-columns: 1fr;
          }

          .passenger-profile-top {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

      <main className="passenger-profile-page">
        <h1>My Profile</h1>

        <p>
          View and update your passenger account
          information.
        </p>

        {error && (
          <div className="passenger-profile-error">
            {error}
          </div>
        )}

        {success && (
          <div className="passenger-profile-success">
            {success}
          </div>
        )}

        {loading ? (
          <div className="passenger-profile-loading">
            Loading your profile...
          </div>
        ) : (
          <div className="passenger-profile-card">
            <div className="passenger-profile-top">
              <div className="passenger-profile-user">
                <div className="passenger-profile-avatar">
                  {initials}
                </div>

                <div>
                  <h2>
                    {profile.fullName ||
                      "Passenger"}
                  </h2>

                  <span>Passenger Account</span>

                  {profile.accountStatus && (
                    <div className="passenger-profile-status">
                      {profile.accountStatus}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="passenger-edit-btn"
                onClick={handleEditToggle}
                disabled={saving}
              >
                {editing
                  ? "Cancel Edit"
                  : "Edit Profile"}
              </button>
            </div>

            <div className="passenger-profile-grid">
              <div className="passenger-profile-field">
                <label>Full Name</label>

                <input
                  name="fullName"
                  value={profile.fullName}
                  onChange={handleChange}
                  disabled={!editing || saving}
                  autoComplete="name"
                />
              </div>

              <div className="passenger-profile-field">
                <label>Phone Number</label>

                <input
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  disabled={!editing || saving}
                  autoComplete="tel"
                />
              </div>

              <div className="passenger-profile-field">
                <label>Email Address</label>

                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  disabled={!editing || saving}
                  autoComplete="email"
                />
              </div>

              <div className="passenger-profile-field">
                <label>NIC Number</label>

                <input
                  name="nic"
                  value={profile.nic}
                  onChange={handleChange}
                  disabled={!editing || saving}
                />
              </div>
            </div>

            {editing && (
              <button
                type="button"
                className="passenger-save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            )}
          </div>
        )}
      </main>
    </>
  );
}

export default PassengerProfile;