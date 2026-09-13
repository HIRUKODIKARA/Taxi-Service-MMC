import { useEffect, useState } from "react";


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


function AdminVehicleTypes() {
  const [types,setTypes]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [form,setForm]=useState({vehicleTypeId:null,typeName:"",description:"",passengerCapacity:1,status:"ACTIVE"});
  const [editing,setEditing]=useState(false);

  const load=async()=>{
    try{setLoading(true);setError("");const r=await fetch(`${API_BASE_URL}/vehicletypes`,{headers:getHeaders()});if(!r.ok)throw new Error("Unable to load vehicle types.");setTypes(await r.json());}
    catch(e){setError(e.message||"Unable to load vehicle types.");}finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);

  const reset=()=>{setForm({vehicleTypeId:null,typeName:"",description:"",passengerCapacity:1,status:"ACTIVE"});setEditing(false);};
  const edit=t=>{setForm({vehicleTypeId:t.vehicleTypeId,typeName:t.typeName||"",description:t.description||"",passengerCapacity:t.passengerCapacity||1,status:t.status||"ACTIVE"});setEditing(true);};

  const save=async e=>{
    e.preventDefault();setError("");setMessage("");
    try{
      const payload={typeName:form.typeName.trim(),description:form.description.trim()||null,passengerCapacity:Number(form.passengerCapacity),status:form.status};
      const url=editing?`${API_BASE_URL}/vehicletypes/${form.vehicleTypeId}`:`${API_BASE_URL}/vehicletypes`;
      const r=await fetch(url,{method:editing?"PUT":"POST",headers:getHeaders(),body:JSON.stringify(payload)});
      const data=await r.json().catch(()=>null);if(!r.ok)throw new Error(data?.message||"Unable to save vehicle type.");
      setMessage(editing?"Vehicle type updated.":"Vehicle type created.");reset();await load();
    }catch(e){setError(e.message||"Unable to save vehicle type.");}
  };

  const icon=n=>{const x=(n||"").toLowerCase();if(x==="car")return"🚗";if(x.includes("three"))return"🛺";if(x==="bike")return"🏍️";return"🚕";};

  return <>
    <style>{`
      .vt-page{padding:30px;background:#f4f7fa;min-height:100vh;font-family:Arial} .vt-page h1{margin:0 0 6px;color:#0b2946;font-size:28px} .vt-sub{font-size:11px;color:#7b8794;margin:0 0 20px}
      .vt-msg{padding:11px;border-radius:7px;margin-bottom:14px;font-size:10px} .vt-msg.err{background:#fff1f1;color:#a43c3c;border:1px solid #efc8c8} .vt-msg.ok{background:#e8f6ed;color:#18763a;border:1px solid #cce9d5}
      .vt-layout{display:grid;grid-template-columns:1fr 1.7fr;gap:18px} .vt-panel{background:white;border:1px solid #e2e7ec;border-radius:9px;padding:18px}
      .vt-form label{display:block;font-size:9px;color:#0b2946;font-weight:700;margin:10px 0 5px} .vt-form input,.vt-form textarea,.vt-form select{width:100%;box-sizing:border-box;padding:9px;border:1px solid #d9e0e6;border-radius:6px;font-size:10px}
      .vt-form button{margin-top:12px;border:0;border-radius:6px;padding:10px 13px;background:#f6c20d;color:#0b2946;font-weight:800;cursor:pointer} .vt-form .cancel{background:#edf0f3;margin-left:8px}
      .vt-grid{display:grid;gap:10px} .vt-card{border:1px solid #e2e7ec;border-radius:8px;padding:14px;display:flex;justify-content:space-between;gap:15px} .vt-card h3{margin:0 0 5px;color:#0b2946;font-size:13px} .vt-card p{margin:3px 0;color:#66737f;font-size:9px}
      .vt-edit{border:1px solid #0b2946;background:white;color:#0b2946;border-radius:5px;padding:7px 9px;cursor:pointer;font-size:8px;font-weight:700}
    `}</style>
    <main className="vt-page"><h1>Vehicle Types</h1><p className="vt-sub">Manage supported taxi categories.</p>
    {error&&<div className="vt-msg err">{error}</div>}{message&&<div className="vt-msg ok">{message}</div>}
    <div className="vt-layout"><form className="vt-panel vt-form" onSubmit={save}><h3 style={{marginTop:0,color:"#0b2946"}}>{editing?"Edit Vehicle Type":"Add Vehicle Type"}</h3>
      <label>Type Name</label><input required value={form.typeName} onChange={e=>setForm({...form,typeName:e.target.value})}/>
      <label>Description</label><textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
      <label>Passenger Capacity</label><input required type="number" min="1" value={form.passengerCapacity} onChange={e=>setForm({...form,passengerCapacity:e.target.value})}/>
      {editing&&<><label>Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></>}
      <button type="submit">{editing?"Save Changes":"Create Type"}</button>{editing&&<button type="button" className="cancel" onClick={reset}>Cancel</button>}
    </form>
    <section className="vt-panel"><h3 style={{marginTop:0,color:"#0b2946"}}>Existing Vehicle Types</h3>{loading?<p>Loading...</p>:<div className="vt-grid">{types.map(t=><div className="vt-card" key={t.vehicleTypeId}><div><h3>{icon(t.typeName)} {t.typeName}</h3><p>{t.description||"No description"}</p><p>Capacity: {t.passengerCapacity} | {formatStatus(t.status)}</p></div><button className="vt-edit" onClick={()=>edit(t)}>Edit</button></div>)}</div>}</section></div>
    </main>
  </>;
}
export default AdminVehicleTypes;
