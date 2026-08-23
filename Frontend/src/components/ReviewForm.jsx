import { useState } from "react";
import { Star, X } from "lucide-react";

export default function ReviewForm({
  onSubmit,
  onClose,
  loading = false,
}) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    setError("");

    if (rating < 1 || rating > 5) {
      setError(
        "Please select a rating from 1 to 5."
      );
      return;
    }

    onSubmit({
      rating,
      review: review.trim() || null,
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
              POST-MAINTENANCE
            </span>

            <h2>
              Rate and review service
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
            <label>
              Rating
            </label>

            <div
              style={{
                display: "flex",
                gap: "6px",
                marginTop: "8px",
              }}
            >
              {[1, 2, 3, 4, 5].map(
                (value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setRating(value)
                    }
                    disabled={loading}
                    aria-label={`${value} stars`}
                    style={{
                      border: "none",
                      background: "transparent",
                      color:
                        value <= rating
                          ? "currentColor"
                          : "#cbd5e1",
                      cursor: loading
                        ? "default"
                        : "pointer",
                      padding: "3px",
                    }}
                  >
                    <Star
                      size={28}
                      fill={
                        value <= rating
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                )
              )}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="review">
              Review
            </label>

            <textarea
              id="review"
              rows="5"
              value={review}
              onChange={(event) =>
                setReview(event.target.value)
              }
              placeholder="How was the service?"
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
                : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}