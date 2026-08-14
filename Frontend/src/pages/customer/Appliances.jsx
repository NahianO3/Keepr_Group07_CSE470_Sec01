import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Refrigerator,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import ApplianceForm from "../../components/ApplianceForm";

export default function Appliances() {
  const navigate = useNavigate();

  const [appliances, setAppliances] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAppliance, setEditingAppliance] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadAppliances = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/appliances");

      setAppliances(
        response.data?.data || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load appliances."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppliances();
  }, []);

  const openAdd = () => {
    setEditingAppliance(null);
    setShowForm(true);
  };

  const openEdit = (appliance, event) => {
    event.stopPropagation();

    setEditingAppliance(appliance);
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingAppliance(null);
  };

  const saveAppliance = async (form) => {
    try {
      setSaving(true);
      setError("");

      if (editingAppliance) {
        await api.put(
          `/appliances/${editingAppliance.id}`,
          form
        );
      } else {
        await api.post(
          "/appliances",
          form
        );
      }

      closeForm();
      await loadAppliances();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save appliance."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteAppliance = async (
    appliance,
    event
  ) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Delete "${appliance.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(
        `/appliances/${appliance.id}`
      );

      await loadAppliances();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete appliance."
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
              APPLIANCE MANAGEMENT
            </span>

            <h1>My Appliances</h1>

            <p>
              Manage your household appliance records,
              warranties and maintenance information.
            </p>
          </div>

          <button
            className="dashboard-primary-button"
            onClick={openAdd}
          >
            <Plus size={18} />
            Add appliance
          </button>
        </header>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="dashboard-loading">
            Loading appliances...
          </div>
        ) : appliances.length === 0 ? (
          <div className="empty-card">
            <Refrigerator size={30} />

            <h3>No appliances yet</h3>

            <p>
              Add your first appliance to begin
              tracking maintenance and warranty
              information.
            </p>

            <button
              className="dashboard-primary-button"
              onClick={openAdd}
            >
              <Plus size={17} />
              Add appliance
            </button>
          </div>
        ) : (
          <div className="appliances-grid">
            {appliances.map((appliance) => (
              <article
                key={appliance.id}
                className="appliance-card"
                onClick={() =>
                  navigate(
                    `/appliances/${appliance.id}`
                  )
                }
              >
                <div className="appliance-icon">
                  <Refrigerator size={23} />
                </div>

                <div className="appliance-info">
                  <span>
                    {appliance.category ||
                      "Appliance"}
                  </span>

                  <h3>
                    {appliance.name}
                  </h3>

                  <p>
                    Condition:{" "}
                    <strong>
                      {appliance.condition ||
                        "Not specified"}
                    </strong>
                  </p>
                </div>

                <div className="appliance-actions">
                  <button
                    type="button"
                    title="Edit"
                    onClick={(event) =>
                      openEdit(
                        appliance,
                        event
                      )
                    }
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    title="Delete"
                    className="delete-action"
                    onClick={(event) =>
                      deleteAppliance(
                        appliance,
                        event
                      )
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
        <ApplianceForm
          appliance={editingAppliance}
          onSubmit={saveAppliance}
          onClose={closeForm}
          loading={saving}
        />
      )}
    </div>
  );
}