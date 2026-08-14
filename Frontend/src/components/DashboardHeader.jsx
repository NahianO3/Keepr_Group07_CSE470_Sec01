export default function DashboardHeader({
  eyebrow,
  title,
  description,
  action,
}) {
  return (
    <header className="dashboard-header">
      <div>
        {eyebrow && (
          <span className="eyebrow">
            {eyebrow}
          </span>
        )}

        <h1>{title}</h1>

        {description && (
          <p>{description}</p>
        )}
      </div>

      {action && (
        <div className="dashboard-header-action">
          {action}
        </div>
      )}
    </header>
  );
}