import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Search,
} from "lucide-react";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

export default function AdminMaintenanceRecords() {
  const [records, setRecords] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [loading, setLoading] =
    useState(true);

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
          "Unable to load maintenance records."
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
        record.appliance_id,
        record.service_provider_id,
        record.maintenance_type,
        record.work_performed,
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

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              PLATFORM MONITORING
            </span>

            <h1>
              Maintenance records
            </h1>

            <p>
              Monitor maintenance activity
              across the platform.
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
              placeholder="Search records..."
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

            <option value="Pending">
              Pending
            </option>

            <option value="Accepted">
              Accepted
            </option>

            <option value="In Progress">
              In Progress
            </option>

            <option value="Rescheduled">
              Rescheduled
            </option>

            <option value="Completed">
              Completed
            </option>

            <option value="Rejected">
              Rejected
            </option>
          </select>
        </section>

        {loading ? (
          <div className="dashboard-loading">
            Loading maintenance records...
          </div>
        ) : filteredRecords.length ===
          0 ? (
          <div className="empty-card">
            <ClipboardList size={30} />

            <h3>
              No records found
            </h3>

            <p>
              No maintenance records match
              your current filters.
            </p>
          </div>
        ) : (
          <section className="admin-table-card">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Appliance</th>
                    <th>Provider</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.map(
                    (record) => (
                      <tr key={record.id}>
                        <td>
                          #{record.id}
                        </td>

                        <td>
                          #{record.appliance_id}
                        </td>

                        <td>
                          {record.service_provider_id
                            ? `#${record.service_provider_id}`
                            : "—"}
                        </td>

                        <td>
                          {record.maintenance_date ||
                            "—"}
                        </td>

                        <td>
                          {record.maintenance_type ||
                            "—"}
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
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}