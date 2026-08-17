import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Wrench,
  Car,
  Refrigerator,
} from "lucide-react";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

export default function MaintenanceRecords() {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [appliances, setAppliances] = useState([]);

  const [assetType, setAssetType] = useState("all");
  const [maintenanceType, setMaintenanceType] =
    useState("all");
  const [selectedAsset, setSelectedAsset] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState(null);

  const [form, setForm] = useState({
    asset_type: "vehicle",
    asset_id: "",
    maintenance_type: "DIY",
    service_provider_id: "",
    maintenance_date: "",
    work_performed: "",
    cost: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        recordsResponse,
        vehiclesResponse,
        appliancesResponse,
      ] = await Promise.all([
        api.get("/maintenance-records"),
        api.get("/vehicles"),
        api.get("/appliances"),
      ]);

      setRecords(
        recordsResponse.data?.data || []
      );

      setVehicles(
        vehiclesResponse.data?.data || []
      );

      setAppliances(
        appliancesResponse.data?.data || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load maintenance records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getVehicle = (id) =>
    vehicles.find(
      (vehicle) =>
        vehicle.id === Number(id)
    );

  const getAppliance = (id) =>
    appliances.find(
      (appliance) =>
        appliance.id === Number(id)
    );

  const getAssetName = (record) => {
    if (record.vehicle_id) {
      const vehicle = getVehicle(
        record.vehicle_id
      );

      return vehicle
        ? `${vehicle.brand} ${vehicle.model}`
        : `Vehicle #${record.vehicle_id}`;
    }

    if (record.appliance_id) {
      const appliance = getAppliance(
        record.appliance_id
      );

      return appliance?.name ||
        `Appliance #${record.appliance_id}`;
    }

    return "Maintenance record";
  };

  const getAssetType = (record) => {
    if (record.vehicle_id) {
      return "vehicle";
    }

    if (record.appliance_id) {
      return "appliance";
    }

    return "other";
  };

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (
        assetType !== "all" &&
        getAssetType(record) !== assetType
      ) {
        return false;
      }

      if (
        maintenanceType !== "all" &&
        record.maintenance_type !==
          maintenanceType
      ) {
        return false;
      }

      if (selectedAsset) {
        if (assetType === "vehicle") {
          return (
            String(record.vehicle_id) ===
            String(selectedAsset)
          );
        }

        if (assetType === "appliance") {
          return (
            String(record.appliance_id) ===
            String(selectedAsset)
          );
        }
      }

      return true;
    });
  }, [
    records,
    vehicles,
    appliances,
    assetType,
    maintenanceType,
    selectedAsset,
  ]);

  const openAdd = () => {
    setEditingRecord(null);

    setForm({
      asset_type: "vehicle",
      asset_id: vehicles[0]?.id || "",
      maintenance_type: "DIY",
      service_provider_id: "",
      maintenance_date: "",
      work_performed: "",
      cost: "",
    });

    setShowForm(true);
    setError("");
  };

  const openEdit = (record) => {
    setEditingRecord(record);

    setForm({
      asset_type: record.vehicle_id
        ? "vehicle"
        : "appliance",

      asset_id:
        record.vehicle_id ||
        record.appliance_id ||
        "",

      maintenance_type:
        record.maintenance_type || "DIY",

      service_provider_id:
        record.service_provider_id || "",

      maintenance_date:
        record.maintenance_date || "",

      work_performed:
        record.work_performed || "",

      cost:
        record.cost ?? "",
    });

    setShowForm(true);
    setError("");
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingRecord(null);
  };

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const saveRecord = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (!form.asset_id) {
        throw new Error(
          "Please select a vehicle or appliance."
        );
      }

      if (!form.maintenance_date) {
        throw new Error(
          "Maintenance date is required."
        );
      }

      if (!form.work_performed.trim()) {
        throw new Error(
          "Work performed is required."
        );
      }

      if (
        form.maintenance_type === "Mechanic" &&
        !form.service_provider_id
      ) {
        throw new Error(
          "Service provider ID is required for mechanic maintenance."
        );
      }

      const payload = {
        maintenance_date:
          form.maintenance_date,

        maintenance_type:
          form.maintenance_type,

        work_performed:
          form.work_performed.trim(),

        cost:
          form.cost === ""
            ? 0
            : Number(form.cost),
      };

      if (form.asset_type === "vehicle") {
        payload.vehicle_id =
          Number(form.asset_id);
      } else {
        payload.appliance_id =
          Number(form.asset_id);
      }

      if (
        form.maintenance_type ===
        "Mechanic"
      ) {
        payload.service_provider_id =
          Number(
            form.service_provider_id
          );
      }

      if (editingRecord) {
        await api.put(
          `/maintenance-records/${editingRecord.id}`,
          payload
        );
      } else {
        await api.post(
          "/maintenance-records",
          payload
        );
      }

      closeForm();
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to save maintenance record."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (record) => {
    const confirmed = window.confirm(
      "Delete this maintenance record?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/maintenance-records/${record.id}`
      );

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete maintenance record."
      );
    }
  };

  const assetOptions =
    form.asset_type === "vehicle"
      ? vehicles
      : appliances;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              MAINTENANCE RECORDS
            </span>

            <h1>
              Maintenance records
            </h1>

            <p>
              Record DIY work separately from
              maintenance completed by mechanics.
            </p>
          </div>

          <button
            className="dashboard-primary-button"
            onClick={openAdd}
          >
            <Plus size={18} />
            Add maintenance
          </button>
        </header>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        {/* FILTERS */}

        <section className="maintenance-record-filter">
          <div className="form-field">
            <label htmlFor="record-asset-type">
              Asset
            </label>

            <select
              id="record-asset-type"
              value={assetType}
              onChange={(event) => {
                setAssetType(
                  event.target.value
                );
                setSelectedAsset("");
              }}
            >
              <option value="all">
                All assets
              </option>

              <option value="vehicle">
                Vehicles
              </option>

              <option value="appliance">
                Appliances
              </option>
            </select>
          </div>

          {assetType !== "all" && (
            <div className="form-field">
              <label htmlFor="record-asset">
                Specific asset
              </label>

              <select
                id="record-asset"
                value={selectedAsset}
                onChange={(event) =>
                  setSelectedAsset(
                    event.target.value
                  )
                }
              >
                <option value="">
                  All
                </option>

                {(assetType === "vehicle"
                  ? vehicles
                  : appliances
                ).map((asset) => (
                  <option
                    key={asset.id}
                    value={asset.id}
                  >
                    {assetType ===
                    "vehicle"
                      ? `${asset.brand} ${asset.model}`
                      : asset.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="record-type">
              Maintenance type
            </label>

            <select
              id="record-type"
              value={maintenanceType}
              onChange={(event) =>
                setMaintenanceType(
                  event.target.value
                )
              }
            >
              <option value="all">
                All
              </option>

              <option value="DIY">
                DIY
              </option>

              <option value="Mechanic">
                Mechanic
              </option>
            </select>
          </div>
        </section>

        {/* LIST */}

        {loading ? (
          <div className="dashboard-loading">
            Loading maintenance records...
          </div>
        ) : filteredRecords.length ===
          0 ? (
          <div className="empty-card">
            <Wrench size={30} />

            <h3>
              No maintenance records
            </h3>

            <p>
              Record your first DIY or
              mechanic maintenance service.
            </p>

            <button
              className="dashboard-primary-button"
              onClick={openAdd}
            >
              <Plus size={17} />
              Add maintenance
            </button>
          </div>
        ) : (
          <section className="maintenance-record-list">
            {filteredRecords.map(
              (record) => (
                <article
                  className="maintenance-record-card"
                  key={record.id}
                >
                  <div className="maintenance-record-icon">
                    {record.vehicle_id ? (
                      <Car size={21} />
                    ) : (
                      <Refrigerator
                        size={21}
                      />
                    )}
                  </div>

                  <div className="maintenance-record-content">
                    <div className="maintenance-record-top">
                      <div>
                        <span
                          className={
                            record.maintenance_type ===
                            "DIY"
                              ? "maintenance-type-badge maintenance-type-diy"
                              : "maintenance-type-badge maintenance-type-mechanic"
                          }
                        >
                          {
                            record.maintenance_type
                          }
                        </span>

                        <h2>
                          {getAssetName(
                            record
                          )}
                        </h2>
                      </div>

                      <span
                        className={
                          record.status ===
                          "Completed"
                            ? "status-badge status-completed"
                            : "status-badge status-pending"
                        }
                      >
                        {record.status}
                      </span>
                    </div>

                    <p className="maintenance-record-work">
                      {
                        record.work_performed
                      }
                    </p>

                    <div className="maintenance-record-meta">
                      <div>
                        <span>
                          Date
                        </span>

                        <strong>
                          {
                            record.maintenance_date
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Cost
                        </span>

                        <strong>
                          ৳
                          {Number(
                            record.cost ||
                              0
                          ).toLocaleString()}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Provider
                        </span>

                        <strong>
                          {record.service_provider_id
                            ? `Provider #${record.service_provider_id}`
                            : "Self-performed"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="maintenance-record-actions">
                    <button
                      type="button"
                      onClick={() =>
                        openEdit(record)
                      }
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      className="delete-action"
                      onClick={() =>
                        deleteRecord(record)
                      }
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              )
            )}
          </section>
        )}

        {/* FORM */}

        {showForm && (
          <div className="modal-backdrop">
            <div className="appliance-modal">
              <div className="modal-header">
                <div>
                  <span className="eyebrow">
                    MAINTENANCE
                  </span>

                  <h2>
                    {editingRecord
                      ? "Edit maintenance"
                      : "Record maintenance"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={closeForm}
                  disabled={saving}
                >
                  ×
                </button>
              </div>

              <form
                className="auth-form appliance-form"
                onSubmit={saveRecord}
              >
                <div className="form-grid">
                  {/* ASSET TYPE */}

                  <div className="form-field">
                    <label>
                      Asset type
                    </label>

                    <select
                      value={
                        form.asset_type
                      }
                      onChange={(event) => {
                        updateField(
                          "asset_type",
                          event.target.value
                        );

                        updateField(
                          "asset_id",
                          ""
                        );
                      }}
                      disabled={saving}
                    >
                      <option value="vehicle">
                        Vehicle
                      </option>

                      <option value="appliance">
                        Appliance
                      </option>
                    </select>
                  </div>

                  {/* ASSET */}

                  <div className="form-field">
                    <label>
                      {form.asset_type ===
                      "vehicle"
                        ? "Vehicle"
                        : "Appliance"}
                    </label>

                    <select
                      value={
                        form.asset_id
                      }
                      onChange={(event) =>
                        updateField(
                          "asset_id",
                          event.target.value
                        )
                      }
                      disabled={saving}
                      required
                    >
                      <option value="">
                        Select{" "}
                        {form.asset_type}
                      </option>

                      {assetOptions.map(
                        (asset) => (
                          <option
                            key={asset.id}
                            value={asset.id}
                          >
                            {form.asset_type ===
                            "vehicle"
                              ? `${asset.brand} ${asset.model}`
                              : asset.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* TYPE */}

                  <div className="form-field">
                    <label>
                      Maintenance type
                    </label>

                    <select
                      value={
                        form.maintenance_type
                      }
                      onChange={(event) =>
                        updateField(
                          "maintenance_type",
                          event.target.value
                        )
                      }
                      disabled={saving}
                    >
                      <option value="DIY">
                        DIY
                      </option>

                      <option value="Mechanic">
                        Mechanic
                      </option>
                    </select>
                  </div>

                  {/* DATE */}

                  <div className="form-field">
                    <label>
                      Maintenance date
                    </label>

                    <input
                      type="date"
                      value={
                        form.maintenance_date
                      }
                      onChange={(event) =>
                        updateField(
                          "maintenance_date",
                          event.target.value
                        )
                      }
                      disabled={saving}
                      required
                    />
                  </div>

                  {/* PROVIDER */}

                  {form.maintenance_type ===
                    "Mechanic" && (
                    <div className="form-field form-field-full">
                      <label>
                        Service provider ID
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={
                          form.service_provider_id
                        }
                        onChange={(event) =>
                          updateField(
                            "service_provider_id",
                            event.target.value
                          )
                        }
                        disabled={saving}
                        required
                        placeholder="Enter service provider ID"
                      />

                      <small className="field-help">
                        The selected user must have
                        the service_provider role.
                      </small>
                    </div>
                  )}

                  {/* WORK */}

                  <div className="form-field form-field-full">
                    <label>
                      Work performed
                    </label>

                    <textarea
                      rows="4"
                      value={
                        form.work_performed
                      }
                      onChange={(event) =>
                        updateField(
                          "work_performed",
                          event.target.value
                        )
                      }
                      disabled={saving}
                      required
                      placeholder="Describe the maintenance work performed"
                    />
                  </div>

                  {/* COST */}

                  <div className="form-field">
                    <label>
                      Cost
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.cost}
                      onChange={(event) =>
                        updateField(
                          "cost",
                          event.target.value
                        )
                      }
                      disabled={saving}
                      placeholder="0"
                    />
                  </div>
                </div>

                {error && (
                  <div className="form-error">
                    {error}
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={closeForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="dashboard-primary-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingRecord
                      ? "Save changes"
                      : "Record maintenance"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}