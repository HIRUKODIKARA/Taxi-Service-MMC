import { Outlet } from "react-router-dom";
import PassengerSidebar from "../components/PassengerSidebar";
import BackButton from "../components/BackButton";

function PassengerLayout() {
  return (
    <>
      <style>{`
        .passenger-layout {
          min-height: 100vh;
          background: #f4f7fa;
        }

        .passenger-main-content {
          margin-left: 250px;
          width: calc(100% - 250px);
          min-height: 100vh;
        }

        .passenger-back-area {
          padding: 20px 30px 0;
          background: #f4f7fa;
        }

        @media (max-width: 800px) {
          .passenger-main-content {
            margin-left: 210px;
            width: calc(100% - 210px);
          }

          .passenger-back-area {
            padding: 18px 18px 0;
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