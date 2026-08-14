import { X } from "lucide-react";

export default function ConfirmModal({
  open,
  title = "Confirm action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  danger = false,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
      >
        <div className="confirm-modal-header">
          <div>
            <span className="eyebrow">
              CONFIRMATION
            </span>

            <h2>{title}</h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onCancel}
            disabled={loading}
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        <p className="confirm-modal-message">
          {message}
        </p>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={
              danger
                ? "danger-button"
                : "dashboard-primary-button"
            }
            onClick={onConfirm}
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}