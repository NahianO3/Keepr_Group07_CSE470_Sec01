import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Refrigerator,
  ShieldCheck,
  CalendarClock,
  Wrench,
} from "lucide-react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import ApplianceForm from "../../components/ApplianceForm";

export default function ApplianceDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [appliance, setAppliance] =
    useState(null);

  const [schedules, setSchedules] =
    useState([]);

  const [records, setRecords] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [showForm, setShowForm] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        applianceResponse,
        scheduleResponse,
        recordsResponse,
      ] = await Promise.all([
        api.get(`/appliances/${id}`),
        api.get(
          `/maintenance-schedules?appliance_id=${id}`
        ),
        api.get(
          `/maintenance-records?appliance_id=${id}`
        ),
      ]);

      setAppliance(
        applianceResponse.data?.data ||
          null
      );

      setSchedules(
        scheduleResponse.data?.data || []
      );

      setRecords(
        recordsResponse.data?.data || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load appliance."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const updateAppliance = async (form) => {
    try {
      setSaving(true);
      setError("");

      await api.put(
        `/appliances/${id}`,
        form
      );

      setShowForm(false);

      await loadDetails();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update appliance."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading appliance...
      </div>
    );
  }

  if (!appliance) {
    return (
      <div className="dashboard-layout">
        <Sidebar />

        <main className="dashboard-main">
          <div className="empty-card">
            <h3>Appliance not found</h3>

            <button
              className="dashboard-primary-button"
              onClick={() =>
                navigate("/appliances")
              }
            >
              Back to appliances
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <button
          className="text-button"
          onClick={() =>
            navigate("/appliances")
          }
        >
          <ArrowLeft size={16} />
          Back to appliances
        </button>

        <header className="dashboard-header appliance-detail-header">
          <div>
            <span className="eyebrow">
              APPLIANCE DETAILS
            </span>

            <h1>
              {appliance.name}
            </h1>

            <p>
              {appliance.category ||
                "Household appliance"}
            </p>
          </div>

          <button
            className="dashboard-primary-button"
            onClick={() =>
              setShowForm(true)
            }
          >
            <Pencil size={17} />
            Edit appliance
          </button>
        </header>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <section className="dashboard-grid">
          <div className="dashboard-section">
            <div className="section-heading">
              <div>
                <span>PROFILE</span>
                <h2>Appliance information</h2>
              </div>
            </div>

            <div className="stat-card appliance-detail-info-card">
              <div className="appliance-icon">
                <Refrigerator size={25} />
              </div>

              <div className="stat-content">
                <span>
                  Category
                </span>

                <strong>
                  {appliance.category ||
                    "—"}
                </strong>

                <small>
                  Current condition:{" "}
                  {appliance.condition ||
                    "Not specified"}
                </small>
              </div>
            </div>

            <div className="detail-info-list">
              <DetailRow
                label="Purchase date"
                value={
                  appliance.purchase_date ||
                  "—"
                }
              />

              <DetailRow
                label="Warranty expiry"
                value={
                  appliance.warranty_expiry ||
                  "—"
                }
              />

              <DetailRow
                label="Maintenance interval"
                value={
                  appliance.maintenance_interval
                    ? `${appliance.maintenance_interval} days`
                    : "—"
                }
              />

              <DetailRow
                label="Condition"
                value={
                  appliance.condition ||
                  "Not specified"
                }
              />
            </div>
          </div>

          <div className="dashboard-section">
            <div className="section-heading">
              <div>
                <span>TRACKING</span>
                <h2>Current status</h2>
              </div>
            </div>

            <div className="reminders-list">
              <StatusCard
                icon={
                  <ShieldCheck size={19} />
                }
                title="Warranty"
                value={
                  appliance.warranty_expiry ||
                  "Not recorded"
                }
                color="success"
              />

              <StatusCard
                icon={
                  <CalendarClock size={19} />
                }
                title="Maintenance schedules"
                value={`${schedules.length} schedule${
                  schedules.length === 1
                    ? ""
                    : "s"
                }`}
                color="warning"
              />

              <StatusCard
                icon={
                  <Wrench size={19} />
                }
                title="Maintenance history"
                value={`${records.length} record${
                  records.length === 1
                    ? ""
                    : "s"
                }`}
                color="primary"
              />
            </div>
          </div>
        </section>

        <section className="history-section">
          <div className="section-heading">
            <div>
              <span>MAINTENANCE HISTORY</span>
              <h2>Service records</h2>
            </div>

            <button
              className="text-button"
              onClick={() =>
                navigate(
                  `/maintenance-history?appliance_id=${id}`
                )
              }
            >
              Full history
            </button>
          </div>

          {records.length === 0 ? (
            <div className="empty-card small">
              <h3>No records yet</h3>

              <p>
                Maintenance records for this
                appliance will appear here.
              </p>
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Provider</th>
                    <th>Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>
                        {record.maintenance_date ||
                          "—"}
                      </td>

                      <td>
                        {record.maintenance_type ||
                          "—"}
                      </td>

                      <td>
                        {record.service_provider_id
                          ? `Provider #${record.service_provider_id}`
                          : "—"}
                      </td>

                      <td>
                        {record.cost ?? "—"}
                      </td>

                      <td>
                        <span className="status-badge">
                          {record.status ||
                            "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {showForm && (
        <ApplianceForm
          appliance={appliance}
          onSubmit={updateAppliance}
          onClose={() =>
            setShowForm(false)
          }
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

function StatusCard({
  icon,
  title,
  value,
  color,
}) {
  return (
    <div className={`reminder-card reminder-${color}`}>
      <div className="reminder-icon">
        {icon}
      </div>

      <div className="reminder-content">
        <strong>{title}</strong>
        <p>{value}</p>
      </div>
    </div>
  );
}