import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";


const API_BASE_URL = "http://localhost:5171/api";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("authToken") ||
  sessionStorage.getItem("accessToken") ||
  "";

const getHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const formatStatus = (value) =>
  value
    ? value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : "Unknown";


function AdminDashboard() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const [d, v, b] = await Promise.all([
        fetch(`${API_BASE_URL}/drivers`, { headers: getHeaders() }),
        fetch(`${API_BASE_URL}/vehicles`, { headers: getHeaders() }),
        fetch(`${API_BASE_URL}/bookings`, { headers: getHeaders() }),
      ]);
      if (!d.ok || !v.ok || !b.ok) throw new Error("Unable to load Admin Dashboard.");
      setDrivers(await d.json());
      setVehicles(await v.json());
      setBookings(await b.json());
    } catch (e) {
      setError(e.message || "Unable to load Admin Dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const pending = useMemo(() => drivers.filter(x => x.verificationStatus === "PENDING").length, [drivers]);
  const availableVehicles = useMemo(() => vehicles.filter(x => x.operationalStatus === "AVAILABLE").length, [vehicles]);
  const activeBookings = useMemo(() => bookings.filter(x => ["PENDING","WAITING_FOR_DRIVER","ACCEPTED","DRIVER_ARRIVING","ON_RIDE"].includes(x.bookingStatus)).length, [bookings]);
  const completed = useMemo(() => bookings.filter(x => x.bookingStatus === "COMPLETED").length, [bookings]);

  return (
    <>
      <style>{`
        .ad-page{padding:30px;min-height:100vh;background:#f4f7fa;font-family:Arial}
        .ad-page h1{margin:0 0 6px;color:#0b2946;font-size:28px}
        .ad-sub{color:#7b8794;font-size:11px;margin:0 0 22px}
        .ad-error{padding:12px;background:#fff1f1;border:1px solid #efc8c8;color:#a43c3c;border-radius:7px;margin-bottom:16px;font-size:10px}
        .ad-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
        .ad-card{background:white;border:1px solid #e2e7ec;border-radius:9px;padding:18px}
        .ad-card span{font-size:8px;color:#89949e;font-weight:700} .ad-card h2{margin:7px 0 0;color:#0b2946;font-size:24px}
        .ad-panel{background:white;border:1px solid #e2e7ec;border-radius:10px;padding:20px}
        .ad-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        .ad-btn{padding:16px;border:1px solid #e2e7ec;background:#f8fafc;border-radius:8px;color:#0b2946;font-size:10px;font-weight:700;cursor:pointer}
        .ad-btn:hover{border-color:#f6c20d;background:#fffdf2}
        @media(max-width:900px){.ad-grid,.ad-actions{grid-template-columns:repeat(2,1fr)}}
      `}</style>
      <main className="ad-page">
        <h1>Admin Dashboard</h1>
        <p className="ad-sub">Monitor drivers, vehicles, bookings and administration activities.</p>
        {error && <div className="ad-error">{error}</div>}
        {loading ? <div className="ad-card">Loading dashboard...</div> : <>
          <div className="ad-grid">
            <div className="ad-card"><span>TOTAL DRIVERS</span><h2>{drivers.length}</h2></div>
            <div className="ad-card"><span>PENDING VERIFICATIONS</span><h2>{pending}</h2></div>
            <div className="ad-card"><span>AVAILABLE VEHICLES</span><h2>{availableVehicles}</h2></div>
            <div className="ad-card"><span>ACTIVE BOOKINGS</span><h2>{activeBookings}</h2></div>
          </div>
          <section className="ad-panel">
            <h2 style={{margin:"0 0 14px",color:"#0b2946",fontSize:"17px"}}>Quick Management</h2>
            <div className="ad-actions">
              <button className="ad-btn" onClick={() => navigate("/admin/drivers")}>👨‍✈️ Drivers</button>
              <button className="ad-btn" onClick={() => navigate("/admin/driver-verification")}>✅ Verification</button>
              <button className="ad-btn" onClick={() => navigate("/admin/vehicles")}>🚕 Vehicles</button>
              <button className="ad-btn" onClick={() => navigate("/admin/bookings")}>📋 Bookings</button>
            </div>
            <p style={{margin:"16px 0 0",fontSize:"9px",color:"#66737f"}}>Completed trips: <strong>{completed}</strong>. Roles, permissions, system settings, Admin Management and Taxi Operator Management remain under Super Admin control.</p>
          </section>
        </>}
      </main>
    </>
  );
}
export default AdminDashboard;
