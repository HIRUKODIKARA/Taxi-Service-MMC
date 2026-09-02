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


function AdminUsers() {
  const [users,setUsers]=useState([]);
  const [search,setSearch]=useState("");
  const [loading,setLoading]=useState(true);
  const [actionId,setActionId]=useState(null);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");

  const load=async()=>{
    try{setLoading(true);setError("");const r=await fetch(`${API_BASE_URL}/users`,{headers:getHeaders()});const data=await r.json().catch(()=>null);if(!r.ok)throw new Error(data?.message||"Unable to load users.");setUsers(Array.isArray(data)?data:[]);}
    catch(e){setError(e.message||"Unable to load users.");}finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);
  const rows=useMemo(()=>users.filter(u=>[u.fullName,u.email,u.phone,u.accountStatus,...(u.roles||[])].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())),[users,search]);

  const changeStatus=async(u,status)=>{
    try{setActionId(u.userId);setError("");setMessage("");const r=await fetch(`${API_BASE_URL}/users/${u.userId}/status`,{method:"PUT",headers:getHeaders(),body:JSON.stringify({status})});const data=await r.json().catch(()=>null);if(!r.ok)throw new Error(data?.message||"Unable to change user status.");setMessage(`${u.fullName} status updated.`);await load();}
    catch(e){setError(e.message||"Unable to change user status.");}finally{setActionId(null);}
  };

  return <>
    <style>{`
      .us-page{padding:30px;background:#f4f7fa;min-height:100vh;font-family:Arial} .us-page h1{margin:0 0 6px;color:#0b2946;font-size:28px} .us-sub{font-size:11px;color:#7b8794;margin:0 0 20px} .us-note{padding:11px;background:#fffdf2;border-left:4px solid #f6c20d;color:#66737f;font-size:9px;margin-bottom:14px}
      .us-msg{padding:11px;border-radius:7px;margin-bottom:14px;font-size:10px} .us-msg.err{background:#fff1f1;color:#a43c3c;border:1px solid #efc8c8} .us-msg.ok{background:#e8f6ed;color:#18763a;border:1px solid #cce9d5}
      .us-search{width:100%;box-sizing:border-box;padding:10px;border:1px solid #d9e0e6;border-radius:6px;margin-bottom:14px;font-size:10px} .us-wrap{background:white;border:1px solid #e2e7ec;border-radius:9px;overflow:auto} .us-table{width:100%;min-width:900px;border-collapse:collapse} .us-table th{padding:12px;background:#0b2946;color:white;text-align:left;font-size:8px} .us-table td{padding:12px;border-bottom:1px solid #edf0f3;font-size:9px;color:#53616e} .us-select{padding:7px;border:1px solid #d9e0e6;border-radius:5px;font-size:8px}
    `}</style>
    <main className="us-page"><h1>User Management</h1><p className="us-sub">View and manage existing accounts. Creating users is reserved for Super Admin.</p><div className="us-note"><strong>Admin restriction:</strong> No Create User button and no role/permission editing are available here.</div>
    {error&&<div className="us-msg err">{error}</div>}{message&&<div className="us-msg ok">{message}</div>}<input className="us-search" placeholder="Search users..." value={search} onChange={e=>setSearch(e.target.value)}/>
    <div className="us-wrap">{loading?<div style={{padding:25}}>Loading...</div>:<table className="us-table"><thead><tr><th>NAME</th><th>EMAIL</th><th>PHONE</th><th>ROLE</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>
      {rows.map(u=><tr key={u.userId}><td><strong>{u.fullName}</strong></td><td>{u.email}</td><td>{u.phone||"—"}</td><td>{(u.roles||[]).map(r=>r==="TAXI_OPERATIONS"?"Taxi Operator":formatStatus(r)).join(", ")||"—"}</td><td>{formatStatus(u.accountStatus)}</td><td><select className="us-select" disabled={actionId===u.userId||(u.roles||[]).includes("SUPER_ADMIN")} value={u.accountStatus} onChange={e=>changeStatus(u,e.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="SUSPENDED">Suspended</option></select></td></tr>)}
    </tbody></table>}</div></main>
  </>;
}
export default AdminUsers;
