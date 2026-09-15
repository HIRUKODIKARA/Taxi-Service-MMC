import { Outlet } from "react-router-dom";
import PassengerSidebar from "../components/PassengerSidebar";
import BackButton from "../components/BackButton";

function PassengerLayout() {
  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .passenger-layout {
          min-height: 100vh;
          width: 100%;
          background: #f4f7fa;
        }

        .passenger-main-content {
          margin-left: 250px;
          width: calc(100% - 250px);
          min-height: 100vh;
          min-width: 0;
          background: #f4f7fa;
          overflow-x: hidden;
        }

        .passenger-back-area {
          padding: 20px 30px 0;
          background: #f4f7fa;
        }

        /* =========================
           TABLET
        ========================= */

        @media (max-width: 1000px) and (min-width: 761px) {
          .passenger-main-content {
            margin-left: 210px;
            width: calc(100% - 210px);
          }
        }

        /* =========================
           MOBILE
        ========================= */

        @media (max-width: 760px) {
          .passenger-main-content {
            margin-left: 0;
            width: 100%;
            min-width: 0;
            overflow-x: hidden;
          }

          .passenger-back-area {
            padding: 72px 16px 0;
          }
        }
      `}</style>

      <div className="passenger-layout">
        <PassengerSidebar />

        <main className="passenger-main-content">
          <div className="passenger-back-area">
            <BackButton />
          </div>

          <Outlet />
        </main>
      </div>
    </>
  );
}

export default PassengerLayout;