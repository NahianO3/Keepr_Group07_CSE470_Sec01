import { useEffect, useMemo, useState } from "react";
import {
  Users as UsersIcon,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] =
    useState("All");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] =
    useState(null);

  const [error, setError] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/admin/users");

      setUsers(
        response.data?.data || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole =
        roleFilter === "All" ||
        user.role === roleFilter;

      const matchesStatus =
        statusFilter === "All" ||
        user.account_status === statusFilter;

      const searchable = [
        user.full_name,
        user.email,
        user.role,
        user.account_status,
        user.id,
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesRole &&
        matchesStatus &&
        (!query || searchable.includes(query))
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  const updateStatus = async (user) => {
    const nextStatus =
      user.account_status === "active"
        ? "suspended"
        : "active";

    const action =
      nextStatus === "suspended"
        ? "suspend"
        : "activate";

    const confirmed = window.confirm(
      `${action === "suspend" ? "Suspend" : "Activate"} ${
        user.full_name || user.email
      }?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(user.id);
      setError("");

      await api.put(
        `/admin/users/${user.id}/status`,
        {
          account_status: nextStatus,
        }
      );

      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update account status."
      );
    } finally {
      setActionLoading(null);
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

            <h1>User management</h1>

            <p>
              Manage customer and service-provider
              account statuses.
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
              placeholder="Search users..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value)
            }
          >
            <option value="All">All roles</option>
            <option value="customer">
              Customer
            </option>
            <option value="service_provider">
              Service Provider
            </option>
            <option value="admin">
              Administrator
            </option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
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
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-card">
            <UsersIcon size={30} />

            <h3>No users found</h3>

            <p>
              No accounts match your current filters.
            </p>
          </div>
        ) : (
          <section className="admin-table-card">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar">
                            {user.full_name
                              ?.charAt(0)
                              ?.toUpperCase() || "U"}
                          </div>

                          <div>
                            <strong>
                              {user.full_name ||
                                "Unnamed user"}
                            </strong>

                            <span>
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="status-badge">
                          {user.role}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            user.account_status ===
                            "active"
                              ? "status-active"
                              : "status-suspended"
                          }`}
                        >
                          {user.account_status ||
                            "—"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={`admin-action-button ${
                            user.account_status ===
                            "active"
                              ? "admin-action-danger"
                              : "admin-action-success"
                          }`}
                          onClick={() =>
                            updateStatus(user)
                          }
                          disabled={
                            actionLoading === user.id
                          }
                        >
                          {user.account_status ===
                          "active" ? (
                            <>
                              <UserX size={15} />
                              Suspend
                            </>
                          ) : (
                            <>
                              <UserCheck size={15} />
                              Activate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}