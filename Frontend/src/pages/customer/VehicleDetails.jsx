import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Car,
  ShieldCheck,
  CalendarClock,
  Gauge,
  FileCheck,
} from "lucide-react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import VehicleForm from "../../components/VehicleForm";

export default function VehicleDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [vehicle, setVehicle] = useState(null);
  const [schedules, setSchedules] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [mileageInput, setMileageInput] = useState("");
  const [updatingMileage, setUpdatingMileage] =
    useState(false);

  const loadDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const [vehicleResponse, scheduleResponse] =
        await Promise.all([
          api.get(`/vehicles/${id}`),
          api.get(
            `/maintenance-schedules?vehicle_id=${id}`
          ),
        ]);

      setVehicle(vehicleResponse.data?.data || null);
      setSchedules(
        scheduleResponse.data?.data || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load vehicle."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateVehicle = async (form) => {
    try {
      setSaving(true);
      setError("");

      await api.put(`/vehicles/${id}`, form);

      setShowForm(false);

      await loadDetails();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update vehicle."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateMileage = async (event) => {
    event.preventDefault();

    if (!mileageInput) return;

    try {
      setUpdatingMileage(true);
      setError("");

      await api.put(`/vehicles/${id}/mileage`, {
        current_mileage: Number(mileageInput),
      });

      setMileageInput("");

      await loadDetails();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update mileage."
      );
    } finally {
      setUpdatingMileage(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading vehicle...
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="dashboard-layout">
        <Sidebar />

        <main className="dashboard-main">
          <div className="empty-card">
            <h3>Vehicle not found</h3>

            <button
              className="dashboard-primary-button"
              onClick={() => navigate("/vehicles")}
            >
              Back to vehicles
            </button>
          </div>
        </main>
      </div>
    );
  }

  const schedule = schedules[0] || null;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <button
          className="text-button"
          onClick={() => navigate("/vehicles")}
        >
          <ArrowLeft size={16} />
          Back to vehicles
        </button>

        <header className="dashboard-header appliance-detail-header">
          <div>
            <span className="eyebrow">
              VEHICLE DETAILS
            </span>

            <h1>
              {vehicle.brand} {vehicle.model}
            </h1>

            <p>Registered vehicle</p>
          </div>

          <button
            className="dashboard-primary-button"
            onClick={() => setShowForm(true)}
          >
            <Pencil size={17} />
            Edit vehicle
          </button>
        </header>

        {error && (
          <div className="form-error">{error}</div>
        )}

        <section className="dashboard-grid">
          <div className="dashboard-section">
            <div className="section-heading">
              <div>
                <span>PROFILE</span>
                <h2>Vehicle information</h2>
              </div>
            </div>

            <div className="stat-card appliance-detail-info-card">
              <div className="appliance-icon">
                <Car size={25} />
              </div>

              <div className="stat-content">
                <span>{vehicle.brand}</span>

                <strong>{vehicle.model}</strong>

                <small>
                  Current mileage:{" "}
                  {vehicle.current_mileage ?? "—"} km
                </small>
              </div>
            </div>

            <div className="detail-info-list">
              <DetailRow
                label="Purchase date"
                value={vehicle.purchase_date || "—"}
              />

              <DetailRow
                label="Last service mileage"
                value={
                  vehicle.last_service_mileage != null
                    ? `${vehicle.last_service_mileage} km`
                    : "—"
                }
              />

              <DetailRow
                label="Service interval"
                value={
                  vehicle.maintenance_interval_km
                    ? `${vehicle.maintenance_interval_km} km`
                    : "—"
                }
              />

              <DetailRow
                label="Service interval (time)"
                value={
                  vehicle.maintenance_interval_days
                    ? `${vehicle.maintenance_interval_days} days`
                    : "—"
                }
              />

              <DetailRow
                label="Insurance status"
                value={vehicle.insurance_status || "—"}
              />

              <DetailRow
                label="Registration status"
                value={
                  vehicle.registration_status || "—"
                }
              />

              <DetailRow
                label="Tax token status"
                value={vehicle.tax_token_status || "—"}
              />
            </div>
          </div>

          <div className="dashboard-section">
            <div className="section-heading">
              <div>
                <span>TRACKING</span>
                <h2>Maintenance schedule</h2>
              </div>
            </div>

            <div className="reminders-list">
              <StatusCard
                icon={<CalendarClock size={19} />}
                title="Next service date"
                value={
                  schedule?.next_service_date ||
                  "Not scheduled"
                }
                color="warning"
              />

              <StatusCard
                icon={<Gauge size={19} />}
                title="Next service mileage"
                value={
                  schedule?.next_service_mileage != null
                    ? `${schedule.next_service_mileage} km`
                    : "Not scheduled"
                }
                color="primary"
              />

              <StatusCard
                icon={<ShieldCheck size={19} />}
                title="Insurance"
                value={
                  vehicle.insurance_status ||
                  "Not recorded"
                }
                color="success"
              />

              <StatusCard
                icon={<FileCheck size={19} />}
                title="Registration & tax token"
                value={`${
                  vehicle.registration_status || "—"
                } / ${vehicle.tax_token_status || "—"}`}
                color="success"
              />
            </div>

            <form
              className="mileage-update-form"
              onSubmit={updateMileage}
            >
              <label htmlFor="mileage-update">
                Log new mileage (km)
              </label>

              <div className="mileage-update-row">
                <input
                  id="mileage-update"
                  type="number"
                  min={vehicle.current_mileage || 0}
                  placeholder={`${vehicle.current_mileage ?? 0}`}
                  value={mileageInput}
                  onChange={(event) =>
                    setMileageInput(event.target.value)
                  }
                  disabled={updatingMileage}
                />

                <button
                  type="submit"
                  className="secondary-button"
                  disabled={
                    updatingMileage || !mileageInput
                  }
                >
                  {updatingMileage
                    ? "Updating..."
                    : "Update mileage"}
                </button>
              </div>
                    
              <small className="field-help">
                Updating mileage refreshes the mileage-based
                maintenance tracking without resetting the
                time-based service date.
              </small>
            </form>
          </div>
        </section>
      </main>

      {showForm && (
        <VehicleForm
          vehicle={vehicle}
          onSubmit={updateVehicle}
          onClose={() => setShowForm(false)}
          loading={saving}
        />
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="appliance-detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusCard({ icon, title, value, color }) {
  return (
    <div className={`reminder-card reminder-${color}`}>
      <div className="reminder-icon">{icon}</div>

      <div className="reminder-content">
        <strong>{title}</strong>
        <p>{value}</p>
      </div>
    </div>
  );
}
