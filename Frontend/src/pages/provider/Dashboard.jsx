import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/maintenance-requests"
      );

      setRequests(
        response.data?.data || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load maintenance requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const stats = useMemo(() => {
    return {
      total: requests.length,

      pending: requests.filter(
        (item) => item.status === "Pending"
      ).length,

      inProgress: requests.filter(
        (item) =>
          item.status === "In Progress"
      ).length,

      completed: requests.filter(
        (item) =>
          item.status === "Completed"
      ).length,

      rejected: requests.filter(
        (item) =>
          item.status === "Rejected"
      ).length,
    };
  }, [requests]);

  const firstName =
    user?.email?.split("@")[0] ||
    "Provider";

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading provider dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              SERVICE PROVIDER
            </span>

            <h1>
              Welcome, {firstName}.
            </h1>

            <p>
              Manage your assigned maintenance
              requests and service progress.
            </p>
          </div>

          <button
            className="dashboard-primary-button"
            onClick={() =>
              navigate("/provider/requests")
            }
          >
            <ClipboardList size={18} />
            View requests
          </button>
        </header>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <section className="stats-grid">
          <ProviderStat
            icon={
              <ClipboardList size={20} />
            }
            label="Total requests"
            value={stats.total}
            description="Assigned to you"
            className="stat-appliances"
          />

          <ProviderStat
            icon={<Clock3 size={20} />}
            label="Pending"
            value={stats.pending}
            description="Awaiting action"
            className="stat-due"
          />

          <ProviderStat
            icon={
              <Wrench size={20} />
            }
            label="In progress"
            value={stats.inProgress}
            description="Currently active"
            className="stat-maintenance"
          />

          <ProviderStat
            icon={
              <CheckCircle2 size={20} />
            }
            label="Completed"
            value={stats.completed}
            description="Finished services"
            className="stat-warranty"
          />
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-section">
            <div className="section-heading">
              <div>
                <span>
                  WORK QUEUE
                </span>

                <h2>
                  Recent requests
                </h2>
              </div>

              <button
                className="text-button"
                onClick={() =>
                  navigate("/provider/requests")
                }
              >
                All requests
                <ArrowRight size={16} />
              </button>
            </div>

            {requests.length === 0 ? (
              <div className="empty-card">
                <ClipboardList
                  size={30}
                />

                <h3>
                  No maintenance requests
                </h3>

                <p>
                  New requests assigned to you
                  will appear here.
                </p>
              </div>
            ) : (
              <div className="provider-request-list">
                {requests
                  .slice(0, 5)
                  .map((request) => (
                    <button
                      type="button"
                      key={request.id}
                      className="provider-request-card"
                      onClick={() =>
                        navigate(
                          `/provider/requests/${request.id}`
                        )
                      }
                    >
                      <div className="provider-request-icon">
                        <Wrench size={20} />
                      </div>

                      <div className="provider-request-content">
                        <strong>
                          {request.maintenance_type ||
                            "Maintenance service"}
                        </strong>

                        <span>
                          Appliance #
                          {request.appliance_id}
                        </span>

                        <small>
                          {request.maintenance_date ||
                            "No date set"}
                        </small>
                      </div>

                      <span
                        className={`status-badge provider-status-${String(
                          request.status || ""
                        )
                          .toLowerCase()
                          .replace(
                            /\s+/g,
                            "-"
                          )}`}
                      >
                        {request.status ||
                          "Unknown"}
                      </span>

                      <ArrowRight size={17} />
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="dashboard-section">
            <div className="section-heading">
              <div>
                <span>
                  SERVICE STATUS
                </span>

                <h2>
                  At a glance
                </h2>
              </div>
            </div>

            <div className="provider-status-panel">
              <StatusLine
                icon={
                  <Clock3 size={18} />
                }
                label="Pending"
                value={stats.pending}
                color="warning"
              />

              <StatusLine
                icon={
                  <Wrench size={18} />
                }
                label="In progress"
                value={stats.inProgress}
                color="primary"
              />

              <StatusLine
                icon={
                  <CheckCircle2 size={18} />
                }
                label="Completed"
                value={stats.completed}
                color="success"
              />

              <StatusLine
                icon={
                  <XCircle size={18} />
                }
                label="Rejected"
                value={stats.rejected}
                color="danger"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ProviderStat({
  icon,
  label,
  value,
  description,
  className,
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${className}`}>
        {icon}
      </div>

      <div className="stat-content">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>
    </div>
  );
}

function StatusLine({
  icon,
  label,
  value,
  color,
}) {
  return (
    <div className="provider-status-line">
      <div
        className={`provider-status-icon ${color}`}
      >
        {icon}
      </div>

      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}