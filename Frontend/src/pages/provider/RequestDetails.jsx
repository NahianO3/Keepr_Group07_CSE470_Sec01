import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  X,
  CalendarClock,
  Play,
  CheckCircle2,
  Wrench,
  ClipboardList,
} from "lucide-react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

export default function RequestDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [request, setRequest] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [workPerformed, setWorkPerformed] =
    useState("");

  const [newDate, setNewDate] =
    useState("");

  const loadRequest = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/maintenance-records/${id}`
      );

      const data =
        response.data?.data || null;

      setRequest(data);

      setWorkPerformed(
        data?.work_performed || ""
      );

      setNewDate(
        data?.maintenance_date || ""
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load request."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequest();
  }, [id]);

  const runAction = async (
    action,
    payload = {}
  ) => {
    try {
      setActionLoading(true);
      setError("");

      await api[action.method](
        action.url,
        payload
      );

      await loadRequest();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update request."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const accept = () =>
    runAction({
      method: "post",
      url: `/maintenance-records/${id}/accept`,
    });

  const reject = () =>
    runAction({
      method: "post",
      url: `/maintenance-records/${id}/reject`,
    });

  const reschedule = () =>
    runAction(
      {
        method: "put",
        url: `/maintenance-records/${id}/reschedule`,
      },
      {
        maintenance_date: newDate,
      }
    );

  const updateProgress = (status) =>
    runAction(
      {
        method: "put",
        url: `/maintenance-records/${id}/progress`,
      },
      {
        status,
        work_performed: workPerformed,
      }
    );

  const complete = () =>
    runAction({
      method: "post",
      url: `/maintenance-records/${id}/complete`,
    });

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading request...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="dashboard-layout">
        <Sidebar />

        <main className="dashboard-main">
          <div className="empty-card">
            <ClipboardList size={30} />

            <h3>
              Request not found
            </h3>

            <button
              className="dashboard-primary-button"
              onClick={() =>
                navigate(
                  "/provider/requests"
                )
              }
            >
              Back to requests
            </button>
          </div>
        </main>
      </div>
    );
  }

  const status = request.status;

  const canAccept =
    status === "Pending" ||
    status === "Rejected";

  const canReject =
    status !== "Completed" &&
    status !== "Rejected";

  const canReschedule =
    status !== "Completed";

  const canProgress =
    status !== "Completed";

  const canComplete =
    status !== "Completed";

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <button
          className="text-button"
          onClick={() =>
            navigate(
              "/provider/requests"
            )
          }
        >
          <ArrowLeft size={16} />
          Back to requests
        </button>

        <header className="dashboard-header request-detail-header">
          <div>
            <span className="eyebrow">
              REQUEST #{request.id}
            </span>

            <h1>
              {request.maintenance_type ||
                "Maintenance request"}
            </h1>

            <p>
              Appliance #
              {request.appliance_id}
            </p>
          </div>

          <span
            className={`status-badge provider-detail-status`}
          >
            {status || "Unknown"}
          </span>
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
                <span>
                  SERVICE INFORMATION
                </span>

                <h2>
                  Request details
                </h2>
              </div>
            </div>

            <div className="request-detail-card">
              <DetailRow
                label="Appliance"
                value={`#${request.appliance_id}`}
              />

              <DetailRow
                label="Maintenance type"
                value={
                  request.maintenance_type ||
                  "—"
                }
              />

              <DetailRow
                label="Service date"
                value={
                  request.maintenance_date ||
                  "—"
                }
              />

              <DetailRow
                label="Customer"
                value={
                  request.customer_id
                    ? `Customer #${request.customer_id}`
                    : "—"
                }
              />

              <DetailRow
                label="Cost"
                value={
                  request.cost ?? "—"
                }
              />

              <DetailRow
                label="Status"
                value={
                  request.status ||
                  "—"
                }
              />

              <div className="request-work-block">
                <span>
                  Work performed
                </span>

                <p>
                  {request.work_performed ||
                    "No work details recorded yet."}
                </p>
              </div>
            </div>
          </div>

          <div className="dashboard-section">
            <div className="section-heading">
              <div>
                <span>
                  ACTIONS
                </span>

                <h2>
                  Manage request
                </h2>
              </div>
            </div>

            <div className="provider-action-panel">
              {canAccept && (
                <ActionButton
                  icon={
                    <Check size={17} />
                  }
                  label="Accept request"
                  onClick={accept}
                  disabled={actionLoading}
                  variant="success"
                />
              )}

              {canReject && (
                <ActionButton
                  icon={
                    <X size={17} />
                  }
                  label="Reject request"
                  onClick={reject}
                  disabled={actionLoading}
                  variant="danger"
                />
              )}

              {canProgress && (
                <>
                  <div className="provider-action-form">
                    <label>
                      Work performed
                    </label>

                    <textarea
                      rows="4"
                      value={workPerformed}
                      onChange={(event) =>
                        setWorkPerformed(
                          event.target.value
                        )
                      }
                      placeholder="Describe work performed..."
                      disabled={actionLoading}
                    />

                    <div className="progress-buttons">
                      <ActionButton
                        icon={
                          <Play size={16} />
                        }
                        label="Start / progress"
                        onClick={() =>
                          updateProgress(
                            "In Progress"
                          )
                        }
                        disabled={
                          actionLoading
                        }
                        variant="primary"
                      />

                      <ActionButton
                        icon={
                          <CheckCircle2 size={16} />
                        }
                        label="Mark accepted"
                        onClick={() =>
                          updateProgress(
                            "Accepted"
                          )
                        }
                        disabled={
                          actionLoading
                        }
                        variant="secondary"
                      />
                    </div>
                  </div>
                </>
              )}

              {canReschedule && (
                <div className="provider-action-form">
                  <label>
                    Reschedule date
                  </label>

                  <input
                    type="date"
                    value={newDate}
                    onChange={(event) =>
                      setNewDate(
                        event.target.value
                      )
                    }
                    disabled={actionLoading}
                  />

                  <ActionButton
                    icon={
                      <CalendarClock size={16} />
                    }
                    label="Reschedule"
                    onClick={reschedule}
                    disabled={
                      actionLoading ||
                      !newDate
                    }
                    variant="warning"
                  />
                </div>
              )}

              {canComplete && (
                <ActionButton
                  icon={
                    <CheckCircle2 size={17} />
                  }
                  label="Complete maintenance"
                  onClick={complete}
                  disabled={actionLoading}
                  variant="success"
                />
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function DetailRow({
  label,
  value,
}) {
  return (
    <div className="request-detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  variant,
}) {
  return (
    <button
      type="button"
      className={`provider-action-button provider-action-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      {label}
    </button>
  );
}