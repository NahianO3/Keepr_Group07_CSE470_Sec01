import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function VehicleForm({
  vehicle = null,
  onSubmit,
  onClose,
  loading = false,
}) {
  const [form, setForm] = useState({
    brand: "",
    model: "",
    purchase_date: "",
    current_mileage: "",
    last_service_mileage: "",
    maintenance_interval_km: "",
    maintenance_interval_days: "",
    insurance_status: "",
    registration_status: "",
    tax_token_status: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      brand: vehicle?.brand || "",
      model: vehicle?.model || "",
      purchase_date: vehicle?.purchase_date || "",
      current_mileage: vehicle?.current_mileage ?? "",
      last_service_mileage:
        vehicle?.last_service_mileage ?? "",
      maintenance_interval_km:
        vehicle?.maintenance_interval_km ?? "",
      maintenance_interval_days:
        vehicle?.maintenance_interval_days ?? "",
      insurance_status: vehicle?.insurance_status || "",
      registration_status:
        vehicle?.registration_status || "",
      tax_token_status: vehicle?.tax_token_status || "",
    });

    setError("");
  }, [vehicle]);

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
      !form.brand ||
      !form.model ||
      !form.purchase_date ||
      form.current_mileage === "" ||
      !form.maintenance_interval_km ||
      !form.maintenance_interval_days ||
      !form.insurance_status ||
      !form.registration_status ||
      !form.tax_token_status
    ) {
      setError(
        "Please complete all required fields."
      );
      return;
    }

    onSubmit({
      brand: form.brand.trim(),
      model: form.model.trim(),
      purchase_date: form.purchase_date,
      current_mileage: Number(form.current_mileage),
      last_service_mileage:
        form.last_service_mileage === ""
          ? null
          : Number(form.last_service_mileage),
      maintenance_interval_km: Number(
        form.maintenance_interval_km
      ),
      maintenance_interval_days: Number(
        form.maintenance_interval_days
      ),
      insurance_status: form.insurance_status,
      registration_status: form.registration_status,
      tax_token_status: form.tax_token_status,
    });
  };

  return (
    <div className="modal-backdrop">
      <div
        className="appliance-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-form-title"
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              {vehicle ? "EDIT VEHICLE" : "NEW VEHICLE"}
            </span>

            <h2 id="vehicle-form-title">
              {vehicle
                ? "Update vehicle"
                : "Register a vehicle"}
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
            <div className="form-field">
              <label htmlFor="brand">Brand</label>

              <input
                id="brand"
                name="brand"
                type="text"
                placeholder="Toyota"
                value={form.brand}
                onChange={updateField}
                disabled={loading}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="model">Model</label>

              <input
                id="model"
                name="model"
                type="text"
                placeholder="Corolla"
                value={form.model}
                onChange={updateField}
                disabled={loading}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="purchase_date">
                Purchase date
              </label>

              <input
                id="purchase_date"
                name="purchase_date"
                type="date"
                value={form.purchase_date}
                onChange={updateField}
                disabled={loading}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="current_mileage">
                Current mileage (km)
              </label>

              <input
                id="current_mileage"
                name="current_mileage"
                type="number"
                min="0"
                placeholder="15000"
                value={form.current_mileage}
                onChange={updateField}
                disabled={loading}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="last_service_mileage">
                Last service mileage
                <span className="optional-label">
                  {" "}
                  (optional)
                </span>
              </label>

              <input
                id="last_service_mileage"
                name="last_service_mileage"
                type="number"
                min="0"
                placeholder="12000"
                value={form.last_service_mileage}
                onChange={updateField}
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="maintenance_interval_km">
                Service interval (km)
              </label>

              <input
                id="maintenance_interval_km"
                name="maintenance_interval_km"
                type="number"
                min="1"
                placeholder="5000"
                value={form.maintenance_interval_km}
                onChange={updateField}
                disabled={loading}
                required
              />

              <small className="field-help">
                Distance between services.
              </small>
            </div>

            <div className="form-field">
              <label htmlFor="maintenance_interval_days">
                Service interval (days)
              </label>

              <input
                id="maintenance_interval_days"
                name="maintenance_interval_days"
                type="number"
                min="1"
                placeholder="180"
                value={form.maintenance_interval_days}
                onChange={updateField}
                disabled={loading}
                required
              />

              <small className="field-help">
                The system schedules the next service using
                whichever of mileage or elapsed time comes
                first.
              </small>
            </div>

            <div className="form-field">
              <label htmlFor="insurance_status">
                Insurance status
              </label>

              <select
                id="insurance_status"
                name="insurance_status"
                value={form.insurance_status}
                onChange={updateField}
                disabled={loading}
                required
              >
                <option value="">Select status</option>
                <option value="Active">Active</option>
                <option value="Expiring Soon">
                  Expiring Soon
                </option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="registration_status">
                Registration status
              </label>

              <select
                id="registration_status"
                name="registration_status"
                value={form.registration_status}
                onChange={updateField}
                disabled={loading}
                required
              >
                <option value="">Select status</option>
                <option value="Valid">Valid</option>
                <option value="Expiring Soon">
                  Expiring Soon
                </option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="tax_token_status">
                Tax token status
              </label>

              <select
                id="tax_token_status"
                name="tax_token_status"
                value={form.tax_token_status}
                onChange={updateField}
                disabled={loading}
                required
              >
                <option value="">Select status</option>
                <option value="Valid">Valid</option>
                <option value="Expiring Soon">
                  Expiring Soon
                </option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="form-error">{error}</div>
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
                : vehicle
                ? "Save changes"
                : "Register vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
