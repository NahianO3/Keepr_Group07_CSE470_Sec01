export default function StatusBadge({
  status,
  className = "",
}) {
  const normalized = String(
    status || "Unknown"
  )
    .toLowerCase()
    .replace(/\s+/g, "-");

  return (
    <span
      className={`status-badge status-${normalized} ${className}`}
    >
      {status || "Unknown"}
    </span>
  );
}