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


function AdminBookings() {
  const [bookings,setBookings]=useState([]);
  const [types,setTypes]=useState([]);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("ALL");
  const [loading,setLoading]=useState(true);
  const [actionId,setActionId]=useState(null);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");

  const load=async()=>{
    try{setLoading(true);setError("");
      const [b,t]=await Promise.all([fetch(`${API_BASE_URL}/bookings`,{headers:getHeaders()}),fetch(`${API_BASE_URL}/vehicletypes`,{headers:getHeaders()})]);
      if(!b.ok)throw new Error("Unable to load bookings.");setBookings(await b.json());setTypes(t.ok?await t.json():[]);
    }catch(e){setError(e.message||"Unable to load bookings.");}finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);
  const typeName=id=>types.find(t=>Number(t.vehicleTypeId)===Number(id))?.typeName||"—";
  const rows=useMemo(()=>bookings.filter(b=>{
    const q=search.toLowerCase(), txt=[b.bookingId,b.passengerName,b.passengerPhone,b.pickupLocation,b.destination,b.bookingSource,b.bookingStatus].filter(Boolean).join(" ").toLowerCase();
    return(!q||txt.includes(q))&&(filter==="ALL"||b.bookingStatus===filter);
  }).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)),[bookings,search,filter]);

  const cancel=async b=>{
    if(!window.confirm(`Cancel booking #${b.bookingId}?`))return;
    try{setActionId(b.bookingId);setError("");setMessage("");const r=await fetch(`${API_BASE_URL}/bookings/${b.bookingId}/cancel`,{method:"PUT",headers:getHeaders()});const data=await r.json().catch(()=>null);if(!r.ok)throw new Error(data?.message||"Unable to cancel booking.");setMessage(`Booking #${b.bookingId} cancelled.`);await load();}
    catch(e){setError(e.message||"Unable to cancel booking.");}finally{setActionId(null);}
  };

  return <>
    <style>{`
      .bk-page{padding:30px;background:#f4f7fa;min-height:100vh;font-family:Arial} .bk-page h1{margin:0 0 6px;color:#0b2946;font-size:28px} .bk-sub{font-size:11px;color:#7b8794;margin:0 0 20px}
      .bk-msg{padding:11px;border-radius:7px;margin-bottom:14px;font-size:10px} .bk-msg.err{background:#fff1f1;color:#a43c3c;border:1px solid #efc8c8} .bk-msg.ok{background:#e8f6ed;color:#18763a;border:1px solid #cce9d5}
      .bk-tools{display:flex;gap:10px;margin-bottom:14px} .bk-tools input{flex:1} .bk-tools input,.bk-tools select{padding:10px;border:1px solid #d9e0e6;border-radius:6px;background:white;font-size:10px}
      .bk-wrap{background:white;border:1px solid #e2e7ec;border-radius:9px;overflow:auto} .bk-table{width:100%;min-width:1200px;border-collapse:collapse} .bk-table th{background:#0b2946;color:white;padding:12px;text-align:left;font-size:8px} .bk-table td{padding:12px;border-bottom:1px solid #edf0f3;font-size:9px;color:#53616e}
      .bk-cancel{border:0;background:#c94c4c;color:white;border-radius:5px;padding:7px 9px;font-size:8px;font-weight:700;cursor:pointer}
    `}</style>
    <main className="bk-page"><h1>Booking Management</h1><p className="bk-sub">Monitor all bookings. Operational assignment remains with Taxi Operator.</p>
    {error&&<div className="bk-msg err">{error}</div>}{message&&<div className="bk-msg ok">{message}</div>}
    <div className="bk-tools"><input placeholder="Search booking..." value={search} onChange={e=>setSearch(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="ALL">All Statuses</option>{["PENDING","WAITING_FOR_DRIVER","ACCEPTED","DRIVER_ARRIVING","ON_RIDE","COMPLETED","CANCELLED","REJECTED"].map(x=><option key={x} value={x}>{formatStatus(x)}</option>)}</select></div>
    <div className="bk-wrap">{loading?<div style={{padding:25}}>Loading...</div>:<table className="bk-table"><thead><tr><th>ID</th><th>PASSENGER</th><th>SOURCE</th><th>ROUTE</th><th>VEHICLE TYPE</th><th>DRIVER</th><th>VEHICLE</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>
      {rows.map(b=><tr key={b.bookingId}><td><strong>#{b.bookingId}</strong></td><td>{b.passengerName||`User #${b.passengerId||"—"}`}<br/><small>{b.passengerPhone||""}</small></td><td>{formatStatus(b.bookingSource)}</td><td>{b.pickupLocation} → {b.destination}</td><td>{typeName(b.vehicleTypeId)}</td><td>{b.assignedDriverId?`#${b.assignedDriverId}`:"Not Assigned"}</td><td>{b.assignedVehicleId?`#${b.assignedVehicleId}`:"Not Assigned"}</td><td>{formatStatus(b.bookingStatus)}</td><td>{["PENDING","WAITING_FOR_DRIVER","ACCEPTED"].includes(b.bookingStatus)?<button className="bk-cancel" disabled={actionId===b.bookingId} onClick={()=>cancel(b)}>Cancel</button>:"—"}</td></tr>)}
    </tbody></table>}</div></main>
  </>;
}
export default AdminBookings;
