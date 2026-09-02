import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://localhost:5171/api";

function RolesPermissions() {
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedRoleName, setSelectedRoleName] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);

  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // GET TOKEN
  // =========================================================
  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("token")
    );
  };

  // =========================================================
  // ROLE DISPLAY NAME
  // =========================================================
  const getRoleDisplayName = (roleName) => {
    switch (roleName) {
      case "SUPER_ADMIN":
        return "Super Admin";

      case "ADMIN":
        return "Admin";

      case "TAXI_OPERATIONS":
        return "Taxi Operator";

      case "DRIVER":
        return "Driver";

      case "PASSENGER":
        return "Passenger";

      default:
        return roleName;
    }
  };

  // =========================================================
  // PERMISSION DISPLAY NAME
  // =========================================================
  const getPermissionDisplayName = (permissionName) => {
    return permissionName
      .toLowerCase()
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  };

  // =========================================================
  // GET ROLES
  // =========================================================
  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Login token not found. Please login again."
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/roles`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const raw = await response.text();

      let data = [];

      try {
        data = raw ? JSON.parse(raw) : [];
      } catch {
        throw new Error(
          raw || "Unable to load roles."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load system roles."
        );
      }

      const roleList = Array.isArray(data)
        ? data
        : data.roles || data.data || [];

      const normalizedRoles = roleList.map(
        (role) => ({
          roleId:
            role.roleId ??
            role.RoleId ??
            role.id ??
            role.Id,

          roleName:
            role.roleName ??
            role.RoleName ??
            role.name ??
            role.Name,
        })
      );

      const allowedRoles = normalizedRoles.filter(
        (role) =>
          role.roleName === "SUPER_ADMIN" ||
          role.roleName === "ADMIN" ||
          role.roleName === "TAXI_OPERATIONS" ||
          role.roleName === "DRIVER" ||
          role.roleName === "PASSENGER"
      );

      const roleOrder = [
        "SUPER_ADMIN",
        "ADMIN",
        "TAXI_OPERATIONS",
        "DRIVER",
        "PASSENGER",
      ];

      allowedRoles.sort(
        (a, b) =>
          roleOrder.indexOf(a.roleName) -
          roleOrder.indexOf(b.roleName)
      );

      setRoles(allowedRoles);

      const adminRole =
        allowedRoles.find(
          (role) => role.roleName === "ADMIN"
        ) ||
        allowedRoles.find(
          (role) =>
            role.roleName !== "SUPER_ADMIN"
        );

      if (adminRole) {
        setSelectedRoleId(adminRole.roleId);
        setSelectedRoleName(adminRole.roleName);
      }
    } catch (err) {
      setError(
        err.message ||
          "Unable to load roles."
      );
    } finally {
      setLoadingRoles(false);
    }
  };

  // =========================================================
  // GET ROLE PERMISSION MATRIX
  // =========================================================
  const fetchRolePermissions = async (
    roleId,
    roleName
  ) => {
    if (!roleId) return;

    try {
      setLoadingPermissions(true);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Login token not found. Please login again."
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/permissions/role/${roleId}/matrix`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const raw = await response.text();

      let data = {};

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(
          raw ||
            "Unable to load role permissions."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load role permissions."
        );
      }

      const permissionList = Array.isArray(data)
        ? data
        : data.permissions ||
          data.matrix ||
          data.data ||
          [];

      const normalizedPermissions =
        permissionList.map((permission) => ({
          permissionId:
            permission.permissionId ??
            permission.PermissionId ??
            permission.id ??
            permission.Id,

          permissionName:
            permission.permissionName ??
            permission.PermissionName ??
            permission.name ??
            permission.Name,

          description:
            permission.description ??
            permission.Description ??
            "",

          assigned:
            permission.assigned ??
            permission.Assigned ??
            permission.isAssigned ??
            permission.IsAssigned ??
            permission.hasPermission ??
            permission.HasPermission ??
            false,
        }));

      setPermissions(normalizedPermissions);

      if (roleName === "SUPER_ADMIN") {
        setSelectedPermissionIds(
          normalizedPermissions.map(
            (permission) =>
              permission.permissionId
          )
        );
      } else {
        setSelectedPermissionIds(
          normalizedPermissions
            .filter(
              (permission) =>
                permission.assigned === true
            )
            .map(
              (permission) =>
                permission.permissionId
            )
        );
      }
    } catch (err) {
      setError(
        err.message ||
          "Unable to load role permissions."
      );
    } finally {
      setLoadingPermissions(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================
  useEffect(() => {
    fetchRoles();
  }, []);

  // =========================================================
  // LOAD PERMISSIONS WHEN ROLE CHANGES
  // =========================================================
  useEffect(() => {
    if (selectedRoleId && selectedRoleName) {
      fetchRolePermissions(
        selectedRoleId,
        selectedRoleName
      );
    }
  }, [selectedRoleId, selectedRoleName]);

  // =========================================================
  // SELECT ROLE
  // =========================================================
  const selectRole = (role) => {
    setSelectedRoleId(role.roleId);
    setSelectedRoleName(role.roleName);
    setSuccess("");
    setError("");
  };

  // =========================================================
  // TOGGLE PERMISSION
  // =========================================================
  const togglePermission = (permissionId) => {
    if (
      selectedRoleName === "SUPER_ADMIN"
    ) {
      return;
    }

    setSelectedPermissionIds(
      (currentPermissions) => {
        if (
          currentPermissions.includes(
            permissionId
          )
        ) {
          return currentPermissions.filter(
            (id) => id !== permissionId
          );
        }

        return [
          ...currentPermissions,
          permissionId,
        ];
      }
    );

    setSuccess("");
  };

  // =========================================================
  // SELECT ALL
  // =========================================================
  const selectAllPermissions = () => {
    if (
      selectedRoleName === "SUPER_ADMIN"
    ) {
      return;
    }

    setSelectedPermissionIds(
      permissions.map(
        (permission) =>
          permission.permissionId
      )
    );

    setSuccess("");
  };

  // =========================================================
  // CLEAR ALL
  // =========================================================
  const clearAllPermissions = () => {
    if (
      selectedRoleName === "SUPER_ADMIN"
    ) {
      return;
    }

    setSelectedPermissionIds([]);
    setSuccess("");
  };

  // =========================================================
  // SAVE PERMISSIONS
  // =========================================================
  const savePermissions = async () => {
    if (!selectedRoleId) {
      setError(
        "Please select a role first."
      );
      return;
    }

    if (
      selectedRoleName === "SUPER_ADMIN"
    ) {
      setError(
        "Super Admin permissions are protected and cannot be changed."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Login token not found. Please login again."
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/permissions/role/${selectedRoleId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            permissionIds:
              selectedPermissionIds,
          }),
        }
      );

      const raw = await response.text();

      let data = {};

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {
          message: raw,
        };
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            raw ||
            "Unable to save permissions."
        );
      }

      setSuccess(
        `${getRoleDisplayName(
          selectedRoleName
        )} permissions saved successfully.`
      );

      await fetchRolePermissions(
        selectedRoleId,
        selectedRoleName
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to save permissions."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // GROUP PERMISSIONS
  // =========================================================
  const groupedPermissions = useMemo(() => {
    const groups = {
      Users: [],
      Drivers: [],
      Vehicles: [],
      Bookings: [],
      Trips: [],
      Payments: [],
      Ratings: [],
      Notifications: [],
      Reports: [],
      Security: [],
      System: [],
      Other: [],
    };

    permissions.forEach((permission) => {
      const name =
        permission.permissionName || "";

      if (
        name.includes("USER") ||
        name.includes("ROLE")
      ) {
        groups.Users.push(permission);
      } else if (
        name.includes("DRIVER") &&
        !name.includes("LOCATION")
      ) {
        groups.Drivers.push(permission);
      } else if (
        name.includes("VEHICLE")
      ) {
        groups.Vehicles.push(permission);
      } else if (
        name.includes("BOOKING")
      ) {
        groups.Bookings.push(permission);
      } else if (
        name.includes("TRIP") ||
        name.includes("LOCATION")
      ) {
        groups.Trips.push(permission);
      } else if (
        name.includes("PAYMENT")
      ) {
        groups.Payments.push(permission);
      } else if (
        name.includes("RATING")
      ) {
        groups.Ratings.push(permission);
      } else if (
        name.includes("NOTIFICATION")
      ) {
        groups.Notifications.push(
          permission
        );
      } else if (
        name.includes("REPORT") ||
        name.includes("ACTIVITY")
      ) {
        groups.Reports.push(permission);
      } else if (
        name.includes("PERMISSION")
      ) {
        groups.Security.push(permission);
      } else if (
        name.includes("SYSTEM")
      ) {
        groups.System.push(permission);
      } else {
        groups.Other.push(permission);
      }
    });

    return groups;
  }, [permissions]);

  // =========================================================
  // UI
  // =========================================================
  return (
    <main className="sa-page roles-page">
      <div className="sa-header roles-header">
        <div>
          <h1>Roles & Permissions</h1>

          <p>
            Manage system access permissions for
            each user role.
          </p>
        </div>

        <button
          className="roles-save-btn"
          onClick={savePermissions}
          disabled={
            saving ||
            selectedRoleName ===
              "SUPER_ADMIN" ||
            loadingPermissions
          }
        >
          {saving
            ? "Saving..."
            : "Save Permissions"}
        </button>
      </div>

      <div className="roles-security-box">
        <div className="roles-security-icon">
          🔒
        </div>

        <div>
          <strong>
            Protected Security Rules
          </strong>

          <p>
            Super Admin has full system
            access and its permissions cannot
            be removed. Only Super Admin can
            modify other role permissions.
          </p>
        </div>
      </div>

      {error && (
        <div className="roles-message roles-error">
          {error}
        </div>
      )}

      {success && (
        <div className="roles-message roles-success">
          {success}
        </div>
      )}

      <section className="roles-layout">
        <aside className="roles-sidebar">
          <div className="roles-sidebar-title">
            System Roles
          </div>

          {loadingRoles ? (
            <div className="roles-loading">
              Loading roles...
            </div>
          ) : (
            roles.map((role) => {
              const isSelected =
                selectedRoleId ===
                role.roleId;

              return (
                <button
                  key={role.roleId}
                  type="button"
                  className={`roles-role-btn ${
                    isSelected
                      ? "roles-role-active"
                      : ""
                  }`}
                  onClick={() =>
                    selectRole(role)
                  }
                >
                  <div className="roles-role-icon">
                    {role.roleName ===
                    "SUPER_ADMIN"
                      ? "👑"
                      : role.roleName ===
                        "ADMIN"
                      ? "🛡️"
                      : role.roleName ===
                        "TAXI_OPERATIONS"
                      ? "🚕"
                      : role.roleName ===
                        "DRIVER"
                      ? "🚗"
                      : "👤"}
                  </div>

                  <div className="roles-role-info">
                    <strong>
                      {getRoleDisplayName(
                        role.roleName
                      )}
                    </strong>

                    <span>
                      {role.roleName ===
                      "SUPER_ADMIN"
                        ? "Full system control"
                        : role.roleName ===
                          "ADMIN"
                        ? "Administrative access"
                        : role.roleName ===
                          "TAXI_OPERATIONS"
                        ? "Daily taxi operations"
                        : role.roleName ===
                          "DRIVER"
                        ? "Driver functions"
                        : "Passenger functions"}
                    </span>
                  </div>

                  {role.roleName ===
                    "SUPER_ADMIN" && (
                    <span className="roles-lock">
                      🔒
                    </span>
                  )}
                </button>
              );
            })
          )}
        </aside>

        <section className="roles-content">
          <div className="roles-content-header">
            <div>
              <h2>
                {selectedRoleName
                  ? getRoleDisplayName(
                      selectedRoleName
                    )
                  : "Select Role"}
              </h2>

              <p>
                {selectedRoleName ===
                "SUPER_ADMIN"
                  ? "Super Admin permissions are permanently protected."
                  : "Select the permissions available to this role."}
              </p>
            </div>

            {selectedRoleName &&
              selectedRoleName !==
                "SUPER_ADMIN" && (
                <div className="roles-actions">
                  <button
                    type="button"
                    onClick={
                      selectAllPermissions
                    }
                    className="roles-secondary-btn"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={
                      clearAllPermissions
                    }
                    className="roles-secondary-btn"
                  >
                    Clear All
                  </button>
                </div>
              )}
          </div>

          <div className="roles-count-bar">
            <span>
              Selected Permissions
            </span>

            <strong>
              {
                selectedPermissionIds.length
              }{" "}
              / {permissions.length}
            </strong>
          </div>

          {loadingPermissions ? (
            <div className="roles-main-loading">
              Loading permissions...
            </div>
          ) : (
            <div className="roles-groups">
              {Object.entries(
                groupedPermissions
              ).map(
                ([
                  groupName,
                  groupPermissions,
                ]) => {
                  if (
                    groupPermissions.length ===
                    0
                  ) {
                    return null;
                  }

                  return (
                    <div
                      className="roles-group-card"
                      key={groupName}
                    >
                      <h3>
                        {groupName}
                      </h3>

                      <div className="roles-permission-list">
                        {groupPermissions.map(
                          (permission) => {
                            const checked =
                              selectedPermissionIds.includes(
                                permission.permissionId
                              );

                            const locked =
                              selectedRoleName ===
                              "SUPER_ADMIN";

                            return (
                              <label
                                className={`roles-permission-row ${
                                  checked
                                    ? "roles-permission-selected"
                                    : ""
                                }`}
                                key={
                                  permission.permissionId
                                }
                              >
                                <div className="roles-permission-text">
                                  <strong>
                                    {getPermissionDisplayName(
                                      permission.permissionName
                                    )}
                                  </strong>

                                  <span>
                                    {permission.description ||
                                      permission.permissionName}
                                  </span>
                                </div>

                                <input
                                  type="checkbox"
                                  checked={
                                    locked
                                      ? true
                                      : checked
                                  }
                                  disabled={
                                    locked
                                  }
                                  onChange={() =>
                                    togglePermission(
                                      permission.permissionId
                                    )
                                  }
                                />
                              </label>
                            );
                          }
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>
      </section>

      <style>{`
        .roles-page {
          padding-bottom: 40px;
        }

        .roles-header {
          align-items: center;
        }

        .roles-save-btn {
          border: none;
          background: #f6c20d;
          color: #0b2946;
          padding: 11px 20px;
          border-radius: 7px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          min-width: 155px;
        }

        .roles-save-btn:hover:not(:disabled) {
          opacity: 0.9;
        }

        .roles-save-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .roles-security-box {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          background: #fff8dd;
          border: 1px solid #f3d76b;
          border-radius: 10px;
          padding: 16px;
          margin: 18px 0;
        }

        .roles-security-icon {
          font-size: 19px;
        }

        .roles-security-box strong {
          display: block;
          color: #0b2946;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .roles-security-box p {
          margin: 0;
          color: #677685;
          font-size: 12px;
          line-height: 1.6;
        }

        .roles-message {
          padding: 12px 15px;
          border-radius: 7px;
          font-size: 12px;
          margin-bottom: 15px;
        }

        .roles-error {
          background: #fff0f0;
          border: 1px solid #f3b7b7;
          color: #b42318;
        }

        .roles-success {
          background: #ecfdf3;
          border: 1px solid #a6e7bc;
          color: #147a40;
        }

        .roles-layout {
          display: grid;
          grid-template-columns: 250px minmax(0, 1fr);
          gap: 18px;
          align-items: start;
        }

        .roles-sidebar {
          background: #ffffff;
          border: 1px solid #e2e8ee;
          border-radius: 10px;
          padding: 12px;
        }

        .roles-sidebar-title {
          color: #0b2946;
          font-size: 12px;
          font-weight: 800;
          padding: 5px 7px 12px;
        }

        .roles-role-btn {
          width: 100%;
          border: 1px solid transparent;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
          padding: 11px 9px;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 5px;
        }

        .roles-role-btn:hover {
          background: #f7f9fb;
        }

        .roles-role-active {
          background: #f1f5f8;
          border-color: #d6e0e7;
        }

        .roles-role-icon {
          width: 34px;
          height: 34px;
          background: #f5f7f9;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .roles-role-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }

        .roles-role-info strong {
          color: #0b2946;
          font-size: 11px;
        }

        .roles-role-info span {
          color: #84909b;
          font-size: 9px;
          margin-top: 3px;
        }

        .roles-lock {
          font-size: 11px;
        }

        .roles-content {
          background: #ffffff;
          border: 1px solid #e2e8ee;
          border-radius: 10px;
          padding: 18px;
          min-width: 0;
        }

        .roles-content-header {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          align-items: flex-start;
          padding-bottom: 15px;
          border-bottom: 1px solid #edf1f4;
        }

        .roles-content-header h2 {
          margin: 0;
          color: #0b2946;
          font-size: 18px;
        }

        .roles-content-header p {
          margin: 5px 0 0;
          color: #84909b;
          font-size: 11px;
        }

        .roles-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .roles-secondary-btn {
          border: 1px solid #ccd6de;
          background: #ffffff;
          color: #0b2946;
          padding: 7px 11px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .roles-secondary-btn:hover {
          background: #f7f9fb;
        }

        .roles-count-bar {
          display: flex;
          justify-content: space-between;
          background: #f7f9fb;
          border-radius: 7px;
          padding: 10px 12px;
          margin: 15px 0;
          font-size: 11px;
          color: #657381;
        }

        .roles-count-bar strong {
          color: #0b2946;
        }

        .roles-groups {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .roles-group-card {
          border: 1px solid #e3e9ee;
          border-radius: 9px;
          overflow: hidden;
        }

        .roles-group-card h3 {
          background: #f7f9fb;
          margin: 0;
          padding: 10px 12px;
          color: #0b2946;
          font-size: 11px;
          border-bottom: 1px solid #e3e9ee;
        }

        .roles-permission-list {
          padding: 4px 11px;
        }

        .roles-permission-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 10px 4px;
          border-bottom: 1px solid #edf1f4;
          cursor: pointer;
        }

        .roles-permission-row:last-child {
          border-bottom: none;
        }

        .roles-permission-selected {
          background: #fbfcfd;
        }

        .roles-permission-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .roles-permission-text strong {
          color: #0b2946;
          font-size: 10px;
        }

        .roles-permission-text span {
          color: #89949e;
          font-size: 8px;
          margin-top: 3px;
          line-height: 1.4;
        }

        .roles-permission-row input {
          width: 16px;
          height: 16px;
          accent-color: #f6c20d;
          flex-shrink: 0;
          cursor: pointer;
        }

        .roles-loading,
        .roles-main-loading {
          color: #85919c;
          font-size: 11px;
          padding: 20px;
          text-align: center;
        }

        @media (max-width: 900px) {
          .roles-layout {
            grid-template-columns: 1fr;
          }

          .roles-groups {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .roles-content-header {
            flex-direction: column;
          }

          .roles-save-btn {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

export default RolesPermissions;