export default function LoadingState({
  message = "Loading...",
}) {
  return (
    <div className="dashboard-loading">
      {message}
    </div>
  );
}