import { useEffect, useState } from "react";
import {
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react";

export default function BeforeAfterUpload({
  onSubmit,
  onClose,
  loading = false,
}) {
  const [beforeFile, setBeforeFile] =
    useState(null);

  const [afterFile, setAfterFile] =
    useState(null);

  const [beforePreview, setBeforePreview] =
    useState("");

  const [afterPreview, setAfterPreview] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!beforeFile) {
      setBeforePreview("");
      return;
    }

    const url =
      URL.createObjectURL(
        beforeFile
      );

    setBeforePreview(url);

    return () =>
      URL.revokeObjectURL(url);
  }, [beforeFile]);

  useEffect(() => {
    if (!afterFile) {
      setAfterPreview("");
      return;
    }

    const url =
      URL.createObjectURL(
        afterFile
      );

    setAfterPreview(url);

    return () =>
      URL.revokeObjectURL(url);
  }, [afterFile]);

  const handleBeforeChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Before image must be an image file."
      );
      return;
    }

    setError("");
    setBeforeFile(file);
  };

  const handleAfterChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "After image must be an image file."
      );
      return;
    }

    setError("");
    setAfterFile(file);
  };

  const submit = (event) => {
    event.preventDefault();

    setError("");

    if (!beforeFile) {
      setError(
        "Please select the before-maintenance image."
      );
      return;
    }

    if (!afterFile) {
      setError(
        "Please select the after-maintenance image."
      );
      return;
    }

    const formData =
      new FormData();

    formData.append(
      "before_image",
      beforeFile
    );

    formData.append(
      "after_image",
      afterFile
    );

    onSubmit(formData);
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
              MAINTENANCE COMPARISON
            </span>

            <h2>
              Upload before & after
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
          className="auth-form"
          onSubmit={submit}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "16px",
            }}
          >
            {/* BEFORE */}

            <div className="form-field">
              <label>
                Before maintenance
              </label>

              <label
                style={{
                  display: "flex",
                  flexDirection:
                    "column",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  minHeight: "220px",
                  padding: "16px",
                  border:
                    "1px dashed var(--border)",
                  borderRadius: "14px",
                  cursor: "pointer",
                  overflow: "hidden",
                }}
              >
                {beforePreview ? (
                  <img
                    src={beforePreview}
                    alt="Before maintenance preview"
                    style={{
                      width: "100%",
                      height: "220px",
                      objectFit: "contain",
                      borderRadius: "10px",
                    }}
                  />
                ) : (
                  <>
                    <ImageIcon
                      size={32}
                    />

                    <span
                      style={{
                        marginTop: "10px",
                        fontWeight: 700,
                      }}
                    >
                      Choose before image
                    </span>
                  </>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleBeforeChange
                  }
                  disabled={loading}
                  hidden
                />
              </label>

              {beforeFile && (
                <small>
                  {beforeFile.name}
                </small>
              )}
            </div>

            {/* AFTER */}

            <div className="form-field">
              <label>
                After maintenance
              </label>

              <label
                style={{
                  display: "flex",
                  flexDirection:
                    "column",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  minHeight: "220px",
                  padding: "16px",
                  border:
                    "1px dashed var(--border)",
                  borderRadius: "14px",
                  cursor: "pointer",
                  overflow: "hidden",
                }}
              >
                {afterPreview ? (
                  <img
                    src={afterPreview}
                    alt="After maintenance preview"
                    style={{
                      width: "100%",
                      height: "220px",
                      objectFit: "contain",
                      borderRadius: "10px",
                    }}
                  />
                ) : (
                  <>
                    <ImageIcon
                      size={32}
                    />

                    <span
                      style={{
                        marginTop: "10px",
                        fontWeight: 700,
                      }}
                    >
                      Choose after image
                    </span>
                  </>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleAfterChange
                  }
                  disabled={loading}
                  hidden
                />
              </label>

              {afterFile && (
                <small>
                  {afterFile.name}
                </small>
              )}
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
              <Upload size={16} />

              {loading
                ? "Uploading..."
                : "Upload & Compare"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}