import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  CalendarClock,
  ChevronRight,
} from "lucide-react";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

export default function MaintenanceSchedules() {
  const [schedules, setSchedules] = useState([]);

  const [appliances, setAppliances] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [assetType, setAssetType] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    asset_type: "appliance",
    asset_id: "",
    next_service_date: "",
    next_service_mileage: "",
    interval_days: "",
    reminder_enabled: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const scheduleQuery =
        assetType === "appliance" && selectedAsset
          ? `?appliance_id=${selectedAsset}`
          : assetType === "vehicle" && selectedAsset
          ? `?vehicle_id=${selectedAsset}`
          : "";

      const [
        appliancesResponse,
        vehiclesResponse,
        schedulesResponse,
      ] = await Promise.all([
        api.get("/appliances"),
        api.get("/vehicles"),
        api.get(`/maintenance-schedules${scheduleQuery}`),
      ]);

      setAppliances(
        appliancesResponse.data?.data || []
      );

      setVehicles(vehiclesResponse.data?.data || []);

      setSchedules(
        schedulesResponse.data?.data || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load maintenance schedules."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetType, selectedAsset]);

  const openAdd = () => {
    setEditingSchedule(null);

    setForm({
      asset_type: "appliance",
      asset_id: appliances[0]?.id || "",
      next_service_date: "",
      next_service_mileage: "",
      interval_days: "",
      reminder_enabled: true,
    });

    setShowForm(true);
  };

  const openEdit = (schedule) => {
    setEditingSchedule(schedule);

    setForm({
      asset_type: schedule.vehicle_id
        ? "vehicle"
        : "appliance",
      asset_id:
        schedule.vehicle_id ||
        schedule.appliance_id ||
        "",
      next_service_date:
        schedule.next_service_date || "",
      next_service_mileage:
        schedule.next_service_mileage || "",
      interval_days: schedule.interval_days || "",
      reminder_enabled:
        schedule.reminder_enabled ?? true,
    });

    setShowForm(true);
  };

  const saveSchedule = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        appliance_id:
          form.asset_type === "appliance"
            ? Number(form.asset_id)
            : null,
        vehicle_id:
          form.asset_type === "vehicle"
            ? Number(form.asset_id)
            : null,
        next_service_date: form.next_service_date,
        next_service_mileage: form.next_service_mileage
          ? Number(form.next_service_mileage)
          : null,
        interval_days: Number(form.interval_days),
        reminder_enabled: Boolean(
          form.reminder_enabled
        ),
      };

      if (editingSchedule) {
        await api.put(
          `/maintenance-schedules/${editingSchedule.id}`,
          payload
        );
      } else {
        await api.post(
          "/maintenance-schedules",
          payload
        );
      }

      setShowForm(false);
      setEditingSchedule(null);

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save maintenance schedule."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteSchedule = async (schedule) => {
    const confirmed = window.confirm(
      "Delete this maintenance schedule?"
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/maintenance-schedules/${schedule.id}`
      );

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete schedule."
      );
    }
  };

  const getAssetName = (schedule) => {
    if (schedule.vehicle_id) {
      const vehicle = vehicles.find(
        (item) => item.id === schedule.vehicle_id
      );

      return vehicle
        ? `${vehicle.brand} ${vehicle.model}`
        : `Vehicle #${schedule.vehicle_id}`;
    }

    const appliance = appliances.find(
      (item) => item.id === schedule.appliance_id
    );

    return (
      appliance?.name ||
      `Appliance #${schedule.appliance_id}`
    );
  };

  const assetOptions =
    form.asset_type === "vehicle" ? vehicles : appliances;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              RECURRING MAINTENANCE
            </span>

            <h1>Maintenance schedules</h1>

            <p>
              Keep recurring appliance and vehicle
              maintenance organized and on time.
            </p>
          </div>

          <button
            className="dashboard-primary-button"
            onClick={openAdd}
          >
            <Plus size={18} />
            Add schedule
          </button>
        </header>

        {error && (
          <div className="form-error">{error}</div>
        )}

        <div className="schedule-filter">
          <label htmlFor="asset-type-filter">
            Asset type
          </label>

          <select
            id="asset-type-filter"
            value={assetType}
            onChange={(event) => {
              setAssetType(event.target.value);
              setSelectedAsset("");
            }}
          >
            <option value="all">All assets</option>
            <option value="appliance">
              Appliances
            </option>
            <option value="vehicle">Vehicles</option>
          </select>

          {assetType !== "all" && (
            <select
              value={selectedAsset}
              onChange={(event) =>
                setSelectedAsset(event.target.value)
              }
            >
              <option value="">
                All{" "}
                {assetType === "vehicle"
                  ? "vehicles"
                  : "appliances"}
              </option>

              {(assetType === "vehicle"
                ? vehicles
                : appliances
              ).map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {assetType === "vehicle"
                    ? `${asset.brand} ${asset.model}`
                    : asset.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="dashboard-loading">
            Loading schedules...
          </div>
        ) : schedules.length === 0 ? (
          <div className="empty-card">
            <CalendarClock size={30} />

            <h3>No maintenance schedules</h3>

            <p>
              Create a recurring schedule for one of
              your appliances, or register a vehicle to
              have one generated automatically.
            </p>

            <button
              className="dashboard-primary-button"
              onClick={openAdd}
            >
              <Plus size={17} />
              Create schedule
            </button>
          </div>
        ) : (
          <div className="schedule-list">
            {schedules.map((schedule) => (
              <article
                key={schedule.id}
                className="schedule-card"
              >
                <div className="schedule-icon">
                  <CalendarClock size={22} />
                </div>

                <div className="schedule-content">
                  <span>{getAssetName(schedule)}</span>

                  <h2>Next service</h2>

                  <p>
                    {schedule.next_service_date ||
                      "Not scheduled"}
                    {schedule.next_service_mileage
                      ? ` \u00b7 ${schedule.next_service_mileage} km`
                      : ""}
                  </p>
                </div>

                <div className="schedule-meta">
                  <strong>
                    Every{" "}
                    {schedule.interval_days || "—"}{" "}
                    days
                  </strong>

                  <span>
                    {schedule.reminder_enabled
                      ? "Reminders enabled"
                      : "Reminders disabled"}
                  </span>
                </div>

                <div className="schedule-actions">
                  <button
                    type="button"
                    onClick={() => openEdit(schedule)}
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    className="delete-action"
                    onClick={() =>
                      deleteSchedule(schedule)
                    }
                  >
                    <Trash2 size={16} />
                  </button>

                  <ChevronRight size={17} />
                </div>
              </article>
            ))}
          </div>
        )}

        {showForm && (
          <div className="modal-backdrop">
            <div className="appliance-modal">
              <div className="modal-header">
                <div>
                  <span className="eyebrow">
                    MAINTENANCE SCHEDULE
                  </span>

                  <h2>
                    {editingSchedule
                      ? "Edit schedule"
                      : "Create schedule"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setShowForm(false)}
                >
                  ×
                </button>
              </div>

              <form
                className="auth-form"
                onSubmit={saveSchedule}
              >
                <label>Asset type</label>

                <select
                  value={form.asset_type}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      asset_type: event.target.value,
                      asset_id: "",
                    })
                  }
                  disabled={Boolean(editingSchedule)}
                >
                  <option value="appliance">
                    Appliance
                  </option>
                  <option value="vehicle">
                    Vehicle
                  </option>
                </select>

                <label>
                  {form.asset_type === "vehicle"
                    ? "Vehicle"
                    : "Appliance"}
                </label>

                <select
                  value={form.asset_id}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      asset_id: event.target.value,
                    })
                  }
                  required
                >
                  <option value="">
                    Select{" "}
                    {form.asset_type === "vehicle"
                      ? "vehicle"
                      : "appliance"}
                  </option>

                  {assetOptions.map((asset) => (
                    <option
                      key={asset.id}
                      value={asset.id}
                    >
                      {form.asset_type === "vehicle"
                        ? `${asset.brand} ${asset.model}`
                        : asset.name}
                    </option>
                  ))}
                </select>

                <label>Next service date</label>

                <input
                  type="date"
                  value={form.next_service_date}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      next_service_date:
                        event.target.value,
                    })
                  }
                  required
                />

                <label>Interval (days)</label>

                <input
                  type="number"
                  min="1"
                  value={form.interval_days}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      interval_days: event.target.value,
                    })
                  }
                  required
                />

                <label>
                  Next service mileage
                  <span className="optional-label">
                    {" "}
                    (optional)
                  </span>
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.next_service_mileage}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      next_service_mileage:
                        event.target.value,
                    })
                  }
                />

                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={form.reminder_enabled}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        reminder_enabled:
                          event.target.checked,
                      })
                    }
                  />
                  Enable reminders
                </label>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowForm(false)}
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
                      : editingSchedule
                      ? "Save changes"
                      : "Create schedule"}
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
