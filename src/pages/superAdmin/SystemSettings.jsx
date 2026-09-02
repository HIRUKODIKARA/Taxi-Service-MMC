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


function SystemSettings() {
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSettings = async () => {
    try {
      setError("");
      const res = await fetch(`${API_BASE_URL}/systemsettings`, { headers: authHeaders() });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Unable to load settings.");
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Unable to load settings.");
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const setValue = (key, value) => {
    setItems((current) =>
      current.map((item) =>
        item.settingKey === key ? { ...item, settingValue: value } : item
      )
    );
  };

  const saveAll = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      for (const item of items) {
        const res = await fetch(`${API_BASE_URL}/systemsettings/${encodeURIComponent(item.settingKey)}`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({ settingValue: item.settingValue ?? "" }),
        });
        const data = await safeJson(res);
        if (!res.ok) throw new Error(data?.message || `Unable to save ${item.settingKey}.`);
      }

      setMessage("System settings saved successfully.");
      await loadSettings();
    } catch (e) {
      setError(e.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const boolKeys = new Set([
    "BOOKING_ENABLED",
    "DRIVER_REGISTRATION_ENABLED",
    "NOTIFICATIONS_ENABLED",
    "DRIVER_GPS_REQUIRED",
  ]);

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div><h1>System Settings</h1><p>Configure protected MMC Taxi Management System settings.</p></div>
        <button className="sa-primary-btn" onClick={saveAll} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <div className="sa-info-box">
        <strong>Super Admin Only</strong>
        <p>These settings are protected by MANAGE_SYSTEM_SETTINGS permission.</p>
      </div>

      {error && <div className="sa-info-box"><strong>Error</strong><p>{error}</p></div>}
      {message && <div className="sa-info-box"><strong>Success</strong><p>{message}</p></div>}

      <section className="sa-card">
        <h2>System Settings</h2>
        <div className="sa-form-grid">
          {items.length === 0 ? (
            <p>No settings found.</p>
          ) : (
            items.map((item) => (
              <div className="sa-field" key={item.settingKey}>
                <label>{formatText(item.settingKey)}</label>
                {boolKeys.has(item.settingKey) ? (
                  <select
                    value={(item.settingValue || "FALSE").toUpperCase()}
                    onChange={(e) => setValue(item.settingKey, e.target.value)}
                  >
                    <option value="TRUE">Enabled</option>
                    <option value="FALSE">Disabled</option>
                  </select>
                ) : (
                  <input
                    value={item.settingValue ?? ""}
                    onChange={(e) => setValue(item.settingKey, e.target.value)}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="sa-card">
        <h2>System Information</h2>
        <div className="sa-detail-grid">
          <div className="sa-detail"><span>Frontend</span><strong>React + Vite</strong></div>
          <div className="sa-detail"><span>Backend</span><strong>ASP.NET Core Web API</strong></div>
          <div className="sa-detail"><span>Database</span><strong>MySQL</strong></div>
          <div className="sa-detail"><span>API Status</span><strong>Connected</strong></div>
        </div>
      </section>
    </main>
  );
}

export default SystemSettings;
