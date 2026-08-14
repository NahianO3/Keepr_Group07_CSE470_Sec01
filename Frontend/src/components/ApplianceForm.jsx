import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function ApplianceForm({
  appliance = null,
  onSubmit,
  onClose,
  loading = false,
}) {
  const [form, setForm] = useState({
    category: "",
    name: "",
    purchase_date: "",
    warranty_expiry: "",
    maintenance_interval: "",
    condition: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      category: appliance?.category || "",
      name: appliance?.name || "",
      purchase_date:
        appliance?.purchase_date || "",
      warranty_expiry:
        appliance?.warranty_expiry || "",
      maintenance_interval:
        appliance?.maintenance_interval ?? "",
      condition:
        appliance?.condition || "",
    });

    setError("");
  }, [appliance]);

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
      !form.category ||
      !form.name ||
      !form.purchase_date ||
      !form.warranty_expiry ||
      !form.maintenance_interval ||
      !form.condition
    ) {
      setError(
        "Please complete all required fields."
      );
      return;
    }

    onSubmit({
      category: form.category.trim(),
      name: form.name.trim(),
      purchase_date: form.purchase_date,
      warranty_expiry: form.warranty_expiry,
      maintenance_interval: Number(
        form.maintenance_interval
      ),
      condition: form.condition,
    });
  };

  return (
    <div className="modal-backdrop">
      <div
        className="appliance-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appliance-form-title"
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              {appliance
                ? "EDIT APPLIANCE"
                : "NEW APPLIANCE"}
            </span>

            <h2 id="appliance-form-title">
              {appliance
                ? "Update appliance"
                : "Add an appliance"}
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
              <label htmlFor="category">
                Category
              </label>

              <input
                id="category"
                name="category"
                type="text"
                placeholder="Refrigerator"
                value={form.category}
                onChange={updateField}
                disabled={loading}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="name">
                Appliance name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                placeholder="Samsung Refrigerator"
                value={form.name}
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
              <label htmlFor="warranty_expiry">
                Warranty expiry
              </label>

              <input
                id="warranty_expiry"
                name="warranty_expiry"
                type="date"
                value={form.warranty_expiry}
                onChange={updateField}
                disabled={loading}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="maintenance_interval">
                Maintenance interval
              </label>

              <input
                id="maintenance_interval"
                name="maintenance_interval"
                type="number"
                min="1"
                placeholder="90"
                value={form.maintenance_interval}
                onChange={updateField}
                disabled={loading}
                required
              />

              <small className="field-help">
                Number of days between services.
              </small>
            </div>

            <div className="form-field">
              <label htmlFor="condition">
                Current condition
              </label>

              <select
                id="condition"
                name="condition"
                value={form.condition}
                onChange={updateField}
                disabled={loading}
                required
              >
                <option value="">
                  Select condition
                </option>
                <option value="Excellent">
                  Excellent
                </option>
                <option value="Good">
                  Good
                </option>
                <option value="Fair">
                  Fair
                </option>
                <option value="Needs Attention">
                  Needs Attention
                </option>
                <option value="Poor">
                  Poor
                </option>
              </select>
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
                : appliance
                ? "Save changes"
                : "Add appliance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}