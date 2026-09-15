import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://localhost:5171/api";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("authToken") ||
  sessionStorage.getItem("accessToken") ||
  "";

const getHeaders = () => {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const formatStatus = (value) =>
  value
    ? value
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "Unknown";

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [types, setTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const [b, t] = await Promise.all([
        fetch(`${API_BASE_URL}/bookings`, {
          headers: getHeaders(),
        }),

        fetch(`${API_BASE_URL}/vehicletypes`, {
          headers: getHeaders(),
        }),
      ]);

      if (!b.ok) {
        throw new Error("Unable to load bookings.");
      }

      setBookings(await b.json());
      setTypes(t.ok ? await t.json() : []);
    } catch (e) {
      setError(e.message || "Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const typeName = (id) =>
    types.find(
      (t) => Number(t.vehicleTypeId) === Number(id)
    )?.typeName || "—";

  const rows = useMemo(
    () =>
      bookings
        .filter((b) => {
          const q = search.toLowerCase();

          const txt = [
            b.bookingId,
            b.passengerName,
            b.passengerPhone,
            b.pickupLocation,
            b.destination,
            b.bookingSource,
            b.bookingStatus,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return (
            (!q || txt.includes(q)) &&
            (filter === "ALL" ||
              b.bookingStatus === filter)
          );
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
        ),
    [bookings, search, filter]
  );

  const cancel = async (b) => {
    if (
      !window.confirm(
        `Cancel booking #${b.bookingId}?`
      )
    ) {
      return;
    }

    try {
      setActionId(b.bookingId);
      setError("");
      setMessage("");

      const r = await fetch(
        `${API_BASE_URL}/bookings/${b.bookingId}/cancel`,
        {
          method: "PUT",
          headers: getHeaders(),
        }
      );

      const data = await r.json().catch(() => null);

      if (!r.ok) {
        throw new Error(
          data?.message ||
            "Unable to cancel booking."
        );
      }

      setMessage(
        `Booking #${b.bookingId} cancelled.`
      );

      await load();
    } catch (e) {
      setError(
        e.message ||
          "Unable to cancel booking."
      );
    } finally {
      setActionId(null);
    }
  };

  const canCancel = (status) =>
    [
      "PENDING",
      "WAITING_FOR_DRIVER",
      "ACCEPTED",
    ].includes(status);

  return (
    <>
      <style>{`

        * {
          box-sizing: border-box;
        }

        /* =========================
           DESKTOP - ORIGINAL DESIGN
           ========================= */

        .bk-page {
          padding: 30px;
          background: #f4f7fa;
          min-height: 100vh;
          font-family: Arial, Helvetica, sans-serif;
        }

        .bk-page h1 {
          margin: 0 0 6px;
          color: #0b2946;
          font-size: 28px;
        }

        .bk-sub {
          font-size: 11px;
          color: #7b8794;
          margin: 0 0 20px;
        }

        .bk-msg {
          padding: 11px;
          border-radius: 7px;
          margin-bottom: 14px;
          font-size: 10px;
        }

        .bk-msg.err {
          background: #fff1f1;
          color: #a43c3c;
          border: 1px solid #efc8c8;
        }

        .bk-msg.ok {
          background: #e8f6ed;
          color: #18763a;
          border: 1px solid #cce9d5;
        }

        .bk-tools {
          display: flex;
          gap: 10px;
          margin-bottom: 14px;
        }

        .bk-tools input {
          flex: 1;
        }

        .bk-tools input,
        .bk-tools select {
          padding: 10px;
          border: 1px solid #d9e0e6;
          border-radius: 6px;
          background: white;
          font-size: 10px;
          outline: none;
        }

        .bk-tools input:focus,
        .bk-tools select:focus {
          border-color: #f6c20d;
        }

        .bk-wrap {
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 9px;
          overflow: auto;
        }

        .bk-table {
          width: 100%;
          min-width: 1200px;
          border-collapse: collapse;
        }

        .bk-table th {
          background: #0b2946;
          color: white;
          padding: 12px;
          text-align: left;
          font-size: 8px;
        }

        .bk-table td {
          padding: 12px;
          border-bottom: 1px solid #edf0f3;
          font-size: 9px;
          color: #53616e;
          vertical-align: middle;
        }

        .bk-table small {
          color: #7b8794;
        }

        .bk-cancel {
          border: 0;
          background: #c94c4c;
          color: white;
          border-radius: 5px;
          padding: 7px 9px;
          font-size: 8px;
          font-weight: 700;
          cursor: pointer;
        }

        .bk-cancel:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }


        /* =========================
           MOBILE CARDS
           desktop eke hidden
           ========================= */

        .bk-mobile-list {
          display: none;
        }


        /* =========================
           TABLET
           ========================= */

        @media (max-width: 900px) {

          .bk-page {
            padding: 25px 20px;
          }

          .bk-tools {
            flex-direction: column;
          }

          .bk-tools input,
          .bk-tools select {
            width: 100%;
          }
        }


        /* =========================
           MOBILE
           ========================= */

        @media (max-width: 768px) {

          .bk-page {
            padding: 80px 16px 25px;
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
          }

          .bk-page h1 {
            font-size: 24px;
          }

          .bk-sub {
            font-size: 11px;
            line-height: 1.5;
            margin-bottom: 18px;
          }

          .bk-tools {
            display: flex;
            flex-direction: column;
            gap: 10px;

            background: white;
            padding: 14px;

            border: 1px solid #e2e7ec;
            border-radius: 10px;

            margin-bottom: 16px;
          }

          .bk-tools input,
          .bk-tools select {
            width: 100%;
            min-width: 0;
            padding: 12px;
            font-size: 12px;
          }


          /* desktop table hide */

          .bk-wrap {
            display: none;
          }


          /* mobile cards show */

          .bk-mobile-list {
            display: flex;
            flex-direction: column;
            gap: 14px;
            width: 100%;
          }

          .bk-mobile-card {
            width: 100%;
            background: white;

            border: 1px solid #e2e7ec;
            border-radius: 12px;

            overflow: hidden;
          }


          /* CARD HEADER */

          .bk-mobile-header {
            background: #0b2946;
            color: white;

            padding: 14px 16px;

            display: flex;
            justify-content: space-between;
            align-items: center;

            gap: 10px;
          }

          .bk-mobile-id {
            font-size: 14px;
            font-weight: 800;
          }

          .bk-mobile-status {
            background: #f6c20d;
            color: #0b2946;

            padding: 6px 9px;
            border-radius: 20px;

            font-size: 9px;
            font-weight: 800;

            text-align: center;
          }


          /* CARD BODY */

          .bk-mobile-body {
            padding: 5px 15px;
          }

          .bk-mobile-row {
            display: grid;

            grid-template-columns:
              105px minmax(0, 1fr);

            gap: 10px;

            padding: 11px 0;

            border-bottom:
              1px solid #edf0f3;

            align-items: start;
          }

          .bk-mobile-row:last-child {
            border-bottom: none;
          }

          .bk-mobile-label {
            color: #89949e;

            font-size: 9px;
            font-weight: 800;

            text-transform: uppercase;
          }

          .bk-mobile-value {
            min-width: 0;

            color: #53616e;

            font-size: 11px;
            line-height: 1.5;

            overflow-wrap: anywhere;
            word-break: break-word;
          }

          .bk-mobile-value strong {
            color: #0b2946;
          }

          .bk-mobile-phone {
            display: block;

            color: #89949e;

            margin-top: 3px;

            font-size: 10px;
          }


          /* ROUTE */

          .bk-mobile-route {
            display: flex;
            flex-direction: column;

            gap: 6px;
          }

          .bk-route-from,
          .bk-route-to {
            overflow-wrap: anywhere;
            word-break: break-word;
          }

          .bk-route-arrow {
            color: #f6c20d;
            font-weight: 900;
            font-size: 15px;
          }


          /* CANCEL */

          .bk-mobile-action {
            padding: 0 15px 15px;
          }

          .bk-mobile-action .bk-cancel {
            width: 100%;

            padding: 11px;

            font-size: 10px;

            border-radius: 7px;
          }
        }


        @media (max-width: 420px) {

          .bk-page {
            padding-left: 12px;
            padding-right: 12px;
          }

          .bk-mobile-row {
            grid-template-columns:
              90px minmax(0, 1fr);

            gap: 8px;
          }

          .bk-mobile-header {
            padding: 13px;
          }

          .bk-mobile-body {
            padding-left: 13px;
            padding-right: 13px;
          }

          .bk-mobile-action {
            padding-left: 13px;
            padding-right: 13px;
          }
        }

      `}</style>

      <main className="bk-page">

        <h1>Booking Management</h1>

        <p className="bk-sub">
          Monitor all bookings. Operational assignment
          remains with Taxi Operator.
        </p>


        {/* MESSAGES */}

        {error && (
          <div className="bk-msg err">
            {error}
          </div>
        )}

        {message && (
          <div className="bk-msg ok">
            {message}
          </div>
        )}


        {/* SEARCH + FILTER */}

        <div className="bk-tools">

          <input
            type="text"
            placeholder="Search booking..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value)
            }
          >

            <option value="ALL">
              All Statuses
            </option>

            {[
              "PENDING",
              "WAITING_FOR_DRIVER",
              "ACCEPTED",
              "DRIVER_ARRIVING",
              "ON_RIDE",
              "COMPLETED",
              "CANCELLED",
              "REJECTED",
            ].map((x) => (
              <option
                key={x}
                value={x}
              >
                {formatStatus(x)}
              </option>
            ))}

          </select>

        </div>


        {/* ======================
            DESKTOP TABLE
            ====================== */}

        <div className="bk-wrap">

          {loading ? (

            <div style={{ padding: 25 }}>
              Loading...
            </div>

          ) : (

            <table className="bk-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>PASSENGER</th>
                  <th>SOURCE</th>
                  <th>ROUTE</th>
                  <th>VEHICLE TYPE</th>
                  <th>DRIVER</th>
                  <th>VEHICLE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>

                {rows.map((b) => (

                  <tr key={b.bookingId}>

                    <td>
                      <strong>
                        #{b.bookingId}
                      </strong>
                    </td>

                    <td>
                      {b.passengerName ||
                        `User #${
                          b.passengerId || "—"
                        }`}

                      <br />

                      <small>
                        {b.passengerPhone || ""}
                      </small>
                    </td>

                    <td>
                      {formatStatus(
                        b.bookingSource
                      )}
                    </td>

                    <td>
                      {b.pickupLocation}
                      {" → "}
                      {b.destination}
                    </td>

                    <td>
                      {typeName(
                        b.vehicleTypeId
                      )}
                    </td>

                    <td>
                      {b.assignedDriverId
                        ? `#${b.assignedDriverId}`
                        : "Not Assigned"}
                    </td>

                    <td>
                      {b.assignedVehicleId
                        ? `#${b.assignedVehicleId}`
                        : "Not Assigned"}
                    </td>

                    <td>
                      {formatStatus(
                        b.bookingStatus
                      )}
                    </td>

                    <td>

                      {canCancel(
                        b.bookingStatus
                      ) ? (

                        <button
                          className="bk-cancel"
                          disabled={
                            actionId ===
                            b.bookingId
                          }
                          onClick={() =>
                            cancel(b)
                          }
                        >
                          {actionId ===
                          b.bookingId
                            ? "Cancelling..."
                            : "Cancel"}
                        </button>

                      ) : (
                        "—"
                      )}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          )}

        </div>


        {/* ======================
            MOBILE CARDS
            ====================== */}

        <div className="bk-mobile-list">

          {loading ? (

            <div className="bk-mobile-card">

              <div
                style={{
                  padding: "25px",
                  textAlign: "center",
                  color: "#7b8794",
                  fontSize: "11px",
                }}
              >
                Loading...
              </div>

            </div>

          ) : rows.length === 0 ? (

            <div className="bk-mobile-card">

              <div
                style={{
                  padding: "25px",
                  textAlign: "center",
                  color: "#7b8794",
                  fontSize: "11px",
                }}
              >
                No bookings found.
              </div>

            </div>

          ) : (

            rows.map((b) => (

              <div
                className="bk-mobile-card"
                key={`mobile-${b.bookingId}`}
              >

                {/* HEADER */}

                <div className="bk-mobile-header">

                  <span className="bk-mobile-id">
                    Booking #{b.bookingId}
                  </span>

                  <span className="bk-mobile-status">
                    {formatStatus(
                      b.bookingStatus
                    )}
                  </span>

                </div>


                {/* BODY */}

                <div className="bk-mobile-body">


                  {/* PASSENGER */}

                  <div className="bk-mobile-row">

                    <span className="bk-mobile-label">
                      Passenger
                    </span>

                    <span className="bk-mobile-value">

                      <strong>
                        {b.passengerName ||
                          `User #${
                            b.passengerId ||
                            "—"
                          }`}
                      </strong>

                      {b.passengerPhone && (
                        <span className="bk-mobile-phone">
                          {b.passengerPhone}
                        </span>
                      )}

                    </span>

                  </div>


                  {/* SOURCE */}

                  <div className="bk-mobile-row">

                    <span className="bk-mobile-label">
                      Source
                    </span>

                    <span className="bk-mobile-value">
                      {formatStatus(
                        b.bookingSource
                      )}
                    </span>

                  </div>


                  {/* ROUTE */}

                  <div className="bk-mobile-row">

                    <span className="bk-mobile-label">
                      Route
                    </span>

                    <div className="bk-mobile-value bk-mobile-route">

                      <span className="bk-route-from">
                        {b.pickupLocation ||
                          "—"}
                      </span>

                      <span className="bk-route-arrow">
                        ↓
                      </span>

                      <span className="bk-route-to">
                        {b.destination ||
                          "—"}
                      </span>

                    </div>

                  </div>


                  {/* VEHICLE TYPE */}

                  <div className="bk-mobile-row">

                    <span className="bk-mobile-label">
                      Vehicle Type
                    </span>

                    <span className="bk-mobile-value">
                      {typeName(
                        b.vehicleTypeId
                      )}
                    </span>

                  </div>


                  {/* DRIVER */}

                  <div className="bk-mobile-row">

                    <span className="bk-mobile-label">
                      Driver
                    </span>

                    <span className="bk-mobile-value">

                      {b.assignedDriverId
                        ? `#${b.assignedDriverId}`
                        : "Not Assigned"}

                    </span>

                  </div>


                  {/* VEHICLE */}

                  <div className="bk-mobile-row">

                    <span className="bk-mobile-label">
                      Vehicle
                    </span>

                    <span className="bk-mobile-value">

                      {b.assignedVehicleId
                        ? `#${b.assignedVehicleId}`
                        : "Not Assigned"}

                    </span>

                  </div>


                  {/* STATUS */}

                  <div className="bk-mobile-row">

                    <span className="bk-mobile-label">
                      Status
                    </span>

                    <span className="bk-mobile-value">

                      {formatStatus(
                        b.bookingStatus
                      )}

                    </span>

                  </div>

                </div>


                {/* CANCEL BUTTON */}

                {canCancel(
                  b.bookingStatus
                ) && (

                  <div className="bk-mobile-action">

                    <button
                      className="bk-cancel"
                      disabled={
                        actionId ===
                        b.bookingId
                      }
                      onClick={() =>
                        cancel(b)
                      }
                    >

                      {actionId ===
                      b.bookingId
                        ? "Cancelling..."
                        : "Cancel Booking"}

                    </button>

                  </div>

                )}

              </div>

            ))

          )}

        </div>

      </main>
    </>
  );
}

export default AdminBookings;