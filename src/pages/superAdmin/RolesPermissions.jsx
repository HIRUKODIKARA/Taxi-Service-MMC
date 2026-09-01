import { useState } from "react";

function RolesPermissions() {
  const [permissions, setPermissions] = useState({
    adminDashboard: true,
    adminDrivers: true,
    adminVehicles: true,
    adminBookings: true,
    adminReports: true,
    operationsBookings: true,
    operationsDrivers: true,
    operationsVehicles: true,
    passengerBooking: true,
    driverTrips: true,
  });

  const toggle = (name) => {
    setPermissions({
      ...permissions,
      [name]: !permissions[name],
    });
  };

  const PermissionRow = ({ label, name, locked = false }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        padding: "12px 0",
        borderBottom: "1px solid #edf0f3",
      }}
    >
      <div>
        <strong style={{ fontSize: "10px", color: "#0b2946" }}>
          {label}
        </strong>

        {locked && (
          <div
            style={{
              marginTop: "4px",
              fontSize: "8px",
              color: "#8a96a0",
            }}
          >
            Protected permission
          </div>
        )}
      </div>

      <input
        type="checkbox"
        checked={locked ? true : permissions[name]}
        disabled={locked}
        onChange={() => !locked && toggle(name)}
      />
    </div>
  );

  return (
    <main className="sa-page">
      <div className="sa-header">
        <div>
          <h1>Roles & Permissions</h1>
          <p>Control access permissions for system user roles.</p>
        </div>

        <button
          className="sa-primary-btn"
          onClick={() => alert("Permissions saved in frontend demo.")}
        >
          Save Permissions
        </button>
      </div>

      <div className="sa-info-box">
        <strong>Protected Security Rules</strong>
        <p>
          Super Admin access and protected account restrictions cannot be
          removed by normal Admin/TMS Operator accounts.
        </p>
      </div>

      <div className="sa-grid-2">
        <section className="sa-card">
          <h2>Super Admin</h2>

          <PermissionRow label="Full System Access" locked />
          <PermissionRow label="Manage Roles & Permissions" locked />
          <PermissionRow label="System Settings" locked />
          <PermissionRow label="Reports & Activity Monitoring" locked />
        </section>

        <section className="sa-card">
          <h2>Admin / TMS Operator</h2>

          <PermissionRow
            label="Dashboard Access"
            name="adminDashboard"
          />

          <PermissionRow
            label="Driver Management"
            name="adminDrivers"
          />

          <PermissionRow
            label="Vehicle Monitoring"
            name="adminVehicles"
          />

          <PermissionRow
            label="Booking Monitoring"
            name="adminBookings"
          />

          <PermissionRow
            label="Reports"
            name="adminReports"
          />

          <PermissionRow
            label="Change Own Role"
            locked
          />
        </section>

        <section className="sa-card">
          <h2>Taxi Operations</h2>

          <PermissionRow
            label="Manage Bookings"
            name="operationsBookings"
          />

          <PermissionRow
            label="Monitor Drivers"
            name="operationsDrivers"
          />

          <PermissionRow
            label="Monitor Vehicles"
            name="operationsVehicles"
          />
        </section>

        <section className="sa-card">
          <h2>Passenger & Driver</h2>

          <PermissionRow
            label="Passenger Booking Access"
            name="passengerBooking"
          />

          <PermissionRow
            label="Driver Trip Management"
            name="driverTrips"
          />
        </section>
      </div>
    </main>
  );
}

export default RolesPermissions;