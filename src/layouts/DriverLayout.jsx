import { Outlet } from "react-router-dom";
import DriverSidebar from "../components/DriverSidebar";
import BackButton from "../components/BackButton";

function DriverLayout() {
  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .driver-layout {
          min-height: 100vh;
          width: 100%;
          background: #f4f7fa;
        }

        .driver-main-content {
          margin-left: 250px;
          width: calc(100% - 250px);
          min-height: 100vh;
          min-width: 0;
          background: #f4f7fa;
          overflow-x: hidden;
        }

        .driver-back-area {
          padding: 20px 30px 0;
          background: #f4f7fa;
        }

        /* TABLET */

        @media (max-width: 1000px) and (min-width: 761px) {
          .driver-main-content {
            margin-left: 210px;
            width: calc(100% - 210px);
          }
        }

        /* MOBILE */

        @media (max-width: 760px) {
          .driver-main-content {
            margin-left: 0;
            width: 100%;
            min-width: 0;
            overflow-x: hidden;
          }

          .driver-back-area {
            padding: 72px 16px 0;
          }
        }
      `}</style>

      <div className="driver-layout">
        <DriverSidebar />

        <main className="driver-main-content">
          <div className="driver-back-area">
            <BackButton />
          </div>

          <Outlet />
        </main>
      </div>
    </>
  );
}

export default DriverLayout;