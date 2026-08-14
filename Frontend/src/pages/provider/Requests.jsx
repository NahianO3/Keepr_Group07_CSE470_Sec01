import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Search,
  Filter,
  ArrowRight,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

export default function ProviderRequests() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

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
          "Unable to load requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === "All" ||
        request.status === statusFilter;

      const searchable = [
        request.maintenance_type,
        request.maintenance_date,
        request.appliance_id,
        request.id,
        request.status,
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        (!query ||
          searchable.includes(query))
      );
    });
  }, [
    requests,
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
              MAINTENANCE REQUESTS
            </span>

            <h1>
              Your requests
            </h1>

            <p>
              Review and manage maintenance
              requests assigned to you.
            </p>
          </div>
        </header>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <section className="request-toolbar">
          <div className="search-box">
            <Search size={17} />

            <input
              type="search"
              placeholder="Search requests..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <div className="filter-box">
            <Filter size={16} />

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
          </div>
        </section>

        {loading ? (
          <div className="dashboard-loading">
            Loading requests...
          </div>
        ) : filteredRequests.length ===
          0 ? (
          <div className="empty-card">
            <ClipboardList size={30} />

            <h3>
              No matching requests
            </h3>

            <p>
              There are no requests matching
              your current search or filter.
            </p>
          </div>
        ) : (
          <div className="provider-request-list provider-request-list-page">
            {filteredRequests.map(
              (request) => (
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
                      Service date:{" "}
                      {request.maintenance_date ||
                        "Not set"}
                    </small>

                    {request.work_performed && (
                      <small>
                        Work:{" "}
                        {request.work_performed}
                      </small>
                    )}
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

                  <ArrowRight size={18} />
                </button>
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}