import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "/api";

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

function OperationsVehicles() {
  const [vehicles,setVehicles]=useState([]);const [types,setTypes]=useState([]);const [search,setSearch]=useState("");const [status,setStatus]=useState("ALL");const [typeId,setTypeId]=useState("ALL");const [error,setError]=useState("");
  const load=async()=>{try{setError("");const [vRes,tRes]=await Promise.all([fetch(`${API_BASE_URL}/vehicles`,{headers:authHeaders()}),fetch(`${API_BASE_URL}/vehicletypes/all`,{headers:authHeaders()})]);const [vData,tData]=await Promise.all([safeJson(vRes),safeJson(tRes)]);if(!vRes.ok)throw new Error(vData?.message||"Unable to load vehicles.");setVehicles(Array.isArray(vData)?vData:[]);setTypes(tRes.ok&&Array.isArray(tData)?tData:[]);}catch(e){setError(e.message);}};useEffect(()=>{load();},[]);const typeName=id=>types.find(t=>Number(t.vehicleTypeId)===Number(id))?.typeName||`Type #${id}`;const rows=useMemo(()=>vehicles.filter(v=>{const q=search.toLowerCase();return(!q||(v.registrationNumber||"").toLowerCase().includes(q)||(v.driverId??"").toString().includes(q))&&(status==="ALL"||v.operationalStatus===status)&&(typeId==="ALL"||Number(v.vehicleTypeId)===Number(typeId));}),[vehicles,search,status,typeId]);
  return (<>
    <style>{`.ov-page{padding:30px;min-height:100vh;background:#f4f7fa;font-family:Arial,sans-serif;color:#0b2946}.ov-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px}.ov-head h1{margin:0 0 6px;font-size:28px}.ov-head p{margin:0;color:#7b8794;font-size:12px}.ov-refresh{border:none;background:#0b2946;color:white;padding:10px 14px;border-radius:6px;font-weight:700;cursor:pointer}.ov-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:18px}.ov-card{background:white;border:1px solid #e2e7ec;border-radius:9px;padding:18px}.ov-card span{font-size:9px;color:#89949e}.ov-card h2{margin:6px 0 0}.ov-tools{display:grid;grid-template-columns:1fr 190px 190px;gap:10px;background:white;border:1px solid #e2e7ec;padding:13px;border-radius:9px;margin-bottom:15px}.ov-tools input,.ov-tools select{padding:10px;border:1px solid #d8e0e6;border-radius:6px}.ov-panel{background:white;border:1px solid #e2e7ec;border-radius:10px;overflow:hidden}.ov-wrap{overflow-x:auto}.ov-table{width:100%;min-width:850px;border-collapse:collapse}.ov-table th{background:#0b2946;color:white;padding:12px;text-align:left;font-size:9px}.ov-table td{padding:12px;border-bottom:1px solid #edf0f3;font-size:10px}.ov-badge{padding:5px 8px;border-radius:20px;background:#eef3f7;font-size:8px;font-weight:800}.ov-error{padding:11px 13px;background:#fff1f1;color:#a63737;border-radius:7px;margin-bottom:14px;font-size:10px}.ov-legend{display:flex;gap:18px;flex-wrap:wrap;background:white;border:1px solid #e2e7ec;border-radius:8px;margin-top:15px;padding:12px;font-size:10px}@media(max-width:900px){.ov-summary{grid-template-columns:repeat(2,1fr)}.ov-tools{grid-template-columns:1fr}}@media(max-width:600px){.ov-page{padding:18px}.ov-summary{grid-template-columns:1fr}.ov-head{flex-direction:column;gap:10px}}`}</style>
    <main className="ov-page"><div className="ov-head"><div><h1>Vehicle Status</h1><p>Monitor MMC taxi vehicles, vehicle types, assigned drivers and GPS availability.</p></div><button className="ov-refresh" onClick={load}>Refresh</button></div>{error&&<div className="ov-error">{error}</div>}
      <div className="ov-summary"><div className="ov-card"><span>TOTAL</span><h2>{vehicles.length}</h2></div><div className="ov-card"><span>AVAILABLE</span><h2>{vehicles.filter(v=>v.operationalStatus==="AVAILABLE").length}</h2></div><div className="ov-card"><span>ON RIDE</span><h2>{vehicles.filter(v=>v.operationalStatus==="ON_RIDE").length}</h2></div><div className="ov-card"><span>OFFLINE</span><h2>{vehicles.filter(v=>v.operationalStatus==="OFFLINE").length}</h2></div></div>
      <div className="ov-tools"><input placeholder="Search registration or driver ID..." value={search} onChange={e=>setSearch(e.target.value)}/><select value={typeId} onChange={e=>setTypeId(e.target.value)}><option value="ALL">All Vehicle Types</option>{types.map(t=><option key={t.vehicleTypeId} value={t.vehicleTypeId}>{t.typeName}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)}><option value="ALL">All Status</option><option value="AVAILABLE">Available</option><option value="ON_RIDE">On Ride</option><option value="OFFLINE">Offline</option></select></div>
      <div className="ov-panel"><div className="ov-wrap"><table className="ov-table"><thead><tr><th>Vehicle</th><th>Type</th><th>Driver</th><th>GPS</th><th>Account</th><th>Status</th></tr></thead><tbody>{rows.map(v=><tr key={v.vehicleId}><td><strong>{v.registrationNumber}</strong><div>Vehicle #{v.vehicleId}</div></td><td>{typeName(v.vehicleTypeId)}</td><td>{v.driverId?`Driver #${v.driverId}`:"Not Assigned"}</td><td>{v.gpsAvailable?"Available":"Unavailable"}</td><td><span className="ov-badge">{formatText(v.accountStatus)}</span></td><td><span className="ov-badge">{formatText(v.operationalStatus)}</span></td></tr>)}{rows.length===0&&<tr><td colSpan="6">No vehicles found.</td></tr>}</tbody></table></div></div><div className="ov-legend"><span>🟢 Available</span><span>🔵 On Ride</span><span>🔴 Offline</span></div>
    </main>
  </>);
}

export default OperationsVehicles;
