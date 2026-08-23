import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";

import api from "../services/api";

export default function BookmarkButton({
  providerId,
}) {
  const [bookmarked, setBookmarked] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    const loadBookmarks = async () => {
      try {
        const response = await api.get(
          "/bookmarks"
        );

        const bookmarks =
          response.data?.data || [];

        if (cancelled) {
          return;
        }

        setBookmarked(
          bookmarks.some(
            (bookmark) =>
              Number(
                bookmark.service_provider_id
              ) === Number(providerId)
          )
        );
      } catch {
        // Do not block the page if bookmark
        // state cannot be loaded.
      }
    };

    if (providerId) {
      loadBookmarks();
    }

    return () => {
      cancelled = true;
    };
  }, [providerId]);

  const toggleBookmark = async () => {
    try {
      setLoading(true);
      setError("");

      if (bookmarked) {
        await api.delete(
          `/providers/${providerId}/bookmark`
        );

        setBookmarked(false);
      } else {
        await api.post(
          `/providers/${providerId}/bookmark`
        );

        setBookmarked(true);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update bookmark."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        className="secondary-button"
        onClick={toggleBookmark}
        disabled={loading}
        title={
          bookmarked
            ? "Remove bookmark"
            : "Bookmark provider"
        }
      >
        <Bookmark
          size={16}
          fill={
            bookmarked
              ? "currentColor"
              : "none"
          }
        />

        {bookmarked
          ? "Bookmarked"
          : "Bookmark"}
      </button>

      {error && (
        <small className="form-error">
          {error}
        </small>
      )}
    </div>
  );
}