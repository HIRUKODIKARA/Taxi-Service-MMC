import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "/api";

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


function ActivityMonitoring() {
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState({});
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [logsRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE_URL}/activitylogs/recent?limit=100`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/activitylogs/summary`, { headers: authHeaders() }),
      ]);
      const logs = await safeJson(logsRes);
      const summaryData = await safeJson(summaryRes);
      if (!logsRes.ok) throw new Error(logs?.message || "Unable to load activity logs.");
      setActivities(Array.isArray(logs) ? logs : []);
      setSummary(summaryRes.ok ? summaryData : {});
    } catch (e) {
      setError(e.message || "Unable to load activity monitoring.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const categories = useMemo(() => {
    const values = new Set(activities.map((a) => a.activityType).filter(Boolean));
    return ["ALL", ...values];
  }, [activities]);

  const filtered = filter === "ALL"
    ? activities
    : activities.filter((a) => a.activityType === filter);

  const bookingEvents = activities.filter((a) => (a.activityType || "").includes("BOOKING")).length;
  const driverEvents = activities.filter((a) => (a.activityType || "").includes("DRIVER")).length;

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div>
          <h1>Activity Monitoring</h1>
          <p>Monitor important user and system activities.</p>
        </div>
        <button className="sa-btn-neutral" onClick={loadData}>Refresh</button>
      </div>

      {error && <div className="sa-info-box"><strong>Error</strong><p>{error}</p></div>}

      <div className="sa-summary-grid">
        <div className="sa-summary-card"><span>Activities Today</span><h2>{summary.todayLogs ?? 0}</h2></div>
        <div className="sa-summary-card"><span>Booking Events</span><h2>{bookingEvents}</h2></div>
        <div className="sa-summary-card"><span>Driver Events</span><h2>{driverEvents}</h2></div>
        <div className="sa-summary-card"><span>Last 7 Days</span><h2>{summary.lastSevenDaysLogs ?? 0}</h2></div>
      </div>

      <section className="sa-card">
        <div className="sa-toolbar">
          <select className="sa-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {categories.map((type) => (
              <option key={type} value={type}>
                {type === "ALL" ? "All Activity" : formatText(type)}
              </option>
            ))}
          </select>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead><tr><th>Type</th><th>User / Source</th><th>Activity</th><th>Time</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4">Loading activities...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="4">No activity found.</td></tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.logId}>
                    <td><span className="sa-badge blue">{formatText(a.activityType)}</span></td>
                    <td className="sa-id">{a.userName || "System"}</td>
                    <td>{a.description}</td>
                    <td>{a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default ActivityMonitoring;
