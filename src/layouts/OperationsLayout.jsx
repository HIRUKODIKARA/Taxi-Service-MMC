import { Outlet } from "react-router-dom";
import OperationsSidebar from "../components/OperationsSidebar";
import BackButton from "../components/BackButton";

function OperationsLayout() {
  return (
    <>
      <style>{`
        .operations-layout {
          min-height: 100vh;
          background: #f4f7fa;
        }

        .operations-main-content {
          margin-left: 250px;
          width: calc(100% - 250px);
          min-height: 100vh;
        }

        .operations-back-area {
          padding: 20px 30px 0;
          background: #f4f7fa;
        }

        @media (max-width: 800px) {
          .operations-main-content {
            margin-left: 210px;
            width: calc(100% - 210px);
          }

          .operations-back-area {
            padding: 18px 18px 0;
          }
        }
      `}</style>

      <div className="operations-layout">
        <OperationsSidebar />

        <main className="operations-main-content">
          <div className="operations-back-area">
            <BackButton />
          </div>

          <Outlet />
        </main>
      </div>
    </>
  );
}

export default OperationsLayout;