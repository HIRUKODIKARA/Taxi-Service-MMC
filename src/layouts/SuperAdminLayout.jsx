import { Outlet } from "react-router-dom";
import SuperAdminSidebar from "../components/SuperAdminSidebar";
import BackButton from "../components/BackButton";

function SuperAdminLayout() {
  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .super-admin-layout {
          min-height: 100vh;
          width: 100%;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .super-admin-main-content {
          margin-left: 285px;
          width: calc(100% - 285px);
          min-height: 100vh;
          background: #f4f7fa;
          overflow-x: hidden;
        }

        .super-admin-back-area {
          padding: 22px 32px 0;
        }

        .super-admin-page-area {
          width: 100%;
          min-width: 0;
        }

        /* ==============================
           COMMON SUPER ADMIN DESIGN
        ============================== */

        .sa-page {
          min-height: 100vh;
          padding: 10px 32px 40px;
          background: #f4f7fa;
          color: #0b2946;
        }

        .sa-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 24px;
        }

        .sa-header h1 {
          margin: 0 0 7px;
          color: #0b2946;
          font-size: 30px;
          font-weight: 800;
          line-height: 1.2;
        }

        .sa-header p {
          margin: 0;
          color: #7b8794;
          font-size: 12px;
          line-height: 1.6;
        }

        .sa-primary-btn {
          border: none;
          background: #f6c20d;
          color: #0b2946;
          padding: 11px 16px;
          border-radius: 7px;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .sa-primary-btn:hover {
          background: #eab600;
        }

        .sa-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .sa-summary-grid.three {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .sa-summary-card {
          background: #ffffff;
          border: 1px solid #e1e7ec;
          border-radius: 10px;
          padding: 19px;
          min-height: 95px;
        }

        .sa-summary-card span {
          display: block;
          color: #87939e;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .4px;
          margin-bottom: 8px;
        }

        .sa-summary-card h2 {
          margin: 0;
          color: #0b2946;
          font-size: 24px;
          line-height: 1;
        }

        .sa-card {
          background: #ffffff;
          border: 1px solid #e2e7ec;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .sa-card h2 {
          margin: 0 0 16px;
          color: #0b2946;
          font-size: 16px;
          line-height: 1.3;
        }

        .sa-card h3 {
          margin: 0 0 10px;
          color: #0b2946;
          font-size: 13px;
        }

        .sa-card p {
          color: #687783;
          font-size: 10px;
          line-height: 1.7;
        }

        .sa-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .sa-input,
        .sa-select {
          min-height: 38px;
          padding: 9px 11px;
          border: 1px solid #d8e0e6;
          background: #ffffff;
          color: #53616e;
          border-radius: 6px;
          outline: none;
          font-size: 10px;
          font-family: Arial, Helvetica, sans-serif;
        }

        .sa-input {
          min-width: 240px;
        }

        .sa-input:focus,
        .sa-select:focus {
          border-color: #f6c20d;
          box-shadow: 0 0 0 2px rgba(246,194,13,.15);
        }

        .sa-table-wrapper {
          width: 100%;
          overflow-x: auto;
          border-radius: 8px;
        }

        .sa-table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
        }

        .sa-table th {
          background: #f3f6f9;
          color: #4d5d6b;
          text-align: left;
          padding: 13px 14px;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .sa-table td {
          padding: 14px;
          border-bottom: 1px solid #edf0f3;
          color: #53616e;
          font-size: 10px;
          vertical-align: middle;
        }

        .sa-table tbody tr:hover {
          background: #fafbfd;
        }

        .sa-id {
          color: #0b2946;
          font-weight: 800;
        }

        .sa-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .sa-btn-view,
        .sa-btn-edit,
        .sa-btn-neutral,
        .sa-btn-danger {
          padding: 7px 10px;
          border-radius: 5px;
          font-size: 8px;
          font-weight: 700;
          cursor: pointer;
        }

        .sa-btn-view {
          border: 1px solid #0b2946;
          background: white;
          color: #0b2946;
        }

        .sa-btn-edit {
          border: none;
          background: #f6c20d;
          color: #0b2946;
        }

        .sa-btn-neutral {
          border: 1px solid #d6dde3;
          background: #f7f9fa;
          color: #53616e;
        }

        .sa-btn-danger {
          border: 1px solid #efcccc;
          background: #fff3f3;
          color: #a62d2d;
        }

        .sa-badge {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 8px;
          font-weight: 800;
          white-space: nowrap;
        }

        .sa-badge.green {
          background: #e3f6e7;
          color: #18763a;
        }

        .sa-badge.blue {
          background: #e4f0fc;
          color: #24649f;
        }

        .sa-badge.red {
          background: #fde6e6;
          color: #a82d2d;
        }

        .sa-badge.yellow {
          background: #fff3cc;
          color: #806300;
        }

        .sa-badge.gray {
          background: #edf1f4;
          color: #66737d;
        }

        .sa-info-box {
          padding: 15px 17px;
          margin-bottom: 20px;
          background: #eef5fb;
          border-left: 4px solid #0b2946;
          border-radius: 7px;
        }

        .sa-info-box strong {
          display: block;
          color: #0b2946;
          font-size: 11px;
          margin-bottom: 4px;
        }

        .sa-info-box p {
          margin: 0;
          color: #627585;
          font-size: 9px;
          line-height: 1.6;
        }

        .sa-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 16px;
        }

        .sa-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 16px;
        }

        .sa-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 15px;
        }

        .sa-field label {
          display: block;
          margin-bottom: 6px;
          color: #0b2946;
          font-size: 9px;
          font-weight: 800;
        }

        .sa-field input,
        .sa-field select,
        .sa-field textarea {
          width: 100%;
          padding: 10px 11px;
          border: 1px solid #d7dfe6;
          border-radius: 6px;
          outline: none;
          color: #53616e;
          background: white;
          font-size: 10px;
          font-family: Arial, Helvetica, sans-serif;
        }

        .sa-field textarea {
          min-height: 90px;
          resize: vertical;
        }

        .sa-field input:focus,
        .sa-field select:focus,
        .sa-field textarea:focus {
          border-color: #f6c20d;
        }

        /* MODAL */

        .sa-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(7,22,36,.58);
        }

        .sa-modal {
          width: 100%;
          max-width: 620px;
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 50px rgba(0,0,0,.22);
        }

        .sa-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 19px 21px;
          border-bottom: 1px solid #e8edf1;
        }

        .sa-modal-header h2 {
          margin: 0;
          color: #0b2946;
          font-size: 18px;
        }

        .sa-close {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 50%;
          background: #eef2f5;
          color: #53616e;
          font-size: 17px;
          cursor: pointer;
        }

        .sa-modal-body {
          padding: 21px;
        }

        .sa-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding: 16px 21px;
          border-top: 1px solid #e8edf1;
        }

        .sa-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 12px;
        }

        .sa-detail {
          padding: 13px;
          background: #f7f9fb;
          border-radius: 7px;
        }

        .sa-detail span {
          display: block;
          color: #8a96a0;
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .sa-detail strong {
          color: #0b2946;
          font-size: 10px;
        }

        @media (max-width: 1100px) {
          .super-admin-main-content {
            margin-left: 250px;
            width: calc(100% - 250px);
          }

          .sa-summary-grid {
            grid-template-columns: repeat(2,1fr);
          }
        }

        @media (max-width: 760px) {
          .super-admin-main-content {
            margin-left: 0;
            width: 100%;
            min-width: 0;
            overflow-x: hidden;
          }

          .super-admin-back-area {
            padding: 72px 16px 0;
          }

          .sa-page {
            padding: 10px 16px 30px;
          }

          .sa-header {
            flex-direction: column;
          }

          .sa-summary-grid,
          .sa-summary-grid.three,
          .sa-grid-2,
          .sa-grid-3,
          .sa-form-grid,
          .sa-detail-grid {
            grid-template-columns: 1fr;
          }

          .sa-input {
            width: 100%;
            min-width: 0;
          }
        }
      `}</style>

      <div className="super-admin-layout">
        <SuperAdminSidebar />

        <main className="super-admin-main-content">
          <div className="super-admin-back-area">
            <BackButton />
          </div>

          <div className="super-admin-page-area">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}

export default SuperAdminLayout;