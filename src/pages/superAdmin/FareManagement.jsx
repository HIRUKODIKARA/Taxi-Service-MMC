import { useEffect, useMemo, useState } from "react";

function FareManagement() {
  const API_BASE_URL = "http://localhost:5171/api";

  const [activeTab, setActiveTab] = useState("rates");

  const [fareSettings, setFareSettings] = useState([]);
  const [routeDiscounts, setRouteDiscounts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [operationalAreas, setOperationalAreas] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [editingSetting, setEditingSetting] = useState(null);
  const [editingRouteDiscount, setEditingRouteDiscount] = useState(null);
  const [editingOffer, setEditingOffer] = useState(null);

  const emptyRouteDiscount = {
    fromOperationalAreaId: "",
    toOperationalAreaId: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    bothDirections: true,
    status: "ACTIVE",
  };

  const emptyOffer = {
    offerName: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    vehicleTypeId: "",
    fromOperationalAreaId: "",
    toOperationalAreaId: "",
    customerType: "ALL",
    minimumFare: "",
    startAt: "",
    endAt: "",
    status: "INACTIVE",
  };

  const [routeForm, setRouteForm] = useState(emptyRouteDiscount);
  const [offerForm, setOfferForm] = useState(emptyOffer);

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

  const readJson = async (response) => {
    try {
      return await response.json();
    } catch {
      return null;
    }
  };

  const request = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...(options.headers || {}),
      },
    });

    const data = await readJson(response);

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.title ||
          "Unable to complete the requested action."
      );
    }

    return data;
  };

  const loadAll = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      setError("");

      const [
        fareData,
        routeData,
        offerData,
        areaData,
        vehicleData,
      ] = await Promise.all([
        request(`${API_BASE_URL}/fare/admin/settings`),
        request(`${API_BASE_URL}/fare/admin/route-discounts`),
        request(`${API_BASE_URL}/fare/admin/offers`),
        request(`${API_BASE_URL}/OperationalAreas`),
        request(`${API_BASE_URL}/vehicletypes`),
      ]);

      setFareSettings(Array.isArray(fareData) ? fareData : []);
      setRouteDiscounts(Array.isArray(routeData) ? routeData : []);
      setOffers(Array.isArray(offerData) ? offerData : []);
      setOperationalAreas(Array.isArray(areaData) ? areaData : []);
      setVehicleTypes(Array.isArray(vehicleData) ? vehicleData : []);
    } catch (err) {
      setError(err.message || "Unable to load fare management data.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadAll(false);
  }, []);

  const resetAlerts = () => {
    setError("");
    setMessage("");
  };

  const formatMoney = (value) =>
    `Rs. ${Number(value || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDateTime = (value) => {
    if (!value) return "—";

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) return value;

    return parsed.toLocaleString();
  };

  const areaName = (id) => {
    const area = operationalAreas.find(
      (item) => Number(item.operationalAreaId) === Number(id)
    );

    return area?.areaName || `Area #${id}`;
  };

  const vehicleName = (id) => {
    if (!id) return "All Vehicles";

    const vehicle = vehicleTypes.find(
      (item) => Number(item.vehicleTypeId) === Number(id)
    );

    return vehicle?.typeName || `Vehicle #${id}`;
  };

  const visibleFareSettings = useMemo(
    () =>
      [...fareSettings].sort((a, b) =>
        String(a.vehicleTypeName || "").localeCompare(
          String(b.vehicleTypeName || "")
        )
      ),
    [fareSettings]
  );

  const startEditSetting = (setting) => {
    resetAlerts();

    setEditingSetting({
      vehicleTypeId: setting.vehicleTypeId,
      vehicleTypeName: setting.vehicleTypeName,
      baseDistanceKm: String(setting.baseDistanceKm ?? ""),
      baseFare: String(setting.baseFare ?? ""),
      waitingChargePerMinute: String(
        setting.waitingChargePerMinute ?? ""
      ),
      driverPercentage: String(setting.driverPercentage ?? ""),
      mmcPercentage: String(setting.mmcPercentage ?? ""),
      status: setting.status || "ACTIVE",
      waitingGraceMinutes: Number(setting.waitingGraceMinutes ?? 5),
      slabs: (setting.slabs || []).map((slab) => ({
        fareSlabId: slab.fareSlabId,
        fromKm: String(slab.fromKm ?? ""),
        toKm:
          slab.toKm === null || slab.toKm === undefined
            ? ""
            : String(slab.toKm),
        ratePerKm: String(slab.ratePerKm ?? ""),
        sortOrder: Number(slab.sortOrder ?? 0),
        isActive: Boolean(slab.isActive),
      })),
    });
  };

  const cancelEditSetting = () => {
    setEditingSetting(null);
  };

  const addSlabRow = () => {
    if (!editingSetting) return;

    setEditingSetting((previous) => ({
      ...previous,
      slabs: [
        ...previous.slabs,
        {
          fromKm: "",
          toKm: "",
          ratePerKm: "",
          sortOrder: previous.slabs.length + 1,
          isActive: true,
        },
      ],
    }));
  };

  const updateSlab = (index, field, value) => {
    setEditingSetting((previous) => {
      const nextSlabs = previous.slabs.map((slab, slabIndex) =>
        slabIndex === index
          ? {
              ...slab,
              [field]: value,
            }
          : slab
      );

      return {
        ...previous,
        slabs: nextSlabs,
      };
    });
  };

  const removeSlab = (index) => {
    setEditingSetting((previous) => ({
      ...previous,
      slabs: previous.slabs.filter((_, slabIndex) => slabIndex !== index),
    }));
  };

  const saveFareSetting = async () => {
    if (!editingSetting) return;

    try {
      resetAlerts();
      setSaving(true);

      const driverPercentage = Number(editingSetting.driverPercentage);
      const mmcPercentage = Number(editingSetting.mmcPercentage);

      if (
        !Number.isFinite(driverPercentage) ||
        !Number.isFinite(mmcPercentage) ||
        Math.abs(driverPercentage + mmcPercentage - 100) > 0.001
      ) {
        throw new Error(
          "Driver percentage + MMC percentage must equal 100%."
        );
      }

      const payload = {
        baseDistanceKm: Number(editingSetting.baseDistanceKm),
        baseFare: Number(editingSetting.baseFare),
        waitingChargePerMinute: Number(
          editingSetting.waitingChargePerMinute
        ),
        driverPercentage,
        mmcPercentage,
        status: editingSetting.status,
        slabs: editingSetting.slabs.map((slab, index) => ({
          fromKm: Number(slab.fromKm),
          toKm:
            slab.toKm === "" || slab.toKm === null
              ? null
              : Number(slab.toKm),
          ratePerKm: Number(slab.ratePerKm),
          sortOrder: Number(slab.sortOrder || index + 1),
          isActive: Boolean(slab.isActive),
        })),
      };

      const data = await request(
        `${API_BASE_URL}/fare/admin/settings/${editingSetting.vehicleTypeId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      setMessage(
        data?.message || "Fare setting updated successfully."
      );

      setEditingSetting(null);
      await loadAll(true);
    } catch (err) {
      setError(err.message || "Unable to update fare setting.");
    } finally {
      setSaving(false);
    }
  };

  const startEditRouteDiscount = (item) => {
    resetAlerts();
    setEditingRouteDiscount(item.specialRouteDiscountId);

    setRouteForm({
      fromOperationalAreaId: String(item.fromOperationalAreaId),
      toOperationalAreaId: String(item.toOperationalAreaId),
      discountType: item.discountType || "PERCENTAGE",
      discountValue: String(item.discountValue ?? ""),
      bothDirections: Boolean(item.bothDirections),
      status: item.status || "ACTIVE",
    });
  };

  const resetRouteForm = () => {
    setEditingRouteDiscount(null);
    setRouteForm(emptyRouteDiscount);
  };

  const saveRouteDiscount = async (event) => {
    event.preventDefault();

    try {
      resetAlerts();
      setSaving(true);

      const payload = {
        fromOperationalAreaId: Number(
          routeForm.fromOperationalAreaId
        ),
        toOperationalAreaId: Number(
          routeForm.toOperationalAreaId
        ),
        discountType: routeForm.discountType,
        discountValue: Number(routeForm.discountValue),
        bothDirections: routeForm.bothDirections,
        status: routeForm.status,
      };

      const url = editingRouteDiscount
        ? `${API_BASE_URL}/fare/admin/route-discounts/${editingRouteDiscount}`
        : `${API_BASE_URL}/fare/admin/route-discounts`;

      const data = await request(url, {
        method: editingRouteDiscount ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      setMessage(
        data?.message ||
          `Route discount ${
            editingRouteDiscount ? "updated" : "created"
          } successfully.`
      );

      resetRouteForm();
      await loadAll(true);
    } catch (err) {
      setError(err.message || "Unable to save route discount.");
    } finally {
      setSaving(false);
    }
  };

  const toggleRouteDiscount = async (id) => {
    try {
      resetAlerts();
      setSaving(true);

      const data = await request(
        `${API_BASE_URL}/fare/admin/route-discounts/${id}/toggle`,
        {
          method: "PUT",
        }
      );

      setMessage(
        data?.message || "Route discount status updated."
      );

      await loadAll(true);
    } catch (err) {
      setError(
        err.message || "Unable to change route discount status."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteRouteDiscount = async (id) => {
    const confirmed = window.confirm(
      "Delete this special route discount?"
    );

    if (!confirmed) return;

    try {
      resetAlerts();
      setSaving(true);

      const data = await request(
        `${API_BASE_URL}/fare/admin/route-discounts/${id}`,
        {
          method: "DELETE",
        }
      );

      setMessage(
        data?.message || "Route discount deleted successfully."
      );

      if (editingRouteDiscount === id) {
        resetRouteForm();
      }

      await loadAll(true);
    } catch (err) {
      setError(err.message || "Unable to delete route discount.");
    } finally {
      setSaving(false);
    }
  };

  const startEditOffer = (item) => {
    resetAlerts();
    setEditingOffer(item.offerId);

    setOfferForm({
      offerName: item.offerName || "",
      description: item.description || "",
      discountType: item.discountType || "PERCENTAGE",
      discountValue: String(item.discountValue ?? ""),
      vehicleTypeId:
        item.vehicleTypeId === null || item.vehicleTypeId === undefined
          ? ""
          : String(item.vehicleTypeId),
      fromOperationalAreaId:
        item.fromOperationalAreaId === null ||
        item.fromOperationalAreaId === undefined
          ? ""
          : String(item.fromOperationalAreaId),
      toOperationalAreaId:
        item.toOperationalAreaId === null ||
        item.toOperationalAreaId === undefined
          ? ""
          : String(item.toOperationalAreaId),
      customerType: item.customerType || "ALL",
      minimumFare:
        item.minimumFare === null || item.minimumFare === undefined
          ? ""
          : String(item.minimumFare),
      startAt: item.startAt
        ? new Date(item.startAt).toISOString().slice(0, 16)
        : "",
      endAt: item.endAt
        ? new Date(item.endAt).toISOString().slice(0, 16)
        : "",
      status: item.status || "INACTIVE",
    });
  };

  const resetOfferForm = () => {
    setEditingOffer(null);
    setOfferForm(emptyOffer);
  };

  const saveOffer = async (event) => {
    event.preventDefault();

    try {
      resetAlerts();
      setSaving(true);

      const payload = {
        offerName: offerForm.offerName.trim(),
        description: offerForm.description.trim() || null,
        discountType: offerForm.discountType,
        discountValue: Number(offerForm.discountValue),
        vehicleTypeId: offerForm.vehicleTypeId
          ? Number(offerForm.vehicleTypeId)
          : null,
        fromOperationalAreaId:
          offerForm.fromOperationalAreaId
            ? Number(offerForm.fromOperationalAreaId)
            : null,
        toOperationalAreaId: offerForm.toOperationalAreaId
          ? Number(offerForm.toOperationalAreaId)
          : null,
        customerType: offerForm.customerType || "ALL",
        minimumFare:
          offerForm.minimumFare === ""
            ? null
            : Number(offerForm.minimumFare),
        startAt: offerForm.startAt
          ? new Date(offerForm.startAt).toISOString()
          : null,
        endAt: offerForm.endAt
          ? new Date(offerForm.endAt).toISOString()
          : null,
        status: offerForm.status,
      };

      const url = editingOffer
        ? `${API_BASE_URL}/fare/admin/offers/${editingOffer}`
        : `${API_BASE_URL}/fare/admin/offers`;

      const data = await request(url, {
        method: editingOffer ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      setMessage(
        data?.message ||
          `Offer ${
            editingOffer ? "updated" : "created"
          } successfully.`
      );

      resetOfferForm();
      await loadAll(true);
    } catch (err) {
      setError(err.message || "Unable to save offer.");
    } finally {
      setSaving(false);
    }
  };

  const toggleOffer = async (id) => {
    try {
      resetAlerts();
      setSaving(true);

      const data = await request(
        `${API_BASE_URL}/fare/admin/offers/${id}/toggle`,
        {
          method: "PUT",
        }
      );

      setMessage(data?.message || "Offer status updated.");
      await loadAll(true);
    } catch (err) {
      setError(err.message || "Unable to change offer status.");
    } finally {
      setSaving(false);
    }
  };

  const deleteOffer = async (id) => {
    const confirmed = window.confirm("Delete this offer?");

    if (!confirmed) return;

    try {
      resetAlerts();
      setSaving(true);

      const data = await request(
        `${API_BASE_URL}/fare/admin/offers/${id}`,
        {
          method: "DELETE",
        }
      );

      setMessage(data?.message || "Offer deleted successfully.");

      if (editingOffer === id) {
        resetOfferForm();
      }

      await loadAll(true);
    } catch (err) {
      setError(err.message || "Unable to delete offer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        .fare-admin-page {
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .fare-admin-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 20px;
        }

        .fare-admin-header h1 {
          margin: 0 0 6px;
          color: #0b2946;
          font-size: 28px;
        }

        .fare-admin-header p {
          margin: 0;
          color: #7b8794;
          font-size: 11px;
          line-height: 1.6;
        }

        .fare-refresh-btn {
          border: 1px solid #0b2946;
          border-radius: 7px;
          padding: 9px 13px;
          background: white;
          color: #0b2946;
          font-size: 9px;
          font-weight: 800;
          cursor: pointer;
        }

        .fare-alert {
          margin-bottom: 16px;
          padding: 12px 14px;
          border-radius: 7px;
          font-size: 10px;
          line-height: 1.5;
        }

        .fare-alert.error {
          background: #fff1f1;
          border: 1px solid #efc8c8;
          color: #a43c3c;
        }

        .fare-alert.success {
          background: #e7f6eb;
          border: 1px solid #cae8d2;
          color: #18763a;
        }

        .fare-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 18px;
        }

        .fare-tabs button {
          border: 1px solid #d7dfe5;
          border-radius: 20px;
          padding: 8px 13px;
          background: white;
          color: #61717f;
          font-size: 9px;
          font-weight: 700;
          cursor: pointer;
        }

        .fare-tabs button.active {
          background: #f6c20d;
          border-color: #f6c20d;
          color: #0b2946;
        }

        .fare-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .fare-card,
        .fare-form-card,
        .fare-list-card {
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 10px;
          padding: 18px;
        }

        .fare-card h2,
        .fare-form-card h2,
        .fare-list-card h2 {
          margin: 0 0 14px;
          color: #0b2946;
          font-size: 15px;
        }

        .fare-badge {
          display: inline-block;
          padding: 5px 8px;
          border-radius: 20px;
          font-size: 8px;
          font-weight: 800;
        }

        .fare-badge.active {
          background: #e7f6eb;
          color: #18763a;
        }

        .fare-badge.inactive {
          background: #edf0f3;
          color: #6d7882;
        }

        .fare-value-row {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 9px 0;
          border-bottom: 1px solid #edf0f3;
        }

        .fare-value-row span {
          color: #8a959f;
          font-size: 9px;
        }

        .fare-value-row strong {
          color: #0b2946;
          font-size: 10px;
          text-align: right;
        }

        .slab-list {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #edf0f3;
        }

        .slab-list h3 {
          margin: 0 0 8px;
          color: #0b2946;
          font-size: 10px;
        }

        .slab-item {
          padding: 8px 10px;
          margin-bottom: 6px;
          border-radius: 6px;
          background: #f8fafc;
          color: #53616e;
          font-size: 9px;
        }

        .fare-edit-btn,
        .fare-primary-btn,
        .fare-secondary-btn,
        .fare-danger-btn,
        .fare-toggle-btn {
          border: none;
          border-radius: 6px;
          padding: 9px 12px;
          font-size: 9px;
          font-weight: 800;
          cursor: pointer;
        }

        .fare-edit-btn,
        .fare-primary-btn {
          background: #0b2946;
          color: white;
        }

        .fare-edit-btn {
          width: 100%;
          margin-top: 13px;
        }

        .fare-secondary-btn {
          background: #edf0f3;
          color: #53616e;
        }

        .fare-danger-btn {
          background: #fde8e8;
          color: #a43c3c;
        }

        .fare-toggle-btn {
          background: #fff4c7;
          color: #6f5700;
        }

        .fare-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .fare-field {
          display: flex;
          flex-direction: column;
        }

        .fare-field.full {
          grid-column: 1 / -1;
        }

        .fare-field label {
          margin-bottom: 5px;
          color: #0b2946;
          font-size: 9px;
          font-weight: 700;
        }

        .fare-field input,
        .fare-field select,
        .fare-field textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 11px;
          border: 1px solid #d9e0e6;
          border-radius: 6px;
          color: #53616e;
          background: white;
          font-size: 10px;
          outline: none;
        }

        .fare-field textarea {
          min-height: 80px;
          resize: vertical;
        }

        .fare-form-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .fare-note {
          margin-top: 12px;
          padding: 11px 12px;
          border-radius: 7px;
          background: #eef6ff;
          color: #60758a;
          font-size: 9px;
          line-height: 1.6;
        }

        .fare-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(3, 20, 36, 0.6);
        }

        .fare-modal {
          width: 100%;
          max-width: 760px;
          max-height: 92vh;
          overflow-y: auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 18px 45px rgba(0,0,0,.2);
        }

        .fare-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 18px 20px;
          background: #0b2946;
          color: white;
          border-radius: 12px 12px 0 0;
        }

        .fare-modal-header h2 {
          margin: 0;
          font-size: 16px;
        }

        .fare-modal-close {
          border: none;
          background: transparent;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }

        .fare-modal-body {
          padding: 20px;
        }

        .fare-slab-editor {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #edf0f3;
        }

        .fare-slab-editor h3 {
          margin: 0 0 10px;
          color: #0b2946;
          font-size: 12px;
        }

        .fare-slab-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr .7fr auto;
          gap: 8px;
          align-items: end;
          margin-bottom: 8px;
        }

        .fare-slab-row label {
          display: block;
          margin-bottom: 4px;
          color: #7b8794;
          font-size: 8px;
        }

        .fare-slab-row input {
          width: 100%;
          box-sizing: border-box;
          padding: 9px;
          border: 1px solid #d9e0e6;
          border-radius: 6px;
          font-size: 9px;
        }

        .fare-list-layout {
          display: grid;
          grid-template-columns: .95fr 1.35fr;
          gap: 16px;
        }

        .fare-table-wrapper {
          overflow-x: auto;
        }

        .fare-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
        }

        .fare-table th {
          padding: 11px;
          background: #0b2946;
          color: white;
          text-align: left;
          font-size: 8px;
        }

        .fare-table td {
          padding: 11px;
          border-bottom: 1px solid #edf0f3;
          color: #53616e;
          font-size: 9px;
          vertical-align: top;
        }

        .fare-action-row {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }

        .fare-loading {
          padding: 35px;
          text-align: center;
          color: #7b8794;
          font-size: 11px;
        }

        @media(max-width: 1000px) {
          .fare-grid {
            grid-template-columns: 1fr;
          }

          .fare-list-layout {
            grid-template-columns: 1fr;
          }
        }

        @media(max-width: 650px) {
          .fare-admin-page {
            padding: 18px;
          }

          .fare-form-grid,
          .fare-slab-row {
            grid-template-columns: 1fr;
          }

          .fare-field.full {
            grid-column: auto;
          }
        }
      `}</style>

      <main className="fare-admin-page">
        <div className="fare-admin-header">
          <div>
            <h1>Fare Management</h1>
            <p>
              Manage vehicle rates, waiting charges, revenue sharing,
              route discounts and future customer offers.
            </p>
          </div>

          <button
            type="button"
            className="fare-refresh-btn"
            onClick={() => loadAll(false)}
          >
            ↻ Refresh
          </button>
        </div>

        {error && <div className="fare-alert error">{error}</div>}
        {message && (
          <div className="fare-alert success">{message}</div>
        )}

        <div className="fare-tabs">
          <button
            type="button"
            className={activeTab === "rates" ? "active" : ""}
            onClick={() => setActiveTab("rates")}
          >
            Vehicle Fare Rates
          </button>

          <button
            type="button"
            className={activeTab === "routes" ? "active" : ""}
            onClick={() => setActiveTab("routes")}
          >
            Special Route Discounts
          </button>

          <button
            type="button"
            className={activeTab === "offers" ? "active" : ""}
            onClick={() => setActiveTab("offers")}
          >
            Offers
          </button>
        </div>

        {loading ? (
          <div className="fare-list-card">
            <div className="fare-loading">
              Loading fare management data...
            </div>
          </div>
        ) : (
          <>
            {activeTab === "rates" && (
              <>
                <div className="fare-note" style={{ marginBottom: 16 }}>
                  <strong>Waiting rule:</strong> the first 5 completed
                  waiting minutes are free. Waiting charges start from
                  minute 6. Driver percentage + MMC percentage must
                  always equal 100%.
                </div>

                <div className="fare-grid">
                  {visibleFareSettings.map((setting) => (
                    <section
                      className="fare-card"
                      key={setting.fareSettingId}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          alignItems: "center",
                          marginBottom: 10,
                        }}
                      >
                        <h2 style={{ margin: 0 }}>
                          {setting.vehicleTypeName}
                        </h2>

                        <span
                          className={`fare-badge ${
                            setting.status === "ACTIVE"
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {setting.status}
                        </span>
                      </div>

                      <div className="fare-value-row">
                        <span>Base Distance</span>
                        <strong>
                          {Number(setting.baseDistanceKm || 0).toFixed(2)} km
                        </strong>
                      </div>

                      <div className="fare-value-row">
                        <span>Base Fare</span>
                        <strong>{formatMoney(setting.baseFare)}</strong>
                      </div>

                      <div className="fare-value-row">
                        <span>Waiting Grace Period</span>
                        <strong>
                          {setting.waitingGraceMinutes ?? 5} min FREE
                        </strong>
                      </div>

                      <div className="fare-value-row">
                        <span>Waiting Charge</span>
                        <strong>
                          {formatMoney(
                            setting.waitingChargePerMinute
                          )}{" "}
                          / min
                        </strong>
                      </div>

                      <div className="fare-value-row">
                        <span>Driver Share</span>
                        <strong>
                          {Number(setting.driverPercentage || 0).toFixed(
                            2
                          )}
                          %
                        </strong>
                      </div>

                      <div className="fare-value-row">
                        <span>MMC Share</span>
                        <strong>
                          {Number(setting.mmcPercentage || 0).toFixed(
                            2
                          )}
                          %
                        </strong>
                      </div>

                      <div className="slab-list">
                        <h3>Distance Slabs</h3>

                        {(setting.slabs || []).length === 0 ? (
                          <div className="slab-item">
                            No additional distance slabs.
                          </div>
                        ) : (
                          (setting.slabs || []).map((slab) => (
                            <div
                              className="slab-item"
                              key={slab.fareSlabId}
                            >
                              {slab.fromKm} km →{" "}
                              {slab.toKm ?? "Above"} km ·{" "}
                              {formatMoney(slab.ratePerKm)}/km ·{" "}
                              {slab.isActive ? "Active" : "Inactive"}
                            </div>
                          ))
                        )}
                      </div>

                      <button
                        type="button"
                        className="fare-edit-btn"
                        onClick={() => startEditSetting(setting)}
                      >
                        Edit Fare Setting
                      </button>
                    </section>
                  ))}
                </div>
              </>
            )}

            {activeTab === "routes" && (
              <div className="fare-list-layout">
                <section className="fare-form-card">
                  <h2>
                    {editingRouteDiscount
                      ? "Edit Route Discount"
                      : "Add Route Discount"}
                  </h2>

                  <form onSubmit={saveRouteDiscount}>
                    <div className="fare-form-grid">
                      <div className="fare-field">
                        <label>From Area</label>
                        <select
                          required
                          value={routeForm.fromOperationalAreaId}
                          onChange={(e) =>
                            setRouteForm((previous) => ({
                              ...previous,
                              fromOperationalAreaId: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select area</option>
                          {operationalAreas.map((area) => (
                            <option
                              key={area.operationalAreaId}
                              value={area.operationalAreaId}
                            >
                              {area.areaName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="fare-field">
                        <label>To Area</label>
                        <select
                          required
                          value={routeForm.toOperationalAreaId}
                          onChange={(e) =>
                            setRouteForm((previous) => ({
                              ...previous,
                              toOperationalAreaId: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select area</option>
                          {operationalAreas.map((area) => (
                            <option
                              key={area.operationalAreaId}
                              value={area.operationalAreaId}
                            >
                              {area.areaName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="fare-field">
                        <label>Discount Type</label>
                        <select
                          value={routeForm.discountType}
                          onChange={(e) =>
                            setRouteForm((previous) => ({
                              ...previous,
                              discountType: e.target.value,
                            }))
                          }
                        >
                          <option value="PERCENTAGE">
                            Percentage
                          </option>
                          <option value="FIXED">Fixed Amount</option>
                        </select>
                      </div>

                      <div className="fare-field">
                        <label>Discount Value</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={routeForm.discountValue}
                          onChange={(e) =>
                            setRouteForm((previous) => ({
                              ...previous,
                              discountValue: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="fare-field">
                        <label>Both Directions</label>
                        <select
                          value={
                            routeForm.bothDirections ? "YES" : "NO"
                          }
                          onChange={(e) =>
                            setRouteForm((previous) => ({
                              ...previous,
                              bothDirections:
                                e.target.value === "YES",
                            }))
                          }
                        >
                          <option value="YES">Yes</option>
                          <option value="NO">No</option>
                        </select>
                      </div>

                      <div className="fare-field">
                        <label>Status</label>
                        <select
                          value={routeForm.status}
                          onChange={(e) =>
                            setRouteForm((previous) => ({
                              ...previous,
                              status: e.target.value,
                            }))
                          }
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="fare-form-actions">
                      <button
                        className="fare-primary-btn"
                        type="submit"
                        disabled={saving}
                      >
                        {saving
                          ? "Saving..."
                          : editingRouteDiscount
                          ? "Update Discount"
                          : "Add Discount"}
                      </button>

                      {editingRouteDiscount && (
                        <button
                          type="button"
                          className="fare-secondary-btn"
                          onClick={resetRouteForm}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  <div className="fare-note">
                    Route discounts are initially empty. Add only the
                    MMC route pairs approved by the Super Admin.
                  </div>
                </section>

                <section className="fare-list-card">
                  <h2>Configured Route Discounts</h2>

                  <div className="fare-table-wrapper">
                    <table className="fare-table">
                      <thead>
                        <tr>
                          <th>Route</th>
                          <th>Discount</th>
                          <th>Directions</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {routeDiscounts.length === 0 ? (
                          <tr>
                            <td colSpan="5">
                              No route discounts have been added yet.
                            </td>
                          </tr>
                        ) : (
                          routeDiscounts.map((item) => (
                            <tr
                              key={item.specialRouteDiscountId}
                            >
                              <td>
                                {item.fromAreaName ||
                                  areaName(
                                    item.fromOperationalAreaId
                                  )}{" "}
                                →{" "}
                                {item.toAreaName ||
                                  areaName(
                                    item.toOperationalAreaId
                                  )}
                              </td>

                              <td>
                                {item.discountType === "PERCENTAGE"
                                  ? `${item.discountValue}%`
                                  : formatMoney(item.discountValue)}
                              </td>

                              <td>
                                {item.bothDirections
                                  ? "Both directions"
                                  : "One direction"}
                              </td>

                              <td>
                                <span
                                  className={`fare-badge ${
                                    item.status === "ACTIVE"
                                      ? "active"
                                      : "inactive"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>

                              <td>
                                <div className="fare-action-row">
                                  <button
                                    type="button"
                                    className="fare-secondary-btn"
                                    onClick={() =>
                                      startEditRouteDiscount(item)
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="fare-toggle-btn"
                                    onClick={() =>
                                      toggleRouteDiscount(
                                        item.specialRouteDiscountId
                                      )
                                    }
                                  >
                                    {item.status === "ACTIVE"
                                      ? "Deactivate"
                                      : "Activate"}
                                  </button>

                                  <button
                                    type="button"
                                    className="fare-danger-btn"
                                    onClick={() =>
                                      deleteRouteDiscount(
                                        item.specialRouteDiscountId
                                      )
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "offers" && (
              <div className="fare-list-layout">
                <section className="fare-form-card">
                  <h2>
                    {editingOffer ? "Edit Offer" : "Add Offer"}
                  </h2>

                  <form onSubmit={saveOffer}>
                    <div className="fare-form-grid">
                      <div className="fare-field full">
                        <label>Offer Name</label>
                        <input
                          required
                          value={offerForm.offerName}
                          onChange={(e) =>
                            setOfferForm((previous) => ({
                              ...previous,
                              offerName: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="fare-field full">
                        <label>Description</label>
                        <textarea
                          value={offerForm.description}
                          onChange={(e) =>
                            setOfferForm((previous) => ({
                              ...previous,
                              description: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="fare-field">
                        <label>Discount Type</label>
                        <select
                          value={offerForm.discountType}
                          onChange={(e) =>
                            setOfferForm((previous) => ({
                              ...previous,
                              discountType: e.target.value,
                            }))
                          }
                        >
                          <option value="PERCENTAGE">
                            Percentage
                          </option>
                          <option value="FIXED">Fixed Amount</option>
                        </select>
                      </div>

                      <div className="fare-field">
                        <label>Discount Value</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={offerForm.discountValue}
                          onChange={(e) =>
                            setOfferForm((previous) => ({
                              ...previous,
                              discountValue: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="fare-field">
                        <label>Vehicle</label>
                        <select
                          value={offerForm.vehicleTypeId}
                          onChange={(e) =>
                            setOfferForm((previous) => ({
                              ...previous,
                              vehicleTypeId: e.target.value,
                            }))
                          }
                        >
                          <option value="">All Vehicles</option>
                          {vehicleTypes.map((vehicle) => (
                            <option
                              key={vehicle.vehicleTypeId}
                              value={vehicle.vehicleTypeId}
                            >
                              {vehicle.typeName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="fare-field">
                        <label>Customer Type</label>
                        <select
                          value={offerForm.customerType}
                          onChange={(e) =>
                            setOfferForm((previous) => ({
                              ...previous,
                              customerType: e.target.value,
                            }))
                          }
                        >
                          <option value="ALL">All Customers</option>
                          <option value="DAILY">
                            Daily Customers
                          </option>
                          <option value="SELECTED">
                            Selected Customers
                          </option>
                        </select>
                      </div>

                      <div className="fare-field">
                        <label>From Area (Optional)</label>
                        <select
                          value={offerForm.fromOperationalAreaId}
                          onChange={(e) =>
                            setOfferForm((previous) => ({
                              ...previous,
                              fromOperationalAreaId:
                                e.target.value,
                            }))
                          }
                        >
                          <option value="">All / Any Area</option>
                          {operationalAreas.map((area) => (
                            <option
                              key={area.operationalAreaId}
                              value={area.operationalAreaId}
                            >
                              {area.areaName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="fare-field">
                        <label>To Area (Optional)</label>
                        <select
                          value={offerForm.toOperationalAreaId}
                          onChange={(e) =>
                            setOfferForm((previous) => ({
                              ...previous,
                              toOperationalAreaId: e.target.value,
                            }))
                          }
                        >
                          <option value="">All / Any Area</option>
                          {operationalAreas.map((area) => (
                            <option
                              key={area.operationalAreaId}
                              value={area.operationalAreaId}
                            >
                              {area.areaName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="fare-field">
                        <label>Minimum Fare (Optional)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={offerForm.minimumFare}
                          onChange={(e) =>
                            setOfferForm((previous) => ({
                              ...previous,
                              minimumFare: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="fare-field">
                        <label>Status</label>
                        <select
                          value={offerForm.status}
                          onChange={(e) =>
                            setOfferForm((previous) => ({
                              ...previous,
                              status: e.target.value,
                            }))
                          }
                        >
                          <option value="INACTIVE">Inactive</option>
                          <option value="ACTIVE">Active</option>
                        </select>
                      </div>

                      <div className="fare-field">
                        <label>Start Date/Time</label>
                        <input
                          type="datetime-local"
                          value={offerForm.startAt}
                          onChange={(e) =>
                            setOfferForm((previous) => ({
                              ...previous,
                              startAt: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="fare-field">
                        <label>End Date/Time</label>
                        <input
                          type="datetime-local"
                          value={offerForm.endAt}
                          onChange={(e) =>
                            setOfferForm((previous) => ({
                              ...previous,
                              endAt: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="fare-form-actions">
                      <button
                        type="submit"
                        className="fare-primary-btn"
                        disabled={saving}
                      >
                        {saving
                          ? "Saving..."
                          : editingOffer
                          ? "Update Offer"
                          : "Add Offer"}
                      </button>

                      {editingOffer && (
                        <button
                          type="button"
                          className="fare-secondary-btn"
                          onClick={resetOfferForm}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  <div className="fare-note">
                    Offers are managed here but are not yet applied
                    automatically to passenger fares. Eligibility rules
                    will be connected after MMC decides the final offer
                    policy.
                  </div>
                </section>

                <section className="fare-list-card">
                  <h2>Configured Offers</h2>

                  <div className="fare-table-wrapper">
                    <table className="fare-table">
                      <thead>
                        <tr>
                          <th>Offer</th>
                          <th>Discount</th>
                          <th>Applies To</th>
                          <th>Period</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {offers.length === 0 ? (
                          <tr>
                            <td colSpan="6">
                              No offers have been added yet.
                            </td>
                          </tr>
                        ) : (
                          offers.map((item) => (
                            <tr key={item.offerId}>
                              <td>
                                <strong>{item.offerName}</strong>
                                <br />
                                <span>{item.description || "—"}</span>
                              </td>

                              <td>
                                {item.discountType === "PERCENTAGE"
                                  ? `${item.discountValue}%`
                                  : formatMoney(item.discountValue)}
                              </td>

                              <td>
                                {vehicleName(item.vehicleTypeId)}
                                <br />
                                {item.fromOperationalAreaId ||
                                item.toOperationalAreaId
                                  ? `${
                                      item.fromOperationalAreaId
                                        ? areaName(
                                            item.fromOperationalAreaId
                                          )
                                        : "Any"
                                    } → ${
                                      item.toOperationalAreaId
                                        ? areaName(
                                            item.toOperationalAreaId
                                          )
                                        : "Any"
                                    }`
                                  : "All Routes"}
                                <br />
                                {item.customerType || "ALL"}
                              </td>

                              <td>
                                {formatDateTime(item.startAt)}
                                <br />
                                to
                                <br />
                                {formatDateTime(item.endAt)}
                              </td>

                              <td>
                                <span
                                  className={`fare-badge ${
                                    item.status === "ACTIVE"
                                      ? "active"
                                      : "inactive"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>

                              <td>
                                <div className="fare-action-row">
                                  <button
                                    type="button"
                                    className="fare-secondary-btn"
                                    onClick={() => startEditOffer(item)}
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="fare-toggle-btn"
                                    onClick={() =>
                                      toggleOffer(item.offerId)
                                    }
                                  >
                                    {item.status === "ACTIVE"
                                      ? "Deactivate"
                                      : "Activate"}
                                  </button>

                                  <button
                                    type="button"
                                    className="fare-danger-btn"
                                    onClick={() =>
                                      deleteOffer(item.offerId)
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </main>

      {editingSetting && (
        <div
          className="fare-modal-overlay"
          onClick={cancelEditSetting}
        >
          <div
            className="fare-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="fare-modal-header">
              <h2>
                Edit Fare · {editingSetting.vehicleTypeName}
              </h2>

              <button
                type="button"
                className="fare-modal-close"
                onClick={cancelEditSetting}
              >
                ×
              </button>
            </div>

            <div className="fare-modal-body">
              <div className="fare-form-grid">
                <div className="fare-field">
                  <label>Base Distance (km)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingSetting.baseDistanceKm}
                    onChange={(e) =>
                      setEditingSetting((previous) => ({
                        ...previous,
                        baseDistanceKm: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="fare-field">
                  <label>Base Fare (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingSetting.baseFare}
                    onChange={(e) =>
                      setEditingSetting((previous) => ({
                        ...previous,
                        baseFare: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="fare-field">
                  <label>Waiting Grace Period</label>
                  <input
                    value={`${editingSetting.waitingGraceMinutes} minutes FREE`}
                    readOnly
                  />
                </div>

                <div className="fare-field">
                  <label>Waiting Charge / Minute (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingSetting.waitingChargePerMinute}
                    onChange={(e) =>
                      setEditingSetting((previous) => ({
                        ...previous,
                        waitingChargePerMinute: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="fare-field">
                  <label>Driver Share (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editingSetting.driverPercentage}
                    onChange={(e) =>
                      setEditingSetting((previous) => ({
                        ...previous,
                        driverPercentage: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="fare-field">
                  <label>MMC Share (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editingSetting.mmcPercentage}
                    onChange={(e) =>
                      setEditingSetting((previous) => ({
                        ...previous,
                        mmcPercentage: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="fare-field">
                  <label>Status</label>
                  <select
                    value={editingSetting.status}
                    onChange={(e) =>
                      setEditingSetting((previous) => ({
                        ...previous,
                        status: e.target.value,
                      }))
                    }
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="fare-slab-editor">
                <h3>Distance Slabs</h3>

                {editingSetting.slabs.map((slab, index) => (
                  <div
                    className="fare-slab-row"
                    key={`${index}-${slab.fareSlabId || "new"}`}
                  >
                    <div>
                      <label>From km</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={slab.fromKm}
                        onChange={(e) =>
                          updateSlab(
                            index,
                            "fromKm",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div>
                      <label>To km (blank = above)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={slab.toKm}
                        onChange={(e) =>
                          updateSlab(
                            index,
                            "toKm",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div>
                      <label>Rate / km</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={slab.ratePerKm}
                        onChange={(e) =>
                          updateSlab(
                            index,
                            "ratePerKm",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div>
                      <label>Order</label>
                      <input
                        type="number"
                        min="1"
                        value={slab.sortOrder}
                        onChange={(e) =>
                          updateSlab(
                            index,
                            "sortOrder",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <button
                      type="button"
                      className="fare-danger-btn"
                      onClick={() => removeSlab(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="fare-secondary-btn"
                  onClick={addSlabRow}
                >
                  + Add Slab
                </button>
              </div>

              <div className="fare-form-actions">
                <button
                  type="button"
                  className="fare-primary-btn"
                  disabled={saving}
                  onClick={saveFareSetting}
                >
                  {saving ? "Saving..." : "Save Fare Setting"}
                </button>

                <button
                  type="button"
                  className="fare-secondary-btn"
                  onClick={cancelEditSetting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FareManagement;
