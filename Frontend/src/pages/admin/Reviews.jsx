import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  Search,
  Star,
} from "lucide-react";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";


export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/admin/reviews"
      );

      setReviews(
        response.data?.data || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load reviews."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return reviews;
    }

    return reviews.filter((review) =>
      [
        review.customer_name,
        review.service_provider_name,
        review.review,
        review.rating,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [reviews, search]);

  const updateReviewStatus = async (
    review,
    moderationStatus
  ) => {
    try {
      setUpdatingId(review.id);
      setError("");

      await api.put(
        `/admin/reviews/${review.id}/status`,
        {
          moderation_status:
            moderationStatus,
        }
      );

      await loadReviews();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update review."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              ADMINISTRATION
            </span>

            <h1>
              Review Moderation
            </h1>

            <p>
              Review and manage customer
              feedback on service providers.
            </p>
          </div>
        </header>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <section className="admin-toolbar">
          <div className="search-box">
            <Search size={17} />

            <input
              type="search"
              placeholder="Search reviews..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>
        </section>

        {loading ? (
          <div className="dashboard-loading">
            Loading reviews...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="empty-card">
            <Star size={30} />

            <h3>
              No reviews found
            </h3>

            <p>
              There are currently no reviews
              matching your search.
            </p>
          </div>
        ) : (
          <div className="admin-approval-grid">
            {filteredReviews.map(
              (review) => (
                <article
                  className="admin-approval-item"
                  key={review.id}
                >
                  <div className="admin-approval-info">
                    <h2>
                      {review.service_provider_name}
                    </h2>

                    <p>
                      Customer:{" "}
                      {review.customer_name}
                    </p>

                    <p>
                      Rating:{" "}
                      {review.rating} / 5
                    </p>

                    {review.review && (
                      <p>
                        {review.review}
                      </p>
                    )}

                    <span>
                      Status:{" "}
                      {review.moderation_status}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="admin-action-button"
                    onClick={() =>
                      updateReviewStatus(
                        review,
                        review.moderation_status ===
                          "visible"
                          ? "hidden"
                          : "visible"
                      )
                    }
                    disabled={
                      updatingId === review.id
                    }
                  >
                    {review.moderation_status ===
                    "visible" ? (
                      <>
                        <EyeOff size={15} />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye size={15} />
                        Restore
                      </>
                    )}
                  </button>
                </article>
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}