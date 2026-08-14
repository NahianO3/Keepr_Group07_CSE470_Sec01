export default function StatCard({
  icon,
  label,
  value,
  description,
  variant = "primary",
}) {
  return (
    <div className="stat-card">
      <div
        className={`stat-icon stat-${variant}`}
      >
        {icon}
      </div>

      <div className="stat-content">
        <span>{label}</span>

        <strong>{value}</strong>

        {description && (
          <small>{description}</small>
        )}
      </div>
    </div>
  );
}