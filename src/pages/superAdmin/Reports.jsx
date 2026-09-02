import { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:5171/api";

/* =========================================================
   AUTH
========================================================= */

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("authToken") ||
  sessionStorage.getItem("accessToken") ||
  "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const safeJson = async (response) => {
  const raw = await response.text();

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {
      message: raw,
    };
  }
};

/* =========================================================
   HELPERS
========================================================= */

const formatText = (value) =>
  (value || "—")
    .toString()
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );

const formatMoney = (value) => {
  const amount = Number(value || 0);

  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatRating = (value) => {
  const rating = Number(value || 0);

  if (!rating) {
    return "0.0";
  }

  return rating.toFixed(1);
};

/* =========================================================
   COMPONENT
========================================================= */

function Reports() {
  const [dashboard, setDashboard] = useState({});
  const [bookingReport, setBookingReport] = useState({});
  const [revenueReport, setRevenueReport] = useState({});
  const [driverReport, setDriverReport] = useState({});
  const [vehicleReport, setVehicleReport] = useState({});
  const [ratingReport, setRatingReport] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     LOAD REPORTS
  ======================================================= */

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const reportNames = [
        "dashboard",
        "bookings",
        "revenue",
        "drivers",
        "vehicles",
        "ratings",
      ];

      const responses = await Promise.all(
        reportNames.map((name) =>
          fetch(
            `${API_BASE_URL}/reports/${name}`,
            {
              headers: authHeaders(),
            }
          )
        )
      );

      const results = await Promise.all(
        responses.map((response) =>
          safeJson(response)
        )
      );

      const failedIndex =
        responses.findIndex(
          (response) => !response.ok
        );

      if (failedIndex !== -1) {
        throw new Error(
          results[failedIndex]?.message ||
            "Unable to load reports."
        );
      }

      setDashboard(results[0] || {});
      setBookingReport(results[1] || {});
      setRevenueReport(results[2] || {});
      setDriverReport(results[3] || {});
      setVehicleReport(results[4] || {});
      setRatingReport(results[5] || {});
    } catch (err) {
      console.error(
        "Reports loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load reports."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  /* =======================================================
     EXPORT REPORT
  ======================================================= */

  const exportReport = () => {
    const payload = {
      generatedAt:
        new Date().toISOString(),

      dashboard,
      bookingReport,
      revenueReport,
      driverReport,
      vehicleReport,
      ratingReport,
    };

    const blob = new Blob(
      [
        JSON.stringify(
          payload,
          null,
          2
        ),
      ],
      {
        type: "application/json",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `MMC-Taxi-Report-${
        new Date()
          .toISOString()
          .split("T")[0]
      }.json`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /* =======================================================
     DATA
  ======================================================= */

  const bookings =
    dashboard?.bookings || {};

  const drivers =
    dashboard?.drivers || {};

  const vehicles =
    dashboard?.vehicles || {};

  const revenue =
    dashboard?.revenue || {};

  const bookingStatuses =
    bookingReport?.byStatus || [];

  const bookingSources =
    bookingReport?.bySource || [];

  const bookingVehicleTypes =
    bookingReport?.byVehicleType || [];

  const paymentMethods =
    revenueReport?.byPaymentMethod || [];

  const driverPerformance =
    driverReport?.driverPerformance || [];

  const driverVerification =
    driverReport?.byVerificationStatus || [];

  const driverOperational =
    driverReport?.byOperationalStatus || [];

  const vehicleOperational =
    vehicleReport?.byOperationalStatus || [];

  const vehicleTypes =
    vehicleReport?.byVehicleType || [];

  const ratingDistribution =
    ratingReport?.distribution || [];

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="sa-page">
        <section className="sa-card">
          <div className="report-loading">
            <div className="report-spinner" />

            <h3>
              Loading Reports...
            </h3>

            <p>
              Please wait while report
              information is being loaded.
            </p>
          </div>
        </section>

        <style>{reportStyles}</style>
      </main>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="sa-page">
      <style>{reportStyles}</style>

      {/* HEADER */}

      <div className="sa-header">
        <div>
          <h1>
            Reports & Analytics
          </h1>

          <p>
            Review booking, revenue,
            driver, vehicle and customer
            rating performance.
          </p>
        </div>

        <div className="report-header-actions">
          <button
            type="button"
            className="report-refresh-btn"
            onClick={loadReports}
          >
            ↻ Refresh
          </button>

          <button
            type="button"
            className="sa-primary-btn"
            onClick={exportReport}
          >
            ⇩ Export Report
          </button>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="report-error">
          <strong>
            Unable to load reports
          </strong>

          <p>{error}</p>
        </div>
      )}

      {/* ===================================================
          MAIN SUMMARY
      =================================================== */}

      <section className="report-section">
        <div className="report-section-heading">
          <div>
            <h2>
              Overall Summary
            </h2>

            <p>
              Current taxi service
              performance overview.
            </p>
          </div>
        </div>

        <div className="report-summary-grid">
          <SummaryCard
            icon="📋"
            title="Total Bookings"
            value={bookings.total ?? 0}
            note={`${bookings.today ?? 0} today`}
          />

          <SummaryCard
            icon="🚕"
            title="Active Trips"
            value={bookings.active ?? 0}
            note="Currently active"
          />

          <SummaryCard
            icon="✅"
            title="Completed Trips"
            value={
              bookings.completed ?? 0
            }
            note="Successfully completed"
          />

          <SummaryCard
            icon="❌"
            title="Cancelled"
            value={
              bookings.cancelled ?? 0
            }
            note="Cancelled bookings"
          />

          <SummaryCard
            icon="👨‍✈️"
            title="Total Drivers"
            value={drivers.total ?? 0}
            note={`${drivers.available ?? 0} available`}
          />

          <SummaryCard
            icon="🚗"
            title="Active Vehicles"
            value={vehicles.total ?? 0}
            note={`${vehicles.available ?? 0} available`}
          />

          <SummaryCard
            icon="💰"
            title="Total Revenue"
            value={formatMoney(
              revenue.total
            )}
            note="Paid transactions"
          />

          <SummaryCard
            icon="💵"
            title="Today's Revenue"
            value={formatMoney(
              revenue.today
            )}
            note="Revenue today"
          />
        </div>
      </section>

      {/* ===================================================
          BOOKING REPORT
      =================================================== */}

      <section className="report-section">
        <div className="report-section-heading">
          <div>
            <h2>
              Booking Report
            </h2>

            <p>
              Booking distribution by
              status, source and vehicle
              type.
            </p>
          </div>

          <div className="report-total-pill">
            Total:{" "}
            {bookingReport?.total ?? 0}
          </div>
        </div>

        <div className="report-grid-3">
          <ReportTableCard
            title="Bookings by Status"
          >
            <SimpleTable
              headers={[
                "Status",
                "Bookings",
              ]}
              rows={bookingStatuses.map(
                (item) => [
                  <StatusBadge
                    key={`status-${item.status}`}
                    value={item.status}
                  />,
                  item.count ?? 0,
                ]
              )}
            />
          </ReportTableCard>

          <ReportTableCard
            title="Bookings by Source"
          >
            <SimpleTable
              headers={[
                "Source",
                "Bookings",
              ]}
              rows={bookingSources.map(
                (item) => [
                  formatText(item.source),
                  item.count ?? 0,
                ]
              )}
            />
          </ReportTableCard>

          <ReportTableCard
            title="Bookings by Vehicle"
          >
            <SimpleTable
              headers={[
                "Vehicle Type",
                "Bookings",
              ]}
              rows={bookingVehicleTypes.map(
                (item) => [
                  getVehicleIcon(
                    item.vehicleType
                  ) +
                    " " +
                    formatText(
                      item.vehicleType
                    ),

                  item.count ?? 0,
                ]
              )}
            />
          </ReportTableCard>
        </div>
      </section>

      {/* ===================================================
          REVENUE REPORT
      =================================================== */}

      <section className="report-section">
        <div className="report-section-heading">
          <div>
            <h2>
              Revenue Report
            </h2>

            <p>
              Financial summary of paid
              taxi bookings.
            </p>
          </div>
        </div>

        <div className="report-finance-grid">
          <div className="report-finance-card">
            <span>
              Total Revenue
            </span>

            <h2>
              {formatMoney(
                revenueReport?.totalRevenue
              )}
            </h2>

            <p>
              Revenue from completed paid
              transactions.
            </p>
          </div>

          <div className="report-finance-card">
            <span>
              Paid Transactions
            </span>

            <h2>
              {revenueReport
                ?.totalPaidBookings ?? 0}
            </h2>

            <p>
              Total successful payment
              records.
            </p>
          </div>
        </div>

        <ReportTableCard
          title="Revenue by Payment Method"
        >
          <SimpleTable
            headers={[
              "Payment Method",
              "Transactions",
              "Amount",
            ]}
            rows={paymentMethods.map(
              (item) => [
                formatText(
                  item.paymentMethod
                ),

                item.transactionCount ??
                  0,

                formatMoney(
                  item.amount
                ),
              ]
            )}
          />
        </ReportTableCard>
      </section>

      {/* ===================================================
          DRIVER REPORT
      =================================================== */}

      <section className="report-section">
        <div className="report-section-heading">
          <div>
            <h2>
              Driver Report
            </h2>

            <p>
              Driver verification,
              availability and performance.
            </p>
          </div>

          <div className="report-total-pill">
            Total Drivers:{" "}
            {driverReport
              ?.totalDrivers ?? 0}
          </div>
        </div>

        <div className="report-grid-2">
          <ReportTableCard
            title="Verification Status"
          >
            <SimpleTable
              headers={[
                "Status",
                "Drivers",
              ]}
              rows={driverVerification.map(
                (item) => [
                  <StatusBadge
                    key={`verification-${item.status}`}
                    value={item.status}
                  />,
                  item.count ?? 0,
                ]
              )}
            />
          </ReportTableCard>

          <ReportTableCard
            title="Operational Status"
          >
            <SimpleTable
              headers={[
                "Status",
                "Drivers",
              ]}
              rows={driverOperational.map(
                (item) => [
                  <StatusBadge
                    key={`operation-${item.status}`}
                    value={item.status}
                  />,
                  item.count ?? 0,
                ]
              )}
            />
          </ReportTableCard>
        </div>

        <ReportTableCard
          title="Driver Performance"
        >
          <SimpleTable
            headers={[
              "Driver",
              "Verification",
              "Status",
              "Completed Trips",
              "Average Rating",
              "Ratings",
            ]}
            rows={driverPerformance.map(
              (driver) => [
                driver.driverName ||
                  `Driver #${driver.driverId}`,

                <StatusBadge
                  key={`driver-verification-${driver.driverId}`}
                  value={
                    driver.verificationStatus
                  }
                />,

                <StatusBadge
                  key={`driver-status-${driver.driverId}`}
                  value={
                    driver.operationalStatus
                  }
                />,

                driver.completedTrips ??
                  0,

                driver.averageRating !=
                null
                  ? `⭐ ${formatRating(
                      driver.averageRating
                    )}`
                  : "No rating",

                driver.ratingCount ?? 0,
              ]
            )}
          />
        </ReportTableCard>
      </section>

      {/* ===================================================
          VEHICLE REPORT
      =================================================== */}

      <section className="report-section">
        <div className="report-section-heading">
          <div>
            <h2>
              Vehicle Report
            </h2>

            <p>
              Vehicle availability and
              fleet distribution.
            </p>
          </div>

          <div className="report-total-pill">
            Total Vehicles:{" "}
            {vehicleReport
              ?.totalVehicles ?? 0}
          </div>
        </div>

        <div className="report-mini-summary-grid">
          <div className="report-mini-card">
            <span>
              Active Vehicles
            </span>

            <strong>
              {vehicleReport
                ?.activeVehicles ?? 0}
            </strong>
          </div>

          <div className="report-mini-card">
            <span>
              Inactive Vehicles
            </span>

            <strong>
              {vehicleReport
                ?.inactiveVehicles ?? 0}
            </strong>
          </div>
        </div>

        <div className="report-grid-2">
          <ReportTableCard
            title="Operational Status"
          >
            <SimpleTable
              headers={[
                "Status",
                "Vehicles",
              ]}
              rows={vehicleOperational.map(
                (item) => [
                  <StatusBadge
                    key={`vehicle-operation-${item.status}`}
                    value={item.status}
                  />,
                  item.count ?? 0,
                ]
              )}
            />
          </ReportTableCard>

          <ReportTableCard
            title="Fleet by Vehicle Type"
          >
            <SimpleTable
              headers={[
                "Vehicle Type",
                "Vehicles",
              ]}
              rows={vehicleTypes.map(
                (item) => [
                  getVehicleIcon(
                    item.vehicleType
                  ) +
                    " " +
                    formatText(
                      item.vehicleType
                    ),

                  item.count ?? 0,
                ]
              )}
            />
          </ReportTableCard>
        </div>
      </section>

      {/* ===================================================
          RATINGS
      =================================================== */}

      <section className="report-section">
        <div className="report-section-heading">
          <div>
            <h2>
              Ratings & Feedback
            </h2>

            <p>
              Passenger rating summary
              for taxi drivers.
            </p>
          </div>
        </div>

        <div className="report-rating-layout">
          <div className="report-rating-summary">
            <span>
              Average Rating
            </span>

            <div className="report-rating-value">
              ⭐{" "}
              {formatRating(
                ratingReport
                  ?.averageRating
              )}
            </div>

            <p>
              Based on{" "}
              <strong>
                {ratingReport
                  ?.totalRatings ?? 0}
              </strong>{" "}
              passenger ratings.
            </p>
          </div>

          <ReportTableCard
            title="Rating Distribution"
          >
            <SimpleTable
              headers={[
                "Rating",
                "Count",
              ]}
              rows={ratingDistribution.map(
                (item) => [
                  `${"⭐".repeat(
                    Math.max(
                      0,
                      Math.min(
                        5,
                        Number(
                          item.rating
                        ) || 0
                      )
                    )
                  )} (${item.rating})`,

                  item.count ?? 0,
                ]
              )}
            />
          </ReportTableCard>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon,
  title,
  value,
  note,
}) {
  return (
    <div className="report-summary-card">
      <div className="report-summary-icon">
        {icon}
      </div>

      <div>
        <span>
          {title}
        </span>

        <h2>
          {value}
        </h2>

        <p>
          {note}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   TABLE CARD
========================================================= */

function ReportTableCard({
  title,
  children,
}) {
  return (
    <div className="report-table-card">
      <div className="report-table-title">
        <h3>
          {title}
        </h3>
      </div>

      {children}
    </div>
  );
}

/* =========================================================
   SIMPLE TABLE
========================================================= */

function SimpleTable({
  headers,
  rows,
}) {
  return (
    <div className="report-table-wrapper">
      <table className="report-table">
        <thead>
          <tr>
            {headers.map(
              (header) => (
                <th key={header}>
                  {header}
                </th>
              )
            )}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={
                  headers.length
                }
                className="report-empty"
              >
                No report data
                available.
              </td>
            </tr>
          ) : (
            rows.map(
              (row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map(
                    (
                      cell,
                      cellIndex
                    ) => (
                      <td
                        key={
                          cellIndex
                        }
                      >
                        {cell}
                      </td>
                    )
                  )}
                </tr>
              )
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ value }) {
  const normalized =
    (value || "")
      .toString()
      .toUpperCase();

  let className =
    "report-badge neutral";

  if (
    [
      "ACTIVE",
      "AVAILABLE",
      "APPROVED",
      "COMPLETED",
      "PAID",
    ].includes(normalized)
  ) {
    className =
      "report-badge success";
  } else if (
    [
      "PENDING",
      "WAITING_FOR_DRIVER",
      "DRIVER_ARRIVING",
    ].includes(normalized)
  ) {
    className =
      "report-badge warning";
  } else if (
    [
      "ACCEPTED",
      "ON_RIDE",
    ].includes(normalized)
  ) {
    className =
      "report-badge info";
  } else if (
    [
      "CANCELLED",
      "REJECTED",
      "OFFLINE",
      "INACTIVE",
    ].includes(normalized)
  ) {
    className =
      "report-badge danger";
  }

  return (
    <span className={className}>
      {formatText(value)}
    </span>
  );
}

/* =========================================================
   VEHICLE ICON
========================================================= */

function getVehicleIcon(type) {
  const normalized =
    (type || "")
      .toString()
      .toUpperCase();

  if (normalized.includes("CAR")) {
    return "🚗";
  }

  if (
    normalized.includes("THREE") ||
    normalized.includes("TUK")
  ) {
    return "🛺";
  }

  if (
    normalized.includes("BIKE") ||
    normalized.includes("MOTOR")
  ) {
    return "🏍️";
  }

  return "🚕";
}

/* =========================================================
   STYLES
========================================================= */

const reportStyles = `
  .report-header-actions {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .report-refresh-btn {
    border: 1px solid #d8e0e7;
    background: white;
    color: #0b2946;
    padding: 10px 16px;
    border-radius: 7px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: .2s;
  }

  .report-refresh-btn:hover {
    background: #f5f7f9;
  }

  .report-error {
    margin-bottom: 20px;
    padding: 14px 16px;
    border: 1px solid #efc1c1;
    background: #fff1f1;
    border-radius: 8px;
    color: #9d3434;
  }

  .report-error strong {
    display: block;
    margin-bottom: 5px;
    font-size: 12px;
  }

  .report-error p {
    margin: 0;
    font-size: 11px;
    line-height: 1.6;
  }

  .report-section {
    margin-bottom: 24px;
    padding: 22px;
    background: white;
    border: 1px solid #e3e8ed;
    border-radius: 10px;
    box-shadow: 0 3px 12px rgba(11, 41, 70, .04);
  }

  .report-section-heading {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 20px;
  }

  .report-section-heading h2 {
    margin: 0 0 5px;
    color: #0b2946;
    font-size: 17px;
  }

  .report-section-heading p {
    margin: 0;
    color: #7b8792;
    font-size: 10px;
    line-height: 1.5;
  }

  .report-total-pill {
    padding: 7px 12px;
    background: #fff7d6;
    color: #806300;
    border: 1px solid #f5dc77;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 800;
    white-space: nowrap;
  }

  .report-summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .report-summary-card {
    display: flex;
    align-items: center;
    gap: 13px;
    min-height: 95px;
    padding: 16px;
    border: 1px solid #e4e9ed;
    border-radius: 9px;
    background: #fbfcfd;
  }

  .report-summary-icon {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: #fff4bf;
    border-radius: 9px;
    font-size: 20px;
  }

  .report-summary-card span {
    display: block;
    color: #788591;
    font-size: 9px;
    font-weight: 700;
  }

  .report-summary-card h2 {
    margin: 4px 0 3px;
    color: #0b2946;
    font-size: 18px;
    font-weight: 800;
  }

  .report-summary-card p {
    margin: 0;
    color: #98a1aa;
    font-size: 8px;
  }

  .report-grid-2 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .report-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .report-table-card {
    margin-top: 16px;
    border: 1px solid #e2e7eb;
    border-radius: 9px;
    overflow: hidden;
    background: white;
  }

  .report-grid-2 .report-table-card,
  .report-grid-3 .report-table-card {
    margin-top: 0;
  }

  .report-table-title {
    padding: 13px 15px;
    background: #f8fafb;
    border-bottom: 1px solid #e4e9ed;
  }

  .report-table-title h3 {
    margin: 0;
    color: #0b2946;
    font-size: 11px;
    font-weight: 800;
  }

  .report-table-wrapper {
    width: 100%;
    overflow-x: auto;
  }

  .report-table {
    width: 100%;
    border-collapse: collapse;
  }

  .report-table th {
    padding: 11px 13px;
    background: #fbfcfd;
    color: #71808e;
    border-bottom: 1px solid #e8ecef;
    text-align: left;
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .4px;
  }

  .report-table td {
    padding: 12px 13px;
    color: #425466;
    border-bottom: 1px solid #edf0f2;
    font-size: 10px;
    vertical-align: middle;
  }

  .report-table tbody tr:last-child td {
    border-bottom: none;
  }

  .report-table tbody tr:hover {
    background: #fbfcfd;
  }

  .report-empty {
    padding: 24px !important;
    text-align: center;
    color: #98a2ab !important;
  }

  .report-badge {
    display: inline-block;
    padding: 5px 8px;
    border-radius: 20px;
    font-size: 8px;
    font-weight: 800;
    white-space: nowrap;
  }

  .report-badge.success {
    background: #e7f7ed;
    color: #257342;
  }

  .report-badge.warning {
    background: #fff5d6;
    color: #8a6800;
  }

  .report-badge.info {
    background: #e8f2ff;
    color: #28629a;
  }

  .report-badge.danger {
    background: #ffeded;
    color: #a23b3b;
  }

  .report-badge.neutral {
    background: #eef1f4;
    color: #64717e;
  }

  .report-finance-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .report-finance-card {
    padding: 20px;
    background: #0b2946;
    border-radius: 10px;
  }

  .report-finance-card span {
    color: rgba(255,255,255,.65);
    font-size: 9px;
    font-weight: 700;
  }

  .report-finance-card h2 {
    margin: 8px 0;
    color: #f6c20d;
    font-size: 24px;
  }

  .report-finance-card p {
    margin: 0;
    color: rgba(255,255,255,.6);
    font-size: 9px;
  }

  .report-mini-summary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .report-mini-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: #f8fafb;
    border: 1px solid #e3e8ec;
    border-radius: 8px;
  }

  .report-mini-card span {
    color: #6e7b87;
    font-size: 10px;
    font-weight: 700;
  }

  .report-mini-card strong {
    color: #0b2946;
    font-size: 18px;
  }

  .report-rating-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 16px;
  }

  .report-rating-layout .report-table-card {
    margin-top: 0;
  }

  .report-rating-summary {
    padding: 25px;
    background: #fff9df;
    border: 1px solid #f4df85;
    border-radius: 10px;
    text-align: center;
  }

  .report-rating-summary span {
    color: #7b6b2e;
    font-size: 10px;
    font-weight: 700;
  }

  .report-rating-value {
    margin: 14px 0;
    color: #0b2946;
    font-size: 29px;
    font-weight: 800;
  }

  .report-rating-summary p {
    margin: 0;
    color: #81764c;
    font-size: 9px;
    line-height: 1.6;
  }

  .report-loading {
    padding: 60px 20px;
    text-align: center;
  }

  .report-spinner {
    width: 35px;
    height: 35px;
    margin: 0 auto 15px;
    border: 4px solid #e8edf1;
    border-top-color: #f6c20d;
    border-radius: 50%;
    animation: report-spin .8s linear infinite;
  }

  .report-loading h3 {
    margin: 0 0 6px;
    color: #0b2946;
    font-size: 14px;
  }

  .report-loading p {
    margin: 0;
    color: #87929c;
    font-size: 10px;
  }

  @keyframes report-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1150px) {
    .report-summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .report-grid-3 {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 850px) {
    .report-grid-2,
    .report-finance-grid,
    .report-rating-layout {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .report-summary-grid,
    .report-mini-summary-grid {
      grid-template-columns: 1fr;
    }

    .report-section-heading {
      flex-direction: column;
    }

    .report-header-actions {
      width: 100%;
      flex-direction: column;
    }

    .report-header-actions button {
      width: 100%;
    }
  }
`;

export default Reports;