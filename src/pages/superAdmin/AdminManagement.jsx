import { useState } from "react";

function AdminManagement() {
  const initialAdmins = [
    {
      id: "ADM001",
      name: "Kamal Perera",
      role: "TMS Operator",
      email: "kamal@mmc.lk",
      phone: "0712345678",
      status: "Active",
      createdDate: "2026-08-01",
    },
    {
      id: "ADM002",
      name: "Nimali Silva",
      role: "TMS Operator",
      email: "nimali@mmc.lk",
      phone: "0772222222",
      status: "Active",
      createdDate: "2026-08-05",
    },
    {
      id: "ADM003",
      name: "Saman Fernando",
      role: "TMS Operator",
      email: "saman@mmc.lk",
      phone: "0763333333",
      status: "Inactive",
      createdDate: "2026-08-10",
    },
  ];

  const [admins, setAdmins] = useState(initialAdmins);
  const [search, setSearch] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [modalType, setModalType] = useState(null);

  const [editData, setEditData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
  });

  const filteredAdmins = admins.filter((admin) => {
    const value = search.toLowerCase();

    return (
      admin.id.toLowerCase().includes(value) ||
      admin.name.toLowerCase().includes(value) ||
      admin.email.toLowerCase().includes(value)
    );
  });

  const openViewModal = (admin) => {
    setSelectedAdmin(admin);
    setModalType("view");
  };

  const openEditModal = (admin) => {
    setSelectedAdmin(admin);

    setEditData({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
    });

    setModalType("edit");
  };

  const closeModal = () => {
    setSelectedAdmin(null);
    setModalType(null);
  };

  const handleSave = () => {
    setAdmins(
      admins.map((admin) =>
        admin.id === editData.id
          ? {
              ...admin,
              name: editData.name,
              email: editData.email,
              phone: editData.phone,
            }
          : admin
      )
    );

    closeModal();
  };

  const toggleStatus = (id) => {
    setAdmins(
      admins.map((admin) =>
        admin.id === id
          ? {
              ...admin,
              status:
                admin.status === "Active"
                  ? "Inactive"
                  : "Active",
            }
          : admin
      )
    );
  };

  return (
    <>
      <style>{`
        .admin-page {
          min-height: 100vh;
          padding: 10px 36px 40px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .admin-page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 24px;
        }

        .admin-page-header h1 {
          margin: 0 0 7px;
          color: #0b2946;
          font-size: 30px;
          font-weight: 800;
        }

        .admin-page-header p {
          margin: 0;
          color: #7b8794;
          font-size: 12px;
        }

        .admin-role-badge {
          background: #fff3c4;
          color: #7a5d00;
          border: 1px solid #f4da74;
          padding: 8px 13px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
        }

        .admin-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .admin-summary-card {
          background: white;
          border: 1px solid #e2e8ee;
          border-radius: 10px;
          padding: 20px;
        }

        .admin-summary-card span {
          display: block;
          color: #84909b;
          font-size: 10px;
          font-weight: 700;
          margin-bottom: 7px;
          text-transform: uppercase;
        }

        .admin-summary-card h2 {
          margin: 0;
          color: #0b2946;
          font-size: 25px;
        }

        .admin-info-box {
          margin-bottom: 22px;
          padding: 18px 20px;
          background: #eef5fb;
          border-left: 4px solid #0b2946;
          border-radius: 8px;
        }

        .admin-info-box strong {
          display: block;
          margin-bottom: 5px;
          color: #0b2946;
          font-size: 12px;
        }

        .admin-info-box p {
          margin: 0;
          color: #657685;
          font-size: 10px;
          line-height: 1.6;
        }

        .admin-table-card {
          background: white;
          border: 1px solid #e2e8ee;
          border-radius: 11px;
          overflow: hidden;
        }

        .admin-table-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 18px 20px;
          border-bottom: 1px solid #e9edf1;
        }

        .admin-table-top h2 {
          margin: 0;
          color: #0b2946;
          font-size: 16px;
        }

        .admin-search {
          width: 270px;
          padding: 9px 11px;
          border: 1px solid #d7dfe6;
          border-radius: 6px;
          font-size: 11px;
          outline: none;
        }

        .admin-search:focus {
          border-color: #f6c20d;
        }

        .admin-table-wrapper {
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          min-width: 950px;
          border-collapse: collapse;
        }

        .admin-table th {
          background: #f5f7f9;
          color: #50606f;
          padding: 13px 15px;
          text-align: left;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .admin-table td {
          padding: 14px 15px;
          border-bottom: 1px solid #edf0f3;
          color: #53616e;
          font-size: 10px;
          vertical-align: middle;
        }

        .admin-id {
          color: #0b2946;
          font-weight: 800;
        }

        .admin-role {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #0b2946;
          font-weight: 700;
        }

        .admin-status {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 8px;
          font-weight: 800;
        }

        .admin-status.active {
          background: #e3f6e7;
          color: #18763a;
        }

        .admin-status.inactive {
          background: #fde6e6;
          color: #a82d2d;
        }

        .admin-actions {
          display: flex;
          gap: 6px;
        }

        .admin-actions button {
          padding: 7px 10px;
          border-radius: 5px;
          font-size: 8px;
          font-weight: 700;
          cursor: pointer;
        }

        .admin-view-btn {
          border: 1px solid #0b2946;
          background: white;
          color: #0b2946;
        }

        .admin-edit-btn {
          border: none;
          background: #f6c20d;
          color: #0b2946;
        }

        .admin-disable-btn {
          border: 1px solid #d5dce2;
          background: #f7f9fa;
          color: #53616e;
        }

        .admin-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(7, 22, 36, 0.58);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 9999;
        }

        .admin-modal {
          width: 100%;
          max-width: 590px;
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
        }

        .admin-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 22px;
          border-bottom: 1px solid #e8edf1;
        }

        .admin-modal-header h2 {
          margin: 0;
          color: #0b2946;
          font-size: 19px;
        }

        .admin-modal-close {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 50%;
          background: #eef2f5;
          color: #53616e;
          cursor: pointer;
          font-size: 17px;
        }

        .admin-modal-body {
          padding: 22px;
        }

        .admin-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 13px;
        }

        .admin-detail {
          padding: 13px;
          background: #f7f9fb;
          border-radius: 7px;
        }

        .admin-detail span {
          display: block;
          margin-bottom: 4px;
          color: #8b96a0;
          font-size: 8px;
          text-transform: uppercase;
          font-weight: 700;
        }

        .admin-detail strong {
          color: #0b2946;
          font-size: 11px;
        }

        .admin-permission-section {
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid #edf0f3;
        }

        .admin-permission-section h3 {
          margin: 0 0 5px;
          color: #0b2946;
          font-size: 14px;
        }

        .admin-permission-section > p {
          margin: 0 0 12px;
          color: #7a8792;
          font-size: 9px;
        }

        .permission-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .permission-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 11px;
          background: #f7f9fb;
          border-radius: 6px;
          font-size: 9px;
        }

        .permission-allowed {
          color: #18763a;
          font-weight: 800;
        }

        .permission-denied {
          color: #b23232;
          font-weight: 800;
        }

        .admin-edit-grid {
          display: grid;
          gap: 14px;
        }

        .admin-edit-field label {
          display: block;
          margin-bottom: 6px;
          color: #0b2946;
          font-size: 9px;
          font-weight: 800;
        }

        .admin-edit-field input {
          width: 100%;
          padding: 10px 11px;
          border: 1px solid #d7dfe6;
          border-radius: 6px;
          outline: none;
          color: #53616e;
          font-size: 11px;
        }

        .admin-fixed-field {
          padding: 11px;
          background: #f4f6f8;
          border: 1px solid #e1e6ea;
          border-radius: 6px;
          color: #7c8791;
          font-size: 10px;
        }

        .admin-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding: 16px 22px;
          border-top: 1px solid #e8edf1;
        }

        .admin-cancel-btn,
        .admin-save-btn {
          padding: 9px 15px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 800;
          cursor: pointer;
        }

        .admin-cancel-btn {
          border: 1px solid #d5dde4;
          background: white;
          color: #53616e;
        }

        .admin-save-btn {
          border: none;
          background: #f6c20d;
          color: #0b2946;
        }

        @media(max-width: 800px) {
          .admin-page {
            padding: 10px 20px 30px;
          }

          .admin-summary-grid,
          .admin-detail-grid,
          .permission-grid {
            grid-template-columns: 1fr;
          }

          .admin-page-header,
          .admin-table-top {
            flex-direction: column;
            align-items: flex-start;
          }

          .admin-search {
            width: 100%;
          }
        }
      `}</style>

      <main className="admin-page">

        <div className="admin-page-header">
          <div>
            <h1>Admin Management</h1>
            <p>
              Manage MMC Taxi Service TMS Operator accounts.
            </p>
          </div>

          <span className="admin-role-badge">
            🔒 Protected Role
          </span>
        </div>

        <div className="admin-summary-grid">
          <div className="admin-summary-card">
            <span>Total Admins</span>
            <h2>{admins.length}</h2>
          </div>

          <div className="admin-summary-card">
            <span>Active Accounts</span>
            <h2>
              {
                admins.filter(
                  (admin) => admin.status === "Active"
                ).length
              }
            </h2>
          </div>

          <div className="admin-summary-card">
            <span>Inactive Accounts</span>
            <h2>
              {
                admins.filter(
                  (admin) => admin.status === "Inactive"
                ).length
              }
            </h2>
          </div>
        </div>

        <div className="admin-info-box">
          <strong>🔒 TMS Operator Role</strong>

          <p>
            Admin/TMS Operator accounts have protected permissions.
            They cannot change their own role, permissions or Super
            Admin system settings.
          </p>
        </div>

        <section className="admin-table-card">

          <div className="admin-table-top">
            <h2>Admin Accounts</h2>

            <input
              className="admin-search"
              type="text"
              placeholder="Search admin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Admin ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id}>
                    <td className="admin-id">
                      {admin.id}
                    </td>

                    <td>{admin.name}</td>

                    <td>
                      <span className="admin-role">
                        🔒 {admin.role}
                      </span>
                    </td>

                    <td>{admin.email}</td>

                    <td>{admin.phone}</td>

                    <td>
                      <span
                        className={`admin-status ${admin.status.toLowerCase()}`}
                      >
                        {admin.status}
                      </span>
                    </td>

                    <td>{admin.createdDate}</td>

                    <td>
                      <div className="admin-actions">

                        <button
                          className="admin-view-btn"
                          onClick={() =>
                            openViewModal(admin)
                          }
                        >
                          View
                        </button>

                        <button
                          className="admin-edit-btn"
                          onClick={() =>
                            openEditModal(admin)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="admin-disable-btn"
                          onClick={() =>
                            toggleStatus(admin.id)
                          }
                        >
                          {admin.status === "Active"
                            ? "Disable"
                            : "Enable"}
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </section>

        {modalType === "view" && selectedAdmin && (
          <div className="admin-modal-overlay">

            <div className="admin-modal">

              <div className="admin-modal-header">
                <h2>Admin Details</h2>

                <button
                  className="admin-modal-close"
                  onClick={closeModal}
                >
                  ×
                </button>
              </div>

              <div className="admin-modal-body">

                <div className="admin-detail-grid">

                  <div className="admin-detail">
                    <span>Admin ID</span>
                    <strong>{selectedAdmin.id}</strong>
                  </div>

                  <div className="admin-detail">
                    <span>Full Name</span>
                    <strong>{selectedAdmin.name}</strong>
                  </div>

                  <div className="admin-detail">
                    <span>Email</span>
                    <strong>{selectedAdmin.email}</strong>
                  </div>

                  <div className="admin-detail">
                    <span>Phone</span>
                    <strong>{selectedAdmin.phone}</strong>
                  </div>

                  <div className="admin-detail">
                    <span>Role</span>
                    <strong>
                      🔒 {selectedAdmin.role}
                    </strong>
                  </div>

                  <div className="admin-detail">
                    <span>Status</span>
                    <strong>
                      {selectedAdmin.status}
                    </strong>
                  </div>

                </div>

                <div className="admin-permission-section">
                  <h3>Assigned Permissions</h3>

                  <p>
                    Managed through Super Admin Roles &
                    Permissions.
                  </p>

                  <div className="permission-grid">

                    <div className="permission-item">
                      Dashboard Access
                      <span className="permission-allowed">
                        ✓ Allowed
                      </span>
                    </div>

                    <div className="permission-item">
                      Driver Management
                      <span className="permission-allowed">
                        ✓ Allowed
                      </span>
                    </div>

                    <div className="permission-item">
                      Vehicle Monitoring
                      <span className="permission-allowed">
                        ✓ Allowed
                      </span>
                    </div>

                    <div className="permission-item">
                      Booking Monitoring
                      <span className="permission-allowed">
                        ✓ Allowed
                      </span>
                    </div>

                    <div className="permission-item">
                      Reports
                      <span className="permission-allowed">
                        ✓ Allowed
                      </span>
                    </div>

                    <div className="permission-item">
                      Change Own Role
                      <span className="permission-denied">
                        ✕ Not Allowed
                      </span>
                    </div>

                    <div className="permission-item">
                      Change Own Permissions
                      <span className="permission-denied">
                        ✕ Not Allowed
                      </span>
                    </div>

                    <div className="permission-item">
                      Super Admin Settings
                      <span className="permission-denied">
                        ✕ Not Allowed
                      </span>
                    </div>

                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {modalType === "edit" && selectedAdmin && (
          <div className="admin-modal-overlay">

            <div className="admin-modal">

              <div className="admin-modal-header">
                <h2>Edit Admin</h2>

                <button
                  className="admin-modal-close"
                  onClick={closeModal}
                >
                  ×
                </button>
              </div>

              <div className="admin-modal-body">

                <div className="admin-edit-grid">

                  <div className="admin-edit-field">
                    <label>Admin ID</label>

                    <div className="admin-fixed-field">
                      {editData.id}
                    </div>
                  </div>

                  <div className="admin-edit-field">
                    <label>Full Name</label>

                    <input
                      value={editData.name}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="admin-edit-field">
                    <label>Email Address</label>

                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="admin-edit-field">
                    <label>Phone Number</label>

                    <input
                      value={editData.phone}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="admin-edit-field">
                    <label>Role</label>

                    <div className="admin-fixed-field">
                      🔒 TMS Operator
                    </div>
                  </div>

                </div>

              </div>

              <div className="admin-modal-footer">

                <button
                  className="admin-cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  className="admin-save-btn"
                  onClick={handleSave}
                >
                  Save Changes
                </button>

              </div>

            </div>

          </div>
        )}

      </main>
    </>
  );
}

export default AdminManagement;