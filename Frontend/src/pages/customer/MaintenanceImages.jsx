import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Image as ImageIcon,
  Upload,
} from "lucide-react";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import BeforeAfterUpload from "../../components/BeforeAfterUpload";

export default function MaintenanceImages() {
  const [records, setRecords] =
    useState([]);

  const [images, setImages] =
    useState({});

  const [selectedRecord, setSelectedRecord] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/maintenance-records"
        );

      const completed =
        (
          response.data?.data || []
        ).filter(
          (record) =>
            record.status ===
            "Completed"
        );

      setRecords(completed);

      const imageEntries =
        await Promise.all(
          completed.map(
            async (record) => {
              try {
                const imageResponse =
                  await api.get(
                    `/maintenance-records/${record.id}/images`
                  );

                return [
                  record.id,
                  imageResponse.data?.data ||
                    null,
                ];
              } catch {
                return [
                  record.id,
                  null,
                ];
              }
            }
          )
        );

      setImages(
        Object.fromEntries(
          imageEntries
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load maintenance records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const uploadImages = async (
    formData
  ) => {
    if (!selectedRecord) {
      return;
    }

    try {
      setUploading(true);
      setError("");

      const response =
        await api.post(
          `/maintenance-records/${selectedRecord.id}/images`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      setImages(
        (current) => ({
          ...current,
          [selectedRecord.id]:
            response.data?.data ||
            null,
        })
      );

      setSelectedRecord(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to upload maintenance images."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              MAINTENANCE COMPARISON
            </span>

            <h1>
              Before & after
            </h1>

            <p>
              Upload images from completed
              maintenance and compare the
              visual change automatically.
            </p>
          </div>
        </header>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="dashboard-loading">
            Loading completed maintenance...
          </div>
        ) : records.length === 0 ? (
          <div className="empty-card">
            <ImageIcon size={30} />

            <h3>
              No completed maintenance
            </h3>

            <p>
              Before-and-after images can
              be uploaded after a maintenance
              service is completed.
            </p>
          </div>
        ) : (
          <section className="maintenance-record-list">
            {records.map((record) => {
              const comparison =
                images[record.id];

              return (
                <article
                  className="maintenance-record-card"
                  key={record.id}
                >
                  <div className="maintenance-record-icon">
                    <CheckCircle2
                      size={21}
                    />
                  </div>

                  <div className="maintenance-record-content">
                    <div className="maintenance-record-top">
                      <div>
                        <span className="maintenance-type-badge maintenance-type-mechanic">
                          COMPLETED
                        </span>

                        <h2>
                          Maintenance #
                          {record.id}
                        </h2>
                      </div>

                      <span className="status-badge status-completed">
                        Completed
                      </span>
                    </div>

                    <p className="maintenance-record-work">
                      {record.work_performed ||
                        "Completed maintenance"}
                    </p>

                    {comparison ? (
                      <>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(2, minmax(0, 1fr))",
                            gap: "14px",
                            marginTop: "18px",
                          }}
                        >
                          <ComparisonImage
                            title="Before"
                            src={
                              comparison.before_image
                            }
                          />

                          <ComparisonImage
                            title="After"
                            src={
                              comparison.after_image
                            }
                          />
                        </div>

                        <div
                          style={{
                            marginTop: "18px",
                            padding: "16px",
                            border:
                              "1px solid var(--border)",
                            borderRadius: "14px",
                            background:
                              "var(--white)",
                          }}
                        >
                          <span
                            style={{
                              display:
                                "block",
                              fontSize:
                                "11px",
                              fontWeight:
                                800,
                              letterSpacing:
                                "0.06em",
                              textTransform:
                                "uppercase",
                              color:
                                "var(--text-muted)",
                              marginBottom:
                                "5px",
                            }}
                          >
                            Visual improvement score
                          </span>

                          <strong
                            style={{
                              fontSize:
                                "28px",
                            }}
                          >
                            {comparison.improvement_score !==
                            null &&
                            comparison.improvement_score !==
                            undefined
                              ? `${Number(
                                  comparison.improvement_score
                                ).toFixed(2)}%`
                              : "Unavailable"}
                          </strong>

                          <p
                            style={{
                              margin:
                                "6px 0 0",
                              fontSize:
                                "12px",
                              color:
                                "var(--text-secondary)",
                            }}
                          >
                            Score represents the
                            amount of visual change
                            detected between the two
                            uploaded images.
                          </p>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="dashboard-primary-button"
                        style={{
                          marginTop: "18px",
                        }}
                        onClick={() =>
                          setSelectedRecord(
                            record
                          )
                        }
                      >
                        <Upload size={16} />
                        Upload before & after
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {selectedRecord && (
          <BeforeAfterUpload
            onSubmit={uploadImages}
            onClose={() =>
              setSelectedRecord(null)
            }
            loading={uploading}
          />
        )}
      </main>
    </div>
  );
}

function ComparisonImage({
  title,
  src,
}) {
  return (
    <div
      style={{
        border:
          "1px solid var(--border)",
        borderRadius: "14px",
        overflow: "hidden",
        background:
          "var(--white)",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color:
            "var(--text-muted)",
        }}
      >
        {title}
      </div>

      {src ? (
        <img
          src={src}
          alt={`${title} maintenance`}
          style={{
            display: "block",
            width: "100%",
            height: "240px",
            objectFit: "contain",
            background:
              "#f8fafc",
          }}
        />
      ) : (
        <div
          style={{
            height: "240px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color:
              "var(--text-muted)",
            fontSize: "12px",
          }}
        >
          Image unavailable
        </div>
      )}
    </div>
  );
}