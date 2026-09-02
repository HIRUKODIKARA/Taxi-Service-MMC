import { Outlet } from "react-router-dom";
import DriverSidebar from "../components/DriverSidebar";
import BackButton from "../components/BackButton";

function DriverLayout() {
  return (
    <>
      <style>{`
        .driver-layout { min-height:100vh; background:#f4f7fa; }
        .driver-main-content { margin-left:250px; width:calc(100% - 250px); min-height:100vh; }
        .driver-back-area { padding:20px 30px 0; background:#f4f7fa; }
        @media(max-width:800px){ .driver-main-content{margin-left:210px;width:calc(100% - 210px);} .driver-back-area{padding:18px 18px 0;} }
      `}</style>
      <div className="driver-layout">
        <DriverSidebar />
        <main className="driver-main-content">
          <div className="driver-back-area"><BackButton /></div>
          <Outlet />
        </main>
      </div>
    </>
  );
}
export default DriverLayout;
