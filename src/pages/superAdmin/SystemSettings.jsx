import { useState } from "react";

function SystemSettings() {
  const [settings, setSettings] = useState({
    systemName: "MMC Taxi Management System",
    centerName: "Makumbura Multimodal Center",
    contact: "0110000000",
    email: "taxi@mmc.lk",
    bookingEnabled: true,
    driverRegistration: true,
    notifications: true,
    gpsRequired: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div>
          <h1>System Settings</h1>
          <p>
            Configure general MMC Taxi Management System settings.
          </p>
        </div>

        <button
          className="sa-primary-btn"
          onClick={() =>
            alert("System settings saved in frontend demo.")
          }
        >
          Save Settings
        </button>
      </div>

      <div className="sa-info-box">
        <strong>Super Admin Only</strong>
        <p>
          These settings are protected and should only be changed by an
          authorized Super Admin.
        </p>
      </div>

      <section className="sa-card">
        <h2>General Information</h2>

        <div className="sa-form-grid">
          <div className="sa-field">
            <label>System Name</label>

            <input
              name="systemName"
              value={settings.systemName}
              onChange={handleChange}
            />
          </div>

          <div className="sa-field">
            <label>Center Name</label>

            <input
              name="centerName"
              value={settings.centerName}
              onChange={handleChange}
            />
          </div>

          <div className="sa-field">
            <label>Contact Number</label>

            <input
              name="contact"
              value={settings.contact}
              onChange={handleChange}
            />
          </div>

          <div className="sa-field">
            <label>Email Address</label>

            <input
              name="email"
              value={settings.email}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      <section className="sa-card">
        <h2>Feature Settings</h2>

        {[
          ["bookingEnabled", "Passenger Website Booking"],
          ["driverRegistration", "Driver Registration"],
          ["notifications", "System Notifications"],
          ["gpsRequired", "Driver GPS / Location Requirement"],
        ].map(([name, label]) => (
          <div
            key={name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "13px 0",
              borderBottom: "1px solid #edf0f3",
            }}
          >
            <strong
              style={{
                color: "#0b2946",
                fontSize: "10px",
              }}
            >
              {label}
            </strong>

            <input
              type="checkbox"
              name={name}
              checked={settings[name]}
              onChange={handleChange}
            />
          </div>
        ))}
      </section>

      <section className="sa-card">
        <h2>System Information</h2>

        <div className="sa-detail-grid">
          <div className="sa-detail">
            <span>Environment</span>
            <strong>Frontend Development</strong>
          </div>

          <div className="sa-detail">
            <span>Backend</span>
            <strong>Not Connected Yet</strong>
          </div>

          <div className="sa-detail">
            <span>Database</span>
            <strong>MySQL - Planned</strong>
          </div>

          <div className="sa-detail">
            <span>API</span>
            <strong>.NET Web API - Planned</strong>
          </div>
        </div>
      </section>
    </main>
  );
}

export default SystemSettings;