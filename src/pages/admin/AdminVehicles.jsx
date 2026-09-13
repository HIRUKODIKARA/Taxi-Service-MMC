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


function AdminVehicles() {
  const [vehicles,setVehicles]=useState([]);
  const [types,setTypes]=useState([]);
  const [drivers,setDrivers]=useState([]);
  const [search,setSearch]=useState("");
  const [loading,setLoading]=useState(true);
  const [actionId,setActionId]=useState(null);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");

  const load=async()=>{
    try{setLoading(true);setError("");
      const [v,t,d]=await Promise.all([
        fetch(`${API_BASE_URL}/vehicles`,{headers:getHeaders()}),
        fetch(`${API_BASE_URL}/vehicletypes`,{headers:getHeaders()}),
        fetch(`${API_BASE_URL}/drivers`,{headers:getHeaders()})
      ]);
      if(!v.ok) throw new Error("Unable to load vehicles.");
      setVehicles(await v.json()); setTypes(t.ok?await t.json():[]); setDrivers(d.ok?await d.json():[]);
    }catch(e){setError(e.message||"Unable to load vehicles.");}finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);
  const getType=id=>types.find(t=>Number(t.vehicleTypeId)===Number(id))?.typeName||"—";
  const getDriver=id=>drivers.find(d=>Number(d.driverId)===Number(id));
  const rows=useMemo(()=>vehicles.filter(v=>[v.registrationNumber,v.model,v.operationalStatus,v.accountStatus,getType(v.vehicleTypeId)].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())),[vehicles,types,search]);

  const changeStatus=async(v,status)=>{
    try{setActionId(v.vehicleId);setError("");setMessage("");
      const r=await fetch(`${API_BASE_URL}/vehicles/${v.vehicleId}/status`,{method:"PUT",headers:getHeaders(),body:JSON.stringify({status})});
      const data=await r.json().catch(()=>null); if(!r.ok) throw new Error(data?.message||"Unable to update vehicle status.");
      setMessage(`${v.registrationNumber} changed to ${formatStatus(status)}.`);await load();
    }catch(e){setError(e.message||"Unable to update vehicle status.");}finally{setActionId(null);}
  };

  return <>
    <style>{`
      .veh-page{padding:30px;background:#f4f7fa;min-height:100vh;font-family:Arial} .veh-page h1{margin:0 0 6px;color:#0b2946;font-size:28px} .veh-sub{font-size:11px;color:#7b8794;margin:0 0 20px}
      .veh-msg{padding:11px;border-radius:7px;margin-bottom:14px;font-size:10px} .veh-msg.err{background:#fff1f1;color:#a43c3c;border:1px solid #efc8c8} .veh-msg.ok{background:#e8f6ed;color:#18763a;border:1px solid #cce9d5}
      .veh-search{width:100%;box-sizing:border-box;padding:10px;border:1px solid #d9e0e6;border-radius:7px;margin-bottom:14px;font-size:10px}
      .veh-wrap{background:white;border:1px solid #e2e7ec;border-radius:9px;overflow:auto} .veh-table{width:100%;min-width:1000px;border-collapse:collapse} .veh-table th{padding:12px;background:#0b2946;color:white;text-align:left;font-size:8px} .veh-table td{padding:12px;border-bottom:1px solid #edf0f3;font-size:9px;color:#53616e}
      .veh-status{padding:4px 8px;border-radius:20px;background:#edf0f3;font-size:7px;font-weight:700} .veh-status.available{background:#e3f6e7;color:#18763a} .veh-status.on_ride{background:#e4e8ff;color:#3f51a3} .veh-status.offline{background:#fde7e7;color:#a53a3a}
      .veh-select{padding:7px;border:1px solid #d9e0e6;border-radius:5px;font-size:8px}
    `}</style>
    <main className="veh-page"><h1>Vehicle Management</h1><p className="veh-sub">Monitor vehicles and manage manual AVAILABLE/OFFLINE status.</p>
    {error&&<div className="veh-msg err">{error}</div>}{message&&<div className="veh-msg ok">{message}</div>}
    <input className="veh-search" placeholder="Search vehicle..." value={search} onChange={e=>setSearch(e.target.value)} />
    <div className="veh-wrap">{loading?<div style={{padding:25}}>Loading...</div>:<table className="veh-table"><thead><tr><th>REGISTRATION</th><th>TYPE</th><th>MODEL</th><th>DRIVER</th><th>STATUS</th><th>ACCOUNT</th><th>MANUAL STATUS</th></tr></thead><tbody>
      {rows.map(v=>{const d=getDriver(v.driverId); return <tr key={v.vehicleId}><td><strong>{v.registrationNumber}</strong></td><td>{getType(v.vehicleTypeId)}</td><td>{v.model||"—"}</td><td>{d?`Driver #${d.driverId}`:"Not Assigned"}</td><td><span className={`veh-status ${(v.operationalStatus||"").toLowerCase()}`}>{formatStatus(v.operationalStatus)}</span></td><td>{formatStatus(v.accountStatus)}</td><td><select className="veh-select" disabled={actionId===v.vehicleId||v.operationalStatus==="ON_RIDE"} value={v.operationalStatus==="ON_RIDE"?"ON_RIDE":v.operationalStatus} onChange={e=>changeStatus(v,e.target.value)}><option value="AVAILABLE">Available</option><option value="OFFLINE">Offline</option>{v.operationalStatus==="ON_RIDE"&&<option value="ON_RIDE">On Ride</option>}</select></td></tr>})}
    </tbody></table>}</div></main>
  </>;
}
export default AdminVehicles;
