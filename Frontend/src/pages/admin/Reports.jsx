import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";


export default function Reports() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/admin/reports"
      );

      setReports(
        response.data?.data || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load reports."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const filteredReports = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return reports;
    }

    return reports.filter((report) =>
      [
        report.reporter_name,
        report.service_provider_name,
        report.reason,
        report.description,
        report.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [reports, search]);

  const updateReportStatus = async (
    report,
    status
  ) => {
    const resolutionNote =
      status === "Pending"
        ? ""
        : window.prompt(
            "Optional resolution note:"
          );

    if (
      resolutionNote === null &&
      status !== "Pending"
    ) {
      return;
    }

    try {
      setUpdatingId(report.id);
      setError("");

      await api.put(
        `/admin/reports/${report.id}/status`,
        {
          status,
          resolution_note:
            resolutionNote || null,
        }
      );

      await loadReports();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update report."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              ADMINISTRATION
            </span>

            <h1>
              Reports & Disputes
            </h1>

            <p>
              Investigate customer reports and
              resolve platform disputes.
            </p>
          </div>
        </header>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <section className="admin-toolbar">
          <div className="search-box">
            <Search size={17} />

            <input
              type="search"
              placeholder="Search reports..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>
        </section>

        {loading ? (
          <div className="dashboard-loading">
            Loading reports...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="empty-card">
            <ShieldAlert size={30} />

            <h3>
              No reports found
            </h3>

            <p>
              There are currently no reports
              matching your search.
            </p>
          </div>
        ) : (
          <div className="admin-approval-grid">
            {filteredReports.map(
              (report) => (
                <article
                  className="admin-approval-item"
                  key={report.id}
                >
                  <div className="admin-approval-info">
                    <h2>
                      {report.reason}
                    </h2>

                    <p>
                      Reporter:{" "}
                      {report.reporter_name}
                    </p>

                    <p>
                      Provider:{" "}
                      {report.service_provider_name}
                    </p>

                    {report.description && (
                      <p>
                        {report.description}
                      </p>
                    )}

                    <span>
                      Status: {report.status}
                    </span>

                    {report.resolution_note && (
                      <p>
                        Resolution:{" "}
                        {report.resolution_note}
                      </p>
                    )}
                  </div>

                  <div>
                    {report.status ===
                    "Pending" && (
                      <>
                        <button
                          type="button"
                          className="admin-action-button admin-action-success"
                          onClick={() =>
                            updateReportStatus(
                              report,
                              "Resolved"
                            )
                          }
                          disabled={
                            updatingId ===
                            report.id
                          }
                        >
                          <CheckCircle2
                            size={15}
                          />
                          Resolve
                        </button>

                        <button
                          type="button"
                          className="admin-action-button"
                          onClick={() =>
                            updateReportStatus(
                              report,
                              "Dismissed"
                            )
                          }
                          disabled={
                            updatingId ===
                            report.id
                          }
                        >
                          <XCircle size={15} />
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}