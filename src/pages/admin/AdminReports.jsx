import { useEffect, useState } from "react";


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


function AdminReports() {
  const [report,setReport]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  const load=async()=>{
    try{setLoading(true);setError("");const r=await fetch(`${API_BASE_URL}/reports/dashboard`,{headers:getHeaders()});const data=await r.json().catch(()=>null);if(!r.ok)throw new Error(data?.message||"Unable to load reports.");setReport(data);}
    catch(e){setError(e.message||"Unable to load reports.");}finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);
  const money=v=>Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});

  return <>
    <style>{`
      .rp-page{padding:30px;background:#f4f7fa;min-height:100vh;font-family:Arial} .rp-page h1{margin:0 0 6px;color:#0b2946;font-size:28px} .rp-sub{font-size:11px;color:#7b8794;margin:0 0 20px}
      .rp-error{padding:11px;background:#fff1f1;color:#a43c3c;border:1px solid #efc8c8;border-radius:7px;margin-bottom:14px;font-size:10px}
      .rp-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px} .rp-card{background:white;border:1px solid #e2e7ec;border-radius:9px;padding:18px} .rp-card span{font-size:8px;color:#89949e;font-weight:700} .rp-card h2{margin:7px 0 0;color:#0b2946;font-size:22px}
      .rp-group{margin-top:18px;background:white;border:1px solid #e2e7ec;border-radius:9px;padding:18px} .rp-group h3{margin:0 0 14px;color:#0b2946;font-size:15px}
      @media(max-width:900px){.rp-grid{grid-template-columns:repeat(2,1fr)}}
    `}</style>
    <main className="rp-page"><h1>Reports</h1><p className="rp-sub">System performance, booking, driver, vehicle and revenue summary.</p>
    {error&&<div className="rp-error">{error}</div>}
    {loading?<div>Loading reports...</div>:report&&<><div className="rp-grid">
      <div className="rp-card"><span>TOTAL BOOKINGS</span><h2>{report.bookings?.total||0}</h2></div><div className="rp-card"><span>ACTIVE BOOKINGS</span><h2>{report.bookings?.active||0}</h2></div><div className="rp-card"><span>COMPLETED</span><h2>{report.bookings?.completed||0}</h2></div><div className="rp-card"><span>CANCELLED</span><h2>{report.bookings?.cancelled||0}</h2></div>
    </div><div className="rp-group"><h3>Operations Summary</h3><div className="rp-grid">
      <div className="rp-card"><span>APPROVED DRIVERS</span><h2>{report.drivers?.approved||0}</h2></div><div className="rp-card"><span>AVAILABLE DRIVERS</span><h2>{report.drivers?.available||0}</h2></div><div className="rp-card"><span>AVAILABLE VEHICLES</span><h2>{report.vehicles?.available||0}</h2></div><div className="rp-card"><span>TOTAL REVENUE</span><h2>Rs. {money(report.revenue?.total)}</h2></div>
    </div></div></>}
    </main>
  </>;
}
export default AdminReports;
