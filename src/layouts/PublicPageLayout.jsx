import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import BackButton from "../components/BackButton";

function PublicPageLayout() {
  return (
    <>
      <style>{`
        .public-page-layout {
          min-height: 100vh;
          width: 100%;
          background: #f4f7fa;
          overflow-x: hidden;
        }

        .public-page-back-area {
          padding: 18px 30px 0;
          background: #f4f7fa;
        }

        @media (max-width: 700px) {
          .public-page-back-area {
            padding: 14px 16px 0;
          }
        }

        @media (max-width: 480px) {
          .public-page-back-area {
            padding: 12px 14px 0;
          }
        }
      `}</style>

      <div className="public-page-layout">
        <Navbar />

        <div className="public-page-back-area">
          <BackButton />
        </div>

        <Outlet />
      </div>
    </>
  );
}

export default PublicPageLayout;
