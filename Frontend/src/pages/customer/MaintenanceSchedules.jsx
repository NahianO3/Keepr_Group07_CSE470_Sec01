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
  const [schedules, setSchedules] =
    useState([]);

  const [appliances, setAppliances] =
    useState([]);

  const [selectedAppliance, setSelectedAppliance] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingSchedule, setEditingSchedule] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] = useState({
    appliance_id: "",
    next_service_date: "",
    next_service_mileage: "",
    interval_days: "",
    reminder_enabled: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        appliancesResponse,
        schedulesResponse,
      ] = await Promise.all([
        api.get("/appliances"),
        api.get(
          selectedAppliance
            ? `/maintenance-schedules?appliance_id=${selectedAppliance}`
            : "/maintenance-schedules"
        ),
      ]);

      setAppliances(
        appliancesResponse.data?.data || []
      );

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
  }, [selectedAppliance]);

  const openAdd = () => {
    setEditingSchedule(null);

    setForm({
      appliance_id:
        selectedAppliance ||
        appliances[0]?.id ||
        "",
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
      appliance_id: schedule.appliance_id || "",
      next_service_date:
        schedule.next_service_date || "",
      next_service_mileage:
        schedule.next_service_mileage || "",
      interval_days:
        schedule.interval_days || "",
      reminder_enabled:
        schedule.reminder_enabled ??
        true,
    });

    setShowForm(true);
  };

  const saveSchedule = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        appliance_id: Number(
          form.appliance_id
        ),
        next_service_date:
          form.next_service_date,
        next_service_mileage:
          form.next_service_mileage
            ? Number(
                form.next_service_mileage
              )
            : null,
        interval_days: Number(
          form.interval_days
        ),
        reminder_enabled:
          Boolean(
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

  const getApplianceName = (id) => {
    const appliance = appliances.find(
      (item) => item.id === id
    );

    return (
      appliance?.name ||
      `Appliance #${id}`
    );
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              RECURRING MAINTENANCE
            </span>

            <h1>
              Maintenance schedules
            </h1>

            <p>
              Keep recurring appliance maintenance
              organized and on time.
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
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="schedule-filter">
          <label htmlFor="appliance-filter">
            Filter by appliance
          </label>

          <select
            id="appliance-filter"
            value={selectedAppliance}
            onChange={(event) =>
              setSelectedAppliance(
                event.target.value
              )
            }
          >
            <option value="">
              All appliances
            </option>

            {appliances.map((appliance) => (
              <option
                key={appliance.id}
                value={appliance.id}
              >
                {appliance.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="dashboard-loading">
            Loading schedules...
          </div>
        ) : schedules.length === 0 ? (
          <div className="empty-card">
            <CalendarClock size={30} />

            <h3>
              No maintenance schedules
            </h3>

            <p>
              Create a recurring schedule for one
              of your appliances.
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
                  <span>
                    {getApplianceName(
                      schedule.appliance_id
                    )}
                  </span>

                  <h2>
                    Next service
                  </h2>

                  <p>
                    {schedule.next_service_date ||
                      "Not scheduled"}
                  </p>
                </div>

                <div className="schedule-meta">
                  <strong>
                    Every{" "}
                    {schedule.interval_days ||
                      "—"}{" "}
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
                    onClick={() =>
                      openEdit(schedule)
                    }
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    className="delete-action"
                    onClick={() =>
                      deleteSchedule(
                        schedule
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </button>

                  <ChevronRight
                    size={17}
                  />
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
                  onClick={() =>
                    setShowForm(false)
                  }
                >
                  ×
                </button>
              </div>

              <form
                className="auth-form"
                onSubmit={saveSchedule}
              >
                <label>
                  Appliance
                </label>

                <select
                  value={form.appliance_id}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      appliance_id:
                        event.target.value,
                    })
                  }
                  required
                >
                  <option value="">
                    Select appliance
                  </option>

                  {appliances.map(
                    (appliance) => (
                      <option
                        key={appliance.id}
                        value={appliance.id}
                      >
                        {appliance.name}
                      </option>
                    )
                  )}
                </select>

                <label>
                  Next service date
                </label>

                <input
                  type="date"
                  value={
                    form.next_service_date
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      next_service_date:
                        event.target.value,
                    })
                  }
                  required
                />

                <label>
                  Interval (days)
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    form.interval_days
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      interval_days:
                        event.target.value,
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
                  value={
                    form.next_service_mileage
                  }
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
                    checked={
                      form.reminder_enabled
                    }
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
                    onClick={() =>
                      setShowForm(false)
                    }
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