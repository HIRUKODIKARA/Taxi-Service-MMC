import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import BackButton from "../components/BackButton";

function PublicPageLayout() {
  return (
    <>
      <style>{`
        .public-page-layout {
          min-height: 100vh;
          background: #f4f7fa;
        }

        .public-page-back-area {
          padding: 18px 30px 0;
          background: #f4f7fa;
        }

        @media(max-width: 700px) {
          .public-page-back-area {
            padding: 15px 18px 0;
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