import { useEffect, useMemo, useState } from "react";
import {
  Users as UsersIcon,
  Search,
  UserCheck,
  UserX,
  Pencil,
  ShieldCheck,
} from "lucide-react";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";


const emptyProfile = {
  full_name: "",
  phone: "",
  address: "",
};


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

  const [editingUser, setEditingUser] =
    useState(null);

  const [profileForm, setProfileForm] =
    useState(emptyProfile);

  const [profileSaving, setProfileSaving] =
    useState(false);

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
        user.account_status ===
          statusFilter;

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
        (!query ||
          searchable.includes(query))
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);


  const updateStatus = async (
    user,
    nextStatus
  ) => {
    const actionText =
      nextStatus === "suspended"
        ? "Suspend"
        : nextStatus === "pending"
        ? "Mark as pending verification"
        : "Activate";

    const confirmed =
      window.confirm(
        `${actionText} ${
          user.full_name ||
          user.email
        }?`
      );

    if (!confirmed) return;

    try {
      setActionLoading(user.id);
      setError("");

      await api.put(
        `/admin/users/${user.id}/status`,
        {
          account_status:
            nextStatus,
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


  const verifyUser = async (user) => {
    const confirmed =
      window.confirm(
        `Verify ${
          user.full_name ||
          user.email
        }?`
      );

    if (!confirmed) return;

    try {
      setActionLoading(user.id);
      setError("");

      await api.put(
        `/admin/users/${user.id}/verify`
      );

      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to verify account."
      );
    } finally {
      setActionLoading(null);
    }
  };


  const openEditProfile = (user) => {
    setEditingUser(user);

    setProfileForm({
      full_name:
        user.full_name || "",
      phone: user.phone || "",
      address:
        user.address || "",
    });
  };


  const closeEditProfile = () => {
    if (profileSaving) return;

    setEditingUser(null);
    setProfileForm(
      emptyProfile
    );
  };


  const saveProfile = async (
    event
  ) => {
    event.preventDefault();

    if (!editingUser) return;

    try {
      setProfileSaving(true);
      setError("");

      await api.put(
        `/admin/users/${editingUser.id}/profile`,
        {
          full_name:
            profileForm.full_name.trim(),
          phone:
            profileForm.phone.trim(),
          address:
            profileForm.address.trim(),
        }
      );

      closeEditProfile();
      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update profile."
      );
    } finally {
      setProfileSaving(false);
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
              User management
            </h1>

            <p>
              Verify, activate, suspend,
              and manage customer and
              service-provider accounts.
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
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value
              )
            }
          >
            <option value="All">
              All roles
            </option>

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
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="All">
              All statuses
            </option>

            <option value="pending">
              Pending
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
        ) : filteredUsers.length ===
          0 ? (
          <div className="empty-card">
            <UsersIcon size={30} />

            <h3>
              No users found
            </h3>

            <p>
              No accounts match your
              current filters.
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
                    <th>Verification</th>
                    <th>Profile</th>
                    <th>Account</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map(
                    (user) => (
                      <tr
                        key={user.id}
                      >
                        <td>
                          <div className="admin-user-cell">
                            <div className="admin-user-avatar">
                              {user.full_name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "U"}
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
                                : user.account_status ===
                                  "suspended"
                                ? "status-suspended"
                                : "status-pending"
                            }`}
                          >
                            {user.account_status ||
                              "—"}
                          </span>
                        </td>

                        <td>
                          {user.role ===
                            "customer" &&
                          user.account_status ===
                            "pending" ? (
                            <button
                              type="button"
                              className="admin-action-button admin-action-success"
                              onClick={() =>
                                verifyUser(
                                  user
                                )
                              }
                              disabled={
                                actionLoading ===
                                user.id
                              }
                            >
                              <ShieldCheck
                                size={15}
                              />

                              Verify
                            </button>
                          ) : user.role ===
                              "service_provider" &&
                            user.account_status ===
                              "pending" ? (
                            <span>
                              Provider approval
                              required
                            </span>
                          ) : (
                            <span>
                              {user.account_status ===
                              "active"
                                ? "Verified"
                                : "—"}
                            </span>
                          )}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="admin-action-button"
                            onClick={() =>
                              openEditProfile(
                                user
                              )
                            }
                          >
                            <Pencil
                              size={15}
                            />

                            Edit
                          </button>
                        </td>

                        <td>
                          {user.role !==
                            "admin" && (
                            <div className="admin-table-actions">
                              {user.account_status ===
                              "active" ? (
                                <button
                                  type="button"
                                  className="admin-action-button admin-action-danger"
                                  onClick={() =>
                                    updateStatus(
                                      user,
                                      "suspended"
                                    )
                                  }
                                  disabled={
                                    actionLoading ===
                                    user.id
                                  }
                                >
                                  <UserX
                                    size={15}
                                  />

                                  Suspend
                                </button>
                              ) : user.account_status ===
                                "suspended" ? (
                                <button
                                  type="button"
                                  className="admin-action-button admin-action-success"
                                  onClick={() =>
                                    updateStatus(
                                      user,
                                      "active"
                                    )
                                  }
                                  disabled={
                                    actionLoading ===
                                    user.id
                                  }
                                >
                                  <UserCheck
                                    size={15}
                                  />

                                  Activate
                                </button>
                              ) : user.role ===
                                "customer" ? (
                                <button
                                  type="button"
                                  className="admin-action-button"
                                  onClick={() =>
                                    verifyUser(
                                      user
                                    )
                                  }
                                  disabled={
                                    actionLoading ===
                                    user.id
                                  }
                                >
                                  <UserCheck
                                    size={15}
                                  />

                                  Verify
                                </button>
                              ) : null}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {editingUser && (
          <div className="admin-modal-backdrop">
            <div className="admin-modal">
              <header className="admin-modal-header">
                <div>
                  <span className="eyebrow">
                    PROFILE MANAGEMENT
                  </span>

                  <h2>
                    Edit user profile
                  </h2>

                  <p>
                    {editingUser.email}
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-action-button"
                  onClick={
                    closeEditProfile
                  }
                  disabled={
                    profileSaving
                  }
                >
                  Close
                </button>
              </header>

              <form
                className="auth-form"
                onSubmit={
                  saveProfile
                }
              >
                <div className="form-field">
                  <label>
                    Full name
                  </label>

                  <input
                    type="text"
                    value={
                      profileForm.full_name
                    }
                    onChange={(event) =>
                      setProfileForm(
                        (current) => ({
                          ...current,
                          full_name:
                            event.target.value,
                        })
                      )
                    }
                    disabled={
                      profileSaving
                    }
                    required
                  />
                </div>

                <div className="form-field">
                  <label>
                    Phone
                  </label>

                  <input
                    type="text"
                    value={
                      profileForm.phone
                    }
                    onChange={(event) =>
                      setProfileForm(
                        (current) => ({
                          ...current,
                          phone:
                            event.target.value,
                        })
                      )
                    }
                    disabled={
                      profileSaving
                    }
                  />
                </div>

                <div className="form-field">
                  <label>
                    Address
                  </label>

                  <textarea
                    value={
                      profileForm.address
                    }
                    onChange={(event) =>
                      setProfileForm(
                        (current) => ({
                          ...current,
                          address:
                            event.target.value,
                        })
                      )
                    }
                    disabled={
                      profileSaving
                    }
                    rows={4}
                  />
                </div>

                <button
                  type="submit"
                  className="dashboard-primary-button"
                  disabled={
                    profileSaving
                  }
                >
                  {profileSaving
                    ? "Saving..."
                    : "Save profile"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}