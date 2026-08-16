import { useEffect, useState } from "react";
import {
  Wrench,
  ArrowRight,
} from "lucide-react";
import {
  useSearchParams,
} from "react-router-dom";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

export default function MaintenanceHistory() {
  const [searchParams] =
    useSearchParams();

  const applianceId =
    searchParams.get("appliance_id");

  const [records, setRecords] =
    useState([]);

  const [appliances, setAppliances] =
    useState([]);

  const [selectedAppliance, setSelectedAppliance] =
    useState(applianceId || "");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const endpoint =
        selectedAppliance
          ? `/maintenance-records?appliance_id=${selectedAppliance}`
          : "/maintenance-records";

      const response =
        await api.get(endpoint);

      setRecords(
        response.data?.data || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load maintenance history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadAppliances = async () => {
      try {
        const response =
          await api.get("/appliances");

        setAppliances(
          response.data?.data || []
        );
      } catch (err) {
        console.error(err);
      }
    };

    loadAppliances();
  }, []);

  useEffect(() => {
    loadHistory();
  }, [selectedAppliance]);

  const applianceName = (id) => {
    const appliance =
      appliances.find(
        (item) => item.id === id
      );

    return (
      appliance?.name ||
      `Appliance #${id}`
    );
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              SERVICE HISTORY
            </span>

            <h1>
              Maintenance history
            </h1>

            <p>
              Review your appliance service records,
              costs, providers and maintenance status.
            </p>
          </div>
        </header>

        <div className="schedule-filter">
          <label htmlFor="history-filter">
            Appliance
          </label>

          <select
            id="history-filter"
            value={selectedAppliance}
            onChange={(event) =>
              setSelectedAppliance(
                event.target.value
              )
            }
          >
            <option value="">
              All appliances
            </option>

            {appliances.map((appliance) => (
              <option
                key={appliance.id}
                value={appliance.id}
              >
                {appliance.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="dashboard-loading">
            Loading maintenance history...
          </div>
        ) : records.length === 0 ? (
          <div className="empty-card">
            <Wrench size={30} />

            <h3>
              No maintenance records
            </h3>

            <p>
              Maintenance services recorded for your
              appliances will appear here.
            </p>
          </div>
        ) : (
          <section className="history-section">
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Appliance</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Provider</th>
                    <th>Work performed</th>
                    <th>Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>
                        {applianceName(
                          record.appliance_id
                        )}
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
                        {record.service_provider_id
                          ? `Provider #${record.service_provider_id}`
                          : "—"}
                      </td>

                      <td className="history-work-cell">
                        {record.work_performed ||
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
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {records.length > 0 && (
          <div className="history-summary">
            <div>
              <span>Total records</span>
              <strong>
                {records.length}
              </strong>
            </div>

            <ArrowRight
              size={18}
            />
          </div>
        )}
      </main>
    </div>
  );
}