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

function OperationsBookings() {
  const [bookings,setBookings]=useState([]); const [vehicles,setVehicles]=useState([]); const [vehicleTypes,setVehicleTypes]=useState([]);
  const [search,setSearch]=useState(""); const [sourceFilter,setSourceFilter]=useState("ALL"); const [statusFilter,setStatusFilter]=useState("ALL");
  const [selected,setSelected]=useState(null); const [assignVehicleId,setAssignVehicleId]=useState(""); const [error,setError]=useState(""); const [message,setMessage]=useState(""); const [loading,setLoading]=useState(true);

  const loadData=async()=>{
    try{setLoading(true);setError("");const [bRes,vRes,tRes]=await Promise.all([fetch(`${API_BASE_URL}/bookings`,{headers:authHeaders()}),fetch(`${API_BASE_URL}/vehicles/available`,{headers:authHeaders()}),fetch(`${API_BASE_URL}/vehicletypes/all`,{headers:authHeaders()})]);const [bData,vData,tData]=await Promise.all([safeJson(bRes),safeJson(vRes),safeJson(tRes)]);if(!bRes.ok)throw new Error(bData?.message||"Unable to load bookings.");if(!vRes.ok)throw new Error(vData?.message||"Unable to load available vehicles.");setBookings(Array.isArray(bData)?bData:[]);setVehicles(Array.isArray(vData)?vData:[]);setVehicleTypes(tRes.ok&&Array.isArray(tData)?tData:[]);}catch(e){setError(e.message||"Unable to load booking management.");}finally{setLoading(false);}
  };
  useEffect(()=>{loadData();},[]);
  const typeName=(id)=>vehicleTypes.find((t)=>Number(t.vehicleTypeId)===Number(id))?.typeName||`Type #${id??"—"}`;
  const filtered=useMemo(()=>bookings.filter((b)=>{const q=search.trim().toLowerCase();const searchOk=!q||[b.bookingId,b.passengerName,b.passengerPhone,b.pickupLocation,b.destination].some((x)=>(x??"").toString().toLowerCase().includes(q));return searchOk&&(sourceFilter==="ALL"||b.bookingSource===sourceFilter)&&(statusFilter==="ALL"||b.bookingStatus===statusFilter);}),[bookings,search,sourceFilter,statusFilter]);
  const openBooking=(b)=>{setSelected(b);setAssignVehicleId("");setError("");setMessage("");};
  const assign=async()=>{if(!selected||!assignVehicleId)return;const vehicle=vehicles.find((v)=>Number(v.vehicleId)===Number(assignVehicleId));if(!vehicle?.driverId){setError("Selected vehicle does not have an assigned driver.");return;}try{setError("");setMessage("");const res=await fetch(`${API_BASE_URL}/bookings/${selected.bookingId}/assign`,{method:"PUT",headers:authHeaders(),body:JSON.stringify({driverId:vehicle.driverId,vehicleId:vehicle.vehicleId})});const data=await safeJson(res);if(!res.ok)throw new Error(data?.message||"Unable to assign driver and vehicle.");setMessage("Driver and vehicle assigned. Waiting for driver acceptance.");setSelected(null);await loadData();}catch(e){setError(e.message);}};
  const eligibleVehicles=selected?vehicles.filter((v)=>Number(v.vehicleTypeId)===Number(selected.vehicleTypeId)):[];

  return (<>
    <style>{`
      .ob-page{padding:30px;min-height:100vh;background:#f4f7fa;font-family:Arial,sans-serif;color:#0b2946}.ob-head{display:flex;justify-content:space-between;gap:15px;align-items:flex-start;margin-bottom:20px}.ob-head h1{margin:0 0 6px;font-size:28px}.ob-head p{margin:0;color:#7b8794;font-size:12px}.ob-btn{border:none;background:#0b2946;color:white;padding:10px 14px;border-radius:6px;font-weight:700;cursor:pointer}
      .ob-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:18px}.ob-card{background:white;border:1px solid #e2e7ec;border-radius:9px;padding:18px}.ob-card span{font-size:9px;color:#89949e}.ob-card h2{margin:6px 0 0}.ob-panel{background:white;border:1px solid #e2e7ec;border-radius:10px;padding:18px}.ob-tools{display:grid;grid-template-columns:1fr 180px 180px;gap:10px;margin-bottom:15px}.ob-tools input,.ob-tools select,.ob-select{padding:10px;border:1px solid #d8e0e6;border-radius:6px;background:white}
      .ob-wrap{overflow-x:auto}.ob-table{width:100%;min-width:1050px;border-collapse:collapse}.ob-table th{background:#f5f7f9;padding:11px;text-align:left;font-size:9px}.ob-table td{padding:12px 11px;border-bottom:1px solid #edf0f3;font-size:10px}.ob-tag{padding:5px 8px;border-radius:20px;background:#eef3f7;font-size:8px;font-weight:800}.ob-view{border:1px solid #0b2946;background:white;color:#0b2946;padding:7px 10px;border-radius:5px;cursor:pointer;font-weight:700}.ob-msg,.ob-err{padding:11px 13px;border-radius:7px;margin-bottom:14px;font-size:10px}.ob-msg{background:#edf9f0;color:#276638}.ob-err{background:#fff1f1;color:#a63737}
      .ob-overlay{position:fixed;inset:0;background:rgba(4,19,33,.68);z-index:5000;display:flex;align-items:center;justify-content:center;padding:20px}.ob-modal{width:100%;max-width:680px;max-height:90vh;overflow:auto;background:white;border-radius:12px;padding:22px}.ob-modal-head{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5e9ed;padding-bottom:13px;margin-bottom:16px}.ob-modal-head h2{margin:0}.ob-close{border:none;background:#eef2f5;width:32px;height:32px;border-radius:50%;cursor:pointer}.ob-detail-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.ob-detail{padding:12px;background:#f7f9fb;border-radius:7px}.ob-detail span{display:block;color:#8a96a0;font-size:8px;margin-bottom:4px}.ob-detail strong{font-size:10px}.ob-assign{margin-top:17px;padding-top:15px;border-top:1px solid #e8edf1}.ob-assign-row{display:flex;gap:10px}.ob-assign-row select{flex:1}.ob-yellow{border:none;background:#f6c20d;color:#0b2946;padding:10px 14px;border-radius:6px;font-weight:800;cursor:pointer}
      @media(max-width:900px){.ob-summary{grid-template-columns:repeat(2,1fr)}.ob-tools{grid-template-columns:1fr}}@media(max-width:600px){.ob-page{padding:18px}.ob-summary,.ob-detail-grid{grid-template-columns:1fr}.ob-head{flex-direction:column}}
    `}</style>
    <main className="ob-page">
      <div className="ob-head"><div><h1>Booking Management</h1><p>Manage website, phone and on-site bookings and assign available drivers.</p></div><button className="ob-btn" onClick={loadData}>Refresh</button></div>
      {error&&<div className="ob-err">{error}</div>}{message&&<div className="ob-msg">{message}</div>}
      <div className="ob-summary"><div className="ob-card"><span>TOTAL</span><h2>{bookings.length}</h2></div><div className="ob-card"><span>PENDING</span><h2>{bookings.filter(b=>["PENDING","REJECTED"].includes(b.bookingStatus)).length}</h2></div><div className="ob-card"><span>ON RIDE</span><h2>{bookings.filter(b=>b.bookingStatus==="ON_RIDE").length}</h2></div><div className="ob-card"><span>COMPLETED</span><h2>{bookings.filter(b=>b.bookingStatus==="COMPLETED").length}</h2></div></div>
      <section className="ob-panel"><div className="ob-tools"><input placeholder="Search booking, passenger, phone or destination..." value={search} onChange={e=>setSearch(e.target.value)}/><select value={sourceFilter} onChange={e=>setSourceFilter(e.target.value)}><option value="ALL">All Sources</option><option value="WEBSITE">Website</option><option value="PHONE">Phone</option><option value="ON_SITE">On-Site</option></select><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="ALL">All Status</option><option value="PENDING">Pending</option><option value="WAITING_FOR_DRIVER">Waiting for Driver</option><option value="ACCEPTED">Accepted</option><option value="DRIVER_ARRIVING">Driver Arriving</option><option value="ON_RIDE">On Ride</option><option value="COMPLETED">Completed</option><option value="REJECTED">Rejected</option></select></div>
      <div className="ob-wrap"><table className="ob-table"><thead><tr><th>ID</th><th>Source</th><th>Passenger</th><th>Pickup</th><th>Destination</th><th>Type</th><th>Driver</th><th>Vehicle</th><th>Status</th><th>Action</th></tr></thead><tbody>{filtered.map((b)=><tr key={b.bookingId}><td><strong>BK{String(b.bookingId).padStart(4,"0")}</strong></td><td>{formatText(b.bookingSource)}</td><td><strong>{b.passengerName||"—"}</strong><div>{b.passengerPhone||"—"}</div></td><td>{b.pickupLocation}</td><td>{b.destination}</td><td>{typeName(b.vehicleTypeId)}</td><td>{b.assignedDriverId?`Driver #${b.assignedDriverId}`:"Not Assigned"}</td><td>{b.assignedVehicleId?`Vehicle #${b.assignedVehicleId}`:"—"}</td><td><span className="ob-tag">{formatText(b.bookingStatus)}</span></td><td><button className="ob-view" onClick={()=>openBooking(b)}>View</button></td></tr>)}{!loading&&filtered.length===0&&<tr><td colSpan="10">No bookings found.</td></tr>}</tbody></table></div></section>
      {selected&&<div className="ob-overlay"><div className="ob-modal"><div className="ob-modal-head"><div><h2>Booking Details</h2><small>BK{String(selected.bookingId).padStart(4,"0")}</small></div><button className="ob-close" onClick={()=>setSelected(null)}>✕</button></div><div className="ob-detail-grid"><div className="ob-detail"><span>PASSENGER</span><strong>{selected.passengerName||"—"}</strong></div><div className="ob-detail"><span>PHONE</span><strong>{selected.passengerPhone||"—"}</strong></div><div className="ob-detail"><span>SOURCE</span><strong>{formatText(selected.bookingSource)}</strong></div><div className="ob-detail"><span>VEHICLE TYPE</span><strong>{typeName(selected.vehicleTypeId)}</strong></div><div className="ob-detail"><span>PICKUP</span><strong>{selected.pickupLocation}</strong></div><div className="ob-detail"><span>DESTINATION</span><strong>{selected.destination}</strong></div><div className="ob-detail"><span>DATE</span><strong>{selected.bookingDate||"—"}</strong></div><div className="ob-detail"><span>TIME</span><strong>{selected.bookingTime||"—"}</strong></div><div className="ob-detail"><span>DRIVER</span><strong>{selected.assignedDriverId?`Driver #${selected.assignedDriverId}`:"Not Assigned"}</strong></div><div className="ob-detail"><span>STATUS</span><strong>{formatText(selected.bookingStatus)}</strong></div></div>
      {["PENDING","REJECTED"].includes(selected.bookingStatus)&&<div className="ob-assign"><h3>Assign Available Driver & Vehicle</h3><div className="ob-assign-row"><select className="ob-select" value={assignVehicleId} onChange={e=>setAssignVehicleId(e.target.value)}><option value="">Select matching vehicle</option>{eligibleVehicles.map(v=><option key={v.vehicleId} value={v.vehicleId}>{v.registrationNumber} · Driver #{v.driverId}</option>)}</select><button className="ob-yellow" disabled={!assignVehicleId} onClick={assign}>Assign</button></div>{eligibleVehicles.length===0&&<p style={{fontSize:10,color:'#a63737'}}>No available vehicle matches this requested type.</p>}</div>}</div></div>}
    </main>
  </>);
}

export default OperationsBookings;
