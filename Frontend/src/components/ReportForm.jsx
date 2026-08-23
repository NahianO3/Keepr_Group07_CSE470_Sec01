import { useState } from "react";
import { X } from "lucide-react";

export default function ReportForm({
  onSubmit,
  onClose,
  loading = false,
}) {
  const [reason, setReason] = useState("");
  const [description, setDescription] =
    useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    setError("");

    if (!reason.trim()) {
      setError(
        "Please provide a reason."
      );
      return;
    }

    onSubmit({
      reason: reason.trim(),
      description:
        description.trim() || null,
    });
  };

  return (
    <div className="modal-backdrop">
      <div
        className="appliance-modal"
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              REPORT SERVICE
            </span>

            <h2>
              Report this service
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
          <div className="form-field">
            <label htmlFor="report-reason">
              Reason
            </label>

            <input
              id="report-reason"
              type="text"
              value={reason}
              onChange={(event) =>
                setReason(event.target.value)
              }
              placeholder="e.g. Poor service or misconduct"
              disabled={loading}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="report-description">
              Details
            </label>

            <textarea
              id="report-description"
              rows="5"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Describe what happened"
              disabled={loading}
            />
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
                ? "Submitting..."
                : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}