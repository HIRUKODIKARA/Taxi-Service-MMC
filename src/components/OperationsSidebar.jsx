import { NavLink, useNavigate } from "react-router-dom";

function OperationsSidebar() {
  const navigate = useNavigate();
  const menuClass = ({ isActive }) => isActive ? "operations-sidebar-link active" : "operations-sidebar-link";

  const handleLogout = () => {
    ["token", "authToken", "accessToken", "user"].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    navigate("/login", { replace: true });
  };

  return (
    <>
      <style>{`
        .operations-sidebar { position: fixed; top: 0; left: 0; width: 250px; height: 100vh; background: #0b2946; color: white; display: flex; flex-direction: column; overflow-y: auto; z-index: 2000; font-family: Arial, Helvetica, sans-serif; }
        .operations-sidebar-logo { padding: 26px 22px 20px; border-bottom: 1px solid rgba(255,255,255,.12); }
        .operations-sidebar-logo h2 { margin: 0 0 6px; color: #f6c20d; font-size: 24px; font-weight: 800; }
        .operations-sidebar-logo span { color: #d2dce5; font-size: 11px; font-weight: 700; }
        .operations-sidebar-menu { flex: 1; display: flex; flex-direction: column; gap: 6px; padding: 18px 12px; }
        .operations-sidebar-link { display: flex; align-items: center; gap: 11px; padding: 12px 14px; border-radius: 7px; text-decoration: none; color: #dbe5ee; font-size: 12px; font-weight: 600; transition: .2s; }
        .operations-sidebar-link:hover { background: #123d67; color: white; }
        .operations-sidebar-link.active { background: #f6c20d; color: #0b2946; font-weight: 800; }
        .operations-sidebar-bottom { padding: 16px 14px; border-top: 1px solid rgba(255,255,255,.12); background: #09243e; }
        .operations-role { padding: 0 6px 12px; }
        .operations-role strong { display: block; color: white; font-size: 11px; }
        .operations-role small { display: block; margin-top: 4px; color: #aebdca; font-size: 9px; }
        .operations-logout-btn { width: 100%; padding: 10px 12px; border: 1px solid rgba(255,255,255,.22); border-radius: 6px; background: transparent; color: white; font-size: 11px; font-weight: 700; text-align: left; cursor: pointer; }
        .operations-logout-btn:hover { background: rgba(255,255,255,.08); }
        @media (max-width: 800px) { .operations-sidebar { width: 210px; } }
      `}</style>
      <aside className="operations-sidebar">
        <div className="operations-sidebar-logo"><h2>MMC Taxi</h2><span>Taxi Operator</span></div>
        <nav className="operations-sidebar-menu">
          <NavLink to="/operations/dashboard" className={menuClass}>🏠 Dashboard</NavLink>
          <NavLink to="/operations/bookings" className={menuClass}>📋 Bookings</NavLink>
          <NavLink to="/operations/phone-booking" className={menuClass}>📞 Phone Booking</NavLink>
          <NavLink to="/operations/onsite-booking" className={menuClass}>🏢 On-Site Booking</NavLink>
          <NavLink to="/operations/drivers" className={menuClass}>👨‍✈️ Drivers</NavLink>
          <NavLink to="/operations/vehicles" className={menuClass}>🚕 Vehicles</NavLink>
          <NavLink to="/operations/notifications" className={menuClass}>🔔 Notifications</NavLink>
        </nav>
        <div className="operations-sidebar-bottom">
          <div className="operations-role"><strong>Taxi Operator</strong><small>Makumbura Multimodal Center</small></div>
          <button type="button" className="operations-logout-btn" onClick={handleLogout}>↪ Logout</button>
        </div>
      </aside>
    </>
  );
}

export default OperationsSidebar;
