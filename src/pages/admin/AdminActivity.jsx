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


function AdminActivity() {
  const [logs,setLogs]=useState([]);
  const [types,setTypes]=useState([]);
  const [type,setType]=useState("");
  const [search,setSearch]=useState("");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  const load=async()=>{
    try{setLoading(true);setError("");
      const [l,t]=await Promise.all([
        fetch(`${API_BASE_URL}/activitylogs`,{headers:getHeaders()}),
        fetch(`${API_BASE_URL}/activitylogs/types`,{headers:getHeaders()})
      ]);
      const data=await l.json().catch(()=>null);if(!l.ok)throw new Error(data?.message||"Unable to load activity logs.");
      setLogs(Array.isArray(data)?data:[]);setTypes(t.ok?await t.json():[]);
    }catch(e){setError(e.message||"Unable to load activity logs.");}finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);

  const rows=useMemo(()=>logs.filter(l=>{
    const q=search.toLowerCase(), text=[l.userName,l.userEmail,l.activityType,l.description].filter(Boolean).join(" ").toLowerCase();
    return(!q||text.includes(q))&&(!type||l.activityType===type);
  }),[logs,search,type]);

  return <>
    <style>{`
      .ac-page{padding:30px;background:#f4f7fa;min-height:100vh;font-family:Arial} .ac-page h1{margin:0 0 6px;color:#0b2946;font-size:28px} .ac-sub{font-size:11px;color:#7b8794;margin:0 0 20px}
      .ac-error{padding:11px;background:#fff1f1;color:#a43c3c;border:1px solid #efc8c8;border-radius:7px;margin-bottom:14px;font-size:10px} .ac-tools{display:flex;gap:10px;margin-bottom:14px} .ac-tools input{flex:1} .ac-tools input,.ac-tools select{padding:10px;border:1px solid #d9e0e6;border-radius:6px;background:white;font-size:10px}
      .ac-list{display:grid;gap:9px} .ac-card{background:white;border:1px solid #e2e7ec;border-radius:8px;padding:14px;display:grid;grid-template-columns:150px 1fr auto;gap:14px;align-items:center} .ac-type{font-size:8px;font-weight:800;color:#0b2946} .ac-desc{font-size:9px;color:#53616e} .ac-time{font-size:8px;color:#89949e;text-align:right}
      @media(max-width:700px){.ac-card{grid-template-columns:1fr}}
    `}</style>
    <main className="ac-page"><h1>Activity Monitoring</h1><p className="ac-sub">View system activity logs available to the Admin role.</p>
    {error&&<div className="ac-error">{error}</div>}<div className="ac-tools"><input placeholder="Search activity..." value={search} onChange={e=>setSearch(e.target.value)}/><select value={type} onChange={e=>setType(e.target.value)}><option value="">All Activity Types</option>{types.map(x=><option key={x} value={x}>{formatStatus(x)}</option>)}</select></div>
    {loading?<div>Loading...</div>:<div className="ac-list">{rows.map(l=><div className="ac-card" key={l.logId}><div><div className="ac-type">{formatStatus(l.activityType)}</div><small>{l.userName||"System"}</small></div><div className="ac-desc">{l.description}</div><div className="ac-time">{l.createdAt?new Date(l.createdAt).toLocaleString():""}</div></div>)}</div>}
    </main>
  </>;
}
export default AdminActivity;
