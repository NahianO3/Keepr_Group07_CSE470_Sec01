import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Search,
  Ban,
} from "lucide-react";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

const STATUS_OPTIONS = [
  "Pending",
  "Accepted",
  "In Progress",
  "Rescheduled",
  "Completed",
  "Rejected",
  "Cancelled",
];

// "Cancelled" is admin-only and has no dedicated badge color of
// its own yet, so it borrows the "rejected" styling - both are
// terminal negative outcomes for a booking.
const statusBadgeClass = (status) => {
  const slug = String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "-");

  return `status-badge provider-status-${
    slug === "cancelled" ? "rejected" : slug
  }`;
};

export default function AdminMaintenanceRecords() {
  const [records, setRecords] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/admin/maintenance-records"
        );

      setRecords(
        response.data?.data || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load maintenance bookings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesStatus =
        statusFilter === "All" ||
        record.status === statusFilter;

      const searchable = [
        record.id,
        record.asset_label,
        record.customer_name,
        record.service_provider_name,
        record.maintenance_type,
        record.maintenance_date,
        record.status,
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        (!query || searchable.includes(query))
      );
    });
  }, [
    records,
    search,
    statusFilter,
  ]);

  const updateStatus = async (
    record,
    status
  ) => {
    if (status === record.status) return;

    if (
      status === "Cancelled" &&
      !window.confirm(
        `Cancel booking #${record.id}? ` +
          "This overrides its current status."
      )
    ) {
      return;
    }

    try {
      setUpdatingId(record.id);
      setError("");

      await api.put(
        `/admin/maintenance-records/${record.id}/status`,
        { status }
      );

      await loadRecords();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update this booking."
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
              Maintenance bookings
            </h1>

            <p>
              Review and manage maintenance
              bookings across the platform -
              step in on a disputed or
              policy-violating booking directly.
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
              placeholder="Search bookings..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="All">
              All statuses
            </option>

            {STATUS_OPTIONS.map((status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ))}
          </select>
        </section>

        {loading ? (
          <div className="dashboard-loading">
            Loading maintenance bookings...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="empty-card">
            <ClipboardList size={30} />

            <h3>
              No bookings found
            </h3>

            <p>
              No maintenance bookings match
              your current filters.
            </p>
          </div>
        ) : (
          <div className="admin-approval-grid">
            {filteredRecords.map(
              (record) => (
                <article
                  className="admin-approval-item"
                  key={record.id}
                >
                  <div className="admin-approval-info">
                    <h2>
                      #{record.id} -{" "}
                      {record.asset_label}
                    </h2>

                    <p>
                      Customer:{" "}
                      {record.customer_name}
                    </p>

                    <p>
                      Provider:{" "}
                      {record.service_provider_name}
                    </p>

                    <p>
                      {record.maintenance_type ||
                        "—"}{" "}
                      on{" "}
                      {record.maintenance_date ||
                        "an unset date"}
                    </p>

                    {record.work_performed && (
                      <p>
                        {record.work_performed}
                      </p>
                    )}

                    <span
                      className={statusBadgeClass(
                        record.status
                      )}
                    >
                      {record.status ||
                        "Unknown"}
                    </span>
                  </div>

                  <div className="admin-approval-actions">
                    <select
                      value={record.status || ""}
                      onChange={(event) =>
                        updateStatus(
                          record,
                          event.target.value
                        )
                      }
                      disabled={
                        updatingId === record.id
                      }
                    >
                      {STATUS_OPTIONS.map(
                        (status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>
                        )
                      )}
                    </select>

                    {record.status !==
                      "Cancelled" &&
                      record.status !==
                        "Completed" && (
                        <button
                          type="button"
                          className="admin-action-button admin-action-danger"
                          onClick={() =>
                            updateStatus(
                              record,
                              "Cancelled"
                            )
                          }
                          disabled={
                            updatingId ===
                            record.id
                          }
                        >
                          <Ban size={15} />

                          {updatingId ===
                          record.id
                            ? "Updating..."
                            : "Cancel booking"}
                        </button>
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
