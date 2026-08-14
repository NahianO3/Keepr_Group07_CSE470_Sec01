import { useEffect, useMemo, useState } from "react";
import {
  Search,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

export default function AdminProviders() {
  const navigate = useNavigate();

  const [providers, setProviders] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadProviders = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/admin/users");

      const allUsers =
        response.data?.data || [];

      setProviders(
        allUsers.filter(
          (user) =>
            user.role === "service_provider"
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load service providers."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const filteredProviders = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return providers.filter((provider) => {
      const matchesStatus =
        statusFilter === "All" ||
        provider.account_status ===
          statusFilter;

      const searchable = [
        provider.full_name,
        provider.email,
        provider.account_status,
        provider.id,
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        (!query || searchable.includes(query))
      );
    });
  }, [
    providers,
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
              SERVICE PROVIDERS
            </span>

            <h1>
              Provider accounts
            </h1>

            <p>
              Review provider account status and
              approval state.
            </p>
          </div>

          <button
            className="dashboard-primary-button"
            onClick={() =>
              navigate(
                "/admin/provider-approval"
              )
            }
          >
            <UserCheck size={17} />
            Review approvals
          </button>
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
              placeholder="Search providers..."
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

            <option value="active">
              Active
            </option>

            <option value="suspended">
              Suspended
            </option>
          </select>
        </section>

        {loading ? (
          <div className="dashboard-loading">
            Loading providers...
          </div>
        ) : filteredProviders.length ===
          0 ? (
          <div className="empty-card">
            <UserCheck size={30} />

            <h3>
              No providers found
            </h3>

            <p>
              There are no service providers
              matching your filters.
            </p>
          </div>
        ) : (
          <div className="admin-provider-grid">
            {filteredProviders.map(
              (provider) => (
                <article
                  className="admin-provider-card"
                  key={provider.id}
                >
                  <div className="admin-provider-header">
                    <div className="admin-user-avatar">
                      {provider.full_name
                        ?.charAt(0)
                        ?.toUpperCase() || "P"}
                    </div>

                    <span
                      className={`status-badge ${
                        provider.account_status ===
                        "active"
                          ? "status-active"
                          : "status-suspended"
                      }`}
                    >
                      {provider.account_status ||
                        "—"}
                    </span>
                  </div>

                  <h2>
                    {provider.full_name ||
                      "Unnamed provider"}
                  </h2>

                  <p>
                    {provider.email}
                  </p>

                  <div className="provider-verification-row">
                    <ShieldCheck size={16} />

                    <span>
                      {provider.account_status ===
                      "active"
                        ? "Approved / active"
                        : "Requires review"}
                    </span>
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