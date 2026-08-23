import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function ServiceForm({
  service = null,
  onSubmit,
  onClose,
  loading = false,
}) {
  const [form, setForm] = useState({
    service_name: "",
    category: "",
    description: "",
    estimated_price: "",
    estimated_duration_hours: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      service_name: service?.service_name || "",
      category: service?.category || "",
      description: service?.description || "",
      estimated_price: service?.estimated_price ?? "",
      estimated_duration_hours:
        service?.estimated_duration_hours ?? "",
    });

    setError("");
  }, [service]);

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

    if (!form.service_name.trim()) {
      setError("Service name is required.");
      return;
    }

    onSubmit({
      service_name: form.service_name.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      estimated_price:
        form.estimated_price === ""
          ? ""
          : Number(form.estimated_price),
      estimated_duration_hours:
        form.estimated_duration_hours === ""
          ? ""
          : Number(form.estimated_duration_hours),
    });
  };

  return (
    <div className="modal-backdrop">
      <div
        className="appliance-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-form-title"
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              {service ? "EDIT SERVICE" : "NEW SERVICE"}
            </span>

            <h2 id="service-form-title">
              {service
                ? "Update offered service"
                : "Add an offered service"}
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
              <label htmlFor="service_name">
                Service name
              </label>

              <input
                id="service_name"
                name="service_name"
                type="text"
                placeholder="AC Gas Refill"
                value={form.service_name}
                onChange={updateField}
                disabled={loading}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="category">Category</label>

              <input
                id="category"
                name="category"
                type="text"
                placeholder="AC Repair"
                value={form.category}
                onChange={updateField}
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="estimated_price">
                Estimated price (৳)
                <span className="optional-label">
                  {" "}
                  (optional)
                </span>
              </label>

              <input
                id="estimated_price"
                name="estimated_price"
                type="number"
                min="0"
                step="0.01"
                placeholder="1500"
                value={form.estimated_price}
                onChange={updateField}
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="estimated_duration_hours">
                Estimated duration (hours)
                <span className="optional-label">
                  {" "}
                  (optional)
                </span>
              </label>

              <input
                id="estimated_duration_hours"
                name="estimated_duration_hours"
                type="number"
                min="0"
                placeholder="2"
                value={form.estimated_duration_hours}
                onChange={updateField}
                disabled={loading}
              />
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="description">
                Description
                <span className="optional-label">
                  {" "}
                  (optional)
                </span>
              </label>

              <textarea
                id="description"
                name="description"
                rows="3"
                placeholder="What's included in this service"
                value={form.description}
                onChange={updateField}
                disabled={loading}
              />
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
                : service
                ? "Save changes"
                : "Add service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
