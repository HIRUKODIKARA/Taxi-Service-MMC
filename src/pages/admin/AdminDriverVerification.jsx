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


function AdminDriverVerification() {
  const [drivers,setDrivers]=useState([]);
  const [users,setUsers]=useState([]);
  const [filter,setFilter]=useState("PENDING");
  const [loading,setLoading]=useState(true);
  const [actionId,setActionId]=useState(null);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");

  const load=async()=>{
    try{
      setLoading(true);setError("");
      const [d,u]=await Promise.all([
        fetch(`${API_BASE_URL}/drivers`,{headers:getHeaders()}),
        fetch(`${API_BASE_URL}/users`,{headers:getHeaders()})
      ]);
      if(!d.ok) throw new Error("Unable to load driver verification list.");
      setDrivers(await d.json()); setUsers(u.ok?await u.json():[]);
    }catch(e){setError(e.message||"Unable to load driver verification list.");}
    finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);
  const getUser=d=>users.find(u=>Number(u.userId)===Number(d.userId));

  const approve=async id=>{
    try{setActionId(id);setError("");setMessage("");
      const r=await fetch(`${API_BASE_URL}/drivers/${id}/approve`,{method:"PUT",headers:getHeaders()});
      const data=await r.json().catch(()=>null);
      if(!r.ok) throw new Error(data?.message||"Unable to approve driver.");
      setMessage(`Driver #${id} approved successfully.`); await load();
    }catch(e){setError(e.message||"Unable to approve driver.");} finally{setActionId(null);}
  };

  const reject=async id=>{
    const reason=window.prompt("Enter rejection reason:");
    if(reason===null) return;
    if(!reason.trim()){setError("Rejection reason is required.");return;}
    try{setActionId(id);setError("");setMessage("");
      const r=await fetch(`${API_BASE_URL}/drivers/${id}/reject`,{method:"PUT",headers:getHeaders(),body:JSON.stringify({reason:reason.trim()})});
      const data=await r.json().catch(()=>null);
      if(!r.ok) throw new Error(data?.message||"Unable to reject driver.");
      setMessage(`Driver #${id} rejected.`); await load();
    }catch(e){setError(e.message||"Unable to reject driver.");} finally{setActionId(null);}
  };

  const rows=useMemo(()=>filter==="ALL"?drivers:drivers.filter(d=>d.verificationStatus===filter),[drivers,filter]);

  return <>
    <style>{`
      .vf-page{padding:30px;background:#f4f7fa;min-height:100vh;font-family:Arial} .vf-page h1{margin:0 0 6px;color:#0b2946;font-size:28px} .vf-sub{font-size:11px;color:#7b8794;margin:0 0 20px}
      .vf-msg{padding:11px;border-radius:7px;margin-bottom:14px;font-size:10px} .vf-msg.err{background:#fff1f1;color:#a43c3c;border:1px solid #efc8c8} .vf-msg.ok{background:#e8f6ed;color:#18763a;border:1px solid #cce9d5}
      .vf-filter{margin-bottom:14px;padding:10px;border:1px solid #d9e0e6;border-radius:6px;background:white;font-size:10px}
      .vf-grid{display:grid;gap:12px} .vf-card{background:white;border:1px solid #e2e7ec;border-radius:9px;padding:18px;display:grid;grid-template-columns:1fr auto;gap:15px}
      .vf-card h3{margin:0 0 8px;color:#0b2946;font-size:14px} .vf-card p{margin:4px 0;color:#66737f;font-size:9px} .vf-actions{display:flex;gap:8px;align-items:center}
      .vf-actions button{border:0;border-radius:6px;padding:9px 12px;cursor:pointer;font-size:9px;font-weight:700} .approve{background:#198754;color:white} .reject{background:#c94c4c;color:white}
    `}</style>
    <main className="vf-page"><h1>Driver Verification</h1><p className="vf-sub">Approve or reject driver registrations according to assigned permissions.</p>
    {error&&<div className="vf-msg err">{error}</div>}{message&&<div className="vf-msg ok">{message}</div>}
    <select className="vf-filter" value={filter} onChange={e=>setFilter(e.target.value)}><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="ALL">All</option></select>
    {loading?<div>Loading...</div>:<div className="vf-grid">{rows.map(d=>{const u=getUser(d); return <div className="vf-card" key={d.driverId}><div><h3>{u?.fullName||`Driver #${d.driverId}`}</h3><p>Email: {u?.email||"—"}</p><p>Phone: {u?.phone||"—"}</p><p>Driving Licence: {d.drivingLicenseNo||"—"}</p><p>Status: <strong>{formatStatus(d.verificationStatus)}</strong></p></div><div className="vf-actions">{d.verificationStatus==="PENDING"&&<><button className="approve" disabled={actionId===d.driverId} onClick={()=>approve(d.driverId)}>Approve</button><button className="reject" disabled={actionId===d.driverId} onClick={()=>reject(d.driverId)}>Reject</button></>}</div></div>})}</div>}
    </main>
  </>;
}
export default AdminDriverVerification;
