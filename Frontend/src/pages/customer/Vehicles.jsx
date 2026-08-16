import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Car,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import VehicleForm from "../../components/VehicleForm";

export default function Vehicles() {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/vehicles");

      setVehicles(response.data?.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load vehicles."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const openAdd = () => {
    setEditingVehicle(null);
    setShowForm(true);
  };

  const openEdit = (vehicle, event) => {
    event.stopPropagation();

    setEditingVehicle(vehicle);
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingVehicle(null);
  };

  const saveVehicle = async (form) => {
    try {
      setSaving(true);
      setError("");

      if (editingVehicle) {
        await api.put(
          `/vehicles/${editingVehicle.id}`,
          form
        );
      } else {
        await api.post("/vehicles", form);
      }

      closeForm();
      await loadVehicles();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save vehicle."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteVehicle = async (vehicle, event) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Delete "${vehicle.brand} ${vehicle.model}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/vehicles/${vehicle.id}`);

      await loadVehicles();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete vehicle."
      );
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              VEHICLE MANAGEMENT
            </span>

            <h1>My Vehicles</h1>

            <p>
              Manage your vehicles and let Keepr
              generate maintenance schedules based on
              mileage and elapsed time.
            </p>
          </div>

          <button
            className="dashboard-primary-button"
            onClick={openAdd}
          >
            <Plus size={18} />
            Add vehicle
          </button>
        </header>

        {error && (
          <div className="form-error">{error}</div>
        )}

        {loading ? (
          <div className="dashboard-loading">
            Loading vehicles...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="empty-card">
            <Car size={30} />

            <h3>No vehicles yet</h3>

            <p>
              Register your first vehicle to begin
              tracking mileage-based and time-based
              maintenance.
            </p>

            <button
              className="dashboard-primary-button"
              onClick={openAdd}
            >
              <Plus size={17} />
              Add vehicle
            </button>
          </div>
        ) : (
          <div className="appliances-grid">
            {vehicles.map((vehicle) => (
              <article
                key={vehicle.id}
                className="appliance-card"
                onClick={() =>
                  navigate(`/vehicles/${vehicle.id}`)
                }
              >
                <div className="appliance-icon">
                  <Car size={23} />
                </div>

                <div className="appliance-info">
                  <span>{vehicle.brand}</span>

                  <h3>{vehicle.model}</h3>

                  <p>
                    Mileage:{" "}
                    <strong>
                      {vehicle.current_mileage ?? "—"} km
                    </strong>
                  </p>
                </div>

                <div className="appliance-actions">
                  <button
                    type="button"
                    title="Edit"
                    onClick={(event) =>
                      openEdit(vehicle, event)
                    }
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    title="Delete"
                    className="delete-action"
                    onClick={(event) =>
                      deleteVehicle(vehicle, event)
                    }
                  >
                    <Trash2 size={16} />
                  </button>

                  <ArrowRight
                    size={17}
                    className="appliance-arrow"
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <VehicleForm
          vehicle={editingVehicle}
          onSubmit={saveVehicle}
          onClose={closeForm}
          loading={saving}
        />
      )}
    </div>
  );
}
