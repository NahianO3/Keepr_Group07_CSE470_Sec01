import { useEffect, useState } from "react";
import { X } from "lucide-react";

const DOCUMENT_TYPES = [
  "Insurance",
  "Registration",
  "Tax Token",
];

export default function VehicleDocumentForm({
  document = null,
  vehicles = [],
  selectedVehicleId = "",
  onSubmit,
  onClose,
  loading = false,
}) {
  const [form, setForm] = useState({
    vehicle_id: "",
    document_type: "",
    issue_date: "",
    expiry_date: "",
    document_path: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      vehicle_id:
        document?.vehicle_id ??
        selectedVehicleId ??
        "",
      document_type:
        document?.document_type || "",
      issue_date:
        document?.issue_date || "",
      expiry_date:
        document?.expiry_date || "",
      document_path:
        document?.document_path || "",
    });

    setError("");
  }, [document, selectedVehicleId]);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    setError("");

    if (
      !form.vehicle_id ||
      !form.document_type ||
      !form.expiry_date
    ) {
      setError(
        "Vehicle, document type, and expiry date are required."
      );
      return;
    }

    if (
      form.issue_date &&
      form.expiry_date < form.issue_date
    ) {
      setError(
        "Expiry date cannot be earlier than issue date."
      );
      return;
    }

    onSubmit({
      vehicle_id: Number(form.vehicle_id),
      document_type: form.document_type,
      issue_date: form.issue_date || null,
      expiry_date: form.expiry_date,
      document_path:
        form.document_path.trim() || null,
    });
  };

  return (
    <div className="modal-backdrop">
      <div
        className="appliance-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-document-form-title"
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              {document
                ? "EDIT DOCUMENT"
                : "NEW VEHICLE DOCUMENT"}
            </span>

            <h2 id="vehicle-document-form-title">
              {document
                ? "Update vehicle document"
                : "Add vehicle document"}
            </h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form
          className="auth-form appliance-form"
          onSubmit={submit}
        >
          <div className="form-grid">
            <div className="form-field form-field-full">
              <label htmlFor="vehicle_id">
                Vehicle
              </label>

              <select
                id="vehicle_id"
                name="vehicle_id"
                value={form.vehicle_id}
                onChange={updateField}
                disabled={
                  loading || Boolean(document)
                }
              >
                <option value="">
                  Select vehicle
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
              <label htmlFor="document_type">
                Document type
              </label>

              <select
                id="document_type"
                name="document_type"
                value={form.document_type}
                onChange={updateField}
                disabled={loading}
              >
                <option value="">
                  Select document
                </option>

                {DOCUMENT_TYPES.map((type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="issue_date">
                Issue date
              </label>

              <input
                id="issue_date"
                name="issue_date"
                type="date"
                value={form.issue_date}
                onChange={updateField}
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="expiry_date">
                Expiry date
              </label>

              <input
                id="expiry_date"
                name="expiry_date"
                type="date"
                value={form.expiry_date}
                onChange={updateField}
                disabled={loading}
                required
              />
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="document_path">
                Document path / reference
              </label>

              <input
                id="document_path"
                name="document_path"
                type="text"
                value={form.document_path}
                onChange={updateField}
                disabled={loading}
                placeholder="/uploads/vehicles/3/insurance.pdf"
              />

              <small className="field-help">
                Store the file path or document reference here.
                The current backend does not upload binary files yet.
              </small>
            </div>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="dashboard-primary-button"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : document
                ? "Save changes"
                : "Add document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}