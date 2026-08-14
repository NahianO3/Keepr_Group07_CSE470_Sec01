import { useEffect, useState } from "react";
import {
  Plus,
  ArrowRight,
  Activity,
  Refrigerator,
  Wrench,
  CalendarClock,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appliances, setAppliances] = useState([]);
  const [dueSchedules, setDueSchedules] = useState([]);
  const [warrantyDue, setWarrantyDue] = useState([]);
  const [records, setRecords] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [
          appliancesResponse,
          schedulesResponse,
          warrantyResponse,
          recordsResponse,
        ] = await Promise.all([
          api.get("/appliances"),
          api.get("/maintenance-schedules/due"),
          api.get("/appliances/warranty-due"),
          api.get("/maintenance-records"),
        ]);

        setAppliances(appliancesResponse.data?.data || []);
        setDueSchedules(
          schedulesResponse.data?.data || []
        );
        setWarrantyDue(
          warrantyResponse.data?.data || []
        );
        setRecords(recordsResponse.data?.data || []);
      } catch (error) {
        console.error(
          "Dashboard loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading your Keepr dashboard...
      </div>
    );
  }

  const firstName =
    user?.email?.split("@")[0] || "there";

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              CUSTOMER DASHBOARD
            </span>

            <h1>
              Good to see you, {firstName}.
            </h1>

            <p>
              Keep your appliances healthy and stay ahead
              of maintenance.
            </p>
          </div>

          <button
            className="dashboard-primary-button"
            onClick={() => navigate("/appliances")}
          >
            <Plus size={18} />
            Add appliance
          </button>
        </header>

        <section className="stats-grid">
          <Stat
            icon={<Refrigerator size={20} />}
            label="My appliances"
            value={appliances.length}
            description="Registered appliances"
            className="stat-appliances"
          />

          <Stat
            icon={<Wrench size={20} />}
            label="Maintenance records"
            value={records.length}
            description="Service history"
            className="stat-maintenance"
          />

          <Stat
            icon={<CalendarClock size={20} />}
            label="Maintenance due"
            value={dueSchedules.length}
            description="Requires attention"
            className="stat-due"
          />

          <Stat
            icon={<ShieldCheck size={20} />}
            label="Warranty alerts"
            value={warrantyDue.length}
            description="Warranty warnings"
            className="stat-warranty"
          />
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-section">
            <div className="section-heading">
              <div>
                <span>YOUR APPLIANCES</span>
                <h2>My appliances</h2>
              </div>

              <button
                className="text-button"
                onClick={() =>
                  navigate("/appliances")
                }
              >
                View all
                <ArrowRight size={16} />
              </button>
            </div>

            {appliances.length === 0 ? (
              <div className="empty-card">
                <Activity size={30} />

                <h3>No appliances yet</h3>

                <p>
                  Add your first appliance to begin
                  tracking maintenance and warranty
                  information.
                </p>

                <button
                  className="dashboard-primary-button"
                  onClick={() =>
                    navigate("/appliances")
                  }
                >
                  <Plus size={17} />
                  Add appliance
                </button>
              </div>
            ) : (
              <div className="appliances-grid">
                {appliances
                  .slice(0, 4)
                  .map((appliance) => (
                    <button
                      type="button"
                      key={appliance.id}
                      className="appliance-card"
                      onClick={() =>
                        navigate(
                          `/appliances/${appliance.id}`
                        )
                      }
                    >
                      <div className="appliance-icon">
                        <Refrigerator size={23} />
                      </div>

                      <div className="appliance-info">
                        <span>
                          {appliance.category}
                        </span>

                        <h3>
                          {appliance.name}
                        </h3>

                        <p>
                          Condition:{" "}
                          <strong>
                            {appliance.condition ||
                              "Not specified"}
                          </strong>
                        </p>
                      </div>

                      <ArrowRight
                        size={18}
                        className="card-arrow-icon"
                      />
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="dashboard-section">
            <div className="section-heading">
              <div>
                <span>ATTENTION</span>
                <h2>Reminders</h2>
              </div>

              <button
                className="text-button"
                onClick={() =>
                  navigate("/reminders")
                }
              >
                View all
              </button>
            </div>

            {dueSchedules.length === 0 &&
            warrantyDue.length === 0 ? (
              <div className="empty-card small">
                <h3>You're all caught up</h3>

                <p>
                  There are no maintenance or warranty
                  alerts right now.
                </p>
              </div>
            ) : (
              <div className="reminders-list">
                {dueSchedules
                  .slice(0, 3)
                  .map((schedule) => (
                    <button
                      type="button"
                      key={`schedule-${schedule.id}`}
                      className="reminder-card reminder-warning"
                      onClick={() =>
                        navigate("/reminders")
                      }
                    >
                      <div className="reminder-icon">
                        <CalendarClock size={18} />
                      </div>

                      <div className="reminder-content">
                        <strong>
                          Maintenance due
                        </strong>

                        <p>
                          Appliance #
                          {schedule.appliance_id}
                          {" "}needs attention.
                        </p>
                      </div>

                      <ArrowRight size={17} />
                    </button>
                  ))}

                {warrantyDue
                  .slice(0, 3)
                  .map((appliance) => (
                    <button
                      type="button"
                      key={`warranty-${appliance.id}`}
                      className="reminder-card reminder-warning"
                      onClick={() =>
                        navigate("/reminders")
                      }
                    >
                      <div className="reminder-icon">
                        <ShieldCheck size={18} />
                      </div>

                      <div className="reminder-content">
                        <strong>
                          Warranty alert
                        </strong>

                        <p>
                          {appliance.name ||
                            `Appliance #${appliance.id}`}
                        </p>
                      </div>

                      <ArrowRight size={17} />
                    </button>
                  ))}
              </div>
            )}
          </div>
        </section>

        <section className="history-section">
          <div className="section-heading">
            <div>
              <span>MAINTENANCE HISTORY</span>
              <h2>Recent activity</h2>
            </div>

            <button
              className="text-button"
              onClick={() =>
                navigate("/maintenance-history")
              }
            >
              View history
              <ArrowRight size={16} />
            </button>
          </div>

          {records.length === 0 ? (
            <div className="empty-card small">
              <h3>No maintenance history yet</h3>

              <p>
                Your completed and recorded maintenance
                will appear here.
              </p>
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Provider</th>
                    <th>Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {records
                    .slice(0, 5)
                    .map((record) => (
                      <tr key={record.id}>
                        <td>
                          {record.maintenance_type ||
                            "—"}
                        </td>

                        <td>
                          {record.maintenance_date ||
                            "—"}
                        </td>

                        <td>
                          {record.service_provider_id
                            ? `Provider #${record.service_provider_id}`
                            : "—"}
                        </td>

                        <td>
                          {record.cost ?? "—"}
                        </td>

                        <td>
                          <span className="status-badge">
                            {record.status || "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({
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