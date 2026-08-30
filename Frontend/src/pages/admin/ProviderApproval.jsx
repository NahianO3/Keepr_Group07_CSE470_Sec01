import { useEffect, useMemo, useState } from "react";
import {
  UserCheck,
  Search,
  CheckCircle2,
} from "lucide-react";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

export default function ProviderApproval() {
  const [providers, setProviders] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [approvingId, setApprovingId] =
    useState(null);

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
          "Unable to load providers."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const pendingProviders = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return providers.filter((provider) => {
      const pending =
        provider.account_status === "pending";

      const searchable = [
        provider.full_name,
        provider.email,
        provider.id,
      ]
        .join(" ")
        .toLowerCase();

      return (
        pending &&
        (!query || searchable.includes(query))
      );
    });
  }, [providers, search]);

  const approveProvider = async (provider) => {
    const confirmed = window.confirm(
      `Approve ${provider.full_name || provider.email}?`
    );

    if (!confirmed) return;

    try {
      setApprovingId(provider.id);
      setError("");

      await api.put(
        `/admin/providers/${provider.id}/approve`
      );

      await loadProviders();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to approve provider."
      );
    } finally {
      setApprovingId(null);
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
              Provider approval
            </h1>

            <p>
              Review service-provider accounts
              awaiting activation.
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
              placeholder="Search providers..."
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
            Loading approval queue...
          </div>
        ) : pendingProviders.length === 0 ? (
          <div className="empty-card">
            <CheckCircle2 size={30} />

            <h3>
              Approval queue is clear
            </h3>

            <p>
              There are no service-provider
              accounts waiting for approval.
            </p>
          </div>
        ) : (
          <div className="admin-approval-grid">
            {pendingProviders.map(
              (provider) => (
                <article
                  className="admin-approval-item"
                  key={provider.id}
                >
                  <div className="admin-user-avatar">
                    {provider.full_name
                      ?.charAt(0)
                      ?.toUpperCase() || "P"}
                  </div>

                  <div className="admin-approval-info">
                    <h2>
                      {provider.full_name ||
                        "Unnamed provider"}
                    </h2>

                    <p>
                      {provider.email}
                    </p>

                    <span>
                      Provider ID:{" "}
                      {provider.id}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="admin-action-button admin-action-success"
                    onClick={() =>
                      approveProvider(
                        provider
                      )
                    }
                    disabled={
                      approvingId ===
                      provider.id
                    }
                  >
                    <UserCheck size={15} />

                    {approvingId === provider.id
                      ? "Approving..."
                      : "Approve"}
                  </button>
                </article>
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}