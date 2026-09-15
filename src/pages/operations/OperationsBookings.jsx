import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "/api";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("authToken") ||
  sessionStorage.getItem("accessToken") ||
  "";

const authHeaders = () => {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
};

const safeJson = async (response) => {
  const raw = await response.text();

  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
};

const formatText = (value) =>
  (value ?? "—")
    .toString()
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

function OperationsBookings() {
  const [bookings, setBookings] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [operatorAreas, setOperatorAreas] = useState([]);

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selected, setSelected] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);

  // =========================================================
  // LOAD DATA
  // =========================================================

  const loadData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError("");
      }

      const [bRes, tRes, aRes] = await Promise.all([
        fetch(`${API_BASE_URL}/bookings`, {
          headers: authHeaders(),
        }),

        fetch(`${API_BASE_URL}/vehicletypes/all`, {
          headers: authHeaders(),
        }),

        fetch(
          `${API_BASE_URL}/TaxiOperatorOperationalAreas/my-areas`,
          {
            headers: authHeaders(),
          }
        ),
      ]);

      const [bData, tData, aData] = await Promise.all([
        safeJson(bRes),
        safeJson(tRes),
        safeJson(aRes),
      ]);

      if (!bRes.ok) {
        throw new Error(
          bData?.message || "Unable to load bookings."
        );
      }

      if (!aRes.ok) {
        throw new Error(
          aData?.message ||
            "Unable to load assigned operational areas."
        );
      }

      setBookings(
        Array.isArray(bData) ? bData : []
      );

      setVehicleTypes(
        tRes.ok && Array.isArray(tData)
          ? tData
          : []
      );

      setOperatorAreas(
        Array.isArray(aData) ? aData : []
      );
    } catch (e) {
      if (!silent) {
        setError(
          e.message ||
            "Unable to load booking management."
        );
      } else {
        console.error(
          "Auto refresh failed:",
          e
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData(false);

    const intervalId = setInterval(() => {
      loadData(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================

  const typeName = (id) =>
    vehicleTypes.find(
      (t) =>
        Number(t.vehicleTypeId) === Number(id)
    )?.typeName || `Type #${id ?? "—"}`;

  const areaName = (id) =>
    operatorAreas.find(
      (a) =>
        Number(a.operationalAreaId) ===
        Number(id)
    )?.areaName || `Area #${id ?? "—"}`;

  // =========================================================
  // OPERATOR AREA SCOPE
  // =========================================================

  const scopedBookings = useMemo(() => {
    const myAreaIds = new Set(
      operatorAreas.map((a) =>
        Number(a.operationalAreaId)
      )
    );

    return bookings.filter((b) => {
      if (
        b.operationalAreaId === null ||
        b.operationalAreaId === undefined ||
        b.operationalAreaId === ""
      ) {
        return true;
      }

      return myAreaIds.has(
        Number(b.operationalAreaId)
      );
    });
  }, [bookings, operatorAreas]);

  // =========================================================
  // FILTER
  // =========================================================

  const filtered = useMemo(() => {
    return scopedBookings.filter((b) => {
      const q = search
        .trim()
        .toLowerCase();

      const searchOk =
        !q ||
        [
          b.bookingId,
          b.passengerName,
          b.passengerPhone,
          b.pickupLocation,
          b.destination,
          b.operationalAreaId
            ? areaName(b.operationalAreaId)
            : "MMC",
        ].some((x) =>
          (x ?? "")
            .toString()
            .toLowerCase()
            .includes(q)
        );

      const sourceOk =
        sourceFilter === "ALL" ||
        b.bookingSource === sourceFilter;

      const statusOk =
        statusFilter === "ALL" ||
        b.bookingStatus === statusFilter;

      return (
        searchOk &&
        sourceOk &&
        statusOk
      );
    });
  }, [
    scopedBookings,
    search,
    sourceFilter,
    statusFilter,
    operatorAreas,
  ]);

  // =========================================================
  // OPEN BOOKING
  // =========================================================

  const openBooking = (booking) => {
    setSelected(booking);
    setError("");
    setMessage("");
  };

  // =========================================================
  // SEND BOOKING TO AVAILABLE DRIVERS
  // =========================================================

  const sendToDrivers = async (booking) => {
    if (!booking) return;

    const confirmed = window.confirm(
      `Send booking BK${String(
        booking.bookingId
      ).padStart(
        4,
        "0"
      )} to all matching available drivers?`
    );

    if (!confirmed) return;

    try {
      setSendingId(booking.bookingId);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}/bookings/${booking.bookingId}/send-to-drivers`,
        {
          method: "PUT",
          headers: authHeaders(),
        }
      );

      const data = await safeJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to send booking to drivers."
        );
      }

      setMessage(
        data?.message ||
          `Booking BK${String(
            booking.bookingId
          ).padStart(
            4,
            "0"
          )} sent to available drivers successfully.`
      );

      setSelected(null);

      await loadData(false);
    } catch (e) {
      setError(
        e.message ||
          "Unable to send booking to drivers."
      );
    } finally {
      setSendingId(null);
    }
  };

  // =========================================================
  // COUNTS
  // =========================================================

  const pendingCount =
    scopedBookings.filter(
      (b) => b.bookingStatus === "PENDING"
    ).length;

  const waitingCount =
    scopedBookings.filter(
      (b) =>
        b.bookingStatus ===
        "WAITING_FOR_DRIVER"
    ).length;

  const onRideCount =
    scopedBookings.filter(
      (b) => b.bookingStatus === "ON_RIDE"
    ).length;

  const completedCount =
    scopedBookings.filter(
      (b) =>
        b.bookingStatus === "COMPLETED"
    ).length;

  return (
    <>
      <style>{`
        .ob-page {
          padding: 30px;
          min-height: 100vh;
          background: #f4f7fa;
          font-family: Arial, sans-serif;
          color: #0b2946;
          box-sizing: border-box;
        }

        .ob-head {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .ob-head h1 {
          margin: 0 0 6px;
          font-size: 28px;
        }

        .ob-head p {
          margin: 0;
          color: #7b8794;
          font-size: 12px;
          line-height: 1.6;
        }

        .ob-btn {
          border: none;
          background: #0b2946;
          color: white;
          padding: 10px 14px;
          border-radius: 6px;
          font-weight: 700;
          cursor: pointer;
        }

        .ob-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 18px;
        }

        .ob-card {
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 9px;
          padding: 18px;
        }

        .ob-card span {
          font-size: 9px;
          color: #89949e;
          font-weight: 700;
        }

        .ob-card h2 {
          margin: 6px 0 0;
        }

        .ob-panel {
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 10px;
          padding: 18px;
        }

        .ob-tools {
          display: grid;
          grid-template-columns:
            1fr 180px 180px;
          gap: 10px;
          margin-bottom: 15px;
        }

        .ob-tools input,
        .ob-tools select {
          padding: 10px;
          border: 1px solid #d8e0e6;
          border-radius: 6px;
          background: white;
        }

        .ob-wrap {
          overflow-x: auto;
        }

        .ob-table {
          width: 100%;
          min-width: 1100px;
          border-collapse: collapse;
        }

        .ob-table th {
          background: #f5f7f9;
          padding: 11px;
          text-align: left;
          font-size: 9px;
        }

        .ob-table td {
          padding: 12px 11px;
          border-bottom: 1px solid #edf0f3;
          font-size: 10px;
          vertical-align: middle;
        }

        .ob-tag {
          display: inline-block;
          padding: 5px 8px;
          border-radius: 20px;
          background: #eef3f7;
          font-size: 8px;
          font-weight: 800;
        }

        .ob-tag.pending {
          background: #fff3cd;
          color: #806000;
        }

        .ob-tag.waiting {
          background: #e8f1ff;
          color: #245ca6;
        }

        .ob-tag.accepted {
          background: #e8f6ed;
          color: #18763a;
        }

        .ob-view {
          border: 1px solid #0b2946;
          background: white;
          color: #0b2946;
          padding: 7px 10px;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 700;
        }

        .ob-send-small {
          margin-left: 5px;
          border: none;
          background: #f6c20d;
          color: #0b2946;
          padding: 8px 10px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 9px;
          font-weight: 800;
          white-space: nowrap;
        }

        .ob-send-small:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ob-msg,
        .ob-err {
          padding: 11px 13px;
          border-radius: 7px;
          margin-bottom: 14px;
          font-size: 10px;
        }

        .ob-msg {
          background: #edf9f0;
          color: #276638;
          border: 1px solid #d3edda;
        }

        .ob-err {
          background: #fff1f1;
          color: #a63737;
          border: 1px solid #f0cccc;
        }

        .ob-overlay {
          position: fixed;
          inset: 0;
          background: rgba(4, 19, 33, .68);
          z-index: 5000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .ob-modal {
          width: 100%;
          max-width: 680px;
          max-height: 90vh;
          overflow: auto;
          background: white;
          border-radius: 12px;
          padding: 22px;
        }

        .ob-modal-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e5e9ed;
          padding-bottom: 13px;
          margin-bottom: 16px;
        }

        .ob-modal-head h2 {
          margin: 0;
        }

        .ob-close {
          border: none;
          background: #eef2f5;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
        }

        .ob-detail-grid {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 10px;
        }

        .ob-detail {
          padding: 12px;
          background: #f7f9fb;
          border-radius: 7px;
          min-width: 0;
        }

        .ob-detail span {
          display: block;
          color: #8a96a0;
          font-size: 8px;
          margin-bottom: 4px;
        }

        .ob-detail strong {
          display: block;
          font-size: 10px;
          overflow-wrap: anywhere;
        }

        .ob-dispatch {
          margin-top: 18px;
          padding: 16px;
          border-radius: 8px;
          background: #fff9df;
          border: 1px solid #f1df91;
        }

        .ob-dispatch h3 {
          margin: 0 0 6px;
          font-size: 14px;
          color: #0b2946;
        }

        .ob-dispatch p {
          margin: 0 0 13px;
          color: #6e7780;
          font-size: 10px;
          line-height: 1.6;
        }

        .ob-yellow {
          width: 100%;
          border: none;
          background: #f6c20d;
          color: #0b2946;
          padding: 11px 14px;
          border-radius: 6px;
          font-weight: 800;
          cursor: pointer;
        }

        .ob-yellow:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .ob-waiting-info {
          margin-top: 18px;
          padding: 14px;
          border-radius: 8px;
          background: #edf5ff;
          color: #245ca6;
          font-size: 10px;
          line-height: 1.6;
        }

        .ob-assigned-info {
          margin-top: 18px;
          padding: 14px;
          border-radius: 8px;
          background: #edf9f0;
          color: #276638;
          font-size: 10px;
          line-height: 1.6;
        }

        @media(max-width: 900px) {
          .ob-summary {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .ob-tools {
            grid-template-columns: 1fr;
          }
        }

        @media(max-width: 600px) {
          .ob-page {
            padding: 18px 14px;
          }

          .ob-summary,
          .ob-detail-grid {
            grid-template-columns: 1fr;
          }

          .ob-head {
            flex-direction: column;
          }

          .ob-head h1 {
            font-size: 23px;
          }

          .ob-panel {
            padding: 12px;
          }

          .ob-modal {
            padding: 16px;
          }
        }
      `}</style>

      <main className="ob-page">
        <div className="ob-head">
          <div>
            <h1>Booking Management</h1>

            <p>
              Review passenger bookings and dispatch
              them to matching available drivers.
              <strong>
                {" "}Auto refresh: every 5 seconds
              </strong>
            </p>
          </div>

          <button
            className="ob-btn"
            onClick={() => loadData(false)}
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="ob-err">
            {error}
          </div>
        )}

        {message && (
          <div className="ob-msg">
            {message}
          </div>
        )}

        <div className="ob-summary">
          <div className="ob-card">
            <span>PENDING DISPATCH</span>
            <h2>{pendingCount}</h2>
          </div>

          <div className="ob-card">
            <span>WAITING FOR DRIVER</span>
            <h2>{waitingCount}</h2>
          </div>

          <div className="ob-card">
            <span>ON RIDE</span>
            <h2>{onRideCount}</h2>
          </div>

          <div className="ob-card">
            <span>COMPLETED</span>
            <h2>{completedCount}</h2>
          </div>
        </div>

        <section className="ob-panel">
          <div className="ob-tools">
            <input
              placeholder="Search booking, passenger, phone or destination..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            <select
              value={sourceFilter}
              onChange={(e) =>
                setSourceFilter(e.target.value)
              }
            >
              <option value="ALL">
                All Sources
              </option>
              <option value="WEBSITE">
                Website
              </option>
              <option value="PHONE">
                Phone
              </option>
              <option value="ON_SITE">
                On-Site
              </option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="ALL">
                All Status
              </option>
              <option value="PENDING">
                Pending
              </option>
              <option value="WAITING_FOR_DRIVER">
                Waiting for Driver
              </option>
              <option value="ACCEPTED">
                Accepted
              </option>
              <option value="DRIVER_ARRIVING">
                Driver Arriving
              </option>
              <option value="DRIVER_ARRIVED">
                Driver Arrived
              </option>
              <option value="ON_RIDE">
                On Ride
              </option>
              <option value="COMPLETED">
                Completed
              </option>
              <option value="REJECTED">
                Rejected
              </option>
            </select>
          </div>

          <div className="ob-wrap">
            <table className="ob-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Source</th>
                  <th>Passenger</th>
                  <th>Pickup</th>
                  <th>Destination</th>
                  <th>Operational Area</th>
                  <th>Type</th>
                  <th>Driver</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((b) => (
                  <tr key={b.bookingId}>
                    <td>
                      <strong>
                        BK
                        {String(
                          b.bookingId
                        ).padStart(4, "0")}
                      </strong>
                    </td>

                    <td>
                      {formatText(
                        b.bookingSource
                      )}
                    </td>

                    <td>
                      <strong>
                        {b.passengerName || "—"}
                      </strong>
                      <div>
                        {b.passengerPhone || "—"}
                      </div>
                    </td>

                    <td>
                      {b.pickupLocation}
                    </td>

                    <td>
                      {b.destination}
                    </td>

                    <td>
                      {b.operationalAreaId
                        ? areaName(
                            b.operationalAreaId
                          )
                        : "MMC / General"}
                    </td>

                    <td>
                      {typeName(
                        b.vehicleTypeId
                      )}
                    </td>

                    <td>
                      {b.driverName ||
                        (b.assignedDriverId
                          ? `Driver #${b.assignedDriverId}`
                          : "Not Assigned")}
                    </td>

                    <td>
                      {b.vehicleRegistrationNumber ||
                        (b.assignedVehicleId
                          ? `Vehicle #${b.assignedVehicleId}`
                          : "—")}
                    </td>

                    <td>
                      <span
                        className={`ob-tag ${
                          b.bookingStatus ===
                          "PENDING"
                            ? "pending"
                            : b.bookingStatus ===
                              "WAITING_FOR_DRIVER"
                            ? "waiting"
                            : b.bookingStatus ===
                              "ACCEPTED"
                            ? "accepted"
                            : ""
                        }`}
                      >
                        {formatText(
                          b.bookingStatus
                        )}
                      </span>
                    </td>

                    <td>
                      <button
                        className="ob-view"
                        onClick={() =>
                          openBooking(b)
                        }
                      >
                        View
                      </button>

                      {b.bookingStatus ===
                        "PENDING" && (
                        <button
                          className="ob-send-small"
                          disabled={
                            sendingId ===
                            b.bookingId
                          }
                          onClick={() =>
                            sendToDrivers(b)
                          }
                        >
                          {sendingId ===
                          b.bookingId
                            ? "Sending..."
                            : "Send to Drivers"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {!loading &&
                  filtered.length === 0 && (
                    <tr>
                      <td colSpan="11">
                        No bookings found.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </section>

        {selected && (
          <div className="ob-overlay">
            <div className="ob-modal">
              <div className="ob-modal-head">
                <div>
                  <h2>Booking Details</h2>
                  <small>
                    BK
                    {String(
                      selected.bookingId
                    ).padStart(4, "0")}
                  </small>
                </div>

                <button
                  className="ob-close"
                  onClick={() =>
                    setSelected(null)
                  }
                >
                  ✕
                </button>
              </div>

              <div className="ob-detail-grid">
                <div className="ob-detail">
                  <span>PASSENGER</span>
                  <strong>
                    {selected.passengerName ||
                      "—"}
                  </strong>
                </div>

                <div className="ob-detail">
                  <span>PHONE</span>
                  <strong>
                    {selected.passengerPhone ||
                      "—"}
                  </strong>
                </div>

                <div className="ob-detail">
                  <span>SOURCE</span>
                  <strong>
                    {formatText(
                      selected.bookingSource
                    )}
                  </strong>
                </div>

                <div className="ob-detail">
                  <span>VEHICLE TYPE</span>
                  <strong>
                    {typeName(
                      selected.vehicleTypeId
                    )}
                  </strong>
                </div>

                <div className="ob-detail">
                  <span>PICKUP</span>
                  <strong>
                    {selected.pickupLocation}
                  </strong>
                </div>

                <div className="ob-detail">
                  <span>DESTINATION</span>
                  <strong>
                    {selected.destination}
                  </strong>
                </div>

                <div className="ob-detail">
                  <span>OPERATIONAL AREA</span>
                  <strong>
                    {selected.operationalAreaId
                      ? areaName(
                          selected.operationalAreaId
                        )
                      : "MMC / General"}
                  </strong>
                </div>

                <div className="ob-detail">
                  <span>DATE</span>
                  <strong>
                    {selected.bookingDate ||
                      "—"}
                  </strong>
                </div>

                <div className="ob-detail">
                  <span>TIME</span>
                  <strong>
                    {selected.bookingTime ||
                      "—"}
                  </strong>
                </div>

                <div className="ob-detail">
                  <span>DRIVER</span>
                  <strong>
                    {selected.driverName ||
                      (selected.assignedDriverId
                        ? `Driver #${selected.assignedDriverId}`
                        : "Not Assigned")}
                  </strong>
                </div>

                <div className="ob-detail">
                  <span>VEHICLE</span>
                  <strong>
                    {selected.vehicleRegistrationNumber ||
                      (selected.assignedVehicleId
                        ? `Vehicle #${selected.assignedVehicleId}`
                        : "Not Assigned")}
                  </strong>
                </div>

                <div className="ob-detail">
                  <span>STATUS</span>
                  <strong>
                    {formatText(
                      selected.bookingStatus
                    )}
                  </strong>
                </div>
              </div>

              {selected.bookingStatus ===
                "PENDING" && (
                <div className="ob-dispatch">
                  <h3>
                    🚕 Dispatch Booking
                  </h3>

                  <p>
                    Send this booking to all
                    matching available drivers.
                    The first driver to accept
                    will be automatically assigned
                    to this booking.
                  </p>

                  <button
                    className="ob-yellow"
                    disabled={
                      sendingId ===
                      selected.bookingId
                    }
                    onClick={() =>
                      sendToDrivers(selected)
                    }
                  >
                    {sendingId ===
                    selected.bookingId
                      ? "Sending to Drivers..."
                      : "Send to Available Drivers"}
                  </button>
                </div>
              )}

              {selected.bookingStatus ===
                "WAITING_FOR_DRIVER" && (
                <div className="ob-waiting-info">
                  ⏳ This booking has been
                  dispatched. Waiting for an
                  available driver to accept it.
                </div>
              )}

              {selected.assignedDriverId &&
                ![
                  "PENDING",
                  "WAITING_FOR_DRIVER",
                ].includes(
                  selected.bookingStatus
                ) && (
                  <div className="ob-assigned-info">
                    ✓ A driver has accepted this
                    booking.
                    <br />
                    <strong>
                      {selected.driverName ||
                        `Driver #${selected.assignedDriverId}`}
                    </strong>

                    {selected.vehicleRegistrationNumber && (
                      <>
                        <br />
                        Vehicle:{" "}
                        <strong>
                          {
                            selected.vehicleRegistrationNumber
                          }
                        </strong>
                      </>
                    )}
                  </div>
                )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default OperationsBookings;