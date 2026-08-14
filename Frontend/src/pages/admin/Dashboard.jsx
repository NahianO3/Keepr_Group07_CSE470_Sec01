import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserCheck,
  UserCog,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [records, setRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [usersResponse, recordsResponse] =
        await Promise.all([
          api.get("/admin/users"),
          api.get("/admin/maintenance-records"),
        ]);

      setUsers(usersResponse.data?.data || []);
      setRecords(recordsResponse.data?.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const customers = users.filter(
      (user) => user.role === "customer"
    );

    const providers = users.filter(
      (user) => user.role === "service_provider"
    );

    const pendingProviders = providers.filter(
      (user) => user.account_status !== "active"
    );

    const suspended = users.filter(
      (user) => user.account_status === "suspended"
    );

    return {
      totalUsers: users.length,
      customers: customers.length,
      providers: providers.length,
      pendingProviders: pendingProviders.length,
      suspended: suspended.length,
      records: records.length,
    };
  }, [users, records]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              ADMINISTRATION
            </span>

            <h1>System overview.</h1>

            <p>
              Monitor users, service providers and
              maintenance activity across Keepr.
            </p>
          </div>
        </header>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <section className="stats-grid">
          <AdminStat
            icon={<Users size={20} />}
            label="Total users"
            value={stats.totalUsers}
            description="All registered accounts"
            className="stat-appliances"
          />

          <AdminStat
            icon={<UserCog size={20} />}
            label="Customers"
            value={stats.customers}
            description="Customer accounts"
            className="stat-maintenance"
          />

          <AdminStat
            icon={<UserCheck size={20} />}
            label="Service providers"
            value={stats.providers}
            description="Provider accounts"
            className="stat-warranty"
          />

          <AdminStat
            icon={<ClipboardList size={20} />}
            label="Maintenance records"
            value={stats.records}
            description="Recorded services"
            className="stat-due"
          />
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-section">
            <div className="section-heading">
              <div>
                <span>ACCOUNT MANAGEMENT</span>
                <h2>Users</h2>
              </div>

              <button
                className="text-button"
                onClick={() =>
                  navigate("/admin/users")
                }
              >
                Manage users
                <ArrowRight size={16} />
              </button>
            </div>

            {users.length === 0 ? (
              <div className="empty-card">
                <Users size={30} />

                <h3>No users found</h3>

                <p>
                  Registered users will appear here.
                </p>
              </div>
            ) : (
              <div className="admin-user-list">
                {users.slice(0, 6).map((user) => (
                  <div
                    className="admin-user-row"
                    key={user.id}
                  >
                    <div className="admin-user-avatar">
                      {user.full_name
                        ?.charAt(0)
                        ?.toUpperCase() || "U"}
                    </div>

                    <div className="admin-user-info">
                      <strong>
                        {user.full_name || "Unnamed user"}
                      </strong>

                      <span>{user.email}</span>
                    </div>

                    <span className="status-badge">
                      {user.role}
                    </span>

                    <span
                      className={`status-badge ${
                        user.account_status === "active"
                          ? "status-active"
                          : "status-suspended"
                      }`}
                    >
                      {user.account_status || "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-section">
            <div className="section-heading">
              <div>
                <span>SERVICE PROVIDERS</span>
                <h2>Approval</h2>
              </div>

              <button
                className="text-button"
                onClick={() =>
                  navigate("/admin/provider-approval")
                }
              >
                Review
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="admin-approval-card">
              <UserCheck size={27} />

              <strong>
                {stats.pendingProviders}
              </strong>

              <span>
                provider accounts require review
              </span>

              <button
                className="dashboard-primary-button"
                onClick={() =>
                  navigate("/admin/provider-approval")
                }
              >
                Review providers
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function AdminStat({
  icon,
  label,
  value,
  description,
  className,
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${className}`}>
        {icon}
      </div>

      <div className="stat-content">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>
    </div>
  );
}