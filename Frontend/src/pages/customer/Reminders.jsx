import { useEffect, useState } from "react";
import {
  CalendarClock,
  ShieldCheck,
  ArrowRight,
  Bell,
} from "lucide-react";
import {
  useNavigate,
} from "react-router-dom";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

export default function Reminders() {
  const navigate = useNavigate();

  const [dueSchedules, setDueSchedules] =
    useState([]);

  const [warrantyDue, setWarrantyDue] =
    useState([]);

  const [appliances, setAppliances] =
    useState([]);

  const [vehicles, setVehicles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadReminders = async () => {
      try {
        const [
          scheduleResponse,
          warrantyResponse,
          appliancesResponse,
          vehiclesResponse,
        ] = await Promise.all([
          api.get(
            "/maintenance-schedules/due"
          ),
          api.get(
            "/appliances/warranty-due"
          ),
          api.get(
            "/appliances"
          ),
          api.get(
            "/vehicles"
          ),
        ]);

        setDueSchedules(
          scheduleResponse.data?.data ||
            []
        );

        setWarrantyDue(
          warrantyResponse.data?.data ||
            []
        );

        setAppliances(
          appliancesResponse.data?.data ||
            []
        );

        setVehicles(
          vehiclesResponse.data?.data ||
            []
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load reminders."
        );
      } finally {
        setLoading(false);
      }
    };

    loadReminders();
  }, []);

  const getApplianceName = (id) => {
    const appliance =
      appliances.find(
        (item) => item.id === id
      );

    return (
      appliance?.name ||
      `Appliance #${id}`
    );
  };

  const getVehicleName = (id) => {
    const vehicle = vehicles.find(
      (item) => item.id === id
    );

    return vehicle
      ? `${vehicle.brand} ${vehicle.model}`
      : `Vehicle #${id}`;
  };

  const getScheduleTarget = (schedule) =>
    schedule.vehicle_id
      ? `/vehicles/${schedule.vehicle_id}`
      : `/appliances/${schedule.appliance_id}`;

  const getScheduleName = (schedule) =>
    schedule.vehicle_id
      ? getVehicleName(schedule.vehicle_id)
      : getApplianceName(schedule.appliance_id);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              REMINDERS
            </span>

            <h1>
              Stay ahead of maintenance.
            </h1>

            <p>
              Important maintenance and warranty
              alerts for your appliances and vehicles.
            </p>
          </div>
        </header>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="dashboard-loading">
            Loading reminders...
          </div>
        ) : (
          <>
            <section className="reminder-overview-grid">
              <div className="reminder-summary-card reminder-summary-warning">
                <div className="summary-icon">
                  <CalendarClock
                    size={22}
                  />
                </div>

                <div>
                  <span>
                    Maintenance due
                  </span>

                  <strong>
                    {dueSchedules.length}
                  </strong>

                  <p>
                    Maintenance service tasks
                  </p>
                </div>
              </div>

              <div className="reminder-summary-card reminder-summary-success">
                <div className="summary-icon">
                  <ShieldCheck
                    size={22}
                  />
                </div>

                <div>
                  <span>
                    Warranty alerts
                  </span>

                  <strong>
                    {warrantyDue.length}
                  </strong>

                  <p>
                    Warranty expiration warnings
                  </p>
                </div>
              </div>
            </section>

            <section className="dashboard-grid">
              <div className="dashboard-section">
                <div className="section-heading">
                  <div>
                    <span>
                      MAINTENANCE
                    </span>

                    <h2>
                      Maintenance due
                    </h2>
                  </div>
                </div>

                {dueSchedules.length === 0 ? (
                  <div className="empty-card">
                    <CalendarClock
                      size={30}
                    />

                    <h3>
                      No maintenance due
                    </h3>

                    <p>
                      Everything is currently
                      up to date.
                    </p>
                  </div>
                ) : (
                  <div className="reminders-list">
                    {dueSchedules.map(
                      (schedule) => (
                        <button
                          type="button"
                          key={schedule.id}
                          className="reminder-card reminder-warning"
                          onClick={() =>
                            navigate(
                              getScheduleTarget(schedule)
                            )
                          }
                        >
                          <div className="reminder-icon">
                            <CalendarClock
                              size={19}
                            />
                          </div>

                          <div className="reminder-content">
                            <strong>
                              {getScheduleName(schedule)}
                            </strong>

                            <p>
                              Next service:{" "}
                              {schedule.next_service_date ||
                                "Due"}
                              {schedule.next_service_mileage
                                ? ` (or ${schedule.next_service_mileage} km)`
                                : ""}
                            </p>
                          </div>

                          <ArrowRight
                            size={18}
                          />
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="dashboard-section">
                <div className="section-heading">
                  <div>
                    <span>
                      WARRANTY
                    </span>

                    <h2>
                      Warranty alerts
                    </h2>
                  </div>
                </div>

                {warrantyDue.length === 0 ? (
                  <div className="empty-card">
                    <ShieldCheck
                      size={30}
                    />

                    <h3>
                      No warranty alerts
                    </h3>

                    <p>
                      No warranty expiration
                      warnings right now.
                    </p>
                  </div>
                ) : (
                  <div className="reminders-list">
                    {warrantyDue.map(
                      (appliance) => (
                        <button
                          type="button"
                          key={appliance.id}
                          className="reminder-card reminder-success"
                          onClick={() =>
                            navigate(
                              `/appliances/${appliance.id}`
                            )
                          }
                        >
                          <div className="reminder-icon">
                            <ShieldCheck
                              size={19}
                            />
                          </div>

                          <div className="reminder-content">
                            <strong>
                              {appliance.name ||
                                `Appliance #${appliance.id}`}
                            </strong>

                            <p>
                              Warranty:
                              {" "}
                              {appliance.warranty_expiry ||
                                "Expiring soon"}
                            </p>
                          </div>

                          <ArrowRight
                            size={18}
                          />
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </section>

            {dueSchedules.length === 0 &&
              warrantyDue.length === 0 && (
                <section className="all-clear-card">
                  <div className="all-clear-icon">
                    <Bell size={24} />
                  </div>

                  <div>
                    <h2>
                      You're all caught up
                    </h2>

                    <p>
                      Keepr currently has no
                      maintenance or warranty
                      reminders for your appliances.
                    </p>
                  </div>
                </section>
              )}
          </>
        )}
      </main>
    </div>
  );
}