import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Flag,
  Star,
  Wrench,
} from "lucide-react";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import ReviewForm from "../../components/ReviewForm";
import ReportForm from "../../components/ReportForm";
import BookmarkButton from "../../components/BookmarkButton";

export default function MaintenanceRequestStatus() {
  const [records, setRecords] = useState([]);
  const [providers, setProviders] = useState({});

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");

  const [reviewRecord, setReviewRecord] = useState(null);
  const [reportRecord, setReportRecord] = useState(null);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/maintenance-records/mechanic"
      );

      const data = response.data?.data || [];

      setRecords(data);

      const providerIds = [
        ...new Set(
          data
            .map((record) => record.service_provider_id)
            .filter(Boolean)
        ),
      ];

      const providerEntries = await Promise.all(
        providerIds.map(async (providerId) => {
          try {
            const providerResponse = await api.get(
              `/providers/${providerId}`
            );

            return [
              providerId,
              providerResponse.data?.data || null,
            ];
          } catch {
            return [providerId, null];
          }
        })
      );

      setProviders(
        Object.fromEntries(providerEntries)
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
    loadRecords();
  }, []);

  const submitReview = async (values) => {
    if (!reviewRecord) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await api.post(
        `/maintenance-records/${reviewRecord.id}/review`,
        values
      );

      setReviewRecord(null);

      await loadRecords();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit review."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const submitReport = async (values) => {
    if (!reportRecord) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await api.post(
        `/maintenance-records/${reportRecord.id}/report`,
        values
      );

      setReportRecord(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit report."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const statusClass = (status) => {
    switch (status) {
      case "Completed":
        return "status-badge status-completed";

      case "Accepted":
      case "In Progress":
        return "status-badge status-active";

      case "Rejected":
        return "status-badge status-expired";

      case "Rescheduled":
        return "status-badge status-pending";

      case "Pending":
      default:
        return "status-badge status-pending";
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              SERVICE REQUESTS
            </span>

            <h1>
              Maintenance request status
            </h1>

            <p>
              Track your mechanic maintenance requests
              from submission to completion.
            </p>
          </div>
        </header>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="dashboard-loading">
            Loading maintenance requests...
          </div>
        ) : records.length === 0 ? (
          <div className="empty-card">
            <Wrench size={30} />

            <h3>
              No mechanic requests
            </h3>

            <p>
              Your mechanic maintenance requests
              will appear here.
            </p>
          </div>
        ) : (
          <section className="maintenance-record-list">
            {records.map((record) => {
              const provider =
                providers[record.service_provider_id];

              const completed =
                record.status === "Completed";

              return (
                <article
                  className="maintenance-record-card"
                  key={record.id}
                >
                  <div className="maintenance-record-icon">
                    {completed ? (
                      <CheckCircle2 size={21} />
                    ) : (
                      <Clock3 size={21} />
                    )}
                  </div>

                  <div className="maintenance-record-content">
                    <div className="maintenance-record-top">
                      <div>
                        <span className="maintenance-type-badge maintenance-type-mechanic">
                          MECHANIC
                        </span>

                        <h2>
                          {provider?.full_name ||
                            provider?.email ||
                            `Provider #${record.service_provider_id}`}
                        </h2>
                      </div>

                      <span
                        className={statusClass(
                          record.status
                        )}
                      >
                        {record.status}
                      </span>
                    </div>

                    <p className="maintenance-record-work">
                      {record.work_performed ||
                        "No work details yet."}
                    </p>

                    <div className="maintenance-record-meta">
                      <div>
                        <span>
                          Date
                        </span>

                        <strong>
                          {record.maintenance_date ||
                            "—"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Cost
                        </span>

                        <strong>
                          ৳
                          {Number(
                            record.cost || 0
                          ).toLocaleString()}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Provider
                        </span>

                        <strong>
                          {provider?.service_category ||
                            "Service Provider"}
                        </strong>
                      </div>
                    </div>

                    {completed &&
                      record.service_provider_id && (
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                            marginTop: "18px",
                          }}
                        >
                          <button
                            type="button"
                            className="dashboard-primary-button"
                            onClick={() =>
                              setReviewRecord(record)
                            }
                          >
                            <Star size={16} />
                            Rate & Review
                          </button>

                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                              setReportRecord(record)
                            }
                          >
                            <Flag size={16} />
                            Report
                          </button>

                          <BookmarkButton
                            providerId={
                              record.service_provider_id
                            }
                          />
                        </div>
                      )}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {reviewRecord && (
          <ReviewForm
            onSubmit={submitReview}
            onClose={() =>
              setReviewRecord(null)
            }
            loading={actionLoading}
          />
        )}

        {reportRecord && (
          <ReportForm
            onSubmit={submitReport}
            onClose={() =>
              setReportRecord(null)
            }
            loading={actionLoading}
          />
        )}
      </main>
    </div>
  );
}