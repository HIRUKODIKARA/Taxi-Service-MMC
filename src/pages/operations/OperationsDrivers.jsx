import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://localhost:5171/api";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("authToken") ||
  sessionStorage.getItem("accessToken") ||
  "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const safeJson = async (response) => {
  const raw = await response.text();
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return { message: raw }; }
};

const formatText = (value) =>
  (value ?? "—")
    .toString()
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

function OperationsDrivers() {
  const [drivers,setDrivers]=useState([]);const [vehicles,setVehicles]=useState([]);const [search,setSearch]=useState("");const [status,setStatus]=useState("ALL");const [error,setError]=useState("");const [loading,setLoading]=useState(true);
  const load=async()=>{try{setLoading(true);setError("");const [dRes,vRes]=await Promise.all([fetch(`${API_BASE_URL}/drivers`,{headers:authHeaders()}),fetch(`${API_BASE_URL}/vehicles`,{headers:authHeaders()})]);const [dData,vData]=await Promise.all([safeJson(dRes),safeJson(vRes)]);if(!dRes.ok)throw new Error(dData?.message||"Unable to load drivers.");if(!vRes.ok)throw new Error(vData?.message||"Unable to load vehicles.");setDrivers(Array.isArray(dData)?dData:[]);setVehicles(Array.isArray(vData)?vData:[]);}catch(e){setError(e.message);}finally{setLoading(false);}};useEffect(()=>{load();},[]);
  const rows=useMemo(()=>drivers.filter(d=>{const v=vehicles.find(x=>Number(x.driverId)===Number(d.driverId));const q=search.toLowerCase();const ok=!q||[d.driverId,d.drivingLicenseNo,d.userId,v?.registrationNumber].some(x=>(x??"").toString().toLowerCase().includes(q));return ok&&(status==="ALL"||d.operationalStatus===status);}),[drivers,vehicles,search,status]);
  return (<>
    <style>{`.od-page{padding:30px;min-height:100vh;background:#f4f7fa;font-family:Arial,sans-serif;color:#0b2946}.od-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px}.od-head h1{margin:0 0 6px;font-size:28px}.od-head p{margin:0;color:#7b8794;font-size:12px}.od-refresh{border:none;background:#0b2946;color:white;padding:10px 14px;border-radius:6px;font-weight:700;cursor:pointer}.od-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:18px}.od-card{background:white;border:1px solid #e2e7ec;border-radius:9px;padding:18px}.od-card span{font-size:9px;color:#89949e}.od-card h2{margin:6px 0 0}.od-tools{display:grid;grid-template-columns:1fr 190px;gap:10px;background:white;border:1px solid #e2e7ec;padding:13px;border-radius:9px;margin-bottom:15px}.od-tools input,.od-tools select{padding:10px;border:1px solid #d8e0e6;border-radius:6px}.od-panel{background:white;border:1px solid #e2e7ec;border-radius:10px;overflow:hidden}.od-wrap{overflow-x:auto}.od-table{width:100%;min-width:850px;border-collapse:collapse}.od-table th{background:#0b2946;color:white;padding:12px;text-align:left;font-size:9px}.od-table td{padding:12px;border-bottom:1px solid #edf0f3;font-size:10px}.od-badge{padding:5px 8px;border-radius:20px;background:#eef3f7;font-size:8px;font-weight:800}.od-error{padding:11px 13px;background:#fff1f1;color:#a63737;border-radius:7px;margin-bottom:14px;font-size:10px}@media(max-width:900px){.od-summary{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.od-page{padding:18px}.od-summary,.od-tools{grid-template-columns:1fr}.od-head{flex-direction:column;gap:10px}}`}</style>
    <main className="od-page"><div className="od-head"><div><h1>Driver Status</h1><p>Monitor registered drivers, verification, availability, GPS and assigned vehicles.</p></div><button className="od-refresh" onClick={load}>Refresh</button></div>{error&&<div className="od-error">{error}</div>}
      <div className="od-summary"><div className="od-card"><span>TOTAL</span><h2>{drivers.length}</h2></div><div className="od-card"><span>AVAILABLE</span><h2>{drivers.filter(d=>d.operationalStatus==="AVAILABLE").length}</h2></div><div className="od-card"><span>ON RIDE</span><h2>{drivers.filter(d=>d.operationalStatus==="ON_RIDE").length}</h2></div><div className="od-card"><span>OFFLINE</span><h2>{drivers.filter(d=>d.operationalStatus==="OFFLINE").length}</h2></div></div>
      <div className="od-tools"><input placeholder="Search driver ID, licence, user ID or vehicle..." value={search} onChange={e=>setSearch(e.target.value)}/><select value={status} onChange={e=>setStatus(e.target.value)}><option value="ALL">All Status</option><option value="AVAILABLE">Available</option><option value="ON_RIDE">On Ride</option><option value="OFFLINE">Offline</option></select></div>
      <div className="od-panel"><div className="od-wrap"><table className="od-table"><thead><tr><th>Driver</th><th>User ID</th><th>Driving Licence</th><th>Verification</th><th>Vehicle</th><th>GPS</th><th>Status</th></tr></thead><tbody>{rows.map(d=>{const v=vehicles.find(x=>Number(x.driverId)===Number(d.driverId));return <tr key={d.driverId}><td><strong>Driver #{d.driverId}</strong></td><td>{d.userId}</td><td>{d.drivingLicenseNo||"—"}</td><td><span className="od-badge">{formatText(d.verificationStatus)}</span></td><td>{v?.registrationNumber||"Not Assigned"}</td><td>{d.gpsEnabled?"Enabled":"Disabled"}</td><td><span className="od-badge">{formatText(d.operationalStatus)}</span></td></tr>})}{!loading&&rows.length===0&&<tr><td colSpan="7">No drivers found.</td></tr>}</tbody></table></div></div>
    </main>
  </>);
}

export default OperationsDrivers;
