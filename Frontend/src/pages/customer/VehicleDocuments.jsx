import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Car,
} from "lucide-react";
import {
  useSearchParams,
} from "react-router-dom";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import VehicleDocumentForm from "../../components/VehicleDocumentForm";

export default function VehicleDocuments() {
  const [searchParams] = useSearchParams();

  const [vehicles, setVehicles] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [selectedVehicleId, setSelectedVehicleId] =
    useState(
      searchParams.get("vehicle_id") || ""
    );

  const [statusFilter, setStatusFilter] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingDocument, setEditingDocument] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadVehicles = async () => {
    const response =
      await api.get("/vehicles");

    setVehicles(
      response.data?.data || []
    );
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (selectedVehicleId) {
        params.set(
          "vehicle_id",
          selectedVehicleId
        );
      }

      if (typeFilter) {
        params.set(
          "document_type",
          typeFilter
        );
      }

      if (statusFilter) {
        params.set(
          "status",
          statusFilter
        );
      }

      const query = params.toString();

      const response = await api.get(
        `/vehicle-documents${
          query ? `?${query}` : ""
        }`
      );

      setDocuments(
        response.data?.data || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load vehicle documents."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setError("");

      await loadVehicles();
      await loadDocuments();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load vehicle documents."
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedVehicleId,
    statusFilter,
    typeFilter,
  ]);

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(
      (item) =>
        item.id === Number(vehicleId)
    );

    if (!vehicle) {
      return `Vehicle #${vehicleId}`;
    }

    return `${vehicle.brand} ${vehicle.model}`;
  };

  const openAdd = () => {
    setEditingDocument(null);
    setShowForm(true);
  };

  const openEdit = (document) => {
    setEditingDocument(document);
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingDocument(null);
  };

  const saveDocument = async (form) => {
    try {
      setSaving(true);
      setError("");

      if (editingDocument) {
        await api.put(
          `/vehicle-documents/${editingDocument.id}`,
          form
        );
      } else {
        await api.post(
          "/vehicle-documents",
          form
        );
      }

      closeForm();
      await loadDocuments();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save vehicle document."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteDocument = async (document) => {
    const confirmed = window.confirm(
      `Delete this ${document.document_type} document?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/vehicle-documents/${document.id}`
      );

      await loadDocuments();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete vehicle document."
      );
    }
  };

  const statusInfo = (status) => {
    if (status === "Expired") {
      return {
        icon: <AlertTriangle size={16} />,
        className: "document-status-danger",
      };
    }

    if (status === "Expiring Soon") {
      return {
        icon: <Clock3 size={16} />,
        className: "document-status-warning",
      };
    }

    if (status === "Active") {
      return {
        icon: <CheckCircle2 size={16} />,
        className: "document-status-success",
      };
    }

    return {
      icon: <FileText size={16} />,
      className: "document-status-neutral",
    };
  };

  const summary = useMemo(() => {
    return {
      total: documents.length,
      expired: documents.filter(
        (item) =>
          item.document_status === "Expired"
      ).length,
      expiringSoon: documents.filter(
        (item) =>
          item.document_status ===
          "Expiring Soon"
      ).length,
      active: documents.filter(
        (item) =>
          item.document_status === "Active"
      ).length,
    };
  }, [documents]);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              VEHICLE DOCUMENTS
            </span>

            <h1>Vehicle documents</h1>

            <p>
              Keep insurance, registration, and
              tax token records organized with
              expiry tracking.
            </p>
          </div>

          <button
            className="dashboard-primary-button"
            onClick={openAdd}
            disabled={vehicles.length === 0}
          >
            <Plus size={18} />
            Add document
          </button>
        </header>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <section className="document-summary-grid">
          <SummaryCard
            icon={<FileText size={19} />}
            label="Total documents"
            value={summary.total}
          />

          <SummaryCard
            icon={<CheckCircle2 size={19} />}
            label="Active"
            value={summary.active}
          />

          <SummaryCard
            icon={<Clock3 size={19} />}
            label="Expiring soon"
            value={summary.expiringSoon}
          />

          <SummaryCard
            icon={<AlertTriangle size={19} />}
            label="Expired"
            value={summary.expired}
          />
        </section>

        <section className="document-filter-bar">
          <div className="form-field">
            <label htmlFor="vehicle-filter">
              Vehicle
            </label>

            <select
              id="vehicle-filter"
              value={selectedVehicleId}
              onChange={(event) =>
                setSelectedVehicleId(
                  event.target.value
                )
              }
            >
              <option value="">
                All vehicles
              </option>

              {vehicles.map((vehicle) => (
                <option
                  key={vehicle.id}
                  value={vehicle.id}
                >
                  {vehicle.brand} {vehicle.model}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="type-filter">
              Document type
            </label>

            <select
              id="type-filter"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All types
              </option>
              <option value="Insurance">
                Insurance
              </option>
              <option value="Registration">
                Registration
              </option>
              <option value="Tax Token">
                Tax Token
              </option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="status-filter">
              Status
            </label>

            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All statuses
              </option>
              <option value="Active">
                Active
              </option>
              <option value="Expiring Soon">
                Expiring Soon
              </option>
              <option value="Expired">
                Expired
              </option>
            </select>
          </div>
        </section>

        {loading ? (
          <div className="dashboard-loading">
            Loading vehicle documents...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="empty-card">
            <Car size={30} />

            <h3>
              Add a vehicle first
            </h3>

            <p>
              Vehicle documents are linked to
              a specific vehicle.
            </p>
          </div>
        ) : documents.length === 0 ? (
          <div className="empty-card">
            <FileText size={30} />

            <h3>
              No vehicle documents
            </h3>

            <p>
              Add insurance, registration, or
              tax token records for your vehicles.
            </p>

            <button
              className="dashboard-primary-button"
              onClick={openAdd}
            >
              <Plus size={17} />
              Add document
            </button>
          </div>
        ) : (
          <section className="document-list">
            {documents.map((document) => {
              const info = statusInfo(
                document.document_status
              );

              return (
                <article
                  className="document-card"
                  key={document.id}
                >
                  <div className="document-card-icon">
                    <FileText size={22} />
                  </div>

                  <div className="document-card-content">
                    <div className="document-card-top">
                      <div>
                        <span className="document-type">
                          {
                            document.document_type
                          }
                        </span>

                        <h2>
                          {getVehicleName(
                            document.vehicle_id
                          )}
                        </h2>
                      </div>

                      <span
                        className={`document-status ${info.className}`}
                      >
                        {info.icon}
                        {
                          document.document_status
                        }
                      </span>
                    </div>

                    <div className="document-meta">
                      <div>
                        <span>
                          Issue date
                        </span>

                        <strong>
                          {document.issue_date ||
                            "—"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Expiry date
                        </span>

                        <strong>
                          {document.expiry_date ||
                            "—"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Document reference
                        </span>

                        <strong>
                          {document.document_path ||
                            "Not provided"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="document-actions">
                    <button
                      type="button"
                      onClick={() =>
                        openEdit(document)
                      }
                      title="Edit document"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      className="delete-action"
                      onClick={() =>
                        deleteDocument(
                          document
                        )
                      }
                      title="Delete document"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {showForm && (
          <VehicleDocumentForm
            document={editingDocument}
            vehicles={vehicles}
            selectedVehicleId={
              selectedVehicleId
            }
            onSubmit={saveDocument}
            onClose={closeForm}
            loading={saving}
          />
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="document-summary-card">
      <div className="document-summary-icon">
        {icon}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}